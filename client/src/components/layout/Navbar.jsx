import React, { useState, useEffect } from 'react';
import { ShoppingCart, Store, Clock } from 'lucide-react';
import { settingService } from '../../services/settingService';

export default function Navbar({ activeTab, setActiveTab }) {
  const [storeName, setStoreName] = useState('Toko ATK Maju Jaya');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    settingService.getSettings().then((res) => {
      if (res.data?.name) {
        setStoreName(res.data.name);
      }
    }).catch(() => {});

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Store Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none flex items-center gap-2">
                {storeName}
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  POS ATK
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Sistem Kasir & Inventaris Alat Tulis Kantor</p>
            </div>
          </div>

          {/* Real-time Clock & Status */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/70">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {currentTime.toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                - {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
