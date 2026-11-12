require('dotenv').config({ path: __dirname + '/.env' });
const http = require('http');
const app = require('./src/app');
const prisma = require('./src/config/prisma');
const XLSX = require('xlsx');

let port, server;
let adminToken, kasirToken;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const isMultipart = headers['content-type'] && headers['content-type'].includes('multipart/form-data');
    let reqBody = body;
    if (body && !isMultipart && typeof body === 'object') {
      reqBody = JSON.stringify(body);
      headers['content-type'] = 'application/json';
    }

    const options = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: {
        ...headers,
        ...(reqBody && !isMultipart ? { 'content-length': Buffer.byteLength(reqBody) } : {}),
      },
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const rawBuffer = Buffer.concat(chunks);
        const text = rawBuffer.toString('utf8');
        let json = null;
        try {
          json = JSON.parse(text);
        } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json || text,
          rawBuffer,
        });
      });
    });

    req.on('error', reject);
    if (reqBody) {
      if (Buffer.isBuffer(reqBody)) {
        req.write(reqBody);
      } else {
        req.write(reqBody);
      }
    }
    req.end();
  });
}

function sendMultipart(path, fieldName, filename, fileBuffer, token) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const head = `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`;
  const tail = `\r\n--${boundary}--\r\n`;
  const bodyBuffer = Buffer.concat([
    Buffer.from(head, 'utf8'),
    fileBuffer,
    Buffer.from(tail, 'utf8'),
  ]);

  return request('POST', path, bodyBuffer, {
    'content-type': `multipart/form-data; boundary=${boundary}`,
    'content-length': bodyBuffer.length,
    authorization: `Bearer ${token}`,
  });
}

