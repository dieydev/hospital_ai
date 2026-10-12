import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Card,
  Row,
  Col,
  Typography,
  Input,
  Button,
  DatePicker,
  Steps,
  Avatar,
  Tag,
  Radio,
  Form,
  Modal,
  Divider,
  Alert,
  Spin,
  Switch,
  Collapse,
  Carousel,
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  MedicineBoxOutlined,
  PhoneOutlined,
  IdcardOutlined,
  SearchOutlined,
  PrinterOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
  LoginOutlined,
  SwapOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  LockOutlined,
  EditOutlined,
  ThunderboltOutlined,
  CreditCardOutlined,
  QrcodeOutlined,
  CustomerServiceOutlined,
  SoundOutlined,
  VideoCameraOutlined,
  ExperimentOutlined,
  AuditOutlined,
  RightOutlined,
  PhoneFilled,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  appointmentService,
  TimeSlotQuotaItem,
  OnlineAppointmentItem,
} from '../services/appointmentService';
import { showSuccessAlert, showErrorAlert, showToast } from '../utils/sweetAlert';
import { CompleteProfileModal } from '../components/CompleteProfileModal';
import { RequireLoginModal } from '../components/RequireLoginModal';
import { PatientPortalHeader } from '../components/PatientPortalHeader';
import { PatientPortalFooter } from '../components/PatientPortalFooter';
import {
  isPatientProfileComplete,
  isPatientUser,
} from '../utils/authHelper';
import { AIChatDrawer } from '../components/AIChatDrawer';
import './PatientBookingPage.css';

const { Title, Text, Paragraph } = Typography;

// Danh mục Chuyên khoa với Bảng giá & Vị trí phòng khám
interface DepartmentOption {
  id: string;
  name: string;
  description: string;
  location: string;
  iconBg: string;
  price: number;
  bhytPrice: number;
}

const DEPARTMENTS_CATALOG: DepartmentOption[] = [
  {
    id: 'dept-noi',
    name: 'Khoa Nội Tổng Hợp',
    description: 'Khám và điều trị các bệnh lý nội khoa, tăng huyết áp, tiểu đường, hô hấp',
    location: 'Phòng 102 - Tầng 1 Khu A',
    iconBg: '#0284c7',
    price: 150000,
    bhytPrice: 42100,
  },
  {
    id: 'dept-tieu-hoa',
    name: 'Khoa Tiêu Hóa',
    description: 'Chuyên sâu dạ dày, đại tràng, gan mật, nội soi tiêu hóa công nghệ cao',
    location: 'Phòng 201 - Tầng 2 Khu B',
    iconBg: '#0369a1',
    price: 180000,
    bhytPrice: 42100,
  },
  {
    id: 'dept-tim-mach',
    name: 'Khoa Tim Mạch',
    description: 'Siêu âm tim Doppler màu, chẩn đoán suy tim, bệnh mạch vành, rối loạn nhịp',
    location: 'Phòng 301 - Tầng 3 Khu A',
    iconBg: '#e11d48',
    price: 200000,
    bhytPrice: 42100,
  },
  {
    id: 'dept-nhi',
    name: 'Khoa Nhi',
    description: 'Khám nhi khoa tổng quát, hô hấp trẻ em, dinh dưỡng và tiêm chủng',
    location: 'Phòng 105 - Tầng 1 Khu B',
    iconBg: '#10b981',
    price: 160000,
    bhytPrice: 42100,
  },
  {
    id: 'dept-mat',
    name: 'Khoa Mắt',
    description: 'Khúc xạ thị giác, phẫu thuật Phaco, điều trị đục thủy tinh thể và cườm mắt',
    location: 'Phòng 205 - Tầng 2 Khu A',
    iconBg: '#8b5cf6',
    price: 150000,
    bhytPrice: 42100,
  },
  {
    id: 'dept-tai-mui-hong',
    name: 'Khoa Tai Mũi Họng',
    description: 'Nội soi vi phẫu tai mũi họng, điều trị viêm xoang, amidan bằng sóng cao tần',
    location: 'Phòng 208 - Tầng 2 Khu B',
    iconBg: '#f59e0b',
    price: 170000,
    bhytPrice: 42100,
  },
  {
    id: 'dept-ngoai',
    name: 'Khoa Ngoại Tổng Quát',
    description: 'Tiểu phẫu, phẫu thuật nội soi ngoại khoa tiêu hóa, vết thương chấn thương',
    location: 'Phòng 401 - Tầng 4 Khu A',
    iconBg: '#0284c7',
    price: 180000,
    bhytPrice: 42100,
  },
  {
    id: 'dept-rang-ham-mat',
    name: 'Khoa Răng Hàm Mặt',
    description: 'Nha khoa thẩm mỹ, nhổ răng khôn không đau, cấy ghép Implant kỹ thuật số',
    location: 'Phòng 108 - Tầng 1 Khu C',
    iconBg: '#0ea5e9',
    price: 160000,
    bhytPrice: 42100,
  },
  {
    id: 'dept-da-lieu',
    name: 'Khoa Da Liễu',
    description: 'Chăm sóc và điều trị mụn, nám, viêm da cơ địa, laser thẩm mỹ chuẩn y khoa',
    location: 'Phòng 305 - Tầng 3 Khu B',
    iconBg: '#ec4899',
    price: 160000,
    bhytPrice: 42100,
  },
];

// Danh mục Bác sĩ với Bảng giá & Kinh nghiệm
interface DoctorOption {
  id: string;
  name: string;
  department: string;
  title: string;
  experience: string;
  avatar: string;
  rating: number;
  consultationFee: number;
  isSpecialist?: boolean;
}

const DOCTORS_CATALOG: DoctorOption[] = [
  {
    id: 'doc-01',
    name: 'BS. CKII. Nguyễn Thanh Duy',
    department: 'Khoa Nội Tổng Hợp',
    title: 'Trưởng Khoa Nội • Bác sĩ Chuyên Khoa II',
    experience: '15 năm kinh nghiệm BV Chợ Rẫy',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
    rating: 4.9,
    consultationFee: 300000,
    isSpecialist: true,
  },
  {
    id: 'doc-02',
    name: 'ThS. BS. Trần Thị Thu Hà',
    department: 'Khoa Nội Tổng Hợp',
    title: 'Thạc sĩ Y học • Chuyên khoa Nội',
    experience: '8 năm kinh nghiệm Nội tim mạch',
    avatar: 'https://images.unsplash.com/photo-1594824813508-e7655cfc9b68?w=300&auto=format&fit=crop&q=80',
    rating: 4.8,
    consultationFee: 200000,
  },
  {
    id: 'doc-03',
    name: 'BS. CKII. Đinh Khắc Vương',
    department: 'Khoa Tiêu Hóa',
    title: 'Trưởng Khoa Tiêu Hóa • Bác sĩ CKII',
    experience: '16 năm kinh nghiệm Gan Mật & Dạ dày',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
    rating: 5.0,
    consultationFee: 300000,
    isSpecialist: true,
  },
  {
    id: 'doc-04',
    name: 'BS. Hoàng Lan Anh',
    department: 'Khoa Tiêu Hóa',
    title: 'Bác sĩ Nội soi Tiêu Hóa',
    experience: '7 năm kinh nghiệm Nội soi tiêu hóa',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
    rating: 4.7,
    consultationFee: 180000,
  },
  {
    id: 'doc-05',
    name: 'TS. BS. Huỳnh Quốc Dũng',
    department: 'Khoa Tim Mạch',
    title: 'Tiến sĩ Y khoa • Viện Tim Mạch',
    experience: '20 năm kinh nghiệm Can thiệp mạch',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop&q=80',
    rating: 5.0,
    consultationFee: 350000,
    isSpecialist: true,
  },
  {
    id: 'doc-06',
    name: 'BS. CKI. Vũ Thu Trang',
    department: 'Khoa Tim Mạch',
    title: 'Bác sĩ CKI • Siêu âm Tim',
    experience: '9 năm kinh nghiệm Tăng huyết áp',
    avatar: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=300&auto=format&fit=crop&q=80',
    rating: 4.8,
    consultationFee: 200000,
  },
  {
    id: 'doc-07',
    name: 'BS. CKI. Phạm Minh Đức',
    department: 'Khoa Nhi',
    title: 'Trưởng Khoa Nhi • Chuyên gia Sơ sinh',
    experience: '12 năm kinh nghiệm Nhi đồng 1',
    avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&auto=format&fit=crop&q=80',
    rating: 4.9,
    consultationFee: 250000,
    isSpecialist: true,
  },
  {
    id: 'doc-08',
    name: 'BS. CKII. Lê Văn Tuấn',
    department: 'Khoa Tai Mũi Họng',
    title: 'Trưởng Khoa TMH • Bác sĩ CKII',
    experience: '14 năm kinh nghiệm Vi phẫu tai mũi họng',
    avatar: 'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=300&auto=format&fit=crop&q=80',
    rating: 4.9,
    consultationFee: 280000,
    isSpecialist: true,
  },
  {
    id: 'doc-09',
    name: 'BS. CKI. Trần Ngọc Mai',
    department: 'Khoa Mắt',
    title: 'Trưởng Khoa Mắt • Phẫu thuật viên Phaco',
    experience: '11 năm kinh nghiệm Bệnh viện Mắt',
    avatar: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=300&auto=format&fit=crop&q=80',
    rating: 4.8,
    consultationFee: 220000,
  },
];

// Danh mục Gói Khám Sức Khỏe & Tầm Soát Định Kỳ
interface HealthPackageOption {
  id: string;
  name: string;
  category: string;
  originalPrice: number;
  discountPrice: number;
  bhytSupport: number;
  recommendedFor: string;
  badge: string;
  badgeColor: string;
  departmentId: string;
  departmentName: string;
  items: string[];
}

const HEALTH_PACKAGES_CATALOG: HealthPackageOption[] = [
  {
    id: 'pkg-tong-quat',
    name: 'Gói Khám Sức Khỏe Tổng Quát Tiêu Chuẩn',
    category: 'Tổng Quát',
    originalPrice: 1200000,
    discountPrice: 850000,
    bhytSupport: 120000,
    recommendedFor: 'Người trưởng thành kiểm tra sức khỏe định kỳ hàng năm',
    badge: 'PHỔ BIẾN NHẤT',
    badgeColor: '#0284c7',
    departmentId: 'dept-noi',
    departmentName: 'Khoa Nội Tổng Hợp',
    items: [
      'Khám Nội tổng quát & đo sinh hiệu (Huyết áp, BMI, SpO2)',
      'Công thức máu toàn phần (CBC 18 chỉ số)',
      'Đường huyết đói (Glucose) & Chức năng gan (AST, ALT)',
      'Chức năng thận (Urea, Creatinine)',
      'Tổng phân tích nước tiểu 10 thông số',
      'Chụp X-Quang tim phổi thẳng kỹ thuật số',
      'Điện tâm đồ (ECG 12 chuyển đạo) & Siêu âm ổ bụng tổng quát',
    ],
  },
  {
    id: 'pkg-tim-mach',
    name: 'Gói Tầm Soát Tim Mạch & Nguy Cơ Đột Quỵ',
    category: 'Chuyên Sâu',
    originalPrice: 2450000,
    discountPrice: 1850000,
    bhytSupport: 180000,
    recommendedFor: 'Người trên 35 tuổi, có tiền sử tăng huyết áp, hút thuốc, mỡ máu',
    badge: 'CHUYÊN SÂU',
    badgeColor: '#e11d48',
    departmentId: 'dept-tim-mach',
    departmentName: 'Khoa Tim Mạch',
    items: [
      'Khám & tư vấn trực tiếp cùng Bác sĩ CKII Tim mạch',
      'Siêu âm tim Doppler màu 4D khảo sát hở van & chức năng co bóp',
      'Đo điện tim gắng sức & X-Quang bóng tim',
      'Bộ mỡ máu toàn phần (Cholesterol, Triglyceride, HDL, LDL)',
      'Định lượng Troponin I & Siêu âm Doppler động mạch cảnh',
      'Đánh giá thang điểm xơ vữa động mạch & nguy cơ nhồi máu cơ tim',
    ],
  },
  {
    id: 'pkg-tieu-hoa',
    name: 'Gói Tầm Soát Tiêu Hóa & Gan Mật Công Nghệ Cao',
    category: 'Tiêu Hóa',
    originalPrice: 2100000,
    discountPrice: 1650000,
    bhytSupport: 150000,
    recommendedFor: 'Người đau thượng vị, ợ hơi, trào ngược, có tiền sử viêm gan B/C',
    badge: 'CÔNG NGHỆ CAO',
    badgeColor: '#0369a1',
    departmentId: 'dept-tieu-hoa',
    departmentName: 'Khoa Tiêu Hóa',
    items: [
      'Khám chuyên khoa Tiêu hóa cùng Bác sĩ Trưởng khoa',
      'Nội soi thực quản - dạ dày - tá tràng không đau (Tiền mê êm ái)',
      'Test vi khuẩn HP dạ dày nhanh (Urease Test)',
      'Men gan chuyên sâu (SGOT, SGPT, GGT) & Kháng nguyên HBsAg',
      'Siêu âm đàn hồi mô gan (Fibroscan) phát hiện xơ gan sớm',
      'Tầm soát ung thư gan sớm AFP',
    ],
  },
  {
    id: 'pkg-hau-covid',
    name: 'Gói Khám Hậu COVID & Phục Hồi Chức Năng Phổi',
    category: 'Hô Hấp',
    originalPrice: 950000,
    discountPrice: 690000,
    bhytSupport: 85000,
    recommendedFor: 'Người thường xuyên hụt hơi, ho kéo dài, mệt mỏi sau nhiễm virus',
    badge: 'TIẾT KIỆM',
    badgeColor: '#10b981',
    departmentId: 'dept-noi',
    departmentName: 'Khoa Nội Tổng Hợp',
    items: [
      'Khám Nội hô hấp & đo bão hòa oxy máu mao mạch SpO2',
      'Đo chức năng hô hấp (Hô hấp ký Spirometry)',
      'X-Quang lồng ngực kỹ thuật số độ phân giải cao',
      'Định lượng D-Dimer tầm soát huyết khối tắc mạch vi thể',
      'Điện tâm đồ kiểm tra rối loạn nhịp hậu nhiễm',
    ],
  },
];

