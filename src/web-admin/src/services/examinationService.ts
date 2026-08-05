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

let localExaminations: ExaminationItem[] = [
  {
    id: 'ex-01',
    examinationCode: 'LK20260802-01',
    patientId: '276-15f20b4ed6be',
    patientCode: 'BN20260013',
    patientName: 'Phan Thu Thảo',
    patientGender: 'Nữ',
    patientAge: 16,
    identityCardNumber: '079110000013',
    healthInsuranceNumber: 'TE4010123450013',
    doctorId: 'usr-001',
    doctorName: 'BS. CKII. Nguyễn Thanh Duy',
    departmentName: 'Khoa Nội Tổng Hợp',
    examinationDate: new Date().toISOString(),
    subjective: 'Đau họng 3 ngày, sốt nhẹ 38.0°C, nuốt đau, mệt mỏi.',
    pulseRate: 82,
    temperature: 38.0,
    bloodPressure: '115/75',
    respiratoryRate: 18,
    weight: 48,
    height: 158,
    bmi: 19.2,
    assessment: 'Viêm họng cấp tính do vi khuẩn',
    icd10Code: 'J02.9',
    icd10Name: 'Viêm họng cấp tính, không đặc hiệu',
    plan: 'Nghỉ ngơi 3 ngày, uống nhiều nước ấm, duy trì đơn thuốc 5 ngày.',
    status: 'Hoàn thành',
    createdAt: new Date().toISOString(),
    prescriptionDetails: [
      { medicineName: 'Paracetamol 500mg', unit: 'Viên', quantity: 15, dosageInstruction: 'Sáng 1v, Tối 1v sau ăn', unitPrice: 2000 },
      { medicineName: 'Augmentin 1g (Amoxicillin/Clavulanate)', unit: 'Viên', quantity: 10, dosageInstruction: 'Sáng 1v, Tối 1v sau ăn no', unitPrice: 15000 },
      { medicineName: 'Vitamin C 500mg', unit: 'Viên', quantity: 10, dosageInstruction: 'Sáng 1v sau ăn', unitPrice: 1500 },
    ],
    serviceOrderDetails: [
      { serviceName: 'Xét nghiệm công thức máu toàn phần (CBC)', serviceCategory: 'Xét nghiệm', price: 120000, result: 'WBC: 11.2 K/uL (Tăng nhẹ)', status: 'Đã có kết quả' },
    ],
  },
];

export const examinationService = {
  async getExaminations(search?: string, patientId?: string): Promise<ExaminationItem[]> {
    try {
      const response = await api.get('/examinations', {
        params: { search, patientId },
      });
      return response.data || [];
    } catch {
      let filtered = localExaminations;
      if (search) {
        const kw = search.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.patientName.toLowerCase().includes(kw) ||
            e.patientCode.toLowerCase().includes(kw) ||
            e.icd10Code.toLowerCase().includes(kw) ||
            e.icd10Name.toLowerCase().includes(kw)
        );
      }
      return filtered;
    }
  },

  async getExaminationById(id: string): Promise<ExaminationItem | null> {
    try {
      const response = await api.get(`/examinations/${id}`);
      return response.data;
    } catch {
      return localExaminations.find((e) => e.id === id) || null;
    }
  },

  async createExamination(params: CreateExaminationParams): Promise<ExaminationItem> {
    try {
      const response = await api.post('/examinations', params);
      return response.data;
    } catch {
      const heightM = params.height > 0 ? params.height / 100 : 1.7;
      const bmi = Math.round((params.weight / (heightM * heightM)) * 10) / 10;

      const newExam: ExaminationItem = {
        id: `ex-${Date.now()}`,
        examinationCode: `LK202608-${Math.floor(Math.random() * 900) + 100}`,
        patientId: params.patientId,
        patientCode: 'BN20260001',
        patientName: 'Bệnh nhân Khám mới',
        patientGender: 'Nam',
        patientAge: 35,
        identityCardNumber: '038090001234',
        doctorId: params.doctorId,
        doctorName: 'BS. CKII. Nguyễn Thanh Duy',
        departmentName: params.departmentName || 'Khoa Nội Tổng Hợp',
        examinationDate: new Date().toISOString(),
        subjective: params.subjective,
        pulseRate: params.pulseRate,
        temperature: params.temperature,
        bloodPressure: params.bloodPressure,
        respiratoryRate: params.respiratoryRate,
        weight: params.weight,
        height: params.height,
        bmi,
        assessment: params.assessment,
        icd10Code: params.icd10Code,
        icd10Name: params.icd10Name,
        plan: params.plan,
        status: params.status || 'Hoàn thành',
        createdAt: new Date().toISOString(),
        prescriptionDetails: params.prescriptionDetails,
        serviceOrderDetails: params.serviceOrderDetails,
      };

      localExaminations.unshift(newExam);
      return newExam;
    }
  },
};
