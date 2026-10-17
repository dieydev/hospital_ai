import React, { useState, useEffect, useRef } from 'react';
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

export const PatientHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { syncCurrentUser } = useAuthStore();

  useEffect(() => {
    syncCurrentUser();
  }, [syncCurrentUser]);

  // Search omnibar
  const [searchQuery, setSearchQuery] = useState('');
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

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
        onOpenLookup={() => setLookupModalOpen(true)}
        onOpenProfile={() => setCompleteProfileModalOpen(true)}
      />

      {/* Dòng chữ chạy qua lại thông báo người bệnh (Đặt ở dưới Header & Kích thước to rõ hơn) */}
      <div className="marquee-banner">
        <div className="marquee-prefix">
          <SoundOutlined style={{ fontSize: 15 }} /> THÔNG BÁO
        </div>
        <div className="marquee-content-wrap">
          <div className="marquee-track">
            Kính chào Quý người bệnh và thân nhân: Bệnh viện Đa khoa D-Medical tiếp nhận khám chữa bệnh tất cả các ngày trong tuần (kể cả Thứ 7 & Chủ Nhật) • Quý khách vui lòng đặt hẹn trước để được vào khám đúng giờ, không lo xếp hàng chờ đợi • Hỗ trợ BHYT thông tuyến toàn quốc và bảo lãnh viện phí trực tiếp • Tổng đài chăm sóc và hỗ trợ người bệnh 24/7: 1900 6868 • Cấp cứu khẩn cấp: 1900 8888.
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
          <div className="medpro-search-bar-wrap">
            <SearchOutlined className="medpro-search-icon" />
            <Input
              className="medpro-search-input"
              placeholder="Tìm kiếm chuyên khoa, bác sĩ, gói khám, triệu chứng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Promotional Banner Advertising Slider (Medpro Style Carousel) */}
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
            {/* Slide 1 */}
            <div className="carousel-slide-card slide-bg-1">
              <Row gutter={[24, 20]} className="carousel-slide-row">
                <Col xs={24} md={15}>
                  <div className="carousel-slide-badge">
                    <span>TIẾP NHẬN THÔNG MINH</span>
                  </div>
                  <div className="carousel-slide-title">
                    Đặt Hẹn Theo Giờ • Quét Mã QR Vào Khám Ngay
                  </div>
                  <div className="carousel-slide-desc">
                    Chủ động chọn bác sĩ và giờ khám. Đến viện <strong>quét mã QR vào thẳng buồng khám</strong>, không cần bốc số.
                  </div>
                  <div className="carousel-slide-highlights">
                    <span className="carousel-slide-highlight-item">
                      <CheckCircleOutlined /> Không xếp hàng chờ đợi
                    </span>
                    <span className="carousel-slide-highlight-item">
                      <SafetyCertificateOutlined /> Áp dụng BHYT toàn quốc
                    </span>
                    <span className="carousel-slide-highlight-item">
                      <ClockCircleOutlined /> Khám từ thứ Hai đến Chủ nhật
                    </span>
                  </div>
                  <div className="carousel-slide-btn-group">
                    <button
                      type="button"
                      className="carousel-slide-btn"
                      onClick={() => navigate('/booking')}
                    >
                      <span>Đặt Lịch Khám Ngay</span>
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>
                        PHIẾU TIẾP NHẬN ĐIỆN TỬ
                      </span>
                      <Tag color="cyan" style={{ margin: 0, fontWeight: 800 }}>MÃ QR HỢP LỆ</Tag>
                    </div>
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                      <div style={{ display: 'inline-block', padding: 8, background: '#fff', borderRadius: 12, border: '2px solid #bae6fd' }}>
                        <QRCodeSVG value="MEDQR|SAMPLE|2026|DEMO" size={120} level="M" fgColor="#0369a1" />
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', textAlign: 'center', marginTop: 4 }}>
                      Quét tại Kiosk Sảnh A để nhận số phòng khám ngay
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Slide 2 */}
            <div className="carousel-slide-card slide-bg-2">
              <Row gutter={[24, 20]} className="carousel-slide-row">
                <Col xs={24} md={15}>
                  <div className="carousel-slide-badge" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}>
                    <span>TIẾT KIỆM ĐẾN 30% CHI PHÍ</span>
                  </div>
                  <div className="carousel-slide-title">
                    Gói Khám Tổng Quát & Tầm Soát Chuyên Sâu
                  </div>
                  <div className="carousel-slide-desc">
                    Quy trình khám khép kín, đầy đủ cận lâm sàng công nghệ cao (MRI 3.0T, CT 128 lát cắt). Bác sĩ đầu ngành trực tiếp tư vấn.
                  </div>
                  <div className="carousel-slide-highlights">
                    <span className="carousel-slide-highlight-item"><CheckCircleOutlined /> Gói Cơ Bản & Nâng Cao</span>
                    <span className="carousel-slide-highlight-item"><CheckCircleOutlined /> Tầm soát Ung thư Sớm</span>
                    <span className="carousel-slide-highlight-item"><SafetyCertificateOutlined /> BHYT hỗ trợ trực tiếp</span>
                  </div>
                  <div className="carousel-slide-btn-group">
                    <button type="button" className="carousel-slide-btn" onClick={() => navigate('/booking?mode=byPackage')}>
                      <span>Xem Gói Khám</span>
                      <ArrowRightOutlined />
                    </button>
                    <button type="button" className="carousel-slide-btn carousel-slide-btn-secondary" onClick={() => navigate('/goi-kham')}>
                      <span>Chi tiết danh mục</span>
                    </button>
                  </div>
                </Col>
                <Col xs={0} md={9} className="carousel-slide-visual">
                  <div className="carousel-preview-card" style={{ borderColor: '#6ee7b7' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#059669', marginBottom: 6 }}>
                      GÓI KHÁM SỨC KHỎE VIP
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#0284c7' }}>1.850.000 đ</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'line-through' }}>2.500.000 đ</div>
                    <div style={{ fontSize: 12, color: '#334155', marginTop: 8 }}>
                      • Xét nghiệm máu 18 chỉ số<br />• Siêu âm ổ bụng tổng quát<br />• Chụp X-Quang phổi kỹ thuật số
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </Carousel>
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
                  <span className="medpro-rating-badge">⭐ 5.0 (450+ lượt khám)</span>
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

                <div style={{ fontWeight: 800, fontSize: 14.5, color: '#0f172a', marginBottom: 2 }}>{doc.name}</div>
                <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 700 }}>{doc.department}</div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2, minHeight: 34 }}>{doc.title}</div>

                <div style={{ margin: '8px 0 10px' }}>
                  <span className="medpro-rating-badge">⭐ {doc.rating} (150+ lượt)</span>
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
          <Tag color="cyan" style={{ fontSize: 13, fontWeight: 700, padding: '4px 14px', borderRadius: 20 }}>
            QUY TRÌNH TIẾP NHẬN
          </Tag>
          <Title level={2} style={{ color: '#0f172a', fontWeight: 800, marginTop: 10, marginBottom: 6 }}>
            Quy trình khám bệnh 3 bước
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
              fontWeight: 800,
              height: 48,
              borderRadius: 12,
              padding: '0 32px',
              fontSize: 15,
              boxShadow: '0 6px 18px rgba(2, 132, 199, 0.25)',
            }}
            onClick={() => navigate('/booking')}
          >
            BẮT ĐẦU ĐẶT KHÁM NGAY
          </Button>
        </div>
      </section>

      {/* 9. FAQ & Testimonials */}
      <section style={{ maxWidth: 1200, margin: '0 auto 48px', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Tag color="blue" style={{ fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>
            HỖ TRỢ BỆNH NHÂN
          </Tag>
          <Title level={2} style={{ color: '#0f172a', fontWeight: 800, marginTop: 10, marginBottom: 6 }}>
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
