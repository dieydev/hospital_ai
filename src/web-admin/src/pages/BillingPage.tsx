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
    message.success('Đã thu tiền và cập nhật trạng thái hóa đơn thành công!');
    setIsQrModalOpen(false);
  };

  const columns = [
    {
      title: 'Mã Hóa Đơn',
      dataIndex: 'maHoaDon',
      key: 'maHoaDon',
      render: (code: string) => <Text strong style={{ color: '#0284c7' }}>{code}</Text>,
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
      render: (val: number) => <Text strong style={{ color: '#f43f5e', fontSize: 16 }}>{formatCurrency(val)}</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (st: string) => <Tag color={getStatusTagColor(st)}>{st}</Tag>,
    },
    {
      title: 'Thao tác Thu phí',
      key: 'action',
      render: (_: unknown, record: Invoice) => (
        <Space>
          {record.trangThai === 'Chưa thanh toán' ? (
            <>
              <Button icon={<CheckCircleOutlined />} type="primary" size="small" style={{ background: '#10b981', borderColor: '#10b981' }} onClick={() => handleConfirmPayment(record.id)}>
                Thu tiền mặt
              </Button>
              <Button icon={<QrcodeOutlined />} size="small" onClick={() => handleOpenQrModal(record)}>
                QR Chuyển khoản
              </Button>
            </>
          ) : (
            <Button icon={<PrinterOutlined />} size="small" type="dashed">In Hóa Đơn Nội Bộ</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Quản lý Viện phí & Hóa đơn Nội bộ</Title>
          <Text type="secondary">Tính toán chi phí khám bệnh, tiền thuốc, chỉ định cận lâm sàng & Theo dõi trạng thái thu phí</Text>
        </div>
        <Space>
          <Input placeholder="Tìm kiếm theo Mã HĐ / Tên BN / CCCD..." prefix={<SearchOutlined />} style={{ width: 320 }} />
        </Space>
      </div>

      <Row gutter={[20, 20]}>
        <Col span={8}>
          <Card style={{ borderRadius: 16 }}>
            <Statistic title="TỔNG THU VIỆN PHÍ HÔM NAY" value={158800000} formatter={(val) => formatCurrency(Number(val))} valueStyle={{ color: '#0284c7', fontWeight: 800 }} prefix={<DollarOutlined />} />
          </Card>
        </Col>

        <Col span={8}>
          <Card style={{ borderRadius: 16 }}>
            <Statistic title="QUỸ BHYT CHI TRẢ TẠM TÍNH" value={98400000} formatter={(val) => formatCurrency(Number(val))} valueStyle={{ color: '#10b981', fontWeight: 800 }} prefix={<SafetyCertificateOutlined />} />
          </Card>
        </Col>

        <Col span={8}>
          <Card style={{ borderRadius: 16 }}>
            <Statistic title="HÓA ĐƠN CHỜ THU PHÍ" value={invoices.filter((i) => i.trangThai === 'Chưa thanh toán').length} valueStyle={{ color: '#f59e0b', fontWeight: 800 }} suffix="hóa đơn" />
          </Card>
        </Col>
      </Row>

      <Card title="Danh sách Hóa đơn Chi phí Khám chữa bệnh" style={{ borderRadius: 16 }}>
        <Table dataSource={invoices} columns={columns} rowKey="id" />
      </Card>

      {/* Modal QR Chuyển khoản nội bộ */}
      <Modal
        title="Thông tin Chuyển khoản Viện phí Nội bộ (Mã QR Tham khảo)"
        open={isQrModalOpen}
        onCancel={() => setIsQrModalOpen(false)}
        footer={null}
        style={{ textAlign: 'center' }}
      >
        {selectedInvoice && (
          <div>
            <Title level={4} style={{ margin: '8px 0' }}>Bệnh nhân: {selectedInvoice.tenBenhNhan}</Title>
            <Text type="secondary">Mã Hóa đơn: {selectedInvoice.maHoaDon}</Text>

            <div style={{ margin: '20px auto', width: 220, padding: 12, border: '2px solid #0284c7', borderRadius: 16, background: '#fff' }}>
              <Image src={selectedInvoice.qrCodeUrl} alt="VietQR" width={196} preview={false} />
            </div>

            <Title level={2} style={{ color: '#f43f5e', margin: '0 0 16px' }}>
              {formatCurrency(selectedInvoice.benhNhanThanhToan)}
            </Title>
            <Text>Nội dung CK: <strong>{selectedInvoice.maHoaDon}</strong></Text>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 12 }}>
              <Button onClick={() => setIsQrModalOpen(false)}>Đóng</Button>
              <Button type="primary" icon={<CheckCircleOutlined />} size="large" style={{ background: '#10b981', borderColor: '#10b981' }} onClick={() => handleConfirmPayment(selectedInvoice.id)}>
                Xác nhận Đã thu đủ tiền
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
