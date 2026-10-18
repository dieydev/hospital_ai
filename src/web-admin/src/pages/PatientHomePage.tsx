import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Row,
  Col,
  Typography,
  Input,
  Button,
  Avatar,
  Tag,
  Modal,
  Collapse,
  Carousel,
  Spin,
  Divider,
} from 'antd';
import {
  MedicineBoxOutlined,
  UserOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
  LeftOutlined,
  RightOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  PhoneFilled,
  ShopOutlined,
  ScanOutlined,
  SwapOutlined,
  CloseCircleOutlined,
  SoundOutlined,
  CalendarOutlined,
  VideoCameraOutlined,
  ExperimentOutlined,
  CustomerServiceOutlined,
  AuditOutlined,
  TeamOutlined,
  HomeOutlined,
  HeartOutlined,
  EnvironmentOutlined,
  PlayCircleFilled,
  PlayCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '../store/useAuthStore';
import { appointmentService, OnlineAppointmentItem } from '../services/appointmentService';
import { showToast, showSuccessAlert, showErrorAlert } from '../utils/sweetAlert';
import { CompleteProfileModal } from '../components/CompleteProfileModal';
import { RequireLoginModal } from '../components/RequireLoginModal';
import { PatientPortalHeader } from '../components/PatientPortalHeader';
import { PatientPortalFooter } from '../components/PatientPortalFooter';
import { AIChatDrawer } from '../components/AIChatDrawer';
import {
  DEPARTMENTS_CATALOG,
  DOCTORS_CATALOG,
  HEALTH_PACKAGES_CATALOG,
  DoctorOption,
  HealthPackageOption,
} from '../data/medicalCatalogs';
import './PatientBookingPage.css';

const { Title, Paragraph } = Typography;

export interface HospitalVideoItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  resolution: string;
  thumbnail: string;
  videoUrl: string;
  tag: string;
  badgeColor?: string;
}

export const HOSPITAL_VIDEOS: HospitalVideoItem[] = [
  {
    id: 'v1',
    title: 'Khuôn viên khám bệnh & Hệ thống phòng mổ vô khuẩn Hybrid',
    description: 'Quy mô hơn 500 giường bệnh tiện nghi, hệ thống phòng mổ áp lực dương vô khuẩn một chiều và trung tâm chẩn đoán hình ảnh kỹ thuật cao.',
    duration: '03:45',
    category: 'Cơ sở vật chất',
    resolution: 'Full HD 1080p',
    thumbnail: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    tag: 'Cơ sở vật chất',
    badgeColor: '#0284c7',
  },
  {
    id: 'v2',
    title: 'Quy trình tiếp nhận tự động qua Kiosk QR Code',
    description: 'Hướng dẫn chi tiết quy trình đặt lịch trước, nhận mã QR thông minh và làm thủ tục check-in tự động tại sảnh A không cần bốc số.',
    duration: '02:18',
    category: 'Hướng dẫn người bệnh',
    resolution: 'Full HD 1080p',
    thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    tag: 'Tiếp nhận thông minh',
    badgeColor: '#059669',
  },
  {
    id: 'v3',
    title: 'Ứng dụng công nghệ hỗ trợ bác sĩ chẩn đoán & cảnh báo kê đơn',
    description: 'Cơ chế hoạt động của Hospital AI: Hỗ trợ phân tích phim chụp MRI/CT và tự động kiểm tra cảnh báo dị ứng, tương tác thuốc theo Dược thư.',
    duration: '04:12',
    category: 'Công nghệ y khoa',
    resolution: 'Full HD 1080p',
    thumbnail: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    tag: 'Công nghệ chẩn đoán',
    badgeColor: '#0369a1',
  },
  {
    id: 'v4',
    title: 'Tư vấn chuyên khoa & Tầm soát sớm nguy cơ tim mạch',
    description: 'Bác sĩ chuyên khoa II chia sẻ về các dấu hiệu cảnh báo bệnh lý tim mạch, phình mạch máu và các bước thăm khám định kỳ.',
    duration: '03:30',
    category: 'Tư vấn sức khỏe',
    resolution: 'Full HD 1080p',
    thumbnail: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    tag: 'Tư vấn chuyên gia',
    badgeColor: '#0284c7',
  },
];

