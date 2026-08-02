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
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

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

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Tổng quan (Dashboard)',
    },
    {
      key: '/reception',
      icon: <ScheduleOutlined />,
      label: 'Tiếp nhận & Cấp số',
    },
    {
      key: '/patients',
      icon: <UserOutlined />,
      label: 'Quản lý Bệnh nhân',
    },
    {
      key: '/examinations',
      icon: <MedicineBoxOutlined />,
      label: 'Khám bệnh (SOAP)',
    },
    {
      key: '/emr',
      icon: <FileTextOutlined />,
      label: 'Hồ sơ bệnh án (EMR)',
    },
    {
      key: '/billing',
      icon: <DollarOutlined />,
      label: 'Quản lý Viện phí',
    },
    {
      key: '/ai-assistant',
      icon: <RobotOutlined style={{ color: '#1677ff' }} />,
      label: (
        <span>
          Trợ lý AI Y tế <Tag color="blue" style={{ marginLeft: 6, fontSize: 10 }}>GEMINI</Tag>
        </span>
      ),
    },
    {
      key: '/catalogs',
      icon: <AppstoreOutlined />,
      label: 'Danh mục Hệ thống',
    },
    {
      key: '/audit-logs',
      icon: <AuditOutlined />,
      label: 'Nhật ký & Kiểm toán',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'Thống kê & Báo cáo',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Hồ sơ tài khoản',
      icon: <SolutionOutlined />,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={250}
        style={{
          background: '#001529',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 20px',
            background: '#002140',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 18,
              }}
            >
              H
            </div>
            {!collapsed && (
              <div>
                <Title level={5} style={{ color: '#fff', margin: 0, lineHeight: 1.2, fontSize: 16 }}>
                  HOSPITAL <span style={{ color: '#69b1ff' }}>AI</span>
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Bệnh viện Đa khoa</Text>
              </div>
            )}
          </div>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ marginTop: 8 }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
            zIndex: 9,
            height: 64,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
            />
            <Input
              placeholder="Tìm nhanh Bệnh nhân, CCCD, Mã EMR hoặc ICD-10..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              style={{ width: 340, borderRadius: 20 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Badge count={3} offset={[-2, 4]}>
              <Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: 18 }} />} />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar src={user?.avatarUrl} icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <Text strong style={{ fontSize: 14 }}>
                    {user?.hoTen || 'Nguyễn Thanh Duy'}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {user?.chucDanh || 'Bác sĩ điều trị'} • {user?.chuyenKhoa || 'Khoa Nội'}
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: '20px 24px',
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};
