import React from 'react';
import { Plus, Tag, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { StockBadge } from '../common/Badge';
import { useCart } from '../../context/CartContext';

export default function ProductGrid({ products, loading }) {
  const { addToCart, cartItems } = useCart();

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse h-36 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="h-3.5 bg-slate-200 rounded-md w-3/4"></div>
              <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
            </div>
            <div className="h-4 bg-slate-200 rounded-md w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800">Tidak ada produk ditemukan</h4>
        <p className="text-xs text-slate-500 mt-1">Coba ganti kata kunci pencarian atau filter kategori.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[calc(100vh-290px)] overflow-y-auto pr-1">
      {products.map((product) => {
        const isOutOfStock = product.stock <= 0;
        const inCartItem = cartItems.find((i) => i.product.id === product.id);
        const inCartQty = inCartItem ? inCartItem.quantity : 0;

        return (
          <button
            key={product.id}
            onClick={() => !isOutOfStock && addToCart(product, 1)}
            disabled={isOutOfStock}
            className={`group text-left p-3.5 bg-white rounded-2xl border transition-all duration-150 flex flex-col justify-between relative overflow-hidden ${
              isOutOfStock
                ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                : inCartQty > 0
                ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-sm hover:shadow-md'
                : 'border-slate-200 hover:border-emerald-500 hover:shadow-md'
            }`}
          >
            {/* Top Indicator */}
            <div>
              <div className="flex items-start justify-between gap-1.5 mb-1.5">
                <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 uppercase tracking-wider truncate">
                  <Tag className="w-3 h-3 text-slate-400" />
                  {product.category?.name || 'ATK'}
                </span>
                {inCartQty > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold">
                    {inCartQty}x di keranjang
                  </span>
                )}
              </div>

              <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                {product.name}
              </h3>

              {product.barcode && (
                <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                  #{product.barcode}
                </div>
              )}
            </div>

            {/* Bottom Price & Stock Info */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-end justify-between">
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                  {formatCurrency(product.sellPrice)}
                </div>
                <div className="text-[10px] text-slate-400">/ {product.unit}</div>
              </div>

              <StockBadge stock={product.stock} minStock={product.minStock} unit={product.unit} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
