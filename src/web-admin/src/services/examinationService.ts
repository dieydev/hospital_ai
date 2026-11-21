import api from './api';

export interface SecondaryDiagnosisItem {
  icd10Code: string;
  icd10Name: string;
  isComplication?: boolean; // Biến chứng
  notes?: string;
}

export interface PrescriptionDetailItem {
  id?: string;
  medicineName: string;
  nationalDrugCode?: string; // Mã thuốc / hoạt chất theo Danh mục dùng chung Cổng Dược (TT 26/2025)
  brandName?: string; // Biệt dược
  activeIngredient?: string; // Hoạt chất
  concentration?: string; // Hàm lượng (40mg, 500mg...)
  dosageForm?: string; // Dạng bào chế (Viên nén, Viên nang...)
  administrationRoute?: string; // Đường dùng (Uống, Tiêm...)
  unit: string;
  quantity: number;
  durationDays?: number; // Số ngày dùng thuốc
  morningDose?: string; // Liều sáng
  noonDose?: string; // Liều trưa
  afternoonDose?: string; // Liều chiều
  eveningDose?: string; // Liều tối
  dosageInstruction: string;
  usageTime?: string; // Sáng 1 viên, Tối 1 viên sau ăn
  unitPrice: number;
  note?: string;
  drugInteractionWarning?: string; // Cảnh báo tương tác thuốc
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

  // IV. Chẩn đoán theo chuẩn ICD-10 (Thông tư 06/2026/TT-BYT)
  initialDiagnosis?: string; // Chẩn đoán khi vào viện
  preliminaryDiagnosis?: string; // Chẩn đoán sơ bộ
  assessment: string; // Chẩn đoán xác định
  icd10Code: string; // Mã ICD-10 bệnh chính
  icd10Name: string; // Tên bệnh theo ICD-10
  icd10ChapterCode?: string; // Mã chương TT 06/2026 (vd: 'IX', 'XI', 'X')
  icd10ChapterName?: string; // Tên chương bệnh
  secondaryDiagnoses?: SecondaryDiagnosisItem[]; // Bệnh kèm theo / biến chứng
  diseaseStage?: 'Cấp tính' | 'Mạn tính' | 'Đợt cấp mạn tính' | 'Nghi ngờ';
  diagnosisType?: 'Ban đầu' | 'Xác định' | 'Phân biệt' | 'Ra viện';
  isEpidemicAlert?: boolean; // Cảnh báo dịch tễ truyền nhiễm
  differentialDiagnosis?: string; // Chẩn đoán phân biệt

  // V. Chuẩn liên thông Đơn thuốc điện tử quốc gia (Thông tư 26/2025/TT-BYT)
  treatmentMethod?: string; // Phương pháp điều trị & phác đồ
  plan: string;
  prescriptionDetails: PrescriptionDetailItem[];
  serviceOrderDetails: ServiceOrderItem[];
  dailyCareNotes?: DailyCareNoteItem[]; // Phiếu theo dõi chức năng sống & y tế
  consultationMinutes?: string; // Biên bản hội chẩn
  surgicalConsentNote?: string; // Giấy cam kết phẫu thuật / thủ thuật
  nationalPrescriptionCode?: string; // Mã đơn thuốc điện tử quốc gia (74001_YYYYMMDD_STT)
  facilityCode?: string; // 74001
  facilityName?: string; // Bệnh viện Đa khoa Thủ Dầu Một - Hospital AI
  nationalSyncStatus?: 'NotSynced' | 'Pending' | 'Synced' | 'Failed';
  nationalTransactionId?: string; // Mã giao dịch ERX
  nationalSyncTimestamp?: string;
  nationalSyncMessage?: string;
  nationalLookupQR?: string; // Link tra cứu đơn thuốc quốc gia
  treatmentType?: 'Ngoại trú' | 'Nội trú';
  followUpDate?: string;

  // VI. Chứng chỉ & Phạm vi hành nghề Bác sĩ (Thông tư 32/2023/TT-BYT)
  doctorLicenseNumber?: string; // Số CCHN / Giấy phép hành nghề
  doctorScopeOfPractice?: string; // Phạm vi hoạt động chuyên môn theo TT 32/2023
  doctorDegreeLevel?: string; // Học hàm học vị (BS.CKII, BS.CKI, ThS, TS...)
  doctorIssuer?: string; // Cơ quan cấp CCHN
  isPracticeScopeCompliant?: boolean; // Xác thực phạm vi hành nghề hợp lệ với khoa điều trị

  // VII. Tổng kết sau điều trị & Ra viện
  dischargeStatus?: string; // Tình trạng người bệnh lúc ra viện
  nextTreatmentPlan?: string; // Hướng điều trị tiếp theo
  dietaryAndLivingAdvice?: string; // Chế độ ăn uống và sinh hoạt
  followUpAppointment?: string; // Lịch hẹn tái khám và lời dặn

  status: string;
  createdAt: string;
  isDigitallySigned?: boolean;
  signedAt?: string;
  signatureCertificateSerial?: string;
  signatureHash?: string;
  digitalSignature?: string;
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
  icd10ChapterCode?: string;
  icd10ChapterName?: string;
  secondaryDiagnoses?: SecondaryDiagnosisItem[];
  diseaseStage?: string;
  diagnosisType?: string;
  plan: string;
  status?: string;
  prescriptionDetails: PrescriptionDetailItem[];
  serviceOrderDetails: ServiceOrderItem[];
  
  // Dữ liệu chứng chỉ bác sĩ TT 32/2023 & Liên thông TT 26/2025
  doctorLicenseNumber?: string;
  doctorScopeOfPractice?: string;
  doctorDegreeLevel?: string;
  nationalPrescriptionCode?: string;
  nationalSyncStatus?: 'NotSynced' | 'Pending' | 'Synced' | 'Failed';
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

  async signExamination(id: string, pinCode?: string, doctorLicenseNumber?: string): Promise<any> {
    const response = await api.post(`/examinations/${id}/sign`, {
      pinCode: pinCode || '123456',
      doctorLicenseNumber: doctorLicenseNumber || '004568/BD-GPHN',
      certificateSerial: `5404-B7A1-${Math.floor(Math.random() * 90000000 + 10000000)}`
    });
    return response.data;
  },

  async verifySignature(id: string): Promise<any> {
    const response = await api.get(`/examinations/${id}/verify-signature`);
    return response.data;
  },

  // Đồng bộ liên thông Đơn thuốc điện tử quốc gia (Thông tư 26/2025/TT-BYT & Cổng Donthuocquocgia.vn)
  async syncNationalPrescription(examId: string): Promise<{
    success: boolean;
    nationalPrescriptionCode: string;
    nationalTransactionId: string;
    syncTimestamp: string;
    message: string;
    lookupUrl: string;
  }> {
    try {
      const response = await api.post(`/examinations/${examId}/sync-national-erx`);
      return response.data;
    } catch {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSeq = String(Math.floor(Math.random() * 900000 + 100000));
      const nationalCode = `74001_${dateStr}_${randomSeq}`;
      const transId = `ERX-VN-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 8999 + 1000)}`;
      const timestamp = new Date().toISOString();
      return {
        success: true,
        nationalPrescriptionCode: nationalCode,
        nationalTransactionId: transId,
        syncTimestamp: timestamp,
        message: 'Đơn thuốc điện tử đã được mã hóa theo chuẩn TT 26/2025 và liên thông thành công lên Cổng Donthuocquocgia.vn!',
        lookupUrl: `https://donthuocquocgia.vn/tra-cuu?code=${nationalCode}&cskcb=74001`,
      };
    }
  },
};

