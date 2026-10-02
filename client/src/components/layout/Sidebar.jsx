import React from 'react';
import { ShoppingBag, Package, LayoutDashboard, FileText, Settings, ShieldCheck, UserCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { totalItemsCount } = useCart();
  const { user, isAdmin, isKasir } = useAuth();

  const allNavItems = [
    {
      id: 'pos',
      label: 'Kasir (POS)',
      icon: ShoppingBag,
      badge: totalItemsCount > 0 ? totalItemsCount : null,
      desc: 'Transaksi Cepat & Struk',
      roles: ['ADMIN', 'KASIR'],
    },
    {
      id: 'inventory',
      label: 'Inventaris ATK',
      icon: Package,
      desc: 'Kelola Barang, Stok & Excel',
      roles: ['ADMIN'],
    },
    {
      id: 'dashboard',
      label: 'Dashboard & Grafik',
      icon: LayoutDashboard,
      desc: 'Analitik & Statistik Penjualan',
      roles: ['ADMIN'],
    },
    {
      id: 'reports',
      label: 'Laporan Penjualan',
      icon: FileText,
      desc: 'Rekap Transaksi & PDF',
      roles: ['ADMIN'],
    },
    {
      id: 'settings',
      label: 'Pengaturan Toko',
      icon: Settings,
      desc: 'Profil & Keterangan Struk',
      roles: ['ADMIN'],
    },
  ];

  // Filter menu items by user role
  const allowedNavItems = allNavItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col justify-between">
      <nav className="p-3 space-y-1.5">
        {allowedNavItems.map((item) => {
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

      {/* Footer Info in Sidebar with Active User Card */}
      <div className="p-3 border-t border-slate-100 hidden md:block space-y-2">
        {user && (
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/60 flex items-center space-x-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 ${isAdmin ? 'bg-purple-600' : 'bg-blue-600'}`}>
              {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">{user.name}</div>
              <div className="text-[10px] text-slate-500 truncate">
                Role: <strong>{user.role}</strong>
              </div>
            </div>
          </div>
        )}

        <div className="text-center text-[10px] text-slate-400">
          POS ATK v1.1 • MySQL & Winston Logs
        </div>
      </div>
    </aside>
  );
}
