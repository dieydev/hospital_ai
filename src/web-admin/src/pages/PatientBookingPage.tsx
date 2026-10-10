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
  HomeOutlined,
  ReloadOutlined,
  LoginOutlined,
  LogoutOutlined,
  BookOutlined,
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

const { Title, Text, Paragraph } = Typography;

// Danh mục Chuyên khoa
interface DepartmentOption {
  id: string;
  name: string;
  description: string;
  location: string;
  iconBg: string;
}

const DEPARTMENTS_CATALOG: DepartmentOption[] = [
  {
    id: 'dept-noi',
    name: 'Khoa Nội Tổng Hợp',
    description: 'Khám và điều trị các bệnh lý nội khoa, tăng huyết áp, tiểu đường, hô hấp',
    location: 'Phòng 102 - Tầng 1 Khu A',
    iconBg: '#0284c7',
  },
  {
    id: 'dept-tieu-hoa',
    name: 'Khoa Tiêu Hóa',
    description: 'Chuyên sâu dạ dày, đại tràng, gan mật, nội soi tiêu hóa công nghệ cao',
    location: 'Phòng 201 - Tầng 2 Khu B',
    iconBg: '#0369a1',
  },
  {
    id: 'dept-tim-mach',
    name: 'Khoa Tim Mạch',
    description: 'Siêu âm tim Doppler màu, chẩn đoán suy tim, bệnh mạch vành, rối loạn nhịp',
    location: 'Phòng 301 - Tầng 3 Khu A',
    iconBg: '#e11d48',
  },
  {
    id: 'dept-nhi',
    name: 'Khoa Nhi',
    description: 'Khám nhi khoa tổng quát, hô hấp trẻ em, dinh dưỡng và tiêm chủng',
    location: 'Phòng 105 - Tầng 1 Khu B',
    iconBg: '#10b981',
  },
  {
    id: 'dept-mat',
    name: 'Khoa Mắt',
    description: 'Khúc xạ thị giác, phẫu thuật Phaco, điều trị đục thủy tinh thể và cườm mắt',
    location: 'Phòng 205 - Tầng 2 Khu A',
    iconBg: '#8b5cf6',
  },
  {
    id: 'dept-tai-mui-hong',
    name: 'Khoa Tai Mũi Họng',
    description: 'Nội soi vi phẫu tai mũi họng, điều trị viêm xoang, amidan bằng sóng cao tần',
    location: 'Phòng 208 - Tầng 2 Khu B',
    iconBg: '#f59e0b',
  },
  {
    id: 'dept-ngoai',
    name: 'Khoa Ngoại Tổng Quát',
    description: 'Tiểu phẫu, phẫu thuật nội soi ngoại khoa tiêu hóa, vết thương chấn thương',
    location: 'Phòng 401 - Tầng 4 Khu A',
    iconBg: '#0284c7',
  },
  {
    id: 'dept-rang-ham-mat',
    name: 'Khoa Răng Hàm Mặt',
    description: 'Nha khoa thẩm mỹ, nhổ răng khôn không đau, cấy ghép Implant kỹ thuật số',
    location: 'Phòng 108 - Tầng 1 Khu C',
    iconBg: '#0ea5e9',
  },
  {
    id: 'dept-da-lieu',
    name: 'Khoa Da Liễu',
    description: 'Chăm sóc và điều trị mụn, nám, viêm da cơ địa, laser thẩm mỹ chuẩn y khoa',
    location: 'Phòng 305 - Tầng 3 Khu B',
    iconBg: '#ec4899',
  },
];

// Danh mục Bác sĩ
interface DoctorOption {
  id: string;
  name: string;
  department: string;
  title: string;
  experience: string;
  avatar: string;
  rating: number;
}

