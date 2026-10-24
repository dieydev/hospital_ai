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
        const isStaffOrAdmin = rawRoles.some((r: string) =>
          ['Admin', 'Doctor', 'Nurse', 'Receptionist'].includes(r)
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

        const rawFullName = raw.fullName || currentUser?.hoTen || '';
        let resolvedFullName = rawFullName;
        if (!resolvedFullName || resolvedFullName === 'Bệnh nhân' || resolvedFullName.startsWith('Bệnh nhân 09') || resolvedFullName.includes('nh\uFFFD') || resolvedFullName.includes('?')) {
          if (currentUser?.hoTen && currentUser.hoTen !== 'Bệnh nhân' && !currentUser.hoTen.startsWith('Bệnh nhân 09')) {
            resolvedFullName = currentUser.hoTen;
          } else if (finalRoles.includes('Admin')) {
            resolvedFullName = 'Quản trị viên Hệ thống';
          } else if (finalRoles.includes('Receptionist')) {
            resolvedFullName = 'Nhân viên Lễ tân';
          } else if (finalRoles.includes('Doctor')) {
            resolvedFullName = raw.title || 'BS. CKII. Nguyễn Thanh Duy';
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
