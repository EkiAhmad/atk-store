import api from './api';

export const reportService = {
  getDashboardAnalytics: () => api.get('/reports/dashboard'),
  getSalesReport: (params) => api.get('/reports/sales', { params }),
  getExportExcelUrl: (params) => {
    const query = new URLSearchParams(params).toString();
    return `/api/reports/export/excel?${query}`;
  },
};
