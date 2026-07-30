import React from 'react';
import { Card, Table, Tag, Button, Typography, QRCode, Space } from 'antd';
import { QrcodeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { formatCurrency } from '../utils/formatters';

const { Title, Text } = Typography;

export const BillingPage: React.FC = () => {
  const sampleInvoices = [
    { id: 'HD001', maBenhNhan: 'BN20260001', hoTen: 'Nguyễn Văn An', tongTien: 350000, trangThai: 'Paid', thoiGian: '2026-07-30 09:30' },
    { id: 'HD002', maBenhNhan: 'BN20260002', hoTen: 'Trần Thị Bình', tongTien: 520000, trangThai: 'Pending', thoiGian: '2026-07-30 10:15' },
  ];

  const columns = [
    { title: 'Mã Hóa Đơn', dataIndex: 'id', key: 'id' },
    { title: 'Bệnh Nhân', dataIndex: 'hoTen', key: 'hoTen' },
    { title: 'Tổng Tiền', dataIndex: 'tongTien', key: 'tongTien', render: (val: number) => formatCurrency(val) },
    {
      title: 'Trạng Thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (st: string) => (st === 'Paid' ? <Tag color="green">Đã Thanh Toán</Tag> : <Tag color="orange">Chờ Thanh Toán</Tag>),
    },
    { title: 'Thời Gian', dataIndex: 'thoiGian', key: 'thoiGian' },
    {
      title: 'Thao Tác',
      key: 'action',
      render: (_: unknown, record: { id: string; trangThai: string }) => (
        <Space>
          {record.trangThai === 'Pending' && <Button icon={<QrcodeOutlined />} type="primary">Tạo Mã VNPay QR</Button>}
          <Button icon={<CheckCircleOutlined />}>Chi Tiết Viện Phí</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Quản lý Hóa Đơn & Thanh Toán Viện Phí VNPay</Title>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <div>
            <Text bold>Demo Mã VNPay Sandbox QR Code (Thanh toán tự động):</Text>
            <div style={{ marginTop: 8 }}>
              <QRCode value="https://vnpay.vn/pay?invoice=HD002&amount=520000" size={140} />
            </div>
          </div>
          <div>
            <Title level={4}>Hóa đơn HD002 - Bệnh nhân Trần Thị Bình</Title>
            <Text>Khám lâm sàng: 150.000 VNĐ</Text><br />
            <Text>Thuốc theo đơn: 370.000 VNĐ</Text><br />
            <Title level={4} style={{ color: '#0077b6', marginTop: 10 }}>Tổng: {formatCurrency(520000)}</Title>
          </div>
        </div>
      </Card>
      <Table dataSource={sampleInvoices} columns={columns} rowKey="id" />
    </div>
  );
};
