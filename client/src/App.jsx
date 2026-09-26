import React, { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import POSPage from './pages/POSPage';
import InventoryPage from './pages/InventoryPage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';

export default function App() {
  const [activeTab, setActiveTab] = useState('pos');

  return (
    <ToastProvider>
      <CartProvider>
        <div className="min-h-screen bg-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
          {/* Top Bar */}
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Body with Sidebar and Main Content */}
          <div className="flex-1 flex flex-col md:flex-row">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Main Content Area */}
            <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-64px)] bg-slate-100">
              {activeTab === 'pos' && <POSPage />}
              {activeTab === 'inventory' && <InventoryPage />}
              {activeTab === 'dashboard' && <DashboardPage />}
              {activeTab === 'reports' && <ReportsPage />}
              {activeTab === 'settings' && <SettingsPage />}
            </main>
          </div>
        </div>
      </CartProvider>
    </ToastProvider>
  );
}
