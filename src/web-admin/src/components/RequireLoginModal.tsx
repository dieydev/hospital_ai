import React from 'react';
import { Modal, Button, Typography, Space } from 'antd';
import { LoginOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

interface RequireLoginModalProps {
  open: boolean;
  onCancel: () => void;
  redirectPath?: string;
  actionTitle?: string;
}

export const RequireLoginModal: React.FC<RequireLoginModalProps> = ({
  open,
  onCancel,
  redirectPath = '/booking',
  actionTitle = 'thực hiện thao tác này',
}) => {
  const navigate = useNavigate();

  const handleGoLogin = () => {
    onCancel();
    navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      width={460}
      bodyStyle={{ padding: '24px 20px', textAlign: 'center' }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          backgroundColor: '#e0f2fe',
          color: '#0284c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 30,
          margin: '0 auto 16px',
          border: '2px solid #bae6fd',
        }}
      >
        <LockOutlined />
      </div>

      <Title level={4} style={{ color: '#0369a1', fontWeight: 800, margin: '0 0 8px' }}>
        YÊU CẦU ĐĂNG NHẬP
      </Title>

      <Paragraph style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px', lineHeight: 1.6 }}>
        Quý khách cần đăng nhập tài khoản để <strong>{actionTitle}</strong>. 
        Tài khoản chưa có trong hệ thống sẽ được tự động tạo với vai trò <strong>Bệnh nhân</strong> và cấp <strong>Mã QR tiếp nhận trực tiếp</strong>.
      </Paragraph>

      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <Button
          type="primary"
          size="large"
          block
          icon={<LoginOutlined />}
          style={{
            backgroundColor: '#0284c7',
            borderColor: '#0284c7',
            borderRadius: 10,
            fontWeight: 700,
            height: 46,
          }}
          onClick={handleGoLogin}
        >
          Đăng Nhập / Tiếp Tục Ngay
        </Button>

        <Button type="text" onClick={onCancel} style={{ color: '#94a3b8' }}>
          Để sau, quay lại xem thông tin
        </Button>
      </Space>
    </Modal>
  );
};
