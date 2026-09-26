import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { productService } from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import { Loader2, Plus, Save } from 'lucide-react';

export default function ProductFormModal({ isOpen, onClose, product, categories, onSuccess }) {
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    categoryId: '',
    buyPrice: '',
    sellPrice: '',
    stock: '',
    minStock: '5',
    unit: 'pcs',
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const isEditing = Boolean(product);

  useEffect(() => {
    if (product) {
      setFormData({
        barcode: product.barcode || '',
        name: product.name || '',
        categoryId: product.categoryId ? String(product.categoryId) : '',
        buyPrice: product.buyPrice ? String(product.buyPrice) : '',
        sellPrice: product.sellPrice ? String(product.sellPrice) : '',
        stock: product.stock !== undefined ? String(product.stock) : '0',
        minStock: product.minStock !== undefined ? String(product.minStock) : '5',
        unit: product.unit || 'pcs',
      });
    } else {
      setFormData({
        barcode: '',
        name: '',
        categoryId: categories[0]?.id ? String(categories[0].id) : '',
        buyPrice: '',
        sellPrice: '',
        stock: '10',
        minStock: '5',
        unit: 'pcs',
      });
    }
  }, [product, categories, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Nama produk ATK wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        barcode: formData.barcode ? formData.barcode.trim() : null,
        name: formData.name.trim(),
        categoryId: formData.categoryId ? parseInt(formData.categoryId, 10) : null,
        buyPrice: parseFloat(formData.buyPrice) || 0,
        sellPrice: parseFloat(formData.sellPrice) || 0,
        stock: parseInt(formData.stock, 10) || 0,
        minStock: parseInt(formData.minStock, 10) || 5,
        unit: formData.unit.trim() || 'pcs',
      };

      if (isEditing) {
        await productService.updateProduct(product.id, payload);
        toast.success(`Produk "${payload.name}" berhasil diperbarui.`);
      } else {
        await productService.createProduct(payload);
        toast.success(`Produk baru "${payload.name}" berhasil ditambahkan.`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan produk.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Data Produk ATK' : 'Tambah Produk ATK Baru'}
      subtitle="Isi informasi detail barang, harga, dan kuantitas stok"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Barcode / Code */}
          <div>
            <label className="text-xs font-bold text-slate-700">Kode / Barcode Barang</label>
            <input
              type="text"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              placeholder="Contoh: 8993175537012 / ATK-001"
              className="w-full mt-1 px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold text-slate-700">Kategori ATK</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Pilih Kategori...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Name */}
        <div>
          <label className="text-xs font-bold text-slate-700">Nama Produk ATK *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: Buku Tulis Sinar Dunia 38 Lembar"
            className="w-full mt-1 px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800"
          />
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700">Harga Beli / Modal (Rp)</label>
            <div className="relative mt-1">
              <span className="text-xs text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 font-bold">Rp</span>
              <input
                type="number"
                min="0"
                value={formData.buyPrice}
                onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                placeholder="0"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Harga Jual (Rp) *</label>
            <div className="relative mt-1">
              <span className="text-xs text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 font-bold">Rp</span>
              <input
                type="number"
                min="0"
                required
                value={formData.sellPrice}
                onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                placeholder="0"
                className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-emerald-700"
              />
            </div>
          </div>
        </div>

        {/* Stock & Unit */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700">{isEditing ? 'Stok Saat Ini' : 'Stok Awal'}</label>
            <input
              type="number"
              min="0"
              disabled={isEditing}
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-xs bg-white disabled:bg-slate-100 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
            />
            {isEditing && <span className="text-[10px] text-slate-400">Gunakan tombol restock</span>}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Minimal Stok</label>
            <input
              type="number"
              min="0"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Satuan</label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="pcs / rim / pack"
              className="w-full mt-1 px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Simpan Perubahan' : 'Tambah Produk'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
