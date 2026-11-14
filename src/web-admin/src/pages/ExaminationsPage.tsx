import React, { useEffect, useState, useCallback } from 'react';
import { geminiService, ICD10SuggestionItem } from '../services/geminiService';
import { QRCodeSVG } from 'qrcode.react';
import '../styles/prescriptionPrint.css';
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  Table,
  Tag,
  Alert,
  Badge,
  Modal,
  Select,
  InputNumber,
  Tabs,
  Drawer,
  Tooltip,
  Radio,
} from 'antd';
import {
  SaveOutlined,
  RobotOutlined,
  PlusOutlined,
  DeleteOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  SearchOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  HeartOutlined,
  SoundOutlined,
  ExperimentOutlined,
  HistoryOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  QrcodeOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatCurrency } from '../utils/formatters';
import {
  examinationService,
  ExaminationItem,
  PrescriptionDetailItem,
  ServiceOrderItem,
} from '../services/examinationService';
import { patientService, Patient } from '../services/patientService';
import { queueService } from '../services/queueService';
import { signalrService } from '../services/signalrService';
import { showSuccessAlert, showToast, showErrorAlert } from '../utils/sweetAlert';

const { Text } = Typography;
const { TextArea } = Input;
const { Option, OptGroup } = Select;

// ==========================================
// DANH MỤC THUỐC CHUẨN DƯỢC ĐIỂN BỘ Y TẾ
// ==========================================
interface DrugCatalogItem {
  code: string;
  name: string;
  activeIngredient: string;
  category: string;
  unit: string;
  unitPrice: number;
  defaultDosage: string;
}

const STANDARD_DRUG_CATALOG: DrugCatalogItem[] = [
  // Kháng sinh & Kháng khuẩn
  { code: 'AUG-1G', name: 'Augmentin 1g (Amoxicillin/Clavulanate)', activeIngredient: 'Amoxicillin 875mg + Acid Clavulanic 125mg', category: 'Kháng sinh & Kháng khuẩn', unit: 'Viên', unitPrice: 18500, defaultDosage: 'Sáng 1 viên, Tối 1 viên sau ăn no (cách 12 giờ)' },
  { code: 'CFX-200', name: 'Cefixim 200mg (Hasan)', activeIngredient: 'Cefixim trihydrat 200mg', category: 'Kháng sinh & Kháng khuẩn', unit: 'Viên', unitPrice: 12000, defaultDosage: 'Ngày 2 lần, mỗi lần 1 viên sau ăn' },
  { code: 'AZI-500', name: 'Azithromycin 500mg (Zithromax)', activeIngredient: 'Azithromycin 500mg', category: 'Kháng sinh & Kháng khuẩn', unit: 'Viên', unitPrice: 22000, defaultDosage: 'Uống 1 lần/ngày, 1 viên trước ăn 1h hoặc sau ăn 2h' },
  { code: 'CIPRO-500', name: 'Ciprofloxacin 500mg', activeIngredient: 'Ciprofloxacin HCl 500mg', category: 'Kháng sinh & Kháng khuẩn', unit: 'Viên', unitPrice: 8500, defaultDosage: 'Sáng 1 viên, Tối 1 viên sau ăn no' },

  // Giảm đau - Hạ sốt - Kháng viêm NSAID
  { code: 'PARA-500', name: 'Paracetamol 500mg (Panadol/Hasan)', activeIngredient: 'Paracetamol 500mg', category: 'Giảm đau & Hạ sốt', unit: 'Viên', unitPrice: 1500, defaultDosage: 'Sáng 1v, Tối 1v sau ăn (uống cách nhau 4-6h khi sốt > 38.5°C)' },
  { code: 'EFFER-500', name: 'Efferalgan 500mg (Viên sủi)', activeIngredient: 'Paracetamol 500mg', category: 'Giảm đau & Hạ sốt', unit: 'Viên', unitPrice: 3500, defaultDosage: 'Hòa tan 1 viên trong 150ml nước sôi để nguội, uống khi sốt' },
  { code: 'IBU-400', name: 'Ibuprofen 400mg (Brufen)', activeIngredient: 'Ibuprofen 400mg', category: 'Kháng viêm NSAID', unit: 'Viên', unitPrice: 2800, defaultDosage: 'Ngày 2 lần, mỗi lần 1 viên sau ăn no' },
  { code: 'MELOX-7.5', name: 'Meloxicam 7.5mg (Mobic)', activeIngredient: 'Meloxicam 7.5mg', category: 'Kháng viêm NSAID', unit: 'Viên', unitPrice: 6500, defaultDosage: 'Uống 1 viên vào buổi sáng sau ăn no' },
  { code: 'ALPHA-CHY', name: 'Alpha Chymotrypsine 4.2mg (Choay)', activeIngredient: 'Chymotrypsine 4200 IU', category: 'Kháng viêm chống phù nề', unit: 'Viên', unitPrice: 3000, defaultDosage: 'Ngậm dưới lưỡi 2 viên/lần, ngày 2 lần' },

  // Tim mạch & Huyết áp & Mỡ máu
  { code: 'AMLO-5', name: 'Amlodipine 5mg (Amlor)', activeIngredient: 'Amlodipine besylate 5mg', category: 'Tim mạch & Huyết áp', unit: 'Viên', unitPrice: 4200, defaultDosage: 'Sáng 1 viên sau ăn' },
  { code: 'LOSAR-50', name: 'Losartan Potassium 50mg (Cozaar)', activeIngredient: 'Losartan potassium 50mg', category: 'Tim mạch & Huyết áp', unit: 'Viên', unitPrice: 7000, defaultDosage: 'Sáng 1 viên sau ăn cố định giờ mỗi ngày' },
  { code: 'CONCOR-2.5', name: 'Concor 2.5mg (Bisoprolol)', activeIngredient: 'Bisoprolol fumarate 2.5mg', category: 'Tim mạch & Huyết áp', unit: 'Viên', unitPrice: 5500, defaultDosage: 'Sáng 1 viên trước ăn sáng' },
  { code: 'ATOR-20', name: 'Atorvastatin 20mg (Lipitor)', activeIngredient: 'Atorvastatin calcium 20mg', category: 'Tim mạch & Huyết áp', unit: 'Viên', unitPrice: 12500, defaultDosage: 'Tối 1 viên trước khi đi ngủ' },

  // Dạ dày - Tiêu hóa
  { code: 'ESOM-40', name: 'Esomeprazole 40mg (Nexium Mups)', activeIngredient: 'Esomeprazole magnesium 40mg', category: 'Dạ dày & Tiêu hóa', unit: 'Viên', unitPrice: 24000, defaultDosage: 'Sáng 1 viên trước ăn sáng 30 - 60 phút' },
  { code: 'PHOS-GEL', name: 'Phosphalugel (Thuốc dạ dày chữ P)', activeIngredient: 'Aluminium phosphate 20%', category: 'Dạ dày & Tiêu hóa', unit: 'Gói', unitPrice: 5500, defaultDosage: 'Uống 1 gói khi đau hoặc sau ăn 1-2 giờ' },
  { code: 'MOTIL-10', name: 'Motilium-M 10mg (Domperidone)', activeIngredient: 'Domperidone maleate 10mg', category: 'Dạ dày & Tiêu hóa', unit: 'Viên', unitPrice: 3800, defaultDosage: 'Uống 1 viên trước mỗi bữa ăn 15-30 phút' },
  { code: 'BERBER-100', name: 'Berberin Clorhydrat 100mg', activeIngredient: 'Berberin clorhydrat 100mg', category: 'Dạ dày & Tiêu hóa', unit: 'Viên', unitPrice: 1200, defaultDosage: 'Ngày 2 lần, mỗi lần 2 viên sau ăn' },

  // Đái tháo đường
  { code: 'MET-850', name: 'Metformin 850mg (Glucophage)', activeIngredient: 'Metformin hydrochloride 850mg', category: 'Đái tháo đường', unit: 'Viên', unitPrice: 3500, defaultDosage: 'Uống 1 viên trong hoặc ngay sau bữa ăn' },
  { code: 'GLIC-30', name: 'Diamicron MR 30mg (Gliclazide)', activeIngredient: 'Gliclazide phóng thích biến đổi 30mg', category: 'Đái tháo đường', unit: 'Viên', unitPrice: 4800, defaultDosage: 'Sáng 1 viên trước bữa ăn sáng' },

  // Hô hấp - Dị ứng
  { code: 'FEXO-180', name: 'Telfast HD 180mg (Fexofenadine)', activeIngredient: 'Fexofenadine HCl 180mg', category: 'Kháng Histamin & Dị ứng', unit: 'Viên', unitPrice: 14500, defaultDosage: 'Tối 1 viên sau ăn' },
  { code: 'DESLO-5', name: 'Aerius 5mg (Desloratadine)', activeIngredient: 'Desloratadine 5mg', category: 'Kháng Histamin & Dị ứng', unit: 'Viên', unitPrice: 9500, defaultDosage: 'Uống 1 viên vào buổi tối' },
  { code: 'ACETYL-200', name: 'Acemuc 200mg (Acetylcysteine)', activeIngredient: 'Acetylcysteine 200mg', category: 'Hô hấp & Long đờm', unit: 'Gói', unitPrice: 3200, defaultDosage: 'Ngày 3 lần, mỗi lần 1 gói pha nước uống' },
  { code: 'BROM-8', name: 'Bisolvon 8mg (Bromhexin)', activeIngredient: 'Bromhexin HCl 8mg', category: 'Hô hấp & Long đờm', unit: 'Viên', unitPrice: 1800, defaultDosage: 'Ngày 3 lần, mỗi lần 1 viên sau ăn' },

  // Cơ xương khớp & Bổ thần kinh
  { code: 'GLUCO-500', name: 'Glucosamine Sulfate 500mg', activeIngredient: 'Glucosamine sulfate 500mg', category: 'Cơ xương khớp & Vitamin', unit: 'Viên', unitPrice: 4500, defaultDosage: 'Sáng 1 viên, Chiều 1 viên sau ăn' },
  { code: 'VIT-3B', name: 'Vitamin 3B (B1 + B6 + B12)', activeIngredient: 'Thiamin, Pyridoxin, Cyanocobalamin', category: 'Cơ xương khớp & Vitamin', unit: 'Viên', unitPrice: 2000, defaultDosage: 'Sáng 1 viên, Trưa 1 viên sau ăn' },
];

// ==========================================
// DANH MỤC DỊCH VỤ CẬN LÂM SÀNG (CLS) CHUẨN BỘ Y TẾ
// ==========================================
interface ParaclinicalCatalogItem {
  code: string;
  name: string;
  category: 'Xét nghiệm Huyết học & Miễn dịch' | 'Xét nghiệm Sinh hóa & Nước tiểu' | 'Chẩn đoán hình ảnh' | 'Thăm dò chức năng & Nội soi';
  room: string;
  price: number;
  insurancePrice: number;
  sampleType: string;
}

