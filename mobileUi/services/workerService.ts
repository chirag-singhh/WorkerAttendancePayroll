import api from './api';

export const workerService = {
  getAll: (locationId) =>
    api.get('/worker', { params: locationId ? { locationId } : {} }),
  create: (data) => api.post('/worker', data),
  update: (id, data) => api.put(`/worker/${id}`, data),
  delete: (id) => api.delete(`/worker/${id}`),
  toggleStatus: (id) => api.patch(`/worker/${id}/status`),
};
