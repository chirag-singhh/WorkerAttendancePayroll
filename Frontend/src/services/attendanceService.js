import api from './api';

export const attendanceService = {
  getAll: (params) => api.get('/attendance', { params }),
  getByWorker: (workerId) => api.get(`/attendance/worker/${workerId}`),
  create: (data) => api.post('/attendance', data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
  monthlyReport: (params) => api.get('/attendance/report/monthly', { params }),
  grandTotal: (params) => api.get('/attendance/report/grand-total', { params }),
  exportExcel: (params) => {
    // Build query string
    const query = new URLSearchParams(params).toString();
    const url = `http://localhost:5000/api/attendance/export/excel${query ? `?${query}` : ''}`;
    window.open(url, '_blank');
  },
};
