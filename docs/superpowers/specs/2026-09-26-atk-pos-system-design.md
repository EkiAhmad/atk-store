# Design Specification: Web App Kasir Toko ATK (Point of Sale System)

**Date:** 2026-09-26  
**Status:** Approved by User  
**Target Stack:** React (Vite) + Tailwind CSS + Node.js (Express) + Prisma ORM + MySQL

---

## 1. Overview & Goals

The goal of this project is to build a responsive, robust, and modern **Web-based Cashier & Inventory Management System (POS)** tailored specifically for stationery and office supply stores (**Toko Alat Tulis Kantor / ATK**).

### Key Business Goals & Features:
1. **High-Speed Cashier (POS) Interface:**
   - Fast manual product code / barcode input with keyboard navigation and instant search (no physical barcode scanner required).
   - Real-time stock validation preventing overselling.
   - Live payment calculation with cash change breakdown, standard bill denomination shortcuts, and multi-payment support (Cash, QRIS, Transfer).
   - Thermal receipt preview (58mm/80mm) and instant printable / PDF download.
2. **Inventory & Fast Responsive DataTable:**
   - Lightweight, responsive data grid for managing ATK products and categories.
   - Filter by categories (*Alat Tulis, Kertas & Buku, Map/Folder, Peralatan Meja, Pewarna/Cat*), instant search, and low-stock indicators.
   - Quick restock modal for fast quantity adjustments.
3. **Excel / CSV Import & Export:**
   - Built-in **Downloadable Template** (.xlsx and .csv) pre-filled with sample ATK items and field instructions.
   - Smart bulk import: automatically registers new items or restocks existing inventory based on barcode/name match.
   - Complete inventory export to Excel/CSV.
4. **Interactive Analytics & Dashboard Visualizations:**
   - Key metric cards: Today's Revenue, Monthly Revenue, Total Transactions, and Critical Low-Stock Alerts.
   - Interactive charts powered by `recharts`: Daily/Monthly Sales Trend, Top Selling ATK Items, and Category Sales Distribution.
5. **Comprehensive Sales Reports & PDF Export:**
   - Filterable transaction history and sales recap with profit estimates.
   - Official sales report export to Excel and beautifully formatted PDF with store header.
6. **Strict Stock Consistency & Atomic Transactions:**
   - Strict transactional integrity using `prisma.$transaction` to guarantee zero negative stock and accurate mutation history (`StockMovement`).

---

## 2. System Architecture

The application adopts a clean, modular monorepo structure separating the client single-page application (SPA) and backend REST API server.

```
atk-store/
├── client/                     # React Frontend (Vite + Tailwind CSS)
│   ├── public/                 # Static assets & icons
│   ├── src/
│   │   ├── assets/             # Images & styles
│   │   ├── components/         # Reusable UI components (Navbar, Modal, DataTable, Badge, Button)
│   │   │   ├── common/         # Alert, Loader, Card, MetricCard, Pagination
│   │   │   ├── pos/            # ProductGrid, CategoryTabs, CartPanel, PaymentModal, ReceiptModal
│   │   │   ├── inventory/      # ProductFormModal, QuickRestockModal, ImportModal, ExportButton
│   │   │   ├── dashboard/      # SalesChart, TopProductsChart, CategoryPieChart, LowStockWidget
│   │   │   └── reports/        # SalesReportTable, DateRangeFilter, ExportPdfButton
│   │   ├── context/            # Global state (CartContext, NotificationContext)
│   │   ├── hooks/              # Custom hooks (useDebounce, useProducts, useTransactions)
│   │   ├── pages/              # POSPage, InventoryPage, DashboardPage, ReportsPage, SettingsPage
│   │   ├── services/           # Axios API services (api.js, productApi.js, transactionApi.js, reportApi.js)
│   │   ├── utils/              # formatCurrency, formatDate, pdfGenerator, excelExporter
│   │   ├── App.jsx             # App layout & routing
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                     # Node.js Express Backend
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema & relationships
│   │   └── seed.js             # Initial seed data (Categories, Sample ATK Products, Settings)
│   ├── src/
│   │   ├── config/             # Database connection & env variables
│   │   ├── controllers/        # Request handlers (product, category, transaction, report, importExport, setting)
│   │   ├── middlewares/        # Error handler, multer file upload middleware, validator
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # Business logic & Prisma transactional operations
│   │   ├── utils/              # Excel parser/builder, PDF generator, invoice generator
│   │   └── app.js              # Express app setup & server entry (index.js)
│   ├── package.json
│   └── .env.example
└── docs/                       # Specifications and documentation
```

