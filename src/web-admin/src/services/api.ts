import axios from 'axios';
import { showToast } from '../utils/sweetAlert';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'),
  headers: {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Bẫy lỗi Mất mạng / Timeout / Máy chủ không phản hồi
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        showToast('Kết nối quá thời gian chờ (Timeout). Vui lòng thử lại!', 'warning');
      } else if (error.message !== 'canceled') {
        showToast('Không thể kết nối đến máy chủ Bệnh viện. Vui lòng kiểm tra mạng!', 'error');
      }
      return Promise.reject(error);
    }

    const { status, data, config } = error.response;
    const url = config?.url || '';

    // 2. Bẫy lỗi 401 Hết hạn phiên đăng nhập
    if (status === 401) {
      if (!url.includes('/auth/me') && !url.includes('/auth/complete-profile') && !url.includes('/auth/google-login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showToast('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', 'warning');
      }
    }
    // 3. Bẫy lỗi 403 Không có quyền hạn
    else if (status === 403) {
      showToast('Bạn không có quyền thực hiện thao tác này (403 Forbidden).', 'warning');
    }
    // 4. Bẫy lỗi 500 Lỗi máy chủ nội bộ
    else if (status >= 500) {
      const serverMsg = typeof data === 'string' ? data : data?.message;
      showToast(serverMsg || 'Máy chủ gặp sự cố xử lý (500). Vui lòng thử lại sau!', 'error');
    }

    return Promise.reject(error);
  }
);

export default api;

