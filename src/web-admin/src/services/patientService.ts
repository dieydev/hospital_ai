import api from './api';
import { Patient } from '../types';
import { isStrictMode } from '../utils/modeHelper';

export type { Patient };

export interface PatientListResult {
  items: Patient[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}

export interface PatientCreateParams {
  fullName: string;
  gender: string;
  dateOfBirth: string;
  identityCardNumber: string;
  healthInsuranceNumber?: string;
  phoneNumber: string;
  email?: string;
  address: string;
  medicalHistory?: string;
  drugAllergies?: string;
  bloodType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}

const FALLBACK_PATIENTS: Patient[] = [
  {
    id: '276-15f20b4ed6be',
    maBenhNhan: 'BN20260013',
    hoTen: 'Phan Thu Thảo',
    gioiTinh: 'Nữ',
    ngaySinh: '2010-05-24',
    tuoi: 16,
    soCCCD: '079110000013',
    maTheBHYT: 'TE4010123450013',
    soDienThoai: '0901234567',
    email: 'phanthuthao@gmail.com',
    diaChi: '33 Cách Mạng Tháng 8, Q10, TP.HCM',
    tienSuBenh: 'Không ghi nhận',
    diUngThuoc: 'Không ghi nhận',
    nhomMau: 'A+',
    tenNguoiThan: 'Phan Văn Thanh',
    soDienThoaiNguoiThan: '0909999888',
    quanHeNguoiThan: 'Bố',
    ngayTao: '2026-08-05 13:20'
  },
  {
    id: '87bc141d-e026',
    maBenhNhan: 'BN20260003',
    hoTen: 'Lê Hoàng Minh',
    gioiTinh: 'Nam',
    ngaySinh: '1992-03-15',
    tuoi: 34,
    soCCCD: '079092000003',
    maTheBHYT: 'DN4010123450003',
    soDienThoai: '0912345678',
    email: 'lehoangminh@gmail.com',
    diaChi: '34 Lê Lợi, Quận 1, TP.HCM',
    tienSuBenh: 'Viêm họng mạn tính',
    diUngThuoc: 'Không ghi nhận',
    nhomMau: 'O+',
    tenNguoiThan: 'Nguyễn Thị Hoa',
    soDienThoaiNguoiThan: '0918888777',
    quanHeNguoiThan: 'Vợ',
    ngayTao: '2026-08-05 13:20'
  },
  {
    id: '682f492e-58a9',
    maBenhNhan: 'BN20260002',
    hoTen: 'Nguyễn Thị Thu',
    gioiTinh: 'Nữ',
    ngaySinh: '1985-10-20',
    tuoi: 41,
    soCCCD: '079185000002',
    maTheBHYT: 'DN4010123450002',
    soDienThoai: '0923456789',
    email: 'nguyenthithu@gmail.com',
    diaChi: '12 Nguyễn Huệ, Quận 1, TP.HCM',
    tienSuBenh: 'Tăng huyết áp nhẹ',
    diUngThuoc: 'Penicillin',
    nhomMau: 'B+',
    tenNguoiThan: 'Trần Văn Bình',
    soDienThoaiNguoiThan: '0927777666',
    quanHeNguoiThan: 'Chồng',
    ngayTao: '2026-08-05 13:20'
  },
  {
    id: '100cdc41-83a6',
    maBenhNhan: 'BN20260009',
    hoTen: 'Bùi Thị Lan',
    gioiTinh: 'Nữ',
    ngaySinh: '1970-04-14',
    tuoi: 56,
    soCCCD: '079170000009',
    maTheBHYT: 'HT4010123450009',
    soDienThoai: '0934567890',
    email: 'buithilan@gmail.com',
    diaChi: '67 Phan Đăng Lưu, Bình Thạnh, TP.HCM',
    tienSuBenh: 'Đái tháo đường tuýp 2',
    diUngThuoc: 'Không ghi nhận',
    nhomMau: 'AB+',
    tenNguoiThan: 'Bùi Văn Hùng',
    soDienThoaiNguoiThan: '0936666555',
    quanHeNguoiThan: 'Con',
    ngayTao: '2026-08-05 13:20'
  },
  {
    id: 'e61cb9c5-e82a',
    maBenhNhan: 'BN20260010',
    hoTen: 'Ngô Bá Kiến',
    gioiTinh: 'Nam',
    ngaySinh: '1980-08-08',
    tuoi: 46,
    soCCCD: '079080000010',
    maTheBHYT: '',
    soDienThoai: '0945678901',
    email: 'ngobakien@gmail.com',
    diaChi: '89 Võ Văn Ngân, TP. Thủ Đức, TP.HCM',
    tienSuBenh: 'Dạ dày cấp',
    diUngThuoc: 'Aspirin',
    nhomMau: 'O-',
    tenNguoiThan: 'Ngô Thị Nga',
    soDienThoaiNguoiThan: '0945555444',
    quanHeNguoiThan: 'Em gái',
    ngayTao: '2026-08-05 13:20'
  },
  {
    id: '336f542d-f282',
    maBenhNhan: 'BN20260015',
    hoTen: 'Trương Mỹ Lan',
    gioiTinh: 'Nữ',
    ngaySinh: '1956-10-13',
    tuoi: 70,
    soCCCD: '079156000015',
    maTheBHYT: '',
    soDienThoai: '0956789012',
    email: 'truongmylan@gmail.com',
    diaChi: '55 Nguyễn Thị Minh Khai, Quận 3, TP.HCM',
    tienSuBenh: 'Thấp khớp mạn tính',
    diUngThuoc: 'Không ghi nhận',
    nhomMau: 'A+',
    tenNguoiThan: 'Trương Quốc Bảo',
    soDienThoaiNguoiThan: '0954444333',
    quanHeNguoiThan: 'Con trai',
    ngayTao: '2026-08-05 13:20'
  },
  {
    id: '675be3ab-7a74',
    maBenhNhan: 'BN20260016',
    hoTen: 'Võ Trung Trực',
    gioiTinh: 'Nam',
    ngaySinh: '1991-03-03',
    tuoi: 35,
    soCCCD: '079091000016',
    maTheBHYT: 'DN4010123450016',
    soDienThoai: '0967890123',
    email: 'votrungtruc@gmail.com',
    diaChi: '66 Nguyễn Đình Chiểu, Quận 3, TP.HCM',
    tienSuBenh: 'Không ghi nhận',
    diUngThuoc: 'Không ghi nhận',
    nhomMau: 'B+',
    tenNguoiThan: 'Võ Văn Trình',
    soDienThoaiNguoiThan: '0963333222',
    quanHeNguoiThan: 'Anh trai',
    ngayTao: '2026-08-05 13:20'
  },
  {
    id: '8e64ec30-ffc4',
    maBenhNhan: 'BN20260014',
    hoTen: 'Đinh Tấn Beo',
    gioiTinh: 'Nam',
    ngaySinh: '1955-12-01',
    tuoi: 71,
    soCCCD: '079055000014',
    maTheBHYT: 'HT4010123450014',
    soDienThoai: '0978901234',
    email: 'dinhtanbeo@gmail.com',
    diaChi: '44 Lê Hồng Phong, TP. Thủ Dầu Một, Bình Dương',
    tienSuBenh: 'Gút mạn tính',
    diUngThuoc: 'Không ghi nhận',
    nhomMau: 'O+',
    tenNguoiThan: 'Đinh Tấn Lộc',
    soDienThoaiNguoiThan: '0972222111',
    quanHeNguoiThan: 'Con',
    ngayTao: '2026-08-05 13:20'
  },
  {
    id: 'd566eff9-7480',
    maBenhNhan: 'BN20260007',
    hoTen: 'Hoàng Thanh Tùng',
    gioiTinh: 'Nữ',
    ngaySinh: '1995-09-09',
    tuoi: 31,
    soCCCD: '079195000007',
    maTheBHYT: 'DN4010123450007',
    soDienThoai: '0989012345',
    email: 'hoangthanhtung@gmail.com',
    diaChi: '123 3/2, Quận 10, TP.HCM',
    tienSuBenh: 'Viêm mũi dị ứng',
    diUngThuoc: 'Không ghi nhận',
    nhomMau: 'AB+',
    tenNguoiThan: 'Hoàng Văn Hải',
    soDienThoaiNguoiThan: '0981111222',
    quanHeNguoiThan: 'Bố',
    ngayTao: '2026-08-05 13:20'
  },
  {
    id: 'befb6bff-d61d',
    maBenhNhan: 'BN20260008',
    hoTen: 'Đỗ Hữu Phước',
    gioiTinh: 'Nam',
    ngaySinh: '1965-02-28',
    tuoi: 61,
    soCCCD: '079065000008',
    maTheBHYT: 'HT4010123450008',
    soDienThoai: '0990123456',
    email: 'dohuuphuoc@gmail.com',
    diaChi: '45 Hai Bà Trưng, Quận 1, TP.HCM',
    tienSuBenh: 'Sỏi thận nhạ',
    diUngThuoc: 'Không ghi nhận',
    nhomMau: 'O+',
    tenNguoiThan: 'Đỗ Thị Quyên',
    soDienThoaiNguoiThan: '0992222333',
    quanHeNguoiThan: 'Vợ',
    ngayTao: '2026-08-05 13:20'
  },
  {
    id: '3a01c95e-e5b7',
    maBenhNhan: 'BN20260017',
    hoTen: 'Hồ Bảo Ngọc',
    gioiTinh: 'Nữ',
    ngaySinh: '2005-08-15',
    tuoi: 21,
    soCCCD: '079105000017',
    maTheBHYT: 'SV4010123450017',
    soDienThoai: '0902223344',
    email: 'hobaongoc@gmail.com',
    diaChi: '77 Điện Biên Phủ, Bình Thạnh, TP.HCM',
    tienSuBenh: 'Cận thị 2 độ',
    diUngThuoc: 'Không ghi nhận',
    nhomMau: 'A-',
    tenNguoiThan: 'Hồ Văn Định',
    soDienThoaiNguoiThan: '0903334455',
    quanHeNguoiThan: 'Bố',
    ngayTao: '2026-08-05 13:20'
  },
  {
    id: 'da9f0217-3f4a',
    maBenhNhan: 'BN20260018',
    hoTen: 'Mai Trọng Nhân',
    gioiTinh: 'Nam',
    ngaySinh: '1987-11-20',
    tuoi: 39,
    soCCCD: '079087000018',
    maTheBHYT: 'DN4010123450018',
    soDienThoai: '0913334455',
    email: 'maitrongnhan@gmail.com',
    diaChi: '88 Phạm Văn Đồng, TP. Thủ Đức, TP.HCM',
    tienSuBenh: 'Không ghi nhận',
    diUngThuoc: 'Không ghi nhận',
    nhomMau: 'O+',
    tenNguoiThan: 'Mai Thị Tuyết',
    soDienThoaiNguoiThan: '0914445566',
    quanHeNguoiThan: 'Mẹ',
    ngayTao: '2026-08-05 13:20'
  },
  {
    id: 'fcbea75a-4767',
    maBenhNhan: 'BN20260020',
    hoTen: 'Tạ Quang Bửu',
    gioiTinh: 'Nam',
    ngaySinh: '1945-07-22',
    tuoi: 81,
    soCCCD: '079045000020',
    maTheBHYT: 'HT4010123450020',
    soDienThoai: '0924445566',
    email: 'taquangbuu@gmail.com',
    diaChi: '111 Trần Não, Quận 2, TP.HCM',
    tienSuBenh: 'Xơ vữa động mạch',
    diUngThuoc: 'Không ghi nhận',
    nhomMau: 'B+',
    tenNguoiThan: 'Tạ Quang Minh',
    soDienThoaiNguoiThan: '0925556677',
    quanHeNguoiThan: 'Con trai',
    ngayTao: '2026-08-05 13:20'
  },
  {
    id: '2e9268c2-a125',
    maBenhNhan: 'BN20260006',
    hoTen: 'Vũ Đình Tùng',
    gioiTinh: 'Nam',
    ngaySinh: '1988-07-25',
    tuoi: 38,
    soCCCD: '079088000006',
    maTheBHYT: 'DN4010123450006',
    soDienThoai: '0935556677',
    email: 'vudinhtung@gmail.com',
    diaChi: '90 Hùng Vương, Quận 5, TP.HCM',
    tienSuBenh: 'Rối loạn tiêu hóa',
    diUngThuoc: 'Không ghi nhận',
    nhomMau: 'O+',
    tenNguoiThan: 'Vũ Thị Loan',
    soDienThoaiNguoiThan: '0936667788',
    quanHeNguoiThan: 'Vợ',
    ngayTao: '2026-08-05 13:20'
  },
  {
    id: '9ae70c7e-0bb7',
    maBenhNhan: 'BN20260021',
    hoTen: 'Cao Thu Trang',
    gioiTinh: 'Nữ',
    ngaySinh: '1993-09-30',
    tuoi: 33,
    soCCCD: '079193000021',
    maTheBHYT: 'DN4010123450021',
    soDienThoai: '0946667788',
    email: 'caothutrang@gmail.com',
    diaChi: '222 Cộng Hòa, Tân Bình, TP.HCM',
    tienSuBenh: 'Đau nửa đầu Migraine',
    diUngThuoc: 'Sulfa',
    nhomMau: 'AB-',
    tenNguoiThan: 'Cao Văn Hùng',
    soDienThoaiNguoiThan: '0947778899',
    quanHeNguoiThan: 'Anh trai',
    ngayTao: '2026-08-05 13:20'
  },
  {
    id: 'cb6d9847-266d',
    maBenhNhan: 'BN20260012',
    hoTen: 'Đặng Lê Nguyên',
    gioiTinh: 'Nam',
    ngaySinh: '1999-01-31',
    tuoi: 27,
    soCCCD: '079099000012',
    maTheBHYT: 'SV4010123450012',
    soDienThoai: '0957778899',
    email: 'danglenguyen@gmail.com',
    diaChi: '22 Tôn Đức Thắng, Quận 1, TP.HCM',
    tienSuBenh: 'Không ghi nhận',
    diUngThuoc: 'Không ghi nhận',
    nhomMau: 'A+',
    tenNguoiThan: 'Đặng Lê Vũ',
    soDienThoaiNguoiThan: '0958889900',
    quanHeNguoiThan: 'Chú',
    ngayTao: '2026-08-05 13:20'
  },
  {
    id: 'dba8d009-c099',
    maBenhNhan: 'BN20260019',
    hoTen: 'Dương Thúy Quỳnh',
    gioiTinh: 'Nữ',
    ngaySinh: '1998-02-14',
    tuoi: 28,
    soCCCD: '079198000019',
    maTheBHYT: 'DN4010123450019',
    soDienThoai: '0968889900',
    email: 'duongthuyquynh@gmail.com',
    diaChi: '99 Nguyễn Trãi, Quận 5, TP.HCM',
    tienSuBenh: 'Không ghi nhận',
    diUngThuoc: 'Không ghi nhận',
    nhomMau: 'O+',
    tenNguoiThan: 'Dương Văn Tiến',
    soDienThoaiNguoiThan: '0969990011',
    quanHeNguoiThan: 'Em trai',
    ngayTao: '2026-08-05 13:20'
  },
  {
    id: 'aaa161c5-314b',
    maBenhNhan: 'BN20260011',
    hoTen: 'Lý Nhã Kỳ',
    gioiTinh: 'Nữ',
    ngaySinh: '1982-06-19',
    tuoi: 44,
    soCCCD: '079182000011',
    maTheBHYT: 'DN4010123450011',
    soDienThoai: '0979990011',
    email: 'lynhaky@gmail.com',
    diaChi: '11 Đồng Khởi, Quận 1, TP.HCM',
    tienSuBenh: 'Không ghi nhận',
    diUngThuoc: 'Không ghi nhận',
    nhomMau: 'B-',
    tenNguoiThan: 'Lý Văn Nam',
    soDienThoaiNguoiThan: '0970001122',
    quanHeNguoiThan: 'Bố',
    ngayTao: '2026-08-05 13:20'
  },
  {
    id: 'd1b30ed0-38b9',
    maBenhNhan: 'BN20260005',
    hoTen: 'Trần Mỹ Hạnh',
    gioiTinh: 'Nữ',
    ngaySinh: '2000-12-12',
    tuoi: 26,
    soCCCD: '079100000005',
    maTheBHYT: 'SV4010123450005',
    soDienThoai: '0980001122',
    email: 'tranmyhanh@gmail.com',
    diaChi: '78 Nguyễn Văn Cừ, Quận 5, TP.HCM',
    tienSuBenh: 'Không ghi nhận',
    diUngThuoc: 'Không ghi nhận',
    nhomMau: 'A+',
    tenNguoiThan: 'Trần Văn Đức',
    soDienThoaiNguoiThan: '0981112233',
    quanHeNguoiThan: 'Bố',
    ngayTao: '2026-08-05 13:20'
  },
  {
    id: '52271a07-aacd',
    maBenhNhan: 'BN20260004',
    hoTen: 'Phạm Quang Dũng',
    gioiTinh: 'Nam',
    ngaySinh: '1978-11-05',
    tuoi: 48,
    soCCCD: '079078000004',
    maTheBHYT: 'GD4010123450004',
    soDienThoai: '0991112233',
    email: 'phamquangdung@gmail.com',
    diaChi: '56 Trần Phú, TP. Thủ Dầu Một, Bình Dương',
    tienSuBenh: 'Gan nhiễm mỡ độ 1',
    diUngThuoc: 'Không ghi nhận',
    nhomMau: 'O+',
    tenNguoiThan: 'Phạm Thị Lan',
    soDienThoaiNguoiThan: '0992223344',
    quanHeNguoiThan: 'Mẹ',
    ngayTao: '2026-08-05 13:20'
  },
  {
    id: 'usr-001',
    maBenhNhan: 'BN20260001',
    hoTen: 'Nguyễn Văn An',
    gioiTinh: 'Nam',
    ngaySinh: '1990-05-15',
    tuoi: 36,
    soCCCD: '038090001234',
    maTheBHYT: 'DN40101234567',
    soDienThoai: '038090001234',
    email: 'nguyenvanan@gmail.com',
    diaChi: 'TP. Thủ Dầu Một, Bình Dương',
    tienSuBenh: 'Tăng huyết áp độ 1',
    diUngThuoc: 'Không ghi nhận',
    nhomMau: 'O+',
    tenNguoiThan: 'Nguyễn Thị Mai',
    soDienThoaiNguoiThan: '0901112233',
    quanHeNguoiThan: 'Vợ',
    ngayTao: '2026-08-05 13:20'
  }
];

let localPatients = [...FALLBACK_PATIENTS];

const mapBackendToPatient = (dto: any): Patient => ({
  id: dto.id,
  maBenhNhan: dto.patientCode,
  hoTen: dto.fullName,
  gioiTinh: (dto.gender === 'Female' ? 'Nữ' : dto.gender === 'Male' ? 'Nam' : 'Khác') as 'Nam' | 'Nữ' | 'Khác',
  ngaySinh: dto.dateOfBirth ? dto.dateOfBirth.substring(0, 10) : '',
  tuoi: dto.age,
  soCCCD: dto.identityCardNumber,
  maTheBHYT: dto.healthInsuranceNumber,
  soDienThoai: dto.phoneNumber,
  email: dto.email,
  diaChi: dto.address,
  tienSuBenh: dto.medicalHistory,
  diUngThuoc: dto.drugAllergies,
  nhomMau: dto.bloodType,
  tenNguoiThan: dto.emergencyContactName,
  soDienThoaiNguoiThan: dto.emergencyContactPhone,
  quanHeNguoiThan: dto.emergencyContactRelation,
  ngayTao: dto.createdAt,
  ngayCapNhat: dto.updatedAt,
});

export const patientService = {
  async getPatients(search?: string, pageIndex = 1, pageSize = 5): Promise<PatientListResult> {
    try {
      const response = await api.get('/patients', {
        params: { search, pageIndex, pageSize },
      });
      return {
        items: (response.data.items || []).map(mapBackendToPatient),
        totalCount: response.data.totalCount || 0,
        pageIndex: response.data.pageIndex || 1,
        pageSize: response.data.pageSize || 5,
      };
    } catch (error) {
      if (isStrictMode()) {
        throw new Error('⚠️ Lỗi kết nối Cổng API Gateway Microservices (Port 5000). Không thể tải dữ liệu từ CSDL SQL Server khi Docker ngắt kết nối.');
      }
      console.warn('Backend API connection failed, using local patient database fallback:', error);
      let filtered = localPatients;
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        filtered = localPatients.filter(
          (p) =>
            p.hoTen.toLowerCase().includes(q) ||
            p.maBenhNhan.toLowerCase().includes(q) ||
            p.soCCCD.includes(q) ||
            p.soDienThoai.includes(q)
        );
      }
      const start = (pageIndex - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize);
      return {
        items,
        totalCount: filtered.length,
        pageIndex,
        pageSize,
      };
    }
  },

