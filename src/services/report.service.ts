import api from './api';

export const reportService = {
  downloadInvoicePdf: async (invoiceId: number): Promise<Blob> => {
    const response = await api.get(`/api/v1/reports/invoices/${invoiceId}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  downloadMemberCarnetPdf: async (memberId: string): Promise<Blob> => {
    const response = await api.get(`/api/v1/reports/members/${memberId}/carnet-pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  downloadAttendanceReportPdf: async (params?: { memberId?: string; branchId?: number }): Promise<Blob> => {
    const response = await api.get('/api/v1/reports/attendances/pdf', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  triggerDownload: (blob: Blob, filename: string): void => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
