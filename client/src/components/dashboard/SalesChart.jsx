import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
        <p className="font-bold text-slate-200 mb-1">{label}</p>
        <p className="text-emerald-400 font-extrabold text-sm">
          {formatCurrency(payload[0].value)}
        </p>
        {payload[0].payload.transactions !== undefined && (
          <p className="text-slate-400 mt-0.5">
            {payload[0].payload.transactions} Transaksi
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function SalesChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
        Belum ada data penjualan.
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="salesColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#16a34a"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#salesColor)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