  async getPatientById(id: string): Promise<Patient> {
    try {
      const response = await api.get(`/patients/${id}`);
      return mapBackendToPatient(response.data);
    } catch {
      const found = localPatients.find((p) => p.id === id);
      if (!found) throw new Error('Không tìm thấy bệnh nhân');
      return found;
    }
  },

  async getPatientByCode(code: string): Promise<Patient> {
    try {
      const response = await api.get(`/patients/code/${code}`);
      return mapBackendToPatient(response.data);
    } catch {
      const found = localPatients.find((p) => p.maBenhNhan === code);
      if (!found) throw new Error('Không tìm thấy bệnh nhân');
      return found;
    }
  },

  async createPatient(params: PatientCreateParams): Promise<Patient> {
    try {
      const response = await api.post('/patients', params);
      return mapBackendToPatient(response.data);
    } catch (err: any) {
      if (err.response?.data?.message) throw err;
      const newP: Patient = {
        id: `p-${Date.now()}`,
        maBenhNhan: `BN2026${String(localPatients.length + 1).padStart(4, '0')}`,
        hoTen: params.fullName,
        gioiTinh: (params.gender === 'Female' ? 'Nữ' : params.gender === 'Male' ? 'Nam' : 'Khác') as 'Nam' | 'Nữ' | 'Khác',
        ngaySinh: params.dateOfBirth,
        tuoi: new Date().getFullYear() - new Date(params.dateOfBirth).getFullYear(),
        soCCCD: params.identityCardNumber,
        maTheBHYT: params.healthInsuranceNumber,
        soDienThoai: params.phoneNumber,
        email: params.email,
        diaChi: params.address,
        tienSuBenh: params.medicalHistory,
        diUngThuoc: params.drugAllergies,
        nhomMau: params.bloodType,
        tenNguoiThan: params.emergencyContactName,
        soDienThoaiNguoiThan: params.emergencyContactPhone,
        quanHeNguoiThan: params.emergencyContactRelation,
        ngayTao: new Date().toISOString().substring(0, 10),
      };
      localPatients.unshift(newP);
      return newP;
    }
  },

