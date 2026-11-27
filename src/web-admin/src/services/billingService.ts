import api from './api';
import { Invoice } from '../types';

export interface PaymentQrPublicConfig {
  environment: string;
  isSandbox: boolean;
  bankCode: string;
  bankBin: string;
  accountNumber: string;
  accountName: string;
  paymentPrefix: string;
  isConfigured: boolean;
}

export interface SepayDiscrepancyLog {
  sepayTransactionId: number;
  transferAmount: number;
  expectedAmount?: number;
  discrepancyAmount?: number;
  processingStatus: string;
  note?: string;
  receivedAt: string;
}

export interface BillingStatusSummary {
  billingId: string;
  paymentCode: string;
  billingType: string;
  totalAmount: number;
  status: string; // Unpaid | Paid | Cancelled
  trangThai: string;
  paymentMethod?: string;
  transactionRef?: string;
  discrepancyNote?: string;
  paidAt?: string;
  appointmentId?: string;
  vietQrUrl?: string;
  environment: string;
  isSandbox: boolean;
  recentWebhookEvents: SepayDiscrepancyLog[];
}

export const billingService = {
  getBillings: async (status?: string, type?: string): Promise<Invoice[]> => {
    const response = await api.get('/billing', {
      params: { status: status === 'ALL' ? undefined : status, type: type === 'ALL' ? undefined : type },
    });
    return Array.isArray(response.data) ? response.data : [];
  },

  getBillingStatus: async (id: string): Promise<BillingStatusSummary> => {
    const response = await api.get<BillingStatusSummary>(`/billing/${id}/status`);
    return response.data;
  },

  getPublicQrConfig: async (): Promise<PaymentQrPublicConfig> => {
    const response = await api.get<PaymentQrPublicConfig>('/payment/qr-config');
    return response.data;
  },

  payCash: async (id: string): Promise<any> => {
    const response = await api.post(`/billing/${id}/pay-cash`);
    return response.data;
  },

  payTransfer: async (id: string, transactionRef: string): Promise<any> => {
    const cleanRef = (transactionRef || '').trim();
    if (cleanRef.length < 6) {
      throw new Error('Vui lòng nhập mã giao dịch / mã chuẩn chi ngân hàng (tối thiểu 6 ký tự) để đối soát.');
    }
    const response = await api.post(`/billing/${id}/pay-transfer`, null, {
      params: { transactionRef: cleanRef },
    });
    return response.data;
  },
};
