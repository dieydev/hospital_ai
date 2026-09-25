import api from './api';

export interface DepartmentItem {
  id: string;
  departmentName: string;
  location: string;
  roomType: string;
}

export interface QueueTicketItem {
  id: string;
  patientId: string;
  patientCode: string;
  patientName: string;
  patientGender: string;
  patientAge: number;
  identityCardNumber: string;
  healthInsuranceNumber?: string;
  departmentId: string;
  departmentName: string;
  location: string;
  sequenceNumber: number;
  status: 'Waiting' | 'Calling' | 'Processing' | 'Skipped' | 'Finished';
  priority: 'Normal' | 'Priority' | 'Emergency';
  createdAt: string;
}

export interface IssueTicketParams {
  patientId: string;
  departmentId: string;
  priority?: 'Normal' | 'Priority' | 'Emergency';
  patientName?: string;
  patientCode?: string;
  patientAge?: number;
  patientGender?: string;
}



export const localQueueTickets: QueueTicketItem[] = [
  {
    id: 'ticket-101',
    patientId: '276-15f20b4ed6be',
    patientCode: 'BN20260013',
    patientName: 'Phan Thu Thảo',
    patientGender: 'Nữ',
    patientAge: 16,
    identityCardNumber: '079110000013',
    healthInsuranceNumber: 'TE4010123450013',
    departmentId: 'dept-01',
    departmentName: 'Khoa Nội Tổng Hợp',
    location: 'Phòng 102 - Tầng 1',
    sequenceNumber: 101,
    status: 'Calling',
    priority: 'Normal',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ticket-102',
    patientId: '87bc141d-e026',
    patientCode: 'BN20260003',
    patientName: 'Lê Hoàng Minh',
    patientGender: 'Nam',
    patientAge: 34,
    identityCardNumber: '079092000003',
    healthInsuranceNumber: 'DN4010123450003',
    departmentId: 'dept-01',
    departmentName: 'Khoa Nội Tổng Hợp',
    location: 'Phòng 102 - Tầng 1',
    sequenceNumber: 102,
    status: 'Waiting',
    priority: 'Normal',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ticket-103',
    patientId: '682f492e-58a9',
    patientCode: 'BN20260002',
    patientName: 'Nguyễn Thị Thu',
    patientGender: 'Nữ',
    patientAge: 41,
    identityCardNumber: '079185000002',
    healthInsuranceNumber: 'DN4010123450002',
    departmentId: 'dept-01',
    departmentName: 'Khoa Nội Tổng Hợp',
    location: 'Phòng 102 - Tầng 1',
    sequenceNumber: 103,
    status: 'Waiting',
    priority: 'Priority',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ticket-104',
    patientId: 'fcbea75a-4767',
    patientCode: 'BN20260020',
    patientName: 'Tạ Quang Bửu',
    patientGender: 'Nam',
    patientAge: 81,
    identityCardNumber: '079045000020',
    healthInsuranceNumber: 'HT4010123450020',
    departmentId: 'dept-01',
    departmentName: 'Khoa Nội Tổng Hợp',
    location: 'Phòng 102 - Tầng 1',
    sequenceNumber: 104,
    status: 'Waiting',
    priority: 'Emergency',
    createdAt: new Date().toISOString(),
  },
];

export const queueService = {
  async getDepartments(): Promise<DepartmentItem[]> {
    const response = await api.get('/queue/departments');
    return response.data || [];
  },

  async getTodayQueue(departmentId?: string, status?: string): Promise<QueueTicketItem[]> {
    const response = await api.get('/queue', {
      params: { departmentId, status },
    });
    return response.data || [];
  },

  async issueQueueTicket(params: IssueTicketParams): Promise<QueueTicketItem> {
    const response = await api.post('/queue/issue', params);
    return response.data;
  },

  async updateQueueTicketStatus(ticketId: string, status: string): Promise<QueueTicketItem> {
    const response = await api.put(`/queue/${ticketId}/status`, { status });
    return response.data;
  },

  async callNextPatient(departmentId: string): Promise<QueueTicketItem | null> {
    const response = await api.post(`/queue/departments/${departmentId}/call-next`);
    return response.data;
  },
};