  async updatePatient(id: string, params: PatientCreateParams): Promise<Patient> {
    try {
      const response = await api.put(`/patients/${id}`, params);
      return mapBackendToPatient(response.data);
    } catch (err: any) {
      if (err.response?.data?.message) throw err;
      const index = localPatients.findIndex((p) => p.id === id);
      if (index === -1) throw new Error('Không tìm thấy bệnh nhân để cập nhật');
      const updated: Patient = {
        ...localPatients[index],
        hoTen: params.fullName,
        gioiTinh: (params.gender === 'Female' ? 'Nữ' : params.gender === 'Male' ? 'Nam' : 'Khác') as 'Nam' | 'Nữ' | 'Khác',
        ngaySinh: params.dateOfBirth,
        soCCCD: params.identityCardNumber,
        maTheBHYT: params.healthInsuranceNumber,
        soDienThoai: params.phoneNumber,
        email: params.email,
        diaChi: params.address,
        tienSuBenh: params.medicalHistory,
        diUngThuoc: params.drugAllergies,
        nhomMau: params.bloodType,
        tenNguoiThan: params.emergencyContactName,
        soDienThoaiNguoiThan: params.emergencyContactPhone,
        quanHeNguoiThan: params.emergencyContactRelation,
        ngayCapNhat: new Date().toISOString().substring(0, 10),
      };
      localPatients[index] = updated;
      return updated;
    }
  },

  async deletePatient(id: string): Promise<void> {
    try {
      await api.delete(`/patients/${id}`);
    } catch {
      localPatients = localPatients.filter((p) => p.id !== id);
    }
  },
};
