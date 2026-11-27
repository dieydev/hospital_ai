import api from './api';
import { QueueTicketItem, queueService } from './queueService';
import { appointmentService } from './appointmentService';

export interface KioskTerminalConfig {
  terminalId: string;
  terminalName: string;
  location: string;
  zoneType: 'Reception' | 'FollowUp' | 'Paraclinical';
  secret: string;
}

const KIOSK_PAIRING_STORAGE_KEY = 'dmedical_kiosk_terminal_secrets';

export const KIOSK_TERMINALS: KioskTerminalConfig[] = [
  {
    terminalId: 'KIOSK-SANH-A-01',
    terminalName: 'Kiosk Sảnh A - Tiếp Nhận & Khám Bệnh',
    location: 'Sảnh A - Tầng Trệt',
    zoneType: 'Reception',
    secret: import.meta.env.VITE_KIOSK_SECRET_A01 || '',
  },
  {
    terminalId: 'KIOSK-TAI-KHAM-02',
    terminalName: 'Kiosk Sảnh B - Tái Khám Theo Hẹn',
    location: 'Sảnh B - Tầng 1',
    zoneType: 'FollowUp',
    secret: import.meta.env.VITE_KIOSK_SECRET_B02 || '',
  },
  {
    terminalId: 'KIOSK-CLS-03',
    terminalName: 'Kiosk Khu Cận Lâm Sàng - Trả Kết Quả',
    location: 'Khu Cận Lâm Sàng - Tầng 2',
    zoneType: 'Paraclinical',
    secret: import.meta.env.VITE_KIOSK_SECRET_C03 || '',
  },
];

const readPairedSecretsMap = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KIOSK_PAIRING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const getPairedTerminalSecret = (terminalId: string): string => {
  const paired = readPairedSecretsMap()[terminalId];
  if (paired && paired.trim()) return paired.trim();
  const fromEnv = KIOSK_TERMINALS.find((t) => t.terminalId === terminalId)?.secret;
  return fromEnv ? fromEnv.trim() : '';
};

export const setPairedTerminalSecret = (terminalId: string, secret: string): void => {
  if (typeof window === 'undefined') return;
  const map = readPairedSecretsMap();
  map[terminalId] = secret.trim();
  localStorage.setItem(KIOSK_PAIRING_STORAGE_KEY, JSON.stringify(map));
};

export const clearPairedTerminalSecret = (terminalId: string): void => {
  if (typeof window === 'undefined') return;
  const map = readPairedSecretsMap();
  delete map[terminalId];
  localStorage.setItem(KIOSK_PAIRING_STORAGE_KEY, JSON.stringify(map));
};

export interface KioskQrParseResult {
  format: 'CCCD_CHIP' | 'EXAM_PASS_JSON' | 'MEDQR' | 'URL' | 'RAW';
  lookupKey: string;
  appointmentId?: string;
  patientCode?: string;
  identityCardNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  appointmentType?: string;
  previousRecordCode?: string;
}

export interface KioskBillingSummary {
  billingId: string;
  billingCode: string;
  billingType: string;
  amount: number;
  status: string;
  patientName: string;
  patientCode: string;
  description: string;
  vietQrPayload: string;
  createdAt: string;
}

export interface KioskPreviousExamSummary {
  examinationCode: string;
  examinationDate: string;
  departmentName: string;
  icd10Code: string;
  icd10Name: string;
  assessment: string;
  followUpAppointmentCode?: string;
}

export interface KioskCheckInResponse {
  outcome: 'SUCCESS' | 'ALREADY_CHECKED_IN' | 'UNPAID_REQUIRED' | 'NOT_FOUND' | 'REJECTED';
  message: string;
  visitType: 'New' | 'FollowUp';
  ticket?: QueueTicketItem;
  unpaidBilling?: KioskBillingSummary;
  previousExam?: KioskPreviousExamSummary;
  parsedQr?: KioskQrParseResult;
  terminalId?: string;
  processedAt?: string;
  isOfflineFallback?: boolean;
}

export interface KioskWalkInRequest {
  fullName: string;
  identityCardNumber: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender: string;
  address?: string;
  healthInsuranceNumber?: string;
  departmentId: string;
  requirePrepayment: boolean;
  waitForTriage?: boolean;
  isPregnant: boolean;
  isDisabled: boolean;
  hasRevolutionaryMerit: boolean;
  terminalId?: string;
}

export interface KioskClsServiceItem {
  serviceName: string;
  category: string;
  status: string;
  resultSummary?: string;
}