---

## 3. Database Schema (Prisma & MySQL)

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Kategori Produk ATK
model Category {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  description String?
  products    Product[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("categories")
}

// Produk ATK
model Product {
  id          Int               @id @default(autoincrement())
  barcode     String?           @unique
  name        String
  categoryId  Int?
  category    Category?         @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  buyPrice    Decimal           @db.Decimal(12, 2)
  sellPrice   Decimal           @db.Decimal(12, 2)
  stock       Int               @default(0)
  minStock    Int               @default(5)
  unit        String            @default("pcs")
  isActive    Boolean           @default(true)
  items       TransactionItem[]
  stockLogs   StockMovement[]
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@index([barcode])
  @@index([name])
  @@map("products")
}

// Transaksi Penjualan
model Transaction {
  id             Int               @id @default(autoincrement())
  invoiceNumber  String            @unique
  date           DateTime          @default(now())
  totalAmount    Decimal           @db.Decimal(12, 2)
  discountAmount Decimal           @default(0) @db.Decimal(12, 2)
  taxAmount      Decimal           @default(0) @db.Decimal(12, 2)
  finalAmount    Decimal           @db.Decimal(12, 2)
  paymentMethod  String            @default("CASH") // CASH, QRIS, TRANSFER
  amountPaid     Decimal           @db.Decimal(12, 2)
  changeAmount   Decimal           @default(0) @db.Decimal(12, 2)
  cashierName    String            @default("Kasir Toko")
  notes          String?
  items          TransactionItem[]
  createdAt      DateTime          @default(now())

  @@index([date])
  @@index([invoiceNumber])
  @@map("transactions")
}

// Item Rincian Transaksi
model TransactionItem {
  id            Int         @id @default(autoincrement())
  transactionId Int
  transaction   Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  productId     Int?
  product       Product?    @relation(fields: [productId], references: [id], onDelete: SetNull)
  productName   String
  barcode       String?
  price         Decimal     @db.Decimal(12, 2)
  costPrice     Decimal     @db.Decimal(12, 2)
  quantity      Int
  subtotal      Decimal     @db.Decimal(12, 2)

  @@map("transaction_items")
}

// Log Mutasi Stok
model StockMovement {
  id          Int      @id @default(autoincrement())
  productId   Int
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  type        String   // IN_PURCHASE, IN_IMPORT, OUT_SALE, ADJUSTMENT
  quantity    Int
  notes       String?
  createdAt   DateTime @default(now())

  @@index([productId])
  @@map("stock_movements")
}

// Pengaturan Toko
model StoreSetting {
  id            Int     @id @default(1)
  name          String  @default("Toko ATK Berkah Mandiri")
  address       String? @default("Jl. Pendidikan No. 123, Jakarta")
  phone         String? @default("081234567890")
  receiptFooter String? @default("Terima kasih atas kunjungan Anda! Barang yang dibeli tidak dapat ditukar/dikembalikan.")

  @@map("store_settings")
}
```

---

## 4. Backend API Endpoints & Specifications

### 4.1 Products & Categories
- `GET /api/categories`: Fetch all ATK categories.
- `POST /api/categories`: Create a new category.
- `PUT /api/categories/:id`: Update category details.
- `DELETE /api/categories/:id`: Delete category (nullifying relations).
- `GET /api/products`: Retrieve product list with query parameters:
  - `q`: Search keyword across name and barcode.
  - `barcode`: Exact barcode/SKU match for rapid POS lookup.
  - `categoryId`: Filter by category ID.
  - `lowStock`: Boolean (`true`) to fetch items with `stock <= minStock`.
  - `page` & `limit`: Pagination parameters.
- `POST /api/products`: Add a single new ATK product.
- `PUT /api/products/:id`: Update product pricing, category, and minimum stock threshold.
- `POST /api/products/:id/adjust-stock`: Add/reduce quantity with notes recorded in `StockMovement`.
- `DELETE /api/products/:id`: Soft delete / delete product.

### 4.2 Excel & CSV Import / Export / Template
- `GET /api/products/template`: Generate and download a formatted Excel/CSV file with predefined columns:
  `[Barcode, Nama Produk, Kategori, Harga Beli, Harga Jual, Stok, Minimal Stok, Satuan]` and populated with sample rows.
- `POST /api/products/import`: Accepts `multipart/form-data` with `.xlsx` or `.csv` file.
  - Reads and validates each row.
  - If barcode/name already exists: Updates price, increases `stock` by the imported quantity, logs `StockMovement` as `IN_IMPORT`.
  - If new: Creates category if missing, inserts `Product`, logs initial stock in `StockMovement`.
  - Returns summary: `{ totalRows, importedCount, updatedCount, errors: [] }`.
- `GET /api/products/export`: Exports the current product inventory table into Excel (.xlsx) or CSV.

### 4.3 Transactions & Cashier Checkout
- `POST /api/transactions`: Process customer purchase with payload:
  ```json
  {
    "cashierName": "Kasir 1",
    "paymentMethod": "CASH",
    "amountPaid": 50000,
    "discountAmount": 0,
    "notes": "",
    "items": [
      { "productId": 1, "quantity": 2, "price": 5000, "costPrice": 3500 },
      { "productId": 3, "quantity": 1, "price": 15000, "costPrice": 12000 }
    ]
  }
  ```
  - **Prisma Interactive Transaction Execution:**
    1. Reads fresh stock for all requested `productId`s from MySQL.
    2. Validates `availableStock >= item.quantity`. If insufficient, throws `400 Bad Request` with exact item names and remaining stock.
    3. Calculates `totalAmount = sum(price * qty)`, `finalAmount = totalAmount - discountAmount`.
    4. Validates `amountPaid >= finalAmount` for `CASH` payments and calculates `changeAmount = amountPaid - finalAmount`.
    5. Generates unique incremental invoice number: `INV-YYYYMMDD-XXXX`.
    6. Creates `Transaction` and `TransactionItem` records.
    7. Atomically decrements `Product.stock` by item quantities.
    8. Records `StockMovement` entries with `type: "OUT_SALE"`.
  - Returns complete transaction receipt payload.
- `GET /api/transactions`: Transaction history with date range filtering (`startDate`, `endDate`), payment method filter, and pagination.
- `GET /api/transactions/:id`: Retrieve single transaction with all items and store profile for receipt reprint.

### 4.4 Dashboard & Reports
- `GET /api/reports/dashboard`:
  - `metrics`: Today sales, this month revenue, total transactions count, low stock count.
  - `salesTrend`: Daily sales array (last 7 or 30 days) with date, total revenue, and transaction count.
  - `topSelling`: Top 5-10 ATK products by total sold quantity.
  - `categoryDistribution`: Revenue breakdown per category.
  - `lowStockProducts`: Array of products needing restock.
- `GET /api/reports/sales`: Detailed sales report rows by date range.
- `GET /api/reports/export/excel`: Export sales summary and details to Excel file.
- `GET /api/reports/export/pdf`: Official PDF report generation containing store letterhead, summary stats, and transaction itemization.

### 4.5 Store Settings
- `GET /api/settings`: Get current store name, address, phone, and receipt footer message.
- `PUT /api/settings`: Update store profile settings.

---

## 5. Frontend User Interface & Flow

### 5.1 POS Cashier Page (`/pos`)
- **Fast Product Code Barcode Search Bar:**
  - Auto-focused input at the top.
  - Typing a product barcode or name and hitting `Enter` immediately adds the item to the cart or increments its quantity if already present.
- **Category Filter Tabs:**
  - Quick pills: *Semua*, *Alat Tulis*, *Kertas & Buku*, *Map & Dokumen*, *Peralatan Kantor*, *Pewarna*.
- **Product Card Grid:**
  - Responsive cards with clear title, unit, price, and visual Stock Badges:
    - `Green Badge`: In stock (> minStock)
    - `Yellow Badge`: Low stock (<= minStock)
    - `Red Badge / Disabled`: Out of stock (0 stock)
- **Active Order Cart (Right Panel):**
  - Item list showing name, unit price, quantity stepper `[-] [qty] [+]`, and line subtotal.
  - Live stock limits: Stepper prevents setting quantity higher than available stock.
  - Discount input and instant real-time Grand Total calculation.
  - Payment calculation bar:
    - Payment Method Selector (CASH / QRIS / TRANSFER).
    - Quick Cash preset buttons (`Uang Pas`, `10.000`, `20.000`, `50.000`, `100.000`).
    - Real-time Change calculation (`Kembalian: Rp ...`).
    - Checkout Button (Disabled when cart is empty or amount paid < total).
- **Checkout Success & Receipt Modal:**
  - Realistic thermal paper preview with store name, invoice number, item breakdown, total, paid, change, and footer note.
  - Actions: **Cetak Struk (Print Thermal / Browser Print)**, **Unduh Nota PDF**, and **Transaksi Baru** (clears cart and refocuses input).

### 5.2 Inventory Management Page (`/inventory`)
- **Header Action Bar:**
  - Search input with debounce.
  - Category dropdown filter and "Hanya Stok Menipis" toggle.
  - Action buttons: `+ Tambah Produk`, `Unduh Template (.xlsx/.csv)`, `Import Excel/CSV`, `Export Excel/CSV`.
- **Fast Responsive DataTable:**
  - Columns: Barcode/Kode, Nama Barang, Kategori, Harga Beli, Harga Jual, Stok, Min. Stok, Satuan, Status, Aksi.
  - Actions per row: `Quick Restock` (+), `Edit`, `Hapus`.
- **Modals:**
  - **Product Form Modal:** Validated inputs for all product fields.
  - **Quick Restock Modal:** Minimalist popup to quickly add +X units with optional notes.
  - **Import Excel Modal:** Drag-and-drop file upload, data preview table showing detected rows with validation status, and "Proses Import" button.

### 5.3 Dashboard Analytics Page (`/dashboard`)
- **Top Row KPI Cards:**
  - Omset Hari Ini (with % change from yesterday).
  - Omset Bulan Ini.
  - Total Transaksi Bulan Ini.
  - Peringatan Stok Menipis (click to view low stock list).
- **Interactive Recharts Visualizations:**
  - **Grafik Tren Penjualan:** Smooth Area/Line Chart displaying daily sales revenue over the past 7/30 days.
  - **Grafik Produk ATK Terlaris:** Horizontal Bar Chart ranking top selling stationery items.
  - **Diagram Pangsa Kategori:** Donut Pie Chart showing revenue share across categories.
- **Tabel Peringatan Restock:** Quick table listing critical items with current stock and quick restock shortcut.

### 5.4 Reports & Sales History Page (`/reports`)
- Date range picker (Hari Ini, 7 Hari Terakhir, Bulan Ini, Custom Range).
- Summary cards: Total Omset, Total Item Terjual, Estimasi Laba Kotor.
- Detailed transaction log table.
- Buttons for **"Export Excel (.xlsx)"** and **"Cetak Laporan PDF"**.

---

## 6. Validation, Error Handling & Data Integrity

1. **Frontend Validation:**
   - Real-time cart constraints: item quantity cannot exceed current product stock.
   - Form field validations: Positive numbers for prices and stocks, required fields flagged.
   - Double-submit prevention: Checkout and import submit buttons disabled during network requests with visual spinner.
2. **Backend Concurrency & Transaction Safety:**
   - Checkout uses `prisma.$transaction` with re-verification of product stock levels right before saving.
   - If stock falls short, transaction is safely aborted and returns an informative HTTP 400 error message.
   - All stock changes (Sales, Manual Restock, Import) automatically append structured records to `StockMovement` for transparent audit trails.
3. **File Import Validation:**
   - Files are validated for MIME type (`.xlsx`, `.xls`, `.csv`).
   - Empty or corrupted rows are parsed with line-by-line error reports without crashing the server.

---

## 7. Verification & Testing Strategy

1. **API Testing:**
   - Unit and integration tests for calculation logic, checkout transaction safety, and stock mutation.
   - Import/Export testing with sample ATK Excel and CSV datasets.
2. **End-to-End User Flow Verification:**
   - Complete checkout cycle: Search item by code -> Add to cart -> Apply discount -> Pay with cash -> Print receipt -> Verify stock decrement.
   - Restock cycle: Download template -> Modify quantities -> Upload import -> Verify stock increment and audit log.
   - Reporting verification: Ensure Dashboard metrics match recorded transactions and PDF generation renders properly.
