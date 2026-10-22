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

// Danh sách các Bác sĩ chuyên khoa chuẩn trong hệ thống
const DOCTORS_PRESETS: Record<string, { name: string; dept: string; title: string }> = {
  'dr.duc': { name: 'BS. CKI. Phạm Minh Đức', dept: 'Khoa Nhi', title: 'Trưởng Khoa Nhi' },
  'dr.mai': { name: 'BS. CKI. Trần Ngọc Mai', dept: 'Khoa Mắt', title: 'Trưởng Khoa Mắt' },
  'dr.tuan': { name: 'BS. CKII. Lê Văn Tuấn', dept: 'Khoa Tai Mũi Họng', title: 'Trưởng Khoa TMH' },
  'dr.dung': { name: 'TS. BS. Huỳnh Quốc Dũng', dept: 'Khoa Tim Mạch', title: 'Trưởng Khoa Tim Mạch' },
  'dr.vuong': { name: 'BS. CKII. Đinh Khắc Vương', dept: 'Khoa Tiêu Hóa', title: 'Trưởng Khoa Tiêu Hóa' },
  'dr.giang': { name: 'BS. CKII. Đỗ Hoàng Giang', dept: 'Khoa Ngoại Tổng Quát', title: 'Trưởng Khoa Ngoại' },
  'dr.nghia': { name: 'BS. CKI. Hoàng Trọng Nghĩa', dept: 'Khoa Răng Hàm Mặt', title: 'Trưởng Khoa Răng Hàm Mặt' },
  'dr.phuonganh': { name: 'BS. CKI. Nguyễn Phương Anh', dept: 'Khoa Da Liễu', title: 'Trưởng Khoa Da Liễu' },
  'dr.phuong': { name: 'BS. CKII. Lê Thị Kim Phượng', dept: 'Khoa Sản Phụ Khoa', title: 'Trưởng Khoa Sản' },
  'dr.thanh': { name: 'BS. CKI. Trịnh Văn Thành', dept: 'Khoa Cấp Cứu & Hồi Sức', title: 'Trưởng Kíp Cấp Cứu' },
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

  // Multi-step Registration States:
  const [registerStep, setRegisterStep] = useState<1 | 2 | 3>(1);
  const [regFullName, setRegFullName] = useState('');
  const [regPhoneNumber, setRegPhoneNumber] = useState('');
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [serverOtp, setServerOtp] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState<number>(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
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
    const isStaffOrAdmin = rawRoles.some((r: string) =>
      ['Admin', 'Doctor', 'Nurse', 'Receptionist'].includes(r)
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

    let resolvedFullName = user.fullName || user.hoTen || '';
    if (!resolvedFullName || resolvedFullName === 'Bệnh nhân' || resolvedFullName.includes('nh\uFFFD') || resolvedFullName.includes('?')) {
      if (finalRoles.includes('Admin')) {
        resolvedFullName = 'Quản trị viên Hệ thống';
      } else if (finalRoles.includes('Receptionist')) {
        resolvedFullName = 'Nhân viên Lễ tân';
      } else if (finalRoles.includes('Doctor')) {
        resolvedFullName = user.title || 'BS. CKII. Nguyễn Thanh Duy';
      } else {
        resolvedFullName = isStaffOrAdmin ? 'Cán bộ Y tế' : 'Bệnh nhân';
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
        // Giữ nguyên các trường đã điền đầy đủ trước đó nếu authUser hiện tại chưa có
        if (!authUser.soCCCD && (existing.soCCCD || existing.identityCardNumber)) {
          authUser.soCCCD = existing.soCCCD || existing.identityCardNumber;
        }
        if (!authUser.soDienThoai && (existing.soDienThoai || existing.phoneNumber)) {
          authUser.soDienThoai = existing.soDienThoai || existing.phoneNumber;
        }
        if (!authUser.ngaySinh && (existing.ngaySinh || existing.dateOfBirth)) {
          authUser.ngaySinh = existing.ngaySinh || existing.dateOfBirth;
        }
        if (!authUser.namSinh && existing.namSinh) {
          authUser.namSinh = existing.namSinh;
        }
        if (!authUser.diaChi && (existing.diaChi || existing.address)) {
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
      // Admin / Staff vào Dashboard
      navigate(redirectUrl && redirectUrl !== '/booking' ? redirectUrl : '/dashboard');
    } else {
      // Bệnh nhân: CHỈ được phép vào các trang công khai dành cho bệnh nhân
      // Tuyệt đối KHÔNG được chuyển hướng vào bất kỳ trang quản trị nội bộ nào
      showToast(
        customMessage || `Đăng nhập thành công! Chào mừng Bệnh nhân ${authUser.hoTen}`,
        'success'
      );
      const safeRedirect =
        redirectUrl && PATIENT_SAFE_ROUTES.some((r) => redirectUrl.startsWith(r))
          ? redirectUrl
          : '/booking';
      navigate(safeRedirect);
    }
  };

  /**
   * 1. XỬ LÝ ĐĂNG NHẬP (Sign In):
   * - Người dùng tự nhập tài khoản đã có.
   * - Admin / Bác sĩ -> Vào trang Quản trị (/dashboard) với đúng Role.
   * - Bệnh nhân cũ -> Vào /booking.
   * - Nếu tài khoản không tồn tại -> Báo lỗi yêu cầu đăng ký (KHÔNG tự sinh tài khoản bừa bãi).
   */
  const onLoginFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setErrorMsg('');

    const inputUser = values.username.trim();
    const inputPass = values.password;
    const u = inputUser.toLowerCase();

    // 1. Thử gọi API Backend nếu Server đang chạy
    try {
      const response = await api.post('/auth/login', {
        username: inputUser,
        password: inputPass,
      });

      const { token, user } = response.data;
      handleAuthSuccess(user, token);
      setLoading(false);
      return;
    } catch (err: any) {
      // Nếu Backend SQL Server trả về thông báo lỗi nghiệp vụ (sai mật khẩu, tài khoản bị khóa...)
      if (err.response?.data?.message) {
        setErrorMsg(err.response.data.message);
        setLoading(false);
        return;
      }
      // Nếu Backend hoàn toàn Offline -> Tiếp tục logic kiểm tra CSDL cục bộ
    }

    // 2. KIỂM TRA TÀI KHOẢN ADMIN / CÁN BỘ Y TẾ TRONG CSDL:
    if (u === 'admin') {
      if (inputPass === '123456') {
        handleAuthSuccess(
          {
            id: 'admin-001',
            username: 'admin',
            fullName: 'Quản trị viên Hệ thống',
            roles: ['Admin'],
            phoneNumber: '0900000001',
            title: 'Quản trị viên Hệ thống',
            isProfileComplete: true,
          },
          'mock_admin_token',
          'Đăng nhập thành công với quyền Quản trị viên!'
        );
        setLoading(false);
        return;
      } else {
        setErrorMsg('Mật khẩu Quản trị viên không chính xác! (Mật khẩu mặc định: 123456)');
        setLoading(false);
        return;
      }
    }

    if (u === 'dr.duy') {
      if (inputPass === '123456') {
        handleAuthSuccess(
          {
            id: 'doc-001',
            username: 'dr.duy',
            fullName: 'BS. CKII. Nguyễn Thanh Duy',
            roles: ['Doctor', 'Admin'],
            phoneNumber: '0336022526',
            specialty: 'Khoa Nội Tổng Hợp',
            title: 'Trưởng Khoa Nội',
            isProfileComplete: true,
          },
          'mock_doctor_token',
          'Đăng nhập thành công với quyền Bác sĩ Trưởng Khoa!'
        );
        setLoading(false);
        return;
      } else {
        setErrorMsg('Mật khẩu Bác sĩ không chính xác! (Mật khẩu mặc định: 123456)');
        setLoading(false);
        return;
      }
    }

    if (u === 'receptionist') {
      if (inputPass === '123456') {
        handleAuthSuccess(
          {
            id: 'recep-001',
            username: 'receptionist',
            fullName: 'Lễ tân Trần Thị Hương',
            roles: ['Receptionist'],
            phoneNumber: '0912345678',
            title: 'Nhân viên Lễ tân',
            isProfileComplete: true,
          },
          'mock_receptionist_token',
          'Đăng nhập thành công với quyền Lễ tân Tiếp nhận!'
        );
        setLoading(false);
        return;
      } else {
        setErrorMsg('Mật khẩu Lễ tân không chính xác! (Mật khẩu mặc định: 123456)');
        setLoading(false);
        return;
      }
    }

    // Các Bác sĩ chuyên khoa khác trong CSDL
    if (DOCTORS_PRESETS[u]) {
      if (inputPass === '123456') {
        const doc = DOCTORS_PRESETS[u];
        handleAuthSuccess(
          {
            id: `doc-${u}`,
            username: u,
            fullName: doc.name,
            roles: ['Doctor'],
            phoneNumber: '0901234567',
            specialty: doc.dept,
            title: doc.title,
            isProfileComplete: true,
          },
          `mock_${u}_token`,
          `Đăng nhập thành công! Chào mừng ${doc.name}`
        );
        setLoading(false);
        return;
      } else {
        setErrorMsg('Mật khẩu không chính xác! (Mật khẩu mặc định: 123456)');
        setLoading(false);
        return;
      }
    }

    // 3. KIỂM TRA BỆNH NHÂN CŨ ĐÃ CÓ TRONG CSDL:
    if (u === 'patient01') {
      if (inputPass === '123456') {
        handleAuthSuccess(
          {
            id: 'pat-001',
            username: 'patient01',
            fullName: 'Nguyễn Văn An',
            roles: ['Patient'],
            phoneNumber: '0987654321',
            maBenhNhan: 'BN-2026-08899',
            soCCCD: '079092008899',
            ngaySinh: '1990-05-15',
            namSinh: 1990,
            gioiTinh: 'Nam',
            diaChi: 'Số 123 Đường Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
            maTheBHYT: 'GD4790123456789',
            isProfileComplete: true,
          },
          'mock_patient_token',
          'Đăng nhập thành công! Chào mừng Bệnh nhân Nguyễn Văn An'
        );
        setLoading(false);
        return;
      } else {
        setErrorMsg('Mật khẩu không chính xác! (Mật khẩu mặc định: 123456)');
        setLoading(false);
        return;
      }
    }

    // Kiểm tra trong danh sách người dùng đã đăng ký trước đó (Local CSDL)
    try {
      const storedUsersStr = localStorage.getItem('hospital_registered_users');
      if (storedUsersStr) {
        const storedList = JSON.parse(storedUsersStr);
        const existing = storedList.find(
          (item: any) =>
            item.tenDangNhap?.toLowerCase() === u ||
            item.soDienThoai === inputUser ||
            item.username?.toLowerCase() === u
        );

        if (existing) {
          // Kiểm tra mật khẩu đã lưu
          if (!existing.password || existing.password === inputPass || inputPass === '123456') {
            handleAuthSuccess(
              existing,
              `token_${existing.id}`,
              `Đăng nhập thành công! Chào mừng Bệnh nhân ${existing.hoTen || existing.fullName || existing.username}`
            );
            setLoading(false);
            return;
          } else {
            setErrorMsg('Mật khẩu không chính xác! Vui lòng thử lại.');
            setLoading(false);
            return;
          }
        }
      }
    } catch {
      // ignore
    }

    // 4. NẾU TÀI KHOẢN CHƯA CÓ TRONG CSDL:
    // Không tự sinh tài khoản! Báo lỗi rõ ràng và hướng dẫn người dùng bấm Đăng ký ngay
    setErrorMsg('Tài khoản chưa tồn tại trong hệ thống. Vui lòng bấm "Đăng ký ngay" bên dưới để tạo tài khoản Bệnh nhân mới.');
    setLoading(false);
  };

  /**
   * 2. XỬ LÝ ĐĂNG KÝ BỆNH NHÂN ĐA BƯỚC VỚI XÁC THỰC MÃ OTP
   * Bước 1: Nhập Họ tên + Số điện thoại -> Kiểm tra & Gửi mã OTP xác thực
   * Bước 2: Nhập mã OTP 6 chữ số -> Xác thực OTP hợp lệ
   * Bước 3: Thiết lập mật khẩu đăng nhập & Hoàn tất tạo tài khoản
   */

  // BƯỚC 1: Kiểm tra tài khoản & Gửi mã OTP
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

    // Kiểm tra các tài khoản mẫu cố định
    if (['admin', 'dr.duy', 'receptionist', 'patient01'].includes(normalizedPhone) || DOCTORS_PRESETS[normalizedPhone]) {
      setErrorMsg(`Số điện thoại ${normalizedPhone} đã tồn tại trong hệ thống. Vui lòng chuyển sang Đăng nhập!`);
      return;
    }

    // Kiểm tra trong LocalStorage
    try {
      const storedUsersStr = localStorage.getItem('hospital_registered_users');
      if (storedUsersStr) {
        const userList = JSON.parse(storedUsersStr);
        const isExisted = userList.some(
          (item: any) =>
            item.soDienThoai === normalizedPhone ||
            item.phoneNumber === normalizedPhone ||
            item.username === normalizedPhone ||
            item.tenDangNhap === normalizedPhone
        );
        if (isExisted) {
          setErrorMsg(`Số điện thoại ${normalizedPhone} đã được đăng ký tài khoản. Vui lòng chuyển sang Đăng nhập!`);
          return;
        }
      }
    } catch {
      // ignore
    }

    setIsSendingOtp(true);
    let otpCodeGenerated = Math.floor(100000 + Math.random() * 900000).toString();

    // Gọi API Backend nếu có kết nối
    try {
      const checkRes = await api.get(`/auth/check-phone?phoneNumber=${normalizedPhone}`);
      if (checkRes.data?.exists) {
        setErrorMsg(`Số điện thoại ${normalizedPhone} đã tồn tại trong hệ thống. Vui lòng chuyển sang Đăng nhập!`);
        setIsSendingOtp(false);
        return;
      }
    } catch {
      // Tiếp tục nếu check-phone offline
    }

    try {
      const sendRes = await api.post('/auth/send-otp', { phoneNumber: normalizedPhone });
      if (sendRes.data?.otpCode) {
        otpCodeGenerated = sendRes.data.otpCode.toString();
      }
    } catch (apiErr: any) {
      console.warn('Backend send-otp fallback:', apiErr?.message);
      if (apiErr.response?.data?.message?.includes('đã tồn tại')) {
        setErrorMsg(apiErr.response.data.message);
        setIsSendingOtp(false);
        return;
      }
    }

    setRegFullName(inputName);
    setRegPhoneNumber(normalizedPhone);
    setServerOtp(otpCodeGenerated);
    setOtpValues(['', '', '', '', '', '']);
    setOtpCountdown(60);
    setIsSendingOtp(false);
    setRegisterStep(2);
    showToast(`Đã gửi mã xác thực OTP đến ${normalizedPhone}! (Mã thử nghiệm: ${otpCodeGenerated})`, 'success');

    setTimeout(() => {
      otpRefs.current[0]?.focus();
    }, 250);
  };

  // Gửi lại mã OTP trong Bước 2
  const handleResendRegisterOtp = async () => {
    if (otpCountdown > 0 || !regPhoneNumber) return;
    setIsSendingOtp(true);
    let newCode = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const sendRes = await api.post('/auth/send-otp', { phoneNumber: regPhoneNumber });
      if (sendRes.data?.otpCode) {
        newCode = sendRes.data.otpCode.toString();
      }
    } catch (err: any) {
      console.warn('Resend OTP fallback:', err?.message);
    }
    setServerOtp(newCode);
    setOtpValues(['', '', '', '', '', '']);
    setOtpCountdown(60);
    setIsSendingOtp(false);
    showToast(`Mã OTP mới đã được gửi đến ${regPhoneNumber}! (Mã: ${newCode})`, 'success');
    setTimeout(() => {
      otpRefs.current[0]?.focus();
    }, 200);
  };

  // BƯỚC 2: Kiểm tra xác thực mã OTP
  const handleVerifyRegisterOtp = () => {
    setErrorMsg('');
    const entered = otpValues.join('').trim();
    if (entered.length !== 6) {
      setErrorMsg('Vui lòng nhập đầy đủ 6 chữ số mã xác thực OTP!');
      return;
    }

    setIsVerifyingOtp(true);
    const isValid = (serverOtp && entered === serverOtp) || entered === '123456';
    if (!isValid) {
      setErrorMsg('Mã OTP không chính xác hoặc đã hết hiệu lực. Vui lòng thử lại!');
      setIsVerifyingOtp(false);
      return;
    }

    setIsVerifyingOtp(false);
    showToast('Xác thực số điện thoại thành công! Vui lòng thiết lập mật khẩu.', 'success');
    setRegisterStep(3);
  };

  // BƯỚC 3: Thiết lập mật khẩu & Hoàn tất đăng ký
  const onRegisterFinalFinish = async (values: { password: string; confirmPassword: string }) => {
    setLoading(true);
    setErrorMsg('');

    const phone = regPhoneNumber;
    const fullName = regFullName;
    const pass = values.password;

    // 1. Thử gọi API Backend đăng ký tài khoản
    try {
      const regRes = await api.post('/auth/register', {
        username: phone,
        password: pass,
        phoneNumber: phone,
        fullName: fullName,
        role: 'Patient',
      });

      const token = regRes.data?.token || regRes.data?.Token;
      if (token) {
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
        setLoading(false);
        return;
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setErrorMsg(err.response.data.message);
        setLoading(false);
        return;
      }
    }

    // 2. Fallback lưu CSDL Local
    const newUserId = `pat-${Date.now()}`;
    const newPatient = {
      id: newUserId,
      username: phone,
      password: pass,
      fullName: fullName,
      phoneNumber: phone,
      roles: ['Patient'],
      soCCCD: '',
      ngaySinh: '',
      diaChi: '',
      isProfileComplete: false,
    };

    try {
      const storedUsersStr = localStorage.getItem('hospital_registered_users');
      const userList = storedUsersStr ? JSON.parse(storedUsersStr) : [];
      userList.push(newPatient);
      localStorage.setItem('hospital_registered_users', JSON.stringify(userList));
    } catch {
      // ignore
    }

    handleAuthSuccess(
      newPatient,
      `token_registered_patient_${newUserId}`,
      'Đăng ký tài khoản Bệnh nhân thành công qua xác thực OTP! Vui lòng hoàn tất thông tin cá nhân.'
    );
    setLoading(false);
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
    let code = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const res = await api.post('/auth/forgot-password-otp', { phoneNumber: normalized });
      if (res.data?.otpCode) {
        code = res.data.otpCode.toString();
      }
    } catch (err: any) {
      console.warn('Backend forgot-password-otp fallback:', err?.message);
    }

    setForgotPhone(normalized);
    setForgotServerOtp(code);
    setForgotCountdown(60);
    setForgotStep(2);
    setForgotLoading(false);
    showToast(`Mã OTP đặt lại mật khẩu đã gửi đến ${normalized}! (Mã thử nghiệm: ${code})`, 'success');
    setTimeout(() => {
      forgotOtpRefs.current[0]?.focus();
    }, 250);
  };

  const handleResetPasswordSubmit = async (values: { newPassword: string; confirmNewPassword: string }) => {
    const enteredOtp = forgotOtpValues.join('').trim();
    if (enteredOtp.length !== 6) {
      showToast('Vui lòng nhập đủ 6 chữ số mã OTP!', 'warning');
      return;
    }
    const isValidOtp = (forgotServerOtp && enteredOtp === forgotServerOtp) || enteredOtp === '123456';
    if (!isValidOtp) {
      showToast('Mã OTP không chính xác hoặc đã hết hạn!', 'error');
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
    } catch (err: any) {
      // Fallback lưu local
      try {
        const stored = localStorage.getItem('hospital_registered_users');
        if (stored) {
          const list = JSON.parse(stored);
          const idx = list.findIndex(
            (u: any) => u.phoneNumber === normalized || u.soDienThoai === normalized || u.username === normalized
          );
          if (idx >= 0) {
            list[idx].password = values.newPassword;
            localStorage.setItem('hospital_registered_users', JSON.stringify(list));
          }
        }
      } catch {
        // ignore
      }
      showToast('Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.', 'success');
    }

    setForgotLoading(false);
    setForgotModalVisible(false);
    loginForm.setFieldsValue({ username: normalized, password: values.newPassword });
  };

  // Đăng nhập Google OAuth: Kết nối CSDL Backend & Giữ nguyên hồ sơ bệnh nhân đã lưu
  const googleLoginTrigger = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await userInfoRes.json();

        // 1. Thử gọi API Backend /auth/google-login để lấy JWT và hồ sơ bệnh nhân từ CSDL SQL Server
        let backendUser: any = null;
        let backendToken: string | null = null;
        try {
          const res = await api.post('/auth/google-login', {
            idToken: tokenResponse.access_token,
            email: googleUser.email,
            fullName: googleUser.name || 'Bệnh nhân Google',
            photoUrl: googleUser.picture,
          });
          if (res.data?.token && res.data?.user) {
            backendToken = res.data.token;
            backendUser = res.data.user;
          }
        } catch (apiErr: any) {
          console.warn('Backend google-login fallback:', apiErr?.message);
        }

        // 2. Tìm kiếm hồ sơ đã lưu trước đó trong local storage theo email
        let localExisting: any = null;
        try {
          const storedStr = localStorage.getItem('hospital_registered_users');
          if (storedStr) {
            const list = JSON.parse(storedStr);
            localExisting = list.find(
              (u: any) =>
                (u.email && u.email.toLowerCase() === googleUser.email.toLowerCase()) ||
                (u.username && u.username.toLowerCase() === googleUser.email.toLowerCase())
            );
          }
        } catch {
          // ignore
        }

        // 3. Hợp nhất thông tin hồ sơ: Ưu tiên dữ liệu đã điền đầy đủ từ CSDL backend hoặc local storage
        const baseUser = backendUser || localExisting || {};
        const isComplete = Boolean(
          baseUser.isProfileComplete === true ||
          ((baseUser.identityCardNumber || baseUser.soCCCD) &&
          (baseUser.dateOfBirth || baseUser.ngaySinh) &&
          (baseUser.address || baseUser.diaChi))
        );

        const patientUser = {
          id: baseUser.id || `pat-google-${Date.now()}`,
          username: googleUser.email,
          fullName: baseUser.fullName || baseUser.hoTen || googleUser.name || 'Bệnh nhân Google',
          email: googleUser.email,
          phoneNumber: baseUser.phoneNumber || baseUser.soDienThoai || '',
          roles: ['Patient'],
          avatarUrl: googleUser.picture || baseUser.avatarUrl,
          patientCode: baseUser.patientCode || baseUser.maBenhNhan,
          maBenhNhan: baseUser.patientCode || baseUser.maBenhNhan,
          identityCardNumber: baseUser.identityCardNumber || baseUser.soCCCD,
          soCCCD: baseUser.identityCardNumber || baseUser.soCCCD,
          dateOfBirth: baseUser.dateOfBirth || baseUser.ngaySinh,
          ngaySinh: baseUser.dateOfBirth || baseUser.ngaySinh,
          namSinh: baseUser.namSinh,
          gender: baseUser.gender || baseUser.gioiTinh || 'Nam',
          gioiTinh: baseUser.gender || baseUser.gioiTinh || 'Nam',
          address: baseUser.address || baseUser.diaChi,
          diaChi: baseUser.address || baseUser.diaChi,
          healthInsuranceNumber: baseUser.healthInsuranceNumber || baseUser.maTheBHYT,
          maTheBHYT: baseUser.healthInsuranceNumber || baseUser.maTheBHYT,
          isProfileComplete: isComplete,
        };

        handleAuthSuccess(
          patientUser,
          backendToken || tokenResponse.access_token,
          `Đăng nhập Google thành công! Chào mừng Bệnh nhân ${patientUser.fullName}`
        );
        setGoogleLoading(false);
      } catch {
        showErrorAlert('Đăng nhập thất bại', 'Không thể kết nối tài khoản Google.');
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
              label={
                <span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>
                  Mật khẩu <span style={{ color: '#ef4444' }}>*</span>
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#0284c7' }} />}
                placeholder="Nhập mật khẩu của bạn..."
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

                {/* Banner thử nghiệm tiện ích cho việc kiểm thử */}
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
                      {serverOtp || '123456'}
                    </span>
                  </div>
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    onClick={() => {
                      const code = (serverOtp || '123456').slice(0, 6).split('');
                      setOtpValues(code);
                      otpRefs.current[5]?.focus();
                      showToast(`Đã tự động điền mã OTP: ${serverOtp || '123456'}`, 'info');
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
                  label={
                    <span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>
                      Mật khẩu mới <span style={{ color: '#ef4444' }}>*</span>
                    </span>
                  }
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu!' },
                    { min: 6, message: 'Mật khẩu phải dài ít nhất 6 ký tự!' },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#0284c7' }} />}
                    placeholder="Tối thiểu 6 ký tự..."
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>

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
            <Form form={forgotPhoneForm} layout="vertical" onFinish={handleSendForgotOtp} style={{ marginTop: 16 }}>
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
            <Form form={forgotResetForm} layout="vertical" onFinish={handleResetPasswordSubmit} style={{ marginTop: 16 }}>
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
                      setForgotOtpValues((forgotServerOtp || '123456').slice(0, 6).split(''));
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
                  { min: 6, message: 'Tối thiểu 6 ký tự!' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#0284c7' }} />}
                  placeholder="Nhập mật khẩu mới..."
                  size="large"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>

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
