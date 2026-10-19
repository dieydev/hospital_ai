import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, Button, Dropdown, Tag, Drawer, Divider, Switch, Badge } from 'antd';
import {
  PhoneOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  QrcodeOutlined,
  UserOutlined,
  SearchOutlined,
  LoginOutlined,
  LogoutOutlined,
  IdcardOutlined,
  HomeOutlined,
  AlertOutlined,
  MenuOutlined,
  MedicineBoxOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  FileTextOutlined,
  RightOutlined,
  CheckCircleOutlined,
  CameraOutlined,
  CalendarOutlined,
  DownOutlined,
  InfoCircleOutlined,
  ReadOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';
import { ElderlyModeWidget, ELDERLY_MODE_STORAGE_KEY } from './ElderlyModeWidget';
import { showToast } from '../utils/sweetAlert';
import { isPatientProfileComplete } from '../utils/authHelper';

interface PatientPortalHeaderProps {
  onOpenLookup?: () => void;
  onOpenProfile?: () => void;
  onSelectBookingTab?: (tab: 'byDept' | 'byDoctor' | 'byPackage' | 'byFollowUp') => void;
}

export const PatientPortalHeader: React.FC<PatientPortalHeaderProps> = ({
  onOpenLookup,
  onOpenProfile,
  onSelectBookingTab,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isElderlyMode, setIsElderlyMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ELDERLY_MODE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Đồng bộ trạng thái Chế độ Người cao tuổi
  useEffect(() => {
    const handleSync = () => {
      const active = localStorage.getItem(ELDERLY_MODE_STORAGE_KEY) === 'true';
      setIsElderlyMode(active);
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('dmedical_elderly_mode_change', handleSync as EventListener);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('dmedical_elderly_mode_change', handleSync as EventListener);
    };
  }, []);

  const toggleElderlyMode = () => {
    const nextState = !isElderlyMode;
    setIsElderlyMode(nextState);
    try {
      if (nextState) {
        document.body.classList.add('elderly-mode');
        localStorage.setItem(ELDERLY_MODE_STORAGE_KEY, 'true');
        showToast('Đã BẬT Chế độ Chữ To & Dễ Đọc dành cho Người Cao Tuổi!', 'success');
      } else {
        document.body.classList.remove('elderly-mode');
        localStorage.setItem(ELDERLY_MODE_STORAGE_KEY, 'false');
        showToast('Đã chuyển về Giao diện Tiêu chuẩn.', 'info');
      }
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent('dmedical_elderly_mode_change', { detail: nextState }));
  };

  const currentPath = location.pathname;

  const isProfileComplete = (u: any): boolean => {
    if (!u) return true;
    return isPatientProfileComplete(u);
  };

  const handleNavClick = (route: string, tab?: 'byDept' | 'byDoctor' | 'byPackage' | 'byFollowUp') => {
    setMobileDrawerOpen(false);
    if (route === '/booking') {
      if (currentPath === '/booking' || currentPath === '/dat-lich') {
        if (tab && onSelectBookingTab) {
          onSelectBookingTab(tab);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        navigate(tab ? `/booking?mode=${tab}` : '/booking');
      }
    } else {
      navigate(route);
    }
  };

  const patientDropdownItems = [
    {
      key: 'user-header',
      label: (
        <div style={{ padding: '8px 6px', minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar
              src={user?.avatarUrl}
              icon={<UserOutlined />}
              style={{ backgroundColor: '#0284c7' }}
              size={42}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>
                {user?.hoTen || user?.tenDangNhap}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{user?.soDienThoai || 'Chưa cập nhật SĐT'}</div>
            </div>
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Tag color="cyan" style={{ margin: 0, fontWeight: 700 }}>
              Bệnh nhân
            </Tag>
            {user?.maBenhNhan && (
              <Tag color="geekblue" style={{ margin: 0, fontFamily: 'monospace' }}>
                {user.maBenhNhan}
              </Tag>
            )}
            {!isProfileComplete(user) && (
              <Tag color="warning" style={{ margin: 0, fontWeight: 700 }}>
                Thiếu hồ sơ
              </Tag>
            )}
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'profile',
      icon: <IdcardOutlined style={{ fontSize: 16, color: '#0284c7' }} />,
      label: (
        <div style={{ padding: '2px 0' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>Hồ sơ của tôi</div>
          <div style={{ fontSize: 11.5, color: '#64748b' }}>Cập nhật CCCD, Ngày sinh, Địa chỉ & BHYT</div>
        </div>
      ),
      onClick: () => {
        if (onOpenProfile) onOpenProfile();
        else navigate('/booking?profile=open');
      },
    },
    {
      key: 'change-avatar',
      icon: <CameraOutlined style={{ fontSize: 16, color: '#0284c7' }} />,
      label: (
        <div style={{ padding: '2px 0' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>Đổi ảnh đại diện</div>
          <div style={{ fontSize: 11.5, color: '#64748b' }}>Chọn avatar mẫu hoặc tải ảnh chân dung</div>
        </div>
      ),
      onClick: () => {
        if (onOpenProfile) onOpenProfile();
        else navigate('/booking?profile=open');
      },
    },
    {
      key: 'lookup',
      icon: <CalendarOutlined style={{ fontSize: 16, color: '#0284c7' }} />,
      label: (
        <div style={{ padding: '2px 0' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>Lịch khám của tôi</div>
          <div style={{ fontSize: 11.5, color: '#64748b' }}>Xem lịch hẹn đã đặt, lấy mã QR & đổi/hủy lịch</div>
        </div>
      ),
      onClick: () => {
        if (onOpenLookup) onOpenLookup();
        else navigate('/booking?lookup=open');
      },
    },
    ...(user?.vaiTro?.some((r) => ['Admin', 'Doctor', 'Nurse', 'Receptionist'].includes(r))
      ? [
          { type: 'divider' as const },
          {
            key: 'admin',
            icon: <HomeOutlined style={{ fontSize: 16, color: '#0284c7' }} />,
            label: (
              <div style={{ padding: '2px 0' }}>
                <div style={{ fontWeight: 700, color: '#0369a1', fontSize: 13.5 }}>Vào Web Quản Trị</div>
                <div style={{ fontSize: 11.5, color: '#64748b' }}>Trang điều hành phòng khám & bác sĩ</div>
              </div>
            ),
            onClick: () => navigate('/dashboard'),
          },
        ]
      : []),
    { type: 'divider' as const },
    {
      key: 'logout',
      danger: true,
      icon: <LogoutOutlined style={{ fontSize: 16 }} />,
      label: <span style={{ fontWeight: 700, fontSize: 13.5 }}>Đăng xuất</span>,
      onClick: () => {
        logout();
        navigate('/booking');
      },
    },
  ];

  const isInfoActive = [
    '/gioi-thieu',
    '/about',
    '/huong-dan',
    '/guide',
    '/tin-tuc',
    '/news',
  ].includes(currentPath);

  const infoDropdownItems = [
    {
      key: 'about',
      icon: <InfoCircleOutlined style={{ color: '#0284c7', fontSize: 16 }} />,
      label: (
        <div style={{ padding: '2px 0' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>Giới thiệu bệnh viện</div>
          <div style={{ fontSize: 11.5, color: '#64748b' }}>Đội ngũ y bác sĩ & sứ mệnh phục vụ</div>
        </div>
      ),
      onClick: () => handleNavClick('/gioi-thieu'),
    },
    {
      key: 'guide',
      icon: <QuestionCircleOutlined style={{ color: '#0284c7', fontSize: 16 }} />,
      label: (
        <div style={{ padding: '2px 0' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>Hướng dẫn đi khám</div>
          <div style={{ fontSize: 11.5, color: '#64748b' }}>Quy trình tiếp nhận, BHYT & chuẩn bị khám</div>
        </div>
      ),
      onClick: () => handleNavClick('/huong-dan'),
    },
    {
      key: 'news',
      icon: <ReadOutlined style={{ color: '#0284c7', fontSize: 16 }} />,
      label: (
        <div style={{ padding: '2px 0' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>Tin tức & Y khoa</div>
          <div style={{ fontSize: 11.5, color: '#64748b' }}>Kiến thức sức khỏe & hoạt động mới nhất</div>
        </div>
      ),
      onClick: () => handleNavClick('/tin-tuc'),
    },
  ];

  return (
    <>
      {/* 1. Top Utility & Emergency Hotline Bar */}
      <div className="booking-top-bar">
        <div className="booking-top-bar-content">
          <div className="booking-top-bar-left">
            <div className="booking-top-bar-item">
              <span className="booking-top-bar-badge">
                <AlertOutlined /> CẤP CỨU 24/7
              </span>
              <strong>1900 1150</strong>
            </div>
            <div className="booking-top-bar-item hide-on-mobile">
              <PhoneOutlined />
              <span>Tổng đài CSKH: <strong>(028) 3855 0000</strong></span>
            </div>
            <div className="booking-top-bar-item hide-on-mobile">
              <ClockCircleOutlined />
              <span>Tiếp nhận khám: <strong>06:30 - 17:00</strong> (T2 - CN)</span>
            </div>
          </div>
          <div className="booking-top-bar-right">
            <div className="booking-top-bar-item hide-on-mobile">
              <EnvironmentOutlined />
              <span>215 Hồng Bàng, P.11, Q.5, TP.HCM</span>
            </div>
            <Tag color="cyan" className="hide-on-tablet-mobile" style={{ margin: 0, fontWeight: 700, borderRadius: 12, fontSize: 11 }}>
              <QrcodeOutlined /> Đặt Hẹn Trước • Khám Đúng Giờ
            </Tag>
            {/* Nút Bật/Tắt Chế Độ Chữ To Cho Người Cao Tuổi trên Topbar */}
            <button
              type="button"
              onClick={toggleElderlyMode}
              className={`header-elderly-pill ${isElderlyMode ? 'active' : ''}`}
              title="Nhấp để bật cỡ chữ lớn, độ tương phản cao và phím bấm to bản cho người cao tuổi"
              aria-label="Chế độ chữ to người lớn tuổi"
            >
              <span className="pill-badge">A{isElderlyMode ? '-' : '+'}</span>
              <span>{isElderlyMode ? 'Đang bật Chữ To' : 'Chữ To Dễ Đọc'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Header Navbar */}
      <header className="booking-navbar">
        <div className="booking-navbar-content">
          {/* Logo & Brand */}
          <div className="booking-brand" onClick={() => navigate('/')}>
            <img
              src="/logo.png"
              alt="D-Medical Healthcare Connected"
              className="booking-brand-logo"
            />
            <div className="booking-brand-text hide-on-mobile">
              <div className="booking-brand-title">
                Bệnh Viện Đa Khoa D-Medical
              </div>
              <div className="booking-brand-subtitle">
                Cổng Chăm Sóc Sức Khỏe & Đặt Khám
              </div>
            </div>
          </div>

          {/* Menu Điều Hướng Trung Tâm Tinh Gọn */}
          <nav className="booking-nav-center hide-on-tablet-mobile">
            <span
              className={`booking-nav-link ${currentPath === '/' || currentPath === '/home' ? 'active' : ''}`}
              onClick={() => handleNavClick('/')}
            >
              Trang chủ
            </span>

            <span
              className={`booking-nav-link ${currentPath === '/booking' || currentPath === '/dat-lich' ? 'active' : ''}`}
              onClick={() => handleNavClick('/booking')}
            >
              Đặt khám
            </span>

            <span
              className={`booking-nav-link ${currentPath === '/chuyen-khoa' || currentPath === '/departments' ? 'active' : ''}`}
              onClick={() => handleNavClick('/chuyen-khoa')}
            >
              Chuyên khoa
            </span>

            <span
              className={`booking-nav-link ${currentPath === '/bac-si' || currentPath === '/doctors' ? 'active' : ''}`}
              onClick={() => handleNavClick('/bac-si')}
            >
              Bác sĩ
            </span>

            <span
              className={`booking-nav-link ${currentPath === '/goi-kham' || currentPath === '/packages' ? 'active' : ''}`}
              onClick={() => handleNavClick('/goi-kham')}
            >
              Gói khám
            </span>

            <Dropdown
              menu={{ items: infoDropdownItems }}
              placement="bottom"
              arrow={{ pointAtCenter: true }}
            >
              <span
                className={`booking-nav-link ${isInfoActive ? 'active' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                Thông tin <DownOutlined style={{ fontSize: 11, marginLeft: 4 }} />
              </span>
            </Dropdown>
          </nav>

          {/* User Account / Auth Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Button
                  icon={<CalendarOutlined style={{ color: '#0284c7', fontSize: 15 }} />}
                  onClick={() => {
                    if (onOpenLookup) onOpenLookup();
                    else navigate('/booking?lookup=open');
                  }}
                  style={{
                    borderColor: '#bae6fd',
                    color: '#0369a1',
                    fontWeight: 600,
                    backgroundColor: '#ffffff',
                    height: 40,
                    borderRadius: 10,
                    fontSize: 14,
                    padding: '0 16px',
                  }}
                  className="compact-btn-on-mobile"
                >
                  Lịch khám của tôi
                </Button>
                <Dropdown
                  menu={{ items: patientDropdownItems }}
                  trigger={['click']}
                  placement="bottomRight"
                  arrow={{ pointAtCenter: true }}
                >
                  <div
                    className="patient-profile-circle-btn"
                    title={`${user.hoTen || user.tenDangNhap} - Nhấp để xem hồ sơ & tùy chọn`}
                  >
                    <Badge
                      dot={!isProfileComplete(user)}
                      color="#f59e0b"
                      offset={[-2, 3]}
                    >
                      <Avatar
                        src={user.avatarUrl}
                        icon={<UserOutlined />}
                        style={{ backgroundColor: '#0284c7' }}
                        size={38}
                      />
                    </Badge>
                  </div>
                </Dropdown>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Button
                  icon={<SearchOutlined style={{ fontSize: 14 }} />}
                  onClick={() => {
                    if (onOpenLookup) onOpenLookup();
                    else navigate('/booking?lookup=open');
                  }}
                  style={{
                    borderColor: '#bae6fd',
                    color: '#0369a1',
                    fontWeight: 600,
                    height: 40,
                    borderRadius: 10,
                    fontSize: 14,
                    padding: '0 16px',
                  }}
                  className="compact-btn-on-mobile"
                >
                  Tra cứu lịch hẹn
                </Button>
                <Button
                  type="primary"
                  icon={<LoginOutlined style={{ fontSize: 14 }} />}
                  style={{
                    backgroundColor: '#0284c7',
                    borderColor: '#0284c7',
                    fontWeight: 600,
                    height: 40,
                    borderRadius: 10,
                    fontSize: 14,
                    padding: '0 18px',
                  }}
                  onClick={() => navigate('/login?redirect=' + encodeURIComponent(currentPath))}
                  className="compact-btn-on-mobile"
                >
                  Đăng nhập
                </Button>
              </div>
            )}

            {/* Mobile Menu Hamburger Toggle Button */}
            <Button
              type="default"
              icon={<MenuOutlined style={{ fontSize: 18, color: '#0284c7' }} />}
              className="mobile-nav-toggle-btn show-on-tablet-mobile"
              onClick={() => setMobileDrawerOpen(true)}
              title="Mở menu điều hướng"
              style={{
                borderColor: '#bae6fd',
                backgroundColor: '#f0f9ff',
                width: 40,
                height: 40,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
              }}
            />
          </div>
        </div>
      </header>

      {/* 3. Mobile Navigation Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/logo.png" alt="D-Medical" style={{ height: 32, objectFit: 'contain' }} />
              <div>
                <div style={{ fontWeight: 900, fontSize: 13, color: '#0369a1', lineHeight: 1.2 }}>
                  BỆNH VIỆN D-MEDICAL
                </div>
                <div style={{ fontSize: 10.5, color: '#64748b' }}>Cổng Thông Tin Bệnh Nhân</div>
              </div>
            </div>
          </div>
        }
        placement="right"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        width={320}
        styles={{
          body: { padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' },
          header: { padding: '12px 16px', borderBottom: '1.5px solid #bae6fd' },
        }}
      >
        {/* User Card inside Drawer */}
        {user ? (
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              backgroundColor: '#f0f9ff',
              border: '1.5px solid #bae6fd',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar
                src={user.avatarUrl}
                icon={<UserOutlined />}
                style={{ backgroundColor: '#0284c7' }}
                size={42}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>
                  {user.hoTen || user.tenDangNhap}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {user.soDienThoai || 'Chưa cập nhật SĐT'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              <Tag color="cyan" style={{ margin: 0, fontWeight: 700 }}>Bệnh nhân</Tag>
              {user.maBenhNhan && (
                <Tag color="geekblue" style={{ margin: 0, fontFamily: 'monospace' }}>
                  {user.maBenhNhan}
                </Tag>
              )}
              {!isProfileComplete(user) && (
                <Tag color="warning" style={{ margin: 0, fontWeight: 700 }}>Thiếu hồ sơ</Tag>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Button
                size="small"
                icon={<CalendarOutlined />}
                style={{ flex: 1, borderColor: '#bae6fd', color: '#0284c7', fontWeight: 700, borderRadius: 8, backgroundColor: '#ffffff' }}
                onClick={() => {
                  setMobileDrawerOpen(false);
                  if (onOpenLookup) onOpenLookup();
                  else navigate('/booking?lookup=open');
                }}
              >
                Lịch khám
              </Button>
              <Button
                size="small"
                icon={<IdcardOutlined />}
                style={{ flex: 1, borderColor: '#bae6fd', color: '#0369a1', fontWeight: 600, borderRadius: 8 }}
                onClick={() => {
                  setMobileDrawerOpen(false);
                  if (onOpenProfile) onOpenProfile();
                  else navigate('/booking?profile=open');
                }}
              >
                Hồ sơ
              </Button>
              <Button
                size="small"
                danger
                icon={<LogoutOutlined />}
                style={{ fontWeight: 600, borderRadius: 8 }}
                onClick={() => {
                  setMobileDrawerOpen(false);
                  logout();
                  navigate('/booking');
                }}
              >
                Đăng xuất
              </Button>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              backgroundColor: '#f0f9ff',
              border: '1.5px solid #bae6fd',
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0369a1', marginBottom: 4 }}>
              Chào mừng Quý khách đến với D-Medical
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
              Đăng nhập để lưu lịch hẹn, nhận mã QR và theo dõi hồ sơ bệnh án
            </div>
            <Button
              type="primary"
              block
              icon={<LoginOutlined />}
              style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 700, borderRadius: 8 }}
              onClick={() => {
                setMobileDrawerOpen(false);
                navigate('/login?redirect=' + encodeURIComponent(currentPath));
              }}
            >
              Đăng Nhập / Đăng Ký
            </Button>
          </div>
        )}

        {/* Chế độ Chữ To Người Cao Tuổi trong Mobile Drawer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderRadius: 12,
            backgroundColor: isElderlyMode ? '#fef3c7' : '#f0f9ff',
            border: isElderlyMode ? '1.5px solid #f59e0b' : '1.5px solid #bae6fd',
            boxShadow: isElderlyMode ? '0 4px 14px rgba(245, 158, 11, 0.15)' : 'none',
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 13.5, color: isElderlyMode ? '#92400e' : '#0369a1' }}>
              Chế độ Chữ To Dễ Đọc
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              Cỡ chữ lớn, nút bấm to cho Người cao tuổi
            </div>
          </div>
          <Switch
            checked={isElderlyMode}
            onChange={toggleElderlyMode}
            checkedChildren="BẬT"
            unCheckedChildren="TẮT"
            style={{ backgroundColor: isElderlyMode ? '#f59e0b' : undefined }}
          />
        </div>

        {/* Navigation List */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, paddingLeft: 6 }}>
            Menu Điều Hướng
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div
              className={`mobile-drawer-nav-item ${currentPath === '/' || currentPath === '/home' ? 'active' : ''}`}
              onClick={() => handleNavClick('/')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <HomeOutlined style={{ color: '#0284c7' }} />
                <span>Trang Chủ</span>
              </div>
              <RightOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
            </div>

            <div
              className={`mobile-drawer-nav-item ${currentPath === '/booking' || currentPath === '/dat-lich' ? 'active' : ''}`}
              onClick={() => handleNavClick('/booking')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircleOutlined style={{ color: '#0284c7' }} />
                <span>Đặt Khám Trực Tuyến</span>
              </div>
              <RightOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
            </div>

            <div
              className={`mobile-drawer-nav-item ${currentPath === '/chuyen-khoa' || currentPath === '/departments' ? 'active' : ''}`}
              onClick={() => handleNavClick('/chuyen-khoa')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MedicineBoxOutlined style={{ color: '#0284c7' }} />
                <span>Khám Chuyên Khoa</span>
              </div>
              <Tag color="cyan" style={{ margin: 0, fontSize: 10 }}>9 Khoa</Tag>
            </div>

            <div
              className={`mobile-drawer-nav-item ${currentPath === '/bac-si' || currentPath === '/doctors' ? 'active' : ''}`}
              onClick={() => handleNavClick('/bac-si')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <UserOutlined style={{ color: '#0284c7' }} />
                <span>Bác Sĩ Chuyên Gia</span>
              </div>
              <Tag color="gold" style={{ margin: 0, fontSize: 10 }}>CKII / TS</Tag>
            </div>

            <div
              className={`mobile-drawer-nav-item ${currentPath === '/goi-kham' || currentPath === '/packages' ? 'active' : ''}`}
              onClick={() => handleNavClick('/goi-kham')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ThunderboltOutlined style={{ color: '#e11d48' }} />
                <span>Gói Khám & Tầm Soát</span>
              </div>
              <Tag color="error" style={{ margin: 0, fontSize: 10 }}>Ưu đãi 15%</Tag>
            </div>

            <div
              className="mobile-drawer-nav-item"
              onClick={() => handleNavClick('/booking', 'byFollowUp')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <HistoryOutlined style={{ color: '#0284c7' }} />
                <span>Tái Khám Theo Hẹn</span>
              </div>
              <RightOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
            </div>

            <Divider style={{ margin: '8px 0' }} />

            <div
              className={`mobile-drawer-nav-item ${currentPath === '/gioi-thieu' || currentPath === '/about' ? 'active' : ''}`}
              onClick={() => handleNavClick('/gioi-thieu')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <HomeOutlined style={{ color: '#0284c7' }} />
                <span>Giới Thiệu Bệnh Viện</span>
              </div>
              <RightOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
            </div>

            <div
              className={`mobile-drawer-nav-item ${currentPath === '/huong-dan' || currentPath === '/guide' ? 'active' : ''}`}
              onClick={() => handleNavClick('/huong-dan')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileTextOutlined style={{ color: '#0284c7' }} />
                <span>Quy Trình & Hướng Dẫn BHYT</span>
              </div>
              <RightOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
            </div>

            <div
              className={`mobile-drawer-nav-item ${currentPath === '/tin-tuc' || currentPath === '/news' ? 'active' : ''}`}
              onClick={() => handleNavClick('/tin-tuc')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <QrcodeOutlined style={{ color: '#0284c7' }} />
                <span>Tin Tức & Y Học Thường Thức</span>
              </div>
              <RightOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
            </div>

            <div
              className="mobile-drawer-nav-item"
              onClick={() => {
                setMobileDrawerOpen(false);
                if (onOpenLookup) onOpenLookup();
                else navigate('/booking?lookup=open');
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <SearchOutlined style={{ color: '#0284c7' }} />
                <span>Tra Cứu Lịch Hẹn & Mã QR</span>
              </div>
              <Tag color="cyan" style={{ margin: 0, fontSize: 10 }}>Tra cứu</Tag>
            </div>
          </div>
        </div>

        {/* Emergency & Hospital Support Contact */}
        <div
          style={{
            marginTop: 'auto',
            padding: 12,
            borderRadius: 12,
            backgroundColor: '#fff1f2',
            border: '1px solid #fecdd3',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e11d48', fontWeight: 800, fontSize: 13, marginBottom: 6 }}>
            <AlertOutlined /> CẤP CỨU & HỖ TRỢ 24/7
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <a
              href="tel:19001150"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 8,
                backgroundColor: '#ffffff',
                border: '1px solid #fda4af',
                color: '#e11d48',
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none',
              }}
            >
              <span><AlertOutlined style={{ marginRight: 6 }} />Cấp cứu 24/24:</span>
              <strong style={{ fontSize: 14 }}>1900 1150</strong>
            </a>

            <a
              href="tel:02838550000"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 8,
                backgroundColor: '#ffffff',
                border: '1px solid #bae6fd',
                color: '#0369a1',
                fontWeight: 600,
                fontSize: 12.5,
                textDecoration: 'none',
              }}
            >
              <span><PhoneOutlined style={{ marginRight: 6 }} />Tổng đài Đặt hẹn:</span>
              <strong>(028) 3855 0000</strong>
            </a>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
            215 Hồng Bàng, P.11, Q.5, TP.HCM<br />
            Giờ khám: 06:30 - 17:00 (T2 - CN)
          </div>
        </div>
      </Drawer>

      {/* Widget Nút Nổi Trợ Năng Cho Người Cao Tuổi & Gọi Khẩn Cấp */}
      <ElderlyModeWidget />
    </>
  );
};
