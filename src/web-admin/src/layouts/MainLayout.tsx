import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Typography } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  RobotOutlined,
  CreditCardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

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
      label: 'Tổng quan System',
    },
    {
      key: '/patients',
      icon: <UserOutlined />,
      label: 'Quản lý Bệnh nhân',
    },
    {
      key: '/examinations',
      icon: <MedicineBoxOutlined />,
      label: 'Phòng khám & SOAP EMR',
    },
    {
      key: '/ai-assistant',
      icon: <RobotOutlined />,
      label: 'Trợ lý AI & RAG',
    },
    {
      key: '/billing',
      icon: <CreditCardOutlined />,
      label: 'Thanh toán & VNPay',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark" width={240}>
        <div style={{ padding: '16px', textAlign: 'center', color: '#fff', background: '#001529' }}>
          <Title level={4} style={{ color: '#00b4d8', margin: 0 }}>
            {collapsed ? 'H-AI' : '🏥 Hospital AI'}
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#0077b6' }} />
            <Text bold>{user?.tenDangNhap || 'BS. Nguyễn Thanh Duy'}</Text>
            <Button type="text" icon={<LogoutOutlined />} onClick={() => logout()} danger>
              Đăng xuất
            </Button>
          </div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', borderRadius: 8, minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};