export const PatientBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);

  // Modern Medical Portal Modes & Omnibar Search
  const [bookingMode, setBookingMode] = useState<'byDept' | 'byDoctor' | 'byPackage' | 'byFollowUp'>('byDept');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<HealthPackageOption | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'kiosk'>('vietqr');
  const [hasBhyt, setHasBhyt] = useState(true);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  // Form selections
  const [selectedDept, setSelectedDept] = useState<DepartmentOption>(DEPARTMENTS_CATALOG[0]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [slots, setSlots] = useState<TimeSlotQuotaItem[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Patient Info Form
  const [form] = Form.useForm();
  const [bookingLoading, setBookingLoading] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<OnlineAppointmentItem | null>(null);

  // Auth Guard & Profile Completion Modal States
  const [requireLoginModalOpen, setRequireLoginModalOpen] = useState(false);
  const [requireLoginActionTitle, setRequireLoginActionTitle] = useState('đặt lịch khám');
  const [completeProfileModalOpen, setCompleteProfileModalOpen] = useState(false);
  const [completeProfileAllowClose, setCompleteProfileAllowClose] = useState(false);

  // Helper: Bắt buộc đăng nhập & hoàn tất hồ sơ trước khi thực hiện bất kỳ thao tác nào
  const ensureAuthenticated = (actionName: string): boolean => {
    if (!user) {
      setRequireLoginActionTitle(actionName);
      setRequireLoginModalOpen(true);
      return false;
    }
    // Nếu là bệnh nhân nhưng chưa hoàn thiện thông tin định danh

    if (isPatientUser(user) && !isPatientProfileComplete(user)) {
      setCompleteProfileModalOpen(true);
      setCompleteProfileAllowClose(false);
      showToast('Vui lòng cập nhật đầy đủ thông tin bệnh nhân trước khi tiếp tục!', 'warning');
      return false;
    }
    return true;
  };

  // Tự động kích hoạt Modal Cập nhật Hồ sơ nếu Bệnh nhân chưa đủ thông tin bắt buộc
  useEffect(() => {
    if (user && isPatientUser(user)) {
      if (!isPatientProfileComplete(user)) {
        setCompleteProfileModalOpen(true);
        setCompleteProfileAllowClose(false);
      }
    }
  }, [user]);

  // Auto pre-fill thông tin bệnh nhân nếu đã đăng nhập
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        fullName: user.hoTen || user.tenDangNhap,
        phoneNumber: user.soDienThoai || '',
        gender: user.gioiTinh || 'Nam',
        birthYear: user.namSinh || (user.ngaySinh ? dayjs(user.ngaySinh).year() : ''),
        identityNumber: user.soCCCD || '',
      });
    }
  }, [user, form]);

  // Tra cứu lịch hẹn modal
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupResults, setLookupResults] = useState<OnlineAppointmentItem[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupTypeFilter, setLookupTypeFilter] = useState<'ALL' | 'New' | 'FollowUp'>('ALL');

  // Reschedule Appointment States
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<OnlineAppointmentItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [rescheduleSlot, setRescheduleSlot] = useState<string>('');
  const [rescheduleSlots, setRescheduleSlots] = useState<TimeSlotQuotaItem[]>([]);
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState<string>('');
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

  // Cancel Appointment States
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState<OnlineAppointmentItem | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Bận việc đột xuất không thể đến khám');
  const [cancelCustomReason, setCancelCustomReason] = useState<string>('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Filter doctors by selected department & Omnibar query
  const filteredDoctors = DOCTORS_CATALOG.filter((d) => {
    const matchesDept = d.department === selectedDept.name;
    if (!searchQuery.trim()) return matchesDept;
    const q = searchQuery.toLowerCase().trim();
    return (
      matchesDept &&
      (d.name.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.experience.toLowerCase().includes(q))
    );
  });

  // Helper tính giá khám & BHYT
  const calculatePricing = () => {
    let basePrice = 150000;
    let bhytDiscount = 42100;

    if (selectedPackage) {
      basePrice = selectedPackage.discountPrice;
      bhytDiscount = selectedPackage.bhytSupport;
    } else if (selectedDoctor && selectedDoctor.consultationFee) {
      basePrice = selectedDoctor.consultationFee;
      bhytDiscount = 42100;
    } else if (selectedDept && selectedDept.price) {
      basePrice = selectedDept.price;
      bhytDiscount = selectedDept.bhytPrice;
    }

    const effectiveBhyt = hasBhyt ? bhytDiscount : 0;
    const finalTotal = Math.max(0, basePrice - effectiveBhyt);

    return { basePrice, effectiveBhyt, finalTotal };
  };

  // Chọn Gói khám sức khỏe (chuyển sang bước 2 chọn ngày)
  const handleSelectPackage = (pkg: HealthPackageOption) => {
    if (!ensureAuthenticated('chọn gói khám sức khỏe')) return;
    setSelectedPackage(pkg);
    const matchedDept = DEPARTMENTS_CATALOG.find((d) => d.id === pkg.departmentId) || DEPARTMENTS_CATALOG[0];
    setSelectedDept(matchedDept);
    const docs = DOCTORS_CATALOG.filter((d) => d.department === matchedDept.name);
    setSelectedDoctor(docs.length > 0 ? docs[0] : null);
    setCurrentStep(2); // Nhảy thẳng vào chọn ngày & giờ!
    showToast(`Đã chọn ${pkg.name}. Vui lòng chọn ngày & giờ khám!`, 'success');
  };

  // Chọn đích danh Bác sĩ từ tab Bác sĩ Chuyên gia
  const handleSelectDoctorDirect = (doc: DoctorOption) => {
    if (!ensureAuthenticated('chọn bác sĩ khám')) return;
    setSelectedDoctor(doc);
    const matchedDept = DEPARTMENTS_CATALOG.find((d) => d.name === doc.department) || DEPARTMENTS_CATALOG[0];
    setSelectedDept(matchedDept);
    setSelectedPackage(null);
    setCurrentStep(2); // Nhảy thẳng vào chọn ngày & giờ!
    showToast(`Đã chọn ${doc.name}. Vui lòng chọn ngày & giờ khám!`, 'success');
  };

  // Fetch slots whenever selectedDate changes
  useEffect(() => {
    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const data = await appointmentService.getTimeSlots(selectedDate, selectedDept.name);
        setSlots(data);
        // Reset selected slot if not valid
        setSelectedSlot('');
      } catch {
        // Fallback
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [selectedDate, selectedDept]);

  // Handle department change
  const handleSelectDept = (dept: DepartmentOption) => {
    if (!ensureAuthenticated('chọn chuyên khoa khám')) return;
    setSelectedDept(dept);
    setSelectedPackage(null);
    const docs = DOCTORS_CATALOG.filter((d) => d.department === dept.name);
    setSelectedDoctor(docs.length > 0 ? docs[0] : null);
    setCurrentStep(1); // Sang bước chọn bác sĩ
  };

  // Handle submit booking
  const handleCompleteBooking = async () => {
    if (!ensureAuthenticated('xác nhận đặt lịch khám')) return;
    try {
      const values = await form.validateFields();
      if (!selectedSlot) {
        showErrorAlert('Chưa chọn giờ khám', 'Vui lòng quay lại bước 3 để chọn khung giờ khám!');
        setCurrentStep(2);
        return;
      }

      setBookingLoading(true);

      const patientCode = user?.maBenhNhan || `BN2026${Date.now().toString().slice(-4)}`;
      const appointmentTime = selectedSlot.split(' - ')[0].trim();
      const pricing = calculatePricing();

      let reason = values.symptoms ? values.symptoms.trim() : '';
      if (selectedPackage) {
        reason = `[${selectedPackage.name}] ` + (reason || 'Khám gói sức khỏe & tầm soát chuyên sâu');
      } else if (values.appointmentType === 'FollowUp') {
        reason = `[Tái khám định kỳ] ` + (reason || (values.previousRecordCode ? `Mã HS: ${values.previousRecordCode}` : 'Theo hẹn Bác sĩ'));
      } else if (!reason) {
        reason = 'Đăng ký đặt lịch khám trực tuyến qua Web Portal';
      }
      reason += ` • [Thanh toán: ${paymentMethod === 'vietqr' ? 'VietQR Online (Ưu tiên)' : 'Kiosk tại viện'} | ${hasBhyt ? `BHYT giảm ${pricing.effectiveBhyt.toLocaleString('vi-VN')}đ` : 'Tự túc'} | Tạm tính: ${pricing.finalTotal.toLocaleString('vi-VN')}đ]`;

      const newApt = await appointmentService.createAppointment({
        patientCode: patientCode,
        patientName: values.fullName.trim(),
        patientPhone: values.phoneNumber.trim(),
        patientGender: values.gender || 'Nam',
        patientAge: values.birthYear ? new Date().getFullYear() - Number(values.birthYear) : 30,
        departmentName: selectedPackage ? `${selectedDept.name} (${selectedPackage.name})` : selectedDept.name,
        doctorName: selectedDoctor ? selectedDoctor.name : `BS. Chuyên khoa ${selectedDept.name}`,
        appointmentDate: selectedDate,
        appointmentTime: appointmentTime,
        symptomsReason: reason,
        sourceApp: 'Web Booking Portal',
        appointmentType: values.appointmentType || 'New',
        previousRecordCode: values.previousRecordCode,
        followUpNotes: values.followUpNotes,
      });

      setCreatedAppointment(newApt);
      setCurrentStep(4); // Màn hình thành công
      showSuccessAlert(
        'Đặt Lịch Khám Thành Công!',
        `Phiếu khám điện tử và Mã QR của bạn đã được khởi tạo. Không cần bốc số thứ tự STT khi tới bệnh viện!`
      );
    } catch (err: any) {
      if (err.errorFields) {
        showToast('Vui lòng điền đầy đủ các thông tin bắt buộc!', 'warning');
      } else {
        showErrorAlert('Lỗi đặt khám', err.message || 'Không thể tạo lịch hẹn. Khung giờ có thể đã hết chỗ.');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle lookup appointments
  const handleLookup = async () => {
    if (!lookupPhone.trim()) {
      showToast('Vui lòng nhập số điện thoại hoặc mã hẹn!', 'warning');
      return;
    }
    setLookupLoading(true);
    try {
      const all = await appointmentService.getAppointments();
      const query = lookupPhone.trim().toLowerCase();
      const found = all.filter(
        (a) =>
          a.patientPhone.includes(query) ||
          a.patientCode.toLowerCase().includes(query) ||
          a.id.toLowerCase().includes(query)
      );
      setLookupResults(found);
    } catch {
      showToast('Lỗi tra cứu lịch hẹn.', 'error');
    } finally {
      setLookupLoading(false);
    }
  };

  // Mở modal tra cứu trực tiếp lịch hẹn của Bệnh nhân đang đăng nhập
  const openPatientAppointments = async () => {
    if (!ensureAuthenticated('xem lịch hẹn của tôi')) return;
    setLookupModalOpen(true);
    const targetPhone = user?.soDienThoai || '';
    if (targetPhone) {
      setLookupPhone(targetPhone);
      setLookupLoading(true);
      try {
        const all = await appointmentService.getAppointments();
        const found = all.filter(
          (a) =>
            a.patientPhone.includes(targetPhone) ||
            a.patientCode.toLowerCase().includes(targetPhone.toLowerCase())
        );
        setLookupResults(found);
      } catch {
        showToast('Lỗi tải danh sách lịch hẹn', 'error');
      } finally {
        setLookupLoading(false);
      }
    }
  };

  // Mở modal đổi lịch khám (Reschedule)
  const handleOpenReschedule = async (apt: OnlineAppointmentItem) => {
    if (!ensureAuthenticated('đổi lịch hẹn khám')) return;
    setReschedulingAppointment(apt);
    const initialDate = dayjs(apt.appointmentDate).isBefore(dayjs().startOf('day'))
      ? dayjs().add(1, 'day').format('YYYY-MM-DD')
      : apt.appointmentDate;
    setRescheduleDate(initialDate);
    setRescheduleSlot('');
    setRescheduleReason('');
    setRescheduleModalOpen(true);

    setRescheduleSlotsLoading(true);
    try {
      const data = await appointmentService.getTimeSlots(initialDate, apt.departmentName);
      setRescheduleSlots(data);
    } catch {
      // fallback
    } finally {
      setRescheduleSlotsLoading(false);
    }
  };

  // Thay đổi ngày khám mới khi đổi lịch
  const handleChangeRescheduleDate = async (dateStr: string) => {
    setRescheduleDate(dateStr);
    setRescheduleSlot('');
    setRescheduleSlotsLoading(true);
    try {
      const data = await appointmentService.getTimeSlots(
        dateStr,
        reschedulingAppointment?.departmentName
      );
      setRescheduleSlots(data);
    } catch {
      // fallback
    } finally {
      setRescheduleSlotsLoading(false);
    }
  };

  // Xác nhận đổi lịch khám (Tự động hoàn trả slot cũ & chiếm slot mới)
  const handleConfirmReschedule = async () => {
    if (!reschedulingAppointment) return;
    if (!rescheduleSlot) {
      showToast('Vui lòng chọn khung giờ khám mới!', 'warning');
      return;
    }

    setRescheduleSubmitting(true);
    try {
      const updated = await appointmentService.rescheduleAppointment(
        reschedulingAppointment.id,
        rescheduleDate,
        rescheduleSlot,
        rescheduleReason.trim()
      );

      showSuccessAlert(
        'Đổi Lịch Khám Thành Công!',
        `Lịch hẹn mới: ${updated.appointmentTime} ngày ${dayjs(updated.appointmentDate).format('DD/MM/YYYY')}. Mã QR đã được tự động cập nhật.`
      );

      setRescheduleModalOpen(false);

      // Cập nhật kết quả tra cứu
      setLookupResults((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );

      // Cập nhật createdAppointment nếu đang ở Step 4
      if (createdAppointment && createdAppointment.id === updated.id) {
        setCreatedAppointment(updated);
      }

      // Làm mới danh sách khung giờ nếu đang ở màn hình chọn giờ và trùng ngày
      if (selectedDate === rescheduleDate) {
        const refreshedSlots = await appointmentService.getTimeSlots(selectedDate, selectedDept.name);
        setSlots(refreshedSlots);
      }
    } catch (err: any) {
      showErrorAlert('Không thể đổi lịch', err.message || 'Lỗi khi cập nhật lịch khám');
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  // Mở modal hủy lịch (Cancel)
  const handleOpenCancel = (apt: OnlineAppointmentItem) => {
    if (!ensureAuthenticated('hủy lịch hẹn khám')) return;
    setCancellingAppointment(apt);
    setCancelReason('Bận việc đột xuất không thể đến khám');
    setCancelCustomReason('');
    setCancelModalOpen(true);
  };

  // Xác nhận hủy lịch (Tự động giải phóng quota chỗ trống cho hệ thống)
  const handleConfirmCancel = async () => {
    if (!cancellingAppointment) return;
    const finalReason = cancelReason === 'Khác'
      ? (cancelCustomReason.trim() || 'Lý do khác')
      : cancelReason;

    setCancelSubmitting(true);
    try {
      const updated = await appointmentService.cancelAppointment(
        cancellingAppointment.id,
        finalReason
      );

      showSuccessAlert(
        'Đã Hủy Lịch Khám Thành Công',
        `Lịch hẹn mã ${updated.id.toUpperCase()} đã được hủy. Khung giờ này đã được hoàn trả lại cho hệ thống.`
      );

      setCancelModalOpen(false);

      // Cập nhật kết quả tra cứu
      setLookupResults((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );

      // Cập nhật createdAppointment nếu đang ở Step 4
      if (createdAppointment && createdAppointment.id === updated.id) {
        setCreatedAppointment(updated);
      }

      // Làm mới slots của màn hình chính để quota tự động tăng
      const refreshedSlots = await appointmentService.getTimeSlots(selectedDate, selectedDept.name);
      setSlots(refreshedSlots);
    } catch (err: any) {
      showErrorAlert('Lỗi hủy lịch', err.message || 'Không thể hủy lịch khám');
    } finally {
      setCancelSubmitting(false);
    }
  };

  // Reset booking form
  const handleResetBooking = () => {
    setCurrentStep(0);
    setSelectedDoctor(null);
    setSelectedSlot('');
    setCreatedAppointment(null);
    if (user) {
      form.setFieldsValue({
        fullName: user.hoTen || user.tenDangNhap,
        phoneNumber: user.soDienThoai || '',
        symptoms: '',
        birthYear: '',
        gender: 'Nam',
      });
    } else {
      form.resetFields();
    }
  };

  return (
    <div className="booking-page-container">
      {/* 1. Header & Navigation (Clean Text, No Redundant Icons, Multi-page Route Links) */}
      <PatientPortalHeader
        onOpenLookup={() => setLookupModalOpen(true)}
        onOpenProfile={() => {
          setCompleteProfileModalOpen(true);
          setCompleteProfileAllowClose(true);
        }}
        onSelectBookingTab={(tab) => {
          setBookingMode(tab);
          setSelectedPackage(null);
          setCurrentStep(0);
          const el = document.getElementById('main-booking-flow');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Dòng chữ chạy qua lại thông báo người bệnh (Đặt ở dưới Header & Kích thước to rõ hơn) */}
      <div className="marquee-banner">
        <div className="marquee-prefix">
          <SoundOutlined style={{ fontSize: 15 }} /> THÔNG BÁO
        </div>
        <div className="marquee-content-wrap">
          <div className="marquee-track">
            🔔 Kính chào Quý người bệnh và thân nhân: Bệnh viện Đa khoa D-Medical tiếp nhận khám chữa bệnh tất cả các ngày trong tuần (kể cả Thứ 7 & Chủ Nhật) • Quý khách vui lòng đặt hẹn trước để được vào khám đúng giờ, không lo xếp hàng chờ đợi • Hỗ trợ BHYT thông tuyến toàn quốc và bảo lãnh viện phí trực tiếp • Tổng đài chăm sóc và hỗ trợ người bệnh 24/7: 1900 6868 • Cấp cứu khẩn cấp: 1900 8888.
          </div>
        </div>
      </div>

      {/* 2. Panoramic Medpro Replica Hero Banner with Two Doctors & Omnibar Search */}
      <section className="medpro-hero-section">
        {/* Soft Background Medical Grid & Radial Rings */}
        <div className="medpro-hero-bg-pattern" />

        {/* Left Flank: Friendly Female Doctor */}
        <div className="medpro-doctor-flank flank-left">
          <img
            src="/female_doctor_hero.jpg"
            alt="Bác sĩ Nữ D-Medical"
            className="medpro-doctor-img"
          />
        </div>

        {/* Right Flank: Friendly Male Doctor Pointing */}
        <div className="medpro-doctor-flank flank-right">
          <img
            src="/male_doctor_hero.jpg"
            alt="Bác sĩ Chuyên Khoa D-Medical"
            className="medpro-doctor-img"
          />
        </div>

        {/* Center Content Container */}
        <div className="medpro-hero-center-content">
          <h1 className="medpro-hero-main-title">
            Kết nối Người Dân với Cơ sở & Dịch vụ Y tế hàng đầu
          </h1>

          {/* Omnibar Rounded Pill Search */}
          <div className="medpro-search-bar-wrap">
            <SearchOutlined className="medpro-search-icon" />
            <Input
              className="medpro-search-input"
              placeholder="Tìm kiếm chuyên khoa, bác sĩ, gói khám, triệu chứng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPressEnter={() => {
                const target = document.getElementById('main-booking-flow');
                if (target) target.scrollIntoView({ behavior: 'smooth' });
              }}
              allowClear
            />
            {searchQuery && (
              <Button
                type="primary"
                className="medpro-search-action-btn"
                onClick={() => {
                  const target = document.getElementById('main-booking-flow');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Tìm
              </Button>
            )}
          </div>

          {/* 3 Green Checkmark Bullet Points (Exact Replica of Image) */}
          <div className="medpro-hero-bullet-list">
            <div className="medpro-hero-bullet-item">
              <span className="medpro-bullet-check">✔</span>
              <span><strong>Đặt khám nhanh</strong> - Lấy số thứ tự trực tuyến - Tư vấn sức khỏe từ xa</span>
            </div>
            <div className="medpro-hero-bullet-item">
              <span className="medpro-bullet-check">✔</span>
              <span><strong>Đặt khám theo giờ</strong> - Đặt càng sớm để có thể có số thứ tự thấp nhất</span>
            </div>
            <div className="medpro-hero-bullet-item">
              <span className="medpro-bullet-check">✔</span>
              <span><strong>Được hoàn tiền khi hủy khám</strong> - Có cơ hội nhận ưu đãi hoàn tiền</span>
            </div>
          </div>

          {/* Alert cảnh báo chưa đăng nhập (Gọn gàng trong hero) */}
          {!user && (
            <div style={{ maxWidth: 680, margin: '18px auto 0', textAlign: 'left' }}>
              <Alert
                type="warning"
                showIcon
                icon={<LockOutlined style={{ fontSize: 18, color: '#d97706' }} />}
                style={{
                  borderRadius: 12,
                  border: '1px solid #fde68a',
                  backgroundColor: '#fffbeb',
                  padding: '8px 14px',
                  boxShadow: '0 4px 12px rgba(217, 119, 6, 0.08)',
                }}
                message={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ fontSize: 12.5, color: '#92400e' }}>
                      <strong>Đăng nhập tài khoản Bệnh nhân</strong> để lưu phiếu hẹn QR và tra cứu lịch sử.
                    </div>
                    <Button
                      type="primary"
                      size="small"
                      icon={<LoginOutlined />}
                      style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 700, borderRadius: 6 }}
                      onClick={() => navigate('/login?redirect=/booking')}
                    >
                      Đăng nhập ngay
                    </Button>
                  </div>
                }
              />
            </div>
          )}

          {/* Alert cảnh báo chưa hoàn tất hồ sơ */}
          {user && isPatientUser(user) && !isPatientProfileComplete(user) && (
            <div style={{ maxWidth: 680, margin: '18px auto 0', textAlign: 'left' }}>
              <Alert
                type="warning"
                showIcon
                icon={<IdcardOutlined style={{ fontSize: 18, color: '#d97706' }} />}
                style={{
                  borderRadius: 12,
                  border: '1px solid #fde68a',
                  backgroundColor: '#fffbeb',
                  padding: '8px 14px',
                  boxShadow: '0 4px 12px rgba(217, 119, 6, 0.08)',
                }}
                message={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ fontSize: 12.5, color: '#92400e' }}>
                      <strong>Hồ sơ chưa đủ CCCD / Ngày sinh.</strong> Bổ sung để sẵn sàng khám.
                    </div>
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckCircleOutlined />}
                      style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 700, borderRadius: 6 }}
                      onClick={() => {
                        setCompleteProfileModalOpen(true);
                        setCompleteProfileAllowClose(false);
                      }}
                    >
                      Bổ sung ngay
                    </Button>
                  </div>
                }
              />
            </div>
          )}
        </div>

        {/* 7 Quick Feature Action Cards (Floating Grid as in User Reference Image) */}
        <div className="medpro-cards-carousel-container">
          <div className="medpro-cards-grid">
            {/* Card 1: Đặt khám tại cơ sở */}
            <div
              className={`medpro-service-card ${bookingMode === 'byDept' && !searchQuery ? 'card-active' : ''}`}
              onClick={() => {
                setBookingMode('byDept');
                setSelectedPackage(null);
                setCurrentStep(0);
                const el = document.getElementById('main-booking-flow');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div className="medpro-card-icon-wrap" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <CalendarOutlined style={{ fontSize: 26 }} />
              </div>
              <div className="medpro-card-title">Đặt khám tại cơ sở</div>
            </div>

            {/* Card 2: Đặt khám chuyên khoa */}
            <div
              className={`medpro-service-card ${bookingMode === 'byDept' ? 'card-active' : ''}`}
              onClick={() => {
                setBookingMode('byDept');
                setSelectedPackage(null);
                setCurrentStep(0);
                const el = document.getElementById('main-booking-flow');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div className="medpro-card-icon-wrap" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                <MedicineBoxOutlined style={{ fontSize: 26 }} />
              </div>
              <div className="medpro-card-title">Đặt khám chuyên khoa</div>
            </div>

            {/* Card 3: Gọi video với bác sĩ */}
            <div
              className="medpro-service-card"
              onClick={() => {
                setBookingMode('byDoctor');
                setSelectedPackage(null);
                setCurrentStep(0);
                showToast('Chế độ tư vấn trực tuyến từ xa với Bác sĩ D-Medical!', 'info');
                const el = document.getElementById('main-booking-flow');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div className="medpro-card-icon-wrap" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <VideoCameraOutlined style={{ fontSize: 26 }} />
              </div>
              <div className="medpro-card-title">Gọi video với bác sĩ</div>
            </div>

            {/* Card 4: Đặt lịch xét nghiệm */}
            <div
              className="medpro-service-card"
              onClick={() => {
                setBookingMode('byDept');
                setSearchQuery('xét nghiệm');
                setCurrentStep(0);
                const el = document.getElementById('main-booking-flow');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div className="medpro-card-icon-wrap" style={{ background: '#ecfeff', color: '#0891b2' }}>
                <ExperimentOutlined style={{ fontSize: 26 }} />
              </div>
              <div className="medpro-card-title">Đặt lịch xét nghiệm</div>
            </div>

            {/* Card 5: Đặt khám ngoài giờ */}
            <div
              className="medpro-service-card"
              onClick={() => {
                setBookingMode('byDoctor');
                showToast('Khám ngoài giờ: 17:00 - 21:00 & Thứ 7, Chủ Nhật hàng tuần', 'info');
                const el = document.getElementById('main-booking-flow');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div className="medpro-card-icon-wrap" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                <ClockCircleOutlined style={{ fontSize: 26 }} />
              </div>
              <div className="medpro-card-title">Đặt khám ngoài giờ</div>
            </div>

            {/* Card 6: Giúp việc cá nhân & AI */}
            <div
              className="medpro-service-card"
              onClick={() => setAiDrawerOpen(true)}
            >
              <div className="medpro-card-icon-wrap" style={{ background: '#fef2f2', color: '#ef4444' }}>
                <CustomerServiceOutlined style={{ fontSize: 26 }} />
              </div>
              <div className="medpro-card-title">Giúp việc cá nhân</div>
            </div>

            {/* Card 7: Khám sức khỏe thông tư */}
            <div
              className={`medpro-service-card ${bookingMode === 'byPackage' ? 'card-active' : ''}`}
              onClick={() => {
                setBookingMode('byPackage');
                setCurrentStep(0);
                const el = document.getElementById('main-booking-flow');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div className="medpro-card-icon-wrap" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                <AuditOutlined style={{ fontSize: 26 }} />
              </div>
              <div className="medpro-card-title">Khám sức khỏe thông tư</div>
            </div>
          </div>

          {/* Right Chevron Navigation Button */}
          <button
            type="button"
            className="medpro-carousel-next-btn"
            title="Xem toàn bộ danh mục dịch vụ"
            onClick={() => {
              const el = document.getElementById('main-booking-flow');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <RightOutlined />
          </button>
        </div>

        {/* Floating Orange Phone Button */}
        <a
          href="tel:19001150"
          className="medpro-floating-hotline-btn"
          title="Gọi ngay tổng đài cấp cứu & đặt lịch: 1900 1150"
        >
          <PhoneFilled style={{ fontSize: 24 }} />
        </a>
      </section>

      {/* Partner Accreditation Bar (Medpro Style) */}
      <div className="medpro-partner-bar">
        <div className="medpro-partner-label">
          <SafetyCertificateOutlined style={{ color: '#0284c7' }} />
          <span>Được Tin Tưởng Hợp Tác & Đồng Hành</span>
        </div>
        <div className="medpro-partner-badges">
          <span className="medpro-partner-badge-item">
            <span style={{ color: '#ef4444' }}>🏥</span> Bộ Y Tế Việt Nam
          </span>
          <span className="medpro-partner-badge-item">
            <span style={{ color: '#0284c7' }}>🛡️</span> Bảo Hiểm Xã Hội (BHYT)
          </span>
          <span className="medpro-partner-badge-item">
            <span style={{ color: '#16a34a' }}>👨‍⚕️</span> Đội Ngũ Bác Sĩ Chuyên Khoa
          </span>
          <span className="medpro-partner-badge-item">
            <span style={{ color: '#8b5cf6' }}>⭐</span> Tiêu Chuẩn Chất Lượng Y Tế
          </span>
          <span className="medpro-partner-badge-item">
            <span style={{ color: '#0369a1' }}>🏥</span> Cơ Sở Khám Chữa Bệnh Cấp 1
          </span>
        </div>
      </div>

      {/* Main Booking Container */}
      <main id="main-booking-flow" className="booking-main-card">
        <Card bordered={false} className="booking-card-inner">
          {/* Progress Steps Header */}
          {currentStep < 4 && (
            <div style={{ marginBottom: 30 }}>
              {/* Mobile Step Mini Indicator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
                className="sm:hidden"
              >
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0369a1' }}>
                  Bước {currentStep + 1}/4:{' '}
                  {currentStep === 0
                    ? 'Chọn Chuyên Khoa'
                    : currentStep === 1
                    ? 'Chọn Bác Sĩ'
                    : currentStep === 2
                    ? 'Ngày & Giờ Hẹn'
                    : 'Thông Tin & Xác Nhận'}
                </span>
                <Tag color="cyan" style={{ margin: 0, fontWeight: 700, borderRadius: 12 }}>
                  Tiến trình {(currentStep + 1) * 25}%
                </Tag>
              </div>

              <Steps
                current={currentStep}
                responsive
                size="small"
                onChange={(step) => {
                  if (step > currentStep && !ensureAuthenticated('chuyển bước đặt khám')) return;
                  if (step < currentStep) setCurrentStep(step);
                }}
                items={[
                  { title: 'Chuyên khoa', icon: <MedicineBoxOutlined /> },
                  { title: 'Bác sĩ', icon: <UserOutlined /> },
                  { title: 'Ngày & Giờ', icon: <ClockCircleOutlined /> },
                  { title: 'Thông tin & Xác nhận', icon: <CheckCircleOutlined /> },
                ]}
              />
            </div>
          )}

          {/* Promotional Banner Advertising Slider (Medpro Style Carousel) */}
          {currentStep === 0 && (
            <div className="hospital-carousel-wrap">
              <Carousel autoplay autoplaySpeed={4500} effect="fade" pauseOnHover dots>
                {/* Slide 1: Đặt khám theo giờ */}
                <div className="carousel-slide-card slide-bg-1">
                  <Row gutter={[24, 20]} className="carousel-slide-row">
                    <Col xs={24} md={16}>
                      <div className="carousel-slide-badge">
                        <span>🎉 TIỆN ÍCH DÀNH CHO BỆNH NHÂN</span>
                      </div>
                      <div className="carousel-slide-title">
                        Đặt Hẹn Trước Theo Giờ • Vào Khám Ngay Không Chờ Đợi
                      </div>
                      <div className="carousel-slide-desc">
                        Chủ động lựa chọn Bác sĩ và khung giờ khám thuận tiện cho bạn và gia đình. Đến bệnh viện vào thẳng phòng khám, tiết kiệm 90% thời gian chờ đợi.
                      </div>
                      <div className="carousel-slide-highlights">
                        <span className="carousel-slide-highlight-item">
                          <CheckCircleOutlined /> Ưu tiên tiếp nhận đúng giờ
                        </span>
                        <span className="carousel-slide-highlight-item">
                          <SafetyCertificateOutlined /> Hỗ trợ BHYT thông tuyến
                        </span>
                        <span className="carousel-slide-highlight-item">
                          <ClockCircleOutlined /> Lịch khám linh hoạt T2 - CN
                        </span>
                      </div>
                      <button
                        type="button"
                        className="carousel-slide-btn"
                        onClick={() => {
                          setBookingMode('byDept');
                          setCurrentStep(0);
                        }}
                      >
                        <span>Đặt Lịch Khám Ngay</span>
                        <ArrowRightOutlined />
                      </button>
                    </Col>
                    <Col xs={0} md={8} className="carousel-slide-visual">
                      {/* Placeholder banner visual (Có thể thay thế bằng thẻ <img src="..." /> khi có file thiết kế banner) */}
                      <div className="carousel-visual-placeholder">
                        <div className="carousel-visual-icon">🏥</div>
                        <div className="carousel-visual-title">TIẾP NHẬN ĐÚNG GIỜ</div>
                        <div className="carousel-visual-subtitle">Không lo chen chúc, bốc số</div>
                        <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>
                          * Đặt lịch trực tuyến 24/7
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Slide 2: Gói khám sức khỏe gia đình */}
                <div className="carousel-slide-card slide-bg-2">
                  <Row gutter={[24, 20]} className="carousel-slide-row">
                    <Col xs={24} md={16}>
                      <div className="carousel-slide-badge">
                        <span>❤️ CHĂM SÓC SỨC KHỎE GIA ĐÌNH</span>
                      </div>
                      <div className="carousel-slide-title">
                        Gói Tầm Soát Sức Khỏe Toàn Diện • Ưu Đãi 15% Khi Đặt Online
                      </div>
                      <div className="carousel-slide-desc">
                        Kiểm tra tổng quát tim mạch, gan thận, tầm soát sớm nguy cơ đột quỵ và tiểu đường cho người thân. Bác sĩ chuyên khoa trực tiếp tư vấn kết quả 1-1 chu đáo.
                      </div>
                      <div className="carousel-slide-highlights">
                        <span className="carousel-slide-highlight-item">
                          <CheckCircleOutlined /> Đầy đủ danh mục xét nghiệm
                        </span>
                        <span className="carousel-slide-highlight-item">
                          <UserOutlined /> Tư vấn tận tâm cùng Bác sĩ CKII
                        </span>
                        <span className="carousel-slide-highlight-item">
                          <QrcodeOutlined /> Nhận kết quả trực tuyến tiện lợi
                        </span>
                      </div>
                      <button
                        type="button"
                        className="carousel-slide-btn"
                        onClick={() => {
                          setBookingMode('byPackage');
                          setSelectedPackage(null);
                          setCurrentStep(0);
                        }}
                      >
                        <span>Khám Phá Gói Khám</span>
                        <ArrowRightOutlined />
                      </button>
                    </Col>
                    <Col xs={0} md={8} className="carousel-slide-visual">
                      <div className="carousel-visual-placeholder">
                        <div className="carousel-visual-icon">🩺</div>
                        <div className="carousel-visual-title">GÓI SỨC KHỎE GIA ĐÌNH</div>
                        <div className="carousel-visual-subtitle">Tầm soát toàn diện chuyên sâu</div>
                        <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>
                          * Giảm 15% khi đặt online
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Slide 3: Đội ngũ Bác sĩ chuyên khoa */}
                <div className="carousel-slide-card slide-bg-3">
                  <Row gutter={[24, 20]} className="carousel-slide-row">
                    <Col xs={24} md={16}>
                      <div className="carousel-slide-badge">
                        <span>👨‍⚕️ ĐỘI NGŨ CHUYÊN GIA Y TẾ</span>
                      </div>
                      <div className="carousel-slide-title">
                        Thăm Khám Cùng Bác Sĩ Chuyên Khoa Giàu Kinh Nghiệm
                      </div>
                      <div className="carousel-slide-desc">
                        Hơn 50 Bác sĩ Chuyên khoa I, II và Tiến sĩ y khoa luôn sẵn sàng lắng nghe, tư vấn và đồng hành cùng sức khỏe gia đình bạn với phong cách phục vụ ân cần.
                      </div>
                      <div className="carousel-slide-highlights">
                        <span className="carousel-slide-highlight-item">
                          <CheckCircleOutlined /> Xem trước hồ sơ & chuyên môn Bác sĩ
                        </span>
                        <span className="carousel-slide-highlight-item">
                          <SafetyCertificateOutlined /> Tư vấn kỹ lưỡng, tận tình
                        </span>
                        <span className="carousel-slide-highlight-item">
                          <CalendarOutlined /> Lịch khám liên tục trong tuần
                        </span>
                      </div>
                      <button
                        type="button"
                        className="carousel-slide-btn"
                        onClick={() => {
                          setBookingMode('byDoctor');
                          setSelectedPackage(null);
                          setCurrentStep(0);
                        }}
                      >
                        <span>Chọn Bác Sĩ Khám</span>
                        <ArrowRightOutlined />
                      </button>
                    </Col>
                    <Col xs={0} md={8} className="carousel-slide-visual">
                      <div className="carousel-visual-placeholder">
                        <div className="carousel-visual-icon">👨‍⚕️</div>
                        <div className="carousel-visual-title">BÁC SĨ CHUYÊN GIA</div>
                        <div className="carousel-visual-subtitle">Tận tâm, chu đáo & uy tín</div>
                        <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>
                          * Trực khám T2 - Chủ Nhật
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Carousel>
            </div>
          )}

          {/* Booking Modes Switcher Tabs (Medpro / BookingCare Style) */}
          <div className="booking-modes-bar">
            <button
              type="button"
              className={`mode-tab-btn ${bookingMode === 'byDept' ? 'active' : ''}`}
              onClick={() => {
                setBookingMode('byDept');
                setSelectedPackage(null);
                setCurrentStep(0);
              }}
            >
              <MedicineBoxOutlined />
              <span>Theo Chuyên Khoa</span>
            </button>
            <button
              type="button"
              className={`mode-tab-btn ${bookingMode === 'byDoctor' ? 'active' : ''}`}
              onClick={() => {
                setBookingMode('byDoctor');
                setSelectedPackage(null);
                setCurrentStep(0);
              }}
            >
              <UserOutlined />
              <span>Bác Sĩ Chuyên Gia</span>
            </button>
            <button
              type="button"
              className={`mode-tab-btn ${bookingMode === 'byPackage' ? 'active' : ''}`}
              onClick={() => {
                setBookingMode('byPackage');
                setCurrentStep(0);
              }}
            >
              <ThunderboltOutlined />
              <span>Gói Khám & Tầm Soát</span>
            </button>
            <button
              type="button"
              className={`mode-tab-btn ${bookingMode === 'byFollowUp' ? 'active' : ''}`}
              onClick={() => {
                setBookingMode('byFollowUp');
                setSelectedPackage(null);
                form.setFieldsValue({ appointmentType: 'FollowUp' });
                setCurrentStep(0);
              }}
            >
              <HistoryOutlined />
              <span>Tái Khám Theo Hẹn</span>
            </button>
          </div>

          {/* ================= STEP 0: NỘI DUNG THEO TỪNG CHẾ ĐỘ ================= */}
          {currentStep === 0 && (
            <div>
              {/* CHẾ ĐỘ 1: THEO CHUYÊN KHOA */}
              {bookingMode === 'byDept' && (
                <div>
                  <div className="medpro-section-header" style={{ marginTop: 8 }}>
                    <div className="medpro-section-title">Cơ Sở & Chuyên Khoa Tiêu Biểu</div>
                    <div
                      className="medpro-view-all-btn"
                      onClick={() => {
                        setSearchQuery('');
                      }}
                    >
                      Tất cả 9 chuyên khoa <ArrowRightOutlined />
                    </div>
                  </div>

                  <Row gutter={[16, 16]}>
                    {DEPARTMENTS_CATALOG.filter((d) => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase().trim();
                      return d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q);
                    }).map((dept) => {
                      const isSelected = selectedDept.id === dept.id;
                      return (
                        <Col xs={24} sm={12} md={8} key={dept.id}>
                          <div
                            onClick={() => handleSelectDept(dept)}
                            style={{
                              padding: '20px 18px',
                              borderRadius: 16,
                              border: isSelected ? '2px solid #0284c7' : '1px solid #bae6fd',
                              backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: isSelected ? '0 8px 22px rgba(2, 132, 199, 0.16)' : 'none',
                              display: 'flex',
                              flexDirection: 'column',
                              height: '100%',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                              <div
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 12,
                                  backgroundColor: dept.iconBg,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#ffffff',
                                  fontSize: 20,
                                  flexShrink: 0,
                                }}
                              >
                                <MedicineBoxOutlined />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>
                                  {dept.name}
                                </div>
                                <div style={{ fontSize: 11.5, color: '#0284c7', fontWeight: 600 }}>
                                  📍 {dept.location}
                                </div>
                              </div>
                            </div>

                            <p style={{ fontSize: 12.5, color: '#475569', margin: '0 0 10px', lineHeight: 1.45, flex: 1 }}>
                              {dept.description}
                            </p>

                            <div style={{ marginBottom: 10 }}>
                              <span className="medpro-rating-badge">
                                ⭐ 5.0 (450+ lượt khám)
                              </span>
                            </div>

                            {/* Bảng giá & Hỗ trợ BHYT */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 10px',
                                backgroundColor: '#f8fafc',
                                borderRadius: 10,
                                border: '1px solid #e2e8f0',
                                marginBottom: 12,
                                fontSize: 12,
                              }}
                            >
                              <div>
                                <span style={{ color: '#64748b' }}>Phí khám: </span>
                                <strong style={{ color: '#0284c7', fontSize: 13 }}>{dept.price.toLocaleString('vi-VN')} đ</strong>
                              </div>
                              <Tag color="cyan" style={{ margin: 0, fontWeight: 700, fontSize: 10.5 }}>
                                BHYT: -{dept.bhytPrice.toLocaleString('vi-VN')} đ
                              </Tag>
                            </div>

                            <Button
                              type={isSelected ? 'primary' : 'default'}
                              style={{
                                borderRadius: 10,
                                fontWeight: 700,
                                backgroundColor: isSelected ? '#0284c7' : undefined,
                                borderColor: '#0284c7',
                                color: isSelected ? '#ffffff' : '#0284c7',
                              }}
                              block
                            >
                              {isSelected ? 'Đã chọn chuyên khoa này' : 'Đặt Khám Ngay'}
                            </Button>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>

                  {/* Medpro Section 2: Bác Sĩ Tư Vấn Khám Bệnh Nổi Bật */}
                  <div className="medpro-section-wrap" style={{ marginTop: 40 }}>
                    <div className="medpro-section-header">
                      <div className="medpro-section-title">Bác Sĩ Tư Vấn Khám Bệnh Nổi Bật</div>
                      <div
                        className="medpro-view-all-btn"
                        onClick={() => {
                          setBookingMode('byDoctor');
                          window.scrollTo({ top: 450, behavior: 'smooth' });
                        }}
                      >
                        Xem tất cả bác sĩ ({DOCTORS_CATALOG.length}) <ArrowRightOutlined />
                      </div>
                    </div>

                    <Row gutter={[16, 16]}>
                      {DOCTORS_CATALOG.slice(0, 4).map((doc) => (
                        <Col xs={24} sm={12} md={6} key={doc.id}>
                          <div className="medpro-doc-card">
                            <div style={{ position: 'relative', marginBottom: 12 }}>
                              <Avatar
                                src={doc.avatar}
                                size={74}
                                style={{
                                  border: '3px solid #0284c7',
                                  backgroundColor: '#e0f2fe',
                                }}
                              />
                              {doc.isSpecialist && (
                                <Tag
                                  color="gold"
                                  style={{
                                    position: 'absolute',
                                    bottom: -6,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    margin: 0,
                                    fontSize: 9.5,
                                    fontWeight: 800,
                                    borderRadius: 10,
                                    padding: '1px 8px',
                                  }}
                                >
                                  CHUYÊN GIA
                                </Tag>
                              )}
                            </div>

                            <div style={{ fontWeight: 800, fontSize: 14.5, color: '#0f172a', marginBottom: 2 }}>
                              {doc.name}
                            </div>
                            <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 700 }}>
                              {doc.department}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2, minHeight: 34 }}>
                              {doc.title}
                            </div>

                            <div style={{ margin: '8px 0 10px' }}>
                              <span className="medpro-rating-badge">
                                ⭐ {doc.rating} (150+ lượt)
                              </span>
                            </div>

                            <div style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>
                              Phí tư vấn: <strong style={{ color: '#0284c7' }}>{doc.consultationFee.toLocaleString('vi-VN')} đ</strong>
                            </div>

                            <Button
                              type="primary"
                              style={{
                                backgroundColor: '#0284c7',
                                borderColor: '#0284c7',
                                fontWeight: 700,
                                borderRadius: 10,
                              }}
                              block
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectDoctorDirect(doc);
                              }}
                            >
                              Đặt Khám Ngay
                            </Button>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>

                  {/* Medpro Section 3: Gói Khám Sức Khỏe Toàn Diện */}
                  <div className="medpro-section-wrap" style={{ marginTop: 40 }}>
                    <div className="medpro-section-header">
                      <div className="medpro-section-title">Gói Khám Sức Khỏe & Tầm Soát Toàn Diện</div>
                      <div
                        className="medpro-view-all-btn"
                        onClick={() => {
                          setBookingMode('byPackage');
                          window.scrollTo({ top: 450, behavior: 'smooth' });
                        }}
                      >
                        Xem tất cả gói khám <ArrowRightOutlined />
                      </div>
                    </div>

                    <Row gutter={[16, 16]}>
                      {HEALTH_PACKAGES_CATALOG.slice(0, 3).map((pkg) => (
                        <Col xs={24} md={8} key={pkg.id}>
                          <div className="package-card">
                            <div className="package-ribbon" style={{ backgroundColor: pkg.badgeColor }}>
                              {pkg.badge}
                            </div>

                            <div style={{ fontWeight: 800, fontSize: 15.5, color: '#0f172a', marginBottom: 6, paddingRight: 40 }}>
                              {pkg.name}
                            </div>
                            <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 600, marginBottom: 8 }}>
                              🏥 {pkg.departmentName}
                            </div>

                            <div className="package-price-tag">
                              <div>
                                <span className="package-orig-price">{pkg.originalPrice.toLocaleString('vi-VN')} đ</span>
                                <div className="package-disc-price">{pkg.discountPrice.toLocaleString('vi-VN')} đ</div>
                              </div>
                              <Tag color="cyan" style={{ margin: 0, fontWeight: 700, fontSize: 10.5 }}>
                                BHYT: -{pkg.bhytSupport.toLocaleString('vi-VN')} đ
                              </Tag>
                            </div>

                            <div className="package-items-list" style={{ marginBottom: 16 }}>
                              {pkg.items.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="package-item-row">
                                  <span style={{ color: '#0284c7', fontWeight: 700 }}>✓</span>
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>

                            <Button
                              type="primary"
                              style={{
                                backgroundColor: '#0284c7',
                                borderColor: '#0284c7',
                                fontWeight: 700,
                                borderRadius: 10,
                                marginTop: 'auto',
                              }}
                              block
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectPackage(pkg);
                              }}
                            >
                              Đăng Ký Gói Này
                            </Button>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                </div>
              )}

              {/* CHẾ ĐỘ 2: THEO BÁC SĨ CHUYÊN GIA */}
              {bookingMode === 'byDoctor' && (
                <div>
                  <div style={{ marginBottom: 20, textAlign: 'center' }}>
                    <Title level={3} style={{ color: '#0369a1', fontWeight: 800, margin: 0 }}>
                      Đặt Khám Trực Tiếp Cùng Bác Sĩ Chuyên Gia & Trưởng Khoa
                    </Title>
                    <Text style={{ color: '#64748b', fontSize: 13.5 }}>
                      Lựa chọn các Bác sĩ CKII, Thạc sĩ, Tiến sĩ có thâm niên từ các bệnh viện tuyến đầu (Chợ Rẫy, ĐH Y Dược)
                    </Text>
                  </div>

                  <Row gutter={[16, 16]}>
                    {DOCTORS_CATALOG.filter((doc) => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase().trim();
                      return (
                        doc.name.toLowerCase().includes(q) ||
                        doc.department.toLowerCase().includes(q) ||
                        doc.title.toLowerCase().includes(q)
                      );
                    }).map((doc) => {
                      const isSelected = selectedDoctor?.id === doc.id;
                      return (
                        <Col xs={24} sm={12} md={8} key={doc.id}>
                          <div
                            onClick={() => handleSelectDoctorDirect(doc)}
                            style={{
                              padding: '20px 16px',
                              borderRadius: 16,
                              border: isSelected ? '2px solid #0284c7' : '1px solid #bae6fd',
                              backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                              cursor: 'pointer',
                              transition: 'all 0.22s ease',
                              boxShadow: isSelected ? '0 8px 24px rgba(2, 132, 199, 0.16)' : 'none',
                              display: 'flex',
                              flexDirection: 'column',
                              height: '100%',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ position: 'relative', display: 'inline-block', margin: '0 auto 12px' }}>
                              <Avatar
                                src={doc.avatar}
                                size={76}
                                style={{
                                  border: '3px solid #0284c7',
                                  backgroundColor: '#e0f2fe',
                                }}
                              />
                              {doc.isSpecialist && (
                                <Tag
                                  color="gold"
                                  style={{
                                    position: 'absolute',
                                    bottom: -6,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    margin: 0,
                                    fontSize: 9.5,
                                    fontWeight: 800,
                                    borderRadius: 10,
                                    padding: '1px 8px',
                                  }}
                                >
                                  CHUYÊN GIA
                                </Tag>
                              )}
                            </div>

                            <div style={{ fontWeight: 800, fontSize: 15.5, color: '#0f172a' }}>
                              {doc.name}
                            </div>
                            <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 700, marginTop: 4 }}>
                              {doc.department}
                            </div>
                            <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                              {doc.title}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2, fontStyle: 'italic' }}>
                              {doc.experience}
                            </div>

                            <div style={{ margin: '10px 0 14px' }}>
                              <Tag color="cyan" style={{ fontWeight: 700 }}>
                                ⭐ {doc.rating} / 5.0 (1,240 lượt khám)
                              </Tag>
                            </div>

                            {/* Bảng giá khám Bác sĩ */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 12px',
                                backgroundColor: '#f8fafc',
                                borderRadius: 10,
                                border: '1px solid #e2e8f0',
                                marginBottom: 12,
                                fontSize: 12,
                              }}
                            >
                              <span style={{ color: '#64748b' }}>Phí khám chuyên gia:</span>
                              <strong style={{ color: '#0284c7', fontSize: 13.5 }}>
                                {doc.consultationFee.toLocaleString('vi-VN')} đ
                              </strong>
                            </div>

                            <Button
                              type={isSelected ? 'primary' : 'default'}
                              style={{
                                borderRadius: 10,
                                fontWeight: 700,
                                backgroundColor: isSelected ? '#0284c7' : undefined,
                                borderColor: '#0284c7',
                                color: isSelected ? '#ffffff' : '#0284c7',
                                marginTop: 'auto',
                              }}
                              block
                            >
                              {isSelected ? 'Đã chọn bác sĩ này' : 'Đặt khám với Bác sĩ'}
                            </Button>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              )}

              {/* CHẾ ĐỘ 3: GÓI KHÁM & TẦM SOÁT SỨC KHỎE */}
              {bookingMode === 'byPackage' && (
                <div>
                  <div style={{ marginBottom: 20, textAlign: 'center' }}>
                    <Title level={3} style={{ color: '#0369a1', fontWeight: 800, margin: 0 }}>
                      Gói Khám Sức Khỏe Tổng Quát & Tầm Soát Chuyên Sâu
                    </Title>
                    <Text style={{ color: '#64748b', fontSize: 13.5 }}>
                      Quy trình khám khép kín, đầy đủ cận lâm sàng (X-Quang, Siêu âm, Xét nghiệm), tiết kiệm đến 30% chi phí
                    </Text>
                  </div>

                  <Row gutter={[16, 16]}>
                    {HEALTH_PACKAGES_CATALOG.filter((pkg) => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase().trim();
                      return pkg.name.toLowerCase().includes(q) || pkg.category.toLowerCase().includes(q);
                    }).map((pkg) => {
                      const isSelected = selectedPackage?.id === pkg.id;
                      return (
                        <Col xs={24} md={12} key={pkg.id}>
                          <div
                            className="package-card"
                            style={{
                              borderColor: isSelected ? '#0284c7' : '#bae6fd',
                              backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                              borderWidth: isSelected ? 2 : 1,
                            }}
                          >
                            <span className="package-ribbon" style={{ backgroundColor: pkg.badgeColor }}>
                              {pkg.badge}
                            </span>

                            <div style={{ paddingRight: 40, marginBottom: 8 }}>
                              <div style={{ fontWeight: 800, fontSize: 16.5, color: '#0f172a', lineHeight: 1.3 }}>
                                {pkg.name}
                              </div>
                              <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 700, marginTop: 4 }}>
                                Phụ trách: {pkg.departmentName}
                              </div>
                            </div>

                            <div style={{ fontSize: 12.5, color: '#64748b', fontStyle: 'italic' }}>
                              Phù hợp: {pkg.recommendedFor}
                            </div>

                            {/* Giá gói */}
                            <div className="package-price-tag">
                              <span className="package-price-current">
                                {pkg.discountPrice.toLocaleString('vi-VN')} đ
                              </span>
                              <span className="package-price-original">
                                {pkg.originalPrice.toLocaleString('vi-VN')} đ
                              </span>
                              <Tag color="error" style={{ margin: 0, fontWeight: 800, fontSize: 10 }}>
                                Tiết kiệm {Math.round((1 - pkg.discountPrice / pkg.originalPrice) * 100)}%
                              </Tag>
                            </div>

                            <Divider style={{ margin: '8px 0 12px' }} />

                            <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0369a1', marginBottom: 6 }}>
                              Danh mục khám & cận lâm sàng bao gồm:
                            </div>
                            <ul className="package-items-list">
                              {pkg.items.map((item, idx) => (
                                <li key={idx}>
                                  <CheckCircleOutlined style={{ color: '#10b981', fontSize: 13 }} />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>

                            <Button
                              type="primary"
                              size="large"
                              style={{
                                backgroundColor: '#0284c7',
                                borderColor: '#0284c7',
                                borderRadius: 10,
                                fontWeight: 700,
                                marginTop: 'auto',
                              }}
                              onClick={() => handleSelectPackage(pkg)}
                              block
                            >
                              {isSelected ? 'Đã chọn gói khám này' : 'Đăng Ký Gói Khám Này'}
                            </Button>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              )}

              {/* CHẾ ĐỘ 4: TÁI KHÁM THEO HẸN */}
              {bookingMode === 'byFollowUp' && (
                <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
                  <div
                    style={{
                      padding: 24,
                      borderRadius: 16,
                      backgroundColor: '#f5f3ff',
                      border: '1.5px solid #ddd6fe',
                      marginBottom: 20,
                    }}
                  >
                    <HistoryOutlined style={{ fontSize: 40, color: '#7c3aed', marginBottom: 12 }} />
                    <Title level={3} style={{ color: '#6d28d9', margin: '0 0 8px' }}>
                      Cổng Đặt Lịch Tái Khám Định Kỳ
                    </Title>
                    <Paragraph style={{ color: '#475569', fontSize: 13.5, maxWidth: 540, margin: '0 auto 16px' }}>
                      Bệnh nhân có lịch hẹn tái khám của Bác sĩ sau đợt điều trị nội khoa hoặc ngoại khoa. Dữ liệu sẽ được tự động liên kết với hồ sơ bệnh án điện tử (EMR) cũ.
                    </Paragraph>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                      <Button
                        type="primary"
                        size="large"
                        style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed', borderRadius: 10, fontWeight: 700 }}
                        onClick={() => {
                          const noiDept = DEPARTMENTS_CATALOG[0];
                          setSelectedDept(noiDept);
                          const docs = DOCTORS_CATALOG.filter((d) => d.department === noiDept.name);
                          setSelectedDoctor(docs[0] || null);
                          setCurrentStep(2);
                        }}
                      >
                        Tiếp Tục Chọn Ngày Giờ Tái Khám
                      </Button>
                      <Button
                        size="large"
                        icon={<SearchOutlined />}
                        style={{ borderColor: '#ddd6fe', color: '#6d28d9', borderRadius: 10, fontWeight: 600 }}
                        onClick={openPatientAppointments}
                      >
                        Xem Lịch Tái Khám Cũ Của Tôi
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 1: CHỌN BÁC SĨ ================= */}
          {currentStep === 1 && (
            <div>
              <div style={{ marginBottom: 24, textAlign: 'center' }}>
                <Title level={3} style={{ color: '#0369a1', fontWeight: 800, margin: 0 }}>
                  Bước 2: Chọn Bác Sĩ Khám Bệnh
                </Title>
                <Text style={{ color: '#64748b', fontSize: 14 }}>
                  Chuyên khoa đã chọn: <strong style={{ color: '#0284c7' }}>{selectedDept.name}</strong>
                </Text>
              </div>

              {filteredDoctors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <MedicineBoxOutlined style={{ fontSize: 48, color: '#94a3b8' }} />
                  <p style={{ marginTop: 12, color: '#64748b' }}>
                    Chưa có danh sách bác sĩ riêng cho khoa này. Bạn có thể chọn đặt khám theo Bác sĩ Chuyên khoa trực ca!
                  </p>
                  <Button
                    type="primary"
                    style={{ backgroundColor: '#0284c7' }}
                    onClick={() => {
                      if (!ensureAuthenticated('chọn bác sĩ trực ca')) return;
                      setSelectedDoctor({
                        id: 'doc-default',
                        name: `BS. Chuyên Khoa ${selectedDept.name}`,
                        department: selectedDept.name,
                        title: 'Bác sĩ Khám & Điều trị',
                        experience: 'Lịch khám theo kíp trực bệnh viện',
                        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
                        rating: 5.0,
                        consultationFee: selectedDept.price || 150000,
                      });
                      setCurrentStep(2);
                    }}
                  >
                    Tiếp tục với Bác sĩ trực ca
                  </Button>
                </div>
              ) : (
                <Row gutter={[16, 16]}>
                  {filteredDoctors.map((doc) => {
                    const isSelected = selectedDoctor?.id === doc.id;
                    return (
                      <Col xs={24} sm={12} md={8} key={doc.id}>
                        <div
                          onClick={() => {
                            if (!ensureAuthenticated('chọn bác sĩ khám')) return;
                            setSelectedDoctor(doc);
                            setCurrentStep(2);
                          }}
                          style={{
                            padding: '20px',
                            borderRadius: 16,
                            border: isSelected ? '2px solid #0284c7' : '1px solid #bae6fd',
                            backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 8px 24px rgba(2, 132, 199, 0.16)' : 'none',
                          }}
                        >
                          <Avatar
                            src={doc.avatar}
                            size={72}
                            style={{
                              border: '3px solid #0284c7',
                              marginBottom: 12,
                              backgroundColor: '#e0f2fe',
                            }}
                          />
                          <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{doc.name}</div>
                          <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 600, marginTop: 4 }}>
                            {doc.title}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{doc.experience}</div>
                          <div style={{ marginTop: 14 }}>
                            <Tag color="cyan" style={{ fontWeight: 600 }}>
                              ⭐ {doc.rating} / 5.0 Đánh giá
                            </Tag>
                          </div>
                          <Button
                            type={isSelected ? 'primary' : 'default'}
                            style={{
                              marginTop: 16,
                              borderRadius: 10,
                              fontWeight: 700,
                              backgroundColor: isSelected ? '#0284c7' : undefined,
                              borderColor: '#0284c7',
                              color: isSelected ? '#ffffff' : '#0284c7',
                            }}
                            block
                          >
                            {isSelected ? 'Đã chọn bác sĩ này' : 'Đặt khám với Bác sĩ'}
                          </Button>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              )}

              <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between' }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => setCurrentStep(0)}>
                  Quay lại chọn Khoa
                </Button>
                {selectedDoctor && (
                  <Button
                    type="primary"
                    icon={<ArrowRightOutlined />}
                    style={{ backgroundColor: '#0284c7' }}
                    onClick={() => setCurrentStep(2)}
                  >
                    Tiếp tục chọn Giờ khám
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 2: CHỌN NGÀY & KHUNG GIỜ ================= */}
          {currentStep === 2 && (
            <div>
              <div style={{ marginBottom: 24, textAlign: 'center' }}>
                <Title level={3} style={{ color: '#0369a1', fontWeight: 800, margin: 0 }}>
                  Bước 3: Chọn Ngày Khám & Khung Giờ
                </Title>
                <Text style={{ color: '#64748b', fontSize: 14 }}>
                  Số lượng khám được đồng bộ trực tiếp với hệ thống kiểm soát tải của Bệnh viện
                </Text>
              </div>

              {/* Date Selection Box */}
              <div
                className="booking-date-container"
                style={{
                  maxWidth: 500,
                  margin: '0 auto 28px',
                  padding: 16,
                  borderRadius: 14,
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CalendarOutlined style={{ color: '#0284c7', fontSize: 22 }} />
                  <div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Ngày khám bệnh:</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0369a1' }}>
                      {dayjs(selectedDate).format('DD/MM/YYYY')} (Thứ {dayjs(selectedDate).day() === 0 ? 'Chủ Nhật' : dayjs(selectedDate).day() + 1})
                    </div>
                  </div>
                </div>

                <DatePicker
                  value={dayjs(selectedDate)}
                  onChange={(date) => {
                    if (date) setSelectedDate(date.format('YYYY-MM-DD'));
                  }}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                  allowClear={false}
                  format="DD/MM/YYYY"
                  style={{ borderRadius: 8 }}
                />
              </div>

              {/* Time Slots Grid */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                    Khung giờ khám trong ngày:
                  </span>
                  <span style={{ fontSize: 12, color: '#0284c7', fontWeight: 600 }}>
                    💡 Khung giờ bị khóa hoặc hết chỗ sẽ bị vô hiệu hóa
                  </span>
                </div>

                {slotsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Spin size="large" />
                    <p style={{ marginTop: 12, color: '#64748b' }}>Đang kiểm tra tình trạng khung giờ...</p>
                  </div>
                ) : (
                  <Row gutter={[12, 12]}>
                    {slots.map((slot) => {
                      const isSelected = selectedSlot === slot.timeSlot;
                      const isBlocked = slot.isLocked || slot.bookedCount >= slot.maxCapacity;
                      const remaining = slot.maxCapacity - slot.bookedCount;

                      return (
                        <Col xs={12} sm={8} md={6} lg={4} key={slot.id}>
                          <div
                            onClick={() => {
                              if (!ensureAuthenticated('chọn khung giờ khám')) return;
                              if (slot.isLocked) {
                                showToast(`🔒 Khung giờ ${slot.timeSlot} đang bị tạm khóa bởi Bệnh viện!`, 'warning');
                                return;
                              }
                              if (slot.bookedCount >= slot.maxCapacity) {
                                showToast(`⚠️ Khung giờ ${slot.timeSlot} đã đủ số lượng (${slot.bookedCount}/${slot.maxCapacity})!`, 'warning');
                                return;
                              }
                              setSelectedSlot(slot.timeSlot);
                            }}
                            style={{
                              padding: '12px 8px',
                              borderRadius: 12,
                              textAlign: 'center',
                              cursor: isBlocked ? 'not-allowed' : 'pointer',
                              backgroundColor: isBlocked
                                ? '#f1f5f9'
                                : isSelected
                                ? '#0284c7'
                                : '#ffffff',
                              color: isBlocked
                                ? '#94a3b8'
                                : isSelected
                                ? '#ffffff'
                                : '#0f172a',
                              border: isBlocked
                                ? '1px dashed #cbd5e1'
                                : isSelected
                                ? '2px solid #0284c7'
                                : '1px solid #bae6fd',
                              boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 800,
                                fontSize: 13,
                                textDecoration: isBlocked ? 'line-through' : 'none',
                              }}
                            >
                              {slot.timeSlot}
                            </div>
                            <div style={{ marginTop: 4 }}>
                              {slot.isLocked ? (
                                <Tag color="error" style={{ margin: 0, fontSize: 10, fontWeight: 700 }}>
                                  ĐÃ KHÓA
                                </Tag>
                              ) : slot.bookedCount >= slot.maxCapacity ? (
                                <Tag color="warning" style={{ margin: 0, fontSize: 10, fontWeight: 700 }}>
                                  HẾT CHỖ
                                </Tag>
                              ) : (
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: isSelected ? 'rgba(255,255,255,0.9)' : '#0284c7',
                                  }}
                                >
                                  Còn {remaining} chỗ
                                </span>
                              )}
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                )}
              </div>

              {selectedSlot && (
                <Alert
                  type="info"
                  showIcon
                  message={
                    <span>
                      Đã chọn giờ hẹn: <strong>{selectedSlot}</strong> ngày <strong>{dayjs(selectedDate).format('DD/MM/YYYY')}</strong> cùng{' '}
                      <strong>{selectedDoctor?.name || selectedDept.name}</strong>.
                    </span>
                  }
                  style={{ marginBottom: 24, borderRadius: 12 }}
                />
              )}

              <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => setCurrentStep(1)}>
                  Quay lại chọn Bác sĩ
                </Button>
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  style={{ backgroundColor: '#0284c7' }}
                  disabled={!selectedSlot}
                  onClick={() => {
                    if (!ensureAuthenticated('điền thông tin bệnh nhân')) return;
                    setCurrentStep(3);
                  }}
                >
                  Điền thông tin bệnh nhân
                </Button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: THÔNG TIN BỆNH NHÂN & XÁC NHẬN ================= */}
          {currentStep === 3 && (
            <div>
              <div style={{ marginBottom: 24, textAlign: 'center' }}>
                <Title level={3} style={{ color: '#0369a1', fontWeight: 800, margin: 0 }}>
                  Bước 4: Điền Thông Tin Bệnh Nhân & Xác Nhận
                </Title>
                <Text style={{ color: '#64748b', fontSize: 14 }}>
                  Vui lòng điền thông tin chính xác để hệ thống khởi tạo Phiếu Khám Điện Tử & Mã QR
                </Text>
              </div>

              <Row gutter={[24, 24]}>
                {/* Form Input */}
                <Col xs={24} md={14}>
                  {user ? (
                    <div
                      style={{
                        marginBottom: 20,
                        padding: '16px',
                        borderRadius: 14,
                        border: '1.5px solid #bae6fd',
                        backgroundColor: '#f0f9ff',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <SafetyCertificateOutlined style={{ color: '#0284c7', fontSize: 18 }} />
                          <span style={{ fontWeight: 800, color: '#0369a1', fontSize: 14 }}>
                            HỒ SƠ BỆNH NHÂN ĐIỆN TỬ ĐÃ XÁC THỰC
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <Tag color="cyan" style={{ margin: 0, fontWeight: 700 }}>
                            {user.maBenhNhan ? `Mã: ${user.maBenhNhan}` : 'Bệnh nhân'}
                          </Tag>
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            style={{ borderColor: '#bae6fd', color: '#0369a1', fontSize: 12, fontWeight: 600 }}
                            onClick={() => {
                              setCompleteProfileModalOpen(true);
                              setCompleteProfileAllowClose(true);
                            }}
                          >
                            Sửa hồ sơ
                          </Button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px 16px', fontSize: 13, color: '#334155' }}>
                        <div><strong>Họ tên:</strong> {user.hoTen || user.tenDangNhap}</div>
                        <div><strong>Số điện thoại:</strong> {user.soDienThoai}</div>
                        <div><strong>Số CCCD:</strong> {user.soCCCD || 'Chưa cập nhật'}</div>
                        <div><strong>Ngày/Năm sinh:</strong> {user.ngaySinh ? dayjs(user.ngaySinh).format('DD/MM/YYYY') : (user.namSinh || 'Chưa cập nhật')}</div>
                        {user.diaChi && <div style={{ gridColumn: '1 / -1' }}><strong>Địa chỉ:</strong> {user.diaChi}</div>}
                      </div>
                    </div>
                  ) : (
                    <Alert
                      type="warning"
                      showIcon
                      style={{
                        marginBottom: 20,
                        borderRadius: 12,
                        border: '1px solid #fed7aa',
                        backgroundColor: '#fffbeb',
                      }}
                      message={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                          <span style={{ fontWeight: 700, color: '#9a3412' }}>
                            🔒 Yêu cầu Đăng nhập tài khoản Bệnh nhân
                          </span>
                          <Button
                            size="small"
                            type="primary"
                            icon={<LoginOutlined />}
                            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 600 }}
                            onClick={() => navigate('/login?redirect=/booking')}
                          >
                            Đăng nhập ngay
                          </Button>
                        </div>
                      }
                      description="Bạn cần đăng nhập tài khoản Bệnh nhân và hoàn tất hồ sơ để hoàn thành đặt lịch khám và nhận Mã QR."
                    />
                  )}

                  <Form form={form} layout="vertical">
                    <Form.Item
                      name="fullName"
                      label="Họ và tên Bệnh nhân"
                      rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                    >
                      <Input
                        prefix={<UserOutlined style={{ color: '#0284c7' }} />}
                        placeholder="Ví dụ: Nguyễn Văn An"
                        size="large"
                        style={{ borderRadius: 10 }}
                      />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col xs={24} sm={14}>
                        <Form.Item
                          name="phoneNumber"
                          label="Số điện thoại liên hệ"
                          rules={[
                            { required: true, message: 'Vui lòng nhập số điện thoại' },
                            { pattern: /^[0-9]{10}$/, message: 'Số điện thoại gồm 10 chữ số' },
                          ]}
                        >
                          <Input
                            prefix={<PhoneOutlined style={{ color: '#10b981' }} />}
                            placeholder="0912345678"
                            size="large"
                            style={{ borderRadius: 10, fontFamily: 'monospace' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={10}>
                        <Form.Item name="gender" label="Giới tính" initialValue="Nam">
                          <Radio.Group size="large" style={{ width: '100%' }}>
                            <Radio value="Nam">Nam</Radio>
                            <Radio value="Nữ">Nữ</Radio>
                          </Radio.Group>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="birthYear"
                          label="Năm sinh"
                          rules={[{ required: true, message: 'Vui lòng nhập năm sinh' }]}
                        >
                          <Input placeholder="Ví dụ: 1995" size="large" style={{ borderRadius: 10 }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item name="identityNumber" label="Số CCCD hoặc Thẻ BHYT (nếu có)">
                          <Input
                            prefix={<IdcardOutlined style={{ color: '#0284c7' }} />}
                            placeholder="07909200xxxx"
                            size="large"
                            style={{ borderRadius: 10, fontFamily: 'monospace' }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item name="appointmentType" label="Hình thức đăng ký khám" initialValue="New">
                      <Radio.Group size="large" style={{ width: '100%' }}>
                        <Row gutter={12}>
                          <Col xs={24} sm={12}>
                            <Radio.Button
                              value="New"
                              style={{ width: '100%', textAlign: 'center', height: 42, lineHeight: '40px', borderRadius: 8, fontWeight: 700, marginBottom: 8 }}
                            >
                              🩺 Khám Mới
                            </Radio.Button>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Radio.Button
                              value="FollowUp"
                              style={{ width: '100%', textAlign: 'center', height: 42, lineHeight: '40px', borderRadius: 8, fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}
                            >
                              🔄 Tái Khám Định Kỳ
                            </Radio.Button>
                          </Col>
                        </Row>
                      </Radio.Group>
                    </Form.Item>

                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) => prevValues.appointmentType !== currentValues.appointmentType}
                    >
                      {({ getFieldValue }) =>
                        getFieldValue('appointmentType') === 'FollowUp' ? (
                          <div
                            style={{
                              padding: 16,
                              borderRadius: 12,
                              backgroundColor: '#f5f3ff',
                              border: '1px solid #ddd6fe',
                              marginBottom: 16,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#6d28d9', marginBottom: 10 }}>
                              <HistoryOutlined />
                              <span>Thông tin Tái khám theo chỉ định Bác sĩ</span>
                            </div>
                            <Row gutter={12}>
                              <Col xs={24} sm={12}>
                                <Form.Item
                                  name="previousRecordCode"
                                  label="Mã Bệnh Án (EMR) / Mã đơn thuốc trước"
                                  style={{ marginBottom: 8 }}
                                >
                                  <Input
                                    prefix={<HistoryOutlined style={{ color: '#7c3aed' }} />}
                                    placeholder="Ví dụ: EMR2026-0015"
                                    style={{ borderRadius: 8, fontFamily: 'monospace' }}
                                  />
                                </Form.Item>
                              </Col>
                              <Col xs={24} sm={12}>
                                <Form.Item
                                  name="followUpNotes"
                                  label="Lời dặn / Ghi chú tái khám của Bác sĩ"
                                  style={{ marginBottom: 8 }}
                                >
                                  <Input
                                    placeholder="Ví dụ: Tái khám sau 7 ngày"
                                    style={{ borderRadius: 8 }}
                                  />
                                </Form.Item>
                              </Col>
                            </Row>
                          </div>
                        ) : null
                      }
                    </Form.Item>

                    {/* Quyền lợi BHYT Switch */}
                    <div
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#f0f9ff',
                        borderRadius: 12,
                        border: '1.5px solid #bae6fd',
                        marginBottom: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0369a1' }}>
                          <SafetyCertificateOutlined style={{ marginRight: 6 }} /> Áp dụng Bảo hiểm Y tế (BHYT) đúng tuyến
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          Được hỗ trợ giảm trừ trực tiếp <strong>{selectedPackage ? selectedPackage.bhytSupport.toLocaleString('vi-VN') : '42.100'} đ</strong> theo quy định thông tuyến toàn quốc
                        </div>
                      </div>
                      <Switch
                        checked={hasBhyt}
                        onChange={setHasBhyt}
                        checkedChildren="Áp dụng"
                        unCheckedChildren="Tự túc"
                      />
                    </div>

                    {/* Lựa chọn Phương thức Thanh toán Viện phí */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a', marginBottom: 8 }}>
                        Phương thức Thanh toán Viện phí:
                      </div>
                      <Row gutter={[12, 12]}>
                        <Col xs={24} sm={12}>
                          <div
                            className={`payment-method-card ${paymentMethod === 'vietqr' ? 'selected' : ''}`}
                            onClick={() => setPaymentMethod('vietqr')}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <QrcodeOutlined style={{ fontSize: 24, color: '#0284c7' }} />
                              <div>
                                <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>
                                  VietQR / Napas 247
                                </div>
                                <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 600 }}>
                                  Thẻ khám Ưu tiên • Không cần ghé quầy
                                </div>
                              </div>
                            </div>
                            <Radio checked={paymentMethod === 'vietqr'} />
                          </div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <div
                            className={`payment-method-card ${paymentMethod === 'kiosk' ? 'selected' : ''}`}
                            onClick={() => setPaymentMethod('kiosk')}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <CreditCardOutlined style={{ fontSize: 24, color: '#64748b' }} />
                              <div>
                                <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>
                                  Thanh toán tại Viện
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>
                                  Qua Kiosk tự động / Quầy Lễ tân
                                </div>
                              </div>
                            </div>
                            <Radio checked={paymentMethod === 'kiosk'} />
                          </div>
                        </Col>
                      </Row>
                    </div>

                    <Form.Item name="symptoms" label="Lý do khám / Triệu chứng bệnh">
                      <Input.TextArea
                        rows={3}
                        placeholder="Mô tả triệu chứng hiện tại (ví dụ: đau đầu, sốt nhẹ, hoặc tình trạng tiến triển khi tái khám...)"
                        style={{ borderRadius: 10 }}
                      />
                    </Form.Item>
                  </Form>
                </Col>

                {/* Summary Card with Real-time Pricing */}
                <Col xs={24} md={10}>
                  {(() => {
                    const pricing = calculatePricing();
                    return (
                      <div className="booking-summary-card booking-summary-sticky">
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#0369a1', marginBottom: 4 }}>
                          TÓM TẮT PHIẾU KHÁM HẸN
                        </div>

                        {selectedPackage ? (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: '#64748b' }}>Gói khám:</span>
                            <strong style={{ color: '#0284c7' }}>{selectedPackage.name}</strong>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: '#64748b' }}>Chuyên khoa:</span>
                            <strong style={{ color: '#0284c7' }}>{selectedDept.name}</strong>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: '#64748b' }}>Vị trí phòng khám:</span>
                          <span style={{ color: '#334155', fontWeight: 600 }}>{selectedDept.location}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: '#64748b' }}>Bác sĩ khám:</span>
                          <strong style={{ color: '#0f172a' }}>{selectedDoctor?.name || 'BS. Trực ca'}</strong>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: '#64748b' }}>Ngày khám:</span>
                          <strong style={{ color: '#0369a1' }}>
                            {dayjs(selectedDate).format('DD/MM/YYYY')}
                          </strong>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: '#64748b' }}>Khung giờ hẹn:</span>
                          <Tag color="cyan" style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>
                            {selectedSlot}
                          </Tag>
                        </div>

                        <Divider style={{ margin: '8px 0' }} />

                        {/* Chi tiết Viện phí */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: '#64748b' }}>Giá niêm yết:</span>
                          <span>{pricing.basePrice.toLocaleString('vi-VN')} đ</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: '#64748b' }}>Hỗ trợ BHYT:</span>
                          <span style={{ color: hasBhyt ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>
                            {hasBhyt ? `-${pricing.effectiveBhyt.toLocaleString('vi-VN')} đ` : '0 đ (Chưa áp dụng)'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: '#64748b' }}>Hình thức thanh toán:</span>
                          <span style={{ color: '#0284c7', fontWeight: 600 }}>
                            {paymentMethod === 'vietqr' ? 'VietQR Online (Ưu tiên)' : 'Kiosk tại viện'}
                          </span>
                        </div>

                        <Divider style={{ margin: '8px 0' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ color: '#0f172a', fontWeight: 700, fontSize: 14 }}>TỔNG TIỀN TẠM TÍNH:</span>
                          <span style={{ color: '#0284c7', fontWeight: 900, fontSize: 20 }}>
                            {pricing.finalTotal.toLocaleString('vi-VN')} VNĐ
                          </span>
                        </div>

                        <div
                          style={{
                            padding: 10,
                            backgroundColor: '#ffffff',
                            borderRadius: 10,
                            border: '1px dashed #bae6fd',
                            fontSize: 11.5,
                            color: '#0369a1',
                            lineHeight: 1.4,
                          }}
                        >
                          {paymentMethod === 'vietqr' ? (
                            <span>⚡ Thanh toán trực tuyến qua VietQR được cấp <strong>Thẻ Khám Ưu Tiên</strong>. Đến viện vào thẳng buồng khám theo giờ hẹn!</span>
                          ) : (
                            <span>ℹ️ Sau khi đặt thành công, hệ thống cấp <strong>Mã QR Tiếp Nhận</strong>. Quý khách quét QR tại Kiosk sảnh A để thanh toán và nhận số phòng.</span>
                          )}
                        </div>

                        <Button
                          type="primary"
                          size="large"
                          style={{
                            backgroundColor: '#0284c7',
                            borderColor: '#0284c7',
                            fontWeight: 800,
                            height: 48,
                            borderRadius: 12,
                            marginTop: 10,
                            boxShadow: '0 6px 18px rgba(2, 132, 199, 0.3)',
                          }}
                          loading={bookingLoading}
                          onClick={handleCompleteBooking}
                          block
                        >
                          XÁC NHẬN ĐẶT LỊCH NGAY
                        </Button>
                      </div>
                    );
                  })()}
                </Col>
              </Row>

              <div style={{ marginTop: 24 }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => setCurrentStep(2)}>
                  Quay lại đổi giờ khám
                </Button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: ĐẶT KHÁM THÀNH CÔNG & PHIẾU QR ================= */}
          {currentStep === 4 && createdAppointment && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircleOutlined />
              </div>

              <Title level={2} style={{ color: '#0369a1', fontWeight: 900, margin: '0 0 8px' }}>
                ĐẶT LỊCH KHÁM THÀNH CÔNG!
              </Title>
              <Paragraph style={{ color: '#64748b', fontSize: 14, maxWidth: 550, margin: '0 auto 24px' }}>
                Cảm ơn bạn đã tin tưởng Hệ thống Y tế D-Medical. Dưới đây là <strong>Phiếu Khám Điện Tử & Mã QR Check-in</strong> của bạn.
              </Paragraph>

              {/* Printable Medical QR Ticket Card */}
              <div
                id="qr-ticket-card"
                className="qr-ticket-wrapper"
              >
                <div style={{ marginBottom: 12 }}>
                  <img
                    src="/logo.png"
                    alt="Bệnh viện Đa khoa D-Medical"
                    style={{ height: 46, objectFit: 'contain' }}
                  />
                </div>
                {createdAppointment.appointmentType === 'FollowUp' ? (
                  <Tag color="purple" style={{ fontSize: 12, padding: '4px 14px', borderRadius: 20, fontWeight: 800 }}>
                    🔄 PHIẾU HẸN TÁI KHÁM ĐỊNH KỲ • CHECK-IN QR
                  </Tag>
                ) : (
                  <Tag color="cyan" style={{ fontSize: 12, padding: '4px 14px', borderRadius: 20, fontWeight: 800 }}>
                    PHIẾU KHÁM ĐIỆN TỬ • CHECK-IN QR
                  </Tag>
                )}
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, marginBottom: 16 }}>
                  (Tiếp nhận thông minh tại Kiosk & Quầy tiếp đón qua Mã QR)
                </div>

                {/* QR Code */}
                <div
                  style={{
                    display: 'inline-block',
                    padding: 16,
                    backgroundColor: '#ffffff',
                    borderRadius: 16,
                    border: '2px solid #bae6fd',
                    margin: '8px 0 12px',
                  }}
                >
                  <QRCodeSVG
                    value={createdAppointment.qrCode || `MEDQR|${createdAppointment.id}|${createdAppointment.patientCode}`}
                    size={190}
                    level="H"
                    fgColor="#0369a1"
                  />
                </div>

                <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 15, color: '#0284c7' }}>
                  {createdAppointment.id.toUpperCase()}
                </div>

                <Divider style={{ margin: '16px 0' }} />

                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ color: '#64748b' }}>Bệnh nhân:</span>
                    <strong style={{ color: '#0f172a' }}>{createdAppointment.patientName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ color: '#64748b' }}>Mã Bệnh Nhân:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                      {createdAppointment.patientCode}
                    </span>
                  </div>
                  {selectedPackage && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                      <span style={{ color: '#64748b' }}>Gói khám đã chọn:</span>
                      <strong style={{ color: '#0284c7' }}>{selectedPackage.name}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ color: '#64748b' }}>Chuyên khoa:</span>
                    <strong style={{ color: '#0284c7' }}>{createdAppointment.departmentName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ color: '#64748b' }}>Bác sĩ phụ trách:</span>
                    <span>{createdAppointment.doctorName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ color: '#64748b' }}>Ngày & Giờ khám:</span>
                    <strong style={{ color: '#0369a1' }}>
                      {createdAppointment.appointmentTime} • {createdAppointment.appointmentDate}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ color: '#64748b' }}>Hình thức thanh toán:</span>
                    <span>
                      <Tag color={paymentMethod === 'vietqr' ? 'cyan' : 'default'} style={{ fontWeight: 600 }}>
                        {paymentMethod === 'vietqr' ? '💳 VietQR Napas247' : '🏥 Kiosk / Quầy tiếp nhận'}
                      </Tag>
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                    <span style={{ color: '#64748b' }}>Tạm tính viện phí:</span>
                    <span style={{ fontWeight: 800, color: '#0284c7' }}>
                      {calculatePricing().finalTotal.toLocaleString('vi-VN')} đ
                      {hasBhyt && (
                        <Tag color="green" style={{ marginLeft: 6, fontSize: 10.5 }}>
                          Đã trừ BHYT
                        </Tag>
                      )}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 18,
                    padding: '12px 14px',
                    borderRadius: 10,
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    fontSize: 12.5,
                    color: '#0369a1',
                    textAlign: 'left',
                    lineHeight: 1.6,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ThunderboltOutlined style={{ color: '#0284c7' }} /> Hướng dẫn check-in & Lưu ý y tế:
                  </div>
                  <div>
                    • Khi đến bệnh viện trước 15 phút, quý khách đưa màn hình có <strong>Mã QR này</strong> vào máy quét tại Kiosk hoặc Quầy tiếp tân để vào thẳng phòng khám.
                  </div>
                  {selectedPackage && (
                    <div style={{ marginTop: 4, color: '#b91c1c' }}>
                      • <strong>Lưu ý gói khám:</strong> Vui lòng nhịn ăn sáng từ 6 - 8 tiếng trước giờ khám nếu có thực hiện xét nghiệm máu hoặc nội soi tiêu hóa.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="ticket-action-btns" style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Button
                  icon={<PrinterOutlined />}
                  size="large"
                  onClick={() => window.print()}
                  style={{ fontWeight: 600, borderRadius: 10 }}
                >
                  In Phiếu Khám QR
                </Button>

                {createdAppointment.status !== 'Cancelled' && createdAppointment.status !== 'Completed' && (
                  <>
                    <Button
                      icon={<SwapOutlined />}
                      size="large"
                      style={{ borderColor: '#0284c7', color: '#0284c7', fontWeight: 700, borderRadius: 10 }}
                      onClick={() => handleOpenReschedule(createdAppointment)}
                    >
                      Đổi Giờ Khám
                    </Button>
                    <Button
                      danger
                      icon={<CloseCircleOutlined />}
                      size="large"
                      style={{ fontWeight: 700, borderRadius: 10 }}
                      onClick={() => handleOpenCancel(createdAppointment)}
                    >
                      Hủy Lịch Hẹn
                    </Button>
                  </>
                )}

                <Button
                  type="primary"
                  size="large"
                  icon={<ReloadOutlined />}
                  style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 700, borderRadius: 10 }}
                  onClick={handleResetBooking}
                >
                  Đăng Ký Lịch Khám Mới
                </Button>
                <Button
                  size="large"
                  icon={<SearchOutlined />}
                  onClick={() => setLookupModalOpen(true)}
                  style={{ fontWeight: 600, borderRadius: 10 }}
                >
                  Tra Cứu Lịch Hẹn
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>

      {/* KHỐI QUY TRÌNH TIẾP NHẬN BỆNH NHÂN 3 BƯỚC KHÔNG CHỜ ĐỢI */}
      <section className="patient-journey-wrap" style={{ maxWidth: 1200, margin: '36px auto 30px', padding: '32px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Tag color="cyan" style={{ fontSize: 13, fontWeight: 700, padding: '4px 14px', borderRadius: 20 }}>
            HỆ THỐNG Y TẾ THÔNG MINH
          </Tag>
          <Title level={2} style={{ color: '#0f172a', fontWeight: 800, marginTop: 10, marginBottom: 6 }}>
            Quy Trình Khám Bệnh 3 Bước Nhanh Chóng & Tiện Lợi
          </Title>
          <Paragraph style={{ color: '#64748b', fontSize: 14, maxWidth: 650, margin: '0 auto' }}>
            Ứng dụng công nghệ Tiếp nhận QR Code thông minh giúp giảm 90% thời gian bốc số chờ đợi, chủ động chọn chuyên khoa và bác sĩ theo nhu cầu.
          </Paragraph>
        </div>

        <Row gutter={[20, 20]}>
          <Col xs={24} md={8}>
            <div className="patient-journey-step">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="step-badge-num">1</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0369a1' }}>Đặt Lịch & Bác Sĩ</div>
              </div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginTop: 4 }}>
                Chọn Chuyên khoa, Bác sĩ chuyên gia hoặc Gói khám sức khỏe. Đặt ngày và khung giờ khám mong muốn chỉ với vài thao tác.
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div className="patient-journey-step">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="step-badge-num">2</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0369a1' }}>Quét QR Check-in</div>
              </div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginTop: 4 }}>
                Nhận Phiếu Khám QR điện tử ngay lập tức. Đến bệnh viện trước 15 phút, quét QR tại Kiosk thông minh hoặc Quầy tiếp nhận.
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div className="patient-journey-step">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="step-badge-num">3</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0369a1' }}>Vào Thẳng Phòng Khám</div>
              </div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginTop: 4 }}>
                Hệ thống điều phối tự động đưa thông tin vào phòng khám chuyên khoa. Bác sĩ tiếp nhận thăm khám chu đáo đúng giờ hẹn.
              </div>
            </div>
          </Col>
        </Row>
      </section>

      {/* KHỐI CÂU HỎI THƯỜNG GẶP (FAQ) */}
      <section style={{ maxWidth: 1200, margin: '0 auto 48px', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Tag color="blue" style={{ fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>
            HỖ TRỢ BỆNH NHÂN
          </Tag>
          <Title level={2} style={{ color: '#0f172a', fontWeight: 800, marginTop: 10, marginBottom: 6 }}>
            Câu Hỏi Thường Gặp Khi Đặt Lịch Trực Tuyến
          </Title>
          <Paragraph style={{ color: '#64748b', fontSize: 14 }}>
            Giải đáp nhanh các thắc mắc về thẻ BHYT, quy trình check-in và đổi hủy lịch hẹn.
          </Paragraph>
        </div>

        <Collapse
          defaultActiveKey={['faq-1', 'faq-2']}
          size="large"
          style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #bae6fd' }}
          items={[
            {
              key: 'faq-1',
              label: (
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>
                  1. Tôi có được hưởng quyền lợi Bảo hiểm Y tế (BHYT) khi đặt lịch trực tuyến không?
                </span>
              ),
              children: (
                <div style={{ color: '#475569', lineHeight: 1.7, fontSize: 13.5 }}>
                  <strong>Hoàn toàn có!</strong> Khi đặt lịch khám trực tuyến, quý khách tích chọn "Có áp dụng thẻ BHYT". Khi đến bệnh viện quét mã QR check-in tại Kiosk hoặc Quầy tiếp tân, quý khách vui lòng xuất trình Thẻ BHYT giấy hoặc ứng dụng VssID / VNeID định danh mức 2 để nhân viên y tế đối soát và áp dụng mức giảm trừ BHYT theo đúng quy định hiện hành của Bộ Y Tế.
                </div>
              ),
            },
            {
              key: 'faq-2',
              label: (
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>
                  2. Sau khi đặt lịch thành công, tôi cần làm gì khi đến bệnh viện?
                </span>
              ),
              children: (
                <div style={{ color: '#475569', lineHeight: 1.7, fontSize: 13.5 }}>
                  Sau khi hoàn tất đăng ký, màn hình sẽ hiển thị <strong>Phiếu Khám Điện Tử chứa Mã QR định danh</strong> (đồng thời lưu trong mục "Tra cứu lịch hẹn" của số điện thoại quý khách). Quý khách chỉ cần có mặt tại bệnh viện trước giờ hẹn khoảng 10 - 15 phút, đưa mã QR vào máy quét tại <strong>Kiosk Tự Động</strong> hoặc Quầy Tiếp Đón để hoàn tất thủ tục vào thẳng phòng khám.
                </div>
              ),
            },
            {
              key: 'faq-3',
              label: (
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>
                  3. Tôi có thể đổi giờ khám hoặc hủy lịch hẹn đã đăng ký không?
                </span>
              ),
              children: (
                <div style={{ color: '#475569', lineHeight: 1.7, fontSize: 13.5 }}>
                  Quý khách có thể chủ động Đổi khung giờ khám hoặc Hủy lịch hẹn bất kỳ lúc nào hoàn toàn miễn phí. Bấm vào nút <strong>"Tra cứu lịch hẹn"</strong> ở đầu trang, nhập số điện thoại hoặc mã phiếu để xem danh sách lịch khám và bấm "Đổi giờ khám" hoặc "Hủy lịch hẹn". Suất khám sẽ được tự động hoàn lại cho các bệnh nhân khác.
                </div>
              ),
            },
            {
              key: 'faq-4',
              label: (
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>
                  4. Nếu tôi đến muộn so với khung giờ hẹn thì lịch khám có bị hủy không?
                </span>
              ),
              children: (
                <div style={{ color: '#475569', lineHeight: 1.7, fontSize: 13.5 }}>
                  Nếu quý khách đến trễ trong vòng 30 phút so với giờ hẹn, hệ thống vẫn giữ chỗ và sắp xếp quý khách vào lượt khám ưu tiên tiếp theo ngay sau bệnh nhân đang khám. Nếu trễ quá 30 phút, vui lòng liên hệ nhân viên Tiếp tân tại Quầy để được hỗ trợ chuyển sang khung giờ khám gần nhất còn trống trong ngày.
                </div>
              ),
            },
          ]}
        />
      </section>

      {/* MODAL TRA CỨU LỊCH HẸN & XEM LẠI MÃ QR */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0369a1', fontSize: 16 }}>
            <SearchOutlined />
            <span>Tra Cứu & Quản Lý Lịch Hẹn Khám Bệnh</span>
          </div>
        }
        open={lookupModalOpen}
        onCancel={() => setLookupModalOpen(false)}
        footer={null}
        width={620}
        style={{ maxWidth: '95vw', margin: '16px auto' }}
        styles={{ body: { maxHeight: '78vh', overflowY: 'auto' } }}
        centered
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
            Nhập số điện thoại đã đăng ký hoặc Mã phiếu hẹn để kiểm tra thông tin, xuất trình Mã QR hoặc Đổi/Hủy lịch hẹn:
          </p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <Input
              size="large"
              placeholder="Nhập SĐT (0987...) hoặc Mã phiếu (apt-...)"
              value={lookupPhone}
              onChange={(e) => setLookupPhone(e.target.value)}
              onPressEnter={handleLookup}
              prefix={<SearchOutlined style={{ color: '#0284c7' }} />}
              style={{ borderRadius: 10 }}
            />
            <Button
              type="primary"
              size="large"
              onClick={handleLookup}
              loading={lookupLoading}
              style={{ backgroundColor: '#0284c7', fontWeight: 600, borderRadius: 10 }}
            >
              Tìm kiếm
            </Button>
          </div>

          {lookupResults.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 8, paddingBottom: 6 }}>
                <Button
                  size="small"
                  type={lookupTypeFilter === 'ALL' ? 'primary' : 'default'}
                  onClick={() => setLookupTypeFilter('ALL')}
                  style={{
                    borderRadius: 16,
                    fontWeight: 600,
                    backgroundColor: lookupTypeFilter === 'ALL' ? '#0284c7' : undefined,
                  }}
                >
                  Tất cả ({lookupResults.length})
                </Button>
                <Button
                  size="small"
                  type={lookupTypeFilter === 'New' ? 'primary' : 'default'}
                  onClick={() => setLookupTypeFilter('New')}
                  style={{
                    borderRadius: 16,
                    fontWeight: 600,
                    backgroundColor: lookupTypeFilter === 'New' ? '#0284c7' : undefined,
                  }}
                >
                  Khám Mới ({lookupResults.filter((r) => r.appointmentType !== 'FollowUp' && !r.symptomsReason?.toLowerCase().includes('tái khám')).length})
                </Button>
                <Button
                  size="small"
                  type={lookupTypeFilter === 'FollowUp' ? 'primary' : 'default'}
                  onClick={() => setLookupTypeFilter('FollowUp')}
                  style={{
                    borderRadius: 16,
                    fontWeight: 600,
                    backgroundColor: lookupTypeFilter === 'FollowUp' ? '#7c3aed' : undefined,
                    borderColor: '#7c3aed',
                    color: lookupTypeFilter === 'FollowUp' ? '#ffffff' : '#7c3aed',
                  }}
                >
                  🔄 Lịch Tái Khám ({lookupResults.filter((r) => r.appointmentType === 'FollowUp' || r.symptomsReason?.toLowerCase().includes('tái khám')).length})
                </Button>
              </div>

              {lookupResults
                .filter((item) => {
                  const isFollowUp = item.appointmentType === 'FollowUp' || item.symptomsReason?.toLowerCase().includes('tái khám');
                  if (lookupTypeFilter === 'FollowUp') return isFollowUp;
                  if (lookupTypeFilter === 'New') return !isFollowUp;
                  return true;
                })
                .map((item) => {
                const isCancelled = item.status === 'Cancelled';
                const isCompleted = item.status === 'Completed';
                const isFollowUp = item.appointmentType === 'FollowUp' || item.symptomsReason?.toLowerCase().includes('tái khám');
                const canModify = !isCancelled && !isCompleted;

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: 18,
                      borderRadius: 16,
                      border: isCancelled ? '1px dashed #cbd5e1' : isFollowUp ? '1px solid #ddd6fe' : '1px solid #bae6fd',
                      backgroundColor: isCancelled ? '#f8fafc' : isFollowUp ? '#faf5ff' : '#f0f9ff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      opacity: isCancelled ? 0.8 : 1,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 15 }}>
                            {item.patientName}
                          </span>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#0284c7', fontWeight: 700 }}>
                            ({item.patientCode})
                          </span>
                          {isFollowUp && (
                            <Tag color="purple" style={{ margin: 0, fontWeight: 800, borderRadius: 12 }}>
                              🔄 Tái khám
                            </Tag>
                          )}
                          <Tag
                            color={
                              isCancelled
                                ? 'error'
                                : isCompleted
                                ? 'cyan'
                                : item.status === 'Confirmed'
                                ? 'green'
                                : 'gold'
                            }
                            style={{ margin: 0, fontWeight: 700, borderRadius: 12 }}
                          >
                            {isCancelled
                              ? 'Đã hủy lịch'
                              : isCompleted
                              ? 'Đã tiếp nhận (QR)'
                              : item.status === 'Confirmed'
                              ? 'Đã xác nhận'
                              : 'Chờ duyệt / Tiếp nhận'}
                          </Tag>
                          {item.rescheduledAt && !isCancelled && (
                            <Tag color="cyan" style={{ margin: 0, fontSize: 10, fontWeight: 700, borderRadius: 10 }}>
                              Đã đổi lịch
                            </Tag>
                          )}
                        </div>

                        <div style={{ fontSize: 13, color: isFollowUp ? '#7c3aed' : '#0284c7', fontWeight: 700, marginTop: 4 }}>
                          {item.departmentName} • {item.doctorName}
                        </div>

                        <div style={{ fontSize: 12.5, color: '#334155', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ClockCircleOutlined style={{ color: '#0284c7' }} />
                          <span>
                            Khám lúc: <strong>{item.appointmentTime}</strong> ngày <strong>{dayjs(item.appointmentDate).format('DD/MM/YYYY')}</strong>
                          </span>
                        </div>

                        {item.previousRecordCode && (
                          <div style={{ fontSize: 12, color: '#7c3aed', marginTop: 3, fontWeight: 600 }}>
                            📁 Hồ sơ khám trước: {item.previousRecordCode}
                          </div>
                        )}

                        {item.symptomsReason && (
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                            Lý do: {item.symptomsReason}
                          </div>
                        )}

                        {isCancelled && item.cancelReason && (
                          <div style={{ marginTop: 6, fontSize: 12, color: '#ef4444', fontStyle: 'italic', backgroundColor: '#fef2f2', padding: '4px 8px', borderRadius: 6 }}>
                            ⚠️ Lý do hủy: {item.cancelReason}
                          </div>
                        )}
                      </div>

                      {/* QR Mini Display */}
                      {!isCancelled && (
                        <div style={{ textAlign: 'center', flexShrink: 0 }}>
                          <div
                            style={{
                              padding: 6,
                              backgroundColor: '#ffffff',
                              borderRadius: 10,
                              border: '1px solid #bae6fd',
                            }}
                          >
                            <QRCodeSVG
                              value={item.qrCode || `MEDQR|${item.id}|${item.patientCode}`}
                              size={72}
                              level="M"
                              fgColor="#0369a1"
                            />
                          </div>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, fontFamily: 'monospace', fontWeight: 700 }}>
                            {item.id}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons Bar for this appointment */}
                    {canModify && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 8,
                          paddingTop: 10,
                          borderTop: '1px solid rgba(186, 230, 253, 0.7)',
                        }}
                      >
                        <Button
                          size="small"
                          icon={<SwapOutlined />}
                          onClick={() => handleOpenReschedule(item)}
                          style={{
                            borderColor: '#0284c7',
                            color: '#0284c7',
                            fontWeight: 700,
                            borderRadius: 8,
                          }}
                        >
                          Đổi Lịch Khám
                        </Button>
                        <Button
                          size="small"
                          danger
                          icon={<CloseCircleOutlined />}
                          onClick={() => handleOpenCancel(item)}
                          style={{ fontWeight: 700, borderRadius: 8 }}
                        >
                          Hủy Lịch Hẹn
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : lookupPhone && !lookupLoading ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
              Không tìm thấy lịch hẹn phù hợp với thông tin tìm kiếm.
            </div>
          ) : null}
        </div>
      </Modal>

      {/* MODAL ĐỔI LỊCH KHÁM (RESCHEDULE) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0369a1', fontSize: 16 }}>
            <SwapOutlined />
            <span>Đổi Lịch Khám Bệnh - Mã hẹn: {reschedulingAppointment?.id.toUpperCase()}</span>
          </div>
        }
        open={rescheduleModalOpen}
        onCancel={() => setRescheduleModalOpen(false)}
        footer={null}
        width={620}
        style={{ maxWidth: '95vw', margin: '16px auto' }}
        styles={{ body: { maxHeight: '78vh', overflowY: 'auto' } }}
        centered
        destroyOnClose
      >
        {reschedulingAppointment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
            {/* Lịch hẹn hiện tại */}
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 700, color: '#64748b', marginBottom: 6 }}>
                THÔNG TIN LỊCH HẸN ĐANG CẦN ĐỔI:
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Bệnh nhân:</span>
                <strong style={{ color: '#0f172a' }}>{reschedulingAppointment.patientName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ color: '#475569' }}>Chuyên khoa & Bác sĩ:</span>
                <span style={{ color: '#0284c7', fontWeight: 600 }}>
                  {reschedulingAppointment.departmentName} - {reschedulingAppointment.doctorName}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ color: '#475569' }}>Khung giờ hiện tại:</span>
                <span style={{ color: '#ef4444', textDecoration: 'line-through', fontWeight: 700 }}>
                  {reschedulingAppointment.appointmentTime} • ngày {dayjs(reschedulingAppointment.appointmentDate).format('DD/MM/YYYY')}
                </span>
              </div>
            </div>

            {/* Bước 1: Chọn Ngày Mới */}
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6, fontSize: 13.5 }}>
                1. Chọn ngày khám mới:
              </div>
              <DatePicker
                value={dayjs(rescheduleDate)}
                onChange={(date) => {
                  if (date) handleChangeRescheduleDate(date.format('YYYY-MM-DD'));
                }}
                disabledDate={(current) => current && current < dayjs().startOf('day')}
                allowClear={false}
                format="DD/MM/YYYY"
                size="large"
                style={{ width: '100%', borderRadius: 10 }}
              />
            </div>

            {/* Bước 2: Chọn Khung Giờ Mới */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>
                  2. Chọn khung giờ khám mới:
                </span>
                <span style={{ fontSize: 11.5, color: '#0284c7', fontWeight: 600 }}>
                  💡 Chỗ ở khung giờ cũ sẽ được tự động hoàn trả
                </span>
              </div>

              {rescheduleSlotsLoading ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <Spin size="default" />
                  <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>Đang tải số chỗ còn lại...</div>
                </div>
              ) : (
                <Row gutter={[8, 8]}>
                  {rescheduleSlots.map((slot) => {
                    const isSelected = rescheduleSlot === slot.timeSlot;
                    const isBlocked = slot.isLocked || slot.bookedCount >= slot.maxCapacity;
                    const remaining = slot.maxCapacity - slot.bookedCount;

                    return (
                      <Col xs={12} sm={8} key={slot.id}>
                        <div
                          onClick={() => {
                            if (slot.isLocked) {
                              showToast(`Khung giờ ${slot.timeSlot} đang bị khóa!`, 'warning');
                              return;
                            }
                            if (slot.bookedCount >= slot.maxCapacity) {
                              showToast(`Khung giờ ${slot.timeSlot} đã hết chỗ!`, 'warning');
                              return;
                            }
                            setRescheduleSlot(slot.timeSlot);
                          }}
                          style={{
                            padding: '10px 6px',
                            borderRadius: 10,
                            textAlign: 'center',
                            cursor: isBlocked ? 'not-allowed' : 'pointer',
                            backgroundColor: isBlocked
                              ? '#f1f5f9'
                              : isSelected
                              ? '#0284c7'
                              : '#ffffff',
                            color: isBlocked ? '#94a3b8' : isSelected ? '#ffffff' : '#0f172a',
                            border: isBlocked
                              ? '1px dashed #cbd5e1'
                              : isSelected
                              ? '2px solid #0284c7'
                              : '1px solid #bae6fd',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: 12.5, textDecoration: isBlocked ? 'line-through' : 'none' }}>
                            {slot.timeSlot}
                          </div>
                          <div style={{ marginTop: 3 }}>
                            {slot.isLocked ? (
                              <Tag color="error" style={{ margin: 0, fontSize: 9.5, fontWeight: 700 }}>
                                ĐÃ KHÓA
                              </Tag>
                            ) : slot.bookedCount >= slot.maxCapacity ? (
                              <Tag color="warning" style={{ margin: 0, fontSize: 9.5, fontWeight: 700 }}>
                                HẾT CHỖ
                              </Tag>
                            ) : (
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 600,
                                  color: isSelected ? 'rgba(255,255,255,0.9)' : '#0284c7',
                                }}
                              >
                                Còn {remaining} chỗ
                              </span>
                            )}
                          </div>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              )}
            </div>

            {/* Bước 3: Lý do đổi lịch */}
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6, fontSize: 13.5 }}>
                3. Lý do đổi lịch (không bắt buộc):
              </div>
              <Input
                placeholder="Ví dụ: Bận việc gia đình, thay đổi kế hoạch làm việc..."
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                style={{ borderRadius: 8 }}
              />
            </div>

            {/* Thao tác */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <Button onClick={() => setRescheduleModalOpen(false)}>Hủy bỏ</Button>
              <Button
                type="primary"
                style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 700 }}
                loading={rescheduleSubmitting}
                disabled={!rescheduleSlot}
                onClick={handleConfirmReschedule}
              >
                Xác Nhận Đổi Lịch
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL HỦY LỊCH HẸN (CANCEL) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontSize: 16 }}>
            <CloseCircleOutlined />
            <span>Xác Nhận Hủy Lịch Khám Bệnh</span>
          </div>
        }
        open={cancelModalOpen}
        onCancel={() => setCancelModalOpen(false)}
        footer={null}
        width={500}
        style={{ maxWidth: '95vw', margin: '16px auto' }}
        styles={{ body: { maxHeight: '78vh', overflowY: 'auto' } }}
        centered
        destroyOnClose
      >
        {cancellingAppointment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 6 }}>
            <Alert
              type="warning"
              showIcon
              message={
                <span>
                  Bạn có chắc muốn hủy lịch hẹn của bệnh nhân <strong>{cancellingAppointment.patientName}</strong>?
                </span>
              }
              description={
                <span>
                  Khám tại <strong>{cancellingAppointment.departmentName}</strong> lúc{' '}
                  <strong>{cancellingAppointment.appointmentTime}</strong> ngày{' '}
                  <strong>{dayjs(cancellingAppointment.appointmentDate).format('DD/MM/YYYY')}</strong>.
                </span>
              }
              style={{ borderRadius: 10 }}
            />

            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 8, fontSize: 13 }}>
                Vui lòng chọn lý do hủy lịch:
              </div>
              <Radio.Group
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <Radio value="Bận việc đột xuất không thể đến khám">Bận việc đột xuất không thể đến khám</Radio>
                <Radio value="Tình trạng sức khỏe đã thuyên giảm / ổn định">Tình trạng sức khỏe đã thuyên giảm / ổn định</Radio>
                <Radio value="Muốn đặt lại vào thời điểm hoặc chuyên khoa khác">Muốn đặt lại vào thời điểm hoặc chuyên khoa khác</Radio>
                <Radio value="Khác">Lý do khác...</Radio>
              </Radio.Group>

              {cancelReason === 'Khác' && (
                <Input.TextArea
                  rows={2}
                  placeholder="Nhập lý do hủy cụ thể..."
                  value={cancelCustomReason}
                  onChange={(e) => setCancelCustomReason(e.target.value)}
                  style={{ marginTop: 8, borderRadius: 8 }}
                />
              )}
            </div>

            <div
              style={{
                fontSize: 11.5,
                color: '#64748b',
                padding: 10,
                backgroundColor: '#f8fafc',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
              }}
            >
              ℹ️ <strong>Chính sách:</strong> Sau khi xác nhận hủy, khung giờ khám này sẽ được tự động giải phóng và hoàn trả lại số chỗ cho hệ thống.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <Button onClick={() => setCancelModalOpen(false)}>Giữ Lại Lịch Hẹn</Button>
              <Button
                danger
                type="primary"
                loading={cancelSubmitting}
                onClick={handleConfirmCancel}
                style={{ fontWeight: 700 }}
              >
                Xác Nhận Hủy Lịch
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL YÊU CẦU ĐĂNG NHẬP (REQUIRE LOGIN) */}
      <RequireLoginModal
        open={requireLoginModalOpen}
        onCancel={() => setRequireLoginModalOpen(false)}
        actionTitle={requireLoginActionTitle}
        redirectPath="/booking"
      />

      {/* MODAL HOÀN TẤT THÔNG TIN BỆNH NHÂN (COMPLETE PATIENT PROFILE) */}
      <CompleteProfileModal
        open={completeProfileModalOpen}
        allowClose={completeProfileAllowClose}
        onCancel={() => setCompleteProfileModalOpen(false)}
        onSuccess={(updated) => {
          setCompleteProfileModalOpen(false);
          form.setFieldsValue({
            fullName: updated.hoTen,
            phoneNumber: updated.soDienThoai,
            gender: updated.gioiTinh || 'Nam',
            birthYear: updated.namSinh || (updated.ngaySinh ? dayjs(updated.ngaySinh).year() : ''),
            identityNumber: updated.soCCCD || '',
          });
        }}
      />

      {/* MODAL TRỢ LÝ AI Y TẾ TƯ VẤN (AI CLINICAL TRIAGE DRAWER) */}
      <AIChatDrawer
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
      />

      {/* Reusable Medical Portal Footer */}
      <PatientPortalFooter />
    </div>
  );
};

export default PatientBookingPage;
