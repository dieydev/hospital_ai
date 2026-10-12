import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, Button, Dropdown, Tag } from 'antd';
import {
  PhoneOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  QrcodeOutlined,
  UserOutlined,
  DownOutlined,
  SearchOutlined,
  LoginOutlined,
  LogoutOutlined,
  IdcardOutlined,
  HomeOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';

interface PatientPortalHeaderProps {
  onOpenLookup?: () => void;
  onOpenProfile?: () => void;
  onSelectBookingTab?: (tab: 'byDept' | 'byDoctor' | 'byPackage') => void;
}

export const PatientPortalHeader: React.FC<PatientPortalHeaderProps> = ({
  onOpenLookup,
  onOpenProfile,
  onSelectBookingTab,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const currentPath = location.pathname;

  const isProfileComplete = (u: any): boolean => {
    if (!u) return true;
    return Boolean(u.soCCCD && (u.ngaySinh || u.namSinh) && u.diaChi);
  };

  const handleNavClick = (route: string, tab?: 'byDept' | 'byDoctor' | 'byPackage') => {
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
      key: 'lookup',
      icon: <SearchOutlined style={{ fontSize: 16, color: '#0284c7' }} />,
      label: (
        <div style={{ padding: '2px 0' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>Tra cứu phiếu hẹn QR</div>
          <div style={{ fontSize: 11.5, color: '#64748b' }}>Tìm nhanh phiếu tiếp nhận bằng mã hẹn</div>
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

  return (
    <>
      {/* 1. Top Utility & Emergency Hotline Bar */}
      <div className="booking-top-bar">
        <div className="booking-top-bar-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div className="booking-top-bar-item">
              <span className="booking-top-bar-badge">
                <AlertOutlined /> CẤP CỨU 24/7
              </span>
              <strong>1900 1150</strong> (Trực cấp cứu 24/24)
            </div>
            <div className="booking-top-bar-item hide-on-mobile">
              <PhoneOutlined />
              <span>Tổng đài Đặt hẹn & CSKH: <strong>(028) 3855 0000</strong></span>
            </div>
            <div className="booking-top-bar-item hide-on-mobile">
              <ClockCircleOutlined />
              <span>Tiếp nhận khám: <strong>06:30 - 17:00</strong> (T2 - CN)</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="booking-top-bar-item hide-on-mobile">
              <EnvironmentOutlined />
              <span>215 Hồng Bàng, P.11, Q.5, TP.HCM</span>
            </div>
            <Tag color="cyan" style={{ margin: 0, fontWeight: 700, borderRadius: 12, fontSize: 11 }}>
              <QrcodeOutlined /> Đặt Hẹn Trước • Vào Khám Đúng Giờ
            </Tag>
          </div>
        </div>
      </div>

      {/* 2. Main Header Navbar */}
      <header className="booking-navbar">
        <div className="booking-navbar-content">
          {/* Logo & Brand */}
          <div className="booking-brand" onClick={() => navigate('/booking')}>
            <img
              src="/logo.png"
              alt="D-Medical Healthcare Connected"
              className="booking-brand-logo"
            />
            <div
              className="hide-on-mobile"
              style={{
                borderLeft: '1.5px solid #bae6fd',
                paddingLeft: 12,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div className="booking-brand-title">
                Bệnh Viện Đa Khoa D-Medical
              </div>
              <div className="booking-brand-subtitle">
                Cổng Đặt Lịch Khám & Chăm Sóc Người Bệnh
              </div>
            </div>
          </div>

          {/* Menu Điều Hướng Trung Tâm (Hoàn toàn bằng chữ, không lạm dụng icon, thanh lịch & rõ ràng) */}
          <nav className="booking-nav-center hide-on-tablet-mobile">
            <span
              className={`booking-nav-link ${currentPath === '/booking' || currentPath === '/dat-lich' ? 'active' : ''}`}
              onClick={() => handleNavClick('/booking')}
            >
              Đặt khám
            </span>

            <span
              className={`booking-nav-link ${currentPath === '/gioi-thieu' || currentPath === '/about' ? 'active' : ''}`}
              onClick={() => handleNavClick('/gioi-thieu')}
            >
              Giới thiệu
            </span>

            <span
              className="booking-nav-link"
              onClick={() => handleNavClick('/booking', 'byDept')}
            >
              Chuyên khoa
            </span>

            <span
              className="booking-nav-link"
              onClick={() => handleNavClick('/booking', 'byDoctor')}
            >
              Bác sĩ
            </span>

            <span
              className="booking-nav-link"
              onClick={() => handleNavClick('/booking', 'byPackage')}
            >
              Gói khám
            </span>

            <span
              className={`booking-nav-link ${currentPath === '/tin-tuc' || currentPath === '/news' ? 'active' : ''}`}
              onClick={() => handleNavClick('/tin-tuc')}
            >
              Tin tức
            </span>

            <span
              className={`booking-nav-link ${currentPath === '/huong-dan' || currentPath === '/guide' ? 'active' : ''}`}
              onClick={() => handleNavClick('/huong-dan')}
            >
              Hướng dẫn
            </span>
          </nav>

          {/* User Account / Auth Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user ? (
              <Dropdown
                menu={{ items: patientDropdownItems }}
                trigger={['click']}
                placement="bottomRight"
                arrow={{ pointAtCenter: true }}
              >
                <div
                  className="patient-profile-pill"
                  title="Nhấp để xem các tùy chọn hồ sơ & lịch hẹn"
                >
                  <Avatar
                    src={user.avatarUrl}
                    icon={<UserOutlined />}
                    style={{ backgroundColor: '#0284c7' }}
                    size="default"
                  />
                  <div style={{ lineHeight: 1.25, textAlign: 'left' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{user.hoTen || user.tenDangNhap}</span>
                      <DownOutlined style={{ fontSize: 10, color: '#0284c7' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 2 }}>
                      <Tag color="cyan" style={{ margin: 0, fontSize: 9.5, lineHeight: '14px', borderRadius: 6 }}>
                        Bệnh nhân
                      </Tag>
                      {user.maBenhNhan && (
                        <Tag color="geekblue" style={{ margin: 0, fontSize: 9.5, lineHeight: '14px', fontFamily: 'monospace', borderRadius: 6 }} className="hide-on-mobile">
                          {user.maBenhNhan}
                        </Tag>
                      )}
                      {!isProfileComplete(user) && (
                        <Tag color="warning" style={{ margin: 0, fontSize: 9.5, lineHeight: '14px', fontWeight: 700, borderRadius: 6 }}>
                          Thiếu hồ sơ
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>
              </Dropdown>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Button
                  icon={<SearchOutlined />}
                  onClick={() => {
                    if (onOpenLookup) onOpenLookup();
                    else navigate('/booking?lookup=open');
                  }}
                  style={{ borderColor: '#bae6fd', color: '#0369a1', fontWeight: 600 }}
                  className="compact-btn-on-mobile"
                >
                  Tra cứu <span className="hide-on-mobile">lịch hẹn &</span> QR
                </Button>
                <Button
                  type="primary"
                  icon={<LoginOutlined />}
                  style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 600 }}
                  onClick={() => navigate('/login?redirect=' + encodeURIComponent(currentPath))}
                  className="compact-btn-on-mobile"
                >
                  Đăng nhập
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
