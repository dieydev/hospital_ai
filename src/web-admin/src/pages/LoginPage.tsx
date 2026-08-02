import React, { useState } from 'react';
import { Card, Form, Input, Button, Checkbox, Typography, Alert, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Gửi request đến Backend API ASP.NET Core
      const response = await api.post('/auth/login', {
        username: values.username,
        password: values.password,
      });

      const { token, user } = response.data;
      setAuth(
        {
          id: user.id,
          tenDangNhap: user.username,
          hoTen: user.fullName,
          email: user.email,
          soDienThoai: user.phoneNumber,
          vaiTro: user.roles,
          chuyenKhoa: user.specialty,
          chucDanh: user.title,
          trangThaiKichHoat: true,
          avatarUrl: user.avatarUrl,
        },
        token
      );

      message.success(`Đăng nhập thành công! Chào mừng ${user.fullName}`);
      setLoading(false);
      navigate('/dashboard');
    } catch (err: any) {
      console.warn('API connection offline or invalid credentials, checking auth validation...');
      
      // 2. Nếu Backend API trả lỗi hoặc không đúng mật khẩu
      const apiError = err.response?.data?.message;

      if (apiError) {
        setErrorMsg(apiError);
        setLoading(false);
        return;
      }

      // Fallback kiểm tra mật khẩu chuẩn nếu chạy chế độ offline test
      if (values.password === '123456' || values.password === '123') {
        let fullName = 'BS. CKII. Nguyễn Thanh Duy';
        let role = ['Doctor', 'Admin'];
        if (values.username === 'admin') {
          fullName = 'Quản trị viên Hệ thống';
          role = ['Admin'];
        } else if (values.username === 'receptionist') {
          fullName = 'Lễ tân Trần Thị Hương';
          role = ['Receptionist'];
        }

        setAuth(
          {
            id: 'usr-001',
            tenDangNhap: values.username,
            hoTen: fullName,
            email: `${values.username}@hospital-ai.vn`,
            soDienThoai: '0336022526',
            vaiTro: role as any,
            chuyenKhoa: 'Khoa Nội Tổng hợp',
            chucDanh: 'Bác sĩ Điều trị',
            trangThaiKichHoat: true,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${values.username}`,
          },
          'jwt-bearer-token-2026'
        );
        message.success(`Đăng nhập thành công! Chào mừng ${fullName}`);
        setLoading(false);
        navigate('/dashboard');
      } else {
        setLoading(false);
        setErrorMsg('Sai tên đăng nhập hoặc mật khẩu! Mật khẩu mặc định là: 123456');
      }
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #002140 50%, #0284c7 100%)',
        padding: 20,
      }}
    >
      <Card
        style={{
          width: 440,
          borderRadius: 20,
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          border: 'none',
          padding: '10px 10px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 60,
              height: 60,
              margin: '0 auto 14px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 30,
              boxShadow: '0 6px 16px rgba(2, 132, 199, 0.4)',
            }}
          >
            <SafetyCertificateOutlined />
          </div>
          <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
            HOSPITAL <span style={{ color: '#0284c7' }}>AI</span>
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Hệ thống Quản lý Khám chữa bệnh & EMR Tích hợp AI
          </Text>
        </div>

        {errorMsg && <Alert message={errorMsg} type="error" showIcon style={{ marginBottom: 20, borderRadius: 10 }} />}

        <Form name="login" initialValues={{ remember: true, username: 'dr.duy', password: '123456' }} onFinish={onFinish} layout="vertical">
          <Form.Item
            name="username"
            label="Tên đăng nhập / Email"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
          >
            <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="Nhập tài khoản (vd: dr.duy, admin)" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Nhập mật khẩu (vd: 123456)" size="large" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12 }}>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Ghi nhớ đăng nhập</Checkbox>
            </Form.Item>
            <a style={{ float: 'right', fontSize: 13, color: '#0284c7' }} href="#forgot">
              Quên mật khẩu?
            </a>
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ height: 48, borderRadius: 12, fontWeight: 700, fontSize: 16 }}>
              Đăng nhập Hệ thống
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Tài khoản mẫu: <strong>dr.duy</strong> | Mật khẩu: <strong>123456</strong>
          </Text>
        </div>
      </Card>
    </div>
  );
};
