import api from './api';

export const attendanceService = {
  getAll: (params) => api.get('/attendance', { params }),
  getByWorker: (workerId) => api.get(`/attendance/worker/${workerId}`),
  create: (data) => api.post('/attendance', data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
  monthlyReport: (params) => api.get('/attendance/report/monthly', { params }),
  grandTotal: (params) => api.get('/attendance/report/grand-total', { params }),
  // exportExcel: (params) => {
  //   // Build query string
  //   const query = new URLSearchParams(params).toString();
  //   const url = `/attendance/export/excel${query ? `?${query}` : ''}`;
  //   window.open(url, '_blank');
  // },
  exportExcel: async (params) => {

  try {

    const response = await api.get(
      '/attendance/export/excel',
      {
        params,
        responseType: 'blob',
      }
    );

    const fileURL = window.URL.createObjectURL(
      new Blob([response.data])
    );

    const link = document.createElement('a');

    link.href = fileURL;

    link.setAttribute(
      'download',
      'attendance-payroll.xlsx'
    );

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(fileURL);

  } catch (error) {

    console.error(error);

  }

},
};
