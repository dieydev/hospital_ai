import api from './api';

export interface PrescriptionDetailItem {
  id?: string;
  medicineName: string;
  activeIngredient?: string;
  unit: string;
  quantity: number;
  dosageInstruction: string;
  usageTime?: string; // Sáng 1 viên, Tối 1 viên sau ăn
  unitPrice: number;
  note?: string;
}

export interface ServiceOrderItem {
  id?: string;
  serviceName: string;
  serviceCategory: string;
  price: number;
  result?: string;
  status: string;
}

export interface LabTestDetailItem {
  testName: string;
  category: string;
  result: string;
  unit: string;
  referenceRange: string;
  evaluation: 'Bình thường' | 'Tăng nhẹ' | 'Tăng cao' | 'Giảm';
}

export interface ImagingStudyItem {
  modality: string; // X-Quang, Siêu âm, CT-Scanner, MRI
  title: string;
  findings: string;
  conclusion: string;
  doctorName?: string;
}

export interface DailyCareNoteItem {
  date: string;
  vitals: string;
  nurseNote: string;
  caregiver: string;
}

export interface ExaminationItem {
  id: string;
  examinationCode: string;
  patientId: string;
  patientCode: string;
  patientName: string;
  patientGender: string;
  patientAge: number;
  patientDateOfBirth?: string;
  identityCardNumber: string;
  healthInsuranceNumber?: string;
  insuranceExpiryDate?: string;
  insuranceBenefitRate?: string; // 80% hoặc 100%
  insurancePlace?: string;
  profession?: string; // Nghề nghiệp
  address?: string; // Nơi cư trú / Tạm trú
  
  // Thông tin người nhà / liên hệ
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  emergencyContactAddress?: string;

  // Dữ liệu quản lý viện
  emrFileNumber?: string; // Số hồ sơ lưu trữ EMR / Số vào viện
  admissionDate: string; // Ngày giờ vào viện / tiếp nhận
  dischargeDate?: string; // Ngày giờ ra viện / kết thúc khám
  admissionType?: string; // Ngoại trú / Cấp cứu / Chuyển tuyến
  departmentName: string;
  doctorId: string;
  doctorName: string;
  examinationDate: string;

  // I. Lý do vào viện & Quá trình bệnh lý
  subjective: string; // Triệu chứng chính / Lý do vào viện
  reasonForAdmission?: string; // Lý do vào viện
  pathologicalProcess?: string; // Diễn biến từ lúc khởi phát đến khi vào viện
  medicalHistoryPersonal?: string; // Tiền sử bản thân (bệnh lý, dị ứng, thói quen)
  medicalHistoryFamily?: string; // Tiền sử gia đình
  drugAllergies?: string;
  bloodType?: string;

  // II. Kết quả thăm khám ban đầu
  generalExamination?: string; // Thể trạng, tri giác, da niêm mạc, hạch ngoại vi, phù...
  pulseRate: number; // Mạch bpm
  temperature: number; // Nhiệt độ °C
  bloodPressure: string; // Huyết áp mmHg
  respiratoryRate: number; // Nhịp thở lần/phút
  spO2?: number; // %
  weight: number; // kg
  height: number; // cm
  bmi: number;
  
  // Khám các cơ quan bộ phận
  circulatoryExam?: string; // Tuần hoàn / Tim mạch
  respiratoryExam?: string; // Hô hấp
  digestiveExam?: string; // Tiêu hóa
  nervousExam?: string; // Thần kinh
  musculoskeletalExam?: string; // Cơ xương khớp
  entExam?: string; // Tai mũi họng / Răng hàm mặt

  // III. Cận lâm sàng & Thăm dò chức năng
  labTests?: LabTestDetailItem[];
  imagingStudies?: ImagingStudyItem[];
  functionalStudies?: string; // Điện tâm đồ (ECG), điện não đồ

  // IV. Chẩn đoán
  initialDiagnosis?: string; // Chẩn đoán khi vào viện
  preliminaryDiagnosis?: string; // Chẩn đoán sơ bộ
  assessment: string; // Chẩn đoán xác định
  icd10Code: string;
  icd10Name: string;
  differentialDiagnosis?: string; // Chẩn đoán phân biệt / bệnh kèm theo

  // V. Quá trình điều trị & Chăm sóc
  treatmentMethod?: string; // Phương pháp điều trị & phác đồ
  plan: string;
  prescriptionDetails: PrescriptionDetailItem[];
  serviceOrderDetails: ServiceOrderItem[];
  dailyCareNotes?: DailyCareNoteItem[]; // Phiếu theo dõi chức năng sống & điều dưỡng
  consultationMinutes?: string; // Biên bản hội chẩn
  surgicalConsentNote?: string; // Giấy cam kết phẫu thuật / thủ thuật

  // VI. Tổng kết sau điều trị & Ra viện
  dischargeStatus?: string; // Tình trạng người bệnh lúc ra viện
  nextTreatmentPlan?: string; // Hướng điều trị tiếp theo
  dietaryAndLivingAdvice?: string; // Chế độ ăn uống và sinh hoạt
  followUpAppointment?: string; // Lịch hẹn tái khám và lời dặn

  status: string;
  createdAt: string;
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
    try {
      const response = await api.get('/examinations', {
        params: { search, patientId },
      });
      return response.data || [];
    } catch {
      return [];
    }
  },

  async getExaminationById(id: string): Promise<ExaminationItem | null> {
    try {
      const response = await api.get(`/examinations/${id}`);
      return response.data;
    } catch {
      return null;
    }
  },

  async createExamination(params: CreateExaminationParams): Promise<ExaminationItem> {
    const response = await api.post('/examinations', params);
    return response.data;
  },
};

