import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#9333ea', '#0891b2', '#e11d48', '#4f46e5'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
        <p className="font-bold text-slate-100">{item.name}</p>
        <p className="text-emerald-400 font-extrabold text-sm mt-1">
          {formatNumber(item.totalQuantity)} terjual
        </p>
        <p className="text-slate-400 mt-0.5">
          Total Omset: {formatCurrency(item.totalRevenue)}
        </p>
      </div>
    );
  }
  return null;
};

export default function TopSellingChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
        Belum ada data barang terjual.
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            width={120}
            tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
            tickFormatter={(name) => (name.length > 16 ? `${name.substring(0, 16)}...` : name)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="totalQuantity" radius={[0, 8, 8, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
