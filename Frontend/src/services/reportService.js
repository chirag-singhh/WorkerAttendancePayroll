import api from './api';

export const reportService = {
  monthly: (params) => api.get('/attendance/report/monthly', { params }),
  grandTotal: (params) => api.get('/attendance/report/grand-total', { params }),
  exportExcel: (params) => {
    const query = new URLSearchParams(params).toString();
    const url = `http://localhost:5000/api/attendance/export/excel${query ? `?${query}` : ''}`;
    window.open(url, '_blank');
  },
};
