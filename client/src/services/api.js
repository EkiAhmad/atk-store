import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for clear error extracting
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan pada sistem.';
    return Promise.reject(new Error(customMessage));
  }
);

export default api;
