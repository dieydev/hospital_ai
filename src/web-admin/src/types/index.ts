// Domain & API Type Definitions for Web Admin

export interface UserAccount {
  id: string;
  tenDangNhap: string;
  email?: string;
  soDienThoai: string;
  trangThaiKichHoat: boolean;
  vaiTro: string[];
}

export interface Patient {
  id: string;
  maBenhNhan: string;
  hoTen: string;
  gioiTinh: 'Male' | 'Female' | 'Other';
  ngaySinh: string;
  soCCCD: string;
  maTheBHYT?: string;
  diaChi: string;
}

export interface MedicalExamination {
  id: string;
  benhNhanId: string;
  bacSiId: string;
  ngayKham: string;
  trangThaiLuotKham: 'Examining' | 'WaitingForCLS' | 'Done';
}

export interface AIRagQueryResponse {
  answer: string;
  sources: string[];
  suggestedICD10?: Array<{ code: string; name: string }>;
}
