import React from 'react';
import { Layers } from 'lucide-react';

export default function CategoryTabs({ categories, selectedCategory, onSelectCategory }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onSelectCategory(null)}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
          selectedCategory === null
            ? 'bg-slate-900 text-white shadow-sm'
            : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        <span>Semua Kategori</span>
      </button>

      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              isSelected
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
