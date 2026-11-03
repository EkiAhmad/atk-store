const prisma = require('../config/prisma');
const { logTransaction } = require('../utils/logger');

function validationError(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

/**
 * Generate unique sequential invoice number: INV-YYYYMMDD-XXXX
 */
async function generateInvoiceNumber(tx) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePrefix = `INV-${year}${month}${day}`;

  const latestTx = await tx.transaction.findFirst({
    where: {
      invoiceNumber: {
        startsWith: datePrefix,
      },
    },
    orderBy: { id: 'desc' },
    select: { invoiceNumber: true },
  });

  let nextSeq = 1;
  if (latestTx && latestTx.invoiceNumber) {
    const parts = latestTx.invoiceNumber.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextSeq = lastNum + 1;
    }
  }

  return `${datePrefix}-${String(nextSeq).padStart(4, '0')}`;
}

// Process POS Checkout
async function createTransaction(req, res, next) {
  try {
    const {
      items,
      paymentMethod = 'CASH',
      amountPaid,
      discountAmount = 0,
      taxAmount = 0,
      cashierName = 'Kasir Toko ATK',
      notes = '',
    } = req.body;

    // T-01: Nama kasir diprioritaskan dari akun terotentikasi (req.user.name)
    const effectiveCashier = req.user?.name || cashierName.trim() || 'Kasir Toko ATK';

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw validationError('Keranjang belanja kosong.');
    }

    let transactionResult;

    // T-07: Retry loop apabila terjadi benturan nomor faktur unik pada transaksi konkuren
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        transactionResult = await prisma.$transaction(async (tx) => {
          // 1. Fetch current product records from DB
          const productIds = items.map((i) => parseInt(i.productId, 10)).filter((id) => !isNaN(id));
          const products = await tx.product.findMany({
            where: { id: { in: productIds } },
          });

          const productMap = new Map();
          products.forEach((p) => productMap.set(p.id, p));

          let totalAmount = 0;
          const transactionItemsData = [];
          const stockMovements = [];

          for (const item of items) {
            const prodId = parseInt(item.productId, 10);
            const qty = parseInt(item.quantity, 10);

            if (!qty || qty <= 0) {
              throw validationError(`Kuantitas untuk produk "${item.productName || 'item'}" tidak valid.`);
            }

            const product = productMap.get(prodId);
            if (!product) {
              throw validationError(`Produk dengan ID ${prodId} tidak ditemukan di database.`);
            }

            // T-07: Harga jual dan harga modal diambil langsung dari database (bukan input client)
            const price = parseFloat(product.sellPrice);
            const costPrice = parseFloat(product.buyPrice);
            const subtotal = price * qty;

            totalAmount += subtotal;

            transactionItemsData.push({
              productId: product.id,
              productName: product.name,
              barcode: product.barcode,
              price,
              costPrice,
              quantity: qty,
              subtotal,
            });

            // T-07: Pengurangan stok secara atomik dengan syarat stok mencukupi
            const updateRes = await tx.product.updateMany({
              where: {
                id: prodId,
                stock: { gte: qty },
              },
              data: {
                stock: { decrement: qty },
              },
            });

            if (updateRes.count === 0) {
              throw validationError(
                `Stok untuk "${product.name}" tidak mencukupi atau telah berubah. Sisa stok: ${product.stock} ${product.unit}, permintaan: ${qty} ${product.unit}.`
              );
            }

            stockMovements.push({
              productId: product.id,
              type: 'OUT_SALE',
              quantity: -qty,
            });
          }

          const discount = Math.max(0, parseFloat(discountAmount) || 0);
          const tax = Math.max(0, parseFloat(taxAmount) || 0);
          const finalAmount = Math.max(0, totalAmount - discount + tax);

          // T-05: Validasi pembayaran tunai vs non-tunai
          const paid = paymentMethod === 'CASH'
            ? (parseFloat(amountPaid) || 0)
            : finalAmount;

          if (paymentMethod === 'CASH' && paid < finalAmount) {
            throw validationError(
              `Nominal pembayaran (Rp ${paid.toLocaleString('id-ID')}) kurang dari total tagihan (Rp ${finalAmount.toLocaleString('id-ID')}).`
            );
          }

          const changeAmount = paymentMethod === 'CASH' ? Math.max(0, paid - finalAmount) : 0;
          const invoiceNumber = await generateInvoiceNumber(tx);

          // 2. Simpan transaksi
          const createdTx = await tx.transaction.create({
            data: {
              invoiceNumber,
              date: new Date(),
              totalAmount,
              discountAmount: discount,
              taxAmount: tax,
              finalAmount,
              paymentMethod,
              amountPaid: paid,
              changeAmount,
              cashierName: effectiveCashier,
              notes: notes ? notes.trim() : null,
              items: {
                create: transactionItemsData,
              },
            },
            include: {
              items: true,
            },
          });

          // 3. Catat riwayat pergerakan stok
          for (const move of stockMovements) {
            await tx.stockMovement.create({
              data: {
                ...move,
                notes: `Penjualan kasir [${invoiceNumber}]`,
              },
            });
          }

          return createdTx;
        });

        break; // Transaksi sukses, keluar dari retry loop
      } catch (txError) {
        // Retry jika ada bentrokan invoiceNumber unik
        if (txError.code === 'P2002' && attempt < 3) {
          continue;
        }
        throw txError;
      }
    }

    // Record non-SQL file log
    logTransaction(transactionResult);

    // Fetch store settings for receipt
    const storeSetting = await prisma.storeSetting.findUnique({ where: { id: 1 } });

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil diproses.',
      data: {
        ...transactionResult,
        store: storeSetting || {
          name: 'TOKO ATK BAROKAH',
          address: 'Jl. KH. Dewantoro No. 1 Rejoso - Nganjuk',
          phone: '081259878173',
          receiptFooter: 'Terima kasih telah berbelanja di TOKO ATK BAROKAH!\nBarang yang sudah dibeli tidak dapat ditukar/dikembalikan.',
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// Get Transactions list with filters & pagination
async function getTransactions(req, res, next) {
  try {
    const { startDate, endDate, paymentMethod, q, page, limit } = req.query;

    const where = {};

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (q) {
      where.invoiceNumber = { contains: q.trim() };
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.date.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const currentPage = parseInt(page, 10) || 1;
    const currentLimit = parseInt(limit, 10) || 20;
    const skip = (currentPage - 1) * currentLimit;

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: {
          items: true,
        },
        skip,
        take: currentLimit,
        orderBy: { date: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(total / currentLimit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Get Single Transaction by ID
async function getTransactionById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    }

    const store = await prisma.storeSetting.findUnique({ where: { id: 1 } });

    res.json({
      success: true,
      data: {
        ...transaction,
        store: store || {
          name: 'TOKO ATK BAROKAH',
          address: 'Jl. KH. Dewantoro No. 1 Rejoso - Nganjuk',
          phone: '081259878173',
          receiptFooter: 'Terima kasih telah berbelanja di TOKO ATK BAROKAH!\nBarang yang sudah dibeli tidak dapat ditukar/dikembalikan.',
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
};
