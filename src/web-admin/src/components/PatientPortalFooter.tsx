import React from 'react';
import { Row, Col, Divider } from 'antd';
import {
  PhoneFilled,
  EnvironmentOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export const PatientPortalFooter: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="hospital-portal-footer">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Row gutter={[32, 32]}>
          <Col xs={24} md={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <img
                src="/logo_white.png"
                alt="D-Medical Hospital"
                style={{ height: 44, objectFit: 'contain' }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <div style={{ color: '#ffffff', fontWeight: 900, fontSize: 16, letterSpacing: -0.3 }}>
                  BỆNH VIỆN ĐA KHOA D-MEDICAL
                </div>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>
                  Trung Tâm Y Tế Kỹ Thuật Cao & Chuyển Đổi Số
                </div>
              </div>
            </div>
            <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
              Tiên phong ứng dụng AI và công nghệ y tế số trong khám chữa bệnh, mang lại trải nghiệm
              thăm khám thông minh, an toàn, chuẩn xác và tận tâm cho mọi người bệnh.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span className="footer-cert-badge">
                Giấy phép BYT: 0864/BYT-GPHĐ
              </span>
              <span className="footer-cert-badge">
                Tiêu chuẩn ISO 9001:2015
              </span>
            </div>
          </Col>

          <Col xs={24} sm={12} md={5}>
            <div style={{ color: '#ffffff', fontWeight: 800, fontSize: 14, marginBottom: 14, textTransform: 'uppercase' }}>
              Dịch Vụ Y Tế
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 2.1, fontSize: 13 }}>
              <li>
                <a onClick={() => navigate('/chuyen-khoa')} style={{ cursor: 'pointer' }}>
                  Khám Chuyên Khoa
                </a>
              </li>
              <li>
                <a onClick={() => navigate('/bac-si')} style={{ cursor: 'pointer' }}>
                  Bác Sĩ Chuyên Gia
                </a>
              </li>
              <li>
                <a onClick={() => navigate('/goi-kham')} style={{ cursor: 'pointer' }}>
                  Gói Tầm Soát Sức Khỏe
                </a>
              </li>
              <li>
                <a onClick={() => navigate('/huong-dan')} style={{ cursor: 'pointer' }}>
                  Khám Bảo Hiểm Y Tế (BHYT)
                </a>
              </li>
              <li>
                <a onClick={() => navigate('/booking')} style={{ cursor: 'pointer' }}>
                  Khám Ngoài Giờ & T7-CN
                </a>
              </li>
            </ul>
          </Col>

          <Col xs={24} sm={12} md={5}>
            <div style={{ color: '#ffffff', fontWeight: 800, fontSize: 14, marginBottom: 14, textTransform: 'uppercase' }}>
              Thông Tin & Hướng Dẫn
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 2.1, fontSize: 13 }}>
              <li>
                <a onClick={() => navigate('/gioi-thieu')} style={{ cursor: 'pointer' }}>
                  Về Bệnh Viện D-Medical
                </a>
              </li>
              <li>
                <a onClick={() => navigate('/huong-dan')} style={{ cursor: 'pointer' }}>
                  Quy Trình Đặt Khám & Nhận QR
                </a>
              </li>
              <li>
                <a onClick={() => navigate('/tin-tuc')} style={{ cursor: 'pointer' }}>
                  Tin Tức & Cẩm Nang Sức Khỏe
                </a>
              </li>
              <li>
                <a onClick={() => navigate('/huong-dan#faq')} style={{ cursor: 'pointer' }}>
                  Câu Hỏi Thường Gặp (FAQ)
                </a>
              </li>
              <li>
                <a onClick={() => navigate('/booking?lookup=open')} style={{ cursor: 'pointer' }}>
                  Tra Cứu Lịch Hẹn & Kết Quả
                </a>
              </li>
            </ul>
          </Col>

          <Col xs={24} md={6}>
            <div style={{ color: '#ffffff', fontWeight: 800, fontSize: 14, marginBottom: 14, textTransform: 'uppercase' }}>
              Liên Hệ & Cấp Cứu
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#94a3b8' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <EnvironmentOutlined style={{ color: '#38bdf8', marginTop: 3 }} />
                <span>215 Hồng Bàng, Phường 11, Quận 5, TP. Hồ Chí Minh</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <PhoneFilled style={{ color: '#ef4444' }} />
                <span style={{ color: '#f87171', fontWeight: 700 }}>
                  Cấp cứu 24/7: 1900 1150
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <PhoneFilled style={{ color: '#38bdf8' }} />
                <span>CSKH & Đặt hẹn: (028) 3855 0000</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <ClockCircleOutlined style={{ color: '#38bdf8' }} />
                <span>Khám bệnh: 06:30 - 17:00 (Thứ 2 - CN)</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <GlobalOutlined style={{ color: '#38bdf8' }} />
                <span>cskh@dmedical.vn • www.dmedical.vn</span>
              </div>
            </div>
          </Col>
        </Row>

        <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)', margin: '32px 0 20px' }} />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            fontSize: 12,
            color: '#64748b',
          }}
        >
          <div>
            © 2026 Bệnh Viện Đa Khoa D-Medical. Bảo lưu mọi quyền. Nền tảng Y tế Số & Đặt khám Trực tuyến.
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/huong-dan')}>Điều khoản dịch vụ</span>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/huong-dan')}>Chính sách bảo mật</span>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/huong-dan')}>Quy định tiếp nhận</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
