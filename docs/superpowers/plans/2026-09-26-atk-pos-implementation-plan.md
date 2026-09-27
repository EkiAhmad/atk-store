# Implementation Plan: Web App Kasir Toko ATK (Point of Sale System)

**Date:** 2026-09-26  
**Design Spec:** [docs/superpowers/specs/2026-09-26-atk-pos-system-design.md](file:///c:/Users/thinkpad/Documents/Project/atk-store/docs/superpowers/specs/2026-09-26-atk-pos-system-design.md)  
**Stack:** React (Vite) + Tailwind CSS + Node.js (Express) + Prisma ORM + MySQL

---

## Plan Overview

This plan details the step-by-step development process to implement the complete ATK POS web application from scratch.

---

## Phase 1: Project Scaffolding & Backend Setup

### Task 1: Project Structure & Backend Foundation
- Initialize root monorepo structure: `server/` and `client/`.
- Initialize `server/package.json` with dependencies:
  - `express`, `cors`, `dotenv`, `multer`, `xlsx`, `jspdf`, `jspdf-autotable`, `mysql2`, `@prisma/client`
  - Dev dependencies: `prisma`, `nodemon`
- Configure Express server entry point (`server/src/index.js`, `server/src/app.js`), error handling middlewares, and route loader.

### Task 2: Prisma Database Setup & Seed Data
- Create `server/prisma/schema.prisma` containing models: `Category`, `Product`, `Transaction`, `TransactionItem`, `StockMovement`, `StoreSetting`.
- Configure `.env` with MySQL connection string (e.g. `mysql://root:@localhost:3306/atk_pos_db`).
- Create `server/prisma/seed.js` with comprehensive initial data:
  - Standard ATK categories (Alat Tulis, Kertas & Buku, Map & Folder, Perlengkapan Kantor, Pewarna & Cat).
  - 15+ realistic ATK products (Pulpen Standard AE7, Buku Tulis Sinar Dunia 38 lbr, Kertas HVS A4 70gr PaperOne, Map Snellhecter, Penggaris Besi 30cm, Tipp-Ex Joyko, Binder Clip No. 107, etc.).
  - Default Store Settings ("Toko ATK Maju Jaya").
- Run Prisma migration and seed database.

---

## Phase 2: Backend API & File Processing

### Task 3: Category & Product API Modules
- Implement `categoryController.js` and `categoryRoutes.js` (CRUD).
- Implement `productController.js` and `productRoutes.js`:
  - Instant search (`q`), exact barcode query (`barcode`), category filter (`categoryId`), low-stock filter (`lowStock`).
  - Product CRUD.
  - `POST /api/products/:id/adjust-stock` for manual quick stock adjustments with `StockMovement` logging.

### Task 4: Excel/CSV Import, Export & Template Module
- Implement `importExportService.js`:
  - `GET /api/products/template`: Generate and download structured `.xlsx` and `.csv` templates with sample rows & column guidance.
  - `POST /api/products/import`: Process uploaded file with validation. Automatically detects existing barcode/name to perform restock vs register new products, while recording mutation logs.
  - `GET /api/products/export`: Stream current inventory to Excel/CSV.

### Task 5: Transaction & POS Checkout Module
- Implement `transactionService.js` and `transactionController.js`:
  - `POST /api/transactions`: Execute atomic `prisma.$transaction`:
    - Re-fetch and lock product rows to verify stock adequacy.
    - Abort with clear 400 error if any item is out-of-stock.
    - Create `Transaction` and `TransactionItem`s.
    - Decrement `Product.stock`.
    - Create `StockMovement` entries (`type: "OUT_SALE"`).
  - `GET /api/transactions`: Paginated transaction list with date and search filters.
  - `GET /api/transactions/:id`: Retrieve single receipt data.

### Task 6: Reports, Analytics & Store Settings Module
- Implement `reportController.js`:
  - `GET /api/reports/dashboard`: Summary KPI metrics, daily/weekly revenue trend, top selling ATK items, category distribution.
  - `GET /api/reports/sales`: Filtered sales breakdown with profit calculation.
  - `GET /api/reports/export/excel`: Export sales recap to Excel.
- Implement `settingController.js` for store profile.

---

## Phase 3: Frontend Client Development

### Task 7: Frontend Scaffolding & Setup
- Initialize `client/` using Vite React.
- Install & configure Tailwind CSS, `lucide-react`, `recharts`, `axios`, `jspdf`, `jspdf-autotable`, `xlsx`.
- Set up routing (`react-router-dom`), layout shell (Navbar, Sidebar, Toast/Notification Container), and Axios API client (`client/src/services/api.js`).

### Task 8: POS Cashier Interface (`/pos`)
- **Product Search & Catalog Panel:**
  - Fast barcode/manual code text input with autofocus and Enter-to-cart.
  - Category filter pills.
  - Product grid with visual stock badges (Green: In Stock, Yellow: Low Stock, Red: Out of Stock).
- **Cart & Payment Panel:**
  - Real-time cart table with quantity stepper bounded strictly by available stock.
  - Subtotal, discount input, and grand total.
  - Payment method selector (Cash, QRIS, Transfer).
  - Cash payment denomination shortcuts (`Uang Pas`, `10k`, `20k`, `50k`, `100k`) and live change display.
  - Checkout button with loading state prevention.
- **Receipt & Print Modal:**
  - Realistic 58mm/80mm thermal receipt preview.
  - Instant thermal print / browser print styling.
  - Direct PDF receipt download.

### Task 9: Inventory Management & Responsive DataTable (`/inventory`)
- Fast Responsive DataTable component with debounce instant search, category filter, and low-stock toggle.
- `ProductFormModal` (Add/Edit ATK product with real-time validation).
- `QuickRestockModal` (Quick +X stock adjustment).
- `ImportModal` with drag-and-drop file upload, data preview, row validation errors, and bulk submit.
- Direct buttons to download template (.xlsx / .csv) and export inventory data.

### Task 10: Dashboard Analytics & Visualizations (`/dashboard`)
- KPI Summary Cards (Today Sales, Monthly Sales, Total Transactions, Low Stock Warning).
- **Recharts Visualizations:**
  - Area/Line Chart: Sales trend over time.
  - Horizontal Bar Chart: Top 5/10 best-selling ATK products.
  - Donut Chart: Sales revenue by category.
- Low-stock critical alert table with quick restock shortcut.

### Task 11: Sales Reports & Official PDF Export (`/reports`)
- Date range picker (Hari Ini, 7 Hari Terakhir, Bulan Ini, Custom Range).
- Sales summary metrics (Gross sales, item counts, profit estimation).
- Transaction history table with modal receipt viewer.
- **Export to Excel (.xlsx)** and **Official PDF Report Generator** (complete with store letterhead and summary tables).

### Task 12: Store Settings & Profile (`/settings`)
- Form to customize store name, address, phone number, and receipt footer message.

---

## Phase 4: Integration, Testing & Verification

### Task 13: End-to-End Verification & Verification Matrix
- Verify backend API error handling and stock transaction rollback on insufficient stock.
- Verify manual code entry and Enter-key cart insertion.
- Verify checkout flow and thermal receipt printing.
- Verify Excel/CSV template download, editing, and smart import (restock + create new).
- Verify dashboard charts and PDF report generation.
- Ensure build succeeds (`npm run build` on client and server).
