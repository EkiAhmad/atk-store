import api from './api';

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

  // Import / Export / Template URLs
  getTemplateUrl: () => '/api/products/template',
  getCsvTemplateUrl: () => '/api/products/template-csv',
  getExportUrl: (format = 'xlsx') => `/api/products/export?format=${format}`,
  importFile: (formData) =>
    api.post('/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