export interface KioskClsReturnResponse {
  outcome: 'SUCCESS' | 'PENDING_RESULTS' | 'UNPAID_CLS' | 'NOT_FOUND';
  message: string;
  examinationCode?: string;
  ticket?: QueueTicketItem;
  unpaidBilling?: KioskBillingSummary;
  completedCount: number;
  pendingCount: number;
  serviceItems: KioskClsServiceItem[];
  processedAt?: string;
  isOfflineFallback?: boolean;
}

export const getKioskHeaders = (terminalId: string) => {
  const terminal = KIOSK_TERMINALS.find((t) => t.terminalId === terminalId) || KIOSK_TERMINALS[0];
  const secret = getPairedTerminalSecret(terminal.terminalId);
  const headers: Record<string, string> = {
    'X-Kiosk-Terminal-Id': terminal.terminalId,
  };
  if (secret) {
    headers['X-Kiosk-Terminal-Secret'] = secret;
  }
  return headers;
};

/**
 * Bộ giải mã QR CCCD gắn chip Việt Nam & các định dạng QR Bệnh viện
 */
export const parseKioskQrClient = (rawInput: string): KioskQrParseResult => {
  const input = (rawInput || '').trim();
  if (!input) return { format: 'RAW', lookupKey: '' };

  if (input.startsWith('{') && input.endsWith('}')) {
    try {
      const parsed = JSON.parse(input);
      return {
        format: 'EXAM_PASS_JSON',
        appointmentId: parsed.appointmentId || parsed.id || parsed.ticketId,
        patientCode: parsed.patientCode,
        identityCardNumber: parsed.identityCard,
        fullName: parsed.patientName,
        appointmentType: parsed.appointmentType,
        previousRecordCode: parsed.previousRecordCode,
        lookupKey: parsed.appointmentId || parsed.patientCode || parsed.identityCard || input,
      };
    } catch {
      // ignore invalid JSON
    }
  }

  if (input.toUpperCase().startsWith('MEDQR|')) {
    const parts = input.split('|');
    const key1 = (parts[1] || '').trim();
    const key2 = (parts[2] || '').trim();
    const isFollowUp =
      key1.toUpperCase() === 'TAIKHAM' ||
      key1.toUpperCase().startsWith('HEN-') ||
      parts.some((p) => p.toUpperCase().includes('FOLLOWUP'));

    return {
      format: 'MEDQR',
      appointmentId:
        key1 && key1.toUpperCase() !== 'TAIKHAM' && !key1.toUpperCase().startsWith('HEN-') ? key1 : undefined,
      patientCode: key2 || undefined,
      previousRecordCode: key1.toUpperCase().startsWith('HEN-') ? key1 : undefined,
      appointmentType: isFollowUp ? 'FollowUp' : undefined,
      lookupKey: key2 || key1 || input,
    };
  }

  // QR CCCD gắn chip Việt Nam: 12 số CCCD | CMND | Họ tên | ddMMyyyy | Giới tính | Địa chỉ | Ngày cấp
  if (input.includes('|')) {
    const parts = input.split('|');
    const cccd = (parts[0] || '').trim();
    if (parts.length >= 6 && /^\d{12}$/.test(cccd)) {
      const rawDob = (parts[3] || '').trim();
      let isoDob: string | undefined;
      if (/^\d{8}$/.test(rawDob)) {
        const dd = rawDob.slice(0, 2);
        const mm = rawDob.slice(2, 4);
        const yyyy = rawDob.slice(4, 8);
        isoDob = `${yyyy}-${mm}-${dd}`;
      }
      const rawGender = (parts[4] || '').trim().toLowerCase();
      const gender = rawGender.includes('nữ') || rawGender === 'nu' ? 'Nữ' : 'Nam';

      return {
        format: 'CCCD_CHIP',
        identityCardNumber: cccd,
        fullName: (parts[2] || '').trim() || undefined,
        dateOfBirth: isoDob,
        gender,
        address: (parts[5] || '').trim() || undefined,
        lookupKey: cccd,
      };
    }
  }

  if (input.toLowerCase().includes('/queue/')) {
    const tail = input.split(/\/queue\//i)[1]?.trim().replace(/\/+$/, '') || input;
    return { format: 'URL', lookupKey: tail };
  }

  let cleaned = input.replace(/#/g, '').trim();
  if (/^stt\d+$/i.test(cleaned)) {
    cleaned = cleaned.slice(3);
  }

  return {
    format: 'RAW',
    identityCardNumber: /^\d{12}$/.test(cleaned) ? cleaned : undefined,
    previousRecordCode: cleaned.toUpperCase().startsWith('HEN-') ? cleaned.toUpperCase() : undefined,
    appointmentType: cleaned.toUpperCase().startsWith('HEN-') ? 'FollowUp' : undefined,
    lookupKey: cleaned,
  };
};

export const kioskService = {
  async getPublicBoard(
    terminalId: string,
    options?: { departmentId?: string; queueType?: string; includeMaskedNames?: boolean }
  ): Promise<{ tickets: QueueTicketItem[]; online: boolean; authRequired?: boolean }> {
    try {
      const response = await api.get<QueueTicketItem[]>('/kiosk/board', {
        headers: getKioskHeaders(terminalId),
        params: {
          departmentId: options?.departmentId,
          queueType: options?.queueType,
          includeMaskedNames: options?.includeMaskedNames ?? true,
        },
      });
      return { tickets: response.data || [], online: true, authRequired: false };
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        return { tickets: [], online: true, authRequired: true };
      }
      if (!err?.response) {
        // Mất kết nối backend: fallback offline nhưng báo rõ trạng thái online=false
        const local = await queueService.getTodayQueue(options?.departmentId);
        return { tickets: local, online: false, authRequired: false };
      }
      throw err;
    }
  },

  async checkInQr(qrCodeOrCode: string, terminalId: string): Promise<KioskCheckInResponse> {
    try {
      const response = await api.post<KioskCheckInResponse>(
        '/kiosk/checkin',
        { qrCodeOrCode, terminalId },
        { headers: getKioskHeaders(terminalId) }
      );
      return { ...response.data, isOfflineFallback: false };
    } catch (err: any) {
      // Nếu Backend trả về lỗi nghiệp vụ thực tế (400/403/404/409) -> tuyệt đối KHÔNG che giấu hay fallback giả
      if (err?.response) {
        const data = err.response.data || {};
        return {
          outcome: data.outcome || (err.response.status === 404 ? 'NOT_FOUND' : 'REJECTED'),
          message: data.message || 'Yêu cầu check-in không hợp lệ.',
          visitType: data.visitType || 'New',
          unpaidBilling: data.unpaidBilling,
          previousExam: data.previousExam,
          parsedQr: data.parsedQr || parseKioskQrClient(qrCodeOrCode),
          terminalId,
          isOfflineFallback: false,
        };
      }

      // Chỉ fallback khi thật sự không kết nối được máy chủ (Offline mode)
      const parsed = parseKioskQrClient(qrCodeOrCode);
      const localQueue = await queueService.getTodayQueue();
      const key = parsed.lookupKey.toLowerCase();

      if (key.includes('unpaid') || key.includes('chuatt') || qrCodeOrCode.trim() === 'BN2026_UNPAID') {
        return {
          outcome: 'SUCCESS',
          message: 'Lượt khám Dịch vụ chưa thanh toán phí khám (150.000 VNĐ) — vui lòng thanh toán tại Quầy Thu ngân [Ngoại tuyến].',
          visitType: 'New',
          unpaidBilling: {
            billingId: 'offline-bill-001',
            billingCode: 'HAIOFFLINE01',
            billingType: 'Registration',
            amount: 150000,
            status: 'Unpaid',
            patientName: 'Khách hàng Dịch vụ',
            patientCode: qrCodeOrCode.trim(),
            description: 'Phí khám ban đầu (Thanh toán tại Quầy Thu ngân)',
            vietQrPayload: '',
            createdAt: new Date().toISOString(),
          },
          parsedQr: parsed,
          terminalId,
          isOfflineFallback: true,
        };
      }

      const foundTicket = localQueue.find(
        (t) =>
          t.patientCode.toLowerCase() === key ||
          t.id.toLowerCase() === key ||
          String(t.sequenceNumber) === key
      );

      if (foundTicket) {
        return {
          outcome: 'ALREADY_CHECKED_IN',
          message: foundTicket.paymentStatus === 'Unpaid'
            ? `Xác nhận số thứ tự #${foundTicket.sequenceNumber} (Ngoại tuyến). Vui lòng hoàn tất viện phí tại Quầy Thu ngân.`
            : `Xác nhận số thứ tự #${foundTicket.sequenceNumber} (Ngoại tuyến).`,
          visitType: foundTicket.visitType || 'New',
          ticket: foundTicket,
          unpaidBilling: foundTicket.paymentStatus === 'Unpaid'
            ? {
                billingId: foundTicket.unpaidBillingId || foundTicket.id,
                billingCode: `HAI${String(foundTicket.sequenceNumber).padStart(8, '0')}`,
                billingType: 'Registration',
                amount: foundTicket.unpaidAmount || 150000,
                status: 'Unpaid',
                patientName: foundTicket.patientName,
                patientCode: foundTicket.patientCode,
                description: 'Phí khám ban đầu (Thanh toán tại Quầy Thu ngân)',
                vietQrPayload: '',
                createdAt: new Date().toISOString(),
              }
            : undefined,
          parsedQr: parsed,
          terminalId,
          isOfflineFallback: true,
        };
      }

      const localApts = await appointmentService.getAppointments();
      const foundApt = localApts.find(
        (a) =>
          a.id.toLowerCase() === key ||
          a.patientCode.toLowerCase() === key ||
          a.patientPhone === parsed.lookupKey
      );
      if (foundApt) {
        const depts = await queueService.getDepartments();
        const dept = depts.find((d) => d.departmentName.toLowerCase().includes(foundApt.departmentName.toLowerCase())) || depts[0];
        const ticket = await queueService.issueQueueTicket({
          patientId: `offline-${foundApt.patientCode}`,
          departmentId: dept.id,
          appointmentId: foundApt.id,
          patientName: foundApt.patientName,
          patientCode: foundApt.patientCode,
          patientAge: foundApt.patientAge,
          patientGender: foundApt.patientGender,
          visitType: foundApt.appointmentType === 'FollowUp' ? 'FollowUp' : 'New',
          paymentStatus: foundApt.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid',
        });
        return {
          outcome: 'SUCCESS',
          message: `Đã cấp STT #${ticket.sequenceNumber} (Ngoại tuyến).`,
          visitType: ticket.visitType || 'New',
          ticket,
          parsedQr: parsed,
          terminalId,
          isOfflineFallback: true,
        };
      }

      return {
        outcome: 'NOT_FOUND',
        message: `Không tìm thấy thông tin lịch hẹn hoặc phiếu tiếp nhận cho mã "${qrCodeOrCode}".`,
        visitType: 'New',
        parsedQr: parsed,
        terminalId,
        isOfflineFallback: true,
      };
    }
  },

  async issueWalkIn(params: KioskWalkInRequest, terminalId: string): Promise<KioskCheckInResponse> {
    try {
      const response = await api.post<KioskCheckInResponse>(
        '/kiosk/walkin-issue',
        { ...params, terminalId },
        { headers: getKioskHeaders(terminalId) }
      );
      return { ...response.data, isOfflineFallback: false };
    } catch (err: any) {
      if (err?.response) {
        throw new Error(err.response.data?.message || 'Không thể đăng ký khám tại Kiosk.');
      }
      throw new Error('Không thể kết nối Máy chủ Bệnh viện để lưu hồ sơ và cấp số thứ tự.');
    }
  },

  async processClsReturn(qrCodeOrCode: string, terminalId: string): Promise<KioskClsReturnResponse> {
    try {
      const response = await api.post<KioskClsReturnResponse>(
        '/kiosk/cls-return',
        { qrCodeOrCode, terminalId },
        { headers: getKioskHeaders(terminalId) }
      );
      return { ...response.data, isOfflineFallback: false };
    } catch (err: any) {
      if (err?.response) {
        const data = err.response.data || {};
        return {
          outcome: data.outcome || 'NOT_FOUND',
          message: data.message || 'Không tìm thấy chỉ định Cận lâm sàng.',
          examinationCode: data.examinationCode,
          unpaidBilling: data.unpaidBilling,
          completedCount: data.completedCount || 0,
          pendingCount: data.pendingCount || 0,
          serviceItems: data.serviceItems || [],
          isOfflineFallback: false,
        };
      }
      throw new Error('Không thể kết nối Máy chủ Bệnh viện để kiểm tra kết quả Cận lâm sàng.');
    }
  },

  async getBillingStatus(billingId: string, terminalId: string): Promise<KioskBillingSummary> {
    const response = await api.get<KioskBillingSummary>(`/kiosk/billing/${billingId}/status`, {
      headers: getKioskHeaders(terminalId),
    });
    return response.data;
  },

  async createVnpayUrl(
    billingId: string,
    amount: number,
    orderDescription: string,
    terminalId: string
  ): Promise<string> {
    const response = await api.post<{ url?: string; Url?: string }>(
      '/payment/create-payment-url',
      {
        orderId: billingId,
        amount,
        orderDescription,
        name: 'Kiosk Check-in',
        orderType: 'billpayment',
      },
      { headers: getKioskHeaders(terminalId) }
    );
    return response.data.url || response.data.Url || '';
  },
};
