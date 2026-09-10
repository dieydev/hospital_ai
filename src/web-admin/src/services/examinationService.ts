import api from './api';

export interface PrescriptionDetailItem {
  id?: string;
  medicineName: string;
  unit: string;
  quantity: number;
  dosageInstruction: string;
  unitPrice: number;
}

export interface ServiceOrderItem {
  id?: string;
  serviceName: string;
  serviceCategory: string;
  price: number;
  result?: string;
  status: string;
}

export interface ExaminationItem {
  id: string;
  examinationCode: string;
  patientId: string;
  patientCode: string;
  patientName: string;
  patientGender: string;
  patientAge: number;
  identityCardNumber: string;
  healthInsuranceNumber?: string;
  doctorId: string;
  doctorName: string;
  departmentName: string;
  examinationDate: string;
  subjective: string;
  pulseRate: number;
  temperature: number;
  bloodPressure: string;
  respiratoryRate: number;
  weight: number;
  height: number;
  bmi: number;
  assessment: string;
  icd10Code: string;
  icd10Name: string;
  plan: string;
  status: string;
  createdAt: string;
  prescriptionDetails: PrescriptionDetailItem[];
  serviceOrderDetails: ServiceOrderItem[];
}

export interface CreateExaminationParams {
  patientId: string;
  doctorId: string;
  departmentName?: string;
  subjective: string;
  pulseRate: number;
  temperature: number;
  bloodPressure: string;
  respiratoryRate: number;
  weight: number;
  height: number;
  assessment: string;
  icd10Code: string;
  icd10Name: string;
  plan: string;
  status?: string;
  prescriptionDetails: PrescriptionDetailItem[];
  serviceOrderDetails: ServiceOrderItem[];
}



export const examinationService = {
  async getExaminations(search?: string, patientId?: string): Promise<ExaminationItem[]> {
    const response = await api.get('/examinations', {
      params: { search, patientId },
    });
    return response.data || [];
  },

  async getExaminationById(id: string): Promise<ExaminationItem | null> {
    const response = await api.get(`/examinations/${id}`);
    return response.data;
  },

  async createExamination(params: CreateExaminationParams): Promise<ExaminationItem> {
    const response = await api.post('/examinations', params);
    return response.data;
  },
};