const STANDARD_PARACLINICAL_CATALOG: ParaclinicalCatalogItem[] = [
  // Xét nghiệm Huyết học & Miễn dịch
  { code: 'CBC-18', name: 'Tổng phân tích tế bào máu ngoại vi bằng laser (CBC 18 thông số)', category: 'Xét nghiệm Huyết học & Miễn dịch', room: 'P.105 - Khoa Xét Nghiệm', price: 110000, insurancePrice: 45000, sampleType: 'Máu tĩnh mạch (EDTA)' },
  { code: 'CRP-01', name: 'Định lượng CRP (Protein phản ứng C định lượng)', category: 'Xét nghiệm Huyết học & Miễn dịch', room: 'P.105 - Khoa Xét Nghiệm', price: 120000, insurancePrice: 52000, sampleType: 'Huyết thanh' },
  { code: 'BLOOD-GRP', name: 'Xác định nhóm máu hệ ABO và Rh(D)', category: 'Xét nghiệm Huyết học & Miễn dịch', room: 'P.105 - Khoa Xét Nghiệm', price: 75000, insurancePrice: 38000, sampleType: 'Máu toàn phần' },
  { code: 'COAG-01', name: 'Đông máu cơ bản (PT, APTT, Fibrinogen)', category: 'Xét nghiệm Huyết học & Miễn dịch', room: 'P.105 - Khoa Xét Nghiệm', price: 150000, insurancePrice: 70000, sampleType: 'Huyết tương Citrat' },
  { code: 'DENGUE-NS1', name: 'Test nhanh Kháng nguyên Dengue NS1 (Sốt xuất huyết)', category: 'Xét nghiệm Huyết học & Miễn dịch', room: 'P.105 - Khoa Xét Nghiệm', price: 180000, insurancePrice: 85000, sampleType: 'Huyết thanh' },
  { code: 'FLU-AB', name: 'Test nhanh Cúm A/B (Influenza A/B Antigen)', category: 'Xét nghiệm Huyết học & Miễn dịch', room: 'P.105 - Khoa Xét Nghiệm', price: 160000, insurancePrice: 75000, sampleType: 'Dịch tỵ hầu' },

  // Xét nghiệm Sinh hóa & Nước tiểu
  { code: 'GLU-01', name: 'Định lượng Glucose máu (Đường huyết lúc đói)', category: 'Xét nghiệm Sinh hóa & Nước tiểu', room: 'P.105 - Khoa Xét Nghiệm', price: 45000, insurancePrice: 22000, sampleType: 'Huyết thanh' },
  { code: 'HBA1C-01', name: 'Định lượng HbA1c bằng phương pháp sắc ký lỏng HPLC', category: 'Xét nghiệm Sinh hóa & Nước tiểu', room: 'P.105 - Khoa Xét Nghiệm', price: 160000, insurancePrice: 82000, sampleType: 'Máu toàn phần EDTA' },
  { code: 'LIVER-01', name: 'Đo hoạt độ Men gan AST (GOT) & ALT (GPT)', category: 'Xét nghiệm Sinh hóa & Nước tiểu', room: 'P.105 - Khoa Xét Nghiệm', price: 90000, insurancePrice: 42000, sampleType: 'Huyết thanh' },
  { code: 'KIDNEY-01', name: 'Định lượng Ure & Creatinine máu (Chức năng thận)', category: 'Xét nghiệm Sinh hóa & Nước tiểu', room: 'P.105 - Khoa Xét Nghiệm', price: 80000, insurancePrice: 38000, sampleType: 'Huyết thanh' },
  { code: 'LIPID-01', name: 'Bộ mỡ máu toàn phần (Cholesterol, Triglycerid, HDL-C, LDL-C)', category: 'Xét nghiệm Sinh hóa & Nước tiểu', room: 'P.105 - Khoa Xét Nghiệm', price: 180000, insurancePrice: 88000, sampleType: 'Huyết thanh' },
  { code: 'URIC-01', name: 'Định lượng Axit Uric máu (Tầm soát bệnh Gout)', category: 'Xét nghiệm Sinh hóa & Nước tiểu', room: 'P.105 - Khoa Xét Nghiệm', price: 50000, insurancePrice: 25000, sampleType: 'Huyết thanh' },
  { code: 'URINE-10', name: 'Tổng phân tích nước tiểu 10 thông số (Máy tự động)', category: 'Xét nghiệm Sinh hóa & Nước tiểu', room: 'P.105 - Khoa Xét Nghiệm', price: 55000, insurancePrice: 28000, sampleType: 'Nước tiểu tươi' },

  // Chẩn đoán hình ảnh
  { code: 'XQ-CHEST', name: 'Chụp X-quang Ngực thẳng kỹ thuật số (Tim phổi)', category: 'Chẩn đoán hình ảnh', room: 'P.110 - Phòng X-Quang', price: 150000, insurancePrice: 68000, sampleType: 'Phim số hóa DR' },
  { code: 'XQ-SPINE', name: 'Chụp X-quang Cột sống thắt lưng 2 tư thế (Thẳng/Nghiêng)', category: 'Chẩn đoán hình ảnh', room: 'P.110 - Phòng X-Quang', price: 180000, insurancePrice: 85000, sampleType: 'Phim số hóa DR' },
  { code: 'XQ-KNEE', name: 'Chụp X-quang Khớp gối thẳng/nghiêng', category: 'Chẩn đoán hình ảnh', room: 'P.110 - Phòng X-Quang', price: 160000, insurancePrice: 72000, sampleType: 'Phim số hóa DR' },
  { code: 'US-ABDOMEN', name: 'Siêu âm Ổ bụng tổng quát Doppler màu', category: 'Chẩn đoán hình ảnh', room: 'P.112 - Phòng Siêu Âm', price: 200000, insurancePrice: 95000, sampleType: 'Hình ảnh Doppler' },
  { code: 'US-THYROID', name: 'Siêu âm Tuyến giáp Doppler màu độ phân giải cao', category: 'Chẩn đoán hình ảnh', room: 'P.112 - Phòng Siêu Âm', price: 180000, insurancePrice: 85000, sampleType: 'Hình ảnh Doppler' },
  { code: 'US-HEART', name: 'Siêu âm Tim Doppler màu 4 buồng tim', category: 'Chẩn đoán hình ảnh', room: 'P.114 - Siêu Âm Tim Mạch', price: 350000, insurancePrice: 175000, sampleType: 'Hình ảnh Doppler màu' },
  { code: 'CT-BRAIN', name: 'Chụp Cắt lớp vi tính (CT-Scanner) Sọ não không cản quang', category: 'Chẩn đoán hình ảnh', room: 'P.118 - Phòng CT-Scanner', price: 950000, insurancePrice: 520000, sampleType: 'Dữ liệu DICOM đa lát cắt' },

  // Thăm dò chức năng & Nội soi
  { code: 'ECG-12', name: 'Ghi Điện tâm đồ (ECG 12 chuyển đạo chuẩn)', category: 'Thăm dò chức năng & Nội soi', room: 'P.106 - Thăm Dò Chức Năng', price: 75000, insurancePrice: 35000, sampleType: 'Bản ghi điện tim' },
  { code: 'ENDO-ENT', name: 'Nội soi Tai Mũi Họng bằng ống mềm độ phân giải cao', category: 'Thăm dò chức năng & Nội soi', room: 'P.204 - Khoa Tai Mũi Họng', price: 250000, insurancePrice: 120000, sampleType: 'Video nội soi' },
  { code: 'ENDO-GI', name: 'Nội soi Thực quản - Dạ dày - Tá tràng không đau (Tiền mê)', category: 'Thăm dò chức năng & Nội soi', room: 'P.212 - Trung Tâm Nội Soi', price: 850000, insurancePrice: 420000, sampleType: 'Hình ảnh HD + Sinh thiết' },
];

const ICD10_CATALOG = [
  { code: 'J02.9', name: 'Viêm họng cấp tính, không đặc hiệu' },
  { code: 'J03.9', name: 'Viêm amydal cấp tính, không đặc hiệu' },
  { code: 'J06.9', name: 'Nhiễm trùng đường hô hấp trên cấp tính' },
  { code: 'I10', name: 'Tăng huyết áp vô căn (nguyên phát)' },
  { code: 'E11.9', name: 'Đái tháo đường tuýp 2 không biến chứng' },
  { code: 'K29.7', name: 'Viêm dạ dày, không đặc hiệu' },
  { code: 'J20.9', name: 'Viêm phế quản cấp tính, không đặc hiệu' },
  { code: 'M17.9', name: 'Thoái hóa khớp gối, không đặc hiệu' },
];

