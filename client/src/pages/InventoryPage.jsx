import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/common/DataTable';
import { StockBadge } from '../components/common/Badge';
import ProductFormModal from '../components/inventory/ProductFormModal';
import QuickRestockModal from '../components/inventory/QuickRestockModal';
import ImportModal from '../components/inventory/ImportModal';
import { productService } from '../services/productService';
import { formatCurrency } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import {
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  Edit2,
  Trash2,
  PlusCircle,
  Filter,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const toast = useToast();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productService.getAllProductsForPos(),
        productService.getCategories(),
      ]);

      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      toast.error('Gagal mengambil data inventaris: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (product) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus "${product.name}" dari katalog?`)) {
      try {
        await productService.deleteProduct(product.id);
        toast.success(`Produk "${product.name}" berhasil dihapus.`);
        fetchProducts();
      } catch (err) {
        toast.error(err.message || 'Gagal menghapus produk.');
      }
    }
  };

  // Filtered by Category and Low Stock toggle
  const filteredData = products.filter((p) => {
    if (selectedCategory && p.categoryId !== parseInt(selectedCategory, 10)) {
      return false;
    }
    if (onlyLowStock && p.stock > p.minStock) {
      return false;
    }
    return true;
  });

  const columns = [
    {
      header: 'Kode / Barcode',
      accessor: 'barcode',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-slate-500 font-medium">
          {row.barcode || '-'}
        </span>
      ),
    },
    {
      header: 'Nama Produk ATK',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900 leading-snug">{row.name}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Satuan: {row.unit}</div>
        </div>
      ),
    },
    {
      header: 'Kategori',
      accessor: (row) => row.category?.name || 'Umum',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
          {row.category?.name || 'Umum'}
        </span>
      ),
    },
    {
      header: 'Harga Modal',
      accessor: 'buyPrice',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="font-medium text-slate-600">{formatCurrency(row.buyPrice)}</span>
      ),
    },
    {
      header: 'Harga Jual',
      accessor: 'sellPrice',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="font-bold text-emerald-700">{formatCurrency(row.sellPrice)}</span>
      ),
    },
    {
      header: 'Persediaan Stok',
      accessor: 'stock',
      sortable: true,
      align: 'center',
      render: (row) => (
        <StockBadge stock={row.stock} minStock={row.minStock} unit={row.unit} />
      ),
    },
    {
      header: 'Aksi',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => {
              setRestockProduct(row);
              setIsRestockOpen(true);
            }}
            title="Restock Cepat"
            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setEditingProduct(row);
              setIsFormOpen(true);
            }}
            title="Edit Data Produk"
            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            title="Hapus Produk"
            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Inventaris & Stok ATK</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola katalog barang, pantau persediaan, dan gunakan import/export data.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setIsFormOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Import / Restock File</span>
          </button>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs">
            <a
              href={productService.getExportUrl('xlsx')}
              download
              title="Download Seluruh Data ke Excel (.xlsx)"
              className="px-3 py-1.5 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export Excel</span>
            </a>
            <a
              href={productService.getExportUrl('csv')}
              download
              title="Download Data ke CSV"
              className="px-2 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg text-xs font-semibold"
            >
              CSV
            </a>
          </div>
        </div>
      </div>

      {/* Main DataTable Card */}
      <DataTable
        columns={columns}
        data={filteredData}
        searchPlaceholder="Cari nama barang ATK atau barcode..."
        emptyMessage="Tidak ada data barang yang cocok."
        filterSlot={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category select filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Low stock filter toggle */}
            <button
              type="button"
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                onlyLowStock
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Hanya Stok Menipis</span>
            </button>
          </div>
        }
      />

      {/* Modals */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        categories={categories}
        onSuccess={fetchProducts}
      />

      <QuickRestockModal
        isOpen={isRestockOpen}
        onClose={() => {
          setIsRestockOpen(false);
          setRestockProduct(null);
        }}
        product={restockProduct}
        onSuccess={fetchProducts}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={fetchProducts}
      />
    </div>
  );
}
