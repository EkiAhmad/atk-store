const prisma = require('../config/prisma');
const XLSX = require('xlsx');
const {
  generateTemplateWorkbook,
  parseUploadedFile,
  generateProductExportWorkbook,
} = require('../utils/excelHelper');

// Get products with search, filters, pagination
async function getProducts(req, res, next) {
  try {
    const { q, barcode, categoryId, lowStock, isActive, page, limit, all } = req.query;

    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    } else {
      where.isActive = true;
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId, 10);
    }

    if (barcode) {
      where.barcode = barcode.trim();
    }

    if (q) {
      const keyword = q.trim();
      where.OR = [
        { name: { contains: keyword } },
        { barcode: { contains: keyword } },
      ];
    }

    // Low stock filter
    if (lowStock === 'true') {
      // Prisma raw or filtered in query
      const allProducts = await prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { name: 'asc' },
      });

      const filtered = allProducts.filter((p) => p.stock <= p.minStock);

      return res.json({
        success: true,
        data: filtered,
        pagination: {
          total: filtered.length,
          page: 1,
          limit: filtered.length,
          totalPages: 1,
        },
      });
    }

    // Full list without pagination (for POS catalogue)
    if (all === 'true') {
      const products = await prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { name: 'asc' },
      });

      return res.json({
        success: true,
        data: products,
      });
    }

    const currentPage = parseInt(page, 10) || 1;
    const currentLimit = parseInt(limit, 10) || 20;
    const skip = (currentPage - 1) * currentLimit;

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: { category: true },
        skip,
        take: currentLimit,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: products,
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

// Get product by ID
async function getProductById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        stockLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

// Get product by Barcode (instant lookup for POS manual input)
async function getProductByBarcode(req, res, next) {
  try {
    const { barcode } = req.params;
    const product = await prisma.product.findUnique({
      where: { barcode: barcode.trim() },
      include: { category: true },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Produk dengan barcode ini tidak ditemukan.' });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

// Create single product
async function createProduct(req, res, next) {
  try {
    const { barcode, name, categoryId, buyPrice, sellPrice, stock, minStock, unit } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama produk wajib diisi.' });
    }

    const cleanBarcode = barcode && barcode.trim() ? barcode.trim() : null;

    // Check duplicate barcode if provided
    if (cleanBarcode) {
      const existing = await prisma.product.findUnique({ where: { barcode: cleanBarcode } });
      if (existing) {
        return res.status(400).json({ success: false, message: `Barcode ${cleanBarcode} sudah digunakan oleh produk lain.` });
      }
    }

    const initialStock = parseInt(stock, 10) || 0;

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          barcode: cleanBarcode,
          name: name.trim(),
          categoryId: categoryId ? parseInt(categoryId, 10) : null,
          buyPrice: parseFloat(buyPrice) || 0,
          sellPrice: parseFloat(sellPrice) || 0,
          stock: initialStock,
          minStock: parseInt(minStock, 10) >= 0 ? parseInt(minStock, 10) : 5,
          unit: unit ? unit.trim() : 'pcs',
        },
      });

      if (initialStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: created.id,
            type: 'IN_PURCHASE',
            quantity: initialStock,
            notes: 'Stok awal produk baru',
          },
        });
      }

      return created;
    });

    res.status(201).json({
      success: true,
      message: 'Produk berhasil ditambahkan.',
      data: product,
    });
  } catch (err) {
    next(err);
  }
}

