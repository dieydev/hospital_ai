import { create } from 'zustand';
import { UserAccount } from '../types';

interface AuthState {
  user: UserAccount | null;
  token: string | null;
  setAuth: (user: UserAccount, token: string) => void;
  updateUser: (partialUser: Partial<UserAccount>) => void;
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

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  token: localStorage.getItem('token') || null,
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
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
}));
