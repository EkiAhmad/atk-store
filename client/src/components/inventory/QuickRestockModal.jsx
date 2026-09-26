import React, { useState } from 'react';
import Modal from '../common/Modal';
import { productService } from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import { Loader2, PlusCircle, ArrowUpRight } from 'lucide-react';
import { StockBadge } from '../common/Badge';

export default function QuickRestockModal({ isOpen, onClose, product, onSuccess }) {
  const [quantity, setQuantity] = useState('10');
  const [notes, setNotes] = useState('Restock barang masuk');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  if (!product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      toast.error('Jumlah restock harus lebih dari 0.');
      return;
    }

    setLoading(true);
    try {
      await productService.adjustStock(product.id, {
        quantity: qty,
        type: 'IN_PURCHASE',
        notes: notes.trim() || 'Restock barang masuk',
      });

      toast.success(`Berhasil menambah +${qty} ${product.unit} untuk "${product.name}".`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Gagal menambah stok.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Restock Cepat Barang ATK"
      subtitle={`Tambah persediaan stok untuk ${product.name}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Stock Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Stok Saat Ini</span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {product.stock} <span className="text-xs font-normal text-slate-500">/ {product.unit}</span>
            </div>
          </div>
          <StockBadge stock={product.stock} minStock={product.minStock} unit={product.unit} />
        </div>

        {/* Quantity to add */}
        <div>
          <label className="text-xs font-bold text-slate-700">Jumlah Barang Masuk (+Qty) *</label>
          <div className="relative mt-1">
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 text-sm font-bold text-emerald-700 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              autoFocus
            />
          </div>
          {/* Quick presets */}
          <div className="flex gap-1.5 mt-2">
            {[5, 10, 20, 50, 100].map((num) => (
              <button
                type="button"
                key={num}
                onClick={() => setQuantity(String(num))}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                +{num}
              </button>
            ))}
          </div>
        </div>

        {/* Stock Log Note */}
        <div>
          <label className="text-xs font-bold text-slate-700">Catatan Mutasi Masuk</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Kulakan dari supplier A / barang datang"
            className="w-full mt-1 px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Tambahkan ke Stok</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
