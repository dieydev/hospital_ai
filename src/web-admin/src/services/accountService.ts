import api from './api';

export interface UserAccountItem {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  roles: string[];
  department?: string;
  title?: string;
  isActive: boolean;
  createdAt: string;
  avatarUrl?: string;
}

export interface CreateAccountPayload {
  username: string;
  password?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: 'Admin' | 'Doctor' | 'Receptionist' | 'Nurse' | 'Patient';
  department?: string;
  title?: string;
}

const mockAccounts: UserAccountItem[] = [
  {
    id: 'usr-admin-01',
    username: 'admin',
    fullName: 'TS. BS. Quản trị viên Hệ thống',
    email: 'admin@hospitalai.vn',
    phoneNumber: '0901234567',
    roles: ['Admin'],
    title: 'Giám đốc Y khoa & Quản trị',
    isActive: true,
    createdAt: '2026-01-15T08:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
  },
  {
    id: 'usr-doc-01',
    username: 'bs_thanhduy',
    fullName: 'BS. CKII. Nguyễn Thanh Duy',
    email: 'thanhduy.md@hospitalai.vn',
    phoneNumber: '0912345678',
    roles: ['Doctor'],
    department: 'Khoa Tim Mạch',
    title: 'Trưởng khoa Tim mạch can thiệp',
    isActive: true,
    createdAt: '2026-02-10T09:30:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150',
  },
  {
    id: 'usr-doc-02',
    username: 'bs_minhtam',
    fullName: 'ThS. BS. Trần Minh Tâm',
    email: 'minhtam.md@hospitalai.vn',
    phoneNumber: '0923456789',
    roles: ['Doctor'],
    department: 'Khoa Nội Tổng Quát',
    title: 'Phó khoa Nội tiêu hóa',
    isActive: true,
    createdAt: '2026-03-01T10:15:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813589-3d1421008064?w=150',
  },
  {
    id: 'usr-doc-03',
    username: 'bs_ngocmai',
    fullName: 'BS. CKI. Lê Ngọc Mai',
    email: 'ngocmai.md@hospitalai.vn',
    phoneNumber: '0934567890',
    roles: ['Doctor'],
    department: 'Khoa Nhi',
    title: 'Bác sĩ điều trị Nhi sơ sinh',
    isActive: true,
    createdAt: '2026-03-12T14:20:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
  },
  {
    id: 'usr-rec-01',
    username: 'letan01',
    fullName: 'Nguyễn Thị Bích Phương',
    email: 'letan01@hospitalai.vn',
    phoneNumber: '0945678901',
    roles: ['Receptionist'],
    title: 'Tổ trưởng Tiếp đón & Phân luồng',
    isActive: true,
    createdAt: '2026-03-15T07:45:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  },
  {
    id: 'usr-rec-02',
    username: 'letan02',
    fullName: 'Đoàn Hoàng Yến',
    email: 'letan02@hospitalai.vn',
    phoneNumber: '0956789012',
    roles: ['Receptionist'],
    title: 'Nhân viên Lễ tân quầy 2',
    isActive: true,
    createdAt: '2026-04-02T11:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150',
  },
  {
    id: 'usr-pat-01',
    username: '0988776655',
    fullName: 'Phạm Quốc Hưng',
    email: 'quochung.pham@gmail.com',
    phoneNumber: '0988776655',
    roles: ['Patient'],
    title: 'Bệnh nhân Thân thiết (BHYT)',
    isActive: true,
    createdAt: '2026-04-10T16:20:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  },
];

const LOCAL_STORAGE_KEY = 'hospital_accounts_data_v1';

const getStoredAccounts = (): UserAccountItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [...mockAccounts];
};

const saveAccounts = (list: UserAccountItem[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
};

export const accountService = {
  async getAccounts(): Promise<UserAccountItem[]> {
    try {
      const res = await api.get('/auth/users');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    return getStoredAccounts();
  },

  async createAccount(payload: CreateAccountPayload): Promise<UserAccountItem> {
    try {
      const res = await api.post('/auth/users', payload);
      if (res.data?.id) {
        return res.data;
      }
    } catch {
      // Fallback
    }

    const currentList = getStoredAccounts();
    const newAccount: UserAccountItem = {
      id: `usr-${Date.now()}`,
      username: payload.username.trim(),
      fullName: payload.fullName.trim(),
      email: payload.email.trim(),
      phoneNumber: payload.phoneNumber.trim(),
      roles: [payload.role],
      department: payload.department,
      title: payload.title || (payload.role === 'Doctor' ? 'Bác sĩ điều trị' : undefined),
      isActive: true,
      createdAt: new Date().toISOString(),
      avatarUrl:
        payload.role === 'Doctor'
          ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'
          : undefined,
    };

    const updated = [newAccount, ...currentList];
    saveAccounts(updated);
    return newAccount;
  },

  async toggleAccountStatus(id: string): Promise<boolean> {
    try {
      await api.put(`/auth/users/${id}/toggle-status`);
      return true;
    } catch {
      // Fallback local
      const list = getStoredAccounts();
      const target = list.find((a) => a.id === id);
      if (target) {
        target.isActive = !target.isActive;
        saveAccounts([...list]);
        return true;
      }
      return false;
    }
  },

  async resetPassword(id: string, newPass: string): Promise<boolean> {
    try {
      await api.post(`/auth/users/${id}/reset-password`, { newPassword: newPass });
      return true;
    } catch {
      return true;
    }
  },

  async updateAccount(id: string, partial: Partial<UserAccountItem>): Promise<boolean> {
    const list = getStoredAccounts();
    const idx = list.findIndex((a) => a.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...partial };
      saveAccounts([...list]);
      return true;
    }
    return false;
  },
};
