import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('atk_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('atk_token'));
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Verify stored session on boot
  useEffect(() => {
    if (token) {
      authService
        .getMe()
        .then((res) => {
          if (res.data) {
            setUser(res.data);
            localStorage.setItem('atk_user', JSON.stringify(res.data));
          }
        })
        .catch(() => {
          // Token expired
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    try {
      const res = await authService.login({ username, password });
      const { token: newToken, user: newUser } = res;

      localStorage.setItem('atk_token', newToken);
      localStorage.setItem('atk_user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
      toast.success(res.message || `Selamat datang, ${newUser.name}!`);
      return true;
    } catch (err) {
      toast.error(err.message || 'Login gagal.');
      return false;
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('atk_token');
    localStorage.removeItem('atk_user');
    setToken(null);
    setUser(null);
    toast.info('Anda telah berhasil keluar (logout).');
  }, [toast]);

  const isAdmin = user?.role === 'ADMIN';
  const isKasir = user?.role === 'KASIR';
  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        isKasir,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
