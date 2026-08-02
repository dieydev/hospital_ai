import React, { useState } from 'react';
import { Card, Table, Button, Space, Input, Tag, Typography, Row, Col, Modal, Statistic, message, Image } from 'antd';
import {
  DollarOutlined,
  SearchOutlined,
  QrcodeOutlined,
  CheckCircleOutlined,
  PrinterOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Invoice } from '../types';
import { formatCurrency, getStatusTagColor } from '../utils/formatters';

const { Title, Text } = Typography;

export const BillingPage: React.FC = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 'inv-001',
      maHoaDon: 'HD20260802-001',
      maBenhNhan: 'BN20260001',
      tenBenhNhan: 'Nguyễn Văn An',
      maLuotKham: 'LK20260802-01',
      ngayLap: '2026-08-02 09:30',
      tienKham: 150000,
      tienThuoc: 185000,
      tienDichVu: 235000,
      bhytChiTra: 220000,
      benhNhanThanhToan: 350000,
      phuongThucThanhToan: 'Chuyển khoản VietQR',
      trangThai: 'Chưa thanh toán',
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=VIETQR_HOSPITAL_AI_350000_HD20260802-001',
    },
    {
      id: 'inv-002',
      maHoaDon: 'HD20260802-002',
      maBenhNhan: 'BN20260002',
      tenBenhNhan: 'Trần Thị Bình',
      maLuotKham: 'LK20260802-02',
      ngayLap: '2026-08-02 09:15',
      tienKham: 150000,
      tienThuoc: 420000,
      tienDichVu: 550000,
      bhytChiTra: 650000,
      benhNhanThanhToan: 470000,
      phuongThucThanhToan: 'Tiền mặt',
      trangThai: 'Đã thanh toán',
    },
  ]);

  const handleOpenQrModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsQrModalOpen(true);
  };

  const handleConfirmPayment = (id: string) => {
    setInvoices(invoices.map((inv) => (inv.id === id ? { ...inv, trangThai: 'Đã thanh toán' } : inv)));
    message.success('Đã xác nhận thanh toán thành công hóa đơn!');
    setIsQrModalOpen(false);
  };

  const columns = [
    {
      title: 'Mã Hóa Đơn',
      dataIndex: 'maHoaDon',
      key: 'maHoaDon',
      render: (code: string) => <Text strong style={{ color: '#1677ff' }}>{code}</Text>,
    },
    { title: 'Bệnh nhân', dataIndex: 'tenBenhNhan', key: 'tenBenhNhan', render: (t: string) => <Text strong>{t}</Text> },
    { title: 'Mã BN', dataIndex: 'maBenhNhan', key: 'maBenhNhan' },
    { title: 'Tiền Khám & DV', dataIndex: 'tienDichVu', key: 'tienDichVu', render: (_: any, r: Invoice) => formatCurrency(r.tienKham + r.tienDichVu) },
    { title: 'Tiền Thuốc', dataIndex: 'tienThuoc', key: 'tienThuoc', render: (val: number) => formatCurrency(val) },
    { title: 'BHYT Chi trả (80%)', dataIndex: 'bhytChiTra', key: 'bhytChiTra', render: (val: number) => <Text type="success">{formatCurrency(val)}</Text> },
    {
      title: 'BN Cần Thanh Toán',
      dataIndex: 'benhNhanThanhToan',
      key: 'benhNhanThanhToan',
      render: (val: number) => <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>{formatCurrency(val)}</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (st: string) => <Tag color={getStatusTagColor(st)}>{st}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: unknown, record: Invoice) => (
        <Space>
          {record.trangThai === 'Chưa thanh toán' ? (
            <Button icon={<QrcodeOutlined />} type="primary" size="small" onClick={() => handleOpenQrModal(record)}>
              Mã VietQR
            </Button>
          ) : (
            <Button icon={<PrinterOutlined />} size="small" type="dashed">In Hóa Đơn</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Quản lý Viện phí & Hóa đơn Thanh toán</Title>
          <Text type="secondary">Thu phí khám bệnh, tiền thuốc, chỉ định cận lâm sàng & Tích hợp VietQR</Text>
        </div>
        <Space>
          <Input placeholder="Tìm kiếm theo Mã HĐ / Tên BN / CCCD..." prefix={<SearchOutlined />} style={{ width: 320 }} />
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={8}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="Tổng Thu Viện phí Hôm nay" value={158800000} formatter={(val) => formatCurrency(Number(val))} valueStyle={{ color: '#1677ff', fontWeight: 700 }} prefix={<DollarOutlined />} />
          </Card>
        </Col>

        <Col span={8}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="Quỹ BHYT Chi trả Tạm tính" value={98400000} formatter={(val) => formatCurrency(Number(val))} valueStyle={{ color: '#52c41a', fontWeight: 700 }} prefix={<SafetyCertificateOutlined />} />
          </Card>
        </Col>

        <Col span={8}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="Hóa đơn Chờ thanh toán" value={invoices.filter((i) => i.trangThai === 'Chưa thanh toán').length} valueStyle={{ color: '#fa8c16', fontWeight: 700 }} suffix="hóa đơn" />
          </Card>
        </Col>
      </Row>

      <Card title="Danh sách Hóa đơn Viện phí" style={{ borderRadius: 12 }}>
        <Table dataSource={invoices} columns={columns} rowKey="id" />
      </Card>

      {/* Modal VietQR Payment */}
      <Modal
        title="Thanh toán Viện phí qua Mã QR VietQR"
        open={isQrModalOpen}
        onCancel={() => setIsQrModalOpen(false)}
        footer={null}
        style={{ textAlign: 'center' }}
      >
        {selectedInvoice && (
          <div>
            <Title level={4} style={{ margin: '8px 0' }}>Bệnh nhân: {selectedInvoice.tenBenhNhan}</Title>
            <Text type="secondary">Mã Hóa đơn: {selectedInvoice.maHoaDon}</Text>

            <div style={{ margin: '20px auto', width: 220, padding: 12, border: '2px solid #1677ff', borderRadius: 16, background: '#fff' }}>
              <Image src={selectedInvoice.qrCodeUrl} alt="VietQR" width={196} preview={false} />
            </div>

            <Title level={2} style={{ color: '#ff4d4f', margin: '0 0 16px' }}>
              {formatCurrency(selectedInvoice.benhNhanThanhToan)}
            </Title>
            <Text>Nội dung CK: <strong>{selectedInvoice.maHoaDon}</strong></Text>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 12 }}>
              <Button onClick={() => setIsQrModalOpen(false)}>Đóng</Button>
              <Button type="primary" icon={<CheckCircleOutlined />} size="large" style={{ background: '#52c41a', borderColor: '#52c41a' }} onClick={() => handleConfirmPayment(selectedInvoice.id)}>
                Xác nhận Đã thu tiền
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
