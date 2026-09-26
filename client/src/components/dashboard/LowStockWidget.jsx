import React from 'react';
import { AlertTriangle, PlusCircle, CheckCircle } from 'lucide-react';
import { StockBadge } from '../common/Badge';

export default function LowStockWidget({ products, onQuickRestock }) {
  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
          <CheckCircle className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold text-slate-900">Semua Stok Aman</h4>
        <p className="text-xs text-slate-500 mt-0.5">Tidak ada barang ATK dengan stok menipis saat ini.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/40">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Peringatan Stok Menipis</h3>
            <span className="text-[11px] text-slate-500">{products.length} barang butuh restock segera</span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
        {products.map((p) => (
          <div key={p.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="min-w-0 pr-2">
              <h4 className="text-xs font-bold text-slate-900 truncate">{p.name}</h4>
              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                <span>Kategori: {p.category?.name || 'ATK'}</span>
                <span>•</span>
                <span>Batas Min: {p.minStock} {p.unit}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <StockBadge stock={p.stock} minStock={p.minStock} unit={p.unit} />
              <button
                type="button"
                onClick={() => onQuickRestock(p)}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 transition-colors border border-emerald-200"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Restock</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
