import React, { useState, useRef, useEffect } from 'react';
import { Search, CornerDownLeft, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

export default function BarcodeSearchInput({ products, onSelectProduct }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const { addToCart } = useCart();
  const toast = useToast();

  useEffect(() => {
    // Autofocus input on page mount
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = query.trim().toLowerCase();
      if (!trimmed) return;

      // 1. Check exact barcode match first
      let matched = products.find((p) => p.barcode && p.barcode.toLowerCase() === trimmed);

      // 2. Check exact name match or first partial match
      if (!matched) {
        matched = products.find((p) => p.name.toLowerCase() === trimmed);
      }
      if (!matched) {
        matched = products.find((p) => p.name.toLowerCase().includes(trimmed) || (p.barcode && p.barcode.toLowerCase().includes(trimmed)));
      }

      if (matched) {
        if (matched.stock <= 0) {
          toast.error(`Stok "${matched.name}" habis (0 ${matched.unit})!`);
        } else {
          addToCart(matched, 1);
          setQuery('');
        }
      } else {
        toast.warning(`Barang dengan kode/nama "${query}" tidak ditemukan.`);
      }
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSelectProduct?.(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ketik kode barcode / nama barang ATK lalu tekan Enter..."
          className="w-full pl-11 pr-24 py-3 bg-white text-slate-900 placeholder:text-slate-400 text-sm font-medium rounded-2xl border-2 border-emerald-500/30 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 shadow-sm transition-all"
        />
        <div className="absolute right-3 flex items-center space-x-1 px-2 py-1 bg-slate-100 rounded-lg text-slate-500 text-xs font-semibold select-none">
          <CornerDownLeft className="w-3.5 h-3.5" />
          <span>Enter</span>
        </div>
      </div>
      <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5 px-1">
        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
        <span>Tips: Ketik barcode / nama ATK dan tekan <strong>Enter</strong> untuk langsung masuk keranjang.</span>
      </div>
    </div>
  );
}
