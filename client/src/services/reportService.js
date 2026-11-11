import api from './api';
import { downloadFile } from '../utils/fileDownloader';

export const reportService = {
  getDashboardAnalytics: () => api.get('/reports/dashboard'),
  getSalesReport: (params) => api.get('/reports/sales', { params }),

  // Download langsung dengan Authorization header
  exportSalesExcel: (params) => {
    const cleanParams = {};
    if (params) {
      if (params.startDate && params.startDate !== 'undefined') cleanParams.startDate = params.startDate;
      if (params.endDate && params.endDate !== 'undefined') cleanParams.endDate = params.endDate;
    }
    const query = new URLSearchParams(cleanParams).toString();
    const url = query ? `/api/reports/export/excel?${query}` : '/api/reports/export/excel';
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return downloadFile(url, `Laporan_Penjualan_ATK_${dateStr}.xlsx`);
  },

  // Fallback URL jika digunakan via tag <a>
  getExportExcelUrl: (params) => {
    const cleanParams = {};
    if (params) {
      if (params.startDate && params.startDate !== 'undefined') cleanParams.startDate = params.startDate;
      if (params.endDate && params.endDate !== 'undefined') cleanParams.endDate = params.endDate;
    }
    const query = new URLSearchParams(cleanParams);
    const token = localStorage.getItem('atk_token');
    if (token) {
      query.set('token', token);
    }
    return `/api/reports/export/excel?${query.toString()}`;
  },
};
