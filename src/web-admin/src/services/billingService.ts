import api from './api';
import { Invoice } from '../types';

export const billingService = {
  getBillings: async (status?: string, type?: string): Promise<Invoice[]> => {
    const response = await api.get('/billing', {
      params: { status, type }
    });
    return response.data;
  },

  payCash: async (id: string): Promise<any> => {
    const response = await api.post(`/billing/${id}/pay-cash`);
    return response.data;
  }
};
