# Web App Kasir & Inventaris Toko ATK (Point of Sale System)

Aplikasi Web Kasir (*Point of Sale*) dan Manajemen Inventaris modern yang dirancang khusus untuk toko Alat Tulis Kantor (**Toko ATK**).

Dibangun dengan arsitektur modular yang cepat, responsif, dan menjamin akurasi perhitungan transaksi serta konsistensi stok barang.

---

## 🌟 Fitur Utama

1. **Kasir (POS) Transaksi Cepat:**
   - **Input Kode Manual Cepat:** Ketik barcode/SKU/nama barang ATK lalu tekan **Enter** untuk langsung memasukkan ke keranjang (tidak wajib scanner fisik).
   - **Katalog & Filter Kategori ATK:** Alat Tulis, Kertas & Buku, Map/Penyimpanan, Peralatan Meja, Pewarna/Cat, dll.
   - **Validasi Stok Real-Time:** Kuantitas di keranjang otomatis dibatasi maksimal sebesar stok yang ada di database. Mencegah *over-selling* dan stok minus.
   - **Kalkulasi Pembayaran Otomatis:** Hitung subtotal, diskon potongan, uang diterima, shortcut pecahan uang (Uang Pas, 10k, 20k, 50k, 100k), dan uang kembalian secara *real-time*.
   - **Cetak Struk Thermal & PDF:** Tampilan struk kasir yang siap dicetak ke printer thermal (58mm / 80mm) atau diunduh langsung sebagai file PDF.

2. **Inventaris & Fast Responsive DataTable:**
   - Tabel inventaris super cepat dengan pencarian instan, filter kategori, dan tombol filter **Hanya Stok Menipis**.
   - Tambah & edit barang ATK dengan validasi lengkap (harga beli, harga jual, stok minimum, satuan).
   - **Quick Restock Modal:** Tombol cepat untuk menambah stok barang masuk tanpa harus membuka form edit.

3. **Import & Export Excel / CSV:**
   - **Download Template Siap Pakai:** Menyediakan template file Excel (.xlsx) dan CSV (.csv) bawaan lengkap dengan contoh data produk ATK dan petunjuk pengisian.
   - **Smart Import & Restock:** Upload file Excel/CSV untuk menambah produk baru sekaligus otomatis me-restock produk yang sudah terdaftar jika barcode/nama cocok. Dilengkapi *live preview* data sebelum submit.
   - **Export Inventaris:** Ekspor seluruh data barang ke format Excel (.xlsx) atau CSV (.csv).

4. **Dashboard Statistik & Visualisasi Data (Recharts):**
   - **4 Kartu Metrik:** Omset Hari Ini, Omset Bulan Ini, Total Produk Aktif, dan Peringatan Stok Menipis.
   - **Grafik Tren Penjualan Harian:** Area chart yang menampilkan omset dan volume transaksi harian.
   - **Grafik Produk ATK Terlaris:** Horizontal bar chart yang meranking produk paling banyak terjual.
   - **Diagram Sebaran Kategori:** Donut pie chart persebaran stok per kategori ATK.
   - **Widget Peringatan Stok Menipis:** Daftar barang kritis yang membutuhkan restock segera.

5. **Laporan Penjualan & Cetak PDF Resmi:**
   - Filter rentang tanggal fleksibel (Hari Ini, 7 Hari Terakhir, Bulan Ini, Semua Data, atau Kustom Tanggal).
   - Rekap omset, margin estimasi laba bersih, dan kuantitas barang keluar.
   - **Export Excel Laporan Penjualan:** Rincian transaksi dan detail item terjual.
   - **Cetak Laporan PDF Resmi:** Dilengkapi kop nama toko, alamat, nomor telepon, tabel ringkasan KPI, dan rincian transaksi yang rapi.

6. **Pengaturan Profil Toko:**
   - Kustomisasi nama toko, alamat, nomor telepon, dan catatan kaki (*footer note*) pada struk belanja.

---

## 🛠️ Tech Stack

* **Frontend:** React 18, Vite, Tailwind CSS, Lucide React (Icons), Recharts (Charts), Axios, jsPDF, jsPDF-AutoTable, XLSX.
* **Backend:** Node.js, Express.js, Prisma ORM, Multer (File Upload), XLSX (Excel Engine).
* **Database:** MySQL (Transaction-safe via `prisma.$transaction`).

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Prasyarat:
* Node.js (v18+) & npm
* MySQL Server aktif (Port 3306, default `root` tanpa password di Laragon / XAMPP)

### 2. Inisialisasi Database:
Buka terminal di folder proyek:
```bash
cd server
npm install
npx prisma db push
node prisma/seed.js
```

### 3. Menjalankan Backend:
```bash
cd server
npm run dev
```
> Server API akan berjalan di: `http://localhost:5000`

### 4. Menjalankan Frontend:
Buka terminal baru:
```bash
cd client
npm install
npm run dev
```
> Aplikasi web kasir akan terbuka di browser: `http://localhost:5173`

---

## 📁 Struktur Folder

```
atk-store/
├── client/                     # Frontend React (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # DataTable, Modal, Badge
│   │   │   ├── dashboard/      # SalesChart, TopSellingChart, CategoryPieChart, LowStockWidget
│   │   │   ├── inventory/      # ProductFormModal, QuickRestockModal, ImportModal
│   │   │   ├── layout/         # Navbar, Sidebar
│   │   │   └── pos/            # BarcodeSearchInput, CategoryTabs, ProductGrid, CartPanel, PaymentModal, ReceiptModal
│   │   ├── context/            # CartContext, ToastContext
│   │   ├── pages/              # POSPage, InventoryPage, DashboardPage, ReportsPage, SettingsPage
│   │   ├── services/           # Axios API services
│   │   ├── utils/              # formatters.js, pdfExport.js
│   │   ├── App.jsx
│   │   └── main.jsx
│
├── server/                     # Backend Node.js Express & Prisma
│   ├── prisma/
│   │   ├── schema.prisma       # Skema database MySQL
│   │   └── seed.js             # Data awal ATK
│   ├── src/
│   │   ├── controllers/        # product, category, transaction, report, setting
│   │   ├── middlewares/        # errorHandler, upload
│   │   ├── routes/             # API routes
│   │   ├── utils/              # excelHelper.js
│   │   ├── app.js
│   │   └── index.js
└── docs/                       # Spesifikasi Desain & Rencana Implementasi
```
