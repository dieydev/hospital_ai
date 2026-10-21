import React from 'react';
import { Result, Button } from 'antd';
import { HomeOutlined, CalendarOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PatientPortalHeader } from '../components/PatientPortalHeader';
import { PatientPortalFooter } from '../components/PatientPortalFooter';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <PatientPortalHeader />

      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 16px',
        }}
      >
        <div
          style={{
            maxWidth: 600,
            width: '100%',
            background: '#ffffff',
            borderRadius: 16,
            padding: '40px 24px',
            boxShadow: '0 10px 30px rgba(2, 132, 199, 0.08)',
            border: '1px solid #bae6fd',
            textAlign: 'center',
          }}
        >
          <Result
            status="404"
            title={
              <span style={{ fontSize: 28, fontWeight: 800, color: '#0369a1' }}>
                404 - Không Tìm Thấy Trang
              </span>
            }
            subTitle={
              <span style={{ fontSize: 15, color: '#475569' }}>
                Địa chỉ trang bạn vừa truy cập không tồn tại, đã bị xóa hoặc được di chuyển sang phân hệ khác trong Cổng Y Tế Bệnh Viện Hospital AI.
              </span>
            }
            extra={[
              <Button
                type="primary"
                key="home"
                icon={<HomeOutlined />}
                onClick={() => navigate('/')}
                style={{
                  backgroundColor: '#0284c7',
                  borderColor: '#0284c7',
                  height: 42,
                  padding: '0 24px',
                  fontWeight: 700,
                  borderRadius: 8,
                }}
              >
                Về Trang Chủ
              </Button>,
              <Button
                key="booking"
                icon={<CalendarOutlined />}
                onClick={() => navigate('/booking')}
                style={{
                  borderColor: '#0284c7',
                  color: '#0284c7',
                  height: 42,
                  padding: '0 20px',
                  fontWeight: 700,
                  borderRadius: 8,
                }}
              >
                Đặt Lịch Khám
              </Button>,
              <Button
                key="back"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
                style={{
                  height: 42,
                  padding: '0 16px',
                  borderRadius: 8,
                  color: '#64748b',
                }}
              >
                Quay Lại
              </Button>,
            ]}
          />
        </div>
      </main>

      <PatientPortalFooter />
    </div>
  );
};

export default NotFoundPage;
