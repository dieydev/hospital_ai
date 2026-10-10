import React, { useState } from 'react';
import { Card, Form, Input, Button, Checkbox, Typography, Alert, Divider, Tabs, Radio } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import {
  UserOutlined,
  LockOutlined,
  PhoneOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  LoginOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import { showToast, showErrorAlert, showSuccessAlert } from '../utils/sweetAlert';
import { useThemeStore } from '../store/useThemeStore';
import { isStrictMode } from '../utils/modeHelper';

const { Text } = Typography;

// Google Logo Component
const GoogleIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { isDarkMode } = useThemeStore();

  // Helper check URL search param redirect
  const getRedirectUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('redirect');
  };

  // Helper: Dispatch successful authentication & Route based on ROLE
  const handleAuthSuccess = (user: any, token: string, customMessage?: string) => {
    const roles: string[] = user.roles || user.vaiTro || [];
    const isStaffOrAdmin = roles.some((r: string) =>
      ['Admin', 'Doctor', 'Nurse', 'Receptionist'].includes(r)
    );

    setAuth(
      {
        id: user.id,
        tenDangNhap: user.username || user.tenDangNhap,
        hoTen: user.fullName || user.hoTen,
        email: user.email,
        soDienThoai: user.phoneNumber || user.soDienThoai,
        vaiTro: roles as any,
        chuyenKhoa: user.specialty,
        chucDanh: user.title,
        trangThaiKichHoat: true,
        avatarUrl: user.avatarUrl,
      },
      token
    );

    const redirectUrl = getRedirectUrl();

    if (isStaffOrAdmin) {
      showToast(
        customMessage || `Đăng nhập thành công! Chào mừng cán bộ ${user.fullName || user.username}`,
        'success'
      );
      // Admin / Staff redirects to Dashboard unless specified otherwise
      navigate(redirectUrl && redirectUrl !== '/booking' ? redirectUrl : '/dashboard');
    } else {
      // Patient Role ALWAYS redirects to Patient Booking Portal
      showToast(
        customMessage || `Đăng nhập thành công! Chào mừng Bệnh nhân ${user.fullName || user.username}`,
        'success'
      );
      navigate('/booking');
    }
  };

  // 1. Xử lý Đăng nhập (Sign In)
  const onLoginFinish = async (values: { username: string; password: string }) => {
    setLoginLoading(true);
    setErrorMsg('');

    try {
      const response = await api.post('/auth/login', {
        username: values.username.trim(),
        password: values.password,
      });

      const { token, user } = response.data;
      handleAuthSuccess(user, token);
      setLoginLoading(false);
    } catch (err: any) {
      // Offline / Local fallback nếu Docker/Backend chưa chạy và strictMode = false
      if (!isStrictMode()) {
        const u = values.username.trim().toLowerCase();
        if (u === 'admin' && values.password === '123456') {
          handleAuthSuccess(
            {
              id: 'admin-001',
              username: 'admin',
              fullName: 'Quản trị viên Hệ thống',
              roles: ['Admin'],
              phoneNumber: '0900000001',
            },
            'mock_admin_token'
          );
          setLoginLoading(false);
          return;
        }
        if (u === 'dr.duy' && values.password === '123456') {
          handleAuthSuccess(
            {
              id: 'doc-001',
              username: 'dr.duy',
              fullName: 'BS. CKII. Nguyễn Thanh Duy',
              roles: ['Doctor', 'Admin'],
              phoneNumber: '0336022526',
            },
            'mock_doctor_token'
          );
          setLoginLoading(false);
          return;
        }
        if (u === 'patient01' && values.password === '123456') {
          handleAuthSuccess(
            {
              id: 'pat-001',
              username: 'patient01',
              fullName: 'Nguyễn Văn An',
              roles: ['Patient'],
              phoneNumber: '0987654321',
            },
            'mock_patient_token'
          );
          setLoginLoading(false);
          return;
        }
      }

      const apiError =
        err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.';
      setErrorMsg(apiError);
      showErrorAlert('Đăng nhập thất bại', apiError);
      setLoginLoading(false);
    }
  };

  // 2. Xử lý Đăng ký Bệnh nhân (Patient Self-Registration)
  const onRegisterFinish = async (values: {
    fullName: string;
    phoneNumber: string;
    username?: string;
    password: string;
    confirmPassword: string;
    gender?: string;
    identityCardNumber?: string;
    address?: string;
  }) => {
    setRegisterLoading(true);
    setErrorMsg('');

    const cleanPhone = values.phoneNumber.trim().replace(/\s+/g, '');
    const finalUsername = values.username?.trim() || cleanPhone;

    const payload = {
      username: finalUsername,
      password: values.password,
      fullName: values.fullName.trim(),
      phoneNumber: cleanPhone,
      email: `${finalUsername}@hospital-ai.vn`,
      role: 'Patient', // Bắt buộc cố định quyền Bệnh nhân
      gender: values.gender || 'Nam',
      identityCardNumber: values.identityCardNumber?.trim() || '',
      address: values.address?.trim() || '',
    };

    try {
      const response = await api.post('/auth/register', payload);
      const data = response.data;

      // Nếu backend trả về Token & Profile -> Đăng nhập tự động luôn
      if (data && data.token) {
        handleAuthSuccess(
          {
            id: data.id,
            username: data.username,
            fullName: data.fullName,
            phoneNumber: data.phoneNumber,
            roles: ['Patient'],
          },
          data.token,
          `Đăng ký tài khoản thành công! Chào mừng Bệnh nhân ${data.fullName}`
        );
      } else {
        // Hoặc tự động gọi login
        try {
          const loginRes = await api.post('/auth/login', {
            username: finalUsername,
            password: values.password,
          });
          const { token, user } = loginRes.data;
          handleAuthSuccess(
            user,
            token,
            `Đăng ký tài khoản thành công! Chào mừng Bệnh nhân ${user.fullName || values.fullName}`
          );
        } catch {
          // Nếu không auto-login được thì chuyển sang tab Đăng nhập
          showSuccessAlert(
            'Đăng ký tài khoản Bệnh nhân thành công!',
            `Tài khoản ${finalUsername} đã được tạo với quyền Bệnh nhân. Vui lòng đăng nhập để bắt đầu đặt lịch khám.`
          );
          setActiveTab('login');
          loginForm.setFieldsValue({ username: finalUsername });
        }
      }
      setRegisterLoading(false);
    } catch (err: any) {
      // Mock Fallback offline nếu server không kết nối
      if (!isStrictMode()) {
        const mockNewUser = {
          id: `pat-mock-${Date.now()}`,
          username: finalUsername,
          fullName: values.fullName.trim(),
          phoneNumber: cleanPhone,
          roles: ['Patient'],
        };
        handleAuthSuccess(
          mockNewUser,
          'mock_patient_registered_token',
          `Đăng ký tài khoản thành công! Chào mừng Bệnh nhân ${values.fullName}`
        );
        setRegisterLoading(false);
        return;
      }

      const apiError =
        err.response?.data?.message || 'Đăng ký tài khoản thất bại. Vui lòng kiểm tra lại thông tin.';
      setErrorMsg(apiError);
      showErrorAlert('Đăng ký không thành công', apiError);
      setRegisterLoading(false);
    }
  };

  // 3. Đăng nhập Google OAuth (Tự động gán quyền Patient nếu người dùng mới)
  const googleLoginTrigger = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await userInfoRes.json();

        const response = await api.post('/auth/google-login', {
          idToken: tokenResponse.access_token,
          email: googleUser.email,
          fullName: googleUser.name || googleUser.email,
          photoUrl: googleUser.picture,
        });

        const { token, user } = response.data;
        handleAuthSuccess(user, token, `Đăng nhập Google thành công! Chào mừng ${user.fullName}`);
        setGoogleLoading(false);
      } catch (err: any) {
        const apiError = err.response?.data?.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.';
        showErrorAlert('Đăng nhập thất bại', apiError);
        setGoogleLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google OAuth Popup Error:', error);
      showErrorAlert('Đăng nhập thất bại', 'Bạn đã đóng hoặc hủy cửa sổ Google Popup.');
      setGoogleLoading(false);
    },
  });

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    googleLoginTrigger();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDarkMode
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)'
          : 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #e2e8f0 100%)',
        padding: '24px 16px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <Card
        style={{
          width: 500,
          maxWidth: '100%',
          borderRadius: 20,
          boxShadow: isDarkMode ? '0 12px 36px rgba(0, 0, 0, 0.45)' : '0 12px 36px rgba(2, 132, 199, 0.12)',
          border: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd',
          background: isDarkMode ? '#1e293b' : '#ffffff',
          overflow: 'hidden',
        }}
        bodyStyle={{ padding: '28px 24px' }}
      >
        {/* Nút quay lại Cổng Đặt Khám */}
        <div style={{ marginBottom: 12 }}>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/booking')}
            style={{
              padding: 0,
              color: isDarkMode ? '#38bdf8' : '#0284c7',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Quay lại Cổng Đặt Khám Bệnh Nhân
          </Button>
        </div>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img
            src={isDarkMode ? '/logo_white.png' : '/logo.png'}
            alt="D-Medical Healthcare Connected"
            style={{
              height: 58,
              maxWidth: '85%',
              objectFit: 'contain',
              marginBottom: 4,
              filter: isDarkMode ? 'none' : 'drop-shadow(0 4px 12px rgba(2, 132, 199, 0.18))',
            }}
          />
        </div>

        {errorMsg && (
          <Alert
            message={errorMsg}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMsg('')}
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
        )}

        {/* Tabs: Đăng nhập & Đăng ký */}
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key as 'login' | 'register');
            setErrorMsg('');
          }}
          centered
          tabBarStyle={{ marginBottom: 20 }}
          items={[
            {
              key: 'login',
              label: (
                <span style={{ fontSize: 15, fontWeight: 700, padding: '0 8px' }}>
                  <LoginOutlined style={{ marginRight: 6 }} />
                  Đăng Nhập
                </span>
              ),
            },
            {
              key: 'register',
              label: (
                <span style={{ fontSize: 15, fontWeight: 700, padding: '0 8px' }}>
                  <UserAddOutlined style={{ marginRight: 6 }} />
                  Đăng Ký Bệnh Nhân
                </span>
              ),
            },
          ]}
        />

        {/* ================= TAB 1: ĐĂNG NHẬP ================= */}
        {activeTab === 'login' && (
          <div>
            <Form
              form={loginForm}
              name="login"
              initialValues={{ remember: true }}
              onFinish={onLoginFinish}
              layout="vertical"
              requiredMark={false}
            >
              <Form.Item
                name="username"
                label={
                  <span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>
                    Tên đăng nhập / Số điện thoại
                  </span>
                }
                rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập hoặc số điện thoại!' }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="Nhập tên đăng nhập hoặc SĐT..."
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={
                  <span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>
                    Mật khẩu
                  </span>
                }
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="Nhập mật khẩu..."
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20,
                }}
              >
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox style={{ color: isDarkMode ? '#cbd5e1' : '#475569', fontSize: 13 }}>
                    Ghi nhớ đăng nhập
                  </Checkbox>
                </Form.Item>
                <a
                  style={{
                    color: isDarkMode ? '#38bdf8' : '#0284c7',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                  onClick={() =>
                    showToast('Vui lòng liên hệ hotline 1900 6868 để được cấp lại mật khẩu.', 'info')
                  }
                >
                  Quên mật khẩu?
                </a>
              </div>

              <Form.Item style={{ marginBottom: 12 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loginLoading}
                  style={{
                    height: 46,
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 15,
                    backgroundColor: '#0284c7',
                    borderColor: '#0284c7',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
                  }}
                >
                  Đăng Nhập Vào Hệ Thống
                </Button>
              </Form.Item>
            </Form>

            <Divider style={{ margin: '14px 0', fontSize: 13, color: isDarkMode ? '#94a3b8' : undefined }}>
              Hoặc
            </Divider>

            <Button
              size="large"
              block
              icon={<GoogleIcon />}
              loading={googleLoading}
              onClick={handleGoogleLogin}
              style={{
                height: 44,
                borderRadius: 10,
                fontWeight: 600,
                color: isDarkMode ? '#f8fafc' : '#334155',
                borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                background: isDarkMode ? '#0f172a' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Đăng nhập nhanh với Google
            </Button>



            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <Text style={{ fontSize: 13, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                Chưa có tài khoản bệnh nhân?{' '}
                <a
                  style={{ color: '#0284c7', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => setActiveTab('register')}
                >
                  Đăng ký ngay
                </a>
              </Text>
            </div>
          </div>
        )}

        {/* ================= TAB 2: ĐĂNG KÝ BỆNH NHÂN ================= */}
        {activeTab === 'register' && (
          <div>

            <Form
              form={registerForm}
              name="register"
              onFinish={onRegisterFinish}
              layout="vertical"
              requiredMark={false}
              initialValues={{ gender: 'Nam' }}
            >
              <Form.Item
                name="fullName"
                label={
                  <span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>
                    Họ và tên bệnh nhân <span style={{ color: '#ef4444' }}>*</span>
                  </span>
                }
                rules={[
                  { required: true, message: 'Vui lòng nhập họ và tên của bạn!' },
                  { min: 3, message: 'Họ và tên phải có ít nhất 3 ký tự!' },
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>

              <Form.Item
                name="phoneNumber"
                label={
                  <span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>
                    Số điện thoại <span style={{ color: '#ef4444' }}>*</span>
                  </span>
                }
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                  {
                    pattern: /(84|0[3|5|7|8|9])+([0-9]{8})\b/,
                    message: 'Số điện thoại không đúng định dạng (10 số)!',
                  },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="Ví dụ: 0912345678"
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>

              <Form.Item
                name="username"
                label={
                  <span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>
                    Tên đăng nhập <span style={{ color: '#94a3b8', fontSize: 12 }}>(Tùy chọn, mặc định theo SĐT)</span>
                  </span>
                }
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="Để trống sẽ dùng số điện thoại..."
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Form.Item
                  name="password"
                  label={
                    <span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>
                      Mật khẩu <span style={{ color: '#ef4444' }}>*</span>
                    </span>
                  }
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu!' },
                    { min: 6, message: 'Mật khẩu phải dài ít nhất 6 ký tự!' },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                    placeholder="Tối thiểu 6 ký tự"
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  dependencies={['password']}
                  label={
                    <span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>
                      Xác nhận mật khẩu <span style={{ color: '#ef4444' }}>*</span>
                    </span>
                  }
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                    placeholder="Nhập lại mật khẩu"
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Form.Item
                  name="gender"
                  label={
                    <span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>
                      Giới tính
                    </span>
                  }
                >
                  <Radio.Group style={{ width: '100%', display: 'flex' }}>
                    <Radio.Button value="Nam" style={{ flex: 1, textAlign: 'center' }}>
                      Nam
                    </Radio.Button>
                    <Radio.Button value="Nữ" style={{ flex: 1, textAlign: 'center' }}>
                      Nữ
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  name="identityCardNumber"
                  label={
                    <span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>
                      Số CCCD <span style={{ color: '#94a3b8', fontSize: 12 }}>(Tùy chọn)</span>
                    </span>
                  }
                >
                  <Input
                    prefix={<IdcardOutlined style={{ color: '#94a3b8' }} />}
                    placeholder="Số thẻ CCCD..."
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="address"
                label={
                  <span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>
                    Địa chỉ cư trú <span style={{ color: '#94a3b8', fontSize: 12 }}>(Tùy chọn)</span>
                  </span>
                }
              >
                <Input
                  placeholder="Quận/Huyện, Tỉnh/TP..."
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 20, marginBottom: 12 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={registerLoading}
                  icon={<CheckCircleOutlined />}
                  style={{
                    height: 48,
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 15,
                    backgroundColor: '#0284c7',
                    borderColor: '#0284c7',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
                  }}
                >
                  Đăng Ký Tài Khoản Bệnh Nhân
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <Text style={{ fontSize: 13, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                Đã có tài khoản?{' '}
                <a
                  style={{ color: '#0284c7', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => setActiveTab('login')}
                >
                  Đăng nhập ngay
                </a>
              </Text>
            </div>
          </div>
        )}

        {/* Footer Copyright */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 22,
            borderTop: isDarkMode ? '1px solid #334155' : '1px solid #f1f5f9',
            paddingTop: 14,
          }}
        >
          <Text type="secondary" style={{ fontSize: 12, color: isDarkMode ? '#94a3b8' : '#94a3b8' }}>
            © 2026 Bệnh viện Đa khoa Quốc tế D-Medical AI • Nền tảng Y tế Số Thông minh
          </Text>
        </div>
      </Card>
    </div>
  );
};
