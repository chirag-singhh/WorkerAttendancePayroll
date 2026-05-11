import api from './api';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export const reportService = {
  monthly: (params) => api.get('/attendance/report/monthly', { params }),
  grandTotal: (params) => api.get('/attendance/report/grand-total', { params }),
  exportExcel: async (params: any) => {
    try {
      // Download file directly as arraybuffer
      const response = await api.get('/attendance/export/excel', {
        params,
        responseType: 'arraybuffer',
      });
      
      // Convert to base64 safely
      const binary = Array.from(
        new Uint8Array(response.data),
        (byte) => String.fromCharCode(byte)
      ).join('');
      const base64Data = global.btoa(binary);

      // File path using new SDK 54 Paths
      const filename = `Payroll_Report_${Date.now()}.xlsx`;
      const file = new File(Paths.document, filename);

      // Save file synchronously
      file.write(base64Data, { encoding: 'base64' });

      // Share / Download
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Download Payroll Report'
        });
      } else {
        alert('Sharing not available on this device');
      }
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  },
};
