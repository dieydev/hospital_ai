import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Radio,
  DatePicker,
  Button,
  Row,
  Col,
  Alert,
  Typography,
  Divider,
  Avatar,
  Upload,
  Tooltip,
} from 'antd';
import {
  IdcardOutlined,
  UserOutlined,
  PhoneOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  LogoutOutlined,
  MedicineBoxOutlined,
  CameraOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/useAuthStore';
import { UserAccount } from '../types';
import { showSuccessAlert, showToast } from '../utils/sweetAlert';
import api from '../services/api';

const { Title, Text } = Typography;

const PATIENT_AVATARS = [
  { id: 'pat-1', label: 'Nam thanh niên', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
  { id: 'pat-2', label: 'Nữ thanh niên', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica' },
  { id: 'pat-3', label: 'Nam trung niên', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
  { id: 'pat-4', label: 'Nữ trung niên', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
  { id: 'pat-5', label: 'Cụ ông cao tuổi', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert' },
  { id: 'pat-6', label: 'Cụ bà cao tuổi', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grandma' },
  { id: 'pat-7', label: 'Bé trai', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo' },
  { id: 'pat-8', label: 'Bé gái', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia' },
];

interface CompleteProfileModalProps {
  open: boolean;
  allowClose?: boolean;
  onSuccess?: (updatedUser: UserAccount) => void;
  onCancel?: () => void;
}

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({
  open,
  allowClose = false,
  onSuccess,
  onCancel,
}) => {
  const { user, updateUser, logout } = useAuthStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(
    user?.avatarUrl || PATIENT_AVATARS[0].url
  );
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);

  // Điền dữ liệu hiện có nếu có
  useEffect(() => {
    if (open && user) {
      if (user.avatarUrl) {
        setSelectedAvatarUrl(user.avatarUrl);
      }
      form.setFieldsValue({
        hoTen: user.hoTen || user.tenDangNhap || '',
        soDienThoai: user.soDienThoai || '',
        soCCCD: user.soCCCD || '',
        ngaySinh: user.ngaySinh
          ? dayjs(user.ngaySinh)
          : user.namSinh
          ? dayjs(`${user.namSinh}-01-01`)
          : undefined,
        gioiTinh: user.gioiTinh || 'Nam',
        diaChi: user.diaChi || '',
        maTheBHYT: user.maTheBHYT || '',
        tienSuBenh: user.tienSuBenh || '',
        diUngThuoc: user.diUngThuoc || '',
      });
    }
  }, [open, user, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const ngaySinhStr = values.ngaySinh
        ? dayjs(values.ngaySinh).format('YYYY-MM-DD')
        : '';
      const namSinhVal = values.ngaySinh
        ? dayjs(values.ngaySinh).year()
        : dayjs().year() - 30;

      // Sinh mã bệnh nhân duy nhất nếu chưa có
      const maBenhNhan =
        user?.maBenhNhan ||
        `BN-${dayjs().format('YYYY')}-${Math.floor(10000 + Math.random() * 90000)}`;

      // 1. Lưu trực tiếp vào CSDL Backend SQL Server qua API
      let backendUpdatedUser: any = null;
      try {
        const payload = {
          fullName: values.hoTen.trim(),
          phoneNumber: values.soDienThoai.trim(),
          identityCardNumber: values.soCCCD.trim(),
          dateOfBirth: ngaySinhStr ? `${ngaySinhStr}T00:00:00Z` : undefined,
          gender: values.gioiTinh,
          address: values.diaChi.trim(),
          healthInsuranceNumber: values.maTheBHYT?.trim() || null,
          avatarUrl: selectedAvatarUrl,
        };

        const res = await api.post('/auth/complete-profile', payload);
        if (res.data) {
          backendUpdatedUser = res.data;
        }

        try {
          await api.put('/auth/avatar', { avatarUrl: selectedAvatarUrl });
        } catch {
          // ignore
        }
      } catch (apiErr: any) {
        console.warn('Backend complete-profile fallback:', apiErr?.response?.data || apiErr.message);
      }

      // 2. Cập nhật state Auth & Local User
      const updatedMaBenhNhan = backendUpdatedUser?.patientCode || user?.maBenhNhan || maBenhNhan;
      const updatedData: Partial<UserAccount> = {
        hoTen: backendUpdatedUser?.fullName || values.hoTen.trim(),
        soDienThoai: backendUpdatedUser?.phoneNumber || values.soDienThoai.trim(),
        soCCCD: backendUpdatedUser?.identityCardNumber || values.soCCCD.trim(),
        ngaySinh: backendUpdatedUser?.dateOfBirth ? dayjs(backendUpdatedUser.dateOfBirth).format('YYYY-MM-DD') : ngaySinhStr,
        namSinh: backendUpdatedUser?.dateOfBirth ? dayjs(backendUpdatedUser.dateOfBirth).year() : namSinhVal,
        gioiTinh: backendUpdatedUser?.gender || values.gioiTinh,
        diaChi: backendUpdatedUser?.address || values.diaChi.trim(),
        maTheBHYT: backendUpdatedUser?.healthInsuranceNumber || values.maTheBHYT?.trim() || '',
        tienSuBenh: values.tienSuBenh?.trim() || '',
        diUngThuoc: values.diUngThuoc?.trim() || '',
        avatarUrl: selectedAvatarUrl || backendUpdatedUser?.avatarUrl || user?.avatarUrl,
        maBenhNhan: updatedMaBenhNhan,
        isProfileComplete: true,
      };

      updateUser(updatedData);

      // Cập nhật lại user mới từ state
      const updatedUser: UserAccount = {
        ...(user || {
          id: backendUpdatedUser?.id || `pat-${Date.now()}`,
          tenDangNhap: values.soDienThoai.trim(),
          vaiTro: ['Patient'],
          trangThaiKichHoat: true,
        }),
        ...updatedData,
      } as UserAccount;

      // 3. Lưu đồng bộ vào CSDL Bệnh nhân Local (Persistent Store cho cả Offline)
      try {
        const storedStr = localStorage.getItem('hospital_registered_users');
        const userList = storedStr ? JSON.parse(storedStr) : [];
        const idx = userList.findIndex(
          (u: any) =>
            u.username === user?.tenDangNhap ||
            u.tenDangNhap === user?.tenDangNhap ||
            u.phoneNumber === values.soDienThoai.trim() ||
            u.soDienThoai === values.soDienThoai.trim() ||
            u.id === user?.id
        );
        const persistentUserObj = {
          ...updatedUser,
          username: updatedUser.tenDangNhap,
          fullName: updatedUser.hoTen,
          phoneNumber: updatedUser.soDienThoai,
          identityCardNumber: updatedUser.soCCCD,
          dateOfBirth: updatedUser.ngaySinh,
          address: updatedUser.diaChi,
          healthInsuranceNumber: updatedUser.maTheBHYT,
          patientCode: updatedUser.maBenhNhan,
          isProfileComplete: true,
        };

        if (idx >= 0) {
          userList[idx] = { ...userList[idx], ...persistentUserObj };
        } else {
          userList.push(persistentUserObj);
        }
        localStorage.setItem('hospital_registered_users', JSON.stringify(userList));
      } catch {
        // ignore
      }

      setTimeout(() => {
        setLoading(false);
        showSuccessAlert(
          'Hoàn Tất Hồ Sơ Bệnh Nhân!',
          `Hồ sơ của bạn đã được lưu vào CSDL Bệnh viện thành công. Mã bệnh nhân: ${updatedMaBenhNhan}. Thông tin của bạn đã được ghi nhận vào hệ thống Bệnh án điện tử liên thông.`
        );
        if (onSuccess) {
          onSuccess(updatedUser);
        }
      }, 500);
    } catch {
      showToast('Vui lòng kiểm tra lại các thông tin bắt buộc!', 'warning');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Đã đăng xuất tài khoản.', 'info');
    if (onCancel) onCancel();
  };

  return (
    <Modal
      open={open}
      closable={allowClose}
      maskClosable={allowClose}
      onCancel={onCancel}
      footer={null}
      width={680}
      centered
      style={{ top: 20 }}
    >
      <div style={{ padding: '8px 4px' }}>
        {/* Header Modal */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              margin: '0 auto 12px',
              border: '2px solid #bae6fd',
            }}
          >
            <SafetyCertificateOutlined />
          </div>
          <Title level={4} style={{ color: '#0369a1', margin: 0, fontWeight: 800 }}>
            CẬP NHẬT THÔNG TIN BỆNH NHÂN BẮT BUỘC
          </Title>
          <Text style={{ color: '#64748b', fontSize: 13 }}>
            Xác thực danh tính & Hồ sơ Bệnh án điện tử liên thông theo tiêu chuẩn Bộ Y tế
          </Text>
        </div>

        {/* Warning Alert */}
        <Alert
          type="info"
          showIcon
          icon={<IdcardOutlined style={{ color: '#0284c7' }} />}
          style={{
            marginBottom: 16,
            borderRadius: 12,
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
          }}
          message={
            <span style={{ fontWeight: 700, color: '#0369a1' }}>
              Yêu cầu hoàn thiện thông tin trước khi tiếp tục
            </span>
          }
          description="Để được cấp Mã QR Tiếp Nhận trực tiếp tại phòng khám (không cần bốc số thứ tự), quý khách vui lòng cập nhật đầy đủ thông tin định danh cá nhân chính xác."
        />

        {/* Khu vực Chọn & Đổi Ảnh đại diện Bệnh nhân */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Avatar
              size={82}
              src={selectedAvatarUrl}
              icon={<UserOutlined />}
              style={{
                border: '3px solid #0284c7',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
                cursor: 'pointer',
                backgroundColor: '#e0f2fe',
              }}
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            />
            <Tooltip title="Đổi ảnh đại diện">
              <Button
                type="primary"
                shape="circle"
                size="small"
                icon={<CameraOutlined />}
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  backgroundColor: '#0284c7',
                  borderColor: '#ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                }}
              />
            </Tooltip>
          </div>
          <div>
            <Button
              type="link"
              size="small"
              icon={<CameraOutlined />}
              style={{ color: '#0284c7', fontWeight: 700, fontSize: 13, marginTop: 4 }}
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            >
              {showAvatarPicker ? 'Ẩn bộ sưu tập ảnh' : 'Đổi Ảnh đại diện'}
            </Button>
          </div>

          {showAvatarPicker && (
            <div
              style={{
                marginTop: 8,
                padding: '12px 16px',
                borderRadius: 12,
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0369a1', marginBottom: 8 }}>
                Chọn ảnh đại diện phù hợp hoặc tải ảnh của bạn:
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  marginBottom: 10,
                }}
              >
                {PATIENT_AVATARS.map((av) => (
                  <div
                    key={av.id}
                    onClick={() => setSelectedAvatarUrl(av.url)}
                    style={{
                      cursor: 'pointer',
                      border: selectedAvatarUrl === av.url ? '3px solid #0284c7' : '2px solid transparent',
                      borderRadius: '50%',
                      padding: 2,
                      transition: 'all 0.2s',
                      transform: selectedAvatarUrl === av.url ? 'scale(1.12)' : 'scale(1)',
                    }}
                    title={av.label}
                  >
                    <Avatar size={44} src={av.url} />
                  </div>
                ))}
              </div>

              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    if (e.target?.result) {
                      setSelectedAvatarUrl(e.target.result as string);
                    }
                  };
                  reader.readAsDataURL(file);
                  return false;
                }}
                accept="image/*"
              >
                <Button size="small" icon={<UploadOutlined />} style={{ borderRadius: 8, borderColor: '#0284c7', color: '#0284c7', fontWeight: 600 }}>
                  Tải ảnh chân dung từ máy
                </Button>
              </Upload>
            </div>
          )}
        </div>

        {/* Form Body */}
        <Form form={form} layout="vertical" requiredMark="optional">
          <Row gutter={16}>
            <Col xs={24} sm={14}>
              <Form.Item
                name="hoTen"
                label={
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    Họ và tên Bệnh nhân <span style={{ color: '#e11d48' }}>*</span>
                  </span>
                }
                rules={[
                  { required: true, message: 'Vui lòng nhập họ và tên' },
                  { min: 3, message: 'Họ tên tối thiểu 3 ký tự' },
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#0284c7' }} />}
                  placeholder="Ví dụ: NGUYỄN VĂN AN"
                  size="large"
                  style={{ borderRadius: 10, textTransform: 'uppercase' }}
                  onChange={(e) => {
                    form.setFieldsValue({ hoTen: e.target.value.toUpperCase() });
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={10}>
              <Form.Item
                name="soDienThoai"
                label={
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    Số điện thoại liên hệ <span style={{ color: '#e11d48' }}>*</span>
                  </span>
                }
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại' },
                  { pattern: /^(0[3|5|7|8|9])[0-9]{8}$/, message: 'Số điện thoại 10 số hợp lệ' },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: '#10b981' }} />}
                  placeholder="0912345678"
                  size="large"
                  style={{ borderRadius: 10, fontFamily: 'monospace' }}
                  maxLength={10}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="soCCCD"
                label={
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    Số Căn cước công dân (CCCD / VNeID) <span style={{ color: '#e11d48' }}>*</span>
                  </span>
                }
                rules={[
                  { required: true, message: 'Vui lòng nhập số CCCD / Định danh' },
                  { pattern: /^[0-9]{12}$/, message: 'Số CCCD gồm đúng 12 chữ số' },
                ]}
                extra="Số định danh 12 số in trên thẻ CCCD gắn chip"
              >
                <Input
                  prefix={<IdcardOutlined style={{ color: '#0284c7' }} />}
                  placeholder="079092001234"
                  size="large"
                  style={{ borderRadius: 10, fontFamily: 'monospace', letterSpacing: '1px' }}
                  maxLength={12}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={6}>
              <Form.Item
                name="gioiTinh"
                label={
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    Giới tính <span style={{ color: '#e11d48' }}>*</span>
                  </span>
                }
                rules={[{ required: true, message: 'Chọn giới tính' }]}
              >
                <Radio.Group size="large" buttonStyle="solid" style={{ width: '100%' }}>
                  <Radio.Button value="Nam" style={{ width: '50%', textAlign: 'center' }}>
                    Nam
                  </Radio.Button>
                  <Radio.Button value="Nữ" style={{ width: '50%', textAlign: 'center' }}>
                    Nữ
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>

            <Col xs={24} sm={6}>
              <Form.Item
                name="ngaySinh"
                label={
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    Ngày sinh <span style={{ color: '#e11d48' }}>*</span>
                  </span>
                }
                rules={[{ required: true, message: 'Chọn ngày sinh' }]}
              >
                <DatePicker
                  placeholder="DD/MM/YYYY"
                  format="DD/MM/YYYY"
                  size="large"
                  style={{ width: '100%', borderRadius: 10 }}
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="diaChi"
            label={
              <span style={{ fontWeight: 700, color: '#0f172a' }}>
                Địa chỉ thường trú / Nơi ở hiện tại <span style={{ color: '#e11d48' }}>*</span>
              </span>
            }
            rules={[
              { required: true, message: 'Vui lòng nhập địa chỉ cụ thể' },
              { min: 5, message: 'Địa chỉ quá ngắn' },
            ]}
          >
            <Input
              prefix={<HomeOutlined style={{ color: '#0284c7' }} />}
              placeholder="Số nhà, đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
              size="large"
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          <Divider style={{ margin: '14px 0', borderColor: '#e2e8f0' }} />

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="maTheBHYT"
                label={<span style={{ fontWeight: 600, color: '#334155' }}>Mã Thẻ BHYT (Nếu có)</span>}
              >
                <Input
                  prefix={<MedicineBoxOutlined style={{ color: '#059669' }} />}
                  placeholder="Ví dụ: GD4790123456789"
                  size="large"
                  style={{ borderRadius: 10, fontFamily: 'monospace' }}
                  maxLength={15}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="diUngThuoc"
                label={<span style={{ fontWeight: 600, color: '#334155' }}>Tiền sử dị ứng thuốc / thức ăn (Nếu có)</span>}
              >
                <Input
                  placeholder="Ví dụ: Dị ứng Penicillin, Paracetamol..."
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Action Buttons */}
          <div
            style={{
              marginTop: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {!allowClose ? (
              <Button
                danger
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{ borderRadius: 10 }}
              >
                Đăng xuất tài khoản
              </Button>
            ) : (
              <Button onClick={onCancel} style={{ borderRadius: 10 }}>
                Hủy bỏ
              </Button>
            )}

            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              loading={loading}
              onClick={handleSubmit}
              style={{
                backgroundColor: '#0284c7',
                borderColor: '#0284c7',
                borderRadius: 10,
                fontWeight: 700,
                padding: '0 24px',
              }}
            >
              Lưu & Kích Hoạt Hồ Sơ Bệnh Nhân
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};
