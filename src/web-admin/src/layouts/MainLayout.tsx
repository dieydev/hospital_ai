import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Tag, Badge, Button, Input } from 'antd';
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
  CheckCircleFilled,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined style={{ fontSize: 18 }} />,
      label: 'Tổng quan (Dashboard)',
    },
    {
      key: '/reception',
      icon: <ScheduleOutlined style={{ fontSize: 18 }} />,
      label: 'Tiếp nhận & Cấp số',
    },
    {
      key: '/patients',
      icon: <UserOutlined style={{ fontSize: 18 }} />,
      label: 'Quản lý Bệnh nhân',
    },
    {
      key: '/examinations',
      icon: <MedicineBoxOutlined style={{ fontSize: 18 }} />,
      label: 'Khám bệnh (SOAP)',
    },
    {
      key: '/emr',
      icon: <FileTextOutlined style={{ fontSize: 18 }} />,
      label: 'Hồ sơ bệnh án (EMR)',
    },
    {
      key: '/billing',
      icon: <DollarOutlined style={{ fontSize: 18 }} />,
      label: 'Quản lý Viện phí',
    },
    {
      key: '/ai-assistant',
      icon: <RobotOutlined style={{ fontSize: 18, color: '#38bdf8' }} />,
      label: (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Trợ lý AI Y tế</span>
          <Tag color="cyan" style={{ fontSize: 10, margin: 0, padding: '0 6px', borderRadius: 4 }}>
            GEMINI
          </Tag>
        </span>
      ),
    },
    {
      key: '/catalogs',
      icon: <AppstoreOutlined style={{ fontSize: 18 }} />,
      label: 'Danh mục Hệ thống',
    },
    {
      key: '/audit-logs',
      icon: <AuditOutlined style={{ fontSize: 18 }} />,
      label: 'Nhật ký & Kiểm toán',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined style={{ fontSize: 18 }} />,
      label: 'Thống kê & Báo cáo',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Hồ sơ cá nhân & Ca trực',
      icon: <SolutionOutlined />,
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
        width={260}
        style={{
          background: '#0f172a',
          boxShadow: '4px 0 20px rgba(15, 23, 42, 0.15)',
          zIndex: 10,
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            height: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 20px',
            background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: 20,
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
              }}
            >
              H
            </div>
            {!collapsed && (
              <div>
                <Title level={4} style={{ color: '#fff', margin: 0, lineHeight: 1.2, fontWeight: 700, fontSize: 17 }}>
                  HOSPITAL <span style={{ color: '#38bdf8' }}>AI</span>
                </Title>
                <Text style={{ color: '#94a3b8', fontSize: 11, letterSpacing: '0.5px' }}>BỆNH VIỆN ĐA KHOA</Text>
              </div>
            )}
          </div>
        </div>

        {/* Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            marginTop: 12,
            background: 'transparent',
            padding: '0 8px',
            fontSize: 14,
            fontWeight: 500,
          }}
        />

        {/* System Active Badge at Bottom */}
        {!collapsed && (
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: 16,
              right: 16,
              padding: '12px 16px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <CheckCircleFilled style={{ color: '#10b981', fontSize: 16 }} />
            <div>
              <Text style={{ color: '#f8fafc', fontSize: 12, fontWeight: 600, display: 'block' }}>Hệ thống sẵn sàng</Text>
              <Text style={{ color: '#94a3b8', fontSize: 11 }}>Phiên bản 2026.1.0</Text>
            </div>
          </div>
        )}
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
            boxShadow: isDarkMode ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 3px rgba(15, 23, 42, 0.08)',
            zIndex: 9,
            height: 70,
            borderBottom: isDarkMode ? '1px solid #334155' : '1px solid #f1f5f9',
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
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Theme Toggle Button */}
            <Button
              type="text"
              shape="circle"
              icon={isDarkMode ? <SunOutlined style={{ fontSize: 20, color: '#f59e0b' }} /> : <MoonOutlined style={{ fontSize: 20, color: '#0284c7' }} />}
              onClick={toggleTheme}
              style={{ background: isDarkMode ? '#0f172a' : '#f8fafc', border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0' }}
              title={isDarkMode ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Tối'}
            />

            <Badge count={3} offset={[-2, 4]} color="#0284c7">
              <Button
                type="text"
                shape="circle"
                icon={<BellOutlined style={{ fontSize: 20, color: isDarkMode ? '#cbd5e1' : '#475569' }} />}
                style={{ background: isDarkMode ? '#0f172a' : '#f8fafc', border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0' }}
              />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <Space style={{ cursor: 'pointer', padding: '4px 10px', borderRadius: 12, background: isDarkMode ? '#0f172a' : '#f8fafc', border: isDarkMode ? '1px solid #334155' : '1px solid #f1f5f9' }}>
                <Avatar
                  src={user?.avatarUrl}
                  icon={<UserOutlined />}
                  style={{ background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <Text strong style={{ fontSize: 14, color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
                    {user?.hoTen || 'BS. CKII. Nguyễn Thanh Duy'}
                  </Text>
                  <Text style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                    {user?.chucDanh || 'Bác sĩ Điều trị'} • {user?.chuyenKhoa || 'Khoa Nội'}
                  </Text>
                </div>
              </Space>
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
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};