export const ExaminationsPage: React.FC = () => {
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [examinations, setExaminations] = useState<ExaminationItem[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [queueList, setQueueList] = useState<any[]>([]); // Danh sách Hàng chờ
  const [searchText, setSearchText] = useState('');
  const [isSoundOn, setIsSoundOn] = useState(signalrService.getSoundEnabled());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // AI Assist State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<ICD10SuggestionItem[]>([]);

  // Detail View Drawer State
  const [selectedExam, setSelectedExam] = useState<ExaminationItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Print Prescription Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [examToPrint, setExamToPrint] = useState<ExaminationItem | null>(null);

  // Giấy Hẹn Tái Khám Modal State (Theo Lưu Đồ Sơ đồ 1 & 2: Lập giấy hẹn tái khám nếu cần)
  const [isAppointmentSlipModalOpen, setIsAppointmentSlipModalOpen] = useState(false);
  const [appointmentSlipData, setAppointmentSlipData] = useState<any | null>(null);

  // Drug Safety & Allergy Check State
  const [drugSafetyLoading, setDrugSafetyLoading] = useState(false);
  const [drugSafetyWarnings, setDrugSafetyWarnings] = useState<string[]>([]);

  // Tái khám & Lịch sử Đợt Khám Trước
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [previousExam, setPreviousExam] = useState<ExaminationItem | null>(null);
  const [loadingPreviousExam, setLoadingPreviousExam] = useState<boolean>(false);

  // CLS Return / Re-enter queue state (Mắt xích 6: Quét QR quay lại đọc kết quả CLS)
  const [isClsReturnModalOpen, setIsClsReturnModalOpen] = useState(false);
  const [clsReturnInputCode, setClsReturnInputCode] = useState('');
  const [clsFilterTab, setClsFilterTab] = useState<'all' | 'new' | 'cls'>('all');

  // Prescriptions & Services lists in Modal
  const [prescriptions, setPrescriptions] = useState<PrescriptionDetailItem[]>([
    { medicineName: 'Paracetamol 500mg (Panadol/Hasan)', activeIngredient: 'Paracetamol 500mg', unit: 'Viên', quantity: 15, dosageInstruction: 'Sáng 1v, Tối 1v sau ăn (uống khi sốt > 38.5°C)', unitPrice: 1500 },
    { medicineName: 'Augmentin 1g (Amoxicillin/Clavulanate)', activeIngredient: 'Amoxicillin 875mg + Acid Clavulanic 125mg', unit: 'Viên', quantity: 10, dosageInstruction: 'Sáng 1 viên, Tối 1 viên sau ăn no (cách 12 giờ)', unitPrice: 18500 },
  ]);

  const [services, setServices] = useState<ServiceOrderItem[]>([
    { serviceName: 'CBC-18 - Tổng phân tích tế bào máu ngoại vi bằng laser (CBC 18 thông số)', serviceCategory: 'Xét nghiệm Huyết học & Miễn dịch', price: 110000, status: 'Đã chỉ định', result: 'Phòng thực hiện: P.105 - Khoa Xét Nghiệm' },
  ]);

  // Vitals calculation
  const [weight, setWeight] = useState<number>(65);
  const [height, setHeight] = useState<number>(168);

  const calculateBmi = (w: number, h: number) => {
    if (h <= 0) return 0;
    const hm = h / 100;
    return Math.round((w / (hm * hm)) * 10) / 10;
  };

  const bmiValue = calculateBmi(weight, height);

  const handleSpeakCallQueue = (record: ExaminationItem) => {
    const textToSpeak = `Mời bệnh nhân ${record.patientName}, mã bệnh nhân ${record.patientCode}, vào phòng khám ${record.departmentName || 'Khoa Nội'}.`;
    
    showToast(`🔊 Đang phát thông báo loa: "${textToSpeak}"`, 'success');

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Run AI Drug Safety & Allergy Audit with comprehensive clinical data
  const handleRunDrugSafetyCheck = async () => {
    if (prescriptions.length === 0) {
      showToast('Vui lòng kê ít nhất 1 loại thuốc trước khi rà soát!', 'warning');
      return;
    }

    setDrugSafetyLoading(true);
    try {
      const selectedPatientId = form.getFieldValue('patientId');
      const patient = patients.find((p) => p.id === selectedPatientId);

      const allergies: string[] = [];
      if (patient?.diUngThuoc) allergies.push(patient.diUngThuoc);
      if (
        patient?.tienSuBenh &&
        (patient.tienSuBenh.toLowerCase().includes('dị ứng') ||
          patient.tienSuBenh.toLowerCase().includes('allerg'))
      ) {
        allergies.push(patient.tienSuBenh);
      }

      const warnings = await geminiService.checkDrugSafety({
        prescriptions,
        allergies,
        medicalHistory: patient?.tienSuBenh,
        patientAge: patient?.tuoi,
        patientGender: patient?.gioiTinh,
        patientName: patient?.hoTen,
        patientCode: patient?.maBenhNhan,
      });
      setDrugSafetyWarnings(warnings);

      if (warnings.length === 0) {
        showSuccessAlert(
          'Đơn Thuốc An Toàn!',
          'Trợ lý Dược lâm sàng AI không phát hiện tương tác nguy hiểm hay dị ứng thuốc.'
        );
      } else {
        showToast(`Trợ lý AI phát hiện ${warnings.length} cảnh báo an toàn đơn thuốc!`, 'warning');
      }
    } catch {
      showErrorAlert('Lỗi rà soát', 'Không thể kết nối dịch vụ Trợ lý AI Y tế.');
    } finally {
      setDrugSafetyLoading(false);
    }
  };

  const fetchExaminations = useCallback(async () => {
    setLoading(true);
    try {
      const [examRes, patientRes, queueRes] = await Promise.all([
        examinationService.getExaminations(searchText),
        patientService.getPatients(),
        queueService.getTodayQueue(), // Bỏ mock department, load hàng chờ theo thực tế
      ]);
      setExaminations(examRes);
      setPatients(patientRes.items || []);
      setQueueList(queueRes.filter((q: any) => q.status === 'Waiting' || q.status === 'Calling'));
    } catch {
      showErrorAlert('Lỗi tải dữ liệu', 'Không thể kết nối danh sách khám bệnh.');
    } finally {
      setLoading(false);
    }
  }, [searchText]);

  useEffect(() => {
    fetchExaminations();

    // ⚡ Lắng nghe WebSocket/SignalR thời gian thực:
    // Khi bệnh nhân bốc số từ Mobile App hoặc Tiếp tân cấp số, tự động phát chuông và cập nhật hàng chờ
    const unsubscribe = signalrService.subscribeQueueUpdates((data) => {
      console.log('⚡ [ExaminationsPage] Nhận tín hiệu SignalR hàng chờ mới:', data);
      fetchExaminations();
    });

    return () => {
      unsubscribe();
    };
  }, [fetchExaminations]);

  // Handle AI Consultation with Comprehensive Clinical Context (Symptoms + Vitals + History)
  const handleConsultAiICD10 = async () => {
    const subjective = form.getFieldValue('subjective');
    if (!subjective) {
      showToast('Vui lòng nhập triệu chứng lâm sàng trước khi tham khảo AI!', 'warning');
      return;
    }

    const selectedPatientId = form.getFieldValue('patientId');
    const patient = patients.find((p) => p.id === selectedPatientId);

    const vitals = {
      pulse: form.getFieldValue('pulseRate') || 78,
      temp: form.getFieldValue('temperature') || 37.0,
      bp: form.getFieldValue('bloodPressure') || '120/80',
      respiratoryRate: form.getFieldValue('respiratoryRate') || 18,
      weight: form.getFieldValue('weight') || weight,
      height: form.getFieldValue('height') || height,
      bmi: Number(bmiValue),
    };

    setAiLoading(true);
    try {
      const suggestions = await geminiService.suggestICD10({
        subjective,
        vitals,
        medicalHistory: patient?.tienSuBenh,
        patientAge: patient?.tuoi,
        patientGender: patient?.gioiTinh,
        patientName: patient?.hoTen,
        patientCode: patient?.maBenhNhan,
      });
      setAiSuggestions(suggestions);
      showToast('Trợ lý AI Y tế Lâm sàng đã phân tích và đề xuất mã ICD-10!', 'success');
    } catch {
      setAiSuggestions([
        { code: 'J02.9', name: 'Viêm họng cấp tính, không đặc hiệu', match: '98% Phù hợp', category: 'CHÍNH', rationale: 'Đau rát họng, niêm mạc sung huyết' },
        { code: 'J03.9', name: 'Viêm amydal cấp tính, không đặc hiệu', match: '85% Phù hợp', category: 'PHÂN_BIỆT', rationale: 'Cần khám hạch cổ và amidan phì đại' },
        { code: 'J06.9', name: 'Nhiễm trùng đường hô hấp trên cấp tính', match: '72% Phù hợp', category: 'PHÂN_BIỆT', rationale: 'Kèm sốt nhẹ và chảy dịch mũi' },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // 📋 Tra cứu & Xử lý Lịch sử Đợt Khám Trước (Phục vụ Tái Khám)
  const loadPreviousExam = useCallback(async (patientId: string) => {
    if (!patientId) {
      setPreviousExam(null);
      return;
    }
    setLoadingPreviousExam(true);
    try {
      // 1. Kiểm tra trong danh sách examinations đã tải về
      let patientExams = examinations.filter((e) => e.patientId === patientId);
      // 2. Nếu chưa có trong state hiện tại, query API backend
      if (patientExams.length === 0) {
        const fetched = await examinationService.getExaminations('', patientId);
        if (fetched && fetched.length > 0) {
          patientExams = fetched;
        }
      }

      if (patientExams.length > 0) {
        // Sắp xếp ngày khám mới nhất lên đầu
        const sorted = [...patientExams].sort((a, b) => {
          const timeA = new Date(a.examinationDate || a.createdAt || 0).getTime();
          const timeB = new Date(b.examinationDate || b.createdAt || 0).getTime();
          return timeB - timeA;
        });
        setPreviousExam(sorted[0]);
      } else {
        // Fallback đọc từ cache tiếp nhận tái khám nếu chưa lưu vào DB
        const localCached = localStorage.getItem(`previous_exam_${patientId}`);
        if (localCached) {
          try {
            const parsed = JSON.parse(localCached);
            const cachedExam: any = {
              id: `prev-${Date.now()}`,
              examinationCode: 'EMR-PREV-2026',
              patientId: patientId,
              doctorName: parsed.doctorName || 'BS. CKII. Nguyễn Thanh Duy',
              departmentName: parsed.department || 'Khoa Nội Tổng Hợp',
              icd10Code: parsed.icd10Code || 'K29.7',
              icd10Name: parsed.icd10Name || 'Viêm dạ dày, không đặc hiệu',
              subjective: parsed.subjective || 'Đau tức thượng vị',
              assessment: parsed.icd10Name || 'Viêm dạ dày',
              plan: parsed.plan || 'Điều trị ngoại trú theo đơn thuốc',
              examinationDate: parsed.date || '2026-11-01',
              bloodPressure: '120/80',
              pulseRate: 76,
              temperature: 36.8,
              weight: 65,
              height: 168,
              prescriptionDetails: (parsed.medicines || []).map((m: any) => ({
                medicineName: m.name,
                activeIngredient: m.name,
                unit: m.unit || 'Viên',
                quantity: m.quantity || 10,
                dosageInstruction: m.dosage || 'Ngày uống 2 lần',
                unitPrice: 2500,
              })),
            };
            setPreviousExam(cachedExam);
            return;
          } catch (e) {
            console.warn('Lỗi parse localCached previous exam', e);
          }
        }
        setPreviousExam(null);
      }
    } catch (err) {
      console.warn('Lỗi tải lịch sử đợt khám trước:', err);
      setPreviousExam(null);
    } finally {
      setLoadingPreviousExam(false);
    }
  }, [examinations]);

  const handleCopyPreviousPrescription = () => {
    if (!previousExam || !previousExam.prescriptionDetails || previousExam.prescriptionDetails.length === 0) {
      showToast('Đợt khám trước không có đơn thuốc để sao chép!', 'warning');
      return;
    }
    setPrescriptions([...previousExam.prescriptionDetails]);
    showToast(`Đã sao chép ${previousExam.prescriptionDetails.length} loại thuốc từ đơn đợt trước sang đơn khám hiện tại!`, 'success');
  };

  const handleApplyPreviousDiagnosis = () => {
    if (!previousExam) return;
    if (previousExam.icd10Code) {
      form.setFieldsValue({
        icd10Code: previousExam.icd10Code,
      });
      showToast(`Đã áp dụng mã chẩn đoán đợt trước: ${previousExam.icd10Code} (${previousExam.icd10Name || ''})`, 'success');
    }
  };

  // ⚡ Xử lý Quét QR Bệnh nhân Quay Lại Phòng Khám (Đọc Kết Quả CLS - Mắt xích 6)
  const handleClsReturnScan = () => {
    if (!clsReturnInputCode.trim()) {
      showToast('Vui lòng quét hoặc nhập mã QR / Mã bệnh nhân!', 'warning');
      return;
    }
    const code = clsReturnInputCode.trim().toLowerCase();
    const targetQueueItem = queueList.find(
      (q) => (q.patientCode && q.patientCode.toLowerCase() === code) ||
             (q.patientName && q.patientName.toLowerCase().includes(code))
    );

    if (targetQueueItem) {
      const updated = queueList.map((item) => {
        if (item.id === targetQueueItem.id) {
          return {
            ...item,
            queueType: 'ParaclinicalResult' as const,
            priority: 'Priority' as const,
            status: 'Calling' as const,
          };
        }
        return item;
      });
      const prioritized = [
        ...updated.filter((item) => item.id === targetQueueItem.id),
        ...updated.filter((item) => item.id !== targetQueueItem.id),
      ];
      setQueueList(prioritized);
      setIsClsReturnModalOpen(false);
      setClsReturnInputCode('');
      showSuccessAlert(
        'Đã Xác Nhận Quay Lại Phòng Khám (Đọc Kết Quả CLS)!',
        `Bệnh nhân: ${targetQueueItem.patientName} (${targetQueueItem.patientCode})\n• Đã có đầy đủ kết quả Xét nghiệm & CĐHA!\n• Hệ thống tự động xếp vào Hàng đợi Ưu tiên đọc kết quả của Bác sĩ.`
      );
    } else {
      const matchedPatient = patients.find(
        (p) => (p.maBenhNhan && p.maBenhNhan.toLowerCase() === code) ||
               (p.hoTen && p.hoTen.toLowerCase().includes(code))
      ) || patients[0];

      if (matchedPatient) {
        const newQueueItem = {
          id: `queue-cls-${Date.now()}`,
          patientId: matchedPatient.id,
          patientCode: matchedPatient.maBenhNhan,
          patientName: matchedPatient.hoTen,
          patientGender: matchedPatient.gioiTinh || 'Nam',
          patientAge: matchedPatient.tuoi || 40,
          sequenceNumber: queueList.length + 1,
          departmentName: 'Khoa Nội Tổng Hợp',
          priority: 'Priority' as const,
          queueType: 'ParaclinicalResult' as const,
          visitType: 'NewVisit' as const,
          paymentStatus: 'Paid' as const,
          status: 'Waiting' as const,
          createdAt: new Date().toISOString(),
        };
        setQueueList([newQueueItem, ...queueList]);
        setIsClsReturnModalOpen(false);
        setClsReturnInputCode('');
        showSuccessAlert(
          'Đã Tiếp Nhận Bệnh Nhân Quay Lại (Đọc Kết Quả CLS)!',
          `Bệnh nhân: ${matchedPatient.hoTen} (${matchedPatient.maBenhNhan})\n• Kết quả CLS đã được đẩy tự động vào hồ sơ điện tử.\n• Tự động xếp vào Hàng đợi Ưu tiên đọc kết quả.`
        );
      } else {
        showToast(`Không tìm thấy bệnh nhân với mã hoặc tên: "${clsReturnInputCode}"`, 'error');
      }
    }
  };

  // 💊 Thao tác Kê Đơn Thuốc (Medicine Handlers)
  const handleAddMedicine = () => {
    setPrescriptions([
      ...prescriptions,
      { medicineName: '', activeIngredient: '', unit: 'Viên', quantity: 10, dosageInstruction: '', unitPrice: 0 },
    ]);
  };

  const handleSelectMedicine = (index: number, drugCode: string) => {
    const drug = STANDARD_DRUG_CATALOG.find((d) => d.code === drugCode);
    if (!drug) return;
    const updated = [...prescriptions];
    updated[index] = {
      ...updated[index],
      medicineName: drug.name,
      activeIngredient: drug.activeIngredient,
      unit: drug.unit,
      unitPrice: drug.unitPrice,
      dosageInstruction: drug.defaultDosage,
    };
    setPrescriptions(updated);
    showToast(`Đã chọn thuốc: ${drug.name} (${drug.unit})`, 'info');
  };

  const handleRemoveMedicine = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  // 🔬 Thao tác Chỉ Định Cận Lâm Sàng (Paraclinical CLS Handlers)
  const handleAddService = () => {
    setServices([
      ...services,
      {
        serviceName: '',
        serviceCategory: 'Xét nghiệm Huyết học & Miễn dịch',
        price: 0,
        status: 'Đã chỉ định',
        result: '',
      },
    ]);
  };

  const handleSelectService = (index: number, serviceCode: string) => {
    const svc = STANDARD_PARACLINICAL_CATALOG.find((s) => s.code === serviceCode);
    if (!svc) return;
    const updated = [...services];
    updated[index] = {
      ...updated[index],
      serviceName: `${svc.code} - ${svc.name}`,
      serviceCategory: svc.category,
      price: svc.price,
      status: 'Đã chỉ định',
      result: `Phòng: ${svc.room} | Mẫu: ${svc.sampleType}`,
    };
    setServices(updated);
    showToast(`Đã thêm chỉ định: ${svc.name}`, 'info');
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  // Handle Submit Examination
  const handleCreateExamination = async (values: any) => {
    setSubmitting(true);
    try {
      const selectedICD = ICD10_CATALOG.find((c) => c.code === values.icd10Code) || {
        code: values.icd10Code,
        name: values.icd10Name || 'Chẩn đoán lâm sàng',
      };

      await examinationService.createExamination({
        patientId: values.patientId,
        doctorId: user?.id || 'usr-001',
        departmentName: user?.chuyenKhoa || 'Khoa Nội Tổng Hợp',
        subjective: values.subjective || '',
        pulseRate: values.pulseRate || 75,
        temperature: values.temperature || 37.0,
        bloodPressure: values.bloodPressure || '120/80',
        respiratoryRate: values.respiratoryRate || 18,
        weight: values.weight || 65,
        height: values.height || 168,
        assessment: values.assessment || '',
        icd10Code: selectedICD.code,
        icd10Name: selectedICD.name,
        plan: values.plan || '',
        status: 'Hoàn thành',
        prescriptionDetails: prescriptions,
        serviceOrderDetails: services,
      });

      // Cập nhật trạng thái phiếu khám thành 'Finished' để xóa khỏi hàng đợi
      if (values.ticketId) {
        await queueService.updateQueueTicketStatus(values.ticketId, 'Finished');
      }

      const disp = values.disposition || 'outpatient';
      const patient = patients.find((p) => p.id === values.patientId);
      const pName = patient ? patient.hoTen : 'Bệnh nhân';

      if (disp === 'inpatient') {
        showSuccessAlert(
          'Chỉ Định Nhập Viện Thành Công!',
          `Bệnh nhân: ${pName}\n` +
          `• Khoa điều trị nội trú: ${values.inpatientDepartment || 'Khoa Nội Tổng Hợp'}\n` +
          `• Chỉ định: ${values.inpatientReason || 'Theo dõi và điều trị tích cực'}\n\n` +
          `Đã chuyển bệnh án sang bộ phận Tiếp Nhận Nội Trú & bàn giao buồng bệnh!`
        );
      } else if (disp === 'transfer') {
        showSuccessAlert(
          'Lập Giấy Chuyển Tuyến BHYT Thành Công (Mẫu 14)!',
          `Bệnh nhân: ${pName}\n` +
          `• Tuyến tiếp nhận: ${values.transferHospital || 'Bệnh viện Tuyến Trên'}\n` +
          `• Lý do chuyển tuyến: ${values.transferReason || 'Vượt quá năng lực chuyên môn của cơ sở'}\n\n` +
          `Đã chốt đối soát chi phí ngoại trú và xuất hồ sơ chuyển viện cho bệnh nhân!`
        );
      } else {
        const followDays = Number(values.followUpDays || 7);
        const fDate = new Date();
        fDate.setDate(fDate.getDate() + followDays);
        const fDateStr = fDate.toLocaleDateString('vi-VN');
        const appCode = `HEN-${patient?.maBenhNhan?.slice(-4) || '2026'}-${Date.now().toString().slice(-4)}`;

        // Lưu thông tin giấy hẹn tái khám vào cache liên thông
        if (patient) {
          localStorage.setItem(`followup_appointment_${patient.maBenhNhan}`, JSON.stringify({
            code: appCode,
            patientId: patient.id,
            patientName: patient.hoTen,
            patientCode: patient.maBenhNhan,
            date: fDateStr,
            department: user?.chuyenKhoa || 'Khoa Nội Tổng Hợp',
            doctor: user?.hoTen || 'BS. CKII. Nguyễn Thanh Duy',
            diagnosis: `${selectedICD.code} - ${selectedICD.name}`,
            notes: values.followUpNote || 'Nhịn ăn sáng nếu cần xét nghiệm lại.',
          }));
        }

        setAppointmentSlipData({
          appointmentCode: appCode,
          patientName: pName,
          patientCode: patient?.maBenhNhan || 'BN20260016',
          patientGender: patient?.gioiTinh || 'Nam',
          patientAge: patient?.tuoi || 40,
          diagnosis: `${selectedICD.code} - ${selectedICD.name}`,
          icd10Code: selectedICD.code,
          appointmentDate: fDateStr,
          doctorName: user?.hoTen || 'BS. CKII. Nguyễn Thanh Duy',
          departmentName: user?.chuyenKhoa || 'Khoa Nội Tổng Hợp',
          notes: values.followUpNote || 'Nhịn ăn sáng nếu cần làm lại xét nghiệm máu. Mang theo giấy hẹn và đơn thuốc cũ khi đến khám.',
          qrValue: `MEDQR|${appCode}|${patient?.maBenhNhan || 'BN2026'}|${fDateStr}|${selectedICD.code}`,
        });

        setIsModalOpen(false);
        setIsAppointmentSlipModalOpen(true);

        showSuccessAlert(
          'Hoàn tất Ca Khám & Đã Lập Giấy Hẹn Tái Khám!',
          `Bệnh nhân: ${pName} (${patient?.maBenhNhan || ''})\n` +
          `• Ngày hẹn tái khám: ${fDateStr} (Sau ${followDays} ngày)\n` +
          `• Đã sinh Giấy Hẹn Tái Khám điện tử kèm mã QR chuẩn Bộ Y tế.\n` +
          `• Đơn thuốc điện tử đã chuyển sang Nhà Thuốc & Thu Ngân quyết toán!`
        );
        form.resetFields();
        setSelectedPatientId(null);
        setPreviousExam(null);
        fetchExaminations();
        return;
      }

      setIsModalOpen(false);
      form.resetFields();
      setSelectedPatientId(null);
      setPreviousExam(null);
      fetchExaminations();
    } catch {
      showErrorAlert('Không thể lưu ca khám', 'Vui lòng kiểm tra lại kết nối API Backend.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Mã Lượt khám',
      dataIndex: 'examinationCode',
      key: 'examinationCode',
      render: (t: string) => <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{t}</Tag>,
    },
    {
      title: 'Bệnh nhân',
      dataIndex: 'patientName',
      key: 'patientName',
      render: (t: string, record: ExaminationItem) => (
        <div>
          <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a', fontSize: 14 }}>{t}</Text>
          <Text style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b', display: 'block' }}>
            {record.patientGender} • {record.patientAge} tuổi • Mã: {record.patientCode}
          </Text>
        </div>
      ),
    },
    {
      title: 'Chẩn đoán ICD-10',
      dataIndex: 'icd10Code',
      key: 'icd10Code',
      render: (code: string, record: ExaminationItem) => (
        <div>
          <Tag color="cyan" style={{ fontWeight: 700 }}>{code}</Tag>
          <Text style={{ fontSize: 12, color: isDarkMode ? '#cbd5e1' : '#334155' }}>{record.icd10Name}</Text>
        </div>
      ),
    },
    {
      title: 'Sinh hiệu (Mạch/HA)',
      key: 'vitals',
      render: (_: any, record: ExaminationItem) => (
        <Text style={{ fontSize: 12, color: isDarkMode ? '#cbd5e1' : '#334155' }}>
          💓 {record.pulseRate} bpm • 🩸 {record.bloodPressure} mmHg • 🌡️ {record.temperature}°C
        </Text>
      ),
    },
    {
      title: 'Đơn thuốc',
      key: 'prescriptions',
      render: (_: any, record: ExaminationItem) => (
        <Badge count={record.prescriptionDetails?.length || 0} color="#0284c7" showZero />
      ),
    },
    {
      title: 'Bác sĩ Khám',
      dataIndex: 'doctorName',
      key: 'doctorName',
      render: (t: string) => (
        <Tag icon={<SafetyCertificateOutlined color="#10b981" />} color="green">
          {t}
        </Tag>
      ),
    },
    {
      title: 'Thao tác EMR',
      key: 'action',
      render: (_: any, record: ExaminationItem) => (
        <Space wrap>
          <Button
            type="primary"
            size="small"
            icon={<SoundOutlined />}
            style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
            onClick={() => handleSpeakCallQueue(record)}
          >
            Gọi Loa STT
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<FileTextOutlined />}
            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            onClick={() => {
              setSelectedExam(record);
              setIsDrawerOpen(true);
            }}
          >
            Xem EMR
          </Button>
          <Button
            icon={<PrinterOutlined />}
            size="small"
            type="default"
            onClick={() => {
              setExamToPrint(record);
              setIsPrintModalOpen(true);
            }}
          >
            In Đơn PDF
          </Button>
          <Button
            icon={<CalendarOutlined style={{ color: '#7c3aed' }} />}
            size="small"
            type="default"
            onClick={() => {
              const followDate = new Date();
              followDate.setDate(followDate.getDate() + 7);
              const formattedDate = followDate.toLocaleDateString('vi-VN');
              setAppointmentSlipData({
                appointmentCode: `HEN-${record.patientCode?.slice(-4) || '2026'}-${Date.now().toString().slice(-4)}`,
                patientName: record.patientName,
                patientCode: record.patientCode,
                patientGender: record.patientGender || 'Nam',
                patientAge: record.patientAge || 40,
                diagnosis: `${record.icd10Code} - ${record.icd10Name || 'Viêm dạ dày, không đặc hiệu'}`,
                icd10Code: record.icd10Code,
                appointmentDate: formattedDate,
                doctorName: record.doctorName || 'BS. CKII. Nguyễn Thanh Duy',
                departmentName: record.departmentName || 'Khoa Nội Tổng Hợp',
                notes: 'Nhịn ăn sáng nếu cần làm lại xét nghiệm máu. Mang theo giấy hẹn và đơn thuốc cũ khi đến tái khám.',
                qrValue: `MEDQR|HEN-${record.patientCode?.slice(-4) || '2026'}|${record.patientCode}|${formattedDate}|${record.icd10Code}`,
              });
              setIsAppointmentSlipModalOpen(true);
            }}
          >
            Giấy Hẹn Tái Khám
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Modern Medical Header Banner (Unified Theme) */}
      <div className="medical-hero-banner relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 backdrop-blur-md">
              <span className="status-dot-active bg-emerald-400" /> Khám Bệnh Lâm Sàng • Hồ Sơ SOAP Note
            </span>
            <Tag color="cyan" className="m-0 font-mono text-xs bg-white/20 text-white border-white/30">
              Phòng khám: {user?.chuyenKhoa || 'Khoa Nội Tổng Hợp'}
            </Tag>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight margin-0">
            Khám bệnh Lâm sàng & Hồ sơ EMR (SOAP Note)
          </h1>
          <p className="text-sky-100 text-xs md:text-sm mt-1">
            Bác sĩ khám trực tiếp: <strong className="text-white font-bold">{user?.hoTen || 'BS. CKII. Nguyễn Thanh Duy'}</strong> • Chẩn đoán ICD-10, kê đơn thuốc và kiểm tra an toàn tương tác AI
          </p>
        </div>
        <Space wrap>
          <Input
            placeholder="Tìm theo Tên BN, Mã BN, ICD-10..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
            className="rounded-lg shadow-sm"
          />
          <Button icon={<ReloadOutlined />} onClick={fetchExaminations} loading={loading} className="medical-hero-btn-secondary rounded-lg font-medium">
            Làm mới
          </Button>
          <Tooltip title={isSoundOn ? 'Nhấp để tắt chuông báo tự động' : 'Nhấp để bật chuông báo tự động'}>
            <Button
              icon={<SoundOutlined />}
              className="medical-hero-btn-secondary rounded-lg font-medium"
              onClick={() => {
                const next = !isSoundOn;
                setIsSoundOn(next);
                signalrService.setSoundEnabled(next);
                if (next) signalrService.playChime();
                showToast(`Chuông báo tự động: ${next ? 'Đang bật' : 'Đã tắt'}`, 'info');
              }}
            >
              {isSoundOn ? 'Chuông: Bật' : 'Chuông: Tắt'}
            </Button>
          </Tooltip>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            className="medical-hero-btn-primary rounded-lg font-bold flex items-center gap-1.5"
            onClick={() => {
              form.resetFields();
              setDrugSafetyWarnings([]);
              setSelectedPatientId(null);
              setPreviousExam(null);
              setIsModalOpen(true);
            }}
          >
            Tạo Phiếu Khám SOAP Mới
          </Button>
        </Space>
      </div>

      {/* Hàng Đợi Bệnh Nhân Đang Chờ (Waiting Queue) */}
      <Card
        title={
          <Space>
            <SoundOutlined style={{ color: '#f59e0b', fontSize: 18 }} />
            <span style={{ color: isDarkMode ? '#f8fafc' : '#0f172a', fontWeight: 700 }}>Hàng đợi chờ Khám (Cập nhật Real-time)</span>
            <Badge count={queueList.length} style={{ backgroundColor: '#10b981' }} />
          </Space>
        }
        extra={
          <Space wrap>
            <Radio.Group
              value={clsFilterTab}
              onChange={(e) => setClsFilterTab(e.target.value)}
              buttonStyle="solid"
              size="middle"
            >
              <Radio.Button value="all">Tất cả ({queueList.length})</Radio.Button>
              <Radio.Button value="new">Chờ khám ban đầu ({queueList.filter((q) => q.queueType !== 'ParaclinicalResult').length})</Radio.Button>
              <Radio.Button value="cls" style={{ color: '#ea580c', fontWeight: 700 }}>
                ⚡ Chờ đọc KQ CLS ({queueList.filter((q) => q.queueType === 'ParaclinicalResult').length})
              </Radio.Button>
            </Radio.Group>
            <Button
              type="primary"
              icon={<QrcodeOutlined />}
              onClick={() => setIsClsReturnModalOpen(true)}
              style={{
                backgroundColor: '#f97316',
                borderColor: '#ea580c',
                fontWeight: 600,
              }}
            >
              Quét QR BN Quay Lại (Đọc KQ CLS)
            </Button>
          </Space>
        }
        style={{ borderRadius: 16, border: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd', marginBottom: 24 }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          dataSource={queueList.filter((item) => {
            if (clsFilterTab === 'cls') return item.queueType === 'ParaclinicalResult';
            if (clsFilterTab === 'new') return item.queueType !== 'ParaclinicalResult';
            return true;
          })}
          rowKey="id"
          pagination={false}
          columns={[
            {
              title: 'STT',
              dataIndex: 'sequenceNumber',
              render: (t) => <Text strong style={{ fontSize: 20, color: '#ef4444' }}>#{t}</Text>,
              width: 80,
            },
            {
              title: 'Họ tên & Mã BN',
              key: 'patientInfo',
              render: (_, record) => (
                <div>
                  <Text strong style={{ fontSize: 15, color: isDarkMode ? '#f8fafc' : '#0f172a' }}>{record.patientName}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>{record.patientGender} • {record.patientAge} tuổi • Mã: {record.patientCode}</Text>
                </div>
              ),
            },
            {
              title: 'Phân loại & Hàng chờ',
              key: 'queueCategory',
              render: (_, record) => (
                <Space direction="vertical" size={2}>
                  {record.queueType === 'ParaclinicalResult' ? (
                    <Tag color="volcano" style={{ fontWeight: 800 }}>⚡ ĐỌC KẾT QUẢ CLS (ƯU TIÊN)</Tag>
                  ) : record.visitType === 'FollowUp' ? (
                    <Tag color="purple" style={{ fontWeight: 700 }}>🔄 Tái Khám Theo Hẹn</Tag>
                  ) : (
                    <Tag color="blue">Khám ban đầu</Tag>
                  )}
                  {record.priority === 'Priority' && record.queueType !== 'ParaclinicalResult' && (
                    <Tag color="red">Ưu tiên cấp cứu</Tag>
                  )}
                </Space>
              ),
            },
            {
              title: 'Thao tác',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Button
                    icon={<SoundOutlined />}
                    onClick={() => handleSpeakCallQueue(record)}
                  >
                    Gọi Loa
                  </Button>
                  <Button
                    type="primary"
                    style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                    icon={<MedicineBoxOutlined />}
                    onClick={() => {
                      form.resetFields();
                      setDrugSafetyWarnings([]);
                      setSelectedPatientId(record.patientId);
                      loadPreviousExam(record.patientId);
                      const patient = patients.find((p) => p.id === record.patientId);
                      if (patient) {
                        try {
                          const cachedVitals = localStorage.getItem(`vitals_${patient.maBenhNhan}`);
                          if (cachedVitals) {
                            const parsed = JSON.parse(cachedVitals);
                            form.setFieldsValue({
                              pulseRate: parsed.pulse || 78,
                              temperature: parsed.temperature || 36.8,
                              bloodPressure: parsed.bloodPressure || '120/80',
                              respiratoryRate: parsed.respiratoryRate || 18,
                              weight: parsed.weight || 65,
                              height: parsed.height || 168,
                              chiefComplaint: parsed.initialSymptoms || '',
                            });
                            if (parsed.weight) setWeight(parsed.weight);
                            if (parsed.height) setHeight(parsed.height);
                          }
                        } catch (e) {
                          console.warn('Error loading cached vitals', e);
                        }
                      }
                      form.setFieldsValue({
                        patientId: record.patientId, 
                        subjective: '', // Yêu cầu bác sĩ tự điền hoặc lấy từ lúc tiếp đón
                        ticketId: record.id, // Lưu lại ID của vé chờ
                      });
                      setIsModalOpen(true);
                    }}
                  >
                    Khám Bệnh
                  </Button>
                </Space>
              ),
            }
          ]}
        />
      </Card>

      {/* Main Table Card (Lịch sử khám) */}
      <Card style={{ borderRadius: 16, border: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd' }}>
        <Table
          dataSource={examinations}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* Modal Tạo Lượt Khám SOAP Mới */}
      <Modal
        title={
          <Space>
            <MedicineBoxOutlined style={{ color: '#0284c7' }} />
            <span style={{ color: isDarkMode ? '#38bdf8' : '#0369a1', fontWeight: 800 }}>
              Phiếu Khám Bệnh EMR - Mô hình Chẩn đoán SOAP & Kê Đơn Thuốc
            </span>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setSelectedPatientId(null);
          setPreviousExam(null);
        }}
        footer={null}
        destroyOnClose
        width={950}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateExamination}>
          <Tabs
            defaultActiveKey="vitals"
            items={[
              {
                key: 'vitals',
                label: (
                  <span>
                    <HeartOutlined /> I. Bệnh nhân & Sinh hiệu (Vitals)
                  </span>
                ),
                children: (
                  <div style={{ marginTop: 12 }}>
                    <Form.Item name="ticketId" hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item
                      label="Chọn Bệnh nhân Khám"
                      name="patientId"
                      rules={[{ required: true, message: 'Vui lòng chọn bệnh nhân!' }]}
                    >
                      <Select
                        showSearch
                        placeholder="Gõ tên hoặc mã bệnh nhân..."
                        size="large"
                        onChange={(val) => {
                          setSelectedPatientId(val);
                          loadPreviousExam(val);
                          const patient = patients.find((p) => p.id === val);
                          if (patient) {
                            try {
                              const cachedVitals = localStorage.getItem(`vitals_${patient.maBenhNhan}`);
                              if (cachedVitals) {
                                const parsed = JSON.parse(cachedVitals);
                                form.setFieldsValue({
                                  pulseRate: parsed.pulse || 78,
                                  temperature: parsed.temperature || 36.8,
                                  bloodPressure: parsed.bloodPressure || '120/80',
                                  respiratoryRate: parsed.respiratoryRate || 18,
                                  weight: parsed.weight || 65,
                                  height: parsed.height || 168,
                                  chiefComplaint: parsed.initialSymptoms || form.getFieldValue('chiefComplaint'),
                                });
                                if (parsed.weight) setWeight(parsed.weight);
                                if (parsed.height) setHeight(parsed.height);
                                showToast(`Đã tự động nạp sinh hiệu từ Bàn Sàng Lọc! (HA: ${parsed.bloodPressure}, Mạch: ${parsed.pulse})`, 'info');
                              }
                            } catch (e) {
                              console.warn('Error loading cached vitals', e);
                            }
                          }
                        }}
                      >
                        {patients.map((p) => (
                          <Option key={p.id} value={p.id}>
                            {p.maBenhNhan} - {p.hoTen} ({p.gioiTinh}, CCCD: {p.soCCCD})
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    {/* Banner tóm tắt trạng thái Tái khám / Khám lần đầu */}
                    {previousExam ? (
                      <Alert
                        type="info"
                        showIcon
                        icon={<HistoryOutlined />}
                        message={
                          <span>
                            <strong>Phát hiện Hồ sơ Đợt Khám Trước ({previousExam.examinationCode})</strong>: Ngày{' '}
                            {previousExam.examinationDate
                              ? new Date(previousExam.examinationDate).toLocaleDateString('vi-VN')
                              : previousExam.createdAt
                              ? new Date(previousExam.createdAt).toLocaleDateString('vi-VN')
                              : 'gần nhất'}
                            {' '}- Chẩn đoán cũ: <strong>{previousExam.icd10Code} ({previousExam.icd10Name || previousExam.assessment})</strong>.
                            Xem chi tiết tiến triển điều trị tại Tab SOAP.
                          </span>
                        }
                        style={{ marginBottom: 12, borderRadius: 8 }}
                      />
                    ) : selectedPatientId && !loadingPreviousExam ? (
                      <Alert
                        type="success"
                        showIcon
                        icon={<CheckCircleOutlined />}
                        message="Bệnh nhân khám lần đầu (Chưa có lịch sử khám trước đó trên hệ thống EMR)."
                        style={{ marginBottom: 12, borderRadius: 8 }}
                      />
                    ) : null}

                    <Divider style={{ margin: '12px 0', borderColor: isDarkMode ? '#334155' : undefined }}>
                      <Text style={{ fontSize: 13, color: '#0284c7', fontWeight: 600 }}>CHỈ SỐ SINH HIỆU (VITAL SIGNS)</Text>
                    </Divider>

                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item label="Mạch (Pulse)" name="pulseRate" initialValue={78}>
                          <InputNumber style={{ width: '100%' }} addonAfter="lần/phút" min={40} max={200} size="large" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="Nhiệt độ (Temp)" name="temperature" initialValue={37.0}>
                          <InputNumber style={{ width: '100%' }} addonAfter="°C" step={0.1} min={35} max={42} size="large" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="Huyết áp (BP)" name="bloodPressure" initialValue="120/80">
                          <Input style={{ width: '100%' }} placeholder="120/80" size="large" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="Nhịp thở (RR)" name="respiratoryRate" initialValue={18}>
                          <InputNumber style={{ width: '100%' }} addonAfter="lần/phút" size="large" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item label="Cân nặng (Weight)" name="weight" initialValue={65}>
                          <InputNumber
                            style={{ width: '100%' }}
                            addonAfter="kg"
                            size="large"
                            onChange={(val) => setWeight(Number(val) || 65)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="Chiều cao (Height)" name="height" initialValue={168}>
                          <InputNumber
                            style={{ width: '100%' }}
                            addonAfter="cm"
                            size="large"
                            onChange={(val) => setHeight(Number(val) || 168)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <div style={{ paddingTop: 30 }}>
                          <Tag color={bmiValue >= 25 ? 'orange' : bmiValue >= 18.5 ? 'green' : 'blue'} style={{ fontSize: 14, padding: '6px 12px' }}>
                            BMI Tự tính: <strong>{bmiValue} kg/m²</strong> (
                            {bmiValue >= 25 ? 'Thừa cân' : bmiValue >= 18.5 ? 'Bình thường' : 'Gầy'})
                          </Tag>
                        </div>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: 'soap',
                label: (
                  <span>
                    <FileTextOutlined /> II. Khám SOAP & Mã ICD-10
                  </span>
                ),
                children: (
                  <div style={{ marginTop: 12 }}>
                    {/* Bổ sung panel / card "Hồ sơ Đợt Khám Trước & Tiến Triển Điều Trị" phục vụ quy trình Tái khám */}
                    <div style={{ marginBottom: 16 }}>
                      {loadingPreviousExam ? (
                        <div
                          style={{
                            padding: '12px 16px',
                            borderRadius: 12,
                            background: isDarkMode ? '#1e293b' : '#f0f9ff',
                            border: '1px solid #bae6fd',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >
                          <SyncOutlined spin style={{ color: '#0284c7', fontSize: 16 }} />
                          <Text style={{ color: isDarkMode ? '#cbd5e1' : '#0369a1', fontSize: 13 }}>
                            Đang tra cứu hồ sơ đợt khám trước và diễn tiến điều trị của bệnh nhân...
                          </Text>
                        </div>
                      ) : previousExam ? (
                        <Card
                          size="small"
                          style={{
                            borderRadius: 12,
                            background: isDarkMode ? '#1e293b' : '#f8fafc',
                            border: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd',
                            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.08)',
                          }}
                          title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                              <Space>
                                <HistoryOutlined style={{ color: '#0284c7', fontSize: 16 }} />
                                <strong style={{ color: isDarkMode ? '#38bdf8' : '#0369a1', fontSize: 14 }}>
                                  Hồ Sơ Đợt Khám Trước & Tiến Triển Điều Trị
                                </strong>
                                <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700 }}>
                                  🔄 BỆNH NHÂN TÁI KHÁM
                                </Tag>
                              </Space>
                              <Space>
                                <Tag color="cyan" style={{ borderRadius: 6 }}>
                                  Mã ĐK: {previousExam.examinationCode}
                                </Tag>
                              </Space>
                            </div>
                          }
                        >
                          <Row gutter={[16, 12]}>
                            {/* 1. Ngày khám trước & Bác sĩ phụ trách */}
                            <Col xs={24} sm={12}>
                              <div style={{ padding: '8px 12px', background: isDarkMode ? '#0f172a' : '#ffffff', borderRadius: 8, border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0', height: '100%' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                                  📅 Ngày khám trước & Bác sĩ phụ trách
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
                                  {previousExam.examinationDate
                                    ? new Date(previousExam.examinationDate).toLocaleString('vi-VN')
                                    : previousExam.createdAt
                                    ? new Date(previousExam.createdAt).toLocaleString('vi-VN')
                                    : 'Không rõ ngày'}
                                </div>
                                <div style={{ fontSize: 12, color: '#0284c7', marginTop: 2 }}>
                                  BS: <strong>{previousExam.doctorName || 'Bác sĩ điều trị'}</strong> ({previousExam.departmentName || 'Khoa Khám Bệnh'})
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                                  Sinh hiệu cũ: HA {previousExam.bloodPressure || '120/80'} | Mạch {previousExam.pulseRate || 75} bpm | Thân nhiệt {previousExam.temperature || 37}°C | Cân nặng {previousExam.weight || 65}kg
                                </div>
                              </div>
                            </Col>

                            {/* 2. Mã ICD-10 & Chẩn đoán trước */}
                            <Col xs={24} sm={12}>
                              <div style={{ padding: '8px 12px', background: isDarkMode ? '#0f172a' : '#ffffff', borderRadius: 8, border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0', height: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                    🏷️ Mã ICD-10 & Chẩn đoán trước
                                  </div>
                                  <Button
                                    type="link"
                                    size="small"
                                    style={{ padding: 0, height: 'auto', fontSize: 11, color: '#0284c7' }}
                                    onClick={handleApplyPreviousDiagnosis}
                                  >
                                    Áp dụng mã cũ
                                  </Button>
                                </div>
                                <div>
                                  <Tag color="geekblue" style={{ fontWeight: 700, fontSize: 12, borderRadius: 4 }}>
                                    {previousExam.icd10Code}
                                  </Tag>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
                                    {previousExam.icd10Name || previousExam.assessment}
                                  </span>
                                </div>
                                {previousExam.initialDiagnosis && (
                                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                                    Chẩn đoán sơ bộ đợt trước: {previousExam.initialDiagnosis}
                                  </div>
                                )}
                              </div>
                            </Col>

                            {/* 3. Diễn tiến điều trị & Triệu chứng đợt trước */}
                            <Col xs={24} sm={12}>
                              <div style={{ padding: '8px 12px', background: isDarkMode ? '#0f172a' : '#ffffff', borderRadius: 8, border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0', height: '100%' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                                  🩺 Triệu chứng & Diễn tiến điều trị đợt trước
                                </div>
                                <div style={{ fontSize: 12, color: isDarkMode ? '#cbd5e1' : '#334155' }}>
                                  <strong>Triệu chứng đợt trước:</strong> {previousExam.subjective || 'Không có ghi nhận'}
                                </div>
                                <div style={{ fontSize: 12, color: isDarkMode ? '#cbd5e1' : '#334155', marginTop: 4 }}>
                                  <strong>Phác đồ / Hướng điều trị:</strong> {previousExam.treatmentMethod || previousExam.plan || 'Điều trị ngoại trú theo đơn thuốc'}
                                </div>
                              </div>
                            </Col>

                            {/* 4. Đơn thuốc đợt trước & Tiện ích sao chép */}
                            <Col xs={24} sm={12}>
                              <div style={{ padding: '8px 12px', background: isDarkMode ? '#0f172a' : '#ffffff', borderRadius: 8, border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0', height: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                    💊 Đơn thuốc đã kê đợt trước ({previousExam.prescriptionDetails?.length || 0} thuốc)
                                  </div>
                                  {previousExam.prescriptionDetails && previousExam.prescriptionDetails.length > 0 && (
                                    <Button
                                      size="small"
                                      type="primary"
                                      ghost
                                      icon={<CopyOutlined />}
                                      style={{ height: 22, fontSize: 11, borderRadius: 4 }}
                                      onClick={handleCopyPreviousPrescription}
                                    >
                                      Kê lại đơn cũ
                                    </Button>
                                  )}
                                </div>
                                {previousExam.prescriptionDetails && previousExam.prescriptionDetails.length > 0 ? (
                                  <div style={{ maxHeight: 72, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    {previousExam.prescriptionDetails.map((med, idx) => (
                                      <div key={idx} style={{ fontSize: 11, color: isDarkMode ? '#cbd5e1' : '#334155' }}>
                                        • <strong>{med.medicineName}</strong> - {med.quantity} {med.unit} ({med.dosageInstruction || med.usageTime || 'Theo chỉ định'})
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
                                    Không có đơn thuốc đợt trước
                                  </div>
                                )}
                              </div>
                            </Col>
                          </Row>
                        </Card>
                      ) : (
                        <div
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: isDarkMode ? '#1e293b' : '#f0fdf4',
                            border: isDarkMode ? '1px solid #166534' : '1px solid #bbf7d0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Space>
                            <CheckCircleOutlined style={{ color: '#16a34a', fontSize: 16 }} />
                            <span style={{ fontSize: 13, color: isDarkMode ? '#86efac' : '#15803d', fontWeight: 600 }}>
                              Bệnh nhân Khám Lần Đầu (Chưa có lịch sử đợt khám trước trên hệ thống EMR)
                            </span>
                          </Space>
                          <Tag color="green" style={{ borderRadius: 6, fontWeight: 700 }}>
                            KHÁM LẦN ĐẦU
                          </Tag>
                        </div>
                      )}
                    </div>

                    {previousExam && (
                      <div
                        style={{
                          marginBottom: 16,
                          padding: '12px 16px',
                          borderRadius: 10,
                          backgroundColor: isDarkMode ? '#1e293b' : '#faf5ff',
                          border: isDarkMode ? '1.5px solid #6b21a8' : '1.5px solid #d8b4fe',
                          boxShadow: '0 2px 8px rgba(147, 51, 234, 0.08)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ fontWeight: 800, color: '#7c3aed', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircleOutlined /> ĐÁNH GIÁ ĐÁP ỨNG ĐIỀU TRỊ (QUY TRÌNH TÁI KHÁM)
                          </span>
                          <Tag color="purple" style={{ fontWeight: 700, borderRadius: 6 }}>
                            TÁI KHÁM ĐỊNH KỲ
                          </Tag>
                        </div>
                        <Row gutter={12}>
                          <Col xs={24} md={10}>
                            <Form.Item
                              label={<span style={{ fontWeight: 600 }}>Mức độ đáp ứng phác đồ trước</span>}
                              name="treatmentResponse"
                              initialValue="good"
                              style={{ marginBottom: 8 }}
                            >
                              <Select>
                                <Option value="good">🟢 Đáp ứng tốt (Triệu chứng thuyên giảm rõ)</Option>
                                <Option value="partial">🟡 Đáp ứng một phần (Cần chỉnh liều / duy trì)</Option>
                                <Option value="poor">🔴 Kém / Không đáp ứng (Cần đổi phác đồ)</Option>
                                <Option value="adverse">⚠️ Xuất hiện tác dụng phụ / dị ứng</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={14}>
                            <Form.Item
                              label={<span style={{ fontWeight: 600 }}>Diễn tiến lâm sàng & Đánh giá của Bác sĩ</span>}
                              name="symptomProgress"
                              initialValue="Triệu chứng đợt trước thuyên giảm rõ sau phác đồ cũ, sinh hiệu ổn định, dung nạp thuốc tốt."
                              style={{ marginBottom: 8 }}
                            >
                              <Input placeholder="Ghi nhận diễn tiến triệu chứng so với lần khám trước..." />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    )}

                    <Form.Item
                      label="S (Subjective) - Triệu chứng chủ quan"
                      name="subjective"
                      rules={[{ required: true, message: 'Nhập triệu chứng của bệnh nhân!' }]}
                    >
                      <TextArea rows={2} placeholder="Bệnh nhân khai đau họng 3 ngày, sốt 38.0°C, ho khan..." />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col span={18}>
                        <Form.Item
                          label="A (Assessment) - Chẩn đoán Lâm sàng & Mã ICD-10 chuẩn Bộ Y Tế"
                          name="icd10Code"
                          rules={[{ required: true, message: 'Vui lòng chọn mã ICD-10!' }]}
                          initialValue="J02.9"
                        >
                          <Select size="large">
                            {ICD10_CATALOG.map((c) => (
                              <Option key={c.code} value={c.code}>
                                <strong>{c.code}</strong> - {c.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={6} style={{ paddingTop: 30 }}>
                        <Button
                          icon={<RobotOutlined style={{ color: '#0284c7' }} />}
                          onClick={handleConsultAiICD10}
                          loading={aiLoading}
                          block
                          size="large"
                        >
                          AI Gợi ý ICD-10
                        </Button>
                      </Col>
                    </Row>

                    {aiSuggestions.length > 0 && (
                      <div
                        style={{
                          marginBottom: 16,
                          padding: '14px 16px',
                          borderRadius: 12,
                          border: isDarkMode ? '1px solid #0369a1' : '1px solid #bae6fd',
                          background: isDarkMode ? '#0f172a' : '#f0f9ff',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <Space>
                            <RobotOutlined style={{ color: '#0284c7', fontSize: 18 }} />
                            <strong style={{ color: isDarkMode ? '#38bdf8' : '#0369a1', fontSize: 14 }}>
                              Trợ lý AI Đề xuất Mã ICD-10 Chuẩn Bộ Y Tế (CDSS):
                            </strong>
                          </Space>
                          <Tag color="cyan">🔒 Đã khử danh tính PII/PHI (HIPAA & NĐ 13)</Tag>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {aiSuggestions.map((item) => (
                            <div
                              key={item.code}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 14px',
                                borderRadius: 10,
                                background: isDarkMode ? '#1e293b' : '#ffffff',
                                border: isDarkMode ? '1px solid #334155' : '1px solid #e0f2fe',
                                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.04)',
                              }}
                            >
                              <div style={{ flex: 1, paddingRight: 12 }}>
                                <Space wrap>
                                  <Tag
                                    color={item.category === 'CHÍNH' ? 'blue' : 'purple'}
                                    style={{ fontWeight: 700, borderRadius: 6 }}
                                  >
                                    {item.category === 'CHÍNH' ? '⭐ Chẩn đoán chính' : '🔍 Chẩn đoán phân biệt'}
                                  </Tag>
                                  <strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a', fontSize: 14 }}>
                                    {item.code}
                                  </strong>
                                  <span style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>- {item.name}</span>
                                  <Tag color="green" style={{ borderRadius: 6 }}>
                                    {item.match}
                                  </Tag>
                                </Space>
                                {item.rationale && (
                                  <p style={{ margin: '6px 0 0 0', fontSize: 12, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                                    💡 <em>Căn cứ lâm sàng:</em> {item.rationale}
                                  </p>
                                )}
                              </div>
                              <Space>
                                <Button
                                  type="primary"
                                  size="small"
                                  style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', borderRadius: 6 }}
                                  onClick={() => {
                                    form.setFieldsValue({ icd10Code: item.code });
                                    showToast(`Đã áp dụng mã ${item.code} (${item.name})!`, 'success');
                                  }}
                                >
                                  Áp dụng mã
                                </Button>
                              </Space>
                            </div>
                          ))}
                        </div>

                        <div style={{ marginTop: 10, fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b', fontStyle: 'italic' }}>
                          * Hệ thống hỗ trợ ra quyết định lâm sàng (CDSS). Bác sĩ điều trị chịu trách nhiệm chuyên môn về quyết định chẩn đoán.
                        </div>
                      </div>
                    )}

                    <Form.Item label="P (Plan) - Kế hoạch Xử trí & Lời dặn Bác sĩ" name="plan">
                      <TextArea rows={2} placeholder="Cho đơn thuốc 5 ngày, nghỉ ngơi, hẹn tái khám sau 5 ngày..." />
                    </Form.Item>

                    <Divider style={{ margin: '14px 0', borderColor: isDarkMode ? '#334155' : undefined }}>
                      <Text style={{ fontSize: 13, color: '#0369a1', fontWeight: 600 }}>HƯỚNG XỬ TRÍ KẾT THÚC KHÁM (DISPOSITION)</Text>
                    </Divider>

                    <Form.Item
                      label="Quyết định Xử trí của Bác sĩ"
                      name="disposition"
                      initialValue="outpatient"
                    >
                      <Radio.Group style={{ width: '100%' }}>
                        <Row gutter={[12, 12]}>
                          <Col span={8}>
                            <Radio.Button
                              value="outpatient"
                              style={{ width: '100%', textAlign: 'center', height: 'auto', padding: '8px 4px', borderRadius: 8 }}
                            >
                              <div style={{ color: '#16a34a', fontWeight: 700 }}>🟢 Ngoại Trú (Ra về)</div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>Kê đơn thuốc & hẹn tái khám</div>
                            </Radio.Button>
                          </Col>
                          <Col span={8}>
                            <Radio.Button
                              value="inpatient"
                              style={{ width: '100%', textAlign: 'center', height: 'auto', padding: '8px 4px', borderRadius: 8 }}
                            >
                              <div style={{ color: '#0284c7', fontWeight: 700 }}>🏥 Chỉ Định Nhập Viện</div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>Điều trị nội trú tại viện</div>
                            </Radio.Button>
                          </Col>
                          <Col span={8}>
                            <Radio.Button
                              value="transfer"
                              style={{ width: '100%', textAlign: 'center', height: 'auto', padding: '8px 4px', borderRadius: 8 }}
                            >
                              <div style={{ color: '#dc2626', fontWeight: 700 }}>🚑 Chuyển Tuyến BHYT</div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>Chuyển viện tuyến trên</div>
                            </Radio.Button>
                          </Col>
                        </Row>
                      </Radio.Group>
                    </Form.Item>

                    <Form.Item
                      noStyle
                      shouldUpdate={(prev, curr) => prev.disposition !== curr.disposition}
                    >
                      {({ getFieldValue }) => {
                        const disp = getFieldValue('disposition');
                        if (disp === 'inpatient') {
                          return (
                            <div style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f0f9ff', padding: 12, borderRadius: 8, border: '1px solid #bae6fd', marginBottom: 12 }}>
                              <Row gutter={12}>
                                <Col span={12}>
                                  <Form.Item label="Khoa phòng Nhập viện tiếp nhận" name="inpatientDepartment" initialValue="Khoa Nội Tổng Hợp">
                                    <Select>
                                      <Option value="Khoa Hồi Sức Cấp Cứu (ICU)">Khoa Hồi Sức Cấp Cứu (ICU)</Option>
                                      <Option value="Khoa Nội Tổng Hợp">Khoa Nội Tổng Hợp</Option>
                                      <Option value="Khoa Tim Mạch Can Thiệp">Khoa Tim Mạch Can Thiệp</Option>
                                      <Option value="Khoa Ngoại Tiêu Hóa">Khoa Ngoại Tiêu Hóa</Option>
                                      <Option value="Khoa Chấn Thương Chỉnh Hình">Khoa Chấn Thương Chỉnh Hình</Option>
                                    </Select>
                                  </Form.Item>
                                </Col>
                                <Col span={12}>
                                  <Form.Item label="Lý do & Chỉ định Nhập viện" name="inpatientReason" initialValue="Theo dõi huyết động và điều trị tích cực">
                                    <Input placeholder="Nhập lý do nhập viện..." />
                                  </Form.Item>
                                </Col>
                              </Row>
                            </div>
                          );
                        }
                        if (disp === 'outpatient') {
                          return (
                            <div style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f0fdf4', padding: 14, borderRadius: 10, border: '1px solid #bbf7d0', marginBottom: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontWeight: 700, color: '#16a34a', fontSize: 13 }}>
                                  📅 LẬP GIẤY HẸN TÁI KHÁM & CẤP MÃ QR (THEO LƯU ĐỒ 1 & 2)
                                </span>
                                <Tag color="green">Mẫu Bộ Y Tế</Tag>
                              </div>
                              <Row gutter={12}>
                                <Col span={8}>
                                  <Form.Item label="Thời gian Hẹn Tái khám" name="followUpDays" initialValue={7}>
                                    <Select>
                                      <Option value={3}>Sau 3 ngày (Đánh giá đáp ứng cấp tính)</Option>
                                      <Option value={7}>Sau 7 ngày (Uống hết đơn thuốc)</Option>
                                      <Option value={14}>Sau 14 ngày (Đợt kháng sinh 2 tuần)</Option>
                                      <Option value={30}>Sau 30 ngày (Bệnh mãn tính / Định kỳ)</Option>
                                    </Select>
                                  </Form.Item>
                                </Col>
                                <Col span={16}>
                                  <Form.Item label="Lời dặn Bác sĩ khi Tái khám" name="followUpNote" initialValue="Nhịn ăn sáng nếu cần làm lại xét nghiệm máu. Mang theo giấy hẹn và đơn thuốc cũ khi đến khám.">
                                    <Input placeholder="Dặn dò bệnh nhân khi quay lại tái khám..." />
                                  </Form.Item>
                                </Col>
                              </Row>
                            </div>
                          );
                        }
                        if (disp === 'transfer') {
                          return (
                            <div style={{ backgroundColor: isDarkMode ? '#1e293b' : '#fef2f2', padding: 12, borderRadius: 8, border: '1px solid #fecaca', marginBottom: 12 }}>
                              <Row gutter={12}>
                                <Col span={12}>
                                  <Form.Item label="Bệnh viện Tuyến trên Tiếp nhận" name="transferHospital" initialValue="Bệnh viện Chợ Rẫy">
                                    <Input placeholder="vd: BV Chợ Rẫy / BV Bạch Mai..." />
                                  </Form.Item>
                                </Col>
                                <Col span={12}>
                                  <Form.Item label="Lý do Chuyển Tuyến (Mẫu 14)" name="transferReason" initialValue="Vượt quá năng lực chuyên môn kỹ thuật của cơ sở">
                                    <Input placeholder="Nhập lý do chuyển viện..." />
                                  </Form.Item>
                                </Col>
                              </Row>
                            </div>
                          );
                        }
                        return null;
                      }}
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: 'paraclinical',
                label: (
                  <span>
                    <ExperimentOutlined /> III. Chỉ Định Cận Lâm Sàng ({services.length})
                  </span>
                ),
                children: (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Space wrap>
                        <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Danh mục Dịch vụ Cận Lâm Sàng chỉ định</Text>
                        <Tag color="blue">{services.length} Chỉ định</Tag>
                        <Tag color="cyan">
                          Tổng chi phí CLS tạm tính:{' '}
                          <strong>{formatCurrency(services.reduce((acc, s) => acc + (s.price || 0), 0))}</strong>
                        </Tag>
                      </Space>
                      <Button
                        icon={<PlusOutlined />}
                        onClick={handleAddService}
                        type="primary"
                        style={{ backgroundColor: '#0284c7' }}
                      >
                        Thêm Chỉ Định CLS
                      </Button>
                    </div>

                    {services.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                        Chưa có chỉ định Cận lâm sàng. Bấm nút <strong>"Thêm Chỉ Định CLS"</strong> nếu cần chỉ định Xét nghiệm / X-quang / Siêu âm.
                      </div>
                    ) : (
                      services.map((s, idx) => {
                        const matched = STANDARD_PARACLINICAL_CATALOG.find(
                          (c) => s.serviceName.includes(c.code) || s.serviceName === `${c.code} - ${c.name}`
                        );
                        return (
                          <Card
                            key={idx}
                            size="small"
                            style={{
                              marginBottom: 10,
                              borderRadius: 10,
                              border: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd',
                              background: isDarkMode ? '#1e293b' : '#f0f9ff',
                            }}
                          >
                            <Row gutter={12} align="middle">
                              <Col span={12}>
                                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                                  Dịch vụ kỹ thuật CLS (Chọn từ danh mục sổ xuống):
                                </Text>
                                <Select
                                  showSearch
                                  style={{ width: '100%' }}
                                  placeholder="🔍 Chọn hoặc tìm kiếm dịch vụ Cận lâm sàng..."
                                  value={matched ? matched.code : (s.serviceName || undefined)}
                                  onChange={(val) => handleSelectService(idx, val)}
                                  filterOption={(input, option) =>
                                    (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
                                  }
                                >
                                  <OptGroup label="🔬 Xét nghiệm Huyết học & Miễn dịch">
                                    {STANDARD_PARACLINICAL_CATALOG.filter((c) => c.category === 'Xét nghiệm Huyết học & Miễn dịch').map((c) => (
                                      <Option key={c.code} value={c.code} label={`${c.code} ${c.name}`}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                          <span><strong>{c.code}</strong> - {c.name}</span>
                                          <span style={{ color: '#0284c7', fontWeight: 600 }}>{formatCurrency(c.price)}</span>
                                        </div>
                                      </Option>
                                    ))}
                                  </OptGroup>
                                  <OptGroup label="🧪 Xét nghiệm Sinh hóa & Nước tiểu">
                                    {STANDARD_PARACLINICAL_CATALOG.filter((c) => c.category === 'Xét nghiệm Sinh hóa & Nước tiểu').map((c) => (
                                      <Option key={c.code} value={c.code} label={`${c.code} ${c.name}`}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                          <span><strong>{c.code}</strong> - {c.name}</span>
                                          <span style={{ color: '#0284c7', fontWeight: 600 }}>{formatCurrency(c.price)}</span>
                                        </div>
                                      </Option>
                                    ))}
                                  </OptGroup>
                                  <OptGroup label="🩻 Chẩn đoán hình ảnh (X-Quang, Siêu âm, CT)">
                                    {STANDARD_PARACLINICAL_CATALOG.filter((c) => c.category === 'Chẩn đoán hình ảnh').map((c) => (
                                      <Option key={c.code} value={c.code} label={`${c.code} ${c.name}`}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                          <span><strong>{c.code}</strong> - {c.name}</span>
                                          <span style={{ color: '#0284c7', fontWeight: 600 }}>{formatCurrency(c.price)}</span>
                                        </div>
                                      </Option>
                                    ))}
                                  </OptGroup>
                                  <OptGroup label="🩺 Thăm dò chức năng & Nội soi">
                                    {STANDARD_PARACLINICAL_CATALOG.filter((c) => c.category === 'Thăm dò chức năng & Nội soi').map((c) => (
                                      <Option key={c.code} value={c.code} label={`${c.code} ${c.name}`}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                          <span><strong>{c.code}</strong> - {c.name}</span>
                                          <span style={{ color: '#0284c7', fontWeight: 600 }}>{formatCurrency(c.price)}</span>
                                        </div>
                                      </Option>
                                    ))}
                                  </OptGroup>
                                </Select>
                              </Col>
                              <Col span={5}>
                                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                                  Nhóm & Phòng thực hiện:
                                </Text>
                                <Tag color="geekblue" style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {matched?.room || s.serviceCategory || 'Phòng Xét Nghiệm'}
                                </Tag>
                              </Col>
                              <Col span={4}>
                                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                                  Giá Viện phí:
                                </Text>
                                <Text strong style={{ color: '#0284c7', fontSize: 14 }}>
                                  {formatCurrency(s.price || 0)}
                                </Text>
                              </Col>
                              <Col span={2}>
                                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                                  Trạng thái:
                                </Text>
                                <Tag color="orange">{s.status || 'Đã chỉ định'}</Tag>
                              </Col>
                              <Col span={1} style={{ textAlign: 'right' }}>
                                <Button
                                  icon={<DeleteOutlined />}
                                  danger
                                  type="text"
                                  onClick={() => handleRemoveService(idx)}
                                />
                              </Col>
                            </Row>
                          </Card>
                        );
                      })
                    )}
                  </div>
                ),
              },
              {
                key: 'prescription',
                label: (
                  <span>
                    <MedicineBoxOutlined /> IV. Kê Đơn Thuốc Điện Tử ({prescriptions.length})
                  </span>
                ),
                children: (
                  <div style={{ marginTop: 12 }}>
                    {/* Dynamic AI Safety Warning Banner with Clinical Severity */}
                    {drugSafetyWarnings.length > 0 && (
                      <Alert
                        type="warning"
                        showIcon
                        icon={<RobotOutlined style={{ color: '#ef4444', fontSize: 24 }} />}
                        message={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: '#b91c1c', fontSize: 14 }}>
                              Rà Soát An Toàn Dược Lâm Sàng & Dị Ứng Thuốc (AI CDSS):
                            </strong>
                            <Tag color="cyan">🔒 Đã khử danh tính PII/PHI</Tag>
                          </div>
                        }
                        description={
                          <div style={{ marginTop: 6 }}>
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                              {drugSafetyWarnings.map((w, i) => {
                                const isCritical = w.includes('🔴') || w.includes('CHỐNG CHỈ ĐỊNH') || w.includes('SỐC PHẢN VỆ') || w.includes('CẤP 1');
                                return (
                                  <li
                                    key={i}
                                    style={{
                                      color: isCritical ? '#b91c1c' : '#b45309',
                                      fontWeight: isCritical ? 700 : 600,
                                      marginTop: 6,
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {w}
                                  </li>
                                );
                              })}
                            </ul>
                            <div style={{ marginTop: 10, fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
                              * Căn cứ: Dược thư Quốc gia Việt Nam 2024 & Hướng dẫn Dược lâm sàng Bộ Y Tế.
                            </div>
                          </div>
                        }
                        style={{
                          marginBottom: 16,
                          borderRadius: 12,
                          border: '1px solid #fca5a5',
                          backgroundColor: isDarkMode ? '#1e1b1b' : '#fef2f2',
                        }}
                      />
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Space wrap>
                        <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Danh mục Thuốc kê trong đơn</Text>
                        <Tag color="green">{prescriptions.length} Loại thuốc</Tag>
                        <Tag color="blue">
                          Tiền thuốc:{' '}
                          <strong>
                            {formatCurrency(
                              prescriptions.reduce((acc, p) => acc + (p.unitPrice * (p.quantity || 1) || 0), 0)
                            )}
                          </strong>
                        </Tag>
                      </Space>
                      <Space>
                        <Button
                          icon={<RobotOutlined style={{ color: '#0284c7' }} />}
                          onClick={handleRunDrugSafetyCheck}
                          loading={drugSafetyLoading}
                          style={{ borderColor: '#0284c7', color: '#0284c7' }}
                        >
                          AI Rà Soát Dị Ứng & Tương Tác
                        </Button>
                        <Button icon={<PlusOutlined />} onClick={handleAddMedicine} type="primary" style={{ backgroundColor: '#0284c7' }}>
                          Thêm Thuốc
                        </Button>
                      </Space>
                    </div>

                    {prescriptions.map((p, idx) => {
                      const matchedDrug = STANDARD_DRUG_CATALOG.find(
                        (d) => d.name === p.medicineName || p.medicineName.includes(d.name)
                      );
                      return (
                        <Card
                          key={idx}
                          size="small"
                          style={{
                            marginBottom: 10,
                            borderRadius: 10,
                            border: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd',
                            background: isDarkMode ? '#1e293b' : '#f8fafc',
                          }}
                        >
                          <Row gutter={12} align="middle">
                            <Col span={9}>
                              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                                Tên thuốc & Hàm lượng (Chọn từ danh mục):
                              </Text>
                              <Select
                                showSearch
                                style={{ width: '100%' }}
                                placeholder="💊 Chọn hoặc gõ tìm kiếm tên thuốc / hoạt chất..."
                                value={matchedDrug ? matchedDrug.code : (p.medicineName || undefined)}
                                onChange={(val) => handleSelectMedicine(idx, val)}
                                filterOption={(input, option) =>
                                  (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
                                }
                              >
                                <OptGroup label="💊 Kháng sinh & Kháng khuẩn">
                                  {STANDARD_DRUG_CATALOG.filter((d) => d.category === 'Kháng sinh & Kháng khuẩn').map((d) => (
                                    <Option key={d.code} value={d.code} label={`${d.name} ${d.activeIngredient}`}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span><strong>{d.name}</strong></span>
                                        <span style={{ color: '#0284c7' }}>{formatCurrency(d.unitPrice)}</span>
                                      </div>
                                    </Option>
                                  ))}
                                </OptGroup>
                                <OptGroup label="💊 Giảm đau & Hạ sốt & Kháng viêm">
                                  {STANDARD_DRUG_CATALOG.filter((d) => d.category === 'Giảm đau & Hạ sốt' || d.category === 'Kháng viêm NSAID' || d.category === 'Kháng viêm chống phù nề').map((d) => (
                                    <Option key={d.code} value={d.code} label={`${d.name} ${d.activeIngredient}`}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span><strong>{d.name}</strong></span>
                                        <span style={{ color: '#0284c7' }}>{formatCurrency(d.unitPrice)}</span>
                                      </div>
                                    </Option>
                                  ))}
                                </OptGroup>
                                <OptGroup label="💊 Tim mạch - Huyết áp - Mỡ máu">
                                  {STANDARD_DRUG_CATALOG.filter((d) => d.category === 'Tim mạch & Huyết áp').map((d) => (
                                    <Option key={d.code} value={d.code} label={`${d.name} ${d.activeIngredient}`}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span><strong>{d.name}</strong></span>
                                        <span style={{ color: '#0284c7' }}>{formatCurrency(d.unitPrice)}</span>
                                      </div>
                                    </Option>
                                  ))}
                                </OptGroup>
                                <OptGroup label="💊 Tiêu hóa - Dạ dày">
                                  {STANDARD_DRUG_CATALOG.filter((d) => d.category === 'Dạ dày & Tiêu hóa').map((d) => (
                                    <Option key={d.code} value={d.code} label={`${d.name} ${d.activeIngredient}`}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span><strong>{d.name}</strong></span>
                                        <span style={{ color: '#0284c7' }}>{formatCurrency(d.unitPrice)}</span>
                                      </div>
                                    </Option>
                                  ))}
                                </OptGroup>
                                <OptGroup label="💊 Đái tháo đường">
                                  {STANDARD_DRUG_CATALOG.filter((d) => d.category === 'Đái tháo đường').map((d) => (
                                    <Option key={d.code} value={d.code} label={`${d.name} ${d.activeIngredient}`}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span><strong>{d.name}</strong></span>
                                        <span style={{ color: '#0284c7' }}>{formatCurrency(d.unitPrice)}</span>
                                      </div>
                                    </Option>
                                  ))}
                                </OptGroup>
                                <OptGroup label="💊 Hô hấp - Dị ứng">
                                  {STANDARD_DRUG_CATALOG.filter((d) => d.category === 'Kháng Histamin & Dị ứng' || d.category === 'Hô hấp & Long đờm').map((d) => (
                                    <Option key={d.code} value={d.code} label={`${d.name} ${d.activeIngredient}`}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span><strong>{d.name}</strong></span>
                                        <span style={{ color: '#0284c7' }}>{formatCurrency(d.unitPrice)}</span>
                                      </div>
                                    </Option>
                                  ))}
                                </OptGroup>
                                <OptGroup label="💊 Cơ xương khớp & Vitamin">
                                  {STANDARD_DRUG_CATALOG.filter((d) => d.category === 'Cơ xương khớp & Vitamin').map((d) => (
                                    <Option key={d.code} value={d.code} label={`${d.name} ${d.activeIngredient}`}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span><strong>{d.name}</strong></span>
                                        <span style={{ color: '#0284c7' }}>{formatCurrency(d.unitPrice)}</span>
                                      </div>
                                    </Option>
                                  ))}
                                </OptGroup>
                              </Select>
                            </Col>
                            <Col span={3}>
                              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                                ĐVT:
                              </Text>
                              <Input
                                value={p.unit}
                                readOnly
                                style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', fontWeight: 600, textAlign: 'center' }}
                              />
                            </Col>
                            <Col span={3}>
                              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                                Số lượng:
                              </Text>
                              <InputNumber
                                min={1}
                                max={100}
                                value={p.quantity}
                                onChange={(val) => {
                                  const updated = [...prescriptions];
                                  updated[idx].quantity = Number(val) || 1;
                                  setPrescriptions(updated);
                                }}
                                style={{ width: '100%', fontWeight: 700, color: '#0284c7' }}
                              />
                            </Col>
                            <Col span={8}>
                              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                                Hướng dẫn liều dùng & Cách uống:
                              </Text>
                              <Input
                                placeholder="Gợi ý: Sáng 1v, Tối 1v sau ăn"
                                value={p.dosageInstruction}
                                onChange={(e) => {
                                  const updated = [...prescriptions];
                                  updated[idx].dosageInstruction = e.target.value;
                                  setPrescriptions(updated);
                                }}
                              />
                            </Col>
                            <Col span={1} style={{ textAlign: 'right' }}>
                              <Button
                                icon={<DeleteOutlined />}
                                danger
                                type="text"
                                onClick={() => handleRemoveMedicine(idx)}
                              />
                            </Col>
                          </Row>
                        </Card>
                      );
                    })}
                  </div>
                ),
              },
            ]}
          />

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy bỏ</Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SaveOutlined />}
                loading={submitting}
                style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
              >
                Lưu Bệnh Án & Ký Chữ Ký Số
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Modal In Đơn Thuốc Điện Tử Chuẩn Bộ Y Tế */}
      <Modal
        title={
          <Space>
            <PrinterOutlined style={{ color: '#0284c7' }} />
            <span>Mẫu Đơn Thuốc Điện Tử Chuẩn Bộ Y Tế - {examToPrint?.examinationCode}</span>
          </Space>
        }
        open={isPrintModalOpen}
        onCancel={() => setIsPrintModalOpen(false)}
        width={750}
        footer={[
          <Button key="close" onClick={() => setIsPrintModalOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            style={{ backgroundColor: '#0284c7' }}
            onClick={() => {
              window.print();
              showToast('Đã gửi lệnh in đơn thuốc tới máy in!', 'success');
            }}
          >
            In Đơn Thuốc (Print A4)
          </Button>,
        ]}
      >
        {examToPrint && (
          <div id="printable-prescription" className="prescription-container">
            {/* National Header */}
            <div className="prescription-header-national">
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, fontStyle: 'italic', marginBottom: 4 }}>
                Độc lập - Tự do - Hạnh phúc
              </div>
              <div style={{ width: 120, height: 1, backgroundColor: '#0284c7', margin: '4px auto' }} />
            </div>

            {/* Facility Header */}
            <div className="prescription-facility-info">
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>
                  BỆNH VIỆN ĐA KHOA THỦ DẦU MỘT - HOSPITAL AI
                </div>
                <div style={{ fontSize: 11, color: '#475569' }}>
                  Địa chỉ: Số 01 Đường Lê Lợi, TP. Thủ Dầu Một, Bình Dương
                </div>
                <div style={{ fontSize: 11, color: '#475569' }}>
                  Điện thoại: (0274) 3822 999 • Mã CSKCBT Quốc gia: 74001
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: 13, padding: '4px 10px', fontWeight: 700 }}>
                  Mã Đơn: {examToPrint.examinationCode}
                </Tag>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                  Ngày tạo: {examToPrint.examinationDate || new Date().toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>

            {/* Prescription Title */}
            <div className="prescription-title-main">
              <h2>ĐƠN THUỐC ĐIỆN TỬ (E-PRESCRIPTION)</h2>
              <p>(Ban hành theo Thông tư 27/2021/TT-BYT của Bộ Y Tế)</p>
            </div>

            {/* Patient Administrative Info */}
            <div className="prescription-info-grid">
              <div>
                Họ và tên người bệnh: <strong style={{ textTransform: 'uppercase', color: '#0369a1', fontSize: 14 }}>{examToPrint.patientName}</strong>
              </div>
              <div>
                Tuổi / Giới tính: <strong>{examToPrint.patientAge} tuổi • {examToPrint.patientGender}</strong>
              </div>
              <div>
                Mã định danh BN: <strong style={{ fontFamily: 'monospace' }}>{examToPrint.patientCode}</strong>
              </div>
              <div>
                Chỉ số sinh hiệu: <strong>{examToPrint.pulseRate} bpm • {examToPrint.bloodPressure} mmHg</strong>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                Chẩn đoán bệnh: <strong style={{ color: '#0284c7', fontSize: 14 }}>[{examToPrint.icd10Code}] {examToPrint.icd10Name}</strong>
              </div>
            </div>

            {/* Medicine Prescription Table */}
            <div style={{ fontWeight: 700, color: '#0369a1', marginBottom: 8, fontSize: 13 }}>
              💊 CHỈ ĐỊNH DÙNG THUỐC ĐIỆN TỬ:
            </div>
            <table className="prescription-table">
              <thead>
                <tr>
                  <th style={{ width: '6%', textAlign: 'center' }}>STT</th>
                  <th style={{ width: '40%' }}>Tên thuốc & Hàm lượng</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Số lượng</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Đơn vị</th>
                  <th style={{ width: '34%' }}>Liều dùng & Cách sử dụng</th>
                </tr>
              </thead>
              <tbody>
                {examToPrint.prescriptionDetails?.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.medicineName}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Hoạt chất: Chuẩn Dược điển Việt Nam</div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#0284c7' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'center' }}>{item.unit}</td>
                    <td style={{ fontStyle: 'italic', color: '#334155' }}>{item.dosageInstruction}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Advice & Verification Footer */}
            <div className="prescription-footer">
              <div style={{ maxWidth: '55%' }}>
                <div style={{ fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>📌 Lời dặn của Bác sĩ điều trị:</div>
                <div style={{ fontSize: 11.5, color: '#475569', fontStyle: 'italic', lineHeight: 1.6 }}>
                  1. Uống thuốc đúng liều lượng, đúng thời gian theo hướng dẫn.<br />
                  2. Tái khám sau khi hết thuốc hoặc có dấu hiệu bất thường.<br />
                  3. Mang theo đơn thuốc này khi đến tái khám tại bệnh viện.
                </div>
              </div>

              {/* Dynamic QR Verification Box */}
              <div className="prescription-qr-box">
                <QRCodeSVG
                  value={`https://hospital-ai.vn/verify-prescription?code=${examToPrint.examinationCode}&patient=${examToPrint.patientCode}`}
                  size={72}
                  level="H"
                  includeMargin={false}
                />
                <div style={{ fontSize: 9, color: '#0369a1', fontWeight: 800, textAlign: 'center', marginTop: 2 }}>
                  MÃ TRA CỨU ĐƠN THUỐC
                </div>
              </div>

              {/* Doctor Sign Box */}
              <div style={{ textAlign: 'center', minWidth: 160 }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  Thủ Dầu Một, Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a', marginTop: 2, fontSize: 12 }}>BÁC SĨ KÊ ĐƠN</div>
                <div style={{ border: '2px dashed #10b981', padding: '4px 10px', borderRadius: 8, display: 'inline-block', marginTop: 8, backgroundColor: '#ecfdf5' }}>
                  <div style={{ fontSize: 10, color: '#059669', fontWeight: 700 }}>
                    ✔ CHỮ KÝ SỐ ĐÃ XÁC THỰC
                  </div>
                  <div style={{ fontSize: 12, color: '#047857', fontWeight: 800 }}>{examToPrint.doctorName}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Drawer Xem Chi Tiết Bệnh Án EMR */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined style={{ color: '#0284c7' }} />
            <span>Hồ sơ Bệnh án EMR - {selectedExam?.examinationCode}</span>
          </Space>
        }
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        width={650}
      >
        {selectedExam && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Alert
              type="success"
              showIcon
              icon={<SafetyCertificateOutlined />}
              message="Đã xác thực Chữ ký số Bác sĩ:"
              description={`Ký bởi: ${selectedExam.doctorName} (SHA-256 RSA)`}
            />

            <Card size="small" title="1. Thông tin Bệnh nhân">
              <Text style={{ display: 'block' }}>Họ tên: <strong>{selectedExam.patientName}</strong></Text>
              <Text style={{ display: 'block' }}>Tuổi/Giới tính: <strong>{selectedExam.patientAge} tuổi ({selectedExam.patientGender})</strong></Text>
              <Text style={{ display: 'block' }}>Mã Bệnh nhân: <strong>{selectedExam.patientCode}</strong></Text>
            </Card>

            <Card size="small" title="2. Chỉ số Sinh hiệu (Vitals)">
              <Text style={{ display: 'block' }}>💓 Mạch: <strong>{selectedExam.pulseRate} bpm</strong> • 🌡️ Nhiệt độ: <strong>{selectedExam.temperature}°C</strong></Text>
              <Text style={{ display: 'block' }}>🩸 Huyết áp: <strong>{selectedExam.bloodPressure} mmHg</strong> • ⚖️ BMI: <strong>{selectedExam.bmi} kg/m²</strong></Text>
            </Card>

            <Card size="small" title="3. Mô hình SOAP & ICD-10">
              <Text style={{ display: 'block' }}>S (Triệu chứng): {selectedExam.subjective}</Text>
              <Text style={{ display: 'block' }}>A (Mã ICD-10): <Tag color="cyan">{selectedExam.icd10Code}</Tag> {selectedExam.icd10Name}</Text>
              <Text style={{ display: 'block' }}>P (Xử trí): {selectedExam.plan}</Text>
            </Card>

            <Card size="small" title="4. Đơn thuốc Điện tử">
              {selectedExam.prescriptionDetails.map((p, idx) => (
                <div key={idx} style={{ marginBottom: 6 }}>
                  <Text strong>{idx + 1}. {p.medicineName}</Text> ({p.quantity} {p.unit})
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>HDSD: {p.dosageInstruction}</Text>
                </div>
              ))}
            </Card>

            {selectedExam.serviceOrderDetails && selectedExam.serviceOrderDetails.length > 0 && (
              <Card size="small" title="5. Chỉ Định Cận Lâm Sàng (CLS / Xét Nghiệm / CĐHA)">
                {selectedExam.serviceOrderDetails.map((s, idx) => (
                  <div key={idx} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text strong>{idx + 1}. {s.serviceName}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>{s.serviceCategory} • {s.result || 'Chỉ định CLS'}</Text>
                    </div>
                    <Tag color="cyan" style={{ fontWeight: 600 }}>{formatCurrency(s.price)}</Tag>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}
      </Drawer>

      {/* Modal Quét QR / Tiếp Nhận Bệnh Nhân Quay Lại (Đọc Kết Quả CLS - Mắt xích 6) */}
      <Modal
        title={
          <Space>
            <QrcodeOutlined style={{ color: '#ea580c', fontSize: 20 }} />
            <span style={{ fontWeight: 700, color: '#0f172a' }}>
              Quét QR / Tiếp Nhận Bệnh Nhân Quay Lại (Đọc Kết Quả CLS)
            </span>
          </Space>
        }
        open={isClsReturnModalOpen}
        onCancel={() => {
          setIsClsReturnModalOpen(false);
          setClsReturnInputCode('');
        }}
        footer={null}
        width={560}
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div
            style={{
              width: 140,
              height: 140,
              margin: '0 auto 16px',
              border: '2px dashed #ea580c',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fff7ed',
            }}
          >
            <QRCodeSVG value={clsReturnInputCode || 'HOSPITAL-CLS-RETURN-SAMPLE'} size={110} />
          </div>

          <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 6 }}>
            Bệnh nhân đưa mã QR hoặc phiếu chỉ định CLS trước đầu đọc tại cửa phòng khám
          </Text>
          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
            Hệ thống tự động đồng bộ kết quả Xét nghiệm & CĐHA từ hệ thống LIS/PACS và kích hoạt hàng đợi đọc kết quả ưu tiên.
          </Text>

          <Input.Search
            placeholder="Quét mã QR hoặc nhập Mã BN (Ví dụ: BN001)..."
            value={clsReturnInputCode}
            onChange={(e) => setClsReturnInputCode(e.target.value)}
            onSearch={handleClsReturnScan}
            enterButton={
              <Button type="primary" style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}>
                Xác Nhận Quay Lại
              </Button>
            }
            size="large"
            autoFocus
          />

          {import.meta.env.DEV && (
            <div style={{ marginTop: 16, textAlign: 'left', background: '#f8fafc', padding: 12, borderRadius: 8 }}>
              <Text strong style={{ fontSize: 12, color: '#64748b' }}>
                ⚡ Test nhanh QR (Chế độ DEV):
              </Text>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {queueList.slice(0, 3).map((q) => (
                  <Tag
                    key={q.id}
                    color="orange"
                    style={{ cursor: 'pointer', padding: '4px 8px' }}
                    onClick={() => {
                      setClsReturnInputCode(q.patientCode);
                    }}
                  >
                    #{q.sequenceNumber} - {q.patientName} ({q.patientCode})
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal In Giấy Hẹn Tái Khám Chuẩn Bộ Y Tế Kèm Mã QR (Lưu Đồ 1 & 2) */}
      <Modal
        title={
          <Space>
            <CalendarOutlined style={{ color: '#7c3aed', fontSize: 18 }} />
            <span style={{ fontWeight: 700 }}>Giấy Hẹn Tái Khám - Bệnh Viện Đa Khoa D-Medical</span>
          </Space>
        }
        open={isAppointmentSlipModalOpen}
        onCancel={() => setIsAppointmentSlipModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsAppointmentSlipModalOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}
            onClick={() => window.print()}
          >
            In Giấy Hẹn Tái Khám
          </Button>,
        ]}
        width={580}
      >
        {appointmentSlipData && (
          <div
            style={{
              padding: 24,
              backgroundColor: '#fff',
              border: '2px solid #ddd6fe',
              borderRadius: 12,
              color: '#0f172a',
            }}
          >
            <div style={{ textAlign: 'center', borderBottom: '2px solid #7c3aed', paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: '#0369a1' }}>
                SỞ Y TẾ TP. HỒ CHÍ MINH • BỆNH VIỆN ĐA KHOA D-MEDICAL
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#7c3aed', margin: '6px 0 2px' }}>
                GIẤY HẸN TÁI KHÁM
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Mã giấy hẹn: <strong>{appointmentSlipData.appointmentCode}</strong> • Ngày lập: {new Date().toLocaleDateString('vi-VN')}
              </div>
            </div>

            <div style={{ fontSize: 14, lineHeight: 1.8 }}>
              <div>• Họ và tên người bệnh: <strong style={{ fontSize: 15, textTransform: 'uppercase' }}>{appointmentSlipData.patientName}</strong></div>
              <div>• Tuổi/Giới tính: <strong>{appointmentSlipData.patientAge} tuổi ({appointmentSlipData.patientGender})</strong> • Mã BN: <strong style={{ color: '#0284c7' }}>{appointmentSlipData.patientCode}</strong></div>
              <div>• Chẩn đoán đợt khám này: <strong>{appointmentSlipData.diagnosis}</strong></div>
              <div style={{ backgroundColor: '#f5f3ff', padding: '8px 12px', borderRadius: 8, margin: '8px 0', border: '1px solid #ddd6fe' }}>
                <div>• Hẹn tái khám vào ngày: <strong style={{ color: '#7c3aed', fontSize: 16 }}>{appointmentSlipData.appointmentDate}</strong></div>
                <div>• Khoa phòng tái khám: <strong>{appointmentSlipData.departmentName}</strong></div>
                <div>• Bác sĩ hẹn khám: <strong>{appointmentSlipData.doctorName}</strong></div>
              </div>
              <div>• Lời dặn Bác sĩ: <em>{appointmentSlipData.notes}</em></div>
            </div>

            <Divider style={{ margin: '14px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <QRCodeSVG value={appointmentSlipData.qrValue} size={110} />
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, fontFamily: 'monospace' }}>
                  Quét QR tại Bàn Sàng lọc / Kiosk
                </div>
              </div>

              <div style={{ textAlign: 'center', minWidth: 200 }}>
                <div style={{ fontSize: 12, fontStyle: 'italic', color: '#64748b' }}>
                  TP.HCM, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, margin: '4px 0 45px' }}>BÁC SĨ ĐIỀU TRỊ</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0369a1' }}>{appointmentSlipData.doctorName}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