const DOCTORS_CATALOG: DoctorOption[] = [
  {
    id: 'doc-01',
    name: 'BS. CKII. Nguyễn Thanh Duy',
    department: 'Khoa Nội Tổng Hợp',
    title: 'Trưởng Khoa Nội • Bác sĩ chuyên khoa II',
    experience: '15 năm kinh nghiệm BV Chợ Rẫy',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DuyDoctor',
    rating: 4.9,
  },
  {
    id: 'doc-02',
    name: 'ThS. BS. Trần Thị Thu Hà',
    department: 'Khoa Nội Tổng Hợp',
    title: 'Thạc sĩ Y học • Chuyên khoa Nội',
    experience: '8 năm kinh nghiệm Nội tim mạch',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HaDoctor',
    rating: 4.8,
  },
  {
    id: 'doc-03',
    name: 'BS. CKII. Đinh Khắc Vương',
    department: 'Khoa Tiêu Hóa',
    title: 'Trưởng Khoa Tiêu Hóa • Bác sĩ CKII',
    experience: '16 năm kinh nghiệm Gan Mật & Dạ dày',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=VuongDoctor',
    rating: 5.0,
  },
  {
    id: 'doc-04',
    name: 'BS. Hoàng Lan Anh',
    department: 'Khoa Tiêu Hóa',
    title: 'Bác sĩ Nội soi Tiêu Hóa',
    experience: '7 năm kinh nghiệm Nội soi tiêu hóa',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LanAnhDoctor',
    rating: 4.7,
  },
  {
    id: 'doc-05',
    name: 'TS. BS. Huỳnh Quốc Dũng',
    department: 'Khoa Tim Mạch',
    title: 'Tiến sĩ Y khoa • Viện Tim Mạch',
    experience: '20 năm kinh nghiệm Can thiệp mạch',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DungDoctor',
    rating: 5.0,
  },
  {
    id: 'doc-06',
    name: 'BS. CKI. Vũ Thu Trang',
    department: 'Khoa Tim Mạch',
    title: 'Bác sĩ CKI • Siêu âm Tim',
    experience: '9 năm kinh nghiệm Tăng huyết áp',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TrangDoctor',
    rating: 4.8,
  },
  {
    id: 'doc-07',
    name: 'BS. CKI. Phạm Minh Đức',
    department: 'Khoa Nhi',
    title: 'Trưởng Khoa Nhi • Chuyên gia Sơ sinh',
    experience: '12 năm kinh nghiệm Nhi đồng 1',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DucDoctor',
    rating: 4.9,
  },
  {
    id: 'doc-08',
    name: 'BS. CKII. Lê Văn Tuấn',
    department: 'Khoa Tai Mũi Họng',
    title: 'Trưởng Khoa TMH • Bác sĩ CKII',
    experience: '14 năm kinh nghiệm Vi phẫu tai mũi họng',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TuanDoctor',
    rating: 4.9,
  },
  {
    id: 'doc-09',
    name: 'BS. CKI. Trần Ngọc Mai',
    department: 'Khoa Mắt',
    title: 'Trưởng Khoa Mắt • Phẫu thuật viên Phaco',
    experience: '11 năm kinh nghiệm Bệnh viện Mắt',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MaiDoctor',
    rating: 4.8,
  },
];

