import React from 'react';

export default function MetricCard({ title, value, subtitle, icon: Icon, trend, color = 'emerald' }) {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200/80',
      iconBg: 'bg-emerald-600',
      text: 'text-emerald-700',
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200/80',
      iconBg: 'bg-blue-600',
      text: 'text-blue-700',
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200/80',
      iconBg: 'bg-amber-600',
      text: 'text-amber-700',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200/80',
      iconBg: 'bg-purple-600',
      text: 'text-purple-700',
    },
    rose: {
      bg: 'bg-rose-50',
      border: 'border-rose-200/80',
      iconBg: 'bg-rose-600',
      text: 'text-rose-700',
    },
  };

  const scheme = colorMap[color] || colorMap.emerald;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
          <div className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight">{value}</div>
        </div>
        <div className={`w-11 h-11 rounded-2xl ${scheme.iconBg} text-white flex items-center justify-center shadow-md shadow-${color}-600/20 flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>{subtitle}</span>
        {trend && (
          <span className={`font-bold ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.label}
          </span>
        )}
      </div>
    </div>
  );
}
