const prisma = require('../config/prisma');

// Get all categories with product count
async function getCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
}

// Create category
async function createCategory(req, res, next) {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi.' });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Kategori berhasil ditambahkan.',
      data: category,
    });
  } catch (err) {
    next(err);
  }
}

// Update category
async function updateCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi.' });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
      },
    });

    res.json({
      success: true,
      message: 'Kategori berhasil diperbarui.',
      data: category,
    });
  } catch (err) {
    next(err);
  }
}

// Delete category
async function deleteCategory(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);

    // Nullify products with this category
    await prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await prisma.category.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Kategori berhasil dihapus.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
