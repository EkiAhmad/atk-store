const prisma = require('../config/prisma');

// Get Store Settings
async function getSettings(req, res, next) {
  try {
    let settings = await prisma.storeSetting.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.storeSetting.create({
        data: {
          id: 1,
          name: 'TOKO ATK BAROKAH',
          address: 'Jl. KH. Dewantoro No. 1 Rejoso - Nganjuk',
          phone: '081259878173',
          receiptFooter: 'Terima kasih telah berbelanja di TOKO ATK BAROKAH!\nBarang yang sudah dibeli tidak dapat ditukar/dikembalikan.',
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
        name: name ? name.trim() : 'TOKO ATK BAROKAH',
        address: address ? address.trim() : 'Jl. KH. Dewantoro No. 1 Rejoso - Nganjuk',
        phone: phone ? phone.trim() : '081259878173',
        receiptFooter: receiptFooter ? receiptFooter.trim() : '',
      },
      create: {
        id: 1,
        name: name ? name.trim() : 'TOKO ATK BAROKAH',
        address: address ? address.trim() : 'Jl. KH. Dewantoro No. 1 Rejoso - Nganjuk',
        phone: phone ? phone.trim() : '081259878173',
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
