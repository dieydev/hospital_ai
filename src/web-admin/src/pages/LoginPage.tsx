import React, { useState } from 'react';
import { Card, Form, Input, Button, Checkbox, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const onFinish = (values: { username: string; password: string }) => {
    setLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      if (values.username && values.password) {
        setAuth(
          {
            id: 'usr-001',
            tenDangNhap: values.username,
            hoTen: 'BS. CKII. Nguyễn Thanh Duy',
            email: 'thanhduy.md@hospital-ai.vn',
            soDienThoai: '0336022526',
            vaiTro: ['Doctor', 'Admin'],
            chuyenKhoa: 'Khoa Nội Tổng hợp',
            chucDanh: 'Bác sĩ Điều trị',
            trangThaiKichHoat: true,
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DuyDoctor',
          },
          'mock-jwt-token-2026'
        );
        setLoading(false);
        navigate('/dashboard');
      } else {
        setLoading(false);
        setErrorMsg('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      }
    }, 800);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #001529 0%, #002140 50%, #0958d9 100%)',
        padding: 20,
      }}
    >
      <Card
        style={{
          width: 420,
          borderRadius: 16,
          boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
          border: 'none',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 12px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 28,
            }}
          >
            <SafetyCertificateOutlined />
          </div>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            HOSPITAL <span style={{ color: '#1677ff' }}>AI</span>
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Hệ thống Quản lý Khám chữa bệnh & EMR Tích hợp AI
          </Text>
        </div>

        {errorMsg && <Alert message={errorMsg} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form name="login" initialValues={{ remember: true, username: 'dr.duy', password: '123' }} onFinish={onFinish} layout="vertical">
          <Form.Item
            name="username"
            label="Tên đăng nhập / Email"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nhập tài khoản (vd: dr.duy)" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu" size="large" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12 }}>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Ghi nhớ đăng nhập</Checkbox>
            </Form.Item>
            <a style={{ float: 'right', fontSize: 13, color: '#1677ff' }} href="#forgot">
              Quên mật khẩu?
            </a>
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ height: 46, borderRadius: 8, fontWeight: 600 }}>
              Đăng nhập Hệ thống
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
