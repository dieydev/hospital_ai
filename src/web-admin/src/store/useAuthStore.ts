import { create } from 'zustand';
import { UserAccount, UserRole } from '../types';
import api from '../services/api';
import dayjs from 'dayjs';

interface AuthState {
  user: UserAccount | null;
  token: string | null;
  isSyncing: boolean;
  setAuth: (user: UserAccount, token: string) => void;
  updateUser: (partialUser: Partial<UserAccount>) => void;
  syncCurrentUser: () => Promise<UserAccount | null>;
  logout: () => void;
}

const getInitialUser = (): UserAccount | null => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getInitialUser(),
  token: localStorage.getItem('token') || null,
  isSyncing: false,
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token });
  },
  updateUser: (partialUser) => {
    set((state) => {
      const newUser = state.user ? { ...state.user, ...partialUser } : null;
      if (newUser) localStorage.setItem('user', JSON.stringify(newUser));
      return { user: newUser };
    });
  },
  syncCurrentUser: async () => {
    const token = get().token || localStorage.getItem('token');
    if (!token) return null;

    try {
      set({ isSyncing: true });
      const res = await api.get('/auth/me');
      if (res.data) {
        const raw = res.data;
        const currentUser = get().user;

        const rawRoles: string[] = raw.roles || raw.vaiTro || currentUser?.vaiTro || [];
        const STAFF_ROLES_LOWER = [
          'admin', 'doctor', 'receptionist', 'triage', 'pharmacy', 'nurse', 'cashier',
          'quản trị viên', 'bác sĩ', 'nhân viên tiếp nhận', 'nhân viên sàng lọc bệnh', 'nhà thuốc', 'y tế', 'thu ngân'
        ];
        const isStaffOrAdmin = rawRoles.some((r: string) =>
          STAFF_ROLES_LOWER.includes(r.toLowerCase())
        );
        const finalRoles: UserRole[] = isStaffOrAdmin ? (rawRoles as UserRole[]) : ['Patient'];

        const dob = raw.dateOfBirth || raw.ngaySinh || currentUser?.ngaySinh;
        const birthYear = raw.dateOfBirth ? dayjs(raw.dateOfBirth).year() : (currentUser?.namSinh || undefined);
        const formattedDob = dob ? dayjs(dob).format('YYYY-MM-DD') : undefined;

        const rawCccd = raw.identityCardNumber || raw.soCCCD;
        const isRawCccdDummy = !rawCccd || rawCccd.startsWith('P') || rawCccd.startsWith('CD') || rawCccd === '0900000000';
        const cccd = !isRawCccdDummy ? rawCccd : (currentUser?.soCCCD || '');

        const rawPhone = raw.phoneNumber || raw.soDienThoai;
        const isRawPhoneDummy = !rawPhone || rawPhone === '0900000000';
        const phone = !isRawPhoneDummy ? rawPhone : (currentUser?.soDienThoai || '');

        const rawAddress = raw.address || raw.diaChi;
        const isRawAddressDummy = !rawAddress || rawAddress === 'Chưa cập nhật';
        const address = !isRawAddressDummy ? rawAddress : (currentUser?.diaChi || '');

        const isAddressValid = Boolean(address && address.trim().length >= 5 && address.trim() !== 'Chưa cập nhật');
        const isCccdValid = Boolean(cccd && cccd.trim().length >= 9 && !cccd.startsWith('CD') && !cccd.startsWith('P') && cccd !== '0900000000');

        const isProfileComplete = Boolean(
          isStaffOrAdmin ||
          raw.isProfileComplete === true ||
          currentUser?.isProfileComplete === true ||
          (isCccdValid && (formattedDob || birthYear) && isAddressValid)
        );

        const hasRole = (roleKey: string) => finalRoles.some((r: string) => r.toLowerCase() === roleKey.toLowerCase());

        const rawFullName = raw.fullName || currentUser?.hoTen || '';
        let resolvedFullName = rawFullName;
        if (!resolvedFullName || resolvedFullName === 'Bệnh nhân' || resolvedFullName.startsWith('Bệnh nhân 09') || resolvedFullName.includes('nh\uFFFD') || resolvedFullName.includes('?')) {
          if (currentUser?.hoTen && currentUser.hoTen !== 'Bệnh nhân' && !currentUser.hoTen.startsWith('Bệnh nhân 09')) {
            resolvedFullName = currentUser.hoTen;
          } else if (hasRole('Admin') || hasRole('Quản trị viên')) {
            resolvedFullName = 'Quản trị viên Hệ thống';
          } else if (hasRole('Doctor') || hasRole('Bác sĩ')) {
            resolvedFullName = raw.title || 'BS. CKII. Nguyễn Thanh Duy';
          } else if (hasRole('Receptionist') || hasRole('Nhân viên tiếp nhận')) {
            resolvedFullName = 'Nhân viên Tiếp nhận';
          } else if (hasRole('Triage') || hasRole('Nhân viên sàng lọc bệnh')) {
            resolvedFullName = 'Nhân viên Sàng lọc bệnh';
          } else if (hasRole('Pharmacy') || hasRole('Nhà thuốc')) {
            resolvedFullName = 'Dược sĩ Nhà thuốc BV';
          } else if (hasRole('Nurse') || hasRole('Y tế')) {
            resolvedFullName = 'Cán bộ Y tế / Điều dưỡng';
          } else if (hasRole('Cashier') || hasRole('Thu ngân')) {
            resolvedFullName = 'Thu ngân Viện phí';
          } else {
            resolvedFullName = isStaffOrAdmin ? 'Cán bộ Y tế' : 'Bệnh nhân';
          }
        }

        const syncedUser: UserAccount = {
          id: raw.id || currentUser?.id || `pat-${Date.now()}`,
          tenDangNhap: raw.username || currentUser?.tenDangNhap || phone || '',
          hoTen: resolvedFullName,
          email: raw.email || currentUser?.email || '',
          soDienThoai: phone,
          vaiTro: finalRoles,
          chuyenKhoa: raw.specialty || currentUser?.chuyenKhoa,
          chucDanh: raw.title || currentUser?.chucDanh,
          trangThaiKichHoat: true,
          avatarUrl: raw.avatarUrl || currentUser?.avatarUrl,
          maBenhNhan: raw.patientCode || raw.maBenhNhan || currentUser?.maBenhNhan,
          soCCCD: cccd,
          ngaySinh: formattedDob,
          namSinh: birthYear,
          gioiTinh: (raw.gender === 'Female' || raw.gender === 'Nữ' || currentUser?.gioiTinh === 'Nữ') ? 'Nữ' : 'Nam',
          diaChi: address,
          maTheBHYT: raw.healthInsuranceNumber || raw.maTheBHYT || currentUser?.maTheBHYT || '',
          tienSuBenh: currentUser?.tienSuBenh || '',
          diUngThuoc: currentUser?.diUngThuoc || '',
          isProfileComplete: isProfileComplete,
        };

        localStorage.setItem('user', JSON.stringify(syncedUser));
        set({ user: syncedUser, isSyncing: false });
        return syncedUser;
      }
    } catch {
      // Backend offline hoặc token hết hạn -> giữ nguyên user hiện tại
    } finally {
      set({ isSyncing: false });
    }
    return get().user;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
}));
