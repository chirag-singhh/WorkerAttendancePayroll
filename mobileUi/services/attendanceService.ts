import api from './api';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export const attendanceService = {
  getAll: (params) => api.get('/attendance', { params }),
  getByWorker: (workerId) => api.get(`/attendance/worker/${workerId}`),
  create: (data) => api.post('/attendance', data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
  monthlyReport: (params) => api.get('/attendance/report/monthly', { params }),
  grandTotal: (params) => api.get('/attendance/report/grand-total', { params }),
  exportExcel: async (params: any) => {
    try {
      const response = await api.get('/attendance/export/excel', {
        params,
        responseType: 'blob',
      });

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = (reader.result as string).split(',')[1];
            const filename = `Attendance_${Date.now()}.xlsx`;
            const file = new File(Paths.document, filename);
            file.write(base64Data, { encoding: 'base64' });

            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
              await Sharing.shareAsync(file.uri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Download Excel File'
              });
            } else {
              alert('Sharing not available on this device');
            }
            resolve(true);
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(response.data);
      });
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  },
};
