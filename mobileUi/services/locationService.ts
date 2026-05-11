import api from './api';

export const locationService = {
  getAll: () => api.get('/location'),
  create: (data) => api.post('/location', data),
  update: (id, data) => api.put(`/location/${id}`, data),
  delete: (id) => api.delete(`/location/${id}`),
};
