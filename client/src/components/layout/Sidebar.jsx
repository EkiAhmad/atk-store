import React from 'react';
import { ShoppingBag, Package, LayoutDashboard, FileText, Settings } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { totalItemsCount } = useCart();

  const navItems = [
    {
      id: 'pos',
      label: 'Kasir (POS)',
      icon: ShoppingBag,
      badge: totalItemsCount > 0 ? totalItemsCount : null,
      desc: 'Transaksi Cepat & Struk',
    },
    {
      id: 'inventory',
      label: 'Inventaris ATK',
      icon: Package,
      desc: 'Kelola Barang, Stok & Excel',
    },
    {
      id: 'dashboard',
      label: 'Dashboard & Grafik',
      icon: LayoutDashboard,
      desc: 'Analitik & Statistik Penjualan',
    },
    {
      id: 'reports',
      label: 'Laporan Penjualan',
      icon: FileText,
      desc: 'Rekap Transaksi & PDF',
    },
    {
      id: 'settings',
      label: 'Pengaturan Toko',
      icon: Settings,
      desc: 'Profil & Keterangan Struk',
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col justify-between">
      <nav className="p-3 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-600/30'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <div className="truncate">
                  <div className="text-sm leading-tight truncate">{item.label}</div>
                  <div className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {item.desc}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span
                  className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                    isActive ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info in Sidebar */}
      <div className="p-4 border-t border-slate-100 hidden md:block">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 text-center">
          <div className="text-xs font-semibold text-slate-700">Toko ATK POS v1.0</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Database: MySQL Ready</div>
        </div>
      </div>
    </aside>
  );
}
