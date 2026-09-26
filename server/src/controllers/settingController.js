const prisma = require('../config/prisma');

// Get Store Settings
async function getSettings(req, res, next) {
  try {
    let settings = await prisma.storeSetting.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.storeSetting.create({
        data: {
          id: 1,
          name: 'Toko ATK Berkah Mandiri',
          address: 'Jl. Pendidikan No. 123, Jakarta',
          phone: '0812-3456-7890',
          receiptFooter: 'Terima kasih telah berbelanja di Toko ATK Berkah Mandiri!\nBarang yang sudah dibeli tidak dapat ditukar/dikembalikan.',
        },
      });
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (err) {
    next(err);
  }
}

// Update Store Settings
async function updateSettings(req, res, next) {
  try {
    const { name, address, phone, receiptFooter } = req.body;

    const updated = await prisma.storeSetting.upsert({
      where: { id: 1 },
      update: {
        name: name ? name.trim() : 'Toko ATK Berkah Mandiri',
        address: address ? address.trim() : '',
        phone: phone ? phone.trim() : '',
        receiptFooter: receiptFooter ? receiptFooter.trim() : '',
      },
      create: {
        id: 1,
        name: name ? name.trim() : 'Toko ATK Berkah Mandiri',
        address: address ? address.trim() : '',
        phone: phone ? phone.trim() : '',
        receiptFooter: receiptFooter ? receiptFooter.trim() : '',
      },
    });

    res.json({
      success: true,
      message: 'Pengaturan profil toko berhasil disimpan.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSettings,
  updateSettings,
};
