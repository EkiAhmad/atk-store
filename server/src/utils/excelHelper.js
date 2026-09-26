const XLSX = require('xlsx');

/**
 * Generate standard ATK template workbook
 */
function generateTemplateWorkbook() {
  const wb = XLSX.utils.book_new();

  const headers = [
    'Barcode / Kode Barang',
    'Nama Produk ATK',
    'Kategori',
    'Harga Beli (Modal)',
    'Harga Jual',
    'Stok',
    'Minimal Stok',
    'Satuan',
  ];

  const sampleRows = [
    ['8993175537012', 'Pulpen Standard AE7 0.5 Hitam', 'Alat Tulis', 2000, 3000, 100, 20, 'pcs'],
    ['8991389221015', 'Pensil 2B Faber-Castell', 'Alat Tulis', 3500, 5000, 50, 10, 'pcs'],
    ['8998866100120', 'Kertas HVS PaperOne A4 70gr (1 Rim)', 'Kertas & Buku', 45000, 53000, 30, 5, 'rim'],
    ['8993988102018', 'Buku Tulis Sinar Dunia 38 Lembar (Pack)', 'Kertas & Buku', 32000, 40000, 20, 5, 'pack'],
    ['8992753220119', 'Stapler Joyko HD-10', 'Peralatan Meja', 11000, 16000, 15, 5, 'pcs'],
  ];

  const data = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 22 }, // Barcode
    { wch: 42 }, // Nama Produk
    { wch: 20 }, // Kategori
    { wch: 18 }, // Harga Beli
    { wch: 18 }, // Harga Jual
    { wch: 10 }, // Stok
    { wch: 14 }, // Minimal Stok
    { wch: 10 }, // Satuan
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Template Produk ATK');

  // Second sheet: Petunjuk Pengisian
  const instructions = [
    ['PETUNJUK PENGISIAN IMPORT EXCEL / CSV TOKO ATK'],
    [''],
    ['1. Kolom "Barcode / Kode Barang": Isi dengan barcode produk atau kode unik toko (misal: ATK-001). Bisa dikosongkan jika belum ada.'],
    ['2. Kolom "Nama Produk ATK": Wajib diisi (contoh: Pulpen Standard AE7 Hitam).'],
    ['3. Kolom "Kategori": Nama kategori (misal: Alat Tulis, Kertas & Buku, Map/Folder, dll). Jika kategori belum ada, akan otomatis dibuat.'],
    ['4. Kolom "Harga Beli": Harga kulakan/modal per satuan (hanya angka, tanpa tanda titik/koma/Rp).'],
    ['5. Kolom "Harga Jual": Harga jual ke konsumen (hanya angka).'],
    ['6. Kolom "Stok": Jumlah stok yang dimasukkan/ditambahkan.'],
    ['7. Kolom "Minimal Stok": Ambang batas peringatan stok menipis (default 5 jika kosong).'],
    ['8. Kolom "Satuan": Satuan barang (misal: pcs, pack, rim, lusin, box, roll, set, buah).'],
    [''],
    ['CATATAN RESTOCK:'],
    ['- Jika Barcode atau Nama Produk sudah ada di sistem, stok akan OTOMATIS DITAMBAHKAN (Restock) dan harga diperbarui.'],
    ['- Jika Barcode belum terdaftar, produk baru akan otomatis DITAMBAHKAN ke katalog.'],
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(instructions);
  wsGuide['!cols'] = [{ wch: 100 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk Pengisian');

  return wb;
}

/**
 * Parse uploaded buffer from Excel/CSV
 */
function parseUploadedFile(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (rows.length < 2) {
    throw new Error('File kosong atau tidak memiliki data.');
  }

  // Row 0 is header
  const headerRow = rows[0].map((h) => String(h).trim().toLowerCase());

  // Find column indices
  const findIdx = (keywords) => headerRow.findIndex((h) => keywords.some((k) => h.includes(k)));

  const barcodeIdx = findIdx(['barcode', 'kode']);
  const nameIdx = findIdx(['nama', 'produk', 'item', 'barang']);
  const categoryIdx = findIdx(['kategori', 'category']);
  const buyPriceIdx = findIdx(['harga beli', 'modal', 'beli', 'buy', 'cost']);
  const sellPriceIdx = findIdx(['harga jual', 'jual', 'sell', 'price']);
  const stockIdx = findIdx(['stok', 'stock', 'qty', 'jumlah']);
  const minStockIdx = findIdx(['min', 'minimal', 'minimum']);
  const unitIdx = findIdx(['satuan', 'unit']);

  if (nameIdx === -1) {
    throw new Error('Kolom "Nama Produk" tidak ditemukan pada baris header file.');
  }

  const items = [];
  const errors = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Skip completely empty rows
    if (!row || row.every((c) => String(c).trim() === '')) continue;

    const rowNum = i + 1;
    const rawName = nameIdx !== -1 ? String(row[nameIdx] || '').trim() : '';

    if (!rawName) {
      errors.push(`Baris ${rowNum}: Nama produk tidak boleh kosong.`);
      continue;
    }

    const rawBarcode = barcodeIdx !== -1 ? String(row[barcodeIdx] || '').trim() : '';
    const rawCategory = categoryIdx !== -1 ? String(row[categoryIdx] || '').trim() : 'Lainnya';
    const rawBuyPrice = buyPriceIdx !== -1 ? parseFloat(String(row[buyPriceIdx]).replace(/[^0-9.-]/g, '')) || 0 : 0;
    const rawSellPrice = sellPriceIdx !== -1 ? parseFloat(String(row[sellPriceIdx]).replace(/[^0-9.-]/g, '')) || 0 : 0;
    const rawStock = stockIdx !== -1 ? parseInt(String(row[stockIdx]).replace(/[^0-9-]/g, ''), 10) || 0 : 0;
    const rawMinStock = minStockIdx !== -1 ? parseInt(String(row[minStockIdx]).replace(/[^0-9-]/g, ''), 10) || 5 : 5;
    const rawUnit = unitIdx !== -1 ? String(row[unitIdx] || '').trim() || 'pcs' : 'pcs';

    if (rawSellPrice < 0 || rawBuyPrice < 0) {
      errors.push(`Baris ${rowNum} (${rawName}): Harga tidak boleh bernilai negatif.`);
      continue;
    }

    items.push({
      barcode: rawBarcode || null,
      name: rawName,
      categoryName: rawCategory || 'Umum',
      buyPrice: rawBuyPrice,
      sellPrice: rawSellPrice,
      stock: rawStock,
      minStock: rawMinStock,
      unit: rawUnit,
      rowNum,
    });
  }

  return { items, errors, totalRowsProcessed: rows.length - 1 };
}

/**
 * Generate export workbook from product list
 */
function generateProductExportWorkbook(products) {
  const wb = XLSX.utils.book_new();

  const headers = [
    'ID',
    'Barcode / Kode',
    'Nama Produk',
    'Kategori',
    'Harga Beli (Rp)',
    'Harga Jual (Rp)',
    'Stok',
    'Min. Stok',
    'Satuan',
    'Status Stok',
    'Terakhir Diperbarui',
  ];

  const rows = products.map((p) => {
    let stockStatus = 'Aman';
    if (p.stock <= 0) stockStatus = 'Habis';
    else if (p.stock <= p.minStock) stockStatus = 'Menipis';

    return [
      p.id,
      p.barcode || '-',
      p.name,
      p.category?.name || 'Uncategorized',
      Number(p.buyPrice),
      Number(p.sellPrice),
      p.stock,
      p.minStock,
      p.unit,
      stockStatus,
      new Date(p.updatedAt).toLocaleDateString('id-ID'),
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 40 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 10 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Inventaris Produk ATK');
  return wb;
}

/**
 * Generate sales report workbook
 */
function generateSalesReportWorkbook(transactions, summary) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Rangkuman Transaksi
  const txHeaders = [
    'No. Invoice',
    'Tanggal & Waktu',
    'Kasir',
    'Metode Bayar',
    'Total Belanja (Rp)',
    'Diskon (Rp)',
    'Total Akhir (Rp)',
    'Bayar (Rp)',
    'Kembalian (Rp)',
    'Jumlah Item',
  ];

  const txRows = transactions.map((t) => [
    t.invoiceNumber,
    new Date(t.date).toLocaleString('id-ID'),
    t.cashierName,
    t.paymentMethod,
    Number(t.totalAmount),
    Number(t.discountAmount),
    Number(t.finalAmount),
    Number(t.amountPaid),
    Number(t.changeAmount),
    t.items ? t.items.reduce((sum, item) => sum + item.quantity, 0) : 0,
  ]);

  const wsTx = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows]);
  wsTx['!cols'] = [
    { wch: 22 },
    { wch: 22 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTx, 'Daftar Transaksi');

  // Sheet 2: Rincian Item Terjual
  const itemHeaders = [
    'No. Invoice',
    'Tanggal',
    'Kode/Barcode',
    'Nama Produk ATK',
    'Harga Satuan (Rp)',
    'Harga Modal (Rp)',
    'Jumlah (Qty)',
    'Subtotal (Rp)',
    'Estimasi Margin (Rp)',
  ];

  const itemRows = [];
  transactions.forEach((t) => {
    if (t.items) {
      t.items.forEach((item) => {
        const subtotal = Number(item.subtotal);
        const totalCost = Number(item.costPrice) * item.quantity;
        const profit = subtotal - totalCost;

        itemRows.push([
          t.invoiceNumber,
          new Date(t.date).toLocaleDateString('id-ID'),
          item.barcode || '-',
          item.productName,
          Number(item.price),
          Number(item.costPrice),
          item.quantity,
          subtotal,
          profit,
        ]);
      });
    }
  });

  const wsItems = XLSX.utils.aoa_to_sheet([itemHeaders, ...itemRows]);
  wsItems['!cols'] = [
    { wch: 22 },
    { wch: 14 },
    { wch: 18 },
    { wch: 38 },
    { wch: 16 },
    { wch: 16 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsItems, 'Detail Item Terjual');

  return wb;
}

module.exports = {
  generateTemplateWorkbook,
  parseUploadedFile,
  generateProductExportWorkbook,
  generateSalesReportWorkbook,
};
