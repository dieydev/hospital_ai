import { create } from 'zustand';
import { UserAccount } from '../types';

interface AuthState {
  user: UserAccount | null;
  token: string | null;
  setAuth: (user: UserAccount, token: string) => void;
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
  chucDanh: 'Bác sĩ Điều trị',
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
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));