// Update single product
async function updateProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { barcode, name, categoryId, buyPrice, sellPrice, minStock, unit, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama produk wajib diisi.' });
    }

    const cleanBarcode = barcode && barcode.trim() ? barcode.trim() : null;

    if (cleanBarcode) {
      const existing = await prisma.product.findFirst({
        where: {
          barcode: cleanBarcode,
          NOT: { id },
        },
      });
      if (existing) {
        return res.status(400).json({ success: false, message: `Barcode ${cleanBarcode} sudah digunakan oleh produk ${existing.name}.` });
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        barcode: cleanBarcode,
        name: name.trim(),
        categoryId: categoryId ? parseInt(categoryId, 10) : null,
        buyPrice: parseFloat(buyPrice) || 0,
        sellPrice: parseFloat(sellPrice) || 0,
        minStock: parseInt(minStock, 10) >= 0 ? parseInt(minStock, 10) : 5,
        unit: unit ? unit.trim() : 'pcs',
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
      include: { category: true },
    });

    res.json({
      success: true,
      message: 'Produk berhasil diperbarui.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

// Quick Restock / Adjust Stock
async function adjustStock(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { quantity, type, notes } = req.body;

    const qty = parseInt(quantity, 10);
    if (!qty || isNaN(qty)) {
      return res.status(400).json({ success: false, message: 'Jumlah perubahan stok tidak valid.' });
    }

    const validTypes = ['IN_PURCHASE', 'IN_IMPORT', 'OUT_SALE', 'ADJUSTMENT'];
    const movementType = validTypes.includes(type) ? type : 'ADJUSTMENT';

    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.product.findUnique({ where: { id } });
      if (!current) {
        throw new Error('Produk tidak ditemukan.');
      }

      const newStock = current.stock + qty;
      if (newStock < 0) {
        throw new Error(`Stok tidak mencukupi. Stok saat ini: ${current.stock}, perubahan: ${qty}`);
      }

      const updated = await tx.product.update({
        where: { id },
        data: { stock: newStock },
      });

      await tx.stockMovement.create({
        data: {
          productId: id,
          type: movementType,
          quantity: qty,
          notes: notes || (qty > 0 ? 'Penambahan stok manual' : 'Pengurangan stok manual'),
        },
      });

      return updated;
    });

    res.json({
      success: true,
      message: `Stok produk ${result.name} berhasil disesuaikan menjadi ${result.stock} ${result.unit}.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

// Delete product
async function deleteProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.product.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Produk berhasil dihapus dari sistem.',
    });
  } catch (err) {
    next(err);
  }
}

// Download Excel Template
async function downloadTemplate(req, res, next) {
  try {
    const wb = generateTemplateWorkbook();
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="Template_Import_ATK.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

// Download CSV Template
async function downloadCsvTemplate(req, res, next) {
  try {
    const wb = generateTemplateWorkbook();
    const csvContent = XLSX.utils.sheet_to_csv(wb.Sheets['Template Produk ATK']);

    res.setHeader('Content-Disposition', 'attachment; filename="Template_Import_ATK.csv"');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
}

// Import Products from Excel/CSV
async function importProducts(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Harap lampirkan file Excel (.xlsx, .xls) atau CSV (.csv).' });
    }

    const { items, errors, totalRowsProcessed } = parseUploadedFile(req.file.buffer);

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada data valid yang dapat diproses.',
        errors,
      });
    }

    // Process items in transactional batches
    let createdCount = 0;
    let restockedCount = 0;
    const processErrors = [...errors];

    await prisma.$transaction(async (tx) => {
      // Pre-fetch categories
      const existingCats = await tx.category.findMany();
      const catMap = new Map();
      existingCats.forEach((c) => catMap.set(c.name.toLowerCase(), c.id));

      for (const item of items) {
        try {
          // Check category
          const catKey = item.categoryName.toLowerCase();
          let categoryId = catMap.get(catKey);

          if (!categoryId) {
            const newCat = await tx.category.create({
              data: { name: item.categoryName },
            });
            categoryId = newCat.id;
            catMap.set(catKey, categoryId);
          }

          // Check existing product by barcode or exact name
          let existingProduct = null;
          if (item.barcode) {
            existingProduct = await tx.product.findUnique({ where: { barcode: item.barcode } });
          }
          if (!existingProduct) {
            existingProduct = await tx.product.findFirst({
              where: { name: item.name },
            });
          }

          if (existingProduct) {
            // Restock & Update Price
            const updatedStock = existingProduct.stock + item.stock;
            await tx.product.update({
              where: { id: existingProduct.id },
              data: {
                categoryId: categoryId || existingProduct.categoryId,
                buyPrice: item.buyPrice > 0 ? item.buyPrice : existingProduct.buyPrice,
                sellPrice: item.sellPrice > 0 ? item.sellPrice : existingProduct.sellPrice,
                stock: updatedStock,
                minStock: item.minStock,
                unit: item.unit || existingProduct.unit,
                ...(item.barcode && !existingProduct.barcode && { barcode: item.barcode }),
              },
            });

            if (item.stock > 0) {
              await tx.stockMovement.create({
                data: {
                  productId: existingProduct.id,
                  type: 'IN_IMPORT',
                  quantity: item.stock,
                  notes: `Restock via import file (Baris ${item.rowNum})`,
                },
              });
            }

            restockedCount++;
          } else {
            // Create New Product
            const newProd = await tx.product.create({
              data: {
                barcode: item.barcode,
                name: item.name,
                categoryId,
                buyPrice: item.buyPrice,
                sellPrice: item.sellPrice,
                stock: item.stock,
                minStock: item.minStock,
                unit: item.unit,
              },
            });

            if (item.stock > 0) {
              await tx.stockMovement.create({
                data: {
                  productId: newProd.id,
                  type: 'IN_IMPORT',
                  quantity: item.stock,
                  notes: `Stok awal via import file (Baris ${item.rowNum})`,
                },
              });
            }

            createdCount++;
          }
        } catch (itemErr) {
          processErrors.push(`Baris ${item.rowNum} (${item.name}): ${itemErr.message}`);
        }
      }
    });

    res.json({
      success: true,
      message: `Import selesai. ${createdCount} produk baru dibuat, ${restockedCount} produk berhasil di-restock/diperbarui.`,
      summary: {
        totalRowsProcessed,
        validRows: items.length,
        createdCount,
        restockedCount,
        errorsCount: processErrors.length,
        errors: processErrors,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Export Inventory to Excel or CSV
async function exportProducts(req, res, next) {
  try {
    const { format = 'xlsx', categoryId } = req.query;

    const where = { isActive: true };
    if (categoryId) {
      where.categoryId = parseInt(categoryId, 10);
    }

    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    const wb = generateProductExportWorkbook(products);

    const timestamp = new Date().toISOString().slice(0, 10);

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(wb.Sheets['Inventaris Produk ATK']);
      res.setHeader('Content-Disposition', `attachment; filename="Inventaris_ATK_${timestamp}.csv"`);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      return res.send(csv);
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename="Inventaris_ATK_${timestamp}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProducts,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct,
  downloadTemplate,
  downloadCsvTemplate,
  importProducts,
  exportProducts,
};
