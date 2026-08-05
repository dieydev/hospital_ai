import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Avatar,
  Typography,
  Tag,
  Tabs,
  Form,
  Input,
  Button,
  Space,
  Divider,
  Switch,
  Alert,
  List,
  Badge,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  KeyOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  EditOutlined,
  IdcardOutlined,
  MedicineBoxOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { showSuccessAlert } from '../utils/sweetAlert';

const { Title, Text } = Typography;

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { isDarkMode } = useThemeStore();

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const [isDigitalSigActive, setIsDigitalSigActive] = useState(true);
  const [is2FAActive, setIs2FAActive] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Handle Profile Update
  const handleUpdateProfile = (values: any) => {
    setSavingProfile(true);
    setTimeout(() => {
      updateUser({
        hoTen: values.fullName,
        email: values.email,
        soDienThoai: values.phoneNumber,
        chuyenKhoa: values.specialty,
        chucDanh: values.title,
      });
      setSavingProfile(false);
      showSuccessAlert(
        'Cập nhật thành công!',
        'Thông tin hồ sơ cá nhân và chứng chỉ hành nghề đã được lưu.'
      );
    }, 600);
  };

  // Handle Password Change
  const handleChangePassword = (_values: any) => {
    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      passwordForm.resetFields();
      showSuccessAlert(
        'Đổi mật khẩu thành công!',
        'Mật khẩu truy cập hệ thống Bệnh viện đã được cập nhật an toàn.'
      );
    }, 800);
  };

  const workShifts = [
    {
      id: 'shift-01',
      date: 'Thứ Hai, 05/08/2026',
      shift: 'Ca Sáng (07:30 - 11:30)',
      clinic: 'Phòng 102 - Khoa Nội Tổng Hợp',
      role: 'Bác sĩ Khám chính',
      status: 'Đang trực',
    },
    {
      id: 'shift-02',
      date: 'Thứ Ba, 06/08/2026',
      shift: 'Ca Chiều (13:00 - 17:00)',
      clinic: 'Phòng 105 - Khoa Khám Bệnh',
      role: 'Bác sĩ Hội chẩn',
      status: 'Sắp tới',
    },
    {
      id: 'shift-03',
      date: 'Thứ Năm, 08/08/2026',
      shift: 'Trực Cấp Cứu Đêm (17:00 - 07:30)',
      clinic: 'Khoa Cấp Cứu & Hồi Sức',
      role: 'Bác sĩ Trưởng ca trực',
      status: 'Sắp tới',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* User Header Profile Card */}
      <Card
        style={{
          borderRadius: 16,
          background: isDarkMode
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)'
            : 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #e2e8f0 100%)',
          border: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd',
          boxShadow: isDarkMode ? '0 10px 30px rgba(0,0,0,0.3)' : '0 10px 30px rgba(2, 132, 199, 0.08)',
        }}
      >
        <Row align="middle" gutter={[24, 16]}>
          <Col>
            <Avatar
              size={96}
              src={user?.avatarUrl}
              icon={<UserOutlined />}
              style={{
                border: '4px solid #0284c7',
                boxShadow: '0 6px 16px rgba(2, 132, 199, 0.25)',
              }}
            />
          </Col>
          <Col style={{ flex: 1 }}>
            <Space align="center" size="middle" style={{ flexWrap: 'wrap' }}>
              <Title level={2} style={{ margin: 0, color: isDarkMode ? '#f8fafc' : '#0369a1', fontWeight: 800 }}>
                {user?.hoTen || 'BS. CKII. Nguyễn Thanh Duy'}
              </Title>
              <Tag color="blue" style={{ fontSize: 13, padding: '3px 12px', fontWeight: 600 }}>
                {user?.chucDanh || 'Trưởng Khoa Nội'}
              </Tag>
              <Tag color="green" icon={<CheckCircleOutlined />} style={{ fontSize: 13, padding: '3px 12px' }}>
                Tài khoản Đã xác thực Y tế
              </Tag>
            </Space>

            <div style={{ marginTop: 10, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <Text style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
                <MedicineBoxOutlined style={{ color: '#0284c7', marginRight: 6 }} />
                Chuyên khoa: <strong>{user?.chuyenKhoa || 'Khoa Nội Tổng Hợp'}</strong>
              </Text>
              <Text style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
                <IdcardOutlined style={{ color: '#0284c7', marginRight: 6 }} />
                Mã CCHN: <strong>001234/BYT-CCHN</strong>
              </Text>
              <Text style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
                <MailOutlined style={{ color: '#0284c7', marginRight: 6 }} />
                {user?.email || 'thanhduy.md@hospital-ai.vn'}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Main Tabs Details */}
      <Card style={{ borderRadius: 16, border: isDarkMode ? '1px solid #334155' : undefined }}>
        <Tabs
          defaultActiveKey="info"
          items={[
            {
              key: 'info',
              label: (
                <span>
                  <UserOutlined /> Hồ sơ Cá nhân & CCHN
                </span>
              ),
              children: (
                <Form
                  form={profileForm}
                  layout="vertical"
                  initialValues={{
                    fullName: user?.hoTen || 'BS. CKII. Nguyễn Thanh Duy',
                    title: user?.chucDanh || 'Trưởng Khoa Nội',
                    specialty: user?.chuyenKhoa || 'Khoa Nội Tổng Hợp',
                    cchnNumber: '001234/BYT-CCHN',
                    cchnIssueDate: '2015-08-20',
                    email: user?.email || 'thanhduy.md@hospital-ai.vn',
                    phoneNumber: user?.soDienThoai || '0336022526',
                    identityCard: '038090001234',
                    workplace: 'Bệnh viện Đa khoa Hospital AI',
                    address: 'TP. Thủ Dầu Một, Bình Dương',
                  }}
                  onFinish={handleUpdateProfile}
                  style={{ maxWidth: 800, marginTop: 12 }}
                >
                  <Title level={5} style={{ color: isDarkMode ? '#38bdf8' : '#0369a1', marginBottom: 16 }}>
                    I. THÔNG TIN HÀNH CHÍNH & CHỨNG CHỈ HÀNH NGHỀ (CCHN)
                  </Title>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="fullName"
                        label={<span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>Họ và Tên Bác sĩ</span>}
                        rules={[{ required: true, message: 'Nhập họ tên!' }]}
                      >
                        <Input prefix={<UserOutlined />} size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="title"
                        label={<span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>Chức danh Y tế</span>}
                        rules={[{ required: true, message: 'Nhập chức danh!' }]}
                      >
                        <Input prefix={<MedicineBoxOutlined />} size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="specialty"
                        label={<span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>Chuyên khoa Phụ trách</span>}
                        rules={[{ required: true, message: 'Nhập chuyên khoa!' }]}
                      >
                        <Input size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="cchnNumber"
                        label={<span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>Số Chứng chỉ Hành nghề (CCHN)</span>}
                        rules={[{ required: true, message: 'Nhập số CCHN!' }]}
                      >
                        <Input prefix={<IdcardOutlined />} size="large" style={{ fontFamily: 'monospace', fontWeight: 600 }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider style={{ margin: '16px 0', borderColor: isDarkMode ? '#334155' : undefined }} />

                  <Title level={5} style={{ color: isDarkMode ? '#38bdf8' : '#0369a1', marginBottom: 16 }}>
                    II. THÔNG TIN LIÊN HỆ & BẢO HÀNH HỆ THỐNG
                  </Title>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="email"
                        label={<span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>Email Công tác</span>}
                        rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ!' }]}
                      >
                        <Input prefix={<MailOutlined />} size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="phoneNumber"
                        label={<span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>Số Điện thoại Liên hệ</span>}
                        rules={[{ required: true, message: 'Nhập SĐT!' }]}
                      >
                        <Input prefix={<PhoneOutlined />} size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="identityCard"
                        label={<span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>Số CCCD / Định danh</span>}
                      >
                        <Input size="large" style={{ fontFamily: 'monospace' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="workplace"
                        label={<span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>Đơn vị Công tác</span>}
                      >
                        <Input size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        name="address"
                        label={<span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>Địa chỉ Thường trú</span>}
                      >
                        <Input size="large" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    icon={<EditOutlined />}
                    loading={savingProfile}
                    style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', marginTop: 12 }}
                  >
                    Lưu Thay đổi Hồ sơ
                  </Button>
                </Form>
              ),
            },
            {
              key: 'schedule',
              label: (
                <span>
                  <CalendarOutlined /> Phân công Ca trực & Khám bệnh
                </span>
              ),
              children: (
                <div style={{ marginTop: 12, maxWidth: 850 }}>
                  <Alert
                    type="info"
                    showIcon
                    message="Lịch Phân công Trực Tuần 32/2026:"
                    description="Lịch trực được phòng Kế hoạch Tổng hợp phê duyệt tự động. Bác sĩ vui lòng bàn giao ca trực đúng giờ."
                    style={{ marginBottom: 20 }}
                  />

                  <List
                    itemLayout="horizontal"
                    dataSource={workShifts}
                    renderItem={(item) => (
                      <Card
                        size="small"
                        style={{
                          marginBottom: 12,
                          borderRadius: 12,
                          border: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd',
                          background: isDarkMode ? '#0f172a' : '#f0f9ff',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Space align="center">
                              <Badge status={item.status === 'Đang trực' ? 'processing' : 'default'} />
                              <Text strong style={{ fontSize: 16, color: isDarkMode ? '#38bdf8' : '#0284c7' }}>
                                {item.date}
                              </Text>
                              <Tag color={item.status === 'Đang trực' ? 'green' : 'blue'}>{item.status}</Tag>
                            </Space>
                            <div style={{ marginTop: 6 }}>
                              <Text style={{ color: isDarkMode ? '#cbd5e1' : '#334155', display: 'block' }}>
                                ⏰ Ca làm việc: <strong>{item.shift}</strong>
                              </Text>
                              <Text style={{ color: isDarkMode ? '#cbd5e1' : '#334155', display: 'block' }}>
                                🏥 Địa điểm: <strong>{item.clinic}</strong> • Vai trò: <strong>{item.role}</strong>
                              </Text>
                            </div>
                          </div>

                          <Button type="default" size="small" icon={<AuditOutlined />}>
                            Chi tiết Ca trực
                          </Button>
                        </div>
                      </Card>
                    )}
                  />
                </div>
              ),
            },
            {
              key: 'security',
              label: (
                <span>
                  <SafetyCertificateOutlined /> Bảo mật & Chữ ký số EMR
                </span>
              ),
              children: (
                <div style={{ maxWidth: 750, marginTop: 12 }}>
                  {/* Digital Signature Card */}
                  <Card
                    style={{
                      borderRadius: 12,
                      marginBottom: 24,
                      border: isDarkMode ? '1px solid #334155' : '1px solid #bbf7d0',
                      background: isDarkMode ? '#064e3b22' : '#f0fdf4',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Title level={5} style={{ margin: 0, color: '#10b981' }}>
                          <SafetyCertificateOutlined style={{ marginRight: 8 }} />
                          Chữ ký số Điện tử Bác sĩ (Ký đơn thuốc & Hồ sơ EMR)
                        </Title>
                        <Text type="secondary" style={{ fontSize: 13, color: isDarkMode ? '#cbd5e1' : undefined }}>
                          Chứng thư số đang hoạt động: <strong>SHA256-RSA-2048 (Cấp bởi VNPT-CA)</strong>
                        </Text>
                      </div>
                      <Switch checked={isDigitalSigActive} onChange={setIsDigitalSigActive} />
                    </div>
                  </Card>

                  {/* 2FA Card */}
                  <Card
                    style={{
                      borderRadius: 12,
                      marginBottom: 24,
                      border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Title level={5} style={{ margin: 0, color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
                          <LockOutlined style={{ marginRight: 8, color: '#0284c7' }} />
                          Xác thực 2 Bước (2FA - Two-Factor Authentication)
                        </Title>
                        <Text type="secondary" style={{ fontSize: 13, color: isDarkMode ? '#94a3b8' : undefined }}>
                          Yêu cầu mã OTP khi đăng nhập hệ thống bệnh viện từ thiết bị mới.
                        </Text>
                      </div>
                      <Switch checked={is2FAActive} onChange={setIs2FAActive} />
                    </div>
                  </Card>

                  <Divider style={{ margin: '20px 0', borderColor: isDarkMode ? '#334155' : undefined }} />

                  {/* Password Change Form */}
                  <Title level={5} style={{ color: isDarkMode ? '#38bdf8' : '#0369a1', marginBottom: 16 }}>
                    <KeyOutlined style={{ marginRight: 8 }} />
                    ĐỔI MẬT KHẨU TRUY CẬP HỆ THỐNG
                  </Title>

                  <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
                    <Form.Item
                      name="oldPassword"
                      label={<span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>Mật khẩu Hiện tại</span>}
                      rules={[{ required: true, message: 'Nhập mật khẩu hiện tại!' }]}
                    >
                      <Input.Password size="large" style={{ maxWidth: 450 }} />
                    </Form.Item>

                    <Form.Item
                      name="newPassword"
                      label={<span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>Mật khẩu Mới</span>}
                      rules={[
                        { required: true, message: 'Nhập mật khẩu mới!' },
                        { min: 6, message: 'Mật khẩu phải từ 6 ký tự trở lên!' },
                      ]}
                    >
                      <Input.Password size="large" style={{ maxWidth: 450 }} />
                    </Form.Item>

                    <Form.Item
                      name="confirmPassword"
                      label={<span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>Xác nhận Mật khẩu Mới</span>}
                      dependencies={['newPassword']}
                      rules={[
                        { required: true, message: 'Xác nhận lại mật khẩu mới!' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Mật khẩu nhập lại không trùng khớp!'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password size="large" style={{ maxWidth: 450 }} />
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      loading={savingPassword}
                      style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', marginTop: 8 }}
                    >
                      Cập nhật Mật khẩu Mới
                    </Button>
                  </Form>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
