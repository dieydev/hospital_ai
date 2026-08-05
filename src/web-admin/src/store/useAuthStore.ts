import { create } from 'zustand';
import { UserAccount } from '../types';

interface AuthState {
  user: UserAccount | null;
  token: string | null;
  setAuth: (user: UserAccount, token: string) => void;
  updateUser: (partialUser: Partial<UserAccount>) => void;
  logout: () => void;
}

const defaultMockUser: UserAccount = {
  id: 'usr-001',
  tenDangNhap: 'dr.duy',
  hoTen: 'BS. CKII. Nguyễn Thanh Duy',
  email: 'thanhduy.md@hospital-ai.vn',
  soDienThoai: '0336022526',
  vaiTro: ['Doctor', 'Admin'],
  chuyenKhoa: 'Khoa Nội Tổng hợp',
  chucDanh: 'Trưởng Khoa Nội',
  trangThaiKichHoat: true,
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DuyDoctor',
};

export const useAuthStore = create<AuthState>((set) => ({
  user: defaultMockUser,
  token: localStorage.getItem('token') || 'mock-jwt-token-2026',
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token });
  },
  updateUser: (partialUser) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...partialUser } : null,
    }));
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));
