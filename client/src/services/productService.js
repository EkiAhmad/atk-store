import api from './api';
import { downloadFile } from '../utils/fileDownloader';

export const productService = {
  // Categories
  getCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),

  // Products
  getProducts: (params) => api.get('/products', { params }),
  getAllProductsForPos: () => api.get('/products', { params: { all: true, isActive: true } }),
  getProductByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  adjustStock: (id, data) => api.post(`/products/${id}/adjust-stock`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),

  // File Downloads (mengirim Authorization Bearer token otomatis)
  downloadTemplate: () => downloadFile('/api/products/template', 'Template_Import_ATK.xlsx'),
  downloadCsvTemplate: () => downloadFile('/api/products/template-csv', 'Template_Import_ATK.csv'),
  exportProducts: (format = 'xlsx', categoryId = null) => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const catQuery = categoryId ? `&categoryId=${encodeURIComponent(categoryId)}` : '';
    return downloadFile(
      `/api/products/export?format=${format}${catQuery}`,
      `Inventaris_ATK_${dateStr}.${format}`
    );
  },

  // URL fallback dengan token query parameter jika diakses melalui link browser
  getTemplateUrl: () => {
    const token = localStorage.getItem('atk_token');
    return token ? `/api/products/template?token=${encodeURIComponent(token)}` : '/api/products/template';
  },
  getCsvTemplateUrl: () => {
    const token = localStorage.getItem('atk_token');
    return token ? `/api/products/template-csv?token=${encodeURIComponent(token)}` : '/api/products/template-csv';
  },
  getExportUrl: (format = 'xlsx') => {
    const token = localStorage.getItem('atk_token');
    const base = `/api/products/export?format=${format}`;
    return token ? `${base}&token=${encodeURIComponent(token)}` : base;
  },

  importFile: (formData) =>
    api.post('/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
