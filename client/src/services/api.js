import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('atk_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for clean error extracting
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Sesi habis
      localStorage.removeItem('atk_token');
      localStorage.removeItem('atk_user');
    }
    const customMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan pada sistem.';
    return Promise.reject(new Error(customMessage));
  }
);

export default api;
