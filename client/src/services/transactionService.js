import api from './api';

export const transactionService = {
  createTransaction: (data) => api.post('/transactions', data),
  getTransactions: (params) => api.get('/transactions', { params }),
  getTransactionById: (id) => api.get(`/transactions/${id}`),
};
