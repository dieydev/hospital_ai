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
  qrCode?: string;
  checkInStatus?: 'PendingQR' | 'CheckedInQR';
  checkedInAt?: string;
  cancelReason?: string;
  rescheduledAt?: string;
  appointmentType?: 'New' | 'FollowUp';
  previousRecordCode?: string;
  followUpNotes?: string;
  roomNumber?: string;
}

export interface TimeSlotQuotaItem {
  id: string;
  timeSlot: string;
  period: 'Morning' | 'Afternoon';
  maxCapacity: number;
  bookedCount: number;
  isLocked: boolean;
  isFull: boolean;
  isAvailable: boolean;
  note?: string;
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
    qrCode: 'MEDQR|apt-001|BN20260015|2026-08-12|08:30',
    checkInStatus: 'PendingQR',
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
    qrCode: 'MEDQR|apt-002|BN20260016|2026-08-12|09:15',
    checkInStatus: 'PendingQR',
  },
];

let localSlots: TimeSlotQuotaItem[] = [
  { id: 'slot-01', timeSlot: '07:30 - 08:00', period: 'Morning', maxCapacity: 5, bookedCount: 2, isLocked: false, isFull: false, isAvailable: true },
  { id: 'slot-02', timeSlot: '08:00 - 08:30', period: 'Morning', maxCapacity: 5, bookedCount: 3, isLocked: false, isFull: false, isAvailable: true },
  { id: 'slot-03', timeSlot: '08:30 - 09:00', period: 'Morning', maxCapacity: 5, bookedCount: 5, isLocked: false, isFull: true, isAvailable: false },
  { id: 'slot-04', timeSlot: '09:00 - 09:30', period: 'Morning', maxCapacity: 5, bookedCount: 1, isLocked: false, isFull: false, isAvailable: true },
  { id: 'slot-05', timeSlot: '09:30 - 10:00', period: 'Morning', maxCapacity: 5, bookedCount: 0, isLocked: true, isFull: false, isAvailable: false, note: 'Khóa tạm thời cho ca cấp cứu' },
  { id: 'slot-06', timeSlot: '10:00 - 10:30', period: 'Morning', maxCapacity: 5, bookedCount: 4, isLocked: false, isFull: false, isAvailable: true },
  { id: 'slot-07', timeSlot: '13:30 - 14:00', period: 'Afternoon', maxCapacity: 5, bookedCount: 0, isLocked: false, isFull: false, isAvailable: true },
  { id: 'slot-08', timeSlot: '14:00 - 14:30', period: 'Afternoon', maxCapacity: 5, bookedCount: 1, isLocked: false, isFull: false, isAvailable: true },
  { id: 'slot-09', timeSlot: '14:30 - 15:00', period: 'Afternoon', maxCapacity: 5, bookedCount: 2, isLocked: false, isFull: false, isAvailable: true },
  { id: 'slot-10', timeSlot: '15:00 - 15:30', period: 'Afternoon', maxCapacity: 5, bookedCount: 0, isLocked: false, isFull: false, isAvailable: true },
  { id: 'slot-11', timeSlot: '15:30 - 16:00', period: 'Afternoon', maxCapacity: 5, bookedCount: 0, isLocked: false, isFull: false, isAvailable: true },
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
        sourceApp: params.sourceApp || 'Web Booking Portal',
        qrCode: JSON.stringify({
          type: 'D_MEDICAL_EXAM_PASS',
          version: '2.0',
          appointmentId: `apt-${Date.now()}`,
          patientCode: params.patientCode,
          patientName: params.patientName,
          phoneNumber: params.patientPhone,
          department: params.departmentName,
          doctor: params.doctorName,
          roomNumber: params.roomNumber || 'Phòng Khám Chuyên Khoa',
          appointmentDate: params.appointmentDate,
          appointmentTime: params.appointmentTime,
          appointmentType: params.appointmentType || 'New',
          previousRecordCode: params.previousRecordCode,
          followUpNotes: params.followUpNotes,
          symptoms: params.symptomsReason,
          checkInNotice: 'Xuất trình mã QR tại phòng khám để vào khám (Không cần lấy STT)',
        }),
        checkInStatus: 'PendingQR',
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
        if (status === 'Completed') {
          item.checkInStatus = 'CheckedInQR';
          item.checkedInAt = new Date().toISOString();
        }
        return item;
      }
      throw new Error('Appointment not found');
    }
  },

  async getTimeSlots(date?: string, departmentName?: string): Promise<TimeSlotQuotaItem[]> {
    try {
      const response = await api.get('/appointments/slots', {
        params: { date, departmentName },
      });
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      const targetDate = date || new Date().toISOString().slice(0, 10);
      return localSlots.map((slot) => {
        const slotStartTime = slot.timeSlot.split('-')[0].trim();
        const activeCount = localAppointments.filter(
          (a) =>
            a.appointmentDate === targetDate &&
            a.status !== 'Cancelled' &&
            (a.appointmentTime === slotStartTime ||
              a.appointmentTime === slot.timeSlot ||
              a.appointmentTime.startsWith(slotStartTime))
        ).length;
        const totalBooked = Math.min(slot.maxCapacity, slot.bookedCount + activeCount);
        const isFull = totalBooked >= slot.maxCapacity;
        return {
          ...slot,
          bookedCount: totalBooked,
          isFull,
          isAvailable: !slot.isLocked && !isFull,
        };
      });
    } catch {
      const targetDate = date || new Date().toISOString().slice(0, 10);
      return localSlots.map((slot) => {
        const slotStartTime = slot.timeSlot.split('-')[0].trim();
        const activeCount = localAppointments.filter(
          (a) =>
            a.appointmentDate === targetDate &&
            a.status !== 'Cancelled' &&
            (a.appointmentTime === slotStartTime ||
              a.appointmentTime === slot.timeSlot ||
              a.appointmentTime.startsWith(slotStartTime))
        ).length;
        const totalBooked = Math.min(slot.maxCapacity, slot.bookedCount + activeCount);
        const isFull = totalBooked >= slot.maxCapacity;
        return {
          ...slot,
          bookedCount: totalBooked,
          isFull,
          isAvailable: !slot.isLocked && !isFull,
        };
      });
    }
  },

  async updateTimeSlot(id: string, data: { maxCapacity?: number; isLocked?: boolean; note?: string }): Promise<TimeSlotQuotaItem> {
    try {
      const response = await api.put(`/appointments/slots/${id}`, data);
      return response.data;
    } catch {
      const slot = localSlots.find((s) => s.id === id);
      if (slot) {
        if (data.maxCapacity !== undefined) slot.maxCapacity = data.maxCapacity;
        if (data.isLocked !== undefined) slot.isLocked = data.isLocked;
        if (data.note !== undefined) slot.note = data.note;
        slot.isFull = slot.bookedCount >= slot.maxCapacity;
        slot.isAvailable = !slot.isLocked && !slot.isFull;
        return { ...slot };
      }
      throw new Error('Slot not found');
    }
  },

  async toggleLockTimeSlot(id: string): Promise<TimeSlotQuotaItem> {
    try {
      const response = await api.put(`/appointments/slots/${id}/toggle-lock`);
      return response.data;
    } catch {
      const slot = localSlots.find((s) => s.id === id);
      if (slot) {
        slot.isLocked = !slot.isLocked;
        slot.isAvailable = !slot.isLocked && !slot.isFull;
        return { ...slot };
      }
      throw new Error('Slot not found');
    }
  },

  async checkInWithQr(qrCodeOrId: string): Promise<OnlineAppointmentItem> {
    try {
      const response = await api.post('/appointments/checkin-qr', { qrCodeOrId });
      return response.data;
    } catch {
      const input = qrCodeOrId.trim();
      let targetId = input;
      if (input.startsWith('{') && input.endsWith('}')) {
        try {
          const parsed = JSON.parse(input);
          targetId = parsed.appointmentId || parsed.id || parsed.ticketId || '';
        } catch {}
      } else if (input.startsWith('MEDQR|')) {
        const parts = input.split('|');
        if (parts.length >= 2) targetId = parts[1];
      }
      const item = localAppointments.find(
        (a) => a.id === targetId || a.id === input || a.qrCode === input || a.patientCode === input
      );
      if (item) {
        item.status = 'Completed';
        item.checkInStatus = 'CheckedInQR';
        item.checkedInAt = new Date().toISOString();
        return item;
      }
      throw new Error('Không tìm thấy lịch hẹn với mã QR này');
    }
  },

  async cancelAppointment(id: string, reason?: string): Promise<OnlineAppointmentItem> {
    try {
      const response = await api.put(`/appointments/${id}/cancel`, { reason });
      return response.data;
    } catch {
      const item = localAppointments.find((a) => a.id === id);
      if (item) {
        item.status = 'Cancelled';
        item.cancelReason = reason || 'Bệnh nhân chủ động hủy lịch';
        return { ...item };
      }
      throw new Error('Không tìm thấy lịch hẹn');
    }
  },

  async rescheduleAppointment(
    id: string,
    newDate: string,
    newTime: string,
    reason?: string
  ): Promise<OnlineAppointmentItem> {
    try {
      const response = await api.put(`/appointments/${id}/reschedule`, {
        newDate,
        newTime,
        reason,
      });
      return response.data;
    } catch {
      const item = localAppointments.find((a) => a.id === id);
      if (item) {
        const oldDate = item.appointmentDate;
        const oldTime = item.appointmentTime;
        item.appointmentDate = newDate;
        item.appointmentTime = newTime;
        item.status = 'Pending';
        item.rescheduledAt = new Date().toISOString();
        item.qrCode = `MEDQR|${item.id}|${item.patientCode}|${newDate}|${newTime}`;
        if (reason) {
          item.symptomsReason += ` [Đổi lịch từ ${oldTime} ${oldDate}: ${reason}]`;
        }
        return { ...item };
      }
      throw new Error('Không tìm thấy lịch hẹn');
    }
  },

  async getFollowUpAppointments(patientCodeOrPhone: string): Promise<OnlineAppointmentItem[]> {
    try {
      const response = await api.get(`/appointments/followups/${patientCodeOrPhone}`);
      return response.data || [];
    } catch {
      const all = await this.getAppointments();
      const q = patientCodeOrPhone.trim().toLowerCase();
      return all.filter(
        (a) =>
          (a.patientPhone.includes(q) || a.patientCode.toLowerCase().includes(q)) &&
          (a.appointmentType === 'FollowUp' || a.symptomsReason.toLowerCase().includes('tái khám'))
      );
    }
  },
};