let passed = 0;
let failed = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 MEMULAI PENGUJIAN INTEGRASI PENUH POS TOKO BAROKAH');
  console.log('====================================================\n');

  // Start internal server on random port
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  port = server.address().port;
  console.log(`Server uji aktif di http://localhost:${port}\n`);

  // ==========================================
  // 1. PENGUJIAN OTENTIKASI & RBAC
  // ==========================================
  console.log('--- 1. Modul Otentikasi & RBAC ---');

  // Login Admin
  const resLoginAdmin = await request('POST', '/api/auth/login', {
    username: 'admin',
    password: 'kunci123',
  });
  assert(resLoginAdmin.status === 200 && resLoginAdmin.data.token, 'Login Admin berhasil');
  adminToken = resLoginAdmin.data.token;
  assert(resLoginAdmin.data.user.role === 'ADMIN', 'Role pengguna admin adalah ADMIN');

  // Login Kasir
  const resLoginKasir = await request('POST', '/api/auth/login', {
    username: 'kasir',
    password: 'kunci123',
  });
  assert(resLoginKasir.status === 200 && resLoginKasir.data.token, 'Login Kasir berhasil');
  kasirToken = resLoginKasir.data.token;
  assert(resLoginKasir.data.user.role === 'KASIR', 'Role pengguna kasir adalah KASIR');

  // Login Password Salah
  const resLoginWrong = await request('POST', '/api/auth/login', {
    username: 'admin',
    password: 'salahpassword',
  });
  assert(resLoginWrong.status === 401, 'Login dengan password salah ditolak (HTTP 401)');

  // Verifikasi Profil /me
  const resMeAdmin = await request('GET', '/api/auth/me', null, { authorization: `Bearer ${adminToken}` });
  assert(resMeAdmin.status === 200 && resMeAdmin.data.data.username === 'admin', 'GET /api/auth/me Admin valid');

  const resMeNoToken = await request('GET', '/api/auth/me');
  assert(resMeNoToken.status === 401, 'Akses rute terlindungi tanpa token ditolak (HTTP 401)');

  // ==========================================
  // 2. PENGUJIAN KATEGORI & RBAC MUTASI
  // ==========================================
  console.log('\n--- 2. Modul Kategori & Hak Akses Mutasi ---');

  // Kasir melihat kategori
  const resGetCatsKasir = await request('GET', '/api/categories', null, { authorization: `Bearer ${kasirToken}` });
  assert(resGetCatsKasir.status === 200 && Array.isArray(resGetCatsKasir.data.data), 'Kasir dapat melihat kategori');

  // Kasir mencoba membuat kategori (Harus 403)
  const resCreateCatKasir = await request('POST', '/api/categories', { name: 'Ilegal Cat' }, { authorization: `Bearer ${kasirToken}` });
  assert(resCreateCatKasir.status === 403, 'Kasir dilarang membuat kategori baru (HTTP 403)');

  // Admin membuat kategori baru
  const testCatName = 'Kategori QA ' + Date.now();
  const testCatEditName = testCatName + ' Edit';
  const resCreateCatAdmin = await request('POST', '/api/categories', { name: testCatName, description: 'Testing' }, { authorization: `Bearer ${adminToken}` });
  assert(resCreateCatAdmin.status === 201 && resCreateCatAdmin.data.data.id, 'Admin berhasil membuat kategori');
  const createdCatId = resCreateCatAdmin.data.data.id;

  // Admin memperbarui kategori
  const resUpdateCat = await request('PUT', `/api/categories/${createdCatId}`, { name: testCatEditName, description: 'Testing Edit' }, { authorization: `Bearer ${adminToken}` });
  assert(resUpdateCat.status === 200 && resUpdateCat.data.data.name === testCatEditName, 'Admin berhasil memperbarui kategori');

  // ==========================================
  // 3. PENGUJIAN PRODUK & INVENTARIS
  // ==========================================
  console.log('\n--- 3. Modul Produk & Inventaris ---');

  // Kasir & Admin membaca daftar produk
  const resGetProds = await request('GET', '/api/products', null, { authorization: `Bearer ${kasirToken}` });
  assert(resGetProds.status === 200 && resGetProds.data.data.length > 0, 'Pembacaan katalog produk berhasil');

  // Cari produk berdasarkan teks
  const resSearch = await request('GET', '/api/products?q=pulpen', null, { authorization: `Bearer ${kasirToken}` });
  assert(resSearch.status === 200 && resSearch.data.data.length > 0, 'Pencarian produk dengan query ?q= pulpen');

  // Ambil produk berdasarkan barcode
  const sampleBarcode = '8993175537012';
  const resBarcode = await request('GET', `/api/products/barcode/${sampleBarcode}`, null, { authorization: `Bearer ${kasirToken}` });
  assert(resBarcode.status === 200 && resBarcode.data.data.barcode === sampleBarcode, 'Pencarian produk via barcode');

  // Admin menambah produk baru
  const testBarcode = 'TEST-' + Date.now();
  const resCreateProd = await request('POST', '/api/products', {
    barcode: testBarcode,
    name: 'Buku Catatan QA Special',
    categoryId: createdCatId,
    buyPrice: 5000,
    sellPrice: 8000,
    stock: 50,
    minStock: 10,
    unit: 'buku',
  }, { authorization: `Bearer ${adminToken}` });
  assert(resCreateProd.status === 201 && resCreateProd.data.data.id, 'Admin berhasil menambah produk baru');
  const createdProdId = resCreateProd.data.data.id;

  // Validasi Barcode Duplikat
  const resDupBarcode = await request('POST', '/api/products', {
    barcode: testBarcode,
    name: 'Produk Barcode Duplikat',
    categoryId: createdCatId,
    sellPrice: 8000,
  }, { authorization: `Bearer ${adminToken}` });
  assert(resDupBarcode.status === 400, 'Pencegahan barcode duplikat (HTTP 400)');

  // Quick Restock / Adjust Stock
  const resAdjustStock = await request('POST', `/api/products/${createdProdId}/adjust-stock`, {
    quantity: 15,
    type: 'IN_PURCHASE',
    notes: 'Restock uji coba QA',
  }, { authorization: `Bearer ${adminToken}` });
  assert(resAdjustStock.status === 200 && resAdjustStock.data.data.stock === 65, 'Penyesuaian stok manual (+15 pcs menjadi 65)');

  // Verifikasi tabel StockMovement tercatat
  const movement = await prisma.stockMovement.findFirst({
    where: { productId: createdProdId },
    orderBy: { createdAt: 'desc' },
  });
  assert(movement && movement.quantity === 15 && movement.type === 'IN_PURCHASE', 'Mutasi stok tercatat rapi di tabel stock_movements');

  // ==========================================
  // 4. PENGUJIAN TRANSAKSI KASIR (POS) & KONKURENSI
  // ==========================================
  console.log('\n--- 4. Modul Kasir POS, Validasi Bisnis & Konkurensi ---');

  // Uji Keranjang Kosong (Harus 400 - T-08)
  const resEmptyCart = await request('POST', '/api/transactions', {
    items: [],
    paymentMethod: 'CASH',
    amountPaid: 10000,
  }, { authorization: `Bearer ${kasirToken}` });
  assert(resEmptyCart.status === 400, 'Validasi keranjang kosong mengembalikan HTTP 400 (T-08)');

  // Uji Pembelian Melebihi Stok Tersedia (Harus 400 - T-07 & T-08)
  const resOverStock = await request('POST', '/api/transactions', {
    items: [{ productId: createdProdId, quantity: 9999 }],
    paymentMethod: 'CASH',
    amountPaid: 10000000,
  }, { authorization: `Bearer ${kasirToken}` });
  assert(resOverStock.status === 400, 'Validasi stok tidak mencukupi mengembalikan HTTP 400 atomik (T-07 & T-08)');

  // Uji Pembayaran Tunai Kurang (Harus 400 - T-08)
  const resUnderPaid = await request('POST', '/api/transactions', {
    items: [{ productId: createdProdId, quantity: 2 }], // 2 * 8000 = 16000
    paymentMethod: 'CASH',
    amountPaid: 10000, // Kurang 6000
  }, { authorization: `Bearer ${kasirToken}` });
  assert(resUnderPaid.status === 400, 'Validasi uang tunai kurang mengembalikan HTTP 400 (T-08)');

  // Checkout Sukses Transaksi TUNAI oleh Kasir
  const stockBeforeSale = (await prisma.product.findUnique({ where: { id: createdProdId } })).stock;
  const resCheckoutCash = await request('POST', '/api/transactions', {
    items: [{ productId: createdProdId, quantity: 5 }], // 5 * 8000 = 40000
    paymentMethod: 'CASH',
    amountPaid: 50000,
    discountAmount: 0,
    notes: 'Nota Uji Kasir 1',
  }, { authorization: `Bearer ${kasirToken}` });

  assert(resCheckoutCash.status === 201 && resCheckoutCash.data.data.invoiceNumber, 'Checkout transaksi TUNAI sukses dibuat');
  const txCash = resCheckoutCash.data.data;
  assert(txCash.cashierName === 'Kasir Toko', 'Nama kasir tercatat dari token login (T-01)');
  assert(Number(txCash.finalAmount) === 40000, 'Perhitungan harga final otoritatif dari database');
  assert(Number(txCash.changeAmount) === 10000, 'Perhitungan kembalian benar (50.000 - 40.000 = 10.000)');

  // Verifikasi pengurangan stok atomik
  const stockAfterSale = (await prisma.product.findUnique({ where: { id: createdProdId } })).stock;
  assert(stockAfterSale === stockBeforeSale - 5, 'Stok barang berkurang secara atomik (-5 pcs)');

  // Checkout Transaksi QRIS oleh Admin
  const resCheckoutQRIS = await request('POST', '/api/transactions', {
    items: [{ productId: createdProdId, quantity: 2 }],
    paymentMethod: 'QRIS',
    notes: 'Transaksi QRIS',
  }, { authorization: `Bearer ${adminToken}` });
  assert(resCheckoutQRIS.status === 201 && resCheckoutQRIS.data.data.paymentMethod === 'QRIS', 'Checkout transaksi QRIS sukses');
  assert(resCheckoutQRIS.data.data.cashierName === 'Administrator Toko', 'Nama kasir transaksi QRIS sesuai token admin (T-01)');

  // Checkout Transaksi TRANSFER
  const resCheckoutTransfer = await request('POST', '/api/transactions', {
    items: [{ productId: createdProdId, quantity: 1 }],
    paymentMethod: 'TRANSFER',
    notes: 'Transaksi Transfer Bank',
  }, { authorization: `Bearer ${kasirToken}` });
  assert(resCheckoutTransfer.status === 201 && resCheckoutTransfer.data.data.paymentMethod === 'TRANSFER', 'Checkout transaksi TRANSFER sukses');

  // Ambil detail struk nota berdasarkan ID
  const resTxDetail = await request('GET', `/api/transactions/${txCash.id}`, null, { authorization: `Bearer ${kasirToken}` });
  assert(resTxDetail.status === 200 && resTxDetail.data.data.invoiceNumber === txCash.invoiceNumber, 'Pengambilan rincian struk nota transaksi');

  // ==========================================
  // 5. PENGUJIAN MODUL EXCEL & CSV (IMPORT & EXPORT)
  // ==========================================
  console.log('\n--- 5. Modul Template, Ekspor, & Impor Excel/CSV ---');

  // Download Template Excel
  const resTplXlsx = await request('GET', '/api/products/template', null, { authorization: `Bearer ${kasirToken}` });
  assert(resTplXlsx.status === 200 && resTplXlsx.headers['content-type'].includes('spreadsheetml'), 'Unduh Template Excel berhasil');

  // Download Template CSV
  const resTplCsv = await request('GET', '/api/products/template-csv', null, { authorization: `Bearer ${kasirToken}` });
  assert(resTplCsv.status === 200 && resTplCsv.rawBuffer[0] === 0xef && resTplCsv.rawBuffer[1] === 0xbb && resTplCsv.rawBuffer[2] === 0xbf, 'Unduh Template CSV dengan UTF-8 BOM berhasil');

  // Export Katalog Produk XLSX
  const resExportXlsx = await request('GET', '/api/products/export?format=xlsx', null, { authorization: `Bearer ${adminToken}` });
  assert(resExportXlsx.status === 200 && resExportXlsx.rawBuffer.length > 5000, 'Ekspor Inventaris ke Excel (.xlsx) berhasil');

  // Export Katalog Produk CSV
  const resExportCsv = await request('GET', '/api/products/export?format=csv', null, { authorization: `Bearer ${adminToken}` });
  assert(resExportCsv.status === 200 && resExportCsv.headers['content-type'].includes('csv'), 'Ekspor Inventaris ke CSV (.csv) berhasil');

  // Export Laporan Penjualan Excel
  const resExportReport = await request('GET', '/api/reports/export/excel', null, { authorization: `Bearer ${adminToken}` });
  assert(resExportReport.status === 200 && resExportReport.rawBuffer.length > 5000, 'Ekspor Laporan Penjualan ke Excel berhasil');

  // Export Laporan Penjualan Excel dengan query aman
  const resExportReportParam = await request('GET', '/api/reports/export/excel?startDate=undefined&endDate=undefined', null, { authorization: `Bearer ${adminToken}` });
  assert(resExportReportParam.status === 200, 'Ekspor Laporan dengan parameter startDate=undefined tetap aman');

  // Uji Impor File Excel: Verifikasi T-02 (Barcode tidak tertukar dengan Nama Produk)
  const importWb = XLSX.utils.book_new();
  const importHeaders = ['Barcode / Kode Barang', 'Nama Produk ATK', 'Kategori', 'Harga Beli (Modal)', 'Harga Jual', 'Stok', 'Minimal Stok', 'Satuan'];
  const testImportBarcode = 'IMPORT-BARCODE-999';
  const testImportName = 'Kertas Folio Bergaris Premium';
  const importData = [
    importHeaders,
    [testImportBarcode, testImportName, 'Kertas & Buku', 25000, 32000, 40, 5, 'pack'],
  ];
  const importWs = XLSX.utils.aoa_to_sheet(importData);
  XLSX.utils.book_append_sheet(importWb, importWs, 'Template Produk ATK');
  const importBuffer = XLSX.write(importWb, { type: 'buffer', bookType: 'xlsx' });

  const resImport = await sendMultipart('/api/products/import', 'file', 'test_import.xlsx', importBuffer, adminToken);
  assert(resImport.status === 200, 'Unggah impor file Excel berhasil diproses');

  // Verifikasi database: nama dan barcode tidak tertukar (T-02)
  const importedProd = await prisma.product.findUnique({ where: { barcode: testImportBarcode } });
  assert(importedProd && importedProd.name === testImportName, 'T-02 Lolos: Nama produk bukan barcode (identifikasi kolom presisi)');

  // ==========================================
  // 6. PENGUJIAN LAPORAN, DASHBOARD & IDENTITAS TOKO
  // ==========================================
  console.log('\n--- 6. Modul Laporan, Dashboard & Identitas Toko ---');

  // Dashboard Analytics
  const resDashboard = await request('GET', '/api/reports/dashboard', null, { authorization: `Bearer ${adminToken}` });
  assert(resDashboard.status === 200, 'GET /api/reports/dashboard berhasil');
  const dbData = resDashboard.data.data;
  assert(dbData.kpis.todayRevenue > 0, 'KPI Omset hari ini terhitung');
  assert(Array.isArray(dbData.salesTrend) && dbData.salesTrend.length === 7, 'Grafik tren penjualan 7 hari tersaji (T-03)');
  assert(Array.isArray(dbData.topSelling) && dbData.topSelling.length > 0, 'Daftar produk terlaris sepanjang waktu tersedia (T-03)');

  // Laporan Penjualan JSON
  const resSalesReport = await request('GET', '/api/reports/sales', null, { authorization: `Bearer ${adminToken}` });
  assert(resSalesReport.status === 200 && resSalesReport.data.data.transactions.length > 0, 'Laporan penjualan komprehensif berhasil dimuat');
  assert(resSalesReport.data.data.summary.grossProfit >= 0, 'Perhitungan laba kotor & profit margin valid');

  // Identitas Pengaturan Toko
  const resSettings = await request('GET', '/api/settings', null, { authorization: `Bearer ${kasirToken}` });
  assert(resSettings.status === 200, 'GET /api/settings berhasil');
  const settings = resSettings.data.data;
  assert(settings.name === 'TOKO BAROKAH', 'Nama toko adalah TOKO BAROKAH');
  assert(settings.address === 'Jl. KH. Dewantoro No. 1 Rejoso - Nganjuk', 'Alamat toko sesuai foto');
  assert(settings.phone === '081259878173', 'Nomor telepon toko sesuai foto');

  // Pembersihan Produk Uji QA
  await prisma.transactionItem.deleteMany({ where: { productId: createdProdId } });
  await prisma.stockMovement.deleteMany({ where: { productId: createdProdId } });
  await prisma.product.delete({ where: { id: createdProdId } });
  if (importedProd) {
    await prisma.product.delete({ where: { id: importedProd.id } });
  }
  await prisma.category.delete({ where: { id: createdCatId } });

  // Selesai
  server.close();

  console.log('\n====================================================');
  console.log(`📊 REKAPITULASI HASIL PENGUJIAN SISTEM:`);
  console.log(`   ✓ Total Lolos (PASS) : ${passed}`);
  console.log(`   ✗ Total Gagal (FAIL) : ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  if (server) server.close();
  process.exit(1);
});