export const PatientHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, syncCurrentUser } = useAuthStore();

  useEffect(() => {
    syncCurrentUser();
  }, [syncCurrentUser])

  // Search omnibar & instant suggestions
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [marqueeDismissed, setMarqueeDismissed] = useState(false);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchSuggestions = useMemo(() => {
    if (!normalizedQuery || normalizedQuery.length < 2) return null;
    const depts = DEPARTMENTS_CATALOG.filter(
      (d) => d.name.toLowerCase().includes(normalizedQuery) || d.description.toLowerCase().includes(normalizedQuery)
    ).slice(0, 3);
    const docs = DOCTORS_CATALOG.filter(
      (doc) =>
        doc.name.toLowerCase().includes(normalizedQuery) ||
        doc.department.toLowerCase().includes(normalizedQuery) ||
        doc.title.toLowerCase().includes(normalizedQuery)
    ).slice(0, 3);
    const pkgs = HEALTH_PACKAGES_CATALOG.filter(
      (p) =>
        p.name.toLowerCase().includes(normalizedQuery) ||
        p.category.toLowerCase().includes(normalizedQuery) ||
        p.recommendedFor.toLowerCase().includes(normalizedQuery)
    ).slice(0, 3);
    const totalCount = depts.length + docs.length + pkgs.length;
    return totalCount > 0 ? { depts, docs, pkgs, totalCount } : null;
  }, [normalizedQuery]);

  // Hospital Video Section States
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [isPlayingInline, setIsPlayingInline] = useState(false);
  const mainVideoRef = useRef<HTMLVideoElement>(null);

  const currentVideo = HOSPITAL_VIDEOS[activeVideoIndex];

  const handleSelectVideo = (index: number) => {
    setActiveVideoIndex(index);
    setIsPlayingInline(false);
    if (mainVideoRef.current) {
      mainVideoRef.current.pause();
      mainVideoRef.current.currentTime = 0;
    }
  };

  const handleTogglePlay = () => {
    if (mainVideoRef.current) {
      if (mainVideoRef.current.paused) {
        mainVideoRef.current.play().then(() => setIsPlayingInline(true)).catch(() => { });
      } else {
        mainVideoRef.current.pause();
        setIsPlayingInline(false);
      }
    } else {
      setVideoModalOpen(true);
    }
  };

  // Carousel Slider Ref
  const carouselRef = useRef<any>(null);

  // 14 Medpro Service Cards Carousel Track & Scroll Navigation
  const cardsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollCardsLeft, setCanScrollCardsLeft] = useState(false);
  const [canScrollCardsRight, setCanScrollCardsRight] = useState(true);
  const [serviceCardPageIndex, setServiceCardPageIndex] = useState(0);
  const [isCardsSliding, setIsCardsSliding] = useState(false);

  const updateCardScrollButtons = () => {
    if (cardsScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = cardsScrollRef.current;
      setCanScrollCardsLeft(scrollLeft > 15);
      setCanScrollCardsRight(scrollLeft + clientWidth < scrollWidth - 15);
      const page = scrollLeft > clientWidth / 2 ? 1 : 0;
      setServiceCardPageIndex(page);
    }
  };

  const handleScrollCards = (direction: 'left' | 'right') => {
    if (cardsScrollRef.current) {
      setIsCardsSliding(true);
      setTimeout(() => setIsCardsSliding(false), 500);
      const { clientWidth, scrollLeft, scrollWidth } = cardsScrollRef.current;
      if (direction === 'left') {
        cardsScrollRef.current.scrollTo({
          left: Math.max(0, scrollLeft - clientWidth),
          behavior: 'smooth',
        });
      } else {
        if (scrollLeft + clientWidth >= scrollWidth - 25) {
          cardsScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          cardsScrollRef.current.scrollTo({
            left: scrollLeft + clientWidth,
            behavior: 'smooth',
          });
        }
      }
    }
  };

  const handleGoToCardPage = (pageIndex: number) => {
    if (cardsScrollRef.current) {
      const { clientWidth } = cardsScrollRef.current;
      cardsScrollRef.current.scrollTo({
        left: pageIndex * clientWidth,
        behavior: 'smooth',
      });
      setServiceCardPageIndex(pageIndex);
    }
  };

  useEffect(() => {
    updateCardScrollButtons();
    window.addEventListener('resize', updateCardScrollButtons);
    return () => window.removeEventListener('resize', updateCardScrollButtons);
  }, []);

  // Doctor & Package Detail Modal States
  const [viewingDoctor, setViewingDoctor] = useState<DoctorOption | null>(null);
  const [doctorDetailModalOpen, setDoctorDetailModalOpen] = useState(false);
  const [viewingPackage, setViewingPackage] = useState<HealthPackageOption | null>(null);
  const [packageDetailModalOpen, setPackageDetailModalOpen] = useState(false);

  // Auth Guard & Profile Completion Modal States
  const [requireLoginModalOpen, setRequireLoginModalOpen] = useState(false);
  const [completeProfileModalOpen, setCompleteProfileModalOpen] = useState(false);

  // Tra cứu lịch hẹn modal
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupResults, setLookupResults] = useState<OnlineAppointmentItem[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupTypeFilter, setLookupTypeFilter] = useState<'ALL' | 'New' | 'FollowUp'>('ALL');
  const [ticketDetailModalOpen, setTicketDetailModalOpen] = useState(false);
  const [viewingTicketAppointment, setViewingTicketAppointment] = useState<OnlineAppointmentItem | null>(null);

  // Reschedule & Cancel States
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<OnlineAppointmentItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [rescheduleSlot, setRescheduleSlot] = useState<string>('');
  const [rescheduleSlots, setRescheduleSlots] = useState<any[]>([]);
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState<string>('');
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState<OnlineAppointmentItem | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Bận việc đột xuất không thể đến khám');
  const [cancelCustomReason, setCancelCustomReason] = useState<string>('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Mở modal tra cứu lịch hẹn (tự động nạp danh sách lịch của tài khoản nếu đã đăng nhập)
  const openLookupModal = async () => {
    setLookupModalOpen(true);
    const phone = user?.soDienThoai?.trim();
    if (phone) {
      setLookupPhone(phone);
      setLookupLoading(true);
      try {
        const all = await appointmentService.getAppointments();
        const query = phone.toLowerCase();
        const found = all.filter(
          (a) =>
            a.patientPhone.includes(query) ||
            a.patientCode.toLowerCase().includes(query) ||
            a.id.toLowerCase().includes(query)
        );
        setLookupResults(found);
      } catch {
        // fallback
      } finally {
        setLookupLoading(false);
      }
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

  // Helper kiểm tra khung giờ đã qua trong ngày
  const isSlotPast = (slotTime: string, dateStr: string): boolean => {
    if (!dayjs(dateStr).isSame(dayjs(), 'day')) return false;
    const endPart = slotTime.split('-')[1]?.trim() || slotTime.split('-')[0]?.trim();
    const [hour, minute] = endPart.split(':').map(Number);
    const slotEndTime = dayjs().hour(hour).minute(minute).second(0);
    return dayjs().isAfter(slotEndTime);
  };

  // Mở modal đổi lịch
  const handleOpenReschedule = async (apt: OnlineAppointmentItem) => {
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
      const data = await appointmentService.getTimeSlots(dateStr, reschedulingAppointment?.departmentName);
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
      setLookupResults((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err: any) {
      showErrorAlert('Không thể đổi lịch', err.message || 'Lỗi khi cập nhật lịch khám');
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  // Mở modal hủy lịch
  const handleOpenCancel = (apt: OnlineAppointmentItem) => {
    setCancellingAppointment(apt);
    setCancelReason('Bận việc đột xuất không thể đến khám');
    setCancelCustomReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingAppointment) return;
    const finalReason = cancelReason === 'Khác' ? cancelCustomReason.trim() || 'Lý do khác' : cancelReason;

    setCancelSubmitting(true);
    try {
      const updated = await appointmentService.cancelAppointment(cancellingAppointment.id, finalReason);
      showSuccessAlert(
        'Đã Hủy Lịch Khám Thành Công',
        `Lịch hẹn mã ${updated.id.toUpperCase()} đã được hủy. Khung giờ này đã được hoàn trả lại cho hệ thống.`
      );
      setCancelModalOpen(false);
      setLookupResults((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err: any) {
      showErrorAlert('Lỗi hủy lịch', err.message || 'Không thể hủy lịch khám');
    } finally {
      setCancelSubmitting(false);
    }
  };



  return (
    <div className="booking-page-container">
      {/* 1. Portal Header */}
      <PatientPortalHeader
        onOpenLookup={openLookupModal}
        onOpenProfile={() => setCompleteProfileModalOpen(true)}
      />

      {/* Dòng chữ chạy qua lại thông báo người bệnh (Đặt ở dưới Header & Kích thước to rõ hơn) */}
      {!marqueeDismissed && (
        <div className="marquee-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <div className="marquee-prefix">
              <SoundOutlined style={{ fontSize: 15 }} /> THÔNG BÁO
            </div>
            <div className="marquee-content-wrap">
              <div className="marquee-track">
                Kính chào Quý người bệnh và thân nhân: Bệnh viện Đa khoa D-Medical tiếp nhận khám chữa bệnh tất cả các ngày trong tuần (kể cả Thứ 7 & Chủ Nhật) • Quý khách vui lòng đặt hẹn trước để được vào khám đúng giờ, không lo xếp hàng chờ đợi • Hỗ trợ BHYT thông tuyến toàn quốc và bảo lãnh viện phí trực tiếp • Tổng đài chăm sóc và hỗ trợ người bệnh 24/7: 1900 6868 • Cấp cứu khẩn cấp: 1900 8888.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMarqueeDismissed(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '0 12px',
              fontSize: 18,
              lineHeight: 1,
              fontWeight: 700,
            }}
            title="Đóng thông báo"
            aria-label="Đóng thông báo"
          >
            ×
          </button>
        </div>
      )}

      {/* 2. Panoramic Medpro Replica Hero Banner with Two Doctors & Omnibar Search */}
      <section className="medpro-hero-section">
        {/* Soft Background Medical Grid & Radial Rings */}
        <div className="medpro-hero-bg-pattern" />

        {/* Left Flank: Friendly Female Doctor */}
        <div className="medpro-doctor-flank flank-left">
          <img
            src="/female_doctor_hero.png"
            alt="Bác sĩ Nữ D-Medical"
            className="medpro-doctor-img"
          />
        </div>

        {/* Right Flank: Friendly Male Doctor Pointing */}
        <div className="medpro-doctor-flank flank-right">
          <img
            src="/male_doctor_hero.png"
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
          <div className="medpro-search-bar-wrap" style={{ position: 'relative' }}>
            <SearchOutlined className="medpro-search-icon" />
            <Input
              className="medpro-search-input"
              placeholder="Tìm kiếm chuyên khoa, bác sĩ, gói khám, triệu chứng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {
                setTimeout(() => setSearchFocused(false), 250);
              }}
              onPressEnter={() => {
                if (searchQuery.trim()) {
                  navigate(`/booking?search=${encodeURIComponent(searchQuery.trim())}`);
                } else {
                  navigate('/booking');
                }
              }}
              allowClear
            />
            {searchQuery && (
              <Button
                type="primary"
                className="medpro-search-action-btn"
                onClick={() => {
                  navigate(`/booking?search=${encodeURIComponent(searchQuery.trim())}`);
                }}
              >
                Tìm
              </Button>
            )}

            {/* Floating Autocomplete Suggestions Dropdown */}
            {searchFocused && searchSuggestions && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #bae6fd',
                  borderRadius: 14,
                  boxShadow: '0 12px 32px rgba(2, 132, 199, 0.15)',
                  zIndex: 1000,
                  maxHeight: 380,
                  overflowY: 'auto',
                  textAlign: 'left',
                  padding: '12px 14px',
                }}
              >
                {/* 1. Chuyên khoa */}
                {searchSuggestions.depts.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MedicineBoxOutlined style={{ color: '#0284c7' }} />
                      <span>Chuyên khoa ({searchSuggestions.depts.length})</span>
                    </div>
                    {searchSuggestions.depts.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => navigate(`/booking?mode=byDept&deptId=${d.id}`)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f9ff')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{d.name}</div>
                          <div style={{ fontSize: 11.5, color: '#64748b' }}>{d.location} • {d.phone || 'Sảnh A'}</div>
                        </div>
                        <Tag color="cyan" style={{ margin: 0, fontSize: 11, borderRadius: 6 }}>Đặt khám</Tag>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Bác sĩ */}
                {searchSuggestions.docs.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <UserOutlined style={{ color: '#0284c7' }} />
                      <span>Bác sĩ chuyên khoa ({searchSuggestions.docs.length})</span>
                    </div>
                    {searchSuggestions.docs.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => navigate(`/booking?mode=byDoctor&doctorId=${doc.id}`)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f9ff')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar src={doc.avatar} size={32} icon={<UserOutlined />} style={{ backgroundColor: '#0284c7' }} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{doc.name}</div>
                            <div style={{ fontSize: 11.5, color: '#64748b' }}>{doc.title} • {doc.department}</div>
                          </div>
                        </div>
                        <Tag color="blue" style={{ margin: 0, fontSize: 11, borderRadius: 6 }}>Đặt bác sĩ</Tag>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Gói khám */}
                {searchSuggestions.pkgs.length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <HeartOutlined style={{ color: '#0284c7' }} />
                      <span>Gói khám ({searchSuggestions.pkgs.length})</span>
                    </div>
                    {searchSuggestions.pkgs.map((pkg) => (
                      <div
                        key={pkg.id}
                        onClick={() => navigate(`/booking?mode=byPackage&packageId=${pkg.id}`)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f9ff')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{pkg.name}</div>
                          <div style={{ fontSize: 11.5, color: '#64748b' }}>{pkg.recommendedFor} • {pkg.discountPrice.toLocaleString('vi-VN')}đ</div>
                        </div>
                        <Tag color="green" style={{ margin: 0, fontSize: 11, borderRadius: 6 }}>Xem gói</Tag>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  onClick={() => navigate(`/booking?search=${encodeURIComponent(searchQuery.trim())}`)}
                  style={{
                    borderTop: '1px solid #e2e8f0',
                    marginTop: 8,
                    paddingTop: 8,
                    textAlign: 'center',
                    color: '#0284c7',
                    fontWeight: 700,
                    fontSize: 12.5,
                    cursor: 'pointer',
                  }}
                >
                  Xem tất cả kết quả cho "{searchQuery}" →
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestion Search Tags */}
          <div className="medpro-quick-tags-wrap">
            <span className="medpro-quick-tag-label">Gợi ý tìm nhanh:</span>
            {[
              { label: 'Tim Mạch', url: '/booking?mode=byDept&search=tim mạch' },
              { label: 'Tiêu Hóa & Gan', url: '/booking?mode=byDept&search=tiêu hóa' },
              { label: 'Nhi Khoa', url: '/booking?mode=byDept&search=nhi' },
              { label: 'Gói Tổng Quát', url: '/booking?mode=byPackage' },
              { label: 'BS. Chuyên Khoa II', url: '/booking?mode=byDoctor&search=CKII' },
              { label: 'Tái Khám Theo Hẹn', url: '/booking?mode=byFollowUp' },
            ].map((tag, idx) => (
              <span
                key={idx}
                className="medpro-quick-tag-pill"
                onClick={() => navigate(tag.url)}
              >
                {tag.label}
              </span>
            ))}
          </div>

          {/* 3 Green Checkmark Bullet Points (Exact Replica of Image) */}
          <div className="medpro-hero-bullet-list">
            <div className="medpro-hero-bullet-item">
              <CheckCircleOutlined style={{ color: '#16a34a', marginRight: 6 }} />
              <span><strong>Lấy số trực tuyến</strong>, không cần xếp hàng</span>
            </div>
            <div className="medpro-hero-bullet-item">
              <CheckCircleOutlined style={{ color: '#16a34a', marginRight: 6 }} />
              <span><strong>Chọn giờ khám</strong> linh hoạt theo lịch cá nhân</span>
            </div>
            <div className="medpro-hero-bullet-item">
              <CheckCircleOutlined style={{ color: '#16a34a', marginRight: 6 }} />
              <span><strong>Hỗ trợ đổi hủy</strong> lịch hẹn miễn phí trước giờ khám</span>
            </div>
          </div>
        </div>

        {/* 14 Quick Feature Action Cards (Floating Carousel as in Medpro Reference) */}
        <div className="medpro-cards-carousel-container">
          {/* Left Arrow Button */}
          <button
            type="button"
            className={`medpro-carousel-nav-btn medpro-carousel-prev-btn ${!canScrollCardsLeft ? 'is-hidden' : ''}`}
            title="Xem các dịch vụ trước"
            aria-label="Xem các dịch vụ trước"
            onClick={() => handleScrollCards('left')}
          >
            <LeftOutlined />
          </button>

          {/* Scrollable Track with 14 Action Cards */}
          <div
            className={`medpro-cards-scroll-track ${isCardsSliding ? 'is-sliding' : ''}`}
            ref={cardsScrollRef}
            onScroll={updateCardScrollButtons}
          >
            {/* --- PAGE 1: 7 Dịch vụ cốt lõi --- */}

            {/* Card 1: Khám tại viện */}
            <div
              className="medpro-service-card"
              style={{ '--card-index': 1 } as React.CSSProperties}
              onClick={() => navigate('/booking?mode=byDept')}
            >
              <div className="medpro-card-icon-wrap" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <CalendarOutlined style={{ fontSize: 26 }} />
              </div>
              <div className="medpro-card-title">Khám tại viện</div>
            </div>

            {/* Card 2: Khám chuyên khoa */}
            <div
              className="medpro-service-card"
              style={{ '--card-index': 2 } as React.CSSProperties}
              onClick={() => navigate('/booking?mode=byDept')}
            >
              <div className="medpro-card-icon-wrap" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                <MedicineBoxOutlined style={{ fontSize: 26 }} />
              </div>
              <div className="medpro-card-title">Khám chuyên khoa</div>
            </div>

            {/* Card 3: Tư vấn video từ xa */}
            <div
              className="medpro-service-card"
              style={{ '--card-index': 3 } as React.CSSProperties}
              onClick={() => {
                showToast('Chế độ tư vấn video từ xa với bác sĩ D-Medical', 'info');
                navigate('/booking?mode=byDoctor');
              }}
            >
              <div className="medpro-card-icon-wrap" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <VideoCameraOutlined style={{ fontSize: 26 }} />
              </div>
              <div className="medpro-card-title">Tư vấn video từ xa</div>
            </div>

            {/* Card 4: Xét nghiệm */}
            <div
              className="medpro-service-card"
              style={{ '--card-index': 4 } as React.CSSProperties}
              onClick={() => navigate('/booking?mode=byDept&search=xét nghiệm')}
            >
              <div className="medpro-card-icon-wrap" style={{ background: '#ecfeff', color: '#0891b2' }}>
                <ExperimentOutlined style={{ fontSize: 26 }} />
              </div>
              <div className="medpro-card-title">Xét nghiệm</div>
            </div>

            {/* Card 5: Khám ngoài giờ */}
            <div
              className="medpro-service-card"
              style={{ '--card-index': 5 } as React.CSSProperties}
              onClick={() => {
                showToast('Khám ngoài giờ: 17:00 - 21:00 & Thứ 7, Chủ Nhật hàng tuần', 'info');
                navigate('/booking?mode=byDoctor');
              }}
            >
              <div className="medpro-card-icon-wrap" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                <ClockCircleOutlined style={{ fontSize: 26 }} />
              </div>
              <div className="medpro-card-title">Khám ngoài giờ</div>
            </div>

            {/* Card 6: Giúp việc cá nhân & AI */}
            <div
              className="medpro-service-card"
              style={{ '--card-index': 6 } as React.CSSProperties}
              onClick={() => setAiDrawerOpen(true)}
            >
              <div className="medpro-card-icon-wrap" style={{ background: '#fef2f2', color: '#ef4444' }}>
                <CustomerServiceOutlined style={{ fontSize: 26 }} />
              </div>
              <div className="medpro-card-title">Giúp việc cá nhân</div>
            </div>

            {/* Card 7: Khám sức khỏe thông tư */}
            <div
              className="medpro-service-card"
              style={{ '--card-index': 7 } as React.CSSProperties}
              onClick={() => navigate('/booking?mode=byPackage')}
            >
              <div className="medpro-card-icon-wrap" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                <AuditOutlined style={{ fontSize: 26 }} />
              </div>
              <div className="medpro-card-title">Khám sức khỏe thông tư</div>
            </div>

            {/* --- PAGE 2: 7 Dịch vụ mở rộng --- */}

            {/* Card 8: Đặt khám theo bác sĩ */}
            <div
              className="medpro-service-card"
              style={{ '--card-index': 8 } as React.CSSProperties}
              onClick={() => navigate('/booking?mode=byDoctor')}
            >
              <div className="medpro-card-icon-wrap" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <UserOutlined style={{ fontSize: 26 }} />
                <span className="medpro-icon-star-badge">
                  <CheckCircleFilled />
                </span>
              </div>
              <div className="medpro-card-title">Đặt khám theo bác sĩ</div>
            </div>

            {/* Card 9: Gói khám sức khỏe */}
            <div
              className="medpro-service-card"
              style={{ '--card-index': 9 } as React.CSSProperties}
              onClick={() => navigate('/booking?mode=byPackage')}
            >
              <div className="medpro-card-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <SafetyCertificateOutlined style={{ fontSize: 26 }} />
              </div>
              <div className="medpro-card-title">Gói khám sức khỏe</div>
            </div>

            {/* Card 10: Y tế tại nhà */}
            <div
              className="medpro-service-card"
              style={{ '--card-index': 10 } as React.CSSProperties}
              onClick={() => {
                showToast('Dịch vụ Y tế tại nhà & Lấy mẫu xét nghiệm: 1900 1150', 'info');
              }}
            >
              <div className="medpro-card-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
                <HomeOutlined style={{ fontSize: 26 }} />
              </div>
              <div className="medpro-card-title">Y tế tại nhà</div>
            </div>

            {/* Card 11: Đặt lịch tiêm chủng */}
            <div
              className="medpro-service-card"
              style={{ '--card-index': 11 } as React.CSSProperties}
              onClick={() => navigate('/booking?mode=byDept&search=tiêm chủng')}
            >
              <div className="medpro-card-icon-wrap" style={{ background: '#fdf2f8', color: '#db2777' }}>
                <HeartOutlined style={{ fontSize: 26 }} />
              </div>
              <div className="medpro-card-title">Đặt lịch tiêm chủng</div>
            </div>

            {/* Card 12: Mua thuốc tại An Khang */}
            <div
              className="medpro-service-card"
              style={{ '--card-index': 12 } as React.CSSProperties}
              onClick={() => {
                showToast('Hệ thống Nhà thuốc liên kết An Khang - 1900 1572', 'info');
              }}
            >
              <div className="medpro-card-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
                <ShopOutlined style={{ fontSize: 26 }} />
              </div>
              <div className="medpro-card-title">Mua thuốc tại An Khang</div>
            </div>

            {/* Card 13: Khám doanh nghiệp */}
            <div
              className="medpro-service-card"
              style={{ '--card-index': 13 } as React.CSSProperties}
              onClick={() => {
                navigate('/booking?mode=byPackage&search=doanh nghiệp');
              }}
            >
              <div className="medpro-card-icon-wrap" style={{ background: '#f0f9ff', color: '#0284c7' }}>
                <TeamOutlined style={{ fontSize: 26 }} />
                <span className="medpro-card-moi-badge">Mới</span>
              </div>
              <div className="medpro-card-title">Khám doanh nghiệp</div>
            </div>

            {/* Card 14: Đặt lịch Chụp phim & Nội soi */}
            <div
              className="medpro-service-card"
              style={{ '--card-index': 14 } as React.CSSProperties}
              onClick={() => {
                navigate('/booking?mode=byDept&search=nội soi');
              }}
            >
              <div className="medpro-card-icon-wrap" style={{ background: '#ecfeff', color: '#0284c7' }}>
                <ScanOutlined style={{ fontSize: 26 }} />
              </div>
              <div className="medpro-card-title">Đặt lịch Chụp phim & Nội soi</div>
            </div>
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            className="medpro-carousel-nav-btn medpro-carousel-next-btn"
            title={canScrollCardsRight ? "Xem thêm các dịch vụ tiếp theo" : "Quay về dịch vụ ban đầu"}
            aria-label={canScrollCardsRight ? "Xem thêm các dịch vụ tiếp theo" : "Quay về dịch vụ ban đầu"}
            onClick={() => handleScrollCards('right')}
          >
            <RightOutlined />
          </button>
        </div>

        {/* Carousel Pagination Dots Indicator */}
        <div className="medpro-cards-dots-indicator">
          <span
            className={`medpro-cards-dot ${serviceCardPageIndex === 0 ? 'active' : ''}`}
            onClick={() => handleGoToCardPage(0)}
            title="Trang 1: 7 dịch vụ phổ biến"
          />
          <span
            className={`medpro-cards-dot ${serviceCardPageIndex === 1 ? 'active' : ''}`}
            onClick={() => handleGoToCardPage(1)}
            title="Trang 2: 7 dịch vụ mở rộng"
          />
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
            Bộ Y Tế Việt Nam
          </span>
          <span className="medpro-partner-badge-item">
            Bảo Hiểm Xã Hội (BHYT)
          </span>
          <span className="medpro-partner-badge-item">
            Đội Ngũ Bác Sĩ Chuyên Khoa
          </span>
          <span className="medpro-partner-badge-item">
            Tiêu Chuẩn Chất Lượng Y Tế
          </span>
          <span className="medpro-partner-badge-item">
            Cơ Sở Khám Chữa Bệnh Cấp 1
          </span>
        </div>
      </div>

      {/* Promotional Banner Advertising Slider (Medpro Style Carousel with 5 Ad Slides) */}
      <section style={{ maxWidth: 1200, margin: '28px auto 36px', padding: '0 20px' }}>
        <div className="hospital-carousel-wrap">
          {/* Floating Navigation Arrows */}
          <button
            type="button"
            className="carousel-arrow-btn arrow-prev"
            aria-label="Slide trước"
            onClick={() => carouselRef.current?.prev()}
          >
            <LeftOutlined />
          </button>
          <button
            type="button"
            className="carousel-arrow-btn arrow-next"
            aria-label="Slide kế tiếp"
            onClick={() => carouselRef.current?.next()}
          >
            <RightOutlined />
          </button>

          <Carousel
            ref={carouselRef}
            autoplay
            autoplaySpeed={5000}
            effect="fade"
            pauseOnHover
            dots={false}
          >
            {/* Slide 1: Tầm Soát Tim Mạch & Đột Quỵ */}
            <div className="carousel-slide-card slide-ad-1">
              <Row gutter={[24, 20]} className="carousel-slide-row">
                <Col xs={24} md={15}>
                  <div className="carousel-slide-title">
                    Tầm soát toàn diện tim mạch & nguy cơ đột quỵ
                  </div>
                  <div className="carousel-slide-desc">
                    Hội chẩn cùng chuyên gia tim mạch hàng đầu. Chụp MRI 3.0 Tesla và CT 128 lát cắt phát hiện sớm mảng xơ vữa, phình mạch máu não chỉ trong 15 phút.
                  </div>
                  <div className="carousel-slide-highlights">
                    <span className="carousel-slide-highlight-item">
                      <CheckCircleOutlined /> Chụp MRI 3.0T thế hệ mới
                    </span>
                    <span className="carousel-slide-highlight-item">
                      <CheckCircleOutlined /> Siêu âm Doppler màu tim
                    </span>
                    <span className="carousel-slide-highlight-item">
                      <SafetyCertificateOutlined /> Áp dụng trừ mức BHYT
                    </span>
                  </div>
                  <div className="carousel-slide-btn-group">
                    <button
                      type="button"
                      className="carousel-slide-btn"
                      onClick={() => navigate('/booking?mode=byPackage')}
                    >
                      <span>Đăng ký khám chuyên sâu</span>
                      <ArrowRightOutlined />
                    </button>
                    <button
                      type="button"
                      className="carousel-slide-btn carousel-slide-btn-secondary"
                      onClick={() => navigate('/goi-kham')}
                    >
                      <span>Chi tiết gói khám</span>
                    </button>
                  </div>
                </Col>
                <Col xs={0} md={9} className="carousel-slide-visual">
                  <div className="carousel-preview-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0369a1' }}>
                        Gói khám chuyên khoa tim mạch
                      </span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#0284c7', margin: '6px 0' }}>
                      2.450.000 đ
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', textDecoration: 'line-through' }}>
                      3.500.000 đ (Giá niêm yết)
                    </div>
                    <div style={{ fontSize: 13, color: '#334155', marginTop: 12, lineHeight: 1.6 }}>
                      • Xét nghiệm đường huyết & mỡ máu toàn phần<br />
                      • Đo điện tâm đồ ECG kỹ thuật số 12 chuyển đạo<br />
                      • Bác sĩ CKII tư vấn phác đồ dự phòng cá nhân
                    </div>
                    <div style={{ marginTop: 12, fontSize: 12.5, color: '#0369a1', fontWeight: 600 }}>
                      Mã ưu đãi trực tuyến: STROKE2026
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Slide 2: Khám BHYT Toàn Quốc */}
            <div className="carousel-slide-card slide-ad-2">
              <Row gutter={[24, 20]} className="carousel-slide-row">
                <Col xs={24} md={15}>
                  <div className="carousel-slide-title">
                    Khám chữa bệnh BHYT thông tuyến toàn quốc
                  </div>
                  <div className="carousel-slide-desc">
                    Hưởng trọn vẹn 100% quyền lợi BHYT theo quy định. Tích hợp định danh CCCD gắn chip và VNeID điện tử, đặt hẹn trước giúp tiếp nhận đúng giờ không phải chờ đợi.
                  </div>
                  <div className="carousel-slide-highlights">
                    <span className="carousel-slide-highlight-item">
                      <CheckCircleOutlined /> Phục vụ cả Thứ 7 và Chủ Nhật
                    </span>
                    <span className="carousel-slide-highlight-item">
                      <CheckCircleOutlined /> Đồng bộ dữ liệu thẻ VNeID
                    </span>
                    <span className="carousel-slide-highlight-item">
                      <ClockCircleOutlined /> Tiếp nhận trực tiếp qua Kiosk
                    </span>
                  </div>
                  <div className="carousel-slide-btn-group">
                    <button
                      type="button"
                      className="carousel-slide-btn"
                      onClick={() => navigate('/booking?mode=byDept')}
                    >
                      <span>Lấy số khám BHYT</span>
                      <ArrowRightOutlined />
                    </button>
                    <button
                      type="button"
                      className="carousel-slide-btn carousel-slide-btn-secondary"
                      onClick={() => setLookupModalOpen(true)}
                    >
                      <span>Tra cứu lịch hẹn</span>
                      <SearchOutlined />
                    </button>
                  </div>
                </Col>
                <Col xs={0} md={9} className="carousel-slide-visual">
                  <div className="carousel-preview-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0369a1' }}>
                        Phiếu tiếp nhận điện tử
                      </span>
                      <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>Mã QR số</span>
                    </div>
                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                      <div style={{ display: 'inline-block', padding: 8, background: '#fff', borderRadius: 12, border: '1px solid #bae6fd' }}>
                        <QRCodeSVG value="MEDQR|SAMPLE|BHYT|2026" size={110} level="M" fgColor="#0369a1" />
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: '#334155', textAlign: 'center', marginTop: 6 }}>
                      Quét mã tại Kiosk Sảnh A để nhận số buồng khám thẳng
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Slide 3: Gói Doanh Nghiệp & Gia Đình */}
            <div className="carousel-slide-card slide-ad-3">
              <Row gutter={[24, 20]} className="carousel-slide-row">
                <Col xs={24} md={15}>
                  <div className="carousel-slide-title">
                    Khám sức khỏe định kỳ doanh nghiệp & gia đình
                  </div>
                  <div className="carousel-slide-desc">
                    Thiết kế danh mục linh hoạt theo Luật Lao động và nhu cầu thực tế. Đội ngũ y tế lưu động lấy mẫu tận nơi hoặc quy trình khám VIP khép kín tại viện.
                  </div>
                  <div className="carousel-slide-highlights">
                    <span className="carousel-slide-highlight-item">
                      <CheckCircleOutlined /> Lấy mẫu xét nghiệm tận nơi
                    </span>
                    <span className="carousel-slide-highlight-item">
                      <CheckCircleOutlined /> Trả kết quả số hóa EMR
                    </span>
                    <span className="carousel-slide-highlight-item">
                      <SafetyCertificateOutlined /> Bác sĩ tư vấn phác đồ 1:1
                    </span>
                  </div>
                  <div className="carousel-slide-btn-group">
                    <button
                      type="button"
                      className="carousel-slide-btn"
                      onClick={() => navigate('/booking?mode=byPackage&search=doanh nghiệp')}
                    >
                      <span>Tư vấn gói đoàn thể</span>
                      <ArrowRightOutlined />
                    </button>
                    <button
                      type="button"
                      className="carousel-slide-btn carousel-slide-btn-secondary"
                      onClick={() => navigate('/goi-kham')}
                    >
                      <span>Xem bảng giá chi tiết</span>
                    </button>
                  </div>
                </Col>
                <Col xs={0} md={9} className="carousel-slide-visual">
                  <div className="carousel-preview-card">
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>
                      Dành cho doanh nghiệp
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                      Chính sách ưu đãi đoàn từ 20 người
                    </div>
                    <div style={{ fontSize: 13, color: '#334155', marginTop: 10, lineHeight: 1.6 }}>
                      • Chiết khấu trực tiếp theo quy mô nhân sự<br />
                      • Tặng gói siêu âm tuyến giáp và ổ bụng<br />
                      • Miễn phí khám chuyên khoa Mắt và Răng
                    </div>
                    <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 10 }}>
                      Liên hệ đối ngoại: <strong>1900 6868</strong>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Slide 4: Nội Soi Tiêu Hóa NBI Không Đau */}
            <div className="carousel-slide-card slide-ad-4">
              <Row gutter={[24, 20]} className="carousel-slide-row">
                <Col xs={24} md={15}>
                  <div className="carousel-slide-title">
                    Nội soi tiêu hóa công nghệ dải tần hẹp NBI
                  </div>
                  <div className="carousel-slide-desc">
                    Hệ thống Olympus dải tần ánh sáng hẹp (NBI) phóng đại siêu rõ nét, phát hiện tổn thương ung thư dạ dày - đại tràng giai đoạn sớm nhất với tiền mê êm ái.
                  </div>
                  <div className="carousel-slide-highlights">
                    <span className="carousel-slide-highlight-item">
                      <CheckCircleOutlined /> Tiền mê êm dịu, tỉnh sau 15 phút
                    </span>
                    <span className="carousel-slide-highlight-item">
                      <CheckCircleOutlined /> Cắt polyp điều trị trong ngày
                    </span>
                    <span className="carousel-slide-highlight-item">
                      <SafetyCertificateOutlined /> Dụng cụ tiệt khuẩn 100%
                    </span>
                  </div>
                  <div className="carousel-slide-btn-group">
                    <button
                      type="button"
                      className="carousel-slide-btn"
                      onClick={() => navigate('/booking?mode=byDept&search=nội soi')}
                    >
                      <span>Đặt lịch nội soi</span>
                      <ArrowRightOutlined />
                    </button>
                    <button
                      type="button"
                      className="carousel-slide-btn carousel-slide-btn-secondary"
                      onClick={() => navigate('/bac-si')}
                    >
                      <span>Đội ngũ bác sĩ tiêu hóa</span>
                    </button>
                  </div>
                </Col>
                <Col xs={0} md={9} className="carousel-slide-visual">
                  <div className="carousel-preview-card">
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>
                      Trung tâm nội soi tiêu hóa
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                      Công nghệ dải tần ánh sáng hẹp NBI
                    </div>
                    <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginTop: 8 }}>
                      Quan sát chi tiết cấu trúc vi mạch máu và vi bề mặt niêm mạc, hỗ trợ chẩn đoán chính xác tổn thương ung thư đường tiêu hóa sớm.
                    </div>
                    <div style={{ fontSize: 12.5, color: '#0369a1', marginTop: 10, fontWeight: 600 }}>
                      Xuất viện trong ngày sau khi thực hiện
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Slide 5: Trợ Lý Hospital AI */}
            <div className="carousel-slide-card slide-ad-5">
              <Row gutter={[24, 20]} className="carousel-slide-row">
                <Col xs={24} md={15}>
                  <div className="carousel-slide-title">
                    Sổ sức khỏe điện tử & Tiện ích y tế số
                  </div>
                  <div className="carousel-slide-desc">
                    Theo dõi toàn bộ hồ sơ bệnh án EMR cá nhân, tra cứu kết quả cận lâm sàng trực tuyến và tự động kiểm tra tương tác thuốc an toàn theo chuẩn Dược thư.
                  </div>
                  <div className="carousel-slide-highlights">
                    <span className="carousel-slide-highlight-item">
                      <CheckCircleOutlined /> Nhắc lịch uống thuốc & tái khám
                    </span>
                    <span className="carousel-slide-highlight-item">
                      <CheckCircleOutlined /> Tra cứu kết quả xét nghiệm online
                    </span>
                    <span className="carousel-slide-highlight-item">
                      <SafetyCertificateOutlined /> Bảo mật dữ liệu y tế đa lớp
                    </span>
                  </div>
                  <div className="carousel-slide-btn-group">
                    <button
                      type="button"
                      className="carousel-slide-btn"
                      onClick={() => setAiDrawerOpen(true)}
                    >
                      <span>Trò chuyện cùng trợ lý y tế</span>
                      <ArrowRightOutlined />
                    </button>
                    <button
                      type="button"
                      className="carousel-slide-btn carousel-slide-btn-secondary"
                      onClick={() => navigate('/booking')}
                    >
                      <span>Đặt khám trực tuyến</span>
                    </button>
                  </div>
                </Col>
                <Col xs={0} md={9} className="carousel-slide-visual">
                  <div className="carousel-preview-card">
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>
                      Hồ sơ sức khỏe số EMR
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                      Bảo vệ an toàn dùng thuốc
                    </div>
                    <div style={{ fontSize: 13, color: '#334155', marginTop: 8, lineHeight: 1.6 }}>
                      Tự động đối chiếu đơn thuốc, kiểm tra liều lượng và cảnh báo tương tác thuốc theo danh mục Dược thư Quốc gia.
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                      <Tag color="cyan" style={{ fontWeight: 600 }}>Dữ liệu số hóa</Tag>
                      <Tag color="blue" style={{ fontWeight: 600 }}>Bảo mật chuẩn y tế</Tag>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </Carousel>
        </div>

        {/* BỘ 3 TIỆN ÍCH DỊCH VỤ NGƯỜI BỆNH (QUICK SERVICE STRIP) */}
        <div className="sub-promo-banners-wrap">
          <div
            className="sub-promo-card"
            onClick={() => navigate('/booking?mode=byPackage&search=tầm soát')}
          >
            <div className="sub-promo-content">
              <div className="sub-promo-title">Tầm soát bệnh lý & Gói khám chuyên sâu</div>
              <div className="sub-promo-desc">Chủ động tầm soát nguy cơ tim mạch, đái tháo đường và ung thư theo nhóm tuổi.</div>
              <div className="sub-promo-action">
                <span>Xem danh mục gói khám</span>
                <ArrowRightOutlined />
              </div>
            </div>
          </div>

          <div
            className="sub-promo-card"
            onClick={() => navigate('/booking?mode=byDept&search=tiêm chủng')}
          >
            <div className="sub-promo-content">
              <div className="sub-promo-title">Trung tâm tiêm chủng vắc-xin Mẹ & Bé</div>
              <div className="sub-promo-desc">Nguồn vắc-xin chính hãng bảo quản kho lạnh GSP, tự động nhắc lịch trên sổ số.</div>
              <div className="sub-promo-action">
                <span>Tra cứu phác đồ tiêm</span>
                <ArrowRightOutlined />
              </div>
            </div>
          </div>

          <div
            className="sub-promo-card"
            onClick={() => navigate('/bac-si')}
          >
            <div className="sub-promo-content">
              <div className="sub-promo-title">Tư vấn sức khỏe cùng Bác sĩ chuyên khoa</div>
              <div className="sub-promo-desc">Kết nối trao đổi trực tuyến, giải thích kết quả cận lâm sàng và phác đồ điều trị.</div>
              <div className="sub-promo-action">
                <span>Chọn bác sĩ tư vấn</span>
                <ArrowRightOutlined />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KHỐI VIDEO GIỚI THIỆU & CƠ SỞ VẬT CHẤT BỆNH VIỆN */}
      <section className="hospital-video-section">
        <div className="hospital-video-container">
          {/* Header */}
          <div className="video-header-row">
            <div>
              <h2 className="video-section-title">
                Cơ sở vật chất & Quy trình khám bệnh
              </h2>
              <p className="video-section-subtitle">
                Trực quan hóa không gian khám chữa bệnh, trang thiết bị chẩn đoán hình ảnh và quy trình tiếp đón không chờ đợi tại Bệnh viện Đa khoa Hospital AI.
              </p>
            </div>
            <div>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 700, borderRadius: 8, height: 40 }}
                onClick={() => setVideoModalOpen(true)}
              >
                Xem toàn màn hình
              </Button>
            </div>
          </div>

          {/* Main Dual-Column Player Layout */}
          <Row gutter={[24, 24]} align="stretch">
            {/* Left 15 Col: Video Player Screen */}
            <Col xs={24} lg={15}>
              <div className="video-main-player-wrap">
                <video
                  ref={mainVideoRef}
                  className="video-element"
                  src={currentVideo.videoUrl}
                  poster={currentVideo.thumbnail}
                  controls={isPlayingInline}
                  playsInline
                  onPlay={() => setIsPlayingInline(true)}
                  onPause={() => setIsPlayingInline(false)}
                />

                {/* Custom Overlay when not playing */}
                {!isPlayingInline && (
                  <div className="video-player-overlay">
                    <div className="video-overlay-top">
                      <span className="video-tag-badge">{currentVideo.category}</span>
                      <span className="video-tag-badge">{currentVideo.resolution}</span>
                    </div>

                    {/* Central Play Button */}
                    <button
                      type="button"
                      className="video-play-center-btn"
                      onClick={handleTogglePlay}
                      title="Bấm để phát video"
                      aria-label="Bấm để phát video"
                    >
                      <PlayCircleFilled />
                    </button>

                    <div className="video-overlay-bottom">
                      <div className="video-current-title">{currentVideo.title}</div>
                      <div className="video-current-meta">
                        <span><ClockCircleOutlined style={{ marginRight: 4 }} />Thời lượng: {currentVideo.duration}</span>
                        <span>Chuyên mục: {currentVideo.category}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Description Snippet */}
              <div style={{ marginTop: 14, padding: '12px 16px', background: '#f8fafc', borderRadius: 12 }}>
                <div style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.6 }}>
                  {currentVideo.description}
                </div>
              </div>
            </Col>

            {/* Right 9 Col: Video Playlist Column */}
            <Col xs={24} lg={9}>
              <div className="video-playlist-card">
                <div className="video-playlist-header">
                  <span>Danh mục video clip ({HOSPITAL_VIDEOS.length})</span>
                  <Tag color="blue" style={{ margin: 0, fontWeight: 600 }}>Tài liệu video</Tag>
                </div>

                <div className="video-playlist-items">
                  {HOSPITAL_VIDEOS.map((item, idx) => {
                    const isActive = activeVideoIndex === idx;
                    return (
                      <div
                        key={item.id}
                        className={`video-playlist-item ${isActive ? 'active' : ''}`}
                        onClick={() => handleSelectVideo(idx)}
                      >
                        <div className="video-thumb-wrap">
                          <img src={item.thumbnail} alt={item.title} className="video-thumb-img" />
                          <div className="video-thumb-play-icon">
                            {isActive && isPlayingInline ? (
                              <SoundOutlined style={{ color: '#38bdf8' }} />
                            ) : (
                              <PlayCircleFilled />
                            )}
                          </div>
                          <span className="video-thumb-duration">{item.duration}</span>
                        </div>

                        <div className="video-item-info">
                          <div className="video-item-title">{item.title}</div>
                          <div className="video-item-sub">
                            <span>{item.category}</span>
                            <span>•</span>
                            <span>{item.duration}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: 12, textAlign: 'center' }}>
                  <Button
                    type="default"
                    block
                    icon={<VideoCameraOutlined />}
                    style={{ borderColor: '#bae6fd', color: '#0369a1', fontWeight: 600, borderRadius: 8 }}
                    onClick={() => {
                      showToast('Kênh Video Bệnh viện cập nhật liên tục các chuyên đề y học mới nhất', 'info');
                    }}
                  >
                    Xem thêm chuyên đề y khoa
                  </Button>
                </div>
              </div>
            </Col>
          </Row>

          {/* Clinical Quality Assurance Strip */}
          <div className="video-clinical-strip">
            <div className="video-clinical-col">
              <div className="video-clinical-number">JCI & WHO</div>
              <div className="video-clinical-title">Phòng khám khép kín</div>
              <div className="video-clinical-desc">Không gian riêng tư, kiểm soát nhiễm khuẩn áp lực dương.</div>
            </div>
            <div className="video-clinical-col">
              <div className="video-clinical-number">3.0T & 128 Dãy</div>
              <div className="video-clinical-title">Chẩn đoán hình ảnh</div>
              <div className="video-clinical-desc">Hệ thống MRI và CT đa lát cắt phát hiện sớm vi tổn thương.</div>
            </div>
            <div className="video-clinical-col">
              <div className="video-clinical-number">QR Kiosk</div>
              <div className="video-clinical-title">Tiếp nhận thông minh</div>
              <div className="video-clinical-desc">Quét mã nhận số buồng khám thẳng, không cần bốc số.</div>
            </div>
            <div className="video-clinical-col">
              <div className="video-clinical-number">24/7</div>
              <div className="video-clinical-title">Thường trực cấp cứu</div>
              <div className="video-clinical-desc">Đội ngũ bác sĩ chuyên khoa nội, ngoại và hồi sức tích cực.</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Khối Chuyên Khoa Nổi Bật */}
      <section style={{ maxWidth: 1200, margin: '0 auto 40px', padding: '0 20px' }}>
        <div className="medpro-section-header">
          <div>
            <div className="medpro-section-title">Chuyên Khoa Khám Bệnh Nổi Bật</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Phòng khám khang trang, trang thiết bị hiện đại hàng đầu</div>
          </div>
          <div className="medpro-view-all-btn" onClick={() => navigate('/chuyen-khoa')}>
            Xem tất cả chuyên khoa ({DEPARTMENTS_CATALOG.length}) <ArrowRightOutlined />
          </div>
        </div>

        <Row gutter={[16, 16]}>
          {DEPARTMENTS_CATALOG.slice(0, 6).map((dept) => (
            <Col xs={24} sm={12} md={8} key={dept.id}>
              <div
                style={{
                  padding: '20px 18px',
                  borderRadius: 16,
                  border: '1px solid #bae6fd',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  boxShadow: '0 4px 16px rgba(2, 132, 199, 0.06)',
                  transition: 'all 0.2s ease',
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
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{dept.name}</div>
                    <div style={{ fontSize: 11.5, color: '#0284c7', fontWeight: 600 }}>
                      <EnvironmentOutlined style={{ marginRight: 4 }} />{dept.location}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: 12.5, color: '#475569', margin: '0 0 10px', lineHeight: 1.45, flex: 1 }}>
                  {dept.description}
                </p>

                <div style={{ marginBottom: 10 }}>
                  <span className="medpro-rating-badge"><CheckCircleFilled style={{ color: '#0284c7', marginRight: 4 }} />Tiếp nhận đúng giờ</span>
                </div>

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
                  type="primary"
                  style={{ borderRadius: 10, fontWeight: 700, backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                  block
                  onClick={() => navigate(`/booking?deptId=${dept.id}`)}
                >
                  Đặt Khám Ngay
                </Button>
              </div>
            </Col>
          ))}
        </Row>
      </section>

      {/* 6. Khối Bác Sĩ Chuyên Gia Tiêu Biểu */}
      <section style={{ maxWidth: 1200, margin: '0 auto 40px', padding: '0 20px' }}>
        <div className="medpro-section-header">
          <div>
            <div className="medpro-section-title">Bác Sĩ Tư Vấn Khám Bệnh Nổi Bật</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Đội ngũ Giáo sư, Tiến sĩ, Bác sĩ CKII thâm niên từ các bệnh viện tuyến đầu</div>
          </div>
          <div className="medpro-view-all-btn" onClick={() => navigate('/bac-si')}>
            Xem tất cả bác sĩ ({DOCTORS_CATALOG.length}) <ArrowRightOutlined />
          </div>
        </div>

        <Row gutter={[16, 16]}>
          {DOCTORS_CATALOG.slice(0, 4).map((doc) => (
            <Col xs={24} sm={12} md={6} key={doc.id}>
              <div className="medpro-doc-card">
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <Avatar src={doc.avatar} size={74} style={{ border: '3px solid #0284c7', backgroundColor: '#e0f2fe' }} />
                  {doc.isSpecialist && (
                    <Tag
                      color="blue"
                      style={{
                        position: 'absolute',
                        bottom: -6,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        margin: 0,
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 10,
                        padding: '1px 8px',
                      }}
                    >
                      Chuyên gia
                    </Tag>
                  )}
                </div>

                <div style={{ fontWeight: 800, fontSize: 14.5, color: '#0f172a', marginBottom: 2 }}>{doc.name}</div>
                <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 700 }}>{doc.department}</div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2, minHeight: 34 }}>{doc.title}</div>

                <div style={{ margin: '8px 0 10px' }}>
                  <span className="medpro-rating-badge"><CheckCircleFilled style={{ color: '#0284c7', marginRight: 4 }} />Bác sĩ chỉ định</span>
                </div>

                <div style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>
                  Phí tư vấn: <strong style={{ color: '#0284c7' }}>{doc.consultationFee.toLocaleString('vi-VN')} đ</strong>
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                  <Button
                    size="middle"
                    style={{ flex: 1, borderRadius: 8, fontWeight: 600, borderColor: '#bae6fd', color: '#0369a1', fontSize: 12.5 }}
                    onClick={() => {
                      setViewingDoctor(doc);
                      setDoctorDetailModalOpen(true);
                    }}
                  >
                    Tiểu sử
                  </Button>
                  <Button
                    type="primary"
                    size="middle"
                    style={{ flex: 1.2, backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 700, borderRadius: 8, fontSize: 12.5 }}
                    onClick={() => navigate(`/booking?doctorId=${doc.id}`)}
                  >
                    Đặt Khám
                  </Button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </section>

      {/* 7. Khối Gói Khám Sức Khỏe Toàn Diện */}
      <section style={{ maxWidth: 1200, margin: '0 auto 40px', padding: '0 20px' }}>
        <div className="medpro-section-header">
          <div>
            <div className="medpro-section-title">Gói Khám Sức Khỏe & Tầm Soát Chuyên Sâu</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Khám khép kín, đầy đủ xét nghiệm và chẩn đoán hình ảnh</div>
          </div>
          <div className="medpro-view-all-btn" onClick={() => navigate('/goi-kham')}>
            Xem tất cả gói khám ({HEALTH_PACKAGES_CATALOG.length}) <ArrowRightOutlined />
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
                  <MedicineBoxOutlined style={{ marginRight: 4 }} />{pkg.departmentName}
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
                      <CheckCircleOutlined style={{ color: '#0284c7', marginRight: 6 }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                  <Button
                    size="middle"
                    style={{ flex: 1, borderRadius: 8, fontWeight: 600, borderColor: '#bae6fd', color: '#0369a1' }}
                    onClick={() => {
                      setViewingPackage(pkg);
                      setPackageDetailModalOpen(true);
                    }}
                  >
                    Chi tiết
                  </Button>
                  <Button
                    type="primary"
                    size="middle"
                    style={{ flex: 1.2, backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 700, borderRadius: 8 }}
                    onClick={() => navigate(`/booking?packageId=${pkg.id}`)}
                  >
                    Đăng Ký Gói
                  </Button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </section>

      {/* 8. Quy Trình Khám Bệnh 3 Bước Tiếp Nhận Không Chờ Đợi */}
      <section className="patient-journey-wrap" style={{ maxWidth: 1200, margin: '36px auto 30px', padding: '32px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ color: '#0f172a', fontWeight: 800, margin: '0 0 6px' }}>
            Quy trình tiếp nhận và khám bệnh
          </Title>
          <Paragraph style={{ color: '#64748b', fontSize: 14, maxWidth: 650, margin: '0 auto' }}>
            Quét mã QR tại kiosk để vào thẳng buồng khám, không cần xếp hàng bốc số.
          </Paragraph>
        </div>

        <Row gutter={[20, 20]}>
          <Col xs={24} md={8}>
            <div className="patient-journey-step">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="step-badge-num">1</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0369a1' }}>Đặt lịch và chọn bác sĩ</div>
              </div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginTop: 4 }}>
                Chọn chuyên khoa, bác sĩ và <strong>khung giờ khám</strong> theo nhu cầu trên web.
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div className="patient-journey-step">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="step-badge-num">2</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0369a1' }}>Quét mã QR check-in</div>
              </div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginTop: 4 }}>
                Đến viện trước 15 phút, <strong>quét mã QR</strong> tại kiosk hoặc quầy tiếp đón.
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div className="patient-journey-step">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="step-badge-num">3</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0369a1' }}>Vào thẳng buồng khám</div>
              </div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginTop: 4 }}>
                Hệ thống tự động điều phối lượt khám. Bác sĩ thăm khám đúng giờ hẹn.
              </div>
            </div>
          </Col>
        </Row>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            style={{
              backgroundColor: '#0284c7',
              borderColor: '#0284c7',
              fontWeight: 700,
              height: 46,
              borderRadius: 10,
              padding: '0 32px',
              fontSize: 15,
            }}
            onClick={() => navigate('/booking')}
          >
            Bắt đầu đặt khám ngay
          </Button>
        </div>
      </section>

      {/* 9. FAQ & Testimonials */}
      <section style={{ maxWidth: 1200, margin: '0 auto 48px', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ color: '#0f172a', fontWeight: 800, margin: '0 0 6px' }}>
            Câu hỏi thường gặp
          </Title>
          <Paragraph style={{ color: '#64748b', fontSize: 14 }}>
            Giải đáp thắc mắc về BHYT, thủ tục đến viện và đổi hủy lịch hẹn.
          </Paragraph>
        </div>

        <Collapse
          defaultActiveKey={['faq-1', 'faq-2']}
          size="large"
          style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #bae6fd' }}
          items={[
            {
              key: 'faq-1',
              label: <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>1. Tôi có được dùng Bảo hiểm Y tế (BHYT) khi đặt lịch trực tuyến không?</span>,
              children: <div style={{ color: '#475569', lineHeight: 1.7, fontSize: 13.5 }}><strong>Có.</strong> Khi đến viện, vui lòng xuất trình <strong>thẻ BHYT giấy hoặc ứng dụng VNeID / VssID</strong> tại quầy tiếp đón để được đối soát và giảm trừ đúng tuyến theo quy định.</div>,
            },
            {
              key: 'faq-2',
              label: <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>2. Đến bệnh viện tôi cần làm gì?</span>,
              children: <div style={{ color: '#475569', lineHeight: 1.7, fontSize: 13.5 }}>Quý khách có mặt trước 15 phút, đưa <strong>mã QR trên điện thoại</strong> vào máy quét tại kiosk hoặc quầy tiếp đón để nhận số vào thẳng buồng khám.</div>,
            },
            {
              key: 'faq-3',
              label: <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>3. Tôi có thể đổi giờ hoặc hủy lịch hẹn không?</span>,
              children: <div style={{ color: '#475569', lineHeight: 1.7, fontSize: 13.5 }}><strong>Miễn phí đổi và hủy.</strong> Bấm <strong>"Tra cứu lịch hẹn"</strong> ở đầu trang, nhập số điện thoại để đổi giờ hoặc hủy lịch hẹn trước giờ khám. Suất khám sẽ tự động hoàn lại cho bệnh nhân khác.</div>,
            },
          ]}
        />
      </section>

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
                  style={{ borderRadius: 16, fontWeight: 600, backgroundColor: lookupTypeFilter === 'ALL' ? '#0284c7' : undefined }}
                >
                  Tất cả ({lookupResults.length})
                </Button>
                <Button
                  size="small"
                  type={lookupTypeFilter === 'New' ? 'primary' : 'default'}
                  onClick={() => setLookupTypeFilter('New')}
                  style={{ borderRadius: 16, fontWeight: 600, backgroundColor: lookupTypeFilter === 'New' ? '#0284c7' : undefined }}
                >
                  Khám mới
                </Button>
                <Button
                  size="small"
                  type={lookupTypeFilter === 'FollowUp' ? 'primary' : 'default'}
                  onClick={() => setLookupTypeFilter('FollowUp')}
                  style={{ borderRadius: 16, fontWeight: 600, backgroundColor: lookupTypeFilter === 'FollowUp' ? '#0284c7' : undefined }}
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
                            <Tag color="cyan" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{item.patientCode}</Tag>
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
                          icon={<ScanOutlined />}
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

      {/* MODAL XEM CHI TIẾT PHIẾU KHÁM & MÃ QR TO */}
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
              <QRCodeSVG value={viewingTicketAppointment.qrCode || `MEDQR|${viewingTicketAppointment.id}|${viewingTicketAppointment.patientCode}`} size={180} level="H" fgColor="#0369a1" />
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
                navigate(`/booking?doctorId=${viewingDoctor.id}`);
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
                navigate(`/booking?packageId=${viewingPackage.id}`);
              }}
            >
              Đăng Ký Gói Khám Này
            </Button>
          </div>
        )}
      </Modal>

      {/* FULL-SCREEN HOSPITAL VIDEO PLAYER MODAL */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0369a1', fontWeight: 800, fontSize: 16 }}>
            <VideoCameraOutlined style={{ color: '#0284c7' }} />
            <span>{currentVideo.title}</span>
          </div>
        }
        open={videoModalOpen}
        onCancel={() => setVideoModalOpen(false)}
        footer={null}
        width={920}
        centered
        destroyOnClose
        styles={{
          body: { padding: '12px 0 4px 0' }
        }}
      >
        <div style={{ padding: '0 4px' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 9',
              background: '#090d16',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 12px 36px rgba(2, 132, 199, 0.25)',
            }}
          >
            <video
              src={currentVideo.videoUrl}
              poster={currentVideo.thumbnail}
              controls
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Tag color="cyan" style={{ fontWeight: 700, borderRadius: 6, margin: 0 }}>
                  {currentVideo.tag}
                </Tag>
                <span style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ClockCircleOutlined /> Thời lượng: {currentVideo.duration}
                </span>
              </div>
              <h4 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: 16, fontWeight: 700 }}>
                {currentVideo.title}
              </h4>
              <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                {currentVideo.description}
              </p>
            </div>
            <Button
              type="primary"
              style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', borderRadius: 8, fontWeight: 700 }}
              onClick={() => {
                setVideoModalOpen(false);
                navigate('/booking');
              }}
            >
              Đặt Lịch Khám Ngay
            </Button>
          </div>
        </div>
      </Modal>

      {/* AI Drawer, Login, Profile */}
      <AIChatDrawer open={aiDrawerOpen} onClose={() => setAiDrawerOpen(false)} />
      <RequireLoginModal
        open={requireLoginModalOpen}
        onCancel={() => setRequireLoginModalOpen(false)}
        actionTitle="đặt lịch khám"
        redirectPath="/"
      />
      <CompleteProfileModal
        open={completeProfileModalOpen}
        onCancel={() => setCompleteProfileModalOpen(false)}
        onSuccess={() => setCompleteProfileModalOpen(false)}
      />

      {/* Portal Footer */}
      <PatientPortalFooter />
    </div>
  );
};

export default PatientHomePage;
