import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Badge, Button, Input, Popover, List, Tag, Tooltip, Progress } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  SolutionOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  DollarOutlined,
  RobotOutlined,
  AppstoreOutlined,
  AuditOutlined,
  BarChartOutlined,
  BellOutlined,
  LogoutOutlined,
  SearchOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  ScheduleOutlined,
  CalendarOutlined,
  SunOutlined,
  MoonOutlined,
  InfoCircleOutlined,
  ApiOutlined,
  DisconnectOutlined,
  ApartmentOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { isStrictMode, setStrictMode } from '../utils/modeHelper';
import { showToast } from '../utils/sweetAlert';
import api from '../services/api';
import { AIChatDrawer } from '../components/AIChatDrawer';

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isGatewayOnline, setIsGatewayOnline] = useState<boolean | null>(null);
  const [strictMode, setStrictModeState] = useState<boolean>(isStrictMode());
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  useEffect(() => {
    const checkGatewayHealth = async () => {
      try {
        await api.get('/patients', { params: { pageSize: 1 }, timeout: 2500 });
        setIsGatewayOnline(true);
      } catch {
        setIsGatewayOnline(false);
      }
    };

    checkGatewayHealth();
    const interval = setInterval(checkGatewayHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleStrictMode = () => {
    const next = !strictMode;
    setStrictMode(next);
    setStrictModeState(next);
    if (next) {
      showToast('Đã bật Chế độ Kết nối Thực (Strict API). Khi tắt Docker, Web sẽ ngắt tải và hiển thị lỗi kết nối!', 'warning');
    } else {
      showToast('Đã bật Chế độ Dự phòng (Offline Fallback). Web dùng dữ liệu mẫu khi ngắt kết nối Docker.', 'info');
    }
  };

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Lịch hẹn đặt mới từ Mobile App',
      description: 'Bệnh nhân Trần Văn Nam vừa đăng ký hẹn khám Khoa Nội lúc 08:30 ngày 09/08',
      time: '5 phút trước',
      type: 'appointment',
      read: false,
    },
    {
      id: 2,
      title: 'Đã có kết quả Xét nghiệm CBC',
      description: 'Bệnh nhân BN20260001 (Nguyễn Văn An) đã có kết quả công thức máu',
      time: '18 phút trước',
      type: 'lab',
      read: false,
    },
    {
      id: 3,
      title: 'Bệnh nhân Cấp cứu Ưu tiên',
      description: 'Tiếp nhận bệnh nhân ưu tiên cao tại Phòng 102 - Khoa Nội',
      time: '45 phút trước',
      type: 'emergency',
      read: false,
    },
  ]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const notificationContent = (
    <div style={{ width: 340 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text strong style={{ fontSize: 14 }}>Thông báo mới nhất ({notifications.filter((n) => !n.read).length})</Text>
        <Button type="link" size="small" onClick={markAllAsRead} style={{ padding: 0 }}>
          Đánh dấu đã đọc
        </Button>
      </div>
      <List
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item
            style={{
              padding: '8px 4px',
              cursor: 'pointer',
              opacity: item.read ? 0.6 : 1,
              borderRadius: 8,
              marginBottom: 4,
            }}
            onClick={() => {
              if (item.type === 'appointment') navigate('/appointments');
              setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
            }}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  style={{
                    backgroundColor:
                      item.type === 'emergency'
                        ? '#f43f5e'
                        : item.type === 'appointment'
                        ? '#0284c7'
                        : '#10b981',
                  }}
                  icon={item.type === 'emergency' ? <InfoCircleOutlined /> : item.type === 'appointment' ? <CalendarOutlined /> : <MedicineBoxOutlined />}
                />
              }
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong style={{ fontSize: 13 }}>{item.title}</Text>
                  <Text type="secondary" style={{ fontSize: 10 }}>{item.time}</Text>
                </div>
              }
              description={<Text style={{ fontSize: 12, display: 'block' }}>{item.description}</Text>}
            />
          </List.Item>
        )}
      />
    </div>
  );

  const menuItems = [
    {
      type: 'group' as const,
      label: collapsed ? null : 'TIẾP ĐÓN & ĐIỀU PHỐI',
      children: [
        {
          key: '/dashboard',
          icon: <DashboardOutlined style={{ fontSize: 17 }} />,
          label: 'Tổng quan (Dashboard)',
        },
        {
          key: '/reception',
          icon: <ScheduleOutlined style={{ fontSize: 17 }} />,
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Tiếp nhận & Cấp số</span>
              <span className="sidebar-badge">42</span>
            </div>
          ),
        },
        {
          key: '/appointments',
          icon: <CalendarOutlined style={{ fontSize: 17 }} />,
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Lịch hẹn & Khung giờ</span>
              <span className="sidebar-badge">18 mới</span>
            </div>
          ),
        },
        {
          key: '/booking',
          icon: <GlobalOutlined style={{ fontSize: 17, color: '#0284c7' }} />,
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: '#0284c7' }}>Web Đặt Khám (Portal)</span>
              <span className="sidebar-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>24/7</span>
            </div>
          ),
        },
        {
          key: '/patients',
          icon: <UserOutlined style={{ fontSize: 17 }} />,
          label: 'Quản lý Bệnh nhân',
        },
      ],
    },
    {
      type: 'group' as const,
      label: collapsed ? null : 'KHÁM BỆNH & LÂM SÀNG',
      children: [
        {
          key: '/examinations',
          icon: <MedicineBoxOutlined style={{ fontSize: 17 }} />,
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Khám bệnh (SOAP)</span>
              <span className="sidebar-badge">12 ca</span>
            </div>
          ),
        },
        {
          key: '/emr',
          icon: <FileTextOutlined style={{ fontSize: 17 }} />,
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Hồ sơ bệnh án (EMR)</span>
              <span className="sidebar-badge">9 ký</span>
            </div>
          ),
        },
        {
          key: '/cls-pacs',
          icon: <ExperimentOutlined style={{ fontSize: 17 }} />,
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Cận lâm sàng (CLS)</span>
              <span className="sidebar-badge">28</span>
            </div>
          ),
        },
        {
          key: '/pharmacy',
          icon: <MedicineBoxOutlined style={{ fontSize: 17 }} />,
          label: 'Dược & Nhà thuốc BV',
        },
      ],
    },
    {
      type: 'group' as const,
      label: collapsed ? null : 'TÀI CHÍNH & BHYT',
      children: [
        {
          key: '/billing',
          icon: <DollarOutlined style={{ fontSize: 17 }} />,
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Quản lý Viện phí</span>
              <span className="sidebar-badge">VietQR</span>
            </div>
          ),
        },
        {
          key: '/insurance',
          icon: <SafetyCertificateOutlined style={{ fontSize: 17 }} />,
          label: 'Giám định BHYT 79a',
        },
      ],
    },
    {
      type: 'group' as const,
      label: collapsed ? null : 'TRÍ TUỆ NHÂN TẠO Y TẾ',
      children: [
        {
          key: '/ai-assistant',
          icon: <RobotOutlined style={{ fontSize: 17 }} />,
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Trợ lý AI Y tế</span>
              <span className="sidebar-badge">AI 2.0</span>
            </div>
          ),
        },
      ],
    },
    {
      type: 'group' as const,
      label: collapsed ? null : 'QUẢN TRỊ & BÁO CÁO',
      children: [
        {
          key: '/catalogs',
          icon: <AppstoreOutlined style={{ fontSize: 17 }} />,
          label: 'Danh mục Hệ thống',
        },
        {
          key: '/reports',
          icon: <BarChartOutlined style={{ fontSize: 17 }} />,
          label: 'Thống kê & Báo cáo BI',
        },
        {
          key: '/audit-logs',
          icon: <AuditOutlined style={{ fontSize: 17 }} />,
          label: 'Nhật ký & Kiểm toán',
        },
      ],
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Hồ sơ cá nhân & Ca trực',
      icon: <SolutionOutlined />,
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: 'Đăng xuất hệ thống',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: isDarkMode ? '#0f172a' : '#f8fafc' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={280}
        className="medical-sidebar"
        style={{
          background: isDarkMode ? '#0f172a' : '#ffffff',
          borderRight: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
          boxShadow: isDarkMode ? '4px 0 20px rgba(0, 0, 0, 0.25)' : '2px 0 12px rgba(15, 23, 42, 0.03)',
          zIndex: 10,
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            height: 70,
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 18px',
            background: isDarkMode ? '#1e293b' : '#ffffff',
            borderBottom: isDarkMode ? '1px solid #334155' : '1px solid #f1f5f9',
            boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/logo_icon.png"
              alt="D-Medical AI"
              style={{
                width: 36,
                height: 36,
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 6px rgba(13, 148, 136, 0.2))',
              }}
            />
            {!collapsed && (
              <div>
                <Title level={4} style={{ color: isDarkMode ? '#f8fafc' : '#1e293b', margin: 0, lineHeight: 1.2, fontWeight: 800, fontSize: 16 }}>
                  D-MEDICAL <span style={{ color: '#0d9488' }}>AI</span>
                </Title>
                <Text style={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 10.5, letterSpacing: '0.4px', fontWeight: 600 }}>
                  BỆNH VIỆN ĐA KHOA
                </Text>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Middle Area: Full Menu & Shift Widget */}
        <div
          style={{
            flex: '1 0 auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Menu
            theme={isDarkMode ? 'dark' : 'light'}
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => {
              if (key === '/cls-pacs') {
                navigate('/examinations');
              } else if (key === '/pharmacy') {
                navigate('/catalogs');
              } else if (key === '/insurance') {
                navigate('/billing');
              } else {
                navigate(key);
              }
            }}
            style={{
              marginTop: 6,
              background: 'transparent',
              padding: '0 4px',
              fontSize: 13.5,
              fontWeight: 500,
              borderInlineEnd: 'none',
            }}
          />

          {/* Clinical Shift & Bed Occupancy Widget (Proper Padding from Bottom) */}
          {!collapsed && (
            <div
              style={{
                margin: '14px 10px 18px 10px',
                padding: '14px 14px',
                borderRadius: 14,
                background: isDarkMode ? '#1e293b' : '#f8fafc',
                border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ApartmentOutlined /> Ca trực Sáng
                </span>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: isDarkMode ? '#064e3b' : '#f0fdf4', color: '#166534', fontWeight: 600, border: '1px solid #bbf7d0' }}>
                  07:00 - 15:30
                </span>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: isDarkMode ? '#f8fafc' : '#1e293b', marginBottom: 2 }}>
                Khoa Nội Tổng Hợp
              </div>
              <div style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: 8 }}>
                BS: CKII. Nguyễn Thanh Duy
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: isDarkMode ? '#cbd5e1' : '#64748b', fontWeight: 500 }}>Công suất giường</span>
                <strong style={{ color: '#0d9488' }}>428/480 (89%)</strong>
              </div>
              <Progress percent={89} strokeColor="#0d9488" size="small" showInfo={false} />
            </div>
          )}
        </div>

        {/* Pinned Bottom Telemetry & Status */}
        <div
          style={{
            flexShrink: 0,
            marginTop: 'auto',
            position: 'sticky',
            bottom: 0,
            zIndex: 20,
            padding: collapsed ? '12px 8px' : '12px 16px',
            borderTop: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd',
            background: isDarkMode ? '#1e293b' : '#f8fafc',
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.03)',
          }}
        >
          {collapsed ? (
            <div style={{ textAlign: 'center' }}>
              <Tooltip title={isGatewayOnline ? "Gateway 5000: Online" : "Gateway: Offline"} placement="right">
                <span
                  className="status-dot-pulse"
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: isGatewayOnline ? '#10b981' : '#f43f5e',
                    display: 'inline-block',
                  }}
                />
              </Tooltip>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    className="status-dot-pulse"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: isGatewayOnline ? '#10b981' : '#f43f5e',
                      display: 'inline-block',
                    }}
                  />
                  <Text style={{ color: isDarkMode ? '#f8fafc' : '#0369a1', fontSize: 12, fontWeight: 700 }}>
                    Hệ thống Sẵn sàng
                  </Text>
                </div>
                <Tag
                  color={isGatewayOnline ? 'green' : 'error'}
                  style={{ margin: 0, fontSize: 10, padding: '0 6px', borderRadius: 6, fontWeight: 600 }}
                >
                  {isGatewayOnline ? 'Gateway: 5000' : 'Offline'}
                </Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                <span>D-Medical AI Enterprise</span>
                <span>v2026.4</span>
              </div>
            </div>
          )}
        </div>
      </Sider>

      <Layout>
        {/* Top Header */}
        <Header
          style={{
            padding: '0 28px',
            background: isDarkMode ? '#1e293b' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: isDarkMode ? '0 1px 4px rgba(0,0,0,0.3)' : '0 2px 10px rgba(2, 132, 199, 0.04)',
            zIndex: 9,
            height: 70,
            borderBottom: isDarkMode ? '1px solid #334155' : '1px solid #e0f2fe',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined style={{ fontSize: 18 }} /> : <MenuFoldOutlined style={{ fontSize: 18 }} />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}
            />
            <Input
              placeholder="Tìm nhanh Bệnh nhân, Mã BN, CCCD, Mã EMR hoặc ICD-10..."
              prefix={<SearchOutlined style={{ color: '#0284c7' }} />}
              style={{
                width: 380,
                borderRadius: 20,
                background: isDarkMode ? '#0f172a' : '#f8fafc',
                border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                color: isDarkMode ? '#f8fafc' : '#0f172a',
                padding: '6px 16px',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Docker Gateway Live Health Tag */}
            <Tooltip
              title={
                <div>
                  <div><b>Trạng thái Backend Microservices:</b></div>
                  <div>Cổng Gateway Port 5000: {isGatewayOnline ? '🟢 Hoạt động (Docker Online)' : '🔴 Mất kết nối (Docker Stopped)'}</div>
                  <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>Bấm để bật/tắt Chế độ Kiểm thử Kết nối Thực (Strict API Mode).</div>
                </div>
              }
            >
              <Tag
                color={isGatewayOnline === true ? 'success' : isGatewayOnline === false ? 'error' : 'processing'}
                icon={isGatewayOnline ? <ApiOutlined /> : <DisconnectOutlined />}
                onClick={handleToggleStrictMode}
                style={{
                  padding: '5px 12px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                }}
              >
                {isGatewayOnline === true
                  ? 'Gateway: Online (5000)'
                  : isGatewayOnline === false
                  ? 'Gateway: Offline'
                  : 'Gateway: Checking...'}
                <Tag color={strictMode ? 'orange' : 'default'} style={{ margin: '0 0 0 6px', fontSize: 10, padding: '0 4px' }}>
                  {strictMode ? 'Strict API' : 'Fallback'}
                </Tag>
              </Tag>
            </Tooltip>

            {/* Quick Link to Web Booking Portal */}
            <Tooltip title="Mở Cổng Đặt Khám Bệnh Trực Tuyến 24/7 (Bệnh nhân đặt khám & nhận Mã QR)">
              <Button
                type="primary"
                icon={<GlobalOutlined />}
                style={{
                  backgroundColor: '#0284c7',
                  borderColor: '#0284c7',
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: 12.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                onClick={() => window.open('/booking', '_blank')}
              >
                Cổng Đặt Khám (Web)
              </Button>
            </Tooltip>

            {/* Theme Toggle Button */}
            <Button
              type="text"
              shape="circle"
              icon={isDarkMode ? <SunOutlined style={{ fontSize: 18, color: '#f59e0b' }} /> : <MoonOutlined style={{ fontSize: 18, color: '#0284c7' }} />}
              onClick={toggleTheme}
              style={{
                background: isDarkMode ? '#0f172a' : '#f8fafc',
                border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
              }}
              title={isDarkMode ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Tối'}
            />

            <Popover content={notificationContent} title="Thông báo Y tế" trigger="click" placement="bottomRight">
              <Badge count={notifications.filter((n) => !n.read).length} offset={[-2, 4]} color="#0284c7">
                <Button
                  type="text"
                  shape="circle"
                  icon={<BellOutlined style={{ fontSize: 18, color: isDarkMode ? '#cbd5e1' : '#475569' }} />}
                  style={{
                    background: isDarkMode ? '#0f172a' : '#f8fafc',
                    border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                  }}
                />
              </Badge>
            </Popover>

            {/* Doctor Profile Dropdown (Clean, seamless background without color deviation) */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <div
                style={{
                  cursor: 'pointer',
                  padding: '6px 10px',
                  borderRadius: 12,
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'all 0.2s ease',
                }}
                className="hover:bg-slate-100 dark:hover:bg-slate-800/70"
              >
                <Avatar
                  size={42}
                  src={user?.avatarUrl}
                  icon={<UserOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    border: isDarkMode ? '2px solid #334155' : '2px solid #e2e8f0',
                    flexShrink: 0,
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                  <Text strong style={{ fontSize: 13.5, color: isDarkMode ? '#f8fafc' : '#0f172a', lineHeight: 1.25, fontWeight: 700 }}>
                    {user?.hoTen || 'BS. CKII. Nguyễn Thanh Duy'}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: isDarkMode ? '#94a3b8' : '#64748b', lineHeight: 1.2 }}>
                    {user?.chucDanh || 'Bác sĩ Điều trị'} • {user?.chuyenKhoa || 'Khoa Nội'}
                  </Text>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Main Content View Container */}
        <Content
          style={{
            margin: '24px 28px',
            minHeight: 280,
          }}
        >
          <div key={location.pathname} className="page-transition">
            {children}
          </div>
        </Content>

        {/* Floating Action Button (FAB) for Instant AI Chat Drawer */}
        <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 999 }}>
          <Tooltip title="Trợ lý AI Y tế (Click mở khung chat)" placement="left">
            <div
              onClick={() => setIsAiDrawerOpen(true)}
              className="medical-ai-pulse"
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: '#ffffff',
                border: '2.5px solid #0284c7',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'transform 0.2s ease',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
              }}
            >
              <img
                src="/ai_doctor.png"
                alt="AI Chatbot Y tế"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%',
                }}
              />
              <span
                className="status-dot-pulse"
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  width: 13,
                  height: 13,
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  border: '2px solid #ffffff',
                }}
              />
            </div>
          </Tooltip>
        </div>

        {/* Floating AI Chat Drawer */}
        <AIChatDrawer open={isAiDrawerOpen} onClose={() => setIsAiDrawerOpen(false)} />
      </Layout>
    </Layout>
  );
};
