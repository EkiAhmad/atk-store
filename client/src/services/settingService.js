import api from './api';

export const settingService = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
};
