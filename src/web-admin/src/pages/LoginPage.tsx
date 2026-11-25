import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
  Alert,
  Divider,
  Steps,
  Modal,
} from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import {
  UserOutlined,
  LockOutlined,
  ArrowLeftOutlined,
  LoginOutlined,
  UserAddOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  ReloadOutlined,
  EditOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import { showToast, showErrorAlert } from '../utils/sweetAlert';
import { useThemeStore } from '../store/useThemeStore';
import dayjs from 'dayjs';
import { UserRole, UserAccount } from '../types';

const { Text, Title } = Typography;

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

// Component hiển thị Checklist điều kiện mật khẩu trực quan (Live tick khi đạt yêu cầu)
interface PasswordCriteriaProps {
  value?: string;
  isDarkMode?: boolean;
}

const PasswordCriteriaChecklist: React.FC<PasswordCriteriaProps> = ({ value = '', isDarkMode = false }) => {
  const currentVal = value || '';
  const hasMinLen = currentVal.length >= 6;
  const hasUppercase = /[A-Z]/.test(currentVal);
  const hasSpecial = /[^a-zA-Z0-9]/.test(currentVal);

  return (
    <div
      style={{
        marginTop: 4,
        marginBottom: 14,
        padding: '10px 14px',
        borderRadius: 8,
        backgroundColor: isDarkMode ? '#1e293b' : '#f0f9ff',
        border: `1px solid ${isDarkMode ? '#334155' : '#bae6fd'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: isDarkMode ? '#94a3b8' : '#0369a1', marginBottom: 2 }}>
        Yêu cầu bảo mật mật khẩu:
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        {hasMinLen ? (
          <CheckCircleFilled style={{ color: '#10b981', fontSize: 15 }} />
        ) : (
          <CheckCircleOutlined style={{ color: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 15 }} />
        )}
        <span
          style={{
            color: hasMinLen ? '#10b981' : isDarkMode ? '#cbd5e1' : '#475569',
            fontWeight: hasMinLen ? 600 : 400,
            transition: 'color 0.2s',
          }}
        >
          Tối thiểu 6 ký tự {hasMinLen && <span style={{ fontSize: 11.5, color: '#10b981' }}>✓ Đã đạt</span>}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        {hasUppercase ? (
          <CheckCircleFilled style={{ color: '#10b981', fontSize: 15 }} />
        ) : (
          <CheckCircleOutlined style={{ color: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 15 }} />
        )}
        <span
          style={{
            color: hasUppercase ? '#10b981' : isDarkMode ? '#cbd5e1' : '#475569',
            fontWeight: hasUppercase ? 600 : 400,
            transition: 'color 0.2s',
          }}
        >
          Chứa ít nhất 1 ký tự in hoa (A-Z){' '}
          {hasUppercase && <span style={{ fontSize: 11.5, color: '#10b981' }}>✓ Đã đạt</span>}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        {hasSpecial ? (
          <CheckCircleFilled style={{ color: '#10b981', fontSize: 15 }} />
        ) : (
          <CheckCircleOutlined style={{ color: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 15 }} />
        )}
        <span
          style={{
            color: hasSpecial ? '#10b981' : isDarkMode ? '#cbd5e1' : '#475569',
            fontWeight: hasSpecial ? 600 : 400,
            transition: 'color 0.2s',
          }}
        >
          Chứa ít nhất 1 ký tự đặc biệt (!, @, #, $, %, *...){' '}
          {hasSpecial ? (
            <span style={{ fontSize: 11.5, color: '#10b981' }}>✓ Đã đạt</span>
          ) : (
            <span style={{ fontSize: 11.5, color: isDarkMode ? '#94a3b8' : '#64748b' }}>(VD: MatKhau@123)</span>
          )}
        </span>
      </div>
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Chế độ: 'login' (Đăng nhập) hoặc 'register' (Đăng ký Bệnh nhân) trên cùng 1 trang
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [loginForm] = Form.useForm();
  const [registerStep1Form] = Form.useForm();
  const [registerStep3Form] = Form.useForm();
  const [forgotPhoneForm] = Form.useForm();
  const [forgotResetForm] = Form.useForm();

  // Theo dõi giá trị mật khẩu realtime để cập nhật tick điều kiện trực quan
  const regPassword = Form.useWatch('password', registerStep3Form) || '';
  const forgotNewPassword = Form.useWatch('newPassword', forgotResetForm) || '';

  // Multi-step Registration States:
  const [registerStep, setRegisterStep] = useState<1 | 2 | 3>(1);
  const [regFullName, setRegFullName] = useState('');
  const [regPhoneNumber, setRegPhoneNumber] = useState('');
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [serverOtp, setServerOtp] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState<number>(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const isVerifyingOtp = false;
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Forgot Password Modal States:
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOtpValues, setForgotOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [forgotServerOtp, setForgotServerOtp] = useState<string | null>(null);
  const [forgotCountdown, setForgotCountdown] = useState<number>(0);
  const [forgotLoading, setForgotLoading] = useState(false);
  const forgotOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const setAuth = useAuthStore((state) => state.setAuth);
  const { isDarkMode } = useThemeStore();

  // Đếm ngược thời gian hết hạn OTP Đăng ký
  useEffect(() => {
    let timer: any = null;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [otpCountdown]);

  // Đếm ngược thời gian hết hạn OTP Quên mật khẩu
  useEffect(() => {
    let timer: any = null;
    if (forgotCountdown > 0) {
      timer = setInterval(() => {
        setForgotCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [forgotCountdown]);

  // Đọc query param redirect nếu có
  const getRedirectUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('redirect');
  };

  // Đồng bộ chế độ từ query param (nếu có ?mode=register)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('mode') === 'register' || searchParams.get('tab') === 'register') {
      setAuthMode('register');
      setRegisterStep(1);
    }
  }, [location.search]);

  /**
   * Điều hướng theo đúng Role:
   * - Admin / Cán bộ y tế (Doctor, Nurse, Receptionist) -> Vào Web Quản Trị (/dashboard)
   * - Bệnh nhân (Patient) -> Vào Cổng Đặt Khám Bệnh Nhân (/booking)
   */
  const handleAuthSuccess = (user: any, token: string, customMessage?: string) => {
    const rawRoles: string[] = user.roles || user.vaiTro || [];
    const STAFF_ROLES_LOWER = [
      'admin', 'doctor', 'receptionist', 'triage', 'pharmacy', 'nurse', 'cashier',
      'quản trị viên', 'bác sĩ', 'nhân viên tiếp nhận', 'nhân viên sàng lọc bệnh', 'nhà thuốc', 'y tế', 'thu ngân'
    ];
    const isStaffOrAdmin = rawRoles.some((r: string) =>
      STAFF_ROLES_LOWER.includes(r.toLowerCase())
    );

    // Mặc định phân quyền Bệnh nhân nếu không phải nhân viên y tế / ban quản trị
    const finalRoles: UserRole[] = isStaffOrAdmin
      ? (rawRoles as UserRole[])
      : ['Patient'];

    const dob = user.dateOfBirth || user.ngaySinh;
    const formattedDob = dob ? dayjs(dob).format('YYYY-MM-DD') : undefined;
    const birthYear = user.namSinh || (dob ? dayjs(dob).year() : undefined);

    const cccd = user.identityCardNumber || user.soCCCD || '';
    const address = user.address || user.diaChi || '';
    const isAddressValid = Boolean(address && address.trim().length >= 5 && address.trim() !== 'Chưa cập nhật');
    const isCccdValid = Boolean(
      cccd &&
      cccd.trim().length >= 9 &&
      !cccd.startsWith('CD') &&
      !cccd.startsWith('P') &&
      cccd !== (user.phoneNumber || user.soDienThoai)
    );

    // Kiểm tra tính hoàn thiện hồ sơ bệnh nhân
    const isProfileComplete = Boolean(
      isStaffOrAdmin ||
      user.isProfileComplete === true ||
      (isCccdValid && (formattedDob || birthYear) && isAddressValid)
    );

    const hasRole = (roleKey: string) => finalRoles.some((r: string) => r.toLowerCase() === roleKey.toLowerCase());

    let resolvedFullName = user.fullName || user.hoTen || '';
    if (!resolvedFullName || resolvedFullName === 'Bệnh nhân' || resolvedFullName.includes('nh\uFFFD') || resolvedFullName.includes('?')) {
      if (hasRole('Admin') || hasRole('Quản trị viên')) {
        resolvedFullName = 'Quản trị viên (Admin)';
      } else if (hasRole('Doctor') || hasRole('Bác sĩ')) {
        resolvedFullName = user.title || 'BS. CKII. Nguyễn Thanh Duy';
      } else if (hasRole('Receptionist') || hasRole('Nhân viên tiếp nhận')) {
        resolvedFullName = 'Nhân viên tiếp nhận';
      } else if (hasRole('Triage') || hasRole('Nhân viên sàng lọc y tế') || hasRole('Nhân viên sàng lọc bệnh')) {
        resolvedFullName = 'Nhân viên sàng lọc y tế';
      } else if (hasRole('Pharmacy') || hasRole('Nhà thuốc')) {
        resolvedFullName = 'Nhà thuốc';
      } else if (hasRole('Nurse') || hasRole('Y tế') || hasRole('Nhân viên Y tế')) {
        resolvedFullName = 'Nhân viên Y tế';
      } else if (hasRole('Cashier') || hasRole('Thu ngân')) {
        resolvedFullName = 'Thu ngân';
      } else {
        resolvedFullName = isStaffOrAdmin ? 'Nhân viên Y tế' : 'Bệnh nhân';
      }
    }

    const authUser: UserAccount = {
      id: user.id || `pat-${Date.now()}`,
      tenDangNhap: user.username || user.tenDangNhap || user.phoneNumber || user.soDienThoai,
      hoTen: resolvedFullName,
      email: user.email,
      soDienThoai: user.phoneNumber || user.soDienThoai || '',
      vaiTro: finalRoles,
      chuyenKhoa: user.specialty,
      chucDanh: user.title,
      trangThaiKichHoat: true,
      avatarUrl: user.avatarUrl,
      // Hồ sơ bệnh nhân liên thông đồng bộ từ CSDL SQL Server
      maBenhNhan: user.patientCode || user.maBenhNhan || `BN-${dayjs().format('YYYY')}-${Math.floor(10000 + Math.random() * 90000)}`,
      soCCCD: cccd,
      ngaySinh: formattedDob,
      namSinh: birthYear,
      gioiTinh: (user.gender === 'Female' || user.gender === 'Nữ' || user.gioiTinh === 'Nữ') ? 'Nữ' : 'Nam',
      diaChi: address,
      maTheBHYT: user.healthInsuranceNumber || user.maTheBHYT || '',
      tienSuBenh: user.tienSuBenh || user.medicalHistory || '',
      diUngThuoc: user.diUngThuoc || user.drugAllergies || '',
      isProfileComplete: isProfileComplete,
    };

    // Kiểm tra trong danh sách người dùng đã lưu xem đã có hồ sơ hoàn chỉnh trước đó chưa
    try {
      const storedUsersStr = localStorage.getItem('hospital_registered_users');
      const userList = storedUsersStr ? JSON.parse(storedUsersStr) : [];
      const idx = userList.findIndex(
        (item: any) =>
          (item.email && authUser.email && item.email.toLowerCase() === authUser.email.toLowerCase()) ||
          item.username === authUser.tenDangNhap ||
          item.tenDangNhap === authUser.tenDangNhap ||
          (item.soDienThoai && authUser.soDienThoai && item.soDienThoai === authUser.soDienThoai) ||
          item.id === authUser.id
      );

      if (idx >= 0) {
        const existing = userList[idx];
        const isCccdPlaceholder = !authUser.soCCCD || authUser.soCCCD.startsWith('P') || authUser.soCCCD.startsWith('CD') || authUser.soCCCD === authUser.soDienThoai || authUser.soCCCD === '0900000000';
        if (isCccdPlaceholder && (existing.soCCCD || existing.identityCardNumber)) {
          authUser.soCCCD = existing.soCCCD || existing.identityCardNumber;
        }
        if ((!authUser.soDienThoai || authUser.soDienThoai === '0900000000') && (existing.soDienThoai || existing.phoneNumber)) {
          authUser.soDienThoai = existing.soDienThoai || existing.phoneNumber;
        }
        if ((!authUser.hoTen || authUser.hoTen === 'Bệnh nhân' || authUser.hoTen.startsWith('Bệnh nhân 09')) && (existing.hoTen || existing.fullName)) {
          authUser.hoTen = existing.hoTen || existing.fullName;
        }
        if (!authUser.ngaySinh && (existing.ngaySinh || existing.dateOfBirth)) {
          authUser.ngaySinh = existing.ngaySinh || existing.dateOfBirth;
        }
        if (!authUser.namSinh && existing.namSinh) {
          authUser.namSinh = existing.namSinh;
        }
        if ((!authUser.diaChi || authUser.diaChi === 'Chưa cập nhật') && (existing.diaChi || existing.address)) {
          authUser.diaChi = existing.diaChi || existing.address;
        }
        if (!authUser.maTheBHYT && (existing.maTheBHYT || existing.healthInsuranceNumber)) {
          authUser.maTheBHYT = existing.maTheBHYT || existing.healthInsuranceNumber;
        }
        if (!authUser.maBenhNhan && (existing.maBenhNhan || existing.patientCode)) {
          authUser.maBenhNhan = existing.maBenhNhan || existing.patientCode;
        }
        if (existing.isProfileComplete === true) {
          authUser.isProfileComplete = true;
        }

        userList[idx] = { ...existing, ...authUser };
      } else {
        userList.push(authUser);
      }
      localStorage.setItem('hospital_registered_users', JSON.stringify(userList));
    } catch {
      // ignore
    }

    setAuth(authUser, token);

    const redirectUrl = getRedirectUrl();

    // Danh sách các route công khai an toàn dành cho Bệnh nhân
    const PATIENT_SAFE_ROUTES = [
      '/booking', '/dat-lich', '/chuyen-khoa', '/departments',
      '/bac-si', '/doctors', '/goi-kham', '/packages',
      '/tin-tuc', '/news', '/huong-dan', '/guide',
      '/gioi-thieu', '/about',
    ];

    if (isStaffOrAdmin) {
      showToast(
        customMessage || `Đăng nhập thành công! Chào mừng cán bộ ${authUser.hoTen}`,
        'success'
      );
      // Điều hướng thông minh theo từng vai trò chuyên môn:
      let targetPath = '/dashboard';
      if (hasRole('Cashier') || hasRole('Thu ngân')) {
        targetPath = '/billing';
      } else if (hasRole('Triage') || hasRole('Nhân viên sàng lọc bệnh') || hasRole('Receptionist') || hasRole('Nhân viên tiếp nhận')) {
        targetPath = '/reception';
      } else if (hasRole('Doctor') || hasRole('Bác sĩ')) {
        targetPath = '/examinations';
      } else if (hasRole('Pharmacy') || hasRole('Nhà thuốc')) {
        targetPath = '/pharmacy';
      }
      const safeStaffRedirect =
        redirectUrl &&
        redirectUrl.startsWith('/') &&
        !redirectUrl.startsWith('//') &&
        !redirectUrl.startsWith('/\\') &&
        redirectUrl !== '/booking' &&
        redirectUrl !== '/'
          ? redirectUrl
          : targetPath;
      navigate(safeStaffRedirect);
    } else {
      // Bệnh nhân: CHỈ được phép vào các trang công khai dành cho bệnh nhân
      // Tuyệt đối KHÔNG được chuyển hướng vào bất kỳ trang quản trị nội bộ nào
      showToast(
        customMessage || `Đăng nhập thành công! Chào mừng Bệnh nhân ${authUser.hoTen}`,
        'success'
      );
      const safeRedirect =
        redirectUrl &&
        redirectUrl.startsWith('/') &&
        !redirectUrl.startsWith('//') &&
        PATIENT_SAFE_ROUTES.some((r) => redirectUrl.startsWith(r))
          ? redirectUrl
          : '/booking';
      navigate(safeRedirect);
    }
  };

  /**
   * 1. XỬ LÝ ĐĂNG NHẬP (Sign In - Chỉ xác thực qua API Backend thật, không chấp nhận đăng nhập offline/backdoor):
   */
  const onLoginFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setErrorMsg('');

    const inputUser = values.username.trim();
    const inputPass = values.password;

    if (!inputUser || !inputPass) {
      const msg = 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!';
      setErrorMsg(msg);
      showToast(msg, 'warning');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/login', {
        username: inputUser,
        password: inputPass,
      });

      const { token, user } = response.data || {};
      if (!token || !user) {
        setErrorMsg('Phản hồi xác thực từ máy chủ không hợp lệ.');
        setLoading(false);
        return;
      }

      handleAuthSuccess(user, token);
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      setErrorMsg(
        serverMsg || 'Không thể kết nối đến máy chủ xác thực Bệnh viện. Vui lòng kiểm tra kết nối mạng!'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * 2. XỬ LÝ ĐĂNG KÝ BỆNH NHÂN ĐA BƯỚC VỚI XÁC THỰC MÃ OTP
   * Bước 1: Nhập Họ tên + Số điện thoại -> Kiểm tra & Gửi mã OTP xác thực
   * Bước 2: Nhập mã OTP 6 chữ số -> Xác thực OTP hợp lệ
   * Bước 3: Thiết lập mật khẩu đăng nhập & Hoàn tất tạo tài khoản
   */

  // BƯỚC 1: Kiểm tra tài khoản & Gửi mã OTP qua Backend (Không tự sinh OTP giả ở client)
  const handleSendRegisterOtp = async (values: { fullName: string; phoneNumber: string }) => {
    setErrorMsg('');
    const inputName = values.fullName.trim();
    const inputPhone = values.phoneNumber.trim().replace(/\s+/g, '');

    if (!inputName) {
      setErrorMsg('Vui lòng nhập họ và tên của bạn!');
      return;
    }

    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(inputPhone)) {
      setErrorMsg('Số điện thoại không đúng định dạng! Vui lòng nhập số điện thoại Việt Nam gồm 10 chữ số (VD: 0912345678).');
      return;
    }

    const normalizedPhone = inputPhone.startsWith('+84') ? '0' + inputPhone.slice(3) : inputPhone;
    setIsSendingOtp(true);

    try {
      const checkRes = await api.get(`/auth/check-phone?phoneNumber=${encodeURIComponent(normalizedPhone)}`);
      if (checkRes.data?.exists) {
        setErrorMsg(`Số điện thoại ${normalizedPhone} đã tồn tại trong hệ thống. Vui lòng chuyển sang Đăng nhập!`);
        setIsSendingOtp(false);
        return;
      }

      const sendRes = await api.post('/auth/send-otp', { phoneNumber: normalizedPhone });
      const returnedCode = sendRes.data?.otpCode ? sendRes.data.otpCode.toString() : null;

      setRegFullName(inputName);
      setRegPhoneNumber(normalizedPhone);
      setServerOtp(returnedCode);
      setOtpValues(['', '', '', '', '', '']);
      setOtpCountdown(60);
      setRegisterStep(2);
      showToast(`Đã gửi mã xác thực OTP đến ${normalizedPhone}. Vui lòng kiểm tra tin nhắn!`, 'success');

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 250);
    } catch (apiErr: any) {
      const errMsg = apiErr.response?.data?.message;
      setErrorMsg(errMsg || 'Không thể gửi mã OTP lúc này. Vui lòng kiểm tra kết nối máy chủ!');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Gửi lại mã OTP trong Bước 2
  const handleResendRegisterOtp = async () => {
    if (otpCountdown > 0 || !regPhoneNumber) return;
    setIsSendingOtp(true);
    try {
      const sendRes = await api.post('/auth/send-otp', { phoneNumber: regPhoneNumber });
      const returnedCode = sendRes.data?.otpCode ? sendRes.data.otpCode.toString() : null;
      setServerOtp(returnedCode);
      setOtpValues(['', '', '', '', '', '']);
      setOtpCountdown(60);
      showToast(`Mã OTP mới đã được gửi đến ${regPhoneNumber}!`, 'success');
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 200);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại!', 'error');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // BƯỚC 2: Kiểm tra định dạng OTP trước khi sang bước tạo mật khẩu (Server sẽ đối chiếu OTP thực ở Bước 3)
  const handleVerifyRegisterOtp = () => {
    setErrorMsg('');
    const entered = otpValues.join('').trim();
    if (entered.length !== 6) {
      setErrorMsg('Vui lòng nhập đầy đủ 6 chữ số mã xác thực OTP!');
      return;
    }

    if (serverOtp && entered !== serverOtp) {
      setErrorMsg('Mã OTP không chính xác hoặc đã hết hiệu lực. Vui lòng thử lại!');
      return;
    }

    showToast('Đã ghi nhận mã OTP! Vui lòng thiết lập mật khẩu để hoàn tất xác thực.', 'success');
    setRegisterStep(3);
  };

  // BƯỚC 3: Thiết lập mật khẩu & Hoàn tất đăng ký trên Backend
  const onRegisterFinalFinish = async (values: { password: string; confirmPassword: string }) => {
    setLoading(true);
    setErrorMsg('');

    const phone = regPhoneNumber;
    const fullName = regFullName;
    const pass = values.password;
    const enteredOtp = otpValues.join('').trim();

    if (enteredOtp.length !== 6) {
      setErrorMsg('Mã OTP xác thực không hợp lệ.');
      setLoading(false);
      return;
    }

    if (!pass || pass.length < 6) {
      const msg = 'Mật khẩu phải có độ dài tối thiểu 6 ký tự!';
      setErrorMsg(msg);
      showToast(msg, 'warning');
      setLoading(false);
      return;
    }
    if (!/[A-Z]/.test(pass)) {
      const msg = 'Mật khẩu phải chứa ít nhất 1 ký tự in hoa (ví dụ: MatKhau@123)!';
      setErrorMsg(msg);
      showToast(msg, 'warning');
      setLoading(false);
      return;
    }
    if (!/[^a-zA-Z0-9]/.test(pass)) {
      const msg = 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (ví dụ: @, #, $, !)!';
      setErrorMsg(msg);
      showToast(msg, 'warning');
      setLoading(false);
      return;
    }
    if (!values.confirmPassword) {
      const msg = 'Vui lòng xác nhận lại mật khẩu!';
      setErrorMsg(msg);
      showToast(msg, 'warning');
      setLoading(false);
      return;
    }
    if (pass !== values.confirmPassword) {
      const msg = 'Mật khẩu xác nhận không khớp!';
      setErrorMsg(msg);
      showToast(msg, 'warning');
      setLoading(false);
      return;
    }

    try {
      const regRes = await api.post('/auth/register', {
        username: phone,
        password: pass,
        phoneNumber: phone,
        fullName: fullName,
        role: 'Patient',
        otpCode: enteredOtp,
      });

      const token = regRes.data?.token || regRes.data?.Token;
      if (!token) {
        setErrorMsg('Đăng ký thất bại: máy chủ không cấp phiên đăng nhập.');
        setLoading(false);
        return;
      }

      handleAuthSuccess(
        {
          id: regRes.data.id,
          username: regRes.data.username || phone,
          fullName: regRes.data.fullName || fullName,
          phoneNumber: regRes.data.phoneNumber || phone,
          roles: ['Patient'],
          patientCode: regRes.data.patientCode,
          identityCardNumber: regRes.data.identityCardNumber,
          isProfileComplete: false,
        },
        token,
        'Đăng ký tài khoản Bệnh nhân thành công qua xác thực OTP!'
      );
    } catch (err: any) {
      const errMsg = err.response?.data?.message;
      setErrorMsg(errMsg || 'Không thể kết nối đến máy chủ để hoàn tất đăng ký!');
    } finally {
      setLoading(false);
    }
  };

  // Quản lý Ô nhập OTP 6 chữ số (Register)
  const handleRegisterOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const updated = [...otpValues];
      updated[index] = '';
      setOtpValues(updated);
      return;
    }
    if (clean.length > 1) {
      const digits = clean.slice(0, 6).split('');
      const updated = [...otpValues];
      digits.forEach((d, i) => {
        updated[i] = d;
      });
      setOtpValues(updated);
      const nextIdx = Math.min(digits.length, 5);
      otpRefs.current[nextIdx]?.focus();
      return;
    }
    const updated = [...otpValues];
    updated[index] = clean;
    setOtpValues(updated);
    if (index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleRegisterOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleRegisterOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const updated = [...otpValues];
    pasted.split('').forEach((char, i) => {
      if (i < 6) updated[i] = char;
    });
    setOtpValues(updated);
    const nextIdx = Math.min(pasted.length, 5);
    otpRefs.current[nextIdx]?.focus();
  };

  // QUÊN MẬT KHẨU (FORGOT PASSWORD VỚI OTP)
  const handleOpenForgotPassword = () => {
    setForgotModalVisible(true);
    setForgotStep(1);
    setForgotPhone('');
    setForgotOtpValues(['', '', '', '', '', '']);
    setForgotServerOtp(null);
    setForgotCountdown(0);
    forgotPhoneForm.resetFields();
    forgotResetForm.resetFields();
  };

  const handleSendForgotOtp = async (values: { phoneNumber: string }) => {
    const inputPhone = values.phoneNumber.trim().replace(/\s+/g, '');
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(inputPhone)) {
      showToast('Số điện thoại không đúng định dạng (10 chữ số)!', 'warning');
      return;
    }

    setForgotLoading(true);
    const normalized = inputPhone.startsWith('+84') ? '0' + inputPhone.slice(3) : inputPhone;

    try {
      const res = await api.post('/auth/forgot-password-otp', { phoneNumber: normalized });
      const returnedCode = res.data?.otpCode ? res.data.otpCode.toString() : null;

      setForgotPhone(normalized);
      setForgotServerOtp(returnedCode);
      setForgotCountdown(60);
      setForgotStep(2);
      showToast(`Yêu cầu đặt lại mật khẩu đã được tiếp nhận cho ${normalized}. Vui lòng kiểm tra mã OTP!`, 'success');
      setTimeout(() => {
        forgotOtpRefs.current[0]?.focus();
      }, 250);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể gửi mã OTP khôi phục mật khẩu!', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (values: { newPassword: string; confirmNewPassword: string }) => {
    const enteredOtp = forgotOtpValues.join('').trim();
    if (enteredOtp.length !== 6) {
      showToast('Vui lòng nhập đủ 6 chữ số mã OTP!', 'warning');
      return;
    }
    if (forgotServerOtp && enteredOtp !== forgotServerOtp) {
      showToast('Mã OTP không chính xác hoặc đã hết hạn!', 'error');
      return;
    }

    const newPwd = values.newPassword;
    if (!newPwd || newPwd.length < 6) {
      showToast('Mật khẩu phải có độ dài tối thiểu 6 ký tự!', 'warning');
      return;
    }
    if (!/[A-Z]/.test(newPwd)) {
      showToast('Mật khẩu phải chứa ít nhất 1 ký tự in hoa (ví dụ: MatKhau@123)!', 'warning');
      return;
    }
    if (!/[^a-zA-Z0-9]/.test(newPwd)) {
      showToast('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (ví dụ: @, #, $, !)!', 'warning');
      return;
    }
    if (values.confirmNewPassword && newPwd !== values.confirmNewPassword) {
      showToast('Mật khẩu xác nhận không khớp!', 'warning');
      return;
    }

    setForgotLoading(true);
    const normalized = forgotPhone;

    try {
      await api.post('/auth/reset-password-otp', {
        phoneNumber: normalized,
        otpCode: enteredOtp,
        newPassword: values.newPassword,
      });
      showToast('Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.', 'success');
      setForgotModalVisible(false);
      loginForm.setFieldsValue({ username: normalized, password: values.newPassword });
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message;
      showToast(errMsg || 'Đặt lại mật khẩu thất bại hoặc không kết nối được máy chủ!', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  // Đăng nhập Google OAuth: Bắt buộc xác thực & lấy JWT từ Backend SQL Server
  const googleLoginTrigger = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await userInfoRes.json();

        const res = await api.post('/auth/google-login', {
          idToken: tokenResponse.access_token,
          email: googleUser.email,
          fullName: googleUser.name || 'Bệnh nhân Google',
          photoUrl: googleUser.picture,
        });

        const backendToken = res.data?.token;
        const backendUser = res.data?.user;
        if (!backendToken || !backendUser) {
          showErrorAlert('Đăng nhập Google thất bại', 'Máy chủ không xác thực được tài khoản Google.');
          setGoogleLoading(false);
          return;
        }

        const rawCccd = backendUser.identityCardNumber || backendUser.soCCCD;
        const isBackendCccdValid = Boolean(rawCccd && !rawCccd.startsWith('P') && !rawCccd.startsWith('CD') && rawCccd !== '0900000000');
        const resolvedCccd = isBackendCccdValid ? rawCccd : '';

        const isBackendPhoneValid = Boolean(backendUser.phoneNumber && backendUser.phoneNumber !== '0900000000');
        const resolvedPhone = isBackendPhoneValid ? backendUser.phoneNumber : '';

        const isBackendNameValid = Boolean(backendUser.fullName && backendUser.fullName !== 'Bệnh nhân' && backendUser.fullName !== 'Bệnh nhân Google' && !backendUser.fullName.startsWith('Bệnh nhân 09'));
        const resolvedName = isBackendNameValid ? backendUser.fullName : (googleUser.name || 'Bệnh nhân');

        const isBackendAddressValid = Boolean(backendUser.address && backendUser.address !== 'Chưa cập nhật');
        const resolvedAddress = isBackendAddressValid ? backendUser.address : '';

        const resolvedDob = backendUser.dateOfBirth || backendUser.ngaySinh;
        const resolvedBirthYear = backendUser.namSinh || (resolvedDob ? dayjs(resolvedDob).year() : undefined);

        const patientUser = {
          id: backendUser.id,
          username: backendUser.username || googleUser.email,
          fullName: resolvedName,
          email: backendUser.email || googleUser.email,
          phoneNumber: resolvedPhone,
          roles: backendUser.roles || ['Patient'],
          avatarUrl: googleUser.picture || backendUser.avatarUrl,
          patientCode: backendUser.patientCode,
          maBenhNhan: backendUser.patientCode,
          identityCardNumber: resolvedCccd,
          soCCCD: resolvedCccd,
          dateOfBirth: resolvedDob,
          ngaySinh: resolvedDob,
          namSinh: resolvedBirthYear,
          gender: backendUser.gender || 'Nam',
          gioiTinh: backendUser.gender || 'Nam',
          address: resolvedAddress,
          diaChi: resolvedAddress,
          healthInsuranceNumber: backendUser.healthInsuranceNumber,
          maTheBHYT: backendUser.healthInsuranceNumber,
          isProfileComplete: Boolean(backendUser.isProfileComplete),
        };

        handleAuthSuccess(
          patientUser,
          backendToken,
          `Đăng nhập Google thành công! Chào mừng Bệnh nhân ${patientUser.fullName}`
        );
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Không thể xác thực tài khoản Google với máy chủ Bệnh viện.';
        showErrorAlert('Đăng nhập thất bại', msg);
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setGoogleLoading(false);
    },
  });

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
          width: 480,
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
              height: 54,
              maxWidth: '85%',
              objectFit: 'contain',
              marginBottom: 8,
              filter: isDarkMode ? 'none' : 'drop-shadow(0 4px 12px rgba(2, 132, 199, 0.18))',
            }}
          />
          <Title level={4} style={{ margin: 0, color: isDarkMode ? '#f8fafc' : '#0369a1', fontWeight: 800 }}>
            {authMode === 'login' ? 'ĐĂNG NHẬP HỆ THỐNG Y TẾ' : 'ĐĂNG KÝ TÀI KHOẢN BỆNH NHÂN'}
          </Title>
          <Text style={{ fontSize: 13, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
            {authMode === 'login'
              ? 'Cổng Dịch Vụ Y Tế Số & Quản Lý Khám Chữa Bệnh'
              : 'Đăng ký tài khoản Bệnh nhân để đặt lịch khám trực tuyến'}
          </Text>
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

        {/* ================= 1. FORM ĐĂNG NHẬP ================= */}
        {authMode === 'login' && (
          <Form
            form={loginForm}
            name="unified_login"
            initialValues={{ remember: true }}
            onFinish={onLoginFinish}
            onFinishFailed={(errorInfo) => {
              const firstError = errorInfo.errorFields?.[0]?.errors?.[0];
              if (firstError) {
                showToast(firstError, 'warning');
                setErrorMsg(firstError);
              }
            }}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="username"
              label={
                <span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>
                  Tài khoản hoặc Số điện thoại <span style={{ color: '#ef4444' }}>*</span>
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập hoặc số điện thoại!' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#0284c7' }} />}
                placeholder="Số điện thoại hoặc tên tài khoản..."
                size="large"
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              hasFeedback
              label={
                <span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>
                  Mật khẩu <span style={{ color: '#ef4444' }}>*</span>
                </span>
              }
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                {
                  validator(_, value) {
                    if (!value) return Promise.resolve();
                    if (value.length < 6) {
                      return Promise.reject(new Error('Mật khẩu phải có tối thiểu 6 ký tự!'));
                    }
                    if (!/[A-Z]/.test(value)) {
                      return Promise.reject(new Error('Mật khẩu phải chứa ít nhất 1 ký tự in hoa!'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#0284c7' }} />}
                placeholder="Tối thiểu 6 ký tự, gồm chữ in hoa (VD: Admin@123)..."
                size="large"
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 18,
              }}
            >
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox style={{ color: isDarkMode ? '#cbd5e1' : '#475569', fontSize: 13 }}>
                  Ghi nhớ đăng nhập
                </Checkbox>
              </Form.Item>
              <a
                style={{ fontSize: 12.5, color: '#0284c7', fontWeight: 600, cursor: 'pointer' }}
                onClick={handleOpenForgotPassword}
              >
                Quên mật khẩu?
              </a>
            </div>

            <Form.Item style={{ marginBottom: 14 }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                icon={<LoginOutlined />}
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
                Đăng Nhập Vào Hệ Thống
              </Button>
            </Form.Item>

            {/* Chuyển sang form Đăng ký */}
            <div style={{ textAlign: 'center', margin: '14px 0 6px' }}>
              <Text style={{ fontSize: 13.5, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                Chưa có tài khoản bệnh nhân?{' '}
                <a
                  style={{ color: '#0284c7', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => {
                    setErrorMsg('');
                    setAuthMode('register');
                    setRegisterStep(1);
                  }}
                >
                  Đăng ký ngay tại đây
                </a>
              </Text>
            </div>
          </Form>
        )}

        {/* ================= 2. FORM ĐĂNG KÝ BỆNH NHÂN VỚI XÁC THỰC OTP ================= */}
        {authMode === 'register' && (
          <div>
            {/* Step Progress Bar */}
            <Steps
              current={registerStep - 1}
              size="small"
              style={{ marginBottom: 20 }}
              items={[
                {
                  title: <span style={{ fontSize: 12.5, fontWeight: registerStep === 1 ? 700 : 500 }}>Thông tin</span>,
                },
                {
                  title: <span style={{ fontSize: 12.5, fontWeight: registerStep === 2 ? 700 : 500 }}>Mã OTP</span>,
                },
                {
                  title: <span style={{ fontSize: 12.5, fontWeight: registerStep === 3 ? 700 : 500 }}>Mật khẩu</span>,
                },
              ]}
            />

            {/* BƯỚC 1: NHẬP HỌ TÊN VÀ SỐ ĐIỆN THOẠI */}
            {registerStep === 1 && (
              <Form
                form={registerStep1Form}
                name="reg_step1"
                initialValues={{ fullName: regFullName, phoneNumber: regPhoneNumber }}
                onFinish={handleSendRegisterOtp}
                onFinishFailed={(errorInfo) => {
                  const firstError = errorInfo.errorFields?.[0]?.errors?.[0];
                  if (firstError) {
                    showToast(firstError, 'warning');
                    setErrorMsg(firstError);
                  }
                }}
                layout="vertical"
                requiredMark={false}
              >
                <Form.Item
                  name="fullName"
                  label={
                    <span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>
                      Họ và tên người bệnh <span style={{ color: '#ef4444' }}>*</span>
                    </span>
                  }
                  rules={[
                    { required: true, message: 'Vui lòng nhập họ và tên của bạn!' },
                    { min: 2, message: 'Họ tên tối thiểu 2 ký tự!' },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: '#0284c7' }} />}
                    placeholder="VD: Nguyễn Văn An..."
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>

                <Form.Item
                  name="phoneNumber"
                  label={
                    <span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>
                      Số điện thoại di động <span style={{ color: '#ef4444' }}>*</span>
                    </span>
                  }
                  rules={[
                    { required: true, message: 'Vui lòng nhập số điện thoại!' },
                    {
                      pattern: /^(0|\+84)[3|5|7|8|9][0-9]{8}$/,
                      message: 'Số điện thoại không đúng định dạng (10 chữ số bắt đầu bằng 03, 05, 07, 08, 09)!',
                    },
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined style={{ color: '#0284c7' }} />}
                    placeholder="VD: 0912345678..."
                    size="large"
                    maxLength={11}
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>

                <div
                  style={{
                    fontSize: 12.5,
                    color: isDarkMode ? '#38bdf8' : '#0369a1',
                    backgroundColor: isDarkMode ? '#0f172a' : '#f0f9ff',
                    padding: '10px 14px',
                    borderRadius: 10,
                    marginBottom: 16,
                    border: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd',
                    lineHeight: 1.5,
                  }}
                >
                  🔒 <strong>Xác thực định danh:</strong> Hệ thống sẽ gửi mã OTP gồm 6 chữ số qua SMS tới số điện thoại trên để xác thực tài khoản y tế chính chủ.
                </div>

                <Form.Item style={{ marginBottom: 12 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    loading={isSendingOtp}
                    icon={<SafetyCertificateOutlined />}
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
                    Tiếp Tục Nhận Mã Xác Thực OTP
                  </Button>
                </Form.Item>
              </Form>
            )}

            {/* BƯỚC 2: NHẬP VÀ XÁC THỰC MÃ OTP */}
            {registerStep === 2 && (
              <div>
                <div
                  style={{
                    backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                    border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '12px 16px',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                      Số điện thoại nhận mã:
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
                      {regPhoneNumber}
                    </div>
                  </div>
                  <Button
                    size="small"
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setRegisterStep(1);
                      setErrorMsg('');
                    }}
                    style={{ color: '#0284c7', fontWeight: 600, padding: 0 }}
                  >
                    Thay đổi
                  </Button>
                </div>

                {/* Banner thử nghiệm chỉ hiển thị khi Backend Dev chủ động trả otpCode */}
                {serverOtp && (
                  <div
                    style={{
                      backgroundColor: isDarkMode ? '#0c2438' : '#e0f2fe',
                      border: '1px dashed #0284c7',
                      borderRadius: 10,
                      padding: '10px 14px',
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ fontSize: 13, color: isDarkMode ? '#38bdf8' : '#0369a1' }}>
                      💡 <strong>Mã OTP thử nghiệm:</strong>{' '}
                      <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, letterSpacing: 2 }}>
                        {serverOtp}
                      </span>
                    </div>
                    <Button
                      size="small"
                      type="primary"
                      ghost
                      onClick={() => {
                        const code = serverOtp.slice(0, 6).split('');
                        setOtpValues(code);
                        otpRefs.current[5]?.focus();
                        showToast(`Đã tự động điền mã OTP: ${serverOtp}`, 'info');
                      }}
                      style={{
                        height: 28,
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        borderColor: '#0284c7',
                        color: '#0284c7',
                      }}
                    >
                      Điền nhanh
                    </Button>
                  </div>
                )}

                <div style={{ textAlign: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 13.5, color: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: 600 }}>
                    Nhập mã xác thực 6 chữ số
                  </Text>
                </div>

                {/* 6 Digit OTP Inputs */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 18 }}>
                  {otpValues.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleRegisterOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleRegisterOtpKeyDown(idx, e)}
                      onPaste={handleRegisterOtpPaste}
                      className={`otp-digit-input ${digit ? 'has-val' : ''}`}
                    />
                  ))}
                </div>

                {/* Countdown & Resend Button */}
                <div style={{ textAlign: 'center', marginBottom: 18 }}>
                  {otpCountdown > 0 ? (
                    <Text style={{ fontSize: 13, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                      Gửi lại mã OTP sau:{' '}
                      <strong style={{ color: '#0284c7' }}>
                        00:{otpCountdown < 10 ? `0${otpCountdown}` : otpCountdown}
                      </strong>
                    </Text>
                  ) : (
                    <Button
                      type="link"
                      icon={<ReloadOutlined />}
                      loading={isSendingOtp}
                      onClick={handleResendRegisterOtp}
                      style={{ color: '#0284c7', fontWeight: 600, fontSize: 13, padding: 0 }}
                    >
                      Gửi lại mã xác thực OTP
                    </Button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <Button
                    size="large"
                    onClick={() => {
                      setRegisterStep(1);
                      setErrorMsg('');
                    }}
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 10,
                      fontWeight: 600,
                    }}
                  >
                    Quay lại
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    loading={isVerifyingOtp}
                    onClick={handleVerifyRegisterOtp}
                    icon={<CheckCircleFilled />}
                    style={{
                      flex: 2,
                      height: 48,
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 15,
                      backgroundColor: '#0284c7',
                      borderColor: '#0284c7',
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
                    }}
                  >
                    Xác Thực Mã OTP
                  </Button>
                </div>
              </div>
            )}

            {/* BƯỚC 3: THIẾT LẬP MẬT KHẨU & HOÀN TẤT */}
            {registerStep === 3 && (
              <Form
                form={registerStep3Form}
                name="reg_step3"
                onFinish={onRegisterFinalFinish}
                onFinishFailed={(errorInfo) => {
                  const firstError = errorInfo.errorFields?.[0]?.errors?.[0];
                  if (firstError) {
                    showToast(firstError, 'warning');
                    setErrorMsg(firstError);
                  }
                }}
                layout="vertical"
                requiredMark={false}
              >
                <div
                  style={{
                    backgroundColor: isDarkMode ? '#064e3b' : '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: 10,
                    padding: '10px 14px',
                    marginBottom: 16,
                    color: isDarkMode ? '#6ee7b7' : '#047857',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <CheckCircleFilled style={{ color: '#10b981', fontSize: 16 }} />
                  <span>
                    Số điện thoại <strong>{regPhoneNumber}</strong> đã xác thực OTP thành công! Thiết lập mật khẩu để hoàn tất.
                  </span>
                </div>

                <Form.Item
                  name="password"
                  hasFeedback
                  label={
                    <span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>
                      Mật khẩu mới <span style={{ color: '#ef4444' }}>*</span>
                    </span>
                  }
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                    {
                      validator(_, value) {
                        if (!value) return Promise.resolve();
                        if (value.length < 6) {
                          return Promise.reject(new Error('Mật khẩu phải có tối thiểu 6 ký tự!'));
                        }
                        if (!/[A-Z]/.test(value)) {
                          return Promise.reject(new Error('Mật khẩu phải chứa ít nhất 1 ký tự in hoa (ví dụ: MatKhau@123)!'));
                        }
                        if (!/[^a-zA-Z0-9]/.test(value)) {
                          return Promise.reject(new Error('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (ví dụ: @, #, $, !)!'));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#0284c7' }} />}
                    placeholder="Tối thiểu 6 ký tự, có chữ in hoa và ký tự đặc biệt (VD: MatKhau@123)..."
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
                <PasswordCriteriaChecklist value={regPassword} isDarkMode={isDarkMode} />

                <Form.Item
                  name="confirmPassword"
                  dependencies={['password']}
                  label={
                    <span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>
                      Xác nhận lại mật khẩu <span style={{ color: '#ef4444' }}>*</span>
                    </span>
                  }
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận lại mật khẩu!' },
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
                    prefix={<LockOutlined style={{ color: '#0284c7' }} />}
                    placeholder="Nhập lại mật khẩu..."
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>

                <Form.Item
                  name="agreeTerms"
                  valuePropName="checked"
                  initialValue={true}
                  rules={[
                    {
                      validator: (_, value) =>
                        value ? Promise.resolve() : Promise.reject(new Error('Vui lòng đồng ý với Điều khoản dịch vụ!')),
                    },
                  ]}
                  style={{ marginBottom: 14 }}
                >
                  <Checkbox style={{ color: isDarkMode ? '#cbd5e1' : '#475569', fontSize: 12.5 }}>
                    Tôi cam kết số điện thoại chính chủ và đồng ý với Quy chế hoạt động & Bảo mật dữ liệu Y tế số theo Đề án 06/CP.
                  </Checkbox>
                </Form.Item>

                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <Button
                    size="large"
                    onClick={() => {
                      setRegisterStep(2);
                      setErrorMsg('');
                    }}
                    style={{
                      width: 100,
                      height: 48,
                      borderRadius: 10,
                      fontWeight: 600,
                    }}
                  >
                    Quay lại
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={loading}
                    icon={<UserAddOutlined />}
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 15,
                      backgroundColor: '#0284c7',
                      borderColor: '#0284c7',
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
                    }}
                  >
                    Hoàn Tất Đăng Ký Tài Khoản
                  </Button>
                </div>
              </Form>
            )}

            {/* Chuyển lại form Đăng nhập */}
            <div style={{ textAlign: 'center', margin: '14px 0 6px' }}>
              <Text style={{ fontSize: 13.5, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                Đã có tài khoản?{' '}
                <a
                  style={{ color: '#0284c7', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => {
                    setErrorMsg('');
                    setAuthMode('login');
                    setRegisterStep(1);
                  }}
                >
                  Đăng nhập ngay
                </a>
              </Text>
            </div>
          </div>
        )}

        <Divider style={{ margin: '14px 0', fontSize: 12, color: isDarkMode ? '#94a3b8' : '#94a3b8' }}>
          Hoặc
        </Divider>

        <Button
          size="large"
          block
          icon={<GoogleIcon />}
          loading={googleLoading}
          onClick={() => googleLoginTrigger()}
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
          Tiếp tục với Google
        </Button>

        {/* ================= MODAL QUÊN MẬT KHẨU QUA XÁC THỰC OTP ================= */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0369a1', fontWeight: 700 }}>
              <KeyOutlined style={{ color: '#0284c7' }} />
              <span>Khôi Phục Mật Khẩu Qua Xác Thực OTP</span>
            </div>
          }
          open={forgotModalVisible}
          onCancel={() => setForgotModalVisible(false)}
          footer={null}
          destroyOnClose
          width={440}
          centered
        >
          {forgotStep === 1 && (
            <Form
              form={forgotPhoneForm}
              layout="vertical"
              onFinish={handleSendForgotOtp}
              onFinishFailed={(errorInfo) => {
                const firstError = errorInfo.errorFields?.[0]?.errors?.[0];
                if (firstError) showToast(firstError, 'warning');
              }}
              style={{ marginTop: 16 }}
            >
              <Text style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 14 }}>
                Nhập số điện thoại đã đăng ký để nhận mã xác thực OTP khôi phục mật khẩu.
              </Text>
              <Form.Item
                name="phoneNumber"
                label={<span style={{ fontWeight: 600 }}>Số điện thoại đã đăng ký</span>}
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                  { pattern: /^(0|\+84)[3|5|7|8|9][0-9]{8}$/, message: 'Số điện thoại không hợp lệ!' },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: '#0284c7' }} />}
                  placeholder="VD: 0912345678..."
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={forgotLoading}
                icon={<SafetyCertificateOutlined />}
                style={{
                  height: 46,
                  borderRadius: 10,
                  fontWeight: 700,
                  backgroundColor: '#0284c7',
                  borderColor: '#0284c7',
                }}
              >
                Gửi Mã Xác Thực OTP
              </Button>
            </Form>
          )}

          {forgotStep === 2 && (
            <Form
              form={forgotResetForm}
              layout="vertical"
              onFinish={handleResetPasswordSubmit}
              onFinishFailed={(errorInfo) => {
                const firstError = errorInfo.errorFields?.[0]?.errors?.[0];
                if (firstError) showToast(firstError, 'warning');
              }}
              style={{ marginTop: 16 }}
            >
              <div
                style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 14,
                  fontSize: 13,
                  color: '#0369a1',
                }}
              >
                Mã OTP đã gửi đến <strong>{forgotPhone}</strong>.{' '}
                {forgotServerOtp && (
                  <span>
                    (Mã thử nghiệm: <strong>{forgotServerOtp}</strong>)
                  </span>
                )}
              </div>

              {/* 6 Digit OTP for Forgot Password */}
              <div style={{ textAlign: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Nhập mã OTP 6 số</Text>
              </div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 14 }}>
                {forgotOtpValues.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (forgotOtpRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      const updated = [...forgotOtpValues];
                      updated[idx] = clean ? clean.slice(-1) : '';
                      setForgotOtpValues(updated);
                      if (clean && idx < 5) forgotOtpRefs.current[idx + 1]?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !forgotOtpValues[idx] && idx > 0) {
                        forgotOtpRefs.current[idx - 1]?.focus();
                      }
                    }}
                    className={`otp-digit-input ${digit ? 'has-val' : ''}`}
                    style={{ width: 42, height: 46, fontSize: 20 }}
                  />
                ))}
              </div>

              {forgotServerOtp && (
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <Button
                    size="small"
                    type="link"
                    onClick={() => {
                      if (!forgotServerOtp) return;
                      setForgotOtpValues(forgotServerOtp.slice(0, 6).split(''));
                    }}
                    style={{ color: '#0284c7', fontSize: 12, padding: 0 }}
                  >
                    Điền nhanh mã: {forgotServerOtp}
                  </Button>
                </div>
              )}

              <Form.Item
                name="newPassword"
                label={<span style={{ fontWeight: 600 }}>Mật khẩu mới</span>}
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                  {
                    validator(_, value) {
                      if (!value) return Promise.resolve();
                      if (value.length < 6) {
                        return Promise.reject(new Error('Mật khẩu phải có tối thiểu 6 ký tự!'));
                      }
                      if (!/[A-Z]/.test(value)) {
                        return Promise.reject(new Error('Mật khẩu phải chứa ít nhất 1 ký tự in hoa!'));
                      }
                      if (!/[^a-zA-Z0-9]/.test(value)) {
                        return Promise.reject(new Error('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (ví dụ: @, #, $, !)!'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#0284c7' }} />}
                  placeholder="Tối thiểu 6 ký tự, có chữ in hoa và ký tự đặc biệt (VD: MatKhau@123)..."
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>
              <PasswordCriteriaChecklist value={forgotNewPassword} isDarkMode={isDarkMode} />

              <Form.Item
                name="confirmNewPassword"
                dependencies={['newPassword']}
                label={<span style={{ fontWeight: 600 }}>Xác nhận mật khẩu mới</span>}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#0284c7' }} />}
                  placeholder="Xác nhận lại..."
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>

              <div style={{ display: 'flex', gap: 10 }}>
                <Button onClick={() => setForgotStep(1)} style={{ width: 90, height: 44, borderRadius: 10 }}>
                  Quay lại
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={forgotLoading}
                  style={{
                    height: 44,
                    borderRadius: 10,
                    fontWeight: 700,
                    backgroundColor: '#0284c7',
                    borderColor: '#0284c7',
                  }}
                >
                  Đổi Mật Khẩu & Đăng Nhập
                </Button>
              </div>
            </Form>
          )}
        </Modal>

        {/* Footer */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 22,
            borderTop: isDarkMode ? '1px solid #334155' : '1px solid #f1f5f9',
            paddingTop: 14,
          }}
        >
          <div style={{ fontSize: 12, color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: 4 }}>
            Tổng đài Hỗ trợ Y tế & Cấp cứu 24/7: <strong style={{ color: '#0284c7' }}>1900 6868</strong>
          </div>
          <Text type="secondary" style={{ fontSize: 11.5, color: '#94a3b8' }}>
            © 2026 Bệnh viện Đa khoa Quốc tế D-Medical • Nền tảng Y tế Số Thông minh
          </Text>
        </div>
      </Card>
    </div>
  );
};
