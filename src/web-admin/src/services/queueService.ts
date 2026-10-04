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

export const localDepartments: DepartmentItem[] = [
  { id: '2bcb7d9a-516f-4fee-9193-ae23d6b5f18b', departmentName: 'Khoa Nội Tổng Hợp', location: 'Phòng 102 - Tầng 1', roomType: 'Clinical' },
  { id: 'c91bbc0e-b42d-4311-829f-de6d39625c94', departmentName: 'Khoa Cấp Cứu & Hồi Sức', location: 'Tầng Trệt - Khu A', roomType: 'Emergency' },
  { id: '4eba02e1-c180-4833-81c6-8ae21630ede9', departmentName: 'Khoa Ngoại Tổng Quát', location: 'Phòng 401 - Tầng 4', roomType: 'Clinical' },
  { id: 'fa656d64-6e18-42d5-a539-0db61903e637', departmentName: 'Khoa Nhi', location: 'Phòng 105 - Tầng 1', roomType: 'Clinical' },
  { id: 'ef69baca-b6af-467c-859f-86f25ccf5443', departmentName: 'Khoa Tim Mạch', location: 'Phòng 301 - Tầng 3', roomType: 'Clinical' },
];

export const queueService = {
  async getDepartments(): Promise<DepartmentItem[]> {
    try {
      const response = await api.get('/queue/departments');
      if (response.data && response.data.length > 0) {
        return response.data;
      }
      return localDepartments;
    } catch (err) {
      console.warn('⚡ [queueService] getDepartments API failed, fallback to localDepartments:', err);
      return localDepartments;
    }
  },

  async getTodayQueue(departmentId?: string, status?: string): Promise<QueueTicketItem[]> {
    try {
      const response = await api.get('/queue', {
        params: { departmentId, status },
      });
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      return localQueueTickets;
    } catch (err) {
      console.warn('⚡ [queueService] getTodayQueue API failed, fallback to localQueueTickets:', err);
      let list = [...localQueueTickets];
      if (departmentId) {
        list = list.filter((t) => t.departmentId === departmentId);
      }
      if (status) {
        list = list.filter((t) => t.status === status);
      }
      return list;
    }
  },

  async issueQueueTicket(params: IssueTicketParams): Promise<QueueTicketItem> {
    try {
      const response = await api.post('/queue/issue', params);
      return response.data;
    } catch (err) {
      console.warn('⚡ [queueService] issueQueueTicket API failed, generating local fallback ticket:', err);
      const newSeq = localQueueTickets.length + 101;
      const dept = localDepartments.find((d) => d.id === params.departmentId) || localDepartments[0];
      const fallbackTicket: QueueTicketItem = {
        id: `ticket-${Date.now()}`,
        patientId: params.patientId,
        patientCode: params.patientCode || `BN2026${String(newSeq).padStart(4, '0')}`,
        patientName: params.patientName || 'Bệnh nhân mới',
        patientGender: params.patientGender || 'Nam',
        patientAge: params.patientAge || 30,
        identityCardNumber: '079092000000',
        departmentId: dept.id,
        departmentName: dept.departmentName,
        location: dept.location,
        sequenceNumber: newSeq,
        status: 'Waiting',
        priority: params.priority || 'Normal',
        createdAt: new Date().toISOString(),
      };
      localQueueTickets.unshift(fallbackTicket);
      return fallbackTicket;
    }
  },

  async updateQueueTicketStatus(ticketId: string, status: string): Promise<QueueTicketItem> {
    try {
      const response = await api.put(`/queue/${ticketId}/status`, { status });
      return response.data;
    } catch (err) {
      console.warn('⚡ [queueService] updateQueueTicketStatus fallback:', err);
      const ticket = localQueueTickets.find((t) => t.id === ticketId);
      if (ticket) {
        ticket.status = status as any;
        return ticket;
      }
      throw err;
    }
  },

  async callNextPatient(departmentId: string): Promise<QueueTicketItem | null> {
    try {
      const response = await api.post(`/queue/departments/${departmentId}/call-next`);
      return response.data;
    } catch (err) {
      console.warn('⚡ [queueService] callNextPatient fallback:', err);
      const nextTicket = localQueueTickets.find(
        (t) => (t.departmentId === departmentId || !departmentId) && t.status === 'Waiting'
      );
      if (nextTicket) {
        nextTicket.status = 'Calling';
        return nextTicket;
      }
      return null;
    }
  },
};

