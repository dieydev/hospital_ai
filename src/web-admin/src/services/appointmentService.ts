import api from './api';

export interface OnlineAppointmentItem {
  id: string;
  patientCode: string;
  patientName: string;
  patientPhone: string;
  patientGender: string;
  patientAge: number;
  departmentName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  symptomsReason: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt: string;
  sourceApp?: string;
}

let localAppointments: OnlineAppointmentItem[] = [
  {
    id: 'apt-001',
    patientCode: 'BN20260015',
    patientName: 'Trần Văn Nam',
    patientPhone: '0987654321',
    patientGender: 'Nam',
    patientAge: 29,
    departmentName: 'Khoa Nội Tổng Hợp',
    doctorName: 'BS. CKII. Nguyễn Thanh Duy',
    appointmentDate: '2026-08-12',
    appointmentTime: '08:30',
    symptomsReason: 'Đau đầu âm ỉ kéo dài 2 ngày, kèm sốt nhẹ về chiều',
    status: 'Pending',
    createdAt: new Date().toISOString(),
    sourceApp: 'Flutter Patient App',
  },
  {
    id: 'apt-002',
    patientCode: 'BN20260016',
    patientName: 'Nguyễn Thị Mai',
    patientPhone: '0912345678',
    patientGender: 'Nữ',
    patientAge: 42,
    departmentName: 'Khoa Tiêu Hóa',
    doctorName: 'BS. CKI. Lê Văn Tuấn',
    appointmentDate: '2026-08-12',
    appointmentTime: '09:15',
    symptomsReason: 'Đau tức vùng thượng vị sau khi ăn no, có ợ chua',
    status: 'Pending',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    sourceApp: 'Flutter Patient App',
  },
];

export const appointmentService = {
  async getAppointments(): Promise<OnlineAppointmentItem[]> {
    try {
      const response = await api.get('/appointments');
      return response.data || [];
    } catch {
      return [...localAppointments];
    }
  },

  async createAppointment(params: Omit<OnlineAppointmentItem, 'id' | 'createdAt' | 'status'>): Promise<OnlineAppointmentItem> {
    try {
      const response = await api.post('/appointments', params);
      return response.data;
    } catch {
      const newApt: OnlineAppointmentItem = {
        ...params,
        id: `apt-${Date.now()}`,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        sourceApp: 'Flutter Patient App',
      };
      localAppointments.unshift(newApt);
      return newApt;
    }
  },

  async updateStatus(id: string, status: OnlineAppointmentItem['status']): Promise<OnlineAppointmentItem> {
    try {
      const response = await api.put(`/appointments/${id}/status`, { status });
      return response.data;
    } catch {
      const item = localAppointments.find((a) => a.id === id);
      if (item) {
        item.status = status;
        return item;
      }
      throw new Error('Appointment not found');
    }
  },
};
