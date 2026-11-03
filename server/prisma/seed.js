const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ATK database with Users, Settings, and Products...');

  // 1. Users (Admin & Kasir)
  const passwordHash = await bcrypt.hash('kunci123', 10);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: passwordHash,
      name: 'Administrator Toko',
      role: 'ADMIN',
    },
    create: {
      username: 'admin',
      password: passwordHash,
      name: 'Administrator Toko',
      role: 'ADMIN',
    },
  });

  const kasirUser = await prisma.user.upsert({
    where: { username: 'kasir' },
    update: {
      password: passwordHash,
      name: 'Kasir Toko',
      role: 'KASIR',
    },
    create: {
      username: 'kasir',
      password: passwordHash,
      name: 'Kasir Toko',
      role: 'KASIR',
    },
  });

  console.log('Seeded Users:', {
    admin: adminUser.username,
    kasir: kasirUser.username,
  });

  // 2. Settings
  await prisma.storeSetting.upsert({
    where: { id: 1 },
    update: {
      name: 'TOKO ATK BAROKAH',
      address: 'Jl. KH. Dewantoro No. 1 Rejoso - Nganjuk',
      phone: '081259878173',
      receiptFooter: 'Terima kasih telah berbelanja di TOKO ATK BAROKAH!\nBarang yang sudah dibeli tidak dapat ditukar/dikembalikan.',
    },
    create: {
      id: 1,
      name: 'TOKO ATK BAROKAH',
      address: 'Jl. KH. Dewantoro No. 1 Rejoso - Nganjuk',
      phone: '081259878173',
      receiptFooter: 'Terima kasih telah berbelanja di TOKO ATK BAROKAH!\nBarang yang sudah dibeli tidak dapat ditukar/dikembalikan.',
    },
  });

  // 3. Categories
  const categoriesData = [
    { name: 'Alat Tulis', description: 'Pulpen, pensil, spidol, penghapus, tipe-x, rautan' },
    { name: 'Kertas & Buku', description: 'Buku tulis, kertas HVS, binder, folio, nota kontan' },
    { name: 'Map & Penyimpanan', description: 'Map snelhecter, ordner, clear holder, document bag' },
    { name: 'Peralatan Meja', description: 'Gunting, cutter, stapler, staples, lakban, lem kertas, paper clip' },
    { name: 'Pewarna & Menggambar', description: 'Crayon, pensil warna, cat air, buku gambar' },
    { name: 'Aksesoris & Lainnya', description: 'Kalkulator, baterai, amplop, sticky notes, ID card holder' },
  ];

  const categoryMap = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: cat,
    });
    categoryMap[cat.name] = created.id;
  }

  // 4. Products
  const productsData = [
    {
      barcode: '8993175537012',
      name: 'Pulpen Standard AE7 0.5 Hitam',
      category: 'Alat Tulis',
      buyPrice: 2000,
      sellPrice: 3000,
      stock: 120,
      minStock: 20,
      unit: 'pcs',
    },
    {
      barcode: '8993175537029',
      name: 'Pulpen Standard AE7 0.5 Biru',
      category: 'Alat Tulis',
      buyPrice: 2000,
      sellPrice: 3000,
      stock: 80,
      minStock: 20,
      unit: 'pcs',
    },
    {
      barcode: '8991389221015',
      name: 'Pensil 2B Faber-Castell',
      category: 'Alat Tulis',
      buyPrice: 3500,
      sellPrice: 5000,
      stock: 65,
      minStock: 15,
      unit: 'pcs',
    },
    {
      barcode: '8991389221039',
      name: 'Penghapus Faber-Castell Hitam Kecil',
      category: 'Alat Tulis',
      buyPrice: 2000,
      sellPrice: 3500,
      stock: 45,
      minStock: 10,
      unit: 'pcs',
    },
    {
      barcode: '8992753110221',
      name: 'Correction Tape Joyko CT-522',
      category: 'Alat Tulis',
      buyPrice: 4500,
      sellPrice: 7000,
      stock: 30,
      minStock: 8,
      unit: 'pcs',
    },
    {
      barcode: '8992753110542',
      name: 'Spidol Whiteboard Snowman Hitam',
      category: 'Alat Tulis',
      buyPrice: 6500,
      sellPrice: 9000,
      stock: 40,
      minStock: 10,
      unit: 'pcs',
    },
    {
      barcode: '8993988102018',
      name: 'Buku Tulis Sinar Dunia 38 Lembar (Pack isi 10)',
      category: 'Kertas & Buku',
      buyPrice: 32000,
      sellPrice: 40000,
      stock: 25,
      minStock: 5,
      unit: 'pack',
    },
    {
      barcode: '8993988102025',
      name: 'Buku Tulis Sinar Dunia 58 Lembar (Pack isi 10)',
      category: 'Kertas & Buku',
      buyPrice: 45000,
      sellPrice: 55000,
      stock: 18,
      minStock: 5,
      unit: 'pack',
    },
    {
      barcode: '8998866100120',
      name: 'Kertas HVS PaperOne A4 70gr (1 Rim)',
      category: 'Kertas & Buku',
      buyPrice: 45000,
      sellPrice: 53000,
      stock: 35,
      minStock: 10,
      unit: 'rim',
    },
    {
      barcode: '8998866100137',
      name: 'Kertas HVS PaperOne F4/Folio 70gr (1 Rim)',
      category: 'Kertas & Buku',
      buyPrice: 49000,
      sellPrice: 58000,
      stock: 28,
      minStock: 10,
      unit: 'rim',
    },
    {
      barcode: '8997022101011',
      name: 'Map Snelhecter Plastik Joyko Biru',
      category: 'Map & Penyimpanan',
      buyPrice: 2500,
      sellPrice: 4000,
      stock: 50,
      minStock: 15,
      unit: 'pcs',
    },
    {
      barcode: '8997022101028',
      name: 'Map Snelhecter Kertas Folio (Lusin isi 12)',
      category: 'Map & Penyimpanan',
      buyPrice: 18000,
      sellPrice: 25000,
      stock: 15,
      minStock: 5,
      unit: 'lusin',
    },
    {
      barcode: '8992753220119',
      name: 'Stapler Joyko HD-10',
      category: 'Peralatan Meja',
      buyPrice: 11000,
      sellPrice: 16000,
      stock: 20,
      minStock: 5,
      unit: 'pcs',
    },
    {
      barcode: '8992753220126',
      name: 'Isi Staples Joyko No. 10',
      category: 'Peralatan Meja',
      buyPrice: 2000,
      sellPrice: 3500,
      stock: 60,
      minStock: 15,
      unit: 'box',
    },
    {
      barcode: '8992753330101',
      name: 'Gunting Joyko SC-838',
      category: 'Peralatan Meja',
      buyPrice: 6000,
      sellPrice: 9000,
      stock: 25,
      minStock: 5,
      unit: 'pcs',
    },
    {
      barcode: '8992753330200',
      name: 'Cutter Joyko L-500 Besar',
      category: 'Peralatan Meja',
      buyPrice: 12000,
      sellPrice: 17500,
      stock: 14,
      minStock: 5,
      unit: 'pcs',
    },
    {
      barcode: '8992753440150',
      name: 'Lakban Bening Daimaru 2 Inch',
      category: 'Peralatan Meja',
      buyPrice: 10500,
      sellPrice: 15000,
      stock: 30,
      minStock: 8,
      unit: 'roll',
    },
    {
      barcode: '8991389330114',
      name: 'Pensil Warna Faber-Castell Classic 12 Warna',
      category: 'Pewarna & Menggambar',
      buyPrice: 28000,
      sellPrice: 36000,
      stock: 16,
      minStock: 4,
      unit: 'set',
    },
    {
      barcode: '8992753550118',
      name: 'Sticky Notes Joyko 3x3 Kuning',
      category: 'Aksesoris & Lainnya',
      buyPrice: 4500,
      sellPrice: 7000,
      stock: 4,
      minStock: 10,
      unit: 'pad',
    },
    {
      barcode: '8992753550224',
      name: 'Klip Kertas Binder Clip No. 107 (Kotak isi 12)',
      category: 'Aksesoris & Lainnya',
      buyPrice: 4000,
      sellPrice: 6500,
      stock: 3,
      minStock: 10,
      unit: 'box',
    },
  ];

  for (const prod of productsData) {
    const categoryId = categoryMap[prod.category];
    await prisma.product.upsert({
      where: { barcode: prod.barcode },
      update: {
        name: prod.name,
        categoryId,
        buyPrice: prod.buyPrice,
        sellPrice: prod.sellPrice,
        stock: prod.stock,
        minStock: prod.minStock,
        unit: prod.unit,
      },
      create: {
        barcode: prod.barcode,
        name: prod.name,
        categoryId,
        buyPrice: prod.buyPrice,
        sellPrice: prod.sellPrice,
        stock: prod.stock,
        minStock: prod.minStock,
        unit: prod.unit,
        stockLogs: {
          create: {
            type: 'IN_PURCHASE',
            quantity: prod.stock,
            notes: 'Stok awal inisialisasi sistem',
          },
        },
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
