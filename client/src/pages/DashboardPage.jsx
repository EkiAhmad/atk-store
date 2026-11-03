import React, { useState, useEffect, useCallback } from 'react';
import MetricCard from '../components/dashboard/MetricCard';
import SalesChart from '../components/dashboard/SalesChart';
import TopSellingChart from '../components/dashboard/TopSellingChart';
import CategoryPieChart from '../components/dashboard/CategoryPieChart';
import LowStockWidget from '../components/dashboard/LowStockWidget';
import QuickRestockModal from '../components/inventory/QuickRestockModal';
import { reportService } from '../services/reportService';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Package,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restockProduct, setRestockProduct] = useState(null);
  const [isRestockOpen, setIsRestockOpen] = useState(false);

  const toast = useToast();

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportService.getDashboardAnalytics();
      setAnalytics(res.data);
    } catch (err) {
      toast.error('Gagal memuat statistik dashboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const kpis = analytics?.kpis || {};
  const todayGrowth =
    kpis.yesterdayRevenue > 0
      ? (((kpis.todayRevenue - kpis.yesterdayRevenue) / kpis.yesterdayRevenue) * 100).toFixed(0)
      : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Dashboard & Statistik ATK</h2>
          <p className="text-xs text-slate-500 mt-0.5">Ringkasan performa penjualan dan kesehatan persediaan toko.</p>
        </div>
        <button
          type="button"
          onClick={fetchAnalytics}
          className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          <span className="hidden sm:inline">Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Omset Hari Ini"
          value={formatCurrency(kpis.todayRevenue || 0)}
          subtitle={`${kpis.todayTransactionsCount || 0} transaksi berhasil`}
          icon={DollarSign}
          color="emerald"
          trend={
            todayGrowth !== null
              ? {
                  positive: Number(todayGrowth) >= 0,
                  label: `${Number(todayGrowth) >= 0 ? '+' : ''}${todayGrowth}% vs kemarin`,
                }
              : null
          }
        />

        <MetricCard
          title="Omset Bulan Ini"
          value={formatCurrency(kpis.monthRevenue || 0)}
          subtitle={`${kpis.monthTransactionsCount || 0} transaksi bulan ini`}
          icon={TrendingUp}
          color="blue"
        />

        <MetricCard
          title="Total Produk Aktif"
          value={`${formatNumber(kpis.totalProducts || 0)} Item`}
          subtitle="Katalog barang terdaftar"
          icon={Package}
          color="purple"
        />

        <MetricCard
          title="Stok Menipis"
          value={`${kpis.lowStockCount || 0} Barang`}
          subtitle="Perlu kulakan / restock segera"
          icon={AlertTriangle}
          color={kpis.lowStockCount > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Trend Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Grafik Penjualan 7 Hari Terakhir</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tren omset penjualan harian</p>
            </div>
          </div>
          <SalesChart data={analytics?.salesTrend || []} />
        </div>

        {/* Category Pie Chart (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-900">Sebaran Kategori ATK</h3>
            <p className="text-xs text-slate-500 mt-0.5">Komposisi jumlah produk per kategori</p>
          </div>
          <CategoryPieChart data={analytics?.categoryDistribution || []} />
        </div>
      </div>

      {/* Bottom Row: Top Selling ATK & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Selling Products (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Produk ATK Terlaris</h3>
              <p className="text-xs text-slate-500 mt-0.5">Berdasarkan akumulasi kuantitas penjualan sepanjang waktu</p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
              Sepanjang Waktu
            </span>
          </div>
          <TopSellingChart data={analytics?.topSelling || []} />
        </div>

        {/* Low Stock Warning List (5 cols) */}
        <div className="lg:col-span-5">
          <LowStockWidget
            products={analytics?.lowStockProducts || []}
            onQuickRestock={(product) => {
              setRestockProduct(product);
              setIsRestockOpen(true);
            }}
          />
        </div>
      </div>

      {/* Quick Restock Modal */}
      <QuickRestockModal
        isOpen={isRestockOpen}
        onClose={() => {
          setIsRestockOpen(false);
          setRestockProduct(null);
        }}
        product={restockProduct}
        onSuccess={fetchAnalytics}
      />
    </div>
  );
}
