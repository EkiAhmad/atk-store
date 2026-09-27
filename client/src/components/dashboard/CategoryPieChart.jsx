import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#9333ea', '#0891b2', '#e11d48'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
        <p className="font-bold text-slate-100">{item.name}</p>
        <p className="text-emerald-400 font-extrabold mt-0.5">{item.productCount} Produk</p>
        <p className="text-slate-400">Total Stok Fisik: {item.totalStock} unit</p>
      </div>
    );
  }
  return null;
};

function CustomLegend({ data }) {
  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-1 text-center">
      {data.map((item, index) => (
        <div
          key={item.name}
          className="flex items-center gap-2 min-w-0 max-w-full px-1"
          style={{ maxWidth: 'calc(50% - 0.5rem)' }}
        >
          <span
            className="h-2.5 w-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
          />
          <span className="text-[11px] font-medium text-slate-600 truncate">{item.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function CategoryPieChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
        Belum ada data kategori.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto h-56 max-w-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={82}
              paddingAngle={4}
              dataKey="productCount"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <CustomLegend data={data} />
    </div>
  );
}
