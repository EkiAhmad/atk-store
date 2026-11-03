import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/common/DataTable';
import { PaymentBadge } from '../components/common/Badge';
import ReceiptModal from '../components/pos/ReceiptModal';
import { reportService } from '../services/reportService';
import { transactionService } from '../services/transactionService';
import { settingService } from '../services/settingService';
import { formatCurrency, formatDateTime, toLocalDateString } from '../utils/formatters';
import { generateSalesReportPdf } from '../utils/pdfExport';
import { useToast } from '../context/ToastContext';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Eye,
  Filter,
} from 'lucide-react';

export default function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilterType, setDateFilterType] = useState('month'); // today, 7days, month, all, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [storeInfo, setStoreInfo] = useState(null);

  // Receipt Modal
  const [viewTransaction, setViewTransaction] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const toast = useToast();

  const getDateRange = useCallback(() => {
    const now = new Date();
    const todayStr = toLocalDateString(now);

    if (dateFilterType === 'today') {
      return { startDate: todayStr, endDate: todayStr, label: 'Hari Ini' };
    }
    if (dateFilterType === '7days') {
      const past = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      return {
        startDate: toLocalDateString(past),
        endDate: todayStr,
        label: '7 Hari Terakhir',
      };
    }
    if (dateFilterType === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: toLocalDateString(startOfMonth),
        endDate: todayStr,
        label: 'Bulan Ini',
      };
    }
    if (dateFilterType === 'custom') {
      return {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        label: `${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}`,
      };
    }
    return { startDate: undefined, endDate: undefined, label: 'Semua Waktu' };
  }, [dateFilterType, startDate, endDate]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const range = getDateRange();
      const params = {};
      if (range.startDate) params.startDate = range.startDate;
      if (range.endDate) params.endDate = range.endDate;

      const [repRes, setRes] = await Promise.all([
        reportService.getSalesReport(params),
        settingService.getSettings(),
      ]);

      setReportData(repRes.data);
      setStoreInfo(setRes.data);
    } catch (err) {
      toast.error('Gagal memuat laporan penjualan: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [getDateRange, toast]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExportPdf = () => {
    if (!reportData || !reportData.transactions.length) {
      toast.warning('Tidak ada data transaksi untuk diekspor.');
      return;
    }

    const range = getDateRange();
    generateSalesReportPdf({
      store: storeInfo,
      summary: reportData.summary,
      transactions: reportData.transactions,
      dateRangeLabel: range.label,
    });
    toast.success('Laporan PDF berhasil diunduh!');
  };

  const handleViewReceipt = async (transaction) => {
    try {
      const res = await transactionService.getTransactionById(transaction.id);
      setViewTransaction(res.data);
      setIsReceiptOpen(true);
    } catch (err) {
      toast.error('Gagal mengambil rincian transaksi: ' + err.message);
    }
  };

  const summary = reportData?.summary || {
    totalTransactions: 0,
    totalRevenue: 0,
    grossProfit: 0,
    totalItemsSold: 0,
    profitMargin: 0,
  };

  const transactions = reportData?.transactions || [];

  const columns = [
    {
      header: 'No. Invoice',
      accessor: 'invoiceNumber',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-900">{row.invoiceNumber}</span>
      ),
    },
    {
      header: 'Tanggal & Waktu',
      accessor: 'date',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-600">{formatDateTime(row.date)}</span>
      ),
    },
    {
      header: 'Kasir',
      accessor: 'cashierName',
      sortable: true,
    },
    {
      header: 'Metode',
      accessor: 'paymentMethod',
      sortable: true,
      align: 'center',
      render: (row) => <PaymentBadge method={row.paymentMethod} />,
    },
    {
      header: 'Item',
      accessor: (row) => (row.items ? row.items.reduce((s, i) => s + i.quantity, 0) : 0),
      sortable: true,
      align: 'center',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700">
          {row.items ? row.items.reduce((s, i) => s + i.quantity, 0) : 0} pcs
        </span>
      ),
    },
    {
      header: 'Total Akhir',
      accessor: 'finalAmount',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="text-xs font-extrabold text-emerald-700">
          {formatCurrency(row.finalAmount)}
        </span>
      ),
    },
    {
      header: 'Aksi',
      align: 'center',
      render: (row) => (
        <button
          onClick={() => handleViewReceipt(row)}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold"
          title="Lihat Struk Nota"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Lihat Nota</span>
        </button>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Date Range Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Laporan & Rekap Penjualan</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis riwayat transaksi, margin laba, dan cetak laporan resmi.
          </p>
        </div>

        {/* Date Filters & Exports */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Pills */}
          <div className="bg-white border border-slate-200 rounded-xl p-1 flex items-center gap-1 shadow-xs">
            {[
              { id: 'today', label: 'Hari Ini' },
              { id: '7days', label: '7 Hari' },
              { id: 'month', label: 'Bulan Ini' },
              { id: 'all', label: 'Semua' },
              { id: 'custom', label: 'Kustom' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDateFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dateFilterType === tab.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          {dateFilterType === 'custom' && (
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none"
              />
              <span className="text-xs text-slate-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          )}

          {/* Export Buttons */}
          <a
            href={reportService.getExportExcelUrl(getDateRange())}
            download
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </a>

          <button
            type="button"
            onClick={handleExportPdf}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-rose-600/20"
          >
            <FileText className="w-4 h-4" />
            <span>Cetak PDF Resmi</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Omset Penjualan</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {formatCurrency(summary.totalRevenue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summary.totalTransactions} transaksi tercatat
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimasi Laba Bersih</span>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {formatCurrency(summary.grossProfit)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Margin: <strong>{summary.profitMargin}%</strong> dari total penjualan
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Item ATK Terjual</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {summary.totalItemsSold} Pcs
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Kuantitas fisik barang keluar</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Potongan Diskon</span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {formatCurrency(summary.totalDiscount)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Potongan harga promo diberikan</div>
        </div>
      </div>

      {/* Transactions DataTable */}
      <DataTable
        columns={columns}
        data={transactions}
        searchPlaceholder="Cari nomor faktur / invoice atau nama kasir..."
        emptyMessage="Tidak ada transaksi yang ditemukan pada rentang tanggal ini."
      />

      {/* Struk Reprint Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={viewTransaction}
        store={storeInfo}
      />
    </div>
  );
}
