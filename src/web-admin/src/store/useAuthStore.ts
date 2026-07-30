import { create } from 'zustand';
import { UserAccount } from '../types';

interface AuthState {
  user: UserAccount | null;
  token: string | null;
  setAuth: (user: UserAccount, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));
