import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Checkbox, Typography, Alert, Divider } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import {
  UserOutlined,
  LockOutlined,
  ArrowLeftOutlined,
  LoginOutlined,
  UserAddOutlined,
  PhoneOutlined,
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
  const [registerForm] = Form.useForm();

  const setAuth = useAuthStore((state) => state.setAuth);
  const { isDarkMode } = useThemeStore();

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

    setAuth(authUser, token);

    // Đồng bộ vào Local Storage cho đăng nhập sau
    try {
      const storedUsersStr = localStorage.getItem('hospital_registered_users');
      const userList = storedUsersStr ? JSON.parse(storedUsersStr) : [];
      const idx = userList.findIndex(
        (item: any) =>
          item.username === authUser.tenDangNhap ||
          item.tenDangNhap === authUser.tenDangNhap ||
          item.soDienThoai === authUser.soDienThoai ||
          item.id === authUser.id
      );
      if (idx >= 0) {
        userList[idx] = { ...userList[idx], ...authUser };
      } else {
        userList.push(authUser);
      }
      localStorage.setItem('hospital_registered_users', JSON.stringify(userList));
    } catch {
      // ignore
    }

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
   * 2. XỬ LÝ ĐĂNG KÝ (Register - Dành cho Bệnh nhân mới):
   * - Người dùng tự nhập Tên đăng nhập / Số điện thoại và Mật khẩu của họ.
   * - Tự động gán quyền Bệnh nhân (role: 'Patient').
   * - Đăng ký xong là vào thẳng Cổng Đặt Khám (/booking).
   * - Khi vào trong /booking, vì chưa có CCCD, Ngày sinh, Địa chỉ -> Modal BẮT BUỘC NHẬP THÔNG TIN sẽ mở lên!
   */
  const onRegisterFinish = async (values: {
    username: string;
    password: string;
    confirmPassword: string;
  }) => {
    setLoading(true);
    setErrorMsg('');

    const inputUser = values.username.trim();
    const inputPass = values.password;
    const u = inputUser.toLowerCase();

    // 1. Kiểm tra xem tài khoản đã tồn tại trong CSDL chưa
    if (['admin', 'dr.duy', 'receptionist', 'patient01'].includes(u) || DOCTORS_PRESETS[u]) {
      setErrorMsg('Tài khoản hoặc số điện thoại này đã tồn tại trong hệ thống. Vui lòng chuyển sang Đăng nhập!');
      setLoading(false);
      return;
    }

    const storedUsersStr = localStorage.getItem('hospital_registered_users');
    const userList = storedUsersStr ? JSON.parse(storedUsersStr) : [];
    const isExisted = userList.some(
      (item: any) =>
        item.tenDangNhap?.toLowerCase() === u ||
        item.soDienThoai === inputUser ||
        item.username?.toLowerCase() === u
    );

    if (isExisted) {
      setErrorMsg('Số điện thoại hoặc tên đăng nhập này đã được đăng ký. Vui lòng chuyển sang Đăng nhập!');
      setLoading(false);
      return;
    }

    // 2. Thử gọi API Backend nếu Server đang chạy
    try {
      const isPhone = /^[0-9]{10}$/.test(inputUser);
      const regRes = await api.post('/auth/register', {
        username: inputUser,
        password: inputPass,
        phoneNumber: isPhone ? inputUser : '',
        fullName: isPhone ? `Bệnh nhân (${inputUser})` : inputUser,
        role: 'Patient', // Cố định vai trò Bệnh nhân
      });

      const token = regRes.data?.token || regRes.data?.Token;
      if (token) {
        handleAuthSuccess(
          {
            id: regRes.data.id,
            username: regRes.data.username || inputUser,
            fullName: regRes.data.fullName || inputUser,
            phoneNumber: regRes.data.phoneNumber || inputUser,
            roles: ['Patient'],
            patientCode: regRes.data.patientCode,
            identityCardNumber: regRes.data.identityCardNumber,
            isProfileComplete: false, // Chưa có hồ sơ định danh
          },
          token,
          'Đăng ký tài khoản Bệnh nhân thành công vào CSDL Bệnh viện! Vui lòng hoàn tất thông tin cá nhân.'
        );
        setLoading(false);
        return;
      }
    } catch (err: any) {
      // Hiển thị trực tiếp thông báo lỗi từ SQL Server (ví dụ: Số điện thoại đã tồn tại, mật khẩu quá ngắn...)
      if (err.response?.data?.message) {
        setErrorMsg(err.response.data.message);
        setLoading(false);
        return;
      }
      // Fallback lưu local CSDL nếu Backend offline
    }

    // 3. Lưu tài khoản Bệnh nhân mới vào CSDL Local
    const isPhone = /^[0-9]{10}$/.test(inputUser);
    const newUserId = `pat-${Date.now()}`;
    const newPatient = {
      id: newUserId,
      username: inputUser,
      password: inputPass,
      fullName: isPhone ? `Bệnh nhân (${inputUser})` : inputUser,
      phoneNumber: isPhone ? inputUser : '',
      roles: ['Patient'], // MẶC ĐỊNH LÀ BỆNH NHÂN
      // Chưa có thông tin cá nhân -> Vào trong /booking sẽ bắt buộc nhập
      soCCCD: '',
      ngaySinh: '',
      diaChi: '',
      isProfileComplete: false,
    };

    userList.push(newPatient);
    localStorage.setItem('hospital_registered_users', JSON.stringify(userList));

    // Đăng ký xong là vào thẳng trang Đặt lịch khám (/booking)
    handleAuthSuccess(
      newPatient,
      `token_registered_patient_${newUserId}`,
      'Đăng ký tài khoản Bệnh nhân thành công! Vui lòng hoàn tất thông tin cá nhân để bắt đầu đặt khám.'
    );
    setLoading(false);
  };

  // Đăng nhập Google OAuth: Tự động gán quyền Bệnh nhân
  const googleLoginTrigger = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await userInfoRes.json();

        const newPatient = {
          id: `pat-google-${Date.now()}`,
          username: googleUser.email,
          fullName: googleUser.name || 'Bệnh nhân Google',
          email: googleUser.email,
          phoneNumber: '',
          roles: ['Patient'],
          avatarUrl: googleUser.picture,
          isProfileComplete: false,
        };

        handleAuthSuccess(
          newPatient,
          tokenResponse.access_token,
          `Đăng nhập Google thành công! Chào mừng Bệnh nhân ${googleUser.name}`
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
                onClick={() =>
                  showToast('Vui lòng liên hệ Hotline 1900 6868 hoặc Quầy tiếp nhận để đặt lại mật khẩu.', 'info')
                }
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
                  }}
                >
                  Đăng ký ngay tại đây
                </a>
              </Text>
            </div>
          </Form>
        )}

        {/* ================= 2. FORM ĐĂNG KÝ BỆNH NHÂN ================= */}
        {authMode === 'register' && (
          <Form
            form={registerForm}
            name="unified_register"
            onFinish={onRegisterFinish}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="username"
              label={
                <span style={{ fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#334155' }}>
                  Số điện thoại hoặc Tên đăng nhập <span style={{ color: '#ef4444' }}>*</span>
                </span>
              }
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại hoặc tên đăng nhập!' },
                { min: 4, message: 'Tối thiểu 4 ký tự!' },
              ]}
            >
              <Input
                prefix={<PhoneOutlined style={{ color: '#0284c7' }} />}
                placeholder="Nhập số điện thoại của bạn (VD: 0912345678)..."
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
              🔒 <strong>Bảo mật thông tin:</strong> Tài khoản được đồng bộ và bảo mật theo Tiêu chuẩn An toàn Dữ liệu Y tế Quốc gia & Đề án 06/CP.
            </div>

            <Form.Item style={{ marginBottom: 14 }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                icon={<UserAddOutlined />}
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

            {/* Chuyển lại form Đăng nhập */}
            <div style={{ textAlign: 'center', margin: '14px 0 6px' }}>
              <Text style={{ fontSize: 13.5, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                Đã có tài khoản?{' '}
                <a
                  style={{ color: '#0284c7', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => {
                    setErrorMsg('');
                    setAuthMode('login');
                  }}
                >
                  Đăng nhập ngay
                </a>
              </Text>
            </div>
          </Form>
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
