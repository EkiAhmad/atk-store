const prisma = require('../config/prisma');

/**
 * Generate unique sequential invoice number: INV-YYYYMMDD-XXXX
 */
async function generateInvoiceNumber(tx) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePrefix = `INV-${year}${month}${day}`;

  const countToday = await tx.transaction.count({
    where: {
      invoiceNumber: {
        startsWith: datePrefix,
      },
    },
  });

  const nextSeq = String(countToday + 1).padStart(4, '0');
  return `${datePrefix}-${nextSeq}`;
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
      cashierName = 'Kasir Toko',
      notes = '',
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Keranjang belanja kosong.' });
    }

    // Execute within Prisma interactive transaction to ensure atomicity and race-condition safety
    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Fetch current product records and verify stock
      const productIds = items.map((i) => parseInt(i.productId, 10)).filter((id) => !isNaN(id));
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map();
      products.forEach((p) => productMap.set(p.id, p));

      let totalAmount = 0;
      const transactionItemsData = [];
      const stockUpdates = [];
      const stockMovements = [];

      for (const item of items) {
        const prodId = parseInt(item.productId, 10);
        const qty = parseInt(item.quantity, 10);

        if (!qty || qty <= 0) {
          throw new Error(`Kuantitas untuk produk ${item.productName || 'item'} tidak valid.`);
        }

        const product = productMap.get(prodId);
        if (!product) {
          throw new Error(`Produk dengan ID ${prodId} tidak ditemukan di database.`);
        }

        if (product.stock < qty) {
          throw new Error(
            `Stok untuk "${product.name}" tidak mencukupi. Sisa stok: ${product.stock} ${product.unit}, permintaan: ${qty} ${product.unit}.`
          );
        }

        const price = parseFloat(item.price !== undefined ? item.price : product.sellPrice);
        const costPrice = parseFloat(item.costPrice !== undefined ? item.costPrice : product.buyPrice);
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

        stockUpdates.push({
          id: product.id,
          newStock: product.stock - qty,
        });

        stockMovements.push({
          productId: product.id,
          type: 'OUT_SALE',
          quantity: -qty,
          notes: `Penjualan kasir`,
        });
      }

      const discount = Math.max(0, parseFloat(discountAmount) || 0);
      const tax = Math.max(0, parseFloat(taxAmount) || 0);
      const finalAmount = Math.max(0, totalAmount - discount + tax);

      const paid = parseFloat(amountPaid) || finalAmount;

      if (paymentMethod === 'CASH' && paid < finalAmount) {
        throw new Error(`Nominal pembayaran (Rp ${paid.toLocaleString('id-ID')}) kurang dari total tagihan (Rp ${finalAmount.toLocaleString('id-ID')}).`);
      }

      const changeAmount = paymentMethod === 'CASH' ? Math.max(0, paid - finalAmount) : 0;
      const invoiceNumber = await generateInvoiceNumber(tx);

      // 2. Create Transaction record
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
          cashierName: cashierName.trim(),
          notes: notes ? notes.trim() : null,
          items: {
            create: transactionItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // 3. Update stock and insert stock log movements
      for (const update of stockUpdates) {
        await tx.product.update({
          where: { id: update.id },
          data: { stock: update.newStock },
        });
      }

      for (const move of stockMovements) {
        await tx.stockMovement.create({
          data: {
            ...move,
            notes: `${move.notes} [${invoiceNumber}]`,
          },
        });
      }

      return createdTx;
    });

    // Fetch store settings for receipt
    const storeSetting = await prisma.storeSetting.findUnique({ where: { id: 1 } });

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil diproses.',
      data: {
        ...transactionResult,
        store: storeSetting || {
          name: 'Toko ATK Berkah Mandiri',
          address: 'Jl. Pendidikan No. 123',
          phone: '0812-3456-7890',
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
          name: 'Toko ATK Berkah Mandiri',
          address: 'Jl. Pendidikan No. 123',
          phone: '0812-3456-7890',
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
