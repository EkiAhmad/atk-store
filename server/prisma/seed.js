const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ATK database...');

  // 1. Settings
  await prisma.storeSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Toko ATK Maju Jaya',
      address: 'Jl. Pendidikan No. 123, Jakarta Timur',
      phone: '0812-3456-7890',
      receiptFooter: 'Terima kasih telah berbelanja di Toko ATK Maju Jaya!\nBarang yang sudah dibeli tidak dapat ditukar/dikembalikan.',
    },
  });

  // 2. Categories
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

  // 3. Products
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
      stock: 4, // Intentionally low to test low stock alerts
      minStock: 10,
      unit: 'pad',
    },
    {
      barcode: '8992753550224',
      name: 'Klip Kertas Binder Clip No. 107 (Kotak isi 12)',
      category: 'Aksesoris & Lainnya',
      buyPrice: 4000,
      sellPrice: 6500,
      stock: 3, // Intentionally low to test low stock alerts
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

  // 4. Sample Transactions to populate dashboard
  const sampleProduct1 = await prisma.product.findUnique({ where: { barcode: '8993175537012' } });
  const sampleProduct2 = await prisma.product.findUnique({ where: { barcode: '8998866100120' } });
  const sampleProduct3 = await prisma.product.findUnique({ where: { barcode: '8993988102018' } });

  const existingTx = await prisma.transaction.count();
  if (existingTx === 0 && sampleProduct1 && sampleProduct2 && sampleProduct3) {
    const tx1Date = new Date();
    tx1Date.setDate(tx1Date.getDate() - 1); // Yesterday

    await prisma.transaction.create({
      data: {
        invoiceNumber: 'INV-20260925-0001',
        date: tx1Date,
        totalAmount: 96000,
        discountAmount: 0,
        taxAmount: 0,
        finalAmount: 96000,
        paymentMethod: 'CASH',
        amountPaid: 100000,
        changeAmount: 4000,
        cashierName: 'Kasir Utama',
        items: {
          create: [
            {
              productId: sampleProduct1.id,
              productName: sampleProduct1.name,
              barcode: sampleProduct1.barcode,
              price: sampleProduct1.sellPrice,
              costPrice: sampleProduct1.buyPrice,
              quantity: 2,
              subtotal: 6000,
            },
            {
              productId: sampleProduct2.id,
              productName: sampleProduct2.name,
              barcode: sampleProduct2.barcode,
              price: sampleProduct2.sellPrice,
              costPrice: sampleProduct2.buyPrice,
              quantity: 1,
              subtotal: 53000,
            },
            {
              productId: sampleProduct3.id,
              productName: sampleProduct3.name,
              barcode: sampleProduct3.barcode,
              price: sampleProduct3.sellPrice,
              costPrice: sampleProduct3.buyPrice,
              quantity: 1,
              subtotal: 40000,
            },
          ],
        },
      },
    });

    const tx2Date = new Date(); // Today
    await prisma.transaction.create({
      data: {
        invoiceNumber: 'INV-20260926-0001',
        date: tx2Date,
        totalAmount: 46000,
        discountAmount: 0,
        taxAmount: 0,
        finalAmount: 46000,
        paymentMethod: 'QRIS',
        amountPaid: 46000,
        changeAmount: 0,
        cashierName: 'Kasir Utama',
        items: {
          create: [
            {
              productId: sampleProduct1.id,
              productName: sampleProduct1.name,
              barcode: sampleProduct1.barcode,
              price: sampleProduct1.sellPrice,
              costPrice: sampleProduct1.buyPrice,
              quantity: 2,
              subtotal: 6000,
            },
            {
              productId: sampleProduct3.id,
              productName: sampleProduct3.name,
              barcode: sampleProduct3.barcode,
              price: sampleProduct3.sellPrice,
              costPrice: sampleProduct3.buyPrice,
              quantity: 1,
              subtotal: 40000,
            },
          ],
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