export const PatientBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);

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

  // Auto pre-fill thông tin bệnh nhân nếu đã đăng nhập
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        fullName: user.hoTen || user.tenDangNhap,
        phoneNumber: user.soDienThoai || '',
        gender: 'Nam',
      });
    }
  }, [user, form]);

  // Tra cứu lịch hẹn modal
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupResults, setLookupResults] = useState<OnlineAppointmentItem[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Filter doctors by selected department
  const filteredDoctors = DOCTORS_CATALOG.filter((d) => d.department === selectedDept.name);

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
    setSelectedDept(dept);
    const docs = DOCTORS_CATALOG.filter((d) => d.department === dept.name);
    setSelectedDoctor(docs.length > 0 ? docs[0] : null);
    setCurrentStep(1); // Sang bước chọn bác sĩ
  };

  // Handle submit booking
  const handleCompleteBooking = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedSlot) {
        showErrorAlert('Chưa chọn giờ khám', 'Vui lòng quay lại bước 3 để chọn khung giờ khám!');
        setCurrentStep(2);
        return;
      }

      setBookingLoading(true);

      const patientCode = `BN2026${Date.now().toString().slice(-4)}`;
      const appointmentTime = selectedSlot.split(' - ')[0].trim();

      const newApt = await appointmentService.createAppointment({
        patientCode: patientCode,
        patientName: values.fullName.trim(),
        patientPhone: values.phoneNumber.trim(),
        patientGender: values.gender || 'Nam',
        patientAge: values.birthYear ? new Date().getFullYear() - Number(values.birthYear) : 30,
        departmentName: selectedDept.name,
        doctorName: selectedDoctor ? selectedDoctor.name : `BS. Chuyên khoa ${selectedDept.name}`,
        appointmentDate: selectedDate,
        appointmentTime: appointmentTime,
        symptomsReason: values.symptoms ? values.symptoms.trim() : 'Đăng ký đặt lịch khám trực tuyến qua Web Portal',
        sourceApp: 'Web Booking Portal',
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
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #e2e8f0 100%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Top Header Navbar */}
      <header
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #bae6fd',
          boxShadow: '0 4px 20px rgba(2, 132, 199, 0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo & Brand */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            onClick={() => handleResetBooking()}
          >
            <img
              src="/logo.png"
              alt="D-Medical Healthcare Connected"
              style={{
                height: 48,
                maxWidth: 240,
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 8px rgba(2, 132, 199, 0.2))',
              }}
            />
            <div
              style={{
                borderLeft: '1.5px solid #bae6fd',
                paddingLeft: 12,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: '#0369a1',
                  letterSpacing: -0.3,
                  textTransform: 'uppercase',
                }}
              >
                Cổng Đặt Lịch Khám Trực Tuyến
              </div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                Tiếp nhận bằng Mã QR (Bỏ số thứ tự)
              </div>
            </div>
          </div>

          {/* Quick Actions & User Authentication Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 12px',
                    borderRadius: 24,
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                  }}
                >
                  <Avatar
                    src={user.avatarUrl}
                    icon={<UserOutlined />}
                    style={{ backgroundColor: '#0284c7' }}
                  />
                  <div style={{ lineHeight: 1.2 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                      {user.hoTen || user.tenDangNhap}
                    </div>
                    <div>
                      {user.vaiTro?.includes('Admin') ? (
                        <Tag color="red" style={{ margin: 0, fontSize: 10, lineHeight: '16px' }}>
                          Quản trị viên
                        </Tag>
                      ) : user.vaiTro?.includes('Doctor') ? (
                        <Tag color="blue" style={{ margin: 0, fontSize: 10, lineHeight: '16px' }}>
                          Bác sĩ
                        </Tag>
                      ) : (
                        <Tag color="cyan" style={{ margin: 0, fontSize: 10, lineHeight: '16px' }}>
                          Bệnh nhân
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>

                {user.vaiTro?.some((r) => ['Admin', 'Doctor', 'Nurse', 'Receptionist'].includes(r)) ? (
                  <Button
                    type="primary"
                    icon={<HomeOutlined />}
                    style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 600 }}
                    onClick={() => navigate('/dashboard')}
                  >
                    Vào Web Quản Trị
                  </Button>
                ) : (
                  <Button
                    icon={<BookOutlined />}
                    onClick={openPatientAppointments}
                    style={{ borderColor: '#bae6fd', color: '#0369a1', fontWeight: 600 }}
                  >
                    Lịch hẹn của tôi
                  </Button>
                )}

                <Button
                  danger
                  icon={<LogoutOutlined />}
                  onClick={() => {
                    logout();
                    showToast('Đã đăng xuất tài khoản.', 'info');
                    form.resetFields();
                  }}
                  title="Đăng xuất"
                >
                  Đăng xuất
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Button
                  icon={<SearchOutlined />}
                  onClick={() => setLookupModalOpen(true)}
                  style={{ borderColor: '#bae6fd', color: '#0369a1', fontWeight: 600 }}
                >
                  Tra cứu lịch hẹn & QR
                </Button>
                <Button
                  type="primary"
                  icon={<LoginOutlined />}
                  style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 600 }}
                  onClick={() => navigate('/login?redirect=/booking')}
                >
                  Đăng nhập / Đăng ký
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          padding: '40px 20px 48px',
          textAlign: 'center',
          boxShadow: 'inset 0 -10px 20px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 30,
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 16,
              backdropFilter: 'blur(8px)',
            }}
          >
            <SafetyCertificateOutlined style={{ color: '#38bdf8' }} />
            <span>ĐẶT LỊCH NHANH CHÓNG • TIẾP NHẬN BẰNG MÃ QR (BỎ SỐ THỨ TỰ STT)</span>
          </div>

          <Title level={1} style={{ color: '#ffffff', fontWeight: 900, margin: '0 0 12px', fontSize: 32 }}>
            Đăng Ký Khám Bệnh Trực Tuyến 24/7
          </Title>
          <Paragraph style={{ color: '#e0f2fe', fontSize: 15, maxWidth: 650, margin: '0 auto', lineHeight: 1.6 }}>
            Chủ động lựa chọn Chuyên khoa, Bác sĩ và Khung giờ mong muốn. Nhận ngay <strong>Mã QR Phiếu khám</strong> để vào phòng khám trực tiếp mà không cần xếp hàng lấy số thứ tự.
          </Paragraph>
        </div>
      </div>

      {/* Main Booking Container */}
      <main style={{ maxWidth: 1100, margin: '-24px auto 60px', padding: '0 16px' }}>
        <Card
          bordered={false}
          style={{
            borderRadius: 20,
            boxShadow: '0 12px 36px rgba(2, 132, 199, 0.12)',
            border: '1px solid #bae6fd',
            overflow: 'hidden',
          }}
          bodyStyle={{ padding: '32px 28px' }}
        >
          {/* Progress Steps Header */}
          {currentStep < 4 && (
            <div style={{ marginBottom: 36 }}>
              <Steps
                current={currentStep}
                onChange={(step) => {
                  if (step < currentStep) setCurrentStep(step);
                }}
                items={[
                  { title: 'Chuyên khoa', icon: <MedicineBoxOutlined /> },
                  { title: 'Bác sĩ', icon: <UserOutlined /> },
                  { title: 'Ngày & Giờ hẹn', icon: <ClockCircleOutlined /> },
                  { title: 'Thông tin & Xác nhận', icon: <CheckCircleOutlined /> },
                ]}
              />
            </div>
          )}

          {/* ================= STEP 0: CHỌN CHUYÊN KHOA ================= */}
          {currentStep === 0 && (
            <div>
              <div style={{ marginBottom: 24, textAlign: 'center' }}>
                <Title level={3} style={{ color: '#0369a1', fontWeight: 800, margin: 0 }}>
                  Bước 1: Chọn Chuyên Khoa Cần Khám
                </Title>
                <Text style={{ color: '#64748b', fontSize: 14 }}>
                  Quý khách vui lòng chọn phòng khám hoặc chuyên khoa phù hợp với tình trạng sức khỏe
                </Text>
              </div>

              <Row gutter={[16, 16]}>
                {DEPARTMENTS_CATALOG.map((dept) => {
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
                          boxShadow: isSelected ? '0 6px 18px rgba(2, 132, 199, 0.16)' : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 10,
                              backgroundColor: dept.iconBg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontSize: 18,
                            }}
                          >
                            <MedicineBoxOutlined />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>
                              {dept.name}
                            </div>
                            <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 600 }}>
                              {dept.location}
                            </div>
                          </div>
                        </div>

                        <p style={{ fontSize: 12.5, color: '#475569', margin: '0 0 16px', lineHeight: 1.45, flex: 1 }}>
                          {dept.description}
                        </p>

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
                          {isSelected ? 'Đã chọn chuyên khoa này' : 'Chọn khoa này'}
                        </Button>
                      </div>
                    </Col>
                  );
                })}
              </Row>
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
                      setSelectedDoctor({
                        id: 'doc-default',
                        name: `BS. Chuyên Khoa ${selectedDept.name}`,
                        department: selectedDept.name,
                        title: 'Bác sĩ Khám & Điều trị',
                        experience: 'Lịch khám theo kíp trực bệnh viện',
                        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedDept.name}`,
                        rating: 5.0,
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

              <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between' }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => setCurrentStep(1)}>
                  Quay lại chọn Bác sĩ
                </Button>
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  style={{ backgroundColor: '#0284c7' }}
                  disabled={!selectedSlot}
                  onClick={() => setCurrentStep(3)}
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
                    <Alert
                      type="info"
                      showIcon
                      style={{
                        marginBottom: 20,
                        borderRadius: 12,
                        border: '1px solid #bae6fd',
                        backgroundColor: '#f0f9ff',
                      }}
                      message={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                          <span>
                            👤 Đang đặt khám cho tài khoản: <strong>{user.hoTen || user.tenDangNhap}</strong> ({user.soDienThoai})
                          </span>
                          <Tag color="cyan" style={{ margin: 0, fontWeight: 700 }}>
                            Đã xác thực Bệnh nhân
                          </Tag>
                        </div>
                      }
                      description="Họ tên và số điện thoại của bạn đã được điền tự động. Bạn vẫn có thể chỉnh sửa nếu muốn đặt lịch hẹn cho người thân."
                    />
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
                          <span style={{ fontWeight: 600, color: '#9a3412' }}>
                            💡 Đang đặt khám với tư cách Khách vãng lai
                          </span>
                          <Button
                            size="small"
                            type="primary"
                            icon={<LoginOutlined />}
                            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 600 }}
                            onClick={() => navigate('/login?redirect=/booking')}
                          >
                            Đăng nhập / Đăng ký
                          </Button>
                        </div>
                      }
                      description="Đăng nhập hoặc Đăng ký tài khoản Bệnh nhân để tự động lưu hồ sơ, nhận mã QR điện tử và xem lịch sử khám mọi lúc mọi nơi."
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
                      <Col span={14}>
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
                      <Col span={10}>
                        <Form.Item name="gender" label="Giới tính" initialValue="Nam">
                          <Radio.Group size="large">
                            <Radio value="Nam">Nam</Radio>
                            <Radio value="Nữ">Nữ</Radio>
                          </Radio.Group>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="birthYear"
                          label="Năm sinh"
                          rules={[{ required: true, message: 'Vui lòng nhập năm sinh' }]}
                          initialValue="1995"
                        >
                          <Input placeholder="Ví dụ: 1995" size="large" style={{ borderRadius: 10 }} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
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

                    <Form.Item name="symptoms" label="Lý do khám / Triệu chứng bệnh">
                      <Input.TextArea
                        rows={3}
                        placeholder="Mô tả triệu chứng hiện tại (ví dụ: đau đầu, sốt nhẹ, đau tức ngực...)"
                        style={{ borderRadius: 10 }}
                      />
                    </Form.Item>
                  </Form>
                </Col>

                {/* Summary Card */}
                <Col xs={24} md={10}>
                  <div
                    style={{
                      padding: 24,
                      borderRadius: 16,
                      backgroundColor: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#0369a1', marginBottom: 4 }}>
                      TÓM TẮT PHIẾU KHÁM HẸN
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#64748b' }}>Chuyên khoa:</span>
                      <strong style={{ color: '#0284c7' }}>{selectedDept.name}</strong>
                    </div>

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

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: '#64748b' }}>Phí khám ban đầu:</span>
                      <strong style={{ color: '#10b981', fontSize: 16 }}>150.000 VNĐ</strong>
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
                      ℹ️ Sau khi đặt thành công, hệ thống sẽ cấp <strong>Mã QR Tiếp Nhận</strong>. Khi tới quầy, bạn chỉ cần đưa mã QR để check-in vào khám ngay mà không cần lấy số thứ tự.
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
                style={{
                  maxWidth: 460,
                  margin: '0 auto 28px',
                  padding: 24,
                  backgroundColor: '#ffffff',
                  borderRadius: 20,
                  border: '2px dashed #0284c7',
                  boxShadow: '0 10px 30px rgba(2, 132, 199, 0.15)',
                  textAlign: 'center',
                }}
              >
                <div style={{ marginBottom: 12 }}>
                  <img
                    src="/logo.png"
                    alt="Bệnh viện Đa khoa D-Medical"
                    style={{ height: 46, objectFit: 'contain' }}
                  />
                </div>
                <Tag color="cyan" style={{ fontSize: 12, padding: '4px 14px', borderRadius: 20, fontWeight: 800 }}>
                  PHIẾU KHÁM ĐIỆN TỬ • CHECK-IN QR
                </Tag>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, marginBottom: 16 }}>
                  (Bỏ cấp số thứ tự STT giấy • Tiếp nhận tự động bằng Mã QR)
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
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Bệnh nhân:</span>
                    <strong style={{ color: '#0f172a' }}>{createdAppointment.patientName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Mã Bệnh Nhân:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                      {createdAppointment.patientCode}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Chuyên khoa:</span>
                    <strong style={{ color: '#0284c7' }}>{createdAppointment.departmentName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Bác sĩ phụ trách:</span>
                    <span>{createdAppointment.doctorName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Ngày & Giờ khám:</span>
                    <strong style={{ color: '#0369a1' }}>
                      {createdAppointment.appointmentTime} • {createdAppointment.appointmentDate}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 18,
                    padding: '10px 14px',
                    borderRadius: 10,
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    fontSize: 12,
                    color: '#0369a1',
                    textAlign: 'left',
                  }}
                >
                  📌 <strong>Hướng dẫn:</strong> Khi đến bệnh viện, quý khách đưa màn hình có Mã QR này cho Tiếp tân để quét check-in vào khám ngay.
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Button
                  icon={<PrinterOutlined />}
                  size="large"
                  onClick={() => window.print()}
                  style={{ fontWeight: 600 }}
                >
                  In Phiếu Khám QR
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<ReloadOutlined />}
                  style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 700 }}
                  onClick={handleResetBooking}
                >
                  Đăng Ký Lịch Khám Mới
                </Button>
                <Button
                  size="large"
                  icon={<SearchOutlined />}
                  onClick={() => setLookupModalOpen(true)}
                  style={{ fontWeight: 600 }}
                >
                  Tra Cứu Lịch Hẹn
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>

      {/* MODAL TRA CỨU LỊCH HẸN & XEM LẠI MÃ QR */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0369a1' }}>
            <SearchOutlined />
            <span>Tra Cứu Lịch Hẹn & Xuất Trình Mã QR</span>
          </div>
        }
        open={lookupModalOpen}
        onCancel={() => setLookupModalOpen(false)}
        footer={null}
        width={560}
        centered
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
            Nhập số điện thoại đã đăng ký hoặc Mã phiếu hẹn để kiểm tra thông tin và lấy lại Mã QR:
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

          {lookupResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {lookupResults.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    border: '1px solid #bae6fd',
                    backgroundColor: '#f0f9ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>
                      {item.patientName} ({item.patientCode})
                    </div>
                    <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 600 }}>
                      {item.departmentName} • {item.doctorName}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      {item.appointmentTime} ngày {item.appointmentDate}
                    </div>
                    <Tag
                      color={item.status === 'Completed' ? 'cyan' : item.status === 'Confirmed' ? 'green' : 'gold'}
                      style={{ marginTop: 6, fontWeight: 600 }}
                    >
                      {item.status === 'Completed' ? 'Đã tiếp nhận (QR)' : item.status === 'Confirmed' ? 'Đã xác nhận' : 'Chờ duyệt'}
                    </Tag>
                  </div>

                  {/* QR Mini Display */}
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        padding: 8,
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
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, fontWeight: 600 }}>
                      {item.id}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: '#0f172a',
          color: '#cbd5e1',
          padding: '40px 20px',
          textAlign: 'center',
          fontSize: 13,
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <img src="/logo_white.png" alt="D-Medical Healthcare" style={{ height: 42, objectFit: 'contain' }} />
          </div>
          <p style={{ margin: '0 0 12px', color: '#94a3b8' }}>
            Địa chỉ: 123 Đường Y Tế, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh • Hotline cấp cứu: 1900 8888
          </p>
          <div style={{ color: '#64748b', fontSize: 12 }}>
            © 2026 D-Medical AI Healthcare. Hệ thống tiếp nhận điện tử ứng dụng Mã QR (Không cấp số thứ tự STT).
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PatientBookingPage;
