import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Percent, Tag, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';

export default function CartPanel({ onOpenPaymentModal }) {
  const { user } = useAuth();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    discountAmount,
    setDiscountAmount,
    finalTotal,
    totalItemsCount,
    cashierName,
    setCashierName,
  } = useCart();

  const [showDiscountInput, setShowDiscountInput] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setCashierName(user.name);
    }
  }, [user?.name, setCashierName]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-100px)] sticky top-20">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-none">Keranjang Pesanan</h2>
            <span className="text-[11px] text-slate-500">{totalItemsCount} item terpilih</span>
          </div>
        </div>

        {cartItems.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Kosongkan</span>
          </button>
        )}
      </div>

      {/* Cashier input */}
      <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2 text-xs">
        <User className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-500">Kasir:</span>
        <input
          type="text"
          value={cashierName}
          onChange={(e) => setCashierName(e.target.value)}
          className="bg-transparent font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded px-1 flex-1 text-xs"
        />
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
        {cartItems.length > 0 ? (
          cartItems.map((item) => (
            <div key={item.product.id} className="pt-3 first:pt-0 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">{item.product.name}</h4>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <span>{formatCurrency(item.product.sellPrice)}</span>
                  <span>/ {item.product.unit}</span>
                </div>
                <div className="text-xs font-bold text-emerald-600 mt-1">
                  {formatCurrency(item.subtotal)}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="w-6 h-6 rounded-lg bg-white text-slate-700 shadow-xs flex items-center justify-center hover:bg-slate-50 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={item.product.stock}
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.product.id, e.target.value)}
                  className="w-9 text-center bg-transparent text-xs font-extrabold text-slate-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  disabled={item.quantity >= item.product.stock}
                  className="w-6 h-6 rounded-lg bg-white text-slate-700 shadow-xs flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeFromCart(item.product.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <p className="text-xs font-medium text-slate-500">Keranjang masih kosong</p>
            <p className="text-[11px] text-slate-400">Pilih barang dari katalog atau scan/ketik barcode.</p>
          </div>
        )}
      </div>

      {/* Calculation & Payment Area */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl space-y-3">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
        </div>

        {/* Discount Toggle / Input */}
        <div>
          {showDiscountInput ? (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="text-xs text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 font-bold">Rp</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Math.min(subtotal, Math.max(0, parseFloat(e.target.value) || 0)))}
                  placeholder="0"
                  className="w-full pl-8 pr-2 py-1 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setDiscountAmount(0);
                  setShowDiscountInput(false);
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800"
              >
                Batal
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setShowDiscountInput(true)}
                className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>+ Tambah Diskon Potongan</span>
              </button>
              {discountAmount > 0 && (
                <span className="font-semibold text-rose-600">-{formatCurrency(discountAmount)}</span>
              )}
            </div>
          )}
        </div>

        {/* Final Total */}
        <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tagihan</div>
            <div className="text-[11px] text-slate-400">Termasuk seluruh item</div>
          </div>
          <div className="text-xl font-extrabold text-emerald-700">
            {formatCurrency(finalTotal)}
          </div>
        </div>

        {/* Pay Button */}
        <button
          type="button"
          onClick={onOpenPaymentModal}
          disabled={cartItems.length === 0}
          className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all transform active:scale-[0.98]"
        >
          <span>Bayar & Cetak Struk</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
