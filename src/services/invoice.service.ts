import api from './api';
import {
  ApiResponse,
  CreateInvoiceRequest,
  CreatePaymentMethodRequest,
  CreatePaymentReceiptRequest,
  InvoiceResponse,
  InvoiceStatus,
  PageResponse,
  PaymentMethodResponse,
  PaymentReceiptResponse,
  UpdatePaymentMethodRequest,
} from '@/types';

export const invoiceService = {
  // Invoices
  getAll: async (params?: {
    page?: number;
    size?: number;
    status?: InvoiceStatus;
    branchId?: number;
    memberId?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<PageResponse<InvoiceResponse>> => {
    const response = await api.get<ApiResponse<PageResponse<InvoiceResponse>>>('/api/v1/invoices', {
      params,
    });
    return response.data.data;
  },

  getMy: async (): Promise<InvoiceResponse[]> => {
    const response = await api.get<ApiResponse<InvoiceResponse[]>>('/api/v1/invoices/my');
    return response.data.data;
  },

  getById: async (id: number): Promise<InvoiceResponse> => {
    const response = await api.get<ApiResponse<InvoiceResponse>>(`/api/v1/invoices/${id}`);
    return response.data.data;
  },

  getPayments: async (id: number): Promise<PaymentReceiptResponse[]> => {
    const response = await api.get<ApiResponse<PaymentReceiptResponse[]>>(`/api/v1/invoices/${id}/payments`);
    return response.data.data;
  },

  create: async (data: CreateInvoiceRequest): Promise<InvoiceResponse> => {
    const response = await api.post<ApiResponse<InvoiceResponse>>('/api/v1/invoices', data);
    return response.data.data;
  },

  cancel: async (id: number): Promise<InvoiceResponse> => {
    const response = await api.post<ApiResponse<InvoiceResponse>>(`/api/v1/invoices/${id}/cancel`);
    return response.data.data;
  },

  // Payment Receipts
  getReceipts: async (params?: {
    page?: number;
    size?: number;
    invoiceId?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<PageResponse<PaymentReceiptResponse>> => {
    const response = await api.get<ApiResponse<PageResponse<PaymentReceiptResponse>>>('/api/v1/payment-receipts', {
      params,
    });
    return response.data.data;
  },

  getReceiptById: async (id: number): Promise<PaymentReceiptResponse> => {
    const response = await api.get<ApiResponse<PaymentReceiptResponse>>(`/api/v1/payment-receipts/${id}`);
    return response.data.data;
  },

  createReceipt: async (data: CreatePaymentReceiptRequest): Promise<PaymentReceiptResponse> => {
    const response = await api.post<ApiResponse<PaymentReceiptResponse>>('/api/v1/payment-receipts', data);
    return response.data.data;
  },

  // Payment Methods
  getPaymentMethods: async (): Promise<PaymentMethodResponse[]> => {
    const response = await api.get<ApiResponse<PaymentMethodResponse[]>>('/api/v1/payment-methods');
    return response.data.data;
  },

  createPaymentMethod: async (data: CreatePaymentMethodRequest): Promise<PaymentMethodResponse> => {
    const response = await api.post<ApiResponse<PaymentMethodResponse>>('/api/v1/payment-methods', data);
    return response.data.data;
  },

  updatePaymentMethod: async (id: number, data: UpdatePaymentMethodRequest): Promise<PaymentMethodResponse> => {
    const response = await api.put<ApiResponse<PaymentMethodResponse>>(`/api/v1/payment-methods/${id}`, data);
    return response.data.data;
  },

  deletePaymentMethod: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/payment-methods/${id}`);
  },
};
