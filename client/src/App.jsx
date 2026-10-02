import React, { useState, useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import POSPage from './pages/POSPage';
import InventoryPage from './pages/InventoryPage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

function MainApp() {
  const { isAuthenticated, isKasir, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('pos');

  // If user is kasir, ensure they always stay on 'pos'
  useEffect(() => {
    if (isKasir && activeTab !== 'pos') {
      setActiveTab('pos');
    }
  }, [isKasir, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-xs font-semibold text-slate-300">Memuat Sistem POS Toko ATK...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Body with Sidebar and Main Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-64px)] bg-slate-100">
          {activeTab === 'pos' && <POSPage />}
          {isAdmin && activeTab === 'inventory' && <InventoryPage />}
          {isAdmin && activeTab === 'dashboard' && <DashboardPage />}
          {isAdmin && activeTab === 'reports' && <ReportsPage />}
          {isAdmin && activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <MainApp />
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
