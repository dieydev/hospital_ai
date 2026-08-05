import api from './api';
import { Patient } from '../types';

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

const mapBackendToPatient = (dto: any): Patient => ({
  id: dto.id,
  maBenhNhan: dto.patientCode,
  hoTen: dto.fullName,
  gioiTinh: dto.gender,
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
  async getPatients(search?: string, pageIndex = 1, pageSize = 20): Promise<PatientListResult> {
    const response = await api.get('/patients', {
      params: { search, pageIndex, pageSize },
    });
    return {
      items: (response.data.items || []).map(mapBackendToPatient),
      totalCount: response.data.totalCount || 0,
      pageIndex: response.data.pageIndex || 1,
      pageSize: response.data.pageSize || 20,
    };
  },

  async getPatientById(id: string): Promise<Patient> {
    const response = await api.get(`/patients/${id}`);
    return mapBackendToPatient(response.data);
  },

  async getPatientByCode(code: string): Promise<Patient> {
    const response = await api.get(`/patients/code/${code}`);
    return mapBackendToPatient(response.data);
  },

  async createPatient(params: PatientCreateParams): Promise<Patient> {
    const response = await api.post('/patients', params);
    return mapBackendToPatient(response.data);
  },

  async updatePatient(id: string, params: PatientCreateParams): Promise<Patient> {
    const response = await api.put(`/patients/${id}`, params);
    return mapBackendToPatient(response.data);
  },

  async deletePatient(id: string): Promise<void> {
    await api.delete(`/patients/${id}`);
  },
};
