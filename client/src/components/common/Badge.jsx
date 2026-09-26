import React from 'react';

export function StockBadge({ stock, minStock = 5, unit = 'pcs' }) {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-pulse"></span>
        Habis (0 {unit})
      </span>
    );
  }

  if (stock <= minStock) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
        Menipis ({stock} {unit})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
      {stock} {unit}
    </span>
  );
}

export function PaymentBadge({ method }) {
  const normalized = (method || 'CASH').toUpperCase();
  const styles = {
    CASH: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    QRIS: 'bg-blue-50 text-blue-700 border-blue-200',
    TRANSFER: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[normalized] || styles.CASH}`}>
      {normalized}
    </span>
  );
}
