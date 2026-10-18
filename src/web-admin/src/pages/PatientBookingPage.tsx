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
  Breadcrumb,
  Tooltip,
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
  EditOutlined,
  ThunderboltOutlined,
  CreditCardOutlined,
  QrcodeOutlined,
  DownloadOutlined,
  TeamOutlined,
  CheckCircleFilled,
  HomeOutlined,
  CopyOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
import { isPatientProfileComplete, isPatientUser } from '../utils/authHelper';
import { AIChatDrawer } from '../components/AIChatDrawer';
import {
  DEPARTMENTS_CATALOG,
  DOCTORS_CATALOG,
  HEALTH_PACKAGES_CATALOG,
  DepartmentOption,
  DoctorOption,
  HealthPackageOption,
} from '../data/medicalCatalogs';
import './PatientBookingPage.css';

const { Title, Text, Paragraph } = Typography;

export const PatientBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, syncCurrentUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);

  // Tự động đồng bộ hồ sơ Bệnh nhân thật từ CSDL SQL Server khi vào trang
  useEffect(() => {
    syncCurrentUser();
  }, [syncCurrentUser]);

  // Modern Medical Portal Modes & Omnibar Search
  const [bookingMode, setBookingMode] = useState<'byDept' | 'byDoctor' | 'byPackage' | 'byFollowUp'>('byDept');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<HealthPackageOption | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'kiosk'>('vietqr');
  const [hasBhyt, setHasBhyt] = useState(true);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  // VietQR Online Simulated Payment State
  const [isVietQrPaid, setIsVietQrPaid] = useState(false);

  // Doctor & Package Detail Modal States
  const [viewingDoctor, setViewingDoctor] = useState<DoctorOption | null>(null);
  const [doctorDetailModalOpen, setDoctorDetailModalOpen] = useState(false);
  const [viewingPackage, setViewingPackage] = useState<HealthPackageOption | null>(null);
  const [packageDetailModalOpen, setPackageDetailModalOpen] = useState(false);

  // Department filter for Doctor Mode ('ALL' or department name)
  const [doctorDeptFilter, setDoctorDeptFilter] = useState<string>('ALL');

  // Past appointments for FollowUp Mode
  const [patientPastAppointments, setPatientPastAppointments] = useState<OnlineAppointmentItem[]>([]);
  const [pastAptLoading, setPastAptLoading] = useState(false);
  const [showQuickRebookBanner, setShowQuickRebookBanner] = useState(true);

  // Form selections
  const [selectedDept, setSelectedDept] = useState<DepartmentOption>(DEPARTMENTS_CATALOG[0]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [slots, setSlots] = useState<TimeSlotQuotaItem[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Shift filter for Step 2 ('ALL' | 'MORNING' | 'AFTERNOON')
  const [slotShiftFilter, setSlotShiftFilter] = useState<'ALL' | 'MORNING' | 'AFTERNOON'>('ALL');

  // Booking target for Step 3 ('self' | 'relative')
  const [bookingForTarget, setBookingForTarget] = useState<'self' | 'relative'>('self');
  const [relativeRelationship, setRelativeRelationship] = useState<string>('Con cái');

  // Patient Info Form
  const [form] = Form.useForm();
  const [bookingLoading, setBookingLoading] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<OnlineAppointmentItem | null>(null);

  // Helper kiểm tra slot đã qua giờ trong ngày hôm nay
  const isSlotPast = (slotTime: string, dateStr: string): boolean => {
    if (!dayjs(dateStr).isSame(dayjs(), 'day')) return false;
    const endPart = slotTime.split('-')[1]?.trim() || slotTime.split('-')[0]?.trim();
    const [hour, minute] = endPart.split(':').map(Number);
    const slotEndTime = dayjs().hour(hour).minute(minute).second(0);
    return dayjs().isAfter(slotEndTime);
  };

  // URL search params sync (from Chuyên khoa, Bác sĩ, Gói khám, Trang chủ)
  useEffect(() => {
    const mode = searchParams.get('mode');
    const deptId = searchParams.get('deptId');
    const doctorId = searchParams.get('doctorId');
    const packageId = searchParams.get('packageId');
    const searchParam = searchParams.get('search');

    if (searchParam) {
      setSearchQuery(searchParam);
    }

    if (mode === 'byDept' || mode === 'byDoctor' || mode === 'byPackage' || mode === 'byFollowUp') {
      setBookingMode(mode);
    }

    if (deptId) {
      const foundDept = DEPARTMENTS_CATALOG.find((d) => d.id === deptId);
      if (foundDept) {
        setSelectedDept(foundDept);
        setBookingMode('byDept');
        const docs = DOCTORS_CATALOG.filter((d) => d.department === foundDept.name);
        setSelectedDoctor(docs.length > 0 ? docs[0] : null);
        setCurrentStep(1); // Sang bước chọn bác sĩ
      }
    }

    if (doctorId) {
      const foundDoc = DOCTORS_CATALOG.find((d) => d.id === doctorId);
      if (foundDoc) {
        setSelectedDoctor(foundDoc);
        setBookingMode('byDoctor');
        const matchedDept = DEPARTMENTS_CATALOG.find((d) => d.name === foundDoc.department);
        if (matchedDept) setSelectedDept(matchedDept);
        setCurrentStep(bookingMode === 'byDoctor' ? 1 : 2);
      }
    }

    if (packageId) {
      const foundPkg = HEALTH_PACKAGES_CATALOG.find((p) => p.id === packageId);
      if (foundPkg) {
        setSelectedPackage(foundPkg);
        setBookingMode('byPackage');
        const matchedDept = DEPARTMENTS_CATALOG.find((d) => d.id === foundPkg.departmentId) || DEPARTMENTS_CATALOG[0];
        setSelectedDept(matchedDept);
        const docs = DOCTORS_CATALOG.filter((d) => d.department === matchedDept.name);
        setSelectedDoctor(docs.length > 0 ? docs[0] : null);
        setCurrentStep(1); // Nhảy thẳng vào chọn ngày giờ
      }
    }

    const profileParam = searchParams.get('profile');
    if (profileParam === 'open') {
      setCompleteProfileModalOpen(true);
      setCompleteProfileAllowClose(true);
    }
  }, [searchParams]);

  // Auth Guard & Profile Completion Modal States
  const [requireLoginModalOpen, setRequireLoginModalOpen] = useState(false);
  const [requireLoginActionTitle, setRequireLoginActionTitle] = useState('đặt lịch khám');
  const [completeProfileModalOpen, setCompleteProfileModalOpen] = useState(false);
  const [completeProfileAllowClose, setCompleteProfileAllowClose] = useState(true);

  // Helper: Bắt buộc đăng nhập & kiểm tra hồ sơ trước khi thực hiện đặt khám
  const ensureAuthenticated = (actionName: string): boolean => {
    if (!user) {
      setRequireLoginActionTitle(actionName);
      setRequireLoginModalOpen(true);
      return false;
    }

    if (isPatientUser(user) && !isPatientProfileComplete(user)) {
      setCompleteProfileModalOpen(true);
      setCompleteProfileAllowClose(true);
      showToast('Vui lòng cập nhật đầy đủ thông tin bệnh nhân trước khi tiếp tục!', 'warning');
      return false;
    }
    return true;
  };

  // Auto pre-fill thông tin bệnh nhân nếu đã đăng nhập và đang chọn "Đặt cho bản thân"
  useEffect(() => {
    if (user && bookingForTarget === 'self') {
      form.setFieldsValue({
        fullName: user.hoTen || user.tenDangNhap || '',
        phoneNumber: user.soDienThoai || '',
        gender: user.gioiTinh || 'Nam',
        birthYear: user.namSinh || (user.ngaySinh ? dayjs(user.ngaySinh).year() : ''),
        identityNumber: user.soCCCD || user.maTheBHYT || '',
      });
    }
  }, [user, bookingForTarget, currentStep, form]);

  // Tải danh sách các lần khám trước của Bệnh nhân cho chế độ Tái Khám
  useEffect(() => {
    const loadPast = async () => {
      if (!user?.soDienThoai && !user?.maBenhNhan) return;
      setPastAptLoading(true);
      try {
        const all = await appointmentService.getAppointments();
        const userPhone = (user.soDienThoai || '').trim();
        const userCode = (user.maBenhNhan || '').trim().toLowerCase();
        const found = all.filter(
          (a) =>
            (userPhone && a.patientPhone.includes(userPhone)) ||
            (userCode && a.patientCode.toLowerCase() === userCode)
        );
        setPatientPastAppointments(found);
      } catch {
        // ignore
      } finally {
        setPastAptLoading(false);
      }
    };
    if (user) {
      loadPast();
    }
  }, [user, bookingMode]);

  // Tra cứu lịch hẹn modal
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupResults, setLookupResults] = useState<OnlineAppointmentItem[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupTypeFilter, setLookupTypeFilter] = useState<'ALL' | 'New' | 'FollowUp'>('ALL');
  const [ticketDetailModalOpen, setTicketDetailModalOpen] = useState(false);
  const [viewingTicketAppointment, setViewingTicketAppointment] = useState<OnlineAppointmentItem | null>(null);

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

  // Chọn Gói khám sức khỏe
  const handleSelectPackage = (pkg: HealthPackageOption) => {
    if (!ensureAuthenticated('chọn gói khám sức khỏe')) return;
    setSelectedPackage(pkg);
    const matchedDept = DEPARTMENTS_CATALOG.find((d) => d.id === pkg.departmentId) || DEPARTMENTS_CATALOG[0];
    setSelectedDept(matchedDept);
    const docs = DOCTORS_CATALOG.filter((d) => d.department === matchedDept.name);
    setSelectedDoctor(docs.length > 0 ? docs[0] : null);
    setCurrentStep(1); // Bước tiếp theo là Chọn Ngày & Giờ
    showToast(`Đã chọn ${pkg.name}. Vui lòng chọn ngày & giờ khám!`, 'success');
  };

  // Chọn đích danh Bác sĩ từ tab Bác sĩ Chuyên gia
  const handleSelectDoctorDirect = (doc: DoctorOption) => {
    if (!ensureAuthenticated('chọn bác sĩ khám')) return;
    setSelectedDoctor(doc);
    const matchedDept = DEPARTMENTS_CATALOG.find((d) => d.name === doc.department) || DEPARTMENTS_CATALOG[0];
    setSelectedDept(matchedDept);
    setSelectedPackage(null);
    setCurrentStep(1); // Bước tiếp theo là Chọn Ngày & Giờ
    showToast(`Đã chọn ${doc.name}. Vui lòng chọn ngày & giờ khám!`, 'success');
  };

  // Xử lý Đặt lại / Tái khám nhanh (1 chạm) từ Banner gợi ý thông minh
  const handleQuickRebook = (past: OnlineAppointmentItem) => {
    if (!ensureAuthenticated('đặt lịch tái khám')) return;
    const matchedDept =
      DEPARTMENTS_CATALOG.find((d) => past.departmentName.includes(d.name)) ||
      DEPARTMENTS_CATALOG[0];
    setSelectedDept(matchedDept);
    const docs = DOCTORS_CATALOG.filter((d) => d.name === past.doctorName);
    setSelectedDoctor(docs.length > 0 ? docs[0] : null);
    setSelectedPackage(null);
    form.setFieldsValue({
      appointmentType: 'FollowUp',
      previousRecordCode: past.id,
      followUpNotes: `Tái khám theo đợt khám ngày ${dayjs(past.appointmentDate).format('DD/MM/YYYY')} (${past.departmentName})`,
    });
    setBookingMode('byFollowUp');
    setCurrentStep(1); // Chuyển thẳng sang Bước Chọn Ngày & Giờ khám mới
    showToast(
      `Đã nạp lại thông tin đợt khám ${past.id.toUpperCase()} (${past.departmentName}). Vui lòng chọn ngày & giờ khám mới!`,
      'success'
    );
  };

  // Fetch slots whenever selectedDate changes
  useEffect(() => {
    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const data = await appointmentService.getTimeSlots(selectedDate, selectedDept.name);
        setSlots(data);
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
    setCurrentStep(1); // Sang bước chọn bác sĩ của khoa
  };

  // Handle submit booking
  const handleCompleteBooking = async () => {
    if (!ensureAuthenticated('xác nhận đặt lịch khám')) return;
    try {
      const values = await form.validateFields();
      if (!selectedSlot) {
        showErrorAlert('Chưa chọn giờ khám', 'Vui lòng quay lại bước chọn khung giờ khám!');
        setCurrentStep(bookingMode === 'byDept' ? 2 : 1);
        return;
      }

      setBookingLoading(true);

      const patientCode = user?.maBenhNhan || `BN2026${Date.now().toString().slice(-4)}`;
      const appointmentTime = selectedSlot.split(' - ')[0].trim();
      const pricing = calculatePricing();

      // Kiểm tra tránh trùng khung giờ khám cùng ngày của bệnh nhân
      try {
        const allApts = await appointmentService.getAppointments();
        const normalizedPhone = values.phoneNumber.trim();
        const hasConflict = allApts.some(
          (a) =>
            a.appointmentDate === selectedDate &&
            a.appointmentTime === appointmentTime &&
            (a.patientPhone === normalizedPhone || (user?.soDienThoai && a.patientPhone === user.soDienThoai)) &&
            a.status !== 'Cancelled'
        );
        if (hasConflict) {
          showErrorAlert(
            'Trùng khung giờ khám!',
            `Bạn đã có một lịch hẹn khác vào khung giờ ${selectedSlot} ngày ${dayjs(selectedDate).format('DD/MM/YYYY')}. Vui lòng chọn khung giờ khác để tránh bị trùng lịch!`
          );
          setBookingLoading(false);
          return;
        }
      } catch {
        // non-blocking fallback
      }

      let reason = values.symptoms ? values.symptoms.trim() : '';
      if (bookingForTarget === 'relative') {
        reason = `[Người thân: ${relativeRelationship}] ` + reason;
      }
      if (selectedPackage) {
        reason = `[${selectedPackage.name}] ` + (reason || 'Khám gói sức khỏe & tầm soát chuyên sâu');
      } else if (values.appointmentType === 'FollowUp' || bookingMode === 'byFollowUp') {
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
        doctorName: selectedDoctor ? selectedDoctor.name : `BS. Chuyên khoa ${selectedDept.name.replace(/^Khoa\s+/i, '')}`,
        appointmentDate: selectedDate,
        appointmentTime: appointmentTime,
        symptomsReason: reason,
        sourceApp: 'Web Booking Portal',
        appointmentType: values.appointmentType || (bookingMode === 'byFollowUp' ? 'FollowUp' : 'New'),
        previousRecordCode: values.previousRecordCode,
        followUpNotes: values.followUpNotes,
      });

      setCreatedAppointment(newApt);
      setIsVietQrPaid(false);
      setCurrentStep(completionStepIndex); // Màn hình thành công
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

  // Tự động mở tra cứu lịch hẹn khi URL có ?lookup=open
  useEffect(() => {
    const lookupParam = searchParams.get('lookup');
    if (lookupParam === 'open') {
      if (user) {
        openPatientAppointments();
      } else {
        setLookupModalOpen(true);
      }
    }
  }, [searchParams, user]);

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

      setLookupResults((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );

      if (createdAppointment && createdAppointment.id === updated.id) {
        setCreatedAppointment(updated);
      }

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

      setLookupResults((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );

      if (createdAppointment && createdAppointment.id === updated.id) {
        setCreatedAppointment(updated);
      }

      const refreshedSlots = await appointmentService.getTimeSlots(selectedDate, selectedDept.name);
      setSlots(refreshedSlots);
    } catch (err: any) {
      showErrorAlert('Lỗi hủy lịch', err.message || 'Không thể hủy lịch khám');
    } finally {
      setCancelSubmitting(false);
    }
  };

  // Chuyển đổi đối tượng đặt khám: Bản thân vs Người thân
  const handleSwitchBookingTarget = (target: 'self' | 'relative') => {
    setBookingForTarget(target);
    if (target === 'self') {
      if (user) {
        form.setFieldsValue({
          fullName: user.hoTen || user.tenDangNhap,
          phoneNumber: user.soDienThoai || '',
          gender: user.gioiTinh || 'Nam',
          birthYear: user.namSinh || (user.ngaySinh ? dayjs(user.ngaySinh).year() : ''),
          identityNumber: user.soCCCD || user.maTheBHYT || '',
        });
      }
    } else {
      form.setFieldsValue({
        fullName: '',
        phoneNumber: user?.soDienThoai || '',
        gender: 'Nam',
        birthYear: '',
        identityNumber: '',
      });
    }
  };

  // Tải hình ảnh QR Tiếp Nhận về máy
  const handleDownloadQrImage = () => {
    try {
      const svgEl = document.querySelector('#qr-ticket-card svg') as SVGSVGElement | null;
      if (!svgEl) {
        showToast('Không tìm thấy mã QR để tải xuống', 'error');
        return;
      }
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      canvas.width = 400;
      canvas.height = 400;
      img.onload = () => {
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20, 360, 360);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `Phieu_Kham_D-Medical_${createdAppointment?.id || 'QR'}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        showToast('Đã tải hình ảnh QR tiếp nhận về máy thành công!', 'success');
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch {
      showToast('Không thể xuất ảnh QR. Vui lòng sử dụng tính năng In Phiếu Khám!', 'error');
    }
  };

  // Reset booking form
  const handleResetBooking = () => {
    setCurrentStep(0);
    setSelectedDoctor(null);
    setSelectedSlot('');
    setCreatedAppointment(null);
    setIsVietQrPaid(false);
    setBookingForTarget('self');
    setSlotShiftFilter('ALL');
    if (user) {
      form.setFieldsValue({
        fullName: user.hoTen || user.tenDangNhap,
        phoneNumber: user.soDienThoai || '',
        symptoms: '',
        birthYear: user.namSinh || (user.ngaySinh ? dayjs(user.ngaySinh).year() : ''),
        gender: user.gioiTinh || 'Nam',
        identityNumber: user.soCCCD || '',
      });
    } else {
      form.resetFields();
    }
  };

  // Dynamic Steps definition based on bookingMode
  // If byDept: 4 steps (0: Khoa, 1: Bác sĩ, 2: Ngày & Giờ, 3: Thông tin, 4: Thành công)
  // If byDoctor/byPackage/byFollowUp: 3 steps (0: Dịch vụ, 1: Ngày & Giờ, 2: Thông tin, 3: Thành công)
  const isDeptMode = bookingMode === 'byDept';
  const totalStepsCount = isDeptMode ? 4 : 3;
  const completionStepIndex = totalStepsCount;

  const getStepItems = () => {
    if (isDeptMode) {
      return [
        { title: 'Chuyên khoa', icon: <MedicineBoxOutlined /> },
        { title: 'Bác sĩ', icon: <UserOutlined /> },
        { title: 'Ngày & Giờ', icon: <ClockCircleOutlined /> },
        { title: 'Thông tin & Xác nhận', icon: <CheckCircleOutlined /> },
      ];
    }
    if (bookingMode === 'byDoctor') {
      return [
        { title: 'Chọn Bác sĩ', icon: <UserOutlined /> },
        { title: 'Ngày & Giờ', icon: <ClockCircleOutlined /> },
        { title: 'Thông tin & Xác nhận', icon: <CheckCircleOutlined /> },
      ];
    }
    if (bookingMode === 'byPackage') {
      return [
        { title: 'Chọn Gói khám', icon: <ThunderboltOutlined /> },
        { title: 'Ngày & Giờ', icon: <ClockCircleOutlined /> },
        { title: 'Thông tin & Xác nhận', icon: <CheckCircleOutlined /> },
      ];
    }
    return [
      { title: 'Cổng Tái khám', icon: <HistoryOutlined /> },
      { title: 'Ngày & Giờ', icon: <ClockCircleOutlined /> },
      { title: 'Thông tin & Xác nhận', icon: <CheckCircleOutlined /> },
    ];
  };

  const getStepTitle = () => {
    if (isDeptMode) {
      if (currentStep === 0) return 'Chọn Chuyên Khoa';
      if (currentStep === 1) return 'Chọn Bác Sĩ';
      if (currentStep === 2) return 'Ngày & Giờ Hẹn';
      return 'Thông Tin & Xác Nhận';
    }
    if (currentStep === 0) {
      return bookingMode === 'byDoctor'
        ? 'Chọn Bác Sĩ'
        : bookingMode === 'byPackage'
        ? 'Chọn Gói Khám'
        : 'Cổng Tái Khám';
    }
    if (currentStep === 1) return 'Ngày & Giờ Hẹn';
    return 'Thông Tin & Xác Nhận';
  };

  return (
    <div className="booking-page-container">
      {/* 1. Header */}
      <PatientPortalHeader
        onOpenLookup={() => {
          if (user) openPatientAppointments();
          else setLookupModalOpen(true);
        }}
        onOpenProfile={() => {
          setCompleteProfileModalOpen(true);
          setCompleteProfileAllowClose(true);
        }}
      />

      {/* 2. Breadcrumb & Page Banner */}
      <div style={{ maxWidth: 1200, margin: '20px auto 0', padding: '0 20px' }}>
        <Breadcrumb
          items={[
            { title: <Link to="/"><HomeOutlined /> Trang chủ</Link> },
            { title: <span style={{ color: '#0284c7', fontWeight: 600 }}>Đặt lịch khám</span> },
          ]}
          style={{ marginBottom: 16 }}
        />

        <div className="booking-page-header-banner">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <Title level={1} style={{ color: '#0f172a', fontWeight: 800, fontSize: 44, margin: '0 0 10px', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                Đặt lịch khám bệnh
              </Title>
              <Paragraph style={{ color: '#334155', fontSize: 16, margin: 0, maxWidth: 700, lineHeight: 1.6 }}>
                Chủ động chọn chuyên khoa, bác sĩ và khung giờ theo nhu cầu. Xác nhận lịch hẹn tức thì, tiếp nhận nhanh qua mã QR tại buồng khám.
              </Paragraph>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 6 }}>
              <Button
                icon={<SearchOutlined />}
                style={{ borderColor: '#bae6fd', color: '#0369a1', fontWeight: 700, borderRadius: 8, height: 42, padding: '0 18px', backgroundColor: '#ffffff' }}
                onClick={() => {
                  if (user) openPatientAppointments();
                  else setLookupModalOpen(true);
                }}
              >
                Tra cứu lịch hẹn
              </Button>
              <Button
                icon={<ThunderboltOutlined />}
                style={{ borderColor: '#bae6fd', color: '#0284c7', fontWeight: 700, borderRadius: 8, height: 42, padding: '0 18px', backgroundColor: '#f0f9ff' }}
                onClick={() => setAiDrawerOpen(true)}
              >
                Tư vấn AI Triage
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Booking Wizard Container */}
      <main id="main-booking-flow" className="booking-main-card" style={{ marginTop: 20 }}>
        <Card bordered={false} className="booking-card-inner">
          {/* Progress Steps Header */}
          {currentStep < completionStepIndex && (
            <div style={{ marginBottom: 28 }}>
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
                  Bước {currentStep + 1}/{totalStepsCount}: {getStepTitle()}
                </span>
                <Tag color="cyan" style={{ margin: 0, fontWeight: 700, borderRadius: 12 }}>
                  Tiến trình {Math.round(((currentStep + 1) / totalStepsCount) * 100)}%
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
                items={getStepItems()}
              />
            </div>
          )}

          {/* Booking Modes Switcher Tabs (Only visible on Step 0) */}
          {currentStep === 0 && (
            <>
              {/* SMART RE-BOOK BANNER: Gợi ý Đặt lại / Tái khám nhanh 1 chạm cho người bệnh cũ */}
              {user && patientPastAppointments.length > 0 && showQuickRebookBanner && (
                <div
                  className="quick-rebook-banner"
                  style={{
                    marginBottom: 20,
                    padding: '16px 20px',
                    borderRadius: 12,
                    background: '#f0f9ff',
                    border: '1.5px solid #bae6fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 14,
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: '1 1 320px' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      <HistoryOutlined />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <Tag
                          color="processing"
                          style={{
                            borderRadius: 4,
                            fontWeight: 700,
                            borderColor: '#bae6fd',
                            margin: 0,
                            fontSize: 11,
                          }}
                        >
                          GỢI Ý TÁI KHÁM 1 CHẠM
                        </Tag>
                        <span style={{ fontSize: 13, color: '#64748b' }}>
                          Đợt khám trước: <strong>{dayjs(patientPastAppointments[0].appointmentDate).format('DD/MM/YYYY')}</strong>
                        </span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                        {patientPastAppointments[0].departmentName} — {patientPastAppointments[0].doctorName}
                      </div>
                      <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>
                        Hệ thống tự động liên kết mã hồ sơ <span style={{ fontWeight: 700, color: '#0284c7' }}>#{patientPastAppointments[0].id.toUpperCase()}</span>. Bấm để giữ bác sĩ và chọn giờ khám mới.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <Button
                      type="primary"
                      icon={<ThunderboltOutlined />}
                      style={{
                        backgroundColor: '#0284c7',
                        borderColor: '#0284c7',
                        borderRadius: 8,
                        fontWeight: 700,
                        height: 40,
                        padding: '0 18px',
                      }}
                      onClick={() => handleQuickRebook(patientPastAppointments[0])}
                    >
                      Đặt lại ca này
                    </Button>

                    {patientPastAppointments.length > 1 && (
                      <Button
                        style={{
                          borderColor: '#bae6fd',
                          color: '#0369a1',
                          borderRadius: 10,
                          fontWeight: 600,
                          height: 40,
                        }}
                        onClick={() => {
                          setBookingMode('byFollowUp');
                          setCurrentStep(0);
                        }}
                      >
                        Xem tất cả ({patientPastAppointments.length}) đợt khám cũ
                      </Button>
                    )}

                    <Button
                      type="text"
                      icon={<CloseCircleOutlined style={{ fontSize: 18, color: '#94a3b8' }} />}
                      title="Đóng thông báo này"
                      onClick={() => setShowQuickRebookBanner(false)}
                      style={{ padding: 4 }}
                    />
                  </div>
                </div>
              )}

              <div className="booking-modes-bar" style={{ marginBottom: 24 }}>
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
                <span>Theo chuyên khoa</span>
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
                <span>Theo bác sĩ</span>
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
                <span>Gói khám tổng quát</span>
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
                <span>Tái khám định kỳ</span>
              </button>
            </div>
            </>
          )}

          {/* ================= STEP 0: NỘI DUNG THEO TỪNG CHẾ ĐỘ ================= */}
          {currentStep === 0 && (
            <div>
              {/* CHẾ ĐỘ 1: THEO CHUYÊN KHOA */}
              {bookingMode === 'byDept' && (
                <div>
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                      Chọn chuyên khoa khám bệnh
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>
                      Bác sĩ và khung giờ sẽ được hiển thị tương ứng theo chuyên khoa bạn chọn
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
                              borderRadius: 12,
                              border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                              backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              height: '100%',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                              <div
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 10,
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
                                <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                                  {dept.name}
                                </div>
                                <div style={{ fontSize: 13, color: '#0284c7', fontWeight: 600, marginTop: 2 }}>
                                  <EnvironmentOutlined style={{ marginRight: 4 }} />{dept.location}
                                </div>
                              </div>
                            </div>

                            <p style={{ fontSize: 14, color: '#334155', margin: '0 0 14px', lineHeight: 1.5, flex: 1 }}>
                              {dept.description}
                            </p>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 12px',
                                backgroundColor: isSelected ? '#e0f2fe' : '#f8fafc',
                                borderRadius: 8,
                                fontSize: 13,
                              }}
                            >
                              <span style={{ color: '#64748b' }}>Phí khám ban đầu</span>
                              <strong style={{ color: '#0284c7', fontSize: 15 }}>{dept.price.toLocaleString('vi-VN')} đ</strong>
                            </div>

                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                              <span style={{ color: '#15803d', fontWeight: 600 }}>Hỗ trợ BHYT</span>
                              <span style={{ color: '#64748b' }}>Tiếp nhận tại viện</span>
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              )}

              {/* CHẾ ĐỘ 2: THEO BÁC SĨ */}
              {bookingMode === 'byDoctor' && (
                <div>
                  <div style={{ marginBottom: 20, textAlign: 'center' }}>
                    <Title level={3} style={{ color: '#0369a1', fontWeight: 800, margin: 0 }}>
                      Đặt Khám Trực Tiếp Cùng Bác Sĩ Chuyên Gia & Trưởng Khoa
                    </Title>
                    <Text style={{ color: '#64748b', fontSize: 13.5 }}>
                      Lựa chọn các Bác sĩ CKII, Thạc sĩ, Tiến sĩ có thâm niên từ các bệnh viện tuyến đầu
                    </Text>
                  </div>

                  <div className="doctor-filter-tabs-wrap">
                    <button
                      type="button"
                      className={`doctor-filter-chip ${doctorDeptFilter === 'ALL' ? 'active' : ''}`}
                      onClick={() => setDoctorDeptFilter('ALL')}
                    >
                      Tất Cả Chuyên Khoa ({DOCTORS_CATALOG.length})
                    </button>
                    {DEPARTMENTS_CATALOG.map((dept) => {
                      const count = DOCTORS_CATALOG.filter((d) => d.department === dept.name).length;
                      if (count === 0) return null;
                      return (
                        <button
                          key={dept.id}
                          type="button"
                          className={`doctor-filter-chip ${doctorDeptFilter === dept.name ? 'active' : ''}`}
                          onClick={() => setDoctorDeptFilter(dept.name)}
                        >
                          {dept.name} ({count})
                        </button>
                      );
                    })}
                  </div>

                  <Row gutter={[16, 16]}>
                    {DOCTORS_CATALOG.filter((doc) => {
                      const matchesDept = doctorDeptFilter === 'ALL' || doc.department === doctorDeptFilter;
                      if (!searchQuery.trim()) return matchesDept;
                      const q = searchQuery.toLowerCase().trim();
                      return (
                        matchesDept &&
                        (doc.name.toLowerCase().includes(q) ||
                          doc.department.toLowerCase().includes(q) ||
                          doc.title.toLowerCase().includes(q) ||
                          doc.experience.toLowerCase().includes(q))
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

                            <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{doc.name}</div>
                            <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 700, marginTop: 4 }}>
                              {doc.department}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, minHeight: 34 }}>
                              {doc.title}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>{doc.experience}</div>

                            <div style={{ margin: '8px 0', fontSize: 13, color: '#0369a1', fontWeight: 600 }}>
                              Đánh giá: {doc.rating}/5.0
                            </div>

                            <div style={{ fontSize: 12.5, color: '#334155', marginBottom: 14 }}>
                              Phí tư vấn: <strong style={{ color: '#0284c7' }}>{doc.consultationFee.toLocaleString('vi-VN')} đ</strong>
                            </div>

                            <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                              <Button
                                size="middle"
                                style={{
                                  flex: 1,
                                  borderRadius: 8,
                                  fontWeight: 600,
                                  borderColor: '#bae6fd',
                                  color: '#0369a1',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingDoctor(doc);
                                  setDoctorDetailModalOpen(true);
                                }}
                              >
                                Tiểu sử
                              </Button>
                              <Button
                                type="primary"
                                size="middle"
                                style={{
                                  flex: 1.2,
                                  backgroundColor: '#0284c7',
                                  borderColor: '#0284c7',
                                  fontWeight: 700,
                                  borderRadius: 8,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectDoctorDirect(doc);
                                }}
                              >
                                Chọn Khám
                              </Button>
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              )}

              {/* CHẾ ĐỘ 3: GÓI KHÁM SỨC KHỎE */}
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

                            <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                              <Button
                                size="large"
                                style={{
                                  flex: 1,
                                  borderRadius: 10,
                                  fontWeight: 600,
                                  borderColor: '#bae6fd',
                                  color: '#0369a1',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingPackage(pkg);
                                  setPackageDetailModalOpen(true);
                                }}
                              >
                                Chi tiết
                              </Button>
                              <Button
                                type="primary"
                                size="large"
                                style={{
                                  flex: 1.2,
                                  backgroundColor: '#0284c7',
                                  borderColor: '#0284c7',
                                  borderRadius: 10,
                                  fontWeight: 700,
                                }}
                                onClick={() => handleSelectPackage(pkg)}
                              >
                                {isSelected ? 'Đã chọn gói' : 'Đăng Ký Gói Này'}
                              </Button>
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              )}

              {/* CHẾ ĐỘ 4: TÁI KHÁM ĐỊNH KỲ */}
              {bookingMode === 'byFollowUp' && (
                <div style={{ maxWidth: 840, margin: '0 auto' }}>
                  <div className="followup-hero-box">
                    <HistoryOutlined style={{ fontSize: 44, color: '#0284c7', marginBottom: 12 }} />
                    <Title level={3} style={{ color: '#0369a1', margin: '0 0 8px', fontWeight: 800 }}>
                      Cổng Đặt Lịch Tái Khám Định Kỳ
                    </Title>
                    <Paragraph style={{ color: '#475569', fontSize: 13.5, maxWidth: 580, margin: '0 auto 20px', lineHeight: 1.6 }}>
                      Dành cho người bệnh có chỉ định tái khám của Bác sĩ sau đợt điều trị. Hệ thống tự động liên kết với hồ sơ bệnh án điện tử (EMR) cũ, giúp Bác sĩ nắm rõ diễn tiến bệnh lý và kết quả xét nghiệm trước đó.
                    </Paragraph>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <Button
                        type="primary"
                        size="large"
                        style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', borderRadius: 10, fontWeight: 700 }}
                        onClick={() => {
                          const noiDept = DEPARTMENTS_CATALOG[0];
                          setSelectedDept(noiDept);
                          const docs = DOCTORS_CATALOG.filter((d) => d.department === noiDept.name);
                          setSelectedDoctor(docs[0] || null);
                          form.setFieldsValue({ appointmentType: 'FollowUp' });
                          setCurrentStep(1);
                        }}
                      >
                        Tiếp Tục Chọn Ngày Giờ Tái Khám
                      </Button>
                      <Button
                        size="large"
                        icon={<SearchOutlined />}
                        style={{ borderColor: '#bae6fd', color: '#0369a1', borderRadius: 10, fontWeight: 600 }}
                        onClick={openPatientAppointments}
                      >
                        Tra Cứu Lịch Hẹn Của Tôi
                      </Button>
                    </div>
                  </div>

                  {user && (
                    <div style={{ marginTop: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CheckCircleOutlined style={{ color: '#0284c7' }} />
                          <span>Các Đợt Khám Trước Của Bạn ({patientPastAppointments.length}):</span>
                        </div>
                        {pastAptLoading && <Spin size="small" />}
                      </div>

                      {patientPastAppointments.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {patientPastAppointments.slice(0, 3).map((past) => (
                            <div key={past.id} className="followup-past-card">
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <strong style={{ fontSize: 14.5, color: '#0f172a' }}>{past.departmentName}</strong>
                                  <Tag color="geekblue" style={{ fontFamily: 'monospace', margin: 0 }}>
                                    {past.id.toUpperCase()}
                                  </Tag>
                                  <Tag color="cyan" style={{ margin: 0, fontSize: 11 }}>
                                    {dayjs(past.appointmentDate).format('DD/MM/YYYY')}
                                  </Tag>
                                </div>
                                <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>
                                  Bác sĩ: <strong>{past.doctorName}</strong> • Giờ khám: {past.appointmentTime}
                                </div>
                              </div>

                              <Button
                                type="primary"
                                style={{
                                  backgroundColor: '#0284c7',
                                  borderColor: '#0284c7',
                                  fontWeight: 700,
                                  borderRadius: 8,
                                }}
                                onClick={() => {
                                  const matchedDept = DEPARTMENTS_CATALOG.find((d) => past.departmentName.includes(d.name)) || DEPARTMENTS_CATALOG[0];
                                  setSelectedDept(matchedDept);
                                  const docs = DOCTORS_CATALOG.filter((d) => d.name === past.doctorName);
                                  setSelectedDoctor(docs.length > 0 ? docs[0] : null);
                                  form.setFieldsValue({
                                    appointmentType: 'FollowUp',
                                    previousRecordCode: past.id,
                                    followUpNotes: `Tái khám theo đợt khám ngày ${dayjs(past.appointmentDate).format('DD/MM/YYYY')}`,
                                  });
                                  setCurrentStep(1);
                                  showToast(`Đã chọn tái khám cho đợt ${past.id.toUpperCase()}. Vui lòng chọn ngày giờ!`, 'success');
                                }}
                              >
                                Tái Khám Đợt Này
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : !pastAptLoading ? (
                        <div
                          style={{
                            padding: 20,
                            borderRadius: 12,
                            backgroundColor: '#f8fafc',
                            border: '1px dashed #cbd5e1',
                            textAlign: 'center',
                            color: '#64748b',
                            fontSize: 13,
                          }}
                        >
                          Bạn chưa có lịch sử khám trước trên hệ thống. Bấm nút phía trên để đăng ký tái khám mới!
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 1 CHO CHUYÊN KHOA: CHỌN BÁC SĨ ================= */}
          {isDeptMode && currentStep === 1 && (
            <div>
              <div style={{ marginBottom: 24, textAlign: 'center' }}>
                <Title level={3} style={{ color: '#0369a1', fontWeight: 800, margin: 0 }}>
                  Chọn bác sĩ khám
                </Title>
                <Text style={{ color: '#64748b', fontSize: 14 }}>
                  Chuyên khoa: <strong style={{ color: '#0284c7' }}>{selectedDept.name}</strong>
                </Text>
              </div>

              {filteredDoctors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <MedicineBoxOutlined style={{ fontSize: 48, color: '#94a3b8' }} />
                  <p style={{ marginTop: 12, color: '#64748b' }}>
                    Khoa đang phân công bác sĩ trực ca tiếp nhận. Bạn có thể tiếp tục với bác sĩ trực ca của khoa.
                  </p>
                  <Button
                    type="primary"
                    style={{ backgroundColor: '#0284c7' }}
                    onClick={() => {
                      if (!ensureAuthenticated('chọn bác sĩ trực ca')) return;
                      setSelectedDoctor({
                        id: 'doc-default',
                        name: `BS. Chuyên Khoa ${selectedDept.name.replace(/^Khoa\s+/i, '')}`,
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
                    Khám với bác sĩ trực ca
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
                          <div style={{ marginTop: 10, fontSize: 13, color: '#0369a1', fontWeight: 600 }}>
                            Đánh giá: {doc.rating}/5.0
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

          {/* ================= BƯỚC CHỌN NGÀY & KHUNG GIỜ ================= */}
          {/* Step index = 2 (nếu là byDept) hoặc index = 1 (nếu là các mode khác) */}
          {((isDeptMode && currentStep === 2) || (!isDeptMode && currentStep === 1)) && (
            <div>
              <div style={{ marginBottom: 20, textAlign: 'center' }}>
                <Title level={3} style={{ color: '#0369a1', fontWeight: 800, margin: 0 }}>
                  Chọn ngày và khung giờ khám
                </Title>
                <Text style={{ color: '#64748b', fontSize: 14 }}>
                  Khung giờ hiển thị theo số lượng chỗ còn trống trong ngày
                </Text>
              </div>

              {/* Summary Bar: Hiển thị Bác sĩ & Chuyên khoa hiện tại kèm nút đổi nếu muốn */}
              <div
                style={{
                  maxWidth: 620,
                  margin: '0 auto 20px',
                  padding: '12px 18px',
                  borderRadius: 14,
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #bae6fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar
                    size={42}
                    src={selectedDoctor?.avatar}
                    icon={<UserOutlined />}
                    style={{ backgroundColor: '#0284c7' }}
                  />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14.5, color: '#0f172a' }}>
                      {selectedDoctor?.name || `BS. Trực ca ${selectedDept.name.replace(/^Khoa\s+/i, '')}`}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{selectedDept.name}</span>
                      {bookingMode === 'byFollowUp' && (
                        <Tag color="cyan" style={{ margin: 0, fontSize: 10.5, borderRadius: 6, fontWeight: 700 }}>
                          Tái khám theo hẹn
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  size="small"
                  type="link"
                  icon={<SwapOutlined />}
                  style={{ color: '#0284c7', fontWeight: 700, fontSize: 13 }}
                  onClick={() => setCurrentStep(0)}
                >
                  Đổi Bác sĩ / Chuyên khoa khác
                </Button>
              </div>

              {/* Date Selection Box with 7-Day Quick Strip */}
              <div className="booking-date-section-wrapper" style={{ maxWidth: 680, margin: '0 auto 28px' }}>
                <div className="quick-date-strip" style={{ marginBottom: 12 }}>
                  {Array.from({ length: 7 }).map((_, i) => {
                    const d = dayjs().add(i, 'day');
                    const dateStr = d.format('YYYY-MM-DD');
                    const isSelected = selectedDate === dateStr;
                    const isToday = i === 0;
                    const isTomorrow = i === 1;
                    const dayLabel = isToday ? 'Hôm nay' : isTomorrow ? 'Ngày mai' : `Thứ ${d.day() === 0 ? 'CN' : d.day() + 1}`;
                    
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        className={`quick-date-pill ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedDate(dateStr)}
                      >
                        <span className="quick-date-day">{dayLabel}</span>
                        <span className="quick-date-num">{d.format('DD/MM')}</span>
                      </button>
                    );
                  })}
                </div>

                <div
                  className="booking-date-container"
                  style={{
                    padding: '14px 18px',
                    borderRadius: 14,
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #bae6fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.05)',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        backgroundColor: '#e0f2fe',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                      }}
                    >
                      <CalendarOutlined />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Ngày khám đã chọn:</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0369a1' }}>
                        {dayjs(selectedDate).format('DD/MM/YYYY')} (Thứ {dayjs(selectedDate).day() === 0 ? 'Chủ Nhật' : dayjs(selectedDate).day() + 1})
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Chọn ngày khác:</span>
                    <DatePicker
                      value={dayjs(selectedDate)}
                      onChange={(date) => {
                        if (date) setSelectedDate(date.format('YYYY-MM-DD'));
                      }}
                      disabledDate={(current) => current && current < dayjs().startOf('day')}
                      allowClear={false}
                      format="DD/MM/YYYY"
                      style={{ borderRadius: 8, borderColor: '#bae6fd' }}
                    />
                  </div>
                </div>
              </div>

              {/* Time Slots Grid */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <div className="slot-shift-tabs-wrap">
                    <button
                      type="button"
                      className={`slot-shift-tab-btn ${slotShiftFilter === 'ALL' ? 'active' : ''}`}
                      onClick={() => setSlotShiftFilter('ALL')}
                    >
                      Tất cả ({slots.length})
                    </button>
                    <button
                      type="button"
                      className={`slot-shift-tab-btn ${slotShiftFilter === 'MORNING' ? 'active' : ''}`}
                      onClick={() => setSlotShiftFilter('MORNING')}
                    >
                      Ca sáng (07:00 - 11:30)
                    </button>
                    <button
                      type="button"
                      className={`slot-shift-tab-btn ${slotShiftFilter === 'AFTERNOON' ? 'active' : ''}`}
                      onClick={() => setSlotShiftFilter('AFTERNOON')}
                    >
                      Ca chiều (13:00 - 16:30)
                    </button>
                  </div>
                  <span style={{ fontSize: 12, color: '#0284c7', fontWeight: 600 }}>
                    Lưu ý: Khung giờ màu xám là đã kín chỗ hoặc đã qua giờ
                  </span>
                </div>

                {slotsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Spin size="large" />
                    <p style={{ marginTop: 12, color: '#64748b' }}>Đang kiểm tra tình trạng khung giờ...</p>
                  </div>
                ) : (
                  <Row gutter={[12, 12]}>
                    {slots.filter((slot) => {
                      if (slotShiftFilter === 'ALL') return true;
                      const hour = parseInt(slot.timeSlot.split(':')[0], 10);
                      if (slotShiftFilter === 'MORNING') return hour < 12;
                      if (slotShiftFilter === 'AFTERNOON') return hour >= 12;
                      return true;
                    }).map((slot) => {
                      const isSelected = selectedSlot === slot.timeSlot;
                      const isExpired = isSlotPast(slot.timeSlot, selectedDate);
                      const isFull = slot.bookedCount >= slot.maxCapacity;
                      const isBlocked = slot.isLocked || isFull || isExpired;
                      const remaining = Math.max(0, slot.maxCapacity - slot.bookedCount);

                      return (
                        <Col xs={12} sm={8} md={6} lg={4} key={slot.id}>
                          <div
                            onClick={() => {
                              if (!ensureAuthenticated('chọn khung giờ khám')) return;
                              if (isExpired) {
                                showToast(`Khung giờ ${slot.timeSlot} đã qua trong ngày! Vui lòng chọn khung giờ sắp tới hoặc ngày khác.`, 'warning');
                                return;
                              }
                              if (slot.isLocked) {
                                showToast(`Khung giờ ${slot.timeSlot} đang bị tạm khóa bởi Bệnh viện!`, 'warning');
                                return;
                              }
                              if (isFull) {
                                showToast(`Khung giờ ${slot.timeSlot} đã đủ số lượng (${slot.bookedCount}/${slot.maxCapacity})!`, 'warning');
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
                              {isExpired ? (
                                <Tag color="default" style={{ margin: 0, fontSize: 9.5, fontWeight: 700 }}>
                                  ĐÃ QUA GIỜ
                                </Tag>
                              ) : slot.isLocked ? (
                                <Tag color="error" style={{ margin: 0, fontSize: 10, fontWeight: 700 }}>
                                  ĐÃ KHÓA
                                </Tag>
                              ) : isFull ? (
                                <Tag color="warning" style={{ margin: 0, fontSize: 10, fontWeight: 700 }}>
                                  HẾT CHỖ
                                </Tag>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 600,
                                      color: isSelected ? 'rgba(255,255,255,0.9)' : '#0284c7',
                                    }}
                                  >
                                    Còn {remaining} chỗ
                                  </span>
                                  {remaining <= 2 && (
                                    <Tag color="orange" style={{ margin: 0, fontSize: 9, fontWeight: 800, padding: '0 4px', borderRadius: 8 }}>
                                      SẮP ĐẦY
                                    </Tag>
                                  )}
                                </div>
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

              {/* Navigation Bar at Step Date & Slot */}
              <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => {
                    if (isDeptMode) {
                      setCurrentStep(1); // Về bước chọn Bác sĩ của khoa
                    } else {
                      setCurrentStep(0); // Về trang chọn Gói / Bác sĩ / Tái khám
                    }
                  }}
                >
                  {isDeptMode
                    ? 'Quay lại chọn Bác sĩ'
                    : bookingMode === 'byPackage'
                    ? 'Quay lại chọn Gói khám'
                    : bookingMode === 'byDoctor'
                    ? 'Quay lại danh mục Bác sĩ'
                    : 'Quay lại Cổng tái khám'}
                </Button>
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  style={{ backgroundColor: '#0284c7' }}
                  disabled={!selectedSlot}
                  onClick={() => {
                    if (!ensureAuthenticated('điền thông tin bệnh nhân')) return;
                    setCurrentStep(isDeptMode ? 3 : 2);
                  }}
                >
                  Điền thông tin bệnh nhân
                </Button>
              </div>
            </div>
          )}

          {/* ================= BƯỚC THÔNG TIN BỆNH NHÂN & XÁC NHẬN ================= */}
          {/* Step index = 3 (nếu là byDept) hoặc index = 2 (nếu là các mode khác) */}
          {((isDeptMode && currentStep === 3) || (!isDeptMode && currentStep === 2)) && (
            <div>
              <div style={{ marginBottom: 24, textAlign: 'center' }}>
                <Title level={3} style={{ color: '#0369a1', fontWeight: 800, margin: 0 }}>
                  Thông tin người bệnh
                </Title>
                <Text style={{ color: '#64748b', fontSize: 14 }}>
                  Thông tin dùng để xuất phiếu khám và đối soát BHYT
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
                            HỒ SƠ BỆNH NHÂN ĐÃ XÁC THỰC
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
                            Yêu cầu đăng nhập tài khoản
                          </span>
                          <Button
                            size="small"
                            type="primary"
                            icon={<LoginOutlined />}
                            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 600 }}
                            onClick={() => navigate('/login?redirect=/booking')}
                          >
                            Đăng nhập
                          </Button>
                        </div>
                      }
                      description="Đăng nhập tài khoản để lưu hồ sơ khám và nhận mã QR."
                    />
                  )}

                  {/* Chuyển đổi đối tượng đặt khám: Bản thân vs Người thân */}
                  <div className="booking-target-switch-wrap">
                    <button
                      type="button"
                      className={`booking-target-pill ${bookingForTarget === 'self' ? 'active' : ''}`}
                      onClick={() => handleSwitchBookingTarget('self')}
                    >
                      <UserOutlined />
                      <span>Khám cho bản thân</span>
                    </button>
                    <button
                      type="button"
                      className={`booking-target-pill ${bookingForTarget === 'relative' ? 'active' : ''}`}
                      onClick={() => handleSwitchBookingTarget('relative')}
                    >
                      <TeamOutlined />
                      <span>Khám cho người thân</span>
                    </button>
                  </div>

                  {bookingForTarget === 'relative' && (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        marginBottom: 16,
                      }}
                    >
                      <div style={{ color: '#0369a1', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                        Mối quan hệ với người đi khám:
                      </div>
                      <Radio.Group
                        value={relativeRelationship}
                        onChange={(e) => setRelativeRelationship(e.target.value)}
                        style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}
                      >
                        <Radio value="Bố/Mẹ">Bố/Mẹ</Radio>
                        <Radio value="Vợ/Chồng">Vợ/Chồng</Radio>
                        <Radio value="Con cái">Con cái</Radio>
                        <Radio value="Ông/Bà">Ông/Bà</Radio>
                        <Radio value="Người thân khác">Khác</Radio>
                      </Radio.Group>
                    </div>
                  )}

                  <Form form={form} layout="vertical">
                    <Form.Item
                      name="fullName"
                      label="Họ và tên người đi khám"
                      rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                    >
                      <Input
                        prefix={<UserOutlined style={{ color: '#0284c7' }} />}
                        placeholder={bookingForTarget === 'relative' ? 'Nhập họ tên người thân cần khám' : 'Ví dụ: Nguyễn Văn An'}
                        size="large"
                        style={{ borderRadius: 10 }}
                      />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col xs={24} sm={14}>
                        <Form.Item
                          name="phoneNumber"
                          label="Số điện thoại nhận phiếu & SMS"
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
                          rules={[
                            { required: true, message: 'Vui lòng nhập năm sinh' },
                            { pattern: /^(19[2-9]\d|20[0-2]\d)$/, message: 'Năm sinh hợp lệ từ 1920 đến nay' },
                          ]}
                        >
                          <Input placeholder="Ví dụ: 1995" size="large" style={{ borderRadius: 10 }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="identityNumber"
                          label="Số CCCD (12 số) hoặc CMND (9 số)"
                          rules={[
                            { pattern: /^\d{9}(\d{3})?$/, message: 'Số CCCD gồm 12 chữ số (hoặc CMND cũ 9 chữ số)' },
                          ]}
                        >
                          <Input
                            prefix={<IdcardOutlined style={{ color: '#0284c7' }} />}
                            placeholder="07909200xxxx (12 số)"
                            size="large"
                            style={{ borderRadius: 10, fontFamily: 'monospace' }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* Cảnh báo độ tuổi Khoa Nhi */}
                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) => prevValues.birthYear !== currentValues.birthYear}
                    >
                      {({ getFieldValue }) => {
                        const by = Number(getFieldValue('birthYear'));
                        const currentYear = new Date().getFullYear();
                        const isPediatric = selectedDept?.name?.toLowerCase().includes('nhi');
                        if (isPediatric && by && currentYear - by > 16) {
                          return (
                            <Alert
                              type="warning"
                              showIcon
                              message="Lưu ý độ tuổi khám Khoa Nhi"
                              description="Khoa Nhi chuyên tiếp nhận bệnh nhi từ 0 đến dưới 16 tuổi. Nếu người khám từ 16 tuổi trở lên, hệ thống khuyến nghị bạn nên chọn Khoa Nội Tổng Hợp để được bác sĩ chuyên khoa thăm khám phù hợp nhất."
                              style={{ marginBottom: 16, borderRadius: 10 }}
                            />
                          );
                        }
                        return null;
                      }}
                    </Form.Item>

                    <Form.Item name="appointmentType" label="Hình thức khám" initialValue={bookingMode === 'byFollowUp' ? 'FollowUp' : 'New'}>
                      <Radio.Group size="large" style={{ width: '100%' }}>
                        <Row gutter={12}>
                          <Col xs={24} sm={12}>
                            <Radio.Button
                              value="New"
                              style={{ width: '100%', textAlign: 'center', height: 42, lineHeight: '40px', borderRadius: 8, fontWeight: 700, marginBottom: 8 }}
                            >
                              Khám mới
                            </Radio.Button>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Radio.Button
                              value="FollowUp"
                              style={{ width: '100%', textAlign: 'center', height: 42, lineHeight: '40px', borderRadius: 8, fontWeight: 700, color: '#0284c7', marginBottom: 8 }}
                            >
                              Tái khám định kỳ
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
                              backgroundColor: '#f0f9ff',
                              border: '1px solid #bae6fd',
                              marginBottom: 16,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#0369a1', marginBottom: 10 }}>
                              <HistoryOutlined style={{ color: '#0284c7' }} />
                              <span>Thông tin tái khám theo chỉ định</span>
                            </div>
                            <Row gutter={12}>
                              <Col xs={24} sm={12}>
                                <Form.Item
                                  name="previousRecordCode"
                                  label="Mã bệnh án (EMR) hoặc mã đơn thuốc cũ"
                                  style={{ marginBottom: 8 }}
                                >
                                  <Input
                                    prefix={<HistoryOutlined style={{ color: '#0284c7' }} />}
                                    placeholder="Ví dụ: EMR2026-0015"
                                    style={{ borderRadius: 8, fontFamily: 'monospace' }}
                                  />
                                </Form.Item>
                              </Col>
                              <Col xs={24} sm={12}>
                                <Form.Item
                                  name="followUpNotes"
                                  label="Lời dặn hoặc ghi chú tái khám"
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
                          <SafetyCertificateOutlined style={{ marginRight: 6 }} /> Áp dụng Bảo hiểm Y tế (BHYT)
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          Giảm trực tiếp <strong>{selectedPackage ? selectedPackage.bhytSupport.toLocaleString('vi-VN') : '42.100'} đ</strong> khi xuất trình thẻ tại viện.
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
                        Hình thức thanh toán viện phí:
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
                                  Ưu tiên vào thẳng buồng khám, không qua quầy
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
                                  Thanh toán tại Kiosk / Viện
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>
                                  Thanh toán tại quầy tiếp đón hoặc kiosk sảnh
                                </div>
                              </div>
                            </div>
                            <Radio checked={paymentMethod === 'kiosk'} />
                          </div>
                        </Col>
                      </Row>
                    </div>

                    <Form.Item name="symptoms" label="Triệu chứng hoặc lý do khám">
                      <Input.TextArea
                        rows={3}
                        placeholder="Mô tả triệu chứng (ví dụ: đau đầu, sốt nhẹ, ho kéo dài...)"
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
                        <div className="summary-card-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <MedicineBoxOutlined style={{ color: '#0284c7', fontSize: 18 }} />
                            <span style={{ fontWeight: 800, fontSize: 14.5, color: '#0369a1', letterSpacing: '-0.01em' }}>
                              PHIẾU TẠM TÍNH DỊCH VỤ KHÁM
                            </span>
                          </div>
                          <Tag color="cyan" style={{ margin: 0, fontWeight: 700, borderRadius: 12, fontSize: 11 }}>
                            Tiếp nhận 1 chạm
                          </Tag>
                        </div>

                        <div className="summary-details-list">
                          {selectedPackage ? (
                            <div className="summary-item-row">
                              <span className="summary-item-label">Gói khám:</span>
                              <strong className="summary-item-value highlight">{selectedPackage.name}</strong>
                            </div>
                          ) : (
                            <div className="summary-item-row">
                              <span className="summary-item-label">Chuyên khoa:</span>
                              <strong className="summary-item-value highlight">{selectedDept.name}</strong>
                            </div>
                          )}

                          <div className="summary-item-row">
                            <span className="summary-item-label">Vị trí phòng khám:</span>
                            <span className="summary-item-value location-badge"><EnvironmentOutlined style={{ marginRight: 4 }} />{selectedDept.location}</span>
                          </div>

                          <div className="summary-item-row">
                            <span className="summary-item-label">Bác sĩ khám:</span>
                            <strong className="summary-item-value">{selectedDoctor?.name || `BS. Trực ca ${selectedDept.name.replace(/^Khoa\s+/i, '')}`}</strong>
                          </div>

                          <div className="summary-item-row">
                            <span className="summary-item-label">Ngày khám:</span>
                            <strong className="summary-item-value text-sky">
                              {dayjs(selectedDate).format('DD/MM/YYYY')}
                            </strong>
                          </div>

                          <div className="summary-item-row">
                            <span className="summary-item-label">Khung giờ hẹn:</span>
                            <Tag color="processing" style={{ margin: 0, fontWeight: 800, fontSize: 12.5, borderRadius: 6 }}>
                              {selectedSlot}
                            </Tag>
                          </div>
                        </div>

                        <div className="summary-divider-dashed" />

                        <div className="summary-pricing-breakdown">
                          <div className="summary-item-row">
                            <span className="summary-item-label">Giá khám niêm yết:</span>
                            <span className="summary-item-value">{pricing.basePrice.toLocaleString('vi-VN')} đ</span>
                          </div>

                          <div className="summary-item-row">
                            <span className="summary-item-label">Hỗ trợ BHYT:</span>
                            <span style={{ color: hasBhyt ? '#15803d' : '#94a3b8', fontWeight: 700 }}>
                              {hasBhyt ? `-${pricing.effectiveBhyt.toLocaleString('vi-VN')} đ` : '0 đ (Chưa áp dụng)'}
                            </span>
                          </div>

                          <div className="summary-item-row">
                            <span className="summary-item-label">Phương thức:</span>
                            <Tag color={paymentMethod === 'vietqr' ? 'blue' : 'default'} style={{ margin: 0, fontWeight: 700 }}>
                              {paymentMethod === 'vietqr' ? 'VietQR Napas 247' : 'Kiosk tại viện'}
                            </Tag>
                          </div>
                        </div>

                        <div className="summary-divider-dashed" />

                        <div className="summary-total-box">
                          <div className="summary-total-label">TỔNG TIỀN TẠM TÍNH:</div>
                          <div className="summary-total-amount">
                            {pricing.finalTotal.toLocaleString('vi-VN')} <span style={{ fontSize: 14 }}>VNĐ</span>
                          </div>
                        </div>

                        <div className="summary-guarantee-note">
                          {paymentMethod === 'vietqr' ? (
                            <span>Thanh toán trực tuyến qua VietQR được cấp <strong>Thẻ Khám Ưu Tiên</strong>. Đến viện vào thẳng buồng khám theo giờ hẹn!</span>
                          ) : (
                            <span>Sau khi đặt thành công, hệ thống cấp <strong>Mã QR Tiếp Nhận</strong>. Quý khách quét QR tại Kiosk sảnh A để thanh toán và nhận số phòng.</span>
                          )}
                        </div>

                        <Button
                          type="primary"
                          size="large"
                          className="booking-submit-btn"
                          loading={bookingLoading}
                          onClick={handleCompleteBooking}
                          block
                        >
                          XÁC NHẬN ĐẶT LỊCH NGAY
                        </Button>

                        <div className="summary-trust-badge">
                          <span><SafetyCertificateOutlined style={{ marginRight: 6 }} />Bảo mật thông tin bệnh án theo chuẩn Bộ Y Tế</span>
                        </div>
                      </div>
                    );
                  })()}
                </Col>
              </Row>

              <div style={{ marginTop: 24 }}>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setCurrentStep(isDeptMode ? 2 : 1)}
                >
                  Quay lại đổi giờ khám
                </Button>
              </div>
            </div>
          )}

          {/* ================= BƯỚC HOÀN TẤT: PHIẾU KHÁM QR & MÃ VIETQR ================= */}
          {currentStep === completionStepIndex && createdAppointment && (
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
                Đặt khám thành công
              </Title>
              <Paragraph style={{ color: '#64748b', fontSize: 14, maxWidth: 550, margin: '0 auto 24px' }}>
                Lịch hẹn đã được xác nhận. Vui lòng <strong>lưu mã QR</strong> hoặc thanh toán trực tuyến qua <strong>VietQR</strong> bên dưới để nhận Thẻ Khám Ưu Tiên.
              </Paragraph>

              <Row gutter={[24, 24]} style={{ maxWidth: 1000, margin: '0 auto 24px', textAlign: 'left' }}>
                {/* Thẻ 1: Phiếu Khám Tiếp Nhận Điện Tử */}
                <Col xs={24} md={paymentMethod === 'vietqr' ? 12 : 24}>
                  <div id="qr-ticket-card" className="qr-ticket-wrapper" style={{ height: '100%' }}>
                    <div style={{ marginBottom: 10, textAlign: 'center' }}>
                      <img
                        src="/logo.png"
                        alt="Bệnh viện Đa khoa D-Medical"
                        style={{ height: 42, objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <Tag color="cyan" style={{ fontSize: 12, padding: '3px 12px', borderRadius: 20, fontWeight: 800 }}>
                        Phiếu Khám Điện Tử • Check-in QR
                      </Tag>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b', textAlign: 'center', marginTop: 4, marginBottom: 12 }}>
                      (Quét mã tại kiosk hoặc quầy tiếp đón để vào thẳng buồng khám)
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'inline-block',
                          padding: 12,
                          backgroundColor: '#ffffff',
                          borderRadius: 14,
                          border: '2px solid #bae6fd',
                          margin: '4px 0 8px',
                        }}
                      >
                        <QRCodeSVG
                          value={createdAppointment.qrCode || `MEDQR|${createdAppointment.id}|${createdAppointment.patientCode}`}
                          size={160}
                          level="H"
                          fgColor="#0369a1"
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 16, color: '#0284c7' }}>
                          {createdAppointment.id.toUpperCase()}
                        </span>
                        <Tooltip title="Sao chép mã phiếu hẹn">
                          <Button
                            size="small"
                            type="text"
                            icon={<CopyOutlined style={{ color: '#0284c7', fontSize: 14 }} />}
                            onClick={() => {
                              navigator.clipboard.writeText(createdAppointment.id.toUpperCase());
                              showToast('Đã sao chép mã phiếu hẹn!', 'success');
                            }}
                            style={{ padding: '2px 6px', height: 'auto' }}
                          />
                        </Tooltip>
                      </div>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
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
                      {selectedPackage && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Gói khám:</span>
                          <strong style={{ color: '#0284c7' }}>{selectedPackage.name}</strong>
                        </div>
                      )}
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
                          {createdAppointment.appointmentTime} • {dayjs(createdAppointment.appointmentDate).format('DD/MM/YYYY')}
                        </strong>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 14,
                        padding: '10px 12px',
                        borderRadius: 8,
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        fontSize: 12,
                        color: '#0369a1',
                      }}
                    >
                      Đến bệnh viện trước 15 phút và quét mã QR tại Kiosk sảnh A để nhận số phòng khám.
                    </div>
                  </div>
                </Col>

                {/* Thẻ 2: Thanh Toán Viện Phí Qua VietQR (Chỉ hiển thị nếu chọn VietQR) */}
                {paymentMethod === 'vietqr' && (
                  <Col xs={24} md={12}>
                    <div className={`vietqr-wrapper-card ${isVietQrPaid ? 'paid' : ''}`}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: 14.5, color: '#0369a1' }}>
                          THANH TOÁN VIETQR NAPAS 247
                        </span>
                        {isVietQrPaid ? (
                          <Tag color="green" style={{ margin: 0, fontWeight: 800, padding: '2px 10px', borderRadius: 12 }}>
                            ĐÃ THANH TOÁN
                          </Tag>
                        ) : (
                          <Tag color="orange" style={{ margin: 0, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
                            CHỜ CHUYỂN KHOẢN
                          </Tag>
                        )}
                      </div>

                      <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px' }}>
                        Mở App Ngân hàng bất kỳ hoặc Ví điện tử để quét mã thanh toán viện phí trực tuyến:
                      </p>

                      <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <div
                          style={{
                            display: 'inline-block',
                            padding: 10,
                            backgroundColor: '#ffffff',
                            borderRadius: 14,
                            border: '1.5px solid #bae6fd',
                            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.1)',
                          }}
                        >
                          <img
                            src={`https://img.vietqr.io/image/MB-1990002026-compact2.png?amount=${calculatePricing().finalTotal}&addInfo=${encodeURIComponent(`KHAM ${createdAppointment.id.toUpperCase()} ${createdAppointment.patientPhone}`)}&accountName=BV%20DA%20KHOA%20HOSPITAL%20AI`}
                            alt="Mã VietQR Thanh Toán Viện Phí"
                            style={{ width: 175, height: 'auto', display: 'block' }}
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          backgroundColor: '#f8fafc',
                          padding: '12px 14px',
                          borderRadius: 10,
                          border: '1px solid #e2e8f0',
                          fontSize: 12.5,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          marginBottom: 12,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Ngân hàng:</span>
                          <strong style={{ color: '#0f172a' }}>MB Bank (Quân Đội)</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Số tài khoản:</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0284c7', fontSize: 13 }}>
                            1990002026{' '}
                            <Button
                              type="text"
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={() => {
                                navigator.clipboard.writeText('1990002026');
                                showToast('Đã sao chép số tài khoản!', 'success');
                              }}
                            />
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Chủ tài khoản:</span>
                          <strong style={{ color: '#0f172a' }}>BV DA KHOA HOSPITAL AI</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Số tiền:</span>
                          <strong style={{ color: '#0284c7', fontSize: 14 }}>
                            {calculatePricing().finalTotal.toLocaleString('vi-VN')} VNĐ
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Nội dung CK:</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#334155', fontSize: 11.5 }}>
                            {`KHAM ${createdAppointment.id.toUpperCase()}`}{' '}
                            <Button
                              type="text"
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={() => {
                                navigator.clipboard.writeText(`KHAM ${createdAppointment.id.toUpperCase()} ${createdAppointment.patientPhone}`);
                                showToast('Đã sao chép nội dung chuyển khoản!', 'success');
                              }}
                            />
                          </span>
                        </div>
                      </div>

                      <div style={{ marginTop: 'auto' }}>
                        {isVietQrPaid ? (
                          <div
                            style={{
                              padding: 10,
                              borderRadius: 8,
                              backgroundColor: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#065f46',
                              textAlign: 'center',
                              fontSize: 12.5,
                              fontWeight: 700,
                            }}
                          >
                            <CheckCircleFilled style={{ color: '#10b981', marginRight: 6 }} />
                            Đã xác nhận thanh toán! Bạn được cấp Thẻ Khám Ưu Tiên vào thẳng buồng khám.
                          </div>
                        ) : (
                          <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            style={{
                              backgroundColor: '#10b981',
                              borderColor: '#10b981',
                              fontWeight: 700,
                              height: 40,
                              borderRadius: 10,
                            }}
                            block
                            onClick={() => {
                              setIsVietQrPaid(true);
                              showSuccessAlert(
                                'Thanh Toán Thành Công!',
                                'Hệ thống đã ghi nhận thanh toán VietQR của bạn. Bạn được cấp quyền Thẻ Khám Ưu Tiên, đến viện vào thẳng buồng khám theo giờ hẹn!'
                              );
                            }}
                          >
                            Tôi Đã Chuyển Khoản Thành Công
                          </Button>
                        )}
                      </div>
                    </div>
                  </Col>
                )}
              </Row>

              {/* Action Buttons */}
              <div className="ticket-action-btns" style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Button
                  icon={<PrinterOutlined />}
                  size="large"
                  onClick={() => window.print()}
                  style={{ fontWeight: 600, borderRadius: 10 }}
                >
                  In phiếu khám
                </Button>

                <Button
                  icon={<DownloadOutlined />}
                  size="large"
                  onClick={handleDownloadQrImage}
                  style={{ borderColor: '#bae6fd', color: '#0369a1', fontWeight: 600, borderRadius: 10 }}
                >
                  Lưu ảnh QR
                </Button>

                <Button
                  icon={<CalendarOutlined style={{ color: '#0284c7' }} />}
                  size="large"
                  style={{ borderColor: '#bae6fd', color: '#0369a1', fontWeight: 600, borderRadius: 10 }}
                  onClick={() => {
                    const title = encodeURIComponent(`Lịch Khám D-Medical: ${createdAppointment.departmentName}`);
                    const details = encodeURIComponent(
                      `Bác sĩ: ${createdAppointment.doctorName}\nMã phiếu: ${createdAppointment.id.toUpperCase()}\nĐịa chỉ: 215 Hồng Bàng, P.11, Q.5, TP.HCM\nQuét mã QR tại Kiosk để vào khám.`
                    );
                    const location = encodeURIComponent('Bệnh viện Đa khoa D-Medical, 215 Hồng Bàng, Quận 5, TP.HCM');
                    const datePart = dayjs(createdAppointment.appointmentDate).format('YYYY-MM-DD');
                    const slotText = selectedSlot || createdAppointment.appointmentTime || '08:00 - 08:30';
                    const timeParts = slotText.split('-').map((t) => t.trim());
                    const startStr = timeParts[0] || '08:00';
                    const endStr = timeParts[1] || dayjs(`${datePart} ${startStr}`).add(30, 'minute').format('HH:mm');
                    const startUtc = dayjs(`${datePart} ${startStr}`).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                    const endUtc = dayjs(`${datePart} ${endStr}`).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startUtc}/${endUtc}`;
                    window.open(url, '_blank');
                  }}
                >
                  Thêm vào Google Calendar
                </Button>

                {createdAppointment.status !== 'Cancelled' && createdAppointment.status !== 'Completed' && (
                  <>
                    <Button
                      icon={<SwapOutlined />}
                      size="large"
                      style={{ borderColor: '#0284c7', color: '#0284c7', fontWeight: 700, borderRadius: 10 }}
                      onClick={() => handleOpenReschedule(createdAppointment)}
                    >
                      Đổi giờ khám
                    </Button>
                    <Button
                      danger
                      icon={<CloseCircleOutlined />}
                      size="large"
                      style={{ fontWeight: 700, borderRadius: 10 }}
                      onClick={() => handleOpenCancel(createdAppointment)}
                    >
                      Hủy lịch hẹn
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
                  Đặt lịch mới
                </Button>
                <Button
                  size="large"
                  icon={<HomeOutlined />}
                  onClick={() => navigate('/')}
                  style={{ fontWeight: 600, borderRadius: 10 }}
                >
                  Về Trang Chủ
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>

      {/* MODAL TRA CỨU LỊCH HẸN & XEM LẠI MÃ QR */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0369a1', fontSize: 16 }}>
            <SearchOutlined />
            <span>Tra cứu lịch hẹn khám</span>
          </div>
        }
        open={lookupModalOpen}
        onCancel={() => setLookupModalOpen(false)}
        footer={null}
        width={640}
        style={{ maxWidth: '95vw', margin: '16px auto' }}
        styles={{ body: { maxHeight: '78vh', overflowY: 'auto' } }}
        centered
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
            Nhập số điện thoại hoặc mã phiếu hẹn để kiểm tra lịch khám, lấy mã QR hoặc đổi/hủy lịch hẹn:
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
                  Khám mới
                </Button>
                <Button
                  size="small"
                  type={lookupTypeFilter === 'FollowUp' ? 'primary' : 'default'}
                  onClick={() => setLookupTypeFilter('FollowUp')}
                  style={{
                    borderRadius: 16,
                    fontWeight: 600,
                    backgroundColor: lookupTypeFilter === 'FollowUp' ? '#0284c7' : undefined,
                  }}
                >
                  Tái khám
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
                  const canModify = !isCancelled && !isCompleted;

                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: 16,
                        borderRadius: 14,
                        border: isCancelled ? '1px dashed #cbd5e1' : '1px solid #bae6fd',
                        backgroundColor: isCancelled ? '#f8fafc' : '#f0f9ff',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: 15, color: '#0f172a' }}>{item.patientName}</strong>
                            <Tag color="cyan" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                              {item.patientCode}
                            </Tag>
                            <Tag color={isCancelled ? 'error' : isCompleted ? 'cyan' : 'green'}>
                              {isCancelled ? 'Đã hủy' : isCompleted ? 'Đã tiếp nhận (QR)' : 'Chờ khám'}
                            </Tag>
                          </div>
                          <div style={{ fontSize: 13, color: '#0284c7', fontWeight: 700, marginTop: 4 }}>
                            {item.departmentName} • {item.doctorName}
                          </div>
                          <div style={{ fontSize: 12.5, color: '#334155', marginTop: 2 }}>
                            Giờ khám: <strong>{item.appointmentTime}</strong> ngày <strong>{dayjs(item.appointmentDate).format('DD/MM/YYYY')}</strong>
                          </div>
                        </div>

                        {!isCancelled && (
                          <div style={{ textAlign: 'center', flexShrink: 0 }}>
                            <div style={{ padding: 4, background: '#fff', borderRadius: 8, border: '1px solid #bae6fd' }}>
                              <QRCodeSVG value={item.qrCode || `MEDQR|${item.id}`} size={64} level="M" fgColor="#0369a1" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #e0f2fe', paddingTop: 8 }}>
                        <Button
                          size="small"
                          icon={<QrcodeOutlined />}
                          style={{ borderColor: '#bae6fd', color: '#0369a1', fontWeight: 600 }}
                          onClick={() => {
                            setViewingTicketAppointment(item);
                            setTicketDetailModalOpen(true);
                          }}
                        >
                          Xem Phiếu & QR To
                        </Button>
                        {canModify && (
                          <>
                            <Button
                              size="small"
                              icon={<SwapOutlined />}
                              style={{ borderColor: '#0284c7', color: '#0284c7', fontWeight: 700 }}
                              onClick={() => handleOpenReschedule(item)}
                            >
                              Đổi Giờ
                            </Button>
                            <Button
                              size="small"
                              danger
                              icon={<CloseCircleOutlined />}
                              onClick={() => handleOpenCancel(item)}
                            >
                              Hủy Lịch
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : lookupPhone && !lookupLoading ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
              Không tìm thấy lịch hẹn phù hợp.
            </div>
          ) : null}
        </div>
      </Modal>

      {/* MODAL XEM CHI TIẾT PHIẾU KHÁM & MÃ QR TO TRONG TRA CỨU */}
      <Modal
        title={<span style={{ color: '#0369a1', fontWeight: 800 }}>Phiếu Tiếp Nhận Khám Điện Tử</span>}
        open={ticketDetailModalOpen}
        onCancel={() => setTicketDetailModalOpen(false)}
        footer={null}
        width={480}
        centered
        destroyOnClose
      >
        {viewingTicketAppointment && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ display: 'inline-block', padding: 14, background: '#fff', borderRadius: 16, border: '2px solid #bae6fd', marginBottom: 12 }}>
              <QRCodeSVG
                value={viewingTicketAppointment.qrCode || `MEDQR|${viewingTicketAppointment.id}|${viewingTicketAppointment.patientCode}`}
                size={180}
                level="H"
                fgColor="#0369a1"
              />
            </div>
            <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 16, color: '#0284c7' }}>
              {viewingTicketAppointment.id.toUpperCase()}
            </div>
            <Divider style={{ margin: '14px 0' }} />
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              <div><strong>Bệnh nhân:</strong> {viewingTicketAppointment.patientName} ({viewingTicketAppointment.patientCode})</div>
              <div><strong>Chuyên khoa:</strong> {viewingTicketAppointment.departmentName}</div>
              <div><strong>Bác sĩ:</strong> {viewingTicketAppointment.doctorName}</div>
              <div><strong>Giờ khám:</strong> {viewingTicketAppointment.appointmentTime} ngày {dayjs(viewingTicketAppointment.appointmentDate).format('DD/MM/YYYY')}</div>
            </div>
            <div style={{ marginTop: 16 }}>
              <Button type="primary" style={{ backgroundColor: '#0284c7' }} onClick={() => window.print()} block>
                In Phiếu Khám Này
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL ĐỔI LỊCH */}
      <Modal
        title={<span style={{ color: '#0369a1', fontWeight: 800 }}>Đổi Lịch Khám - Mã {reschedulingAppointment?.id.toUpperCase()}</span>}
        open={rescheduleModalOpen}
        onCancel={() => setRescheduleModalOpen(false)}
        footer={null}
        width={560}
        centered
        destroyOnClose
      >
        {reschedulingAppointment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>1. Chọn ngày khám mới:</div>
              <Input
                type="date"
                value={rescheduleDate}
                min={dayjs().format('YYYY-MM-DD')}
                onChange={(e) => handleChangeRescheduleDate(e.target.value)}
                style={{ width: '100%', borderRadius: 8, padding: '8px 12px' }}
              />
            </div>

            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>2. Chọn khung giờ khám mới:</div>
              {rescheduleSlotsLoading ? (
                <div style={{ textAlign: 'center', padding: 20 }}><Spin /></div>
              ) : (
                <Row gutter={[8, 8]}>
                  {rescheduleSlots.map((slot: any) => {
                    const isSelected = rescheduleSlot === slot.timeSlot;
                    const isExpired = isSlotPast(slot.timeSlot, rescheduleDate);
                    const isBlocked = slot.isLocked || slot.bookedCount >= slot.maxCapacity || isExpired;

                    return (
                      <Col xs={12} sm={8} key={slot.id}>
                        <div
                          onClick={() => {
                            if (isBlocked) {
                              showToast(isExpired ? 'Khung giờ này đã qua trong ngày!' : 'Khung giờ này đã đầy chỗ hoặc bị khóa!', 'warning');
                              return;
                            }
                            setRescheduleSlot(slot.timeSlot);
                          }}
                          style={{
                            padding: '8px 4px',
                            textAlign: 'center',
                            borderRadius: 8,
                            cursor: isBlocked ? 'not-allowed' : 'pointer',
                            background: isBlocked ? '#f1f5f9' : isSelected ? '#0284c7' : '#fff',
                            color: isBlocked ? '#94a3b8' : isSelected ? '#fff' : '#0f172a',
                            border: isSelected ? '2px solid #0284c7' : '1px solid #bae6fd',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          <div style={{ textDecoration: isBlocked ? 'line-through' : 'none' }}>{slot.timeSlot}</div>
                          {isExpired ? (
                            <Tag color="default" style={{ margin: 0, fontSize: 9 }}>ĐÃ QUA GIỜ</Tag>
                          ) : slot.bookedCount >= slot.maxCapacity ? (
                            <Tag color="warning" style={{ margin: 0, fontSize: 9 }}>HẾT CHỖ</Tag>
                          ) : (
                            <span style={{ fontSize: 10, color: isSelected ? '#fff' : '#0284c7' }}>
                              Còn {slot.maxCapacity - slot.bookedCount} chỗ
                            </span>
                          )}
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
              <Button onClick={() => setRescheduleModalOpen(false)}>Hủy</Button>
              <Button
                type="primary"
                style={{ backgroundColor: '#0284c7' }}
                disabled={!rescheduleSlot}
                loading={rescheduleSubmitting}
                onClick={handleConfirmReschedule}
              >
                Xác Nhận Đổi Lịch
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL HỦY LỊCH */}
      <Modal
        title={<span style={{ color: '#ef4444', fontWeight: 800 }}>Xác Nhận Hủy Lịch Khám</span>}
        open={cancelModalOpen}
        onCancel={() => setCancelModalOpen(false)}
        footer={null}
        width={460}
        centered
        destroyOnClose
      >
        {cancellingAppointment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p>Bạn có chắc chắn muốn hủy lịch hẹn khám của <strong>{cancellingAppointment.patientName}</strong> lúc <strong>{cancellingAppointment.appointmentTime} ngày {dayjs(cancellingAppointment.appointmentDate).format('DD/MM/YYYY')}</strong>?</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setCancelModalOpen(false)}>Giữ Lại Lịch</Button>
              <Button danger type="primary" loading={cancelSubmitting} onClick={handleConfirmCancel}>
                Xác Nhận Hủy
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Detail Modals */}
      <Modal
        title={<span style={{ color: '#0369a1', fontWeight: 800 }}>Hồ Sơ Bác Sĩ</span>}
        open={doctorDetailModalOpen}
        onCancel={() => setDoctorDetailModalOpen(false)}
        footer={null}
        width={600}
        centered
        destroyOnClose
      >
        {viewingDoctor && (
          <div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
              <Avatar src={viewingDoctor.avatar} size={76} style={{ border: '2px solid #0284c7' }} />
              <div>
                <h3 style={{ margin: 0, color: '#0f172a' }}>{viewingDoctor.name}</h3>
                <div style={{ color: '#0284c7', fontWeight: 600 }}>{viewingDoctor.department}</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>{viewingDoctor.title}</div>
              </div>
            </div>
            <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.6 }}>{viewingDoctor.bio}</p>
            <Button
              type="primary"
              style={{ backgroundColor: '#0284c7', marginTop: 10 }}
              block
              onClick={() => {
                setDoctorDetailModalOpen(false);
                handleSelectDoctorDirect(viewingDoctor);
              }}
            >
              Đặt Lịch Khám Với Bác Sĩ Này
            </Button>
          </div>
        )}
      </Modal>

      <Modal
        title={<span style={{ color: '#0369a1', fontWeight: 800 }}>Chi Tiết Gói Khám</span>}
        open={packageDetailModalOpen}
        onCancel={() => setPackageDetailModalOpen(false)}
        footer={null}
        width={620}
        centered
        destroyOnClose
      >
        {viewingPackage && (
          <div>
            <h3 style={{ margin: '0 0 6px', color: '#0f172a' }}>{viewingPackage.name}</h3>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0284c7', marginBottom: 12 }}>
              {viewingPackage.discountPrice.toLocaleString('vi-VN')} đ{' '}
              <span style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'line-through' }}>
                {viewingPackage.originalPrice.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Danh mục khám bao gồm:</div>
            <ul style={{ paddingLeft: 18, color: '#475569', fontSize: 13 }}>
              {viewingPackage.items.map((item, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>{item}</li>
              ))}
            </ul>
            <Button
              type="primary"
              style={{ backgroundColor: '#0284c7', marginTop: 14 }}
              block
              onClick={() => {
                setPackageDetailModalOpen(false);
                handleSelectPackage(viewingPackage);
              }}
            >
              Đăng Ký Gói Khám Này
            </Button>
          </div>
        )}
      </Modal>

      {/* AI Drawer, Login, Profile */}
      <AIChatDrawer open={aiDrawerOpen} onClose={() => setAiDrawerOpen(false)} />
      <RequireLoginModal
        open={requireLoginModalOpen}
        onCancel={() => setRequireLoginModalOpen(false)}
        actionTitle={requireLoginActionTitle}
        redirectPath="/booking"
      />
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

      {/* Portal Footer */}
      <PatientPortalFooter />
    </div>
  );
};

export default PatientBookingPage;
