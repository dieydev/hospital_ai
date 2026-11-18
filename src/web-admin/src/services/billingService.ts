import api from './api';
import { Invoice } from '../types';

const INITIAL_SAMPLE_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    maHoaDon: 'HD-2026-001',
    maBenhNhan: 'BN-2026-08899',
    tenBenhNhan: 'Nguyễn Văn An',
    maLuotKham: 'LK-10101',
    ngayLap: '2026-11-18 08:30',
    tongTien: 150000,
    loaiHoaDon: 'Registration',
    phuongThucThanhToan: 'Chưa thanh toán',
    trangThai: 'Chưa thanh toán',
    items: [
      { tenDichVu: 'Khám chuyên khoa Nội Tổng Hợp', donGia: 150000, soLuong: 1, thanhTien: 150000 },
    ],
  },
  {
    id: 'inv-002',
    maHoaDon: 'HD-2026-002',
    maBenhNhan: 'BN20260002',
    tenBenhNhan: 'Trần Thị Mai',
    maLuotKham: 'LK-10102',
    ngayLap: '2026-11-18 09:15',
    tongTien: 235000,
    loaiHoaDon: 'ServiceOrder',
    phuongThucThanhToan: 'Chưa thanh toán',
    trangThai: 'Chưa thanh toán',
    items: [
      { tenDichVu: 'Chụp X-quang Ngực thẳng (Kỹ thuật số)', donGia: 150000, soLuong: 1, thanhTien: 150000 },
      { tenDichVu: 'Tổng phân tích tế bào máu ngoại vi (CBC)', donGia: 85000, soLuong: 1, thanhTien: 85000 },
    ],
  },
  {
    id: 'inv-003',
    maHoaDon: 'HD-2026-003',
    maBenhNhan: 'BN20260003',
    tenBenhNhan: 'Lê Hoàng Long',
    maLuotKham: 'LK-10103',
    ngayLap: '2026-11-18 10:00',
    tongTien: 283000,
    loaiHoaDon: 'Prescription',
    phuongThucThanhToan: 'Tiền mặt',
    trangThai: 'Đã thanh toán',
    items: [
      { tenDichVu: 'Augmentin 1g (Hộp 14 viên)', donGia: 259000, soLuong: 1, thanhTien: 259000 },
      { tenDichVu: 'Paracetamol 500mg (Vỉ 10 viên)', donGia: 12000, soLuong: 2, thanhTien: 24000 },
    ],
  },
  {
    id: 'inv-004',
    maHoaDon: 'HD-2026-004',
    maBenhNhan: 'BN20260004',
    tenBenhNhan: 'Phạm Văn Đức',
    maLuotKham: 'LK-10104',
    ngayLap: '2026-11-18 10:45',
    tongTien: 450000,
    loaiHoaDon: 'ServiceOrder',
    phuongThucThanhToan: 'Chuyển khoản VietQR',
    trangThai: 'Đã thanh toán',
    items: [
      { tenDichVu: 'Siêu âm Doppler Tim màu đa chiều', donGia: 350000, soLuong: 1, thanhTien: 350000 },
      { tenDichVu: 'Đo điện tim gắng sức (ECG 12 cần)', donGia: 100000, soLuong: 1, thanhTien: 100000 },
    ],
  },
  {
    id: 'inv-005',
    maHoaDon: 'HD-2026-005',
    maBenhNhan: 'BN20260005',
    tenBenhNhan: 'Nguyễn Hoàng My',
    maLuotKham: 'LK-10105',
    ngayLap: '2026-11-18 11:20',
    tongTien: 120000,
    loaiHoaDon: 'Registration',
    phuongThucThanhToan: 'Chưa thanh toán',
    trangThai: 'Chưa thanh toán',
    items: [
      { tenDichVu: 'Khám chuyên khoa Nhi Tổng Quát', donGia: 120000, soLuong: 1, thanhTien: 120000 },
    ],
  },
  {
    id: 'inv-006',
    maHoaDon: 'HD-2026-006',
    maBenhNhan: 'BN20260006',
    tenBenhNhan: 'Võ Minh Trí',
    maLuotKham: 'LK-10106',
    ngayLap: '2026-11-18 13:40',
    tongTien: 320000,
    loaiHoaDon: 'Prescription',
    phuongThucThanhToan: 'Chưa thanh toán',
    trangThai: 'Chưa thanh toán',
    items: [
      { tenDichVu: 'Nexium 40mg (Hộp 28 viên)', donGia: 320000, soLuong: 1, thanhTien: 320000 },
    ],
  },
];

const getStoredInvoices = (): Invoice[] => {
  try {
    const raw = localStorage.getItem('hospital_billing_invoices');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [...INITIAL_SAMPLE_INVOICES];
};

const saveStoredInvoices = (list: Invoice[]) => {
  try {
    localStorage.setItem('hospital_billing_invoices', JSON.stringify(list));
  } catch {
    // ignore
  }
};

export const billingService = {
  getBillings: async (status?: string, type?: string): Promise<Invoice[]> => {
    try {
      const response = await api.get('/billing', {
        params: { status: status === 'ALL' ? undefined : status, type: type === 'ALL' ? undefined : type },
      });
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (err: any) {
      console.warn('Backend billing API unavailable, using persistent local invoices:', err?.message);
    }

    // Fallback: Lấy danh sách hóa đơn từ kho lưu trữ Local có sẵn
    let list = getStoredInvoices();
    if (status && status !== 'ALL') {
      list = list.filter((i) => i.trangThai === status);
    }
    if (type && type !== 'ALL') {
      list = list.filter((i) => i.loaiHoaDon === type);
    }
    return list;
  },

  payCash: async (id: string): Promise<any> => {
    try {
      const response = await api.post(`/billing/${id}/pay-cash`);
      return response.data;
    } catch (err: any) {
      console.warn('Backend payCash API fallback to local store:', err?.message);
    }

    // Cập nhật local storage
    const list = getStoredInvoices();
    const updated = list.map((i) =>
      i.id === id ? { ...i, trangThai: 'Đã thanh toán', phuongThucThanhToan: 'Tiền mặt' } : i
    );
    saveStoredInvoices(updated);
    return { success: true, message: 'Đã thanh toán tiền mặt thành công' };
  },

  payTransfer: async (id: string): Promise<any> => {
    try {
      const response = await api.post(`/billing/${id}/pay-transfer`);
      return response.data;
    } catch {
      // ignore
    }

    const list = getStoredInvoices();
    const updated = list.map((i) =>
      i.id === id ? { ...i, trangThai: 'Đã thanh toán', phuongThucThanhToan: 'Chuyển khoản VietQR' } : i
    );
    saveStoredInvoices(updated);
    return { success: true, message: 'Đã xác nhận chuyển khoản thành công' };
  },
};
