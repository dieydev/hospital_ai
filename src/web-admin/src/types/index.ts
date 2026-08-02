// Comprehensive Domain & API Type Definitions for Hospital AI Web Admin

export type UserRole = 'Admin' | 'Doctor' | 'Nurse' | 'Receptionist' | 'Patient';

export interface UserAccount {
  id: string;
  tenDangNhap: string;
  hoTen: string;
  email?: string;
  soDienThoai: string;
  vaiTro: UserRole[];
  chuyenKhoa?: string;
  chucDanh?: string;
  trangThaiKichHoat: boolean;
  avatarUrl?: string;
}

export interface Patient {
  id: string;
  maBenhNhan: string;
  hoTen: string;
  gioiTinh: 'Nam' | 'Nữ' | 'Khác';
  ngaySinh: string;
  soCCCD: string;
  maTheBHYT?: string;
  soDienThoai: string;
  email?: string;
  diaChi: string;
  tienSuBenh?: string;
  diUngThuoc?: string;
  nhomMau?: string;
  ngayTao?: string;
}

export interface Appointment {
  id: string;
  maLichHen: string;
  benhNhanId: string;
  tenBenhNhan: string;
  soDienThoai: string;
  khoaId: string;
  tenKhoa: string;
  bacSiId?: string;
  tenBacSi?: string;
  ngayKham: string;
  khungGio: string;
  lyDoKham: string;
  trangThai: 'Chờ xác nhận' | 'Đã xác nhận' | 'Đã đến' | 'Đã khám' | 'Đã hủy';
  ngayTao: string;
}

export interface QueueTicket {
  id: string;
  stt: number;
  maBenhNhan: string;
  tenBenhNhan: string;
  soCCCD: string;
  phongKham: string;
  bacSiKham: string;
  trangThai: 'Đang chờ' | 'Đang khám' | 'Chờ cận lâm sàng' | 'Hoàn thành';
  thoiGianCap: string;
  uuTien: boolean;
}

export interface VitalSigns {
  mach: number; // l/p
  nhietDo: number; // °C
  huyetAp: string; // mmHg e.g. 120/80
  nhipTho: number; // l/p
  canNang: number; // kg
  chieuCao: number; // cm
  bmi: number;
}

export interface EPrescriptionItem {
  id: string;
  thuocId: string;
  tenThuoc: string;
  donViTinh: string;
  soLuong: number;
  lieuDung: string; // e.g. Sáng 1v, Tối 1v sau ăn
  ghiChu?: string;
}

export interface ServiceOrderItem {
  id: string;
  dichVuId: string;
  tenDichVu: string;
  loaiDichVu: 'Xét nghiệm' | 'Chẩn đoán hình ảnh' | 'Thủ thuật';
  donGia: number;
  ketQua?: string;
  trangThai: 'Chờ thực hiện' | 'Đã có kết quả';
}

export interface Examination {
  id: string;
  maLuotKham: string;
  benhNhanId: string;
  tenBenhNhan: string;
  maBenhNhan: string;
  bacSiId: string;
  tenBacSi: string;
  khoa: string;
  ngayKham: string;
  
  // SOAP Model
  subjective: string; // Triệu chứng chủ quan
  vitalSigns: VitalSigns; // Objective
  assessment: string; // Đánh giá chẩn đoán
  icd10Code: string; // Mã ICD-10
  icd10Name: string; // Tên bệnh theo ICD-10
  plan: string; // Kế hoạch điều trị

  donThuoc: EPrescriptionItem[];
  dichVuChiDinh: ServiceOrderItem[];

  trangThai: 'Đang khám' | 'Chờ cận lâm sàng' | 'Hoàn thành';
  ghiChuBsi?: string;
}

export interface MedicalRecordTimelineItem {
  id: string;
  ngayKham: string;
  maLuotKham: string;
  bacSiKham: string;
  khoaKham: string;
  chanDoanChinh: string;
  maICD10: string;
  trieuChung: string;
  donThuocCount: number;
  dichVuCount: number;
  tongChiPhi: number;
}

export interface Invoice {
  id: string;
  maHoaDon: string;
  maBenhNhan: string;
  tenBenhNhan: string;
  maLuotKham: string;
  ngayLap: string;
  tienKham: number;
  tienThuoc: number;
  tienDichVu: number;
  bhytChiTra: number;
  benhNhanThanhToan: number;
  phuongThucThanhToan: 'Tiền mặt' | 'Chuyển khoản VietQR' | 'Thẻ ATM/Credit';
  trangThai: 'Chưa thanh toán' | 'Đã thanh toán';
  qrCodeUrl?: string;
}

export interface ICD10Item {
  code: string;
  name: string;
  category: string;
}

export interface MedicineCatalogItem {
  id: string;
  maThuoc: string;
  tenThuoc: string;
  hoatChat: string;
  donViTinh: string;
  donGia: number;
  nhaSanXuat: string;
  trangThai: 'Đang kinh doanh' | 'Tạm ngừng';
}

export interface MedicalServiceCatalogItem {
  id: string;
  maDichVu: string;
  tenDichVu: string;
  loaiDichVu: 'Xét nghiệm' | 'Chẩn đoán hình ảnh' | 'Thủ thuật' | 'Khám bệnh';
  donGia: number;
  donGiaBHYT: number;
  khoaThucHien: string;
}

export interface DepartmentCatalogItem {
  id: string;
  maKhoa: string;
  tenKhoa: string;
  truongKhoa: string;
  soPhongKham: number;
  trangThai: 'Hoạt động' | 'Tạm dừng';
}

export interface AuditLog {
  id: string;
  thoiGian: string;
  nguoiThucHien: string;
  vaiTro: string;
  hanhDong: string;
  module: string;
  chiTiet: string;
  ipAddress: string;
  isAiAction?: boolean;
}

export interface AiInteractionLog {
  id: string;
  thoiGian: string;
  bacSi: string;
  loaiYeuCau: 'Tra cứu EMR' | 'Tóm tắt bệnh án' | 'Gợi ý ICD-10';
  prompt: string;
  responseSummary: string;
  confidenceScore: number;
}
