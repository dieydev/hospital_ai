import React, { useState, useEffect } from 'react';
import { Tooltip } from 'antd';
import { PhoneFilled, CheckCircleFilled } from '@ant-design/icons';
import { showToast } from '../utils/sweetAlert';

export const ELDERLY_MODE_STORAGE_KEY = 'dmedical_elderly_mode';

export const ElderlyModeWidget: React.FC = () => {
  const [isElderlyMode, setIsElderlyMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ELDERLY_MODE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Đồng bộ class trên document.body khi state thay đổi
  useEffect(() => {
    try {
      if (isElderlyMode) {
        document.body.classList.add('elderly-mode');
        localStorage.setItem(ELDERLY_MODE_STORAGE_KEY, 'true');
      } else {
        document.body.classList.remove('elderly-mode');
        localStorage.setItem(ELDERLY_MODE_STORAGE_KEY, 'false');
      }
    } catch {
      // ignore
    }
  }, [isElderlyMode]);

  // Lắng nghe sự kiện custom nếu header hoặc drawer thay đổi trạng thái
  useEffect(() => {
    const handleStorageChange = () => {
      const active = localStorage.getItem(ELDERLY_MODE_STORAGE_KEY) === 'true';
      setIsElderlyMode(active);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dmedical_elderly_mode_change', handleStorageChange as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dmedical_elderly_mode_change', handleStorageChange as EventListener);
    };
  }, []);

  const toggleElderlyMode = () => {
    const nextState = !isElderlyMode;
    setIsElderlyMode(nextState);
    if (nextState) {
      showToast('Đã BẬT Chế độ Chữ To & Dễ Đọc dành cho Người Cao Tuổi!', 'success');
    } else {
      showToast('Đã chuyển về Giao diện Tiêu chuẩn.', 'info');
    }
    // Phát event cho các component khác cùng đồng bộ
    window.dispatchEvent(new CustomEvent('dmedical_elderly_mode_change', { detail: nextState }));
  };

  return (
    <aside aria-label="Hỗ trợ trợ năng người cao tuổi" className="elderly-floating-widget-wrap">
      {/* Nút Chuyển Đổi Chế Độ Chữ To Cho Người Cao Tuổi */}
      <Tooltip
        title={
          isElderlyMode
            ? 'Nhấp để trở về Giao diện chữ Tiêu chuẩn'
            : 'Nhấp để bật Chế độ Chữ To, Độ tương phản cao & Nút bấm lớn dành cho Người cao tuổi'
        }
        placement="right"
      >
        <button
          type="button"
          className={`elderly-floating-toggle-btn ${isElderlyMode ? 'active' : ''}`}
          onClick={toggleElderlyMode}
          aria-label="Bật tắt chế độ chữ to cho người cao tuổi"
        >
          <span className="elderly-btn-icon">
            {isElderlyMode ? (
              <span style={{ fontSize: 18, fontWeight: 900 }}>A<span style={{ fontSize: 13 }}>-</span></span>
            ) : (
              <span style={{ fontSize: 18, fontWeight: 900 }}>A<span style={{ fontSize: 13 }}>+</span></span>
            )}
          </span>
          <span className="elderly-btn-text">
            {isElderlyMode ? 'Đang bật Chữ To' : 'Chữ To Dễ Đọc'}
          </span>
          {isElderlyMode && <CheckCircleFilled className="elderly-active-dot" />}
        </button>
      </Tooltip>

      {/* Nút Gọi Cấp Cứu Nhanh 1-Chạm 1900 1150 */}
      <a
        href="tel:19001150"
        className="elderly-floating-call-btn"
        title="Bấm để gọi ngay Tổng đài Cấp cứu & Đặt lịch: 1900 1150 (Miễn phí)"
      >
        <PhoneFilled style={{ fontSize: 18 }} />
        <span className="elderly-call-text">1900 1150</span>
      </a>
    </aside>
  );
};
