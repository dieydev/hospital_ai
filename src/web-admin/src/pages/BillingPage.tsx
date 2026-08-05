import React, { useState } from 'react';
import { Card, Table, Button, Space, Input, Tag, Typography, Row, Col, Modal, Statistic, Image } from 'antd';
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
import { useThemeStore } from '../store/useThemeStore';
import { showSuccessAlert, showToast } from '../utils/sweetAlert';

const { Title, Text } = Typography;

export const BillingPage: React.FC = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const { isDarkMode } = useThemeStore();

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
    const inv = invoices.find((i) => i.id === id);
    setInvoices(invoices.map((i) => (i.id === id ? { ...i, trangThai: 'Đã thanh toán' } : i)));
    showSuccessAlert(
      'Thanh toán Thành công!',
      `Đã thu thành công số tiền viện phí cho hóa đơn ${inv?.maHoaDon || ''}`
    );
    setIsQrModalOpen(false);
  };

  const columns = [
    {
      title: 'Mã Hóa Đơn',
      dataIndex: 'maHoaDon',
      key: 'maHoaDon',
      render: (code: string) => <Text strong style={{ color: isDarkMode ? '#38bdf8' : '#0284c7', fontFamily: 'monospace' }}>{code}</Text>,
    },
    {
      title: 'Bệnh nhân',
      dataIndex: 'tenBenhNhan',
      key: 'tenBenhNhan',
      render: (t: string) => <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>{t}</Text>
    },
    { title: 'Mã BN', dataIndex: 'maBenhNhan', key: 'maBenhNhan', render: (c: string) => <Tag color="blue">{c}</Tag> },
    { title: 'Tiền Khám & DV', dataIndex: 'tienDichVu', key: 'tienDichVu', render: (_: any, r: Invoice) => formatCurrency(r.tienKham + r.tienDichVu) },
    { title: 'Tiền Thuốc', dataIndex: 'tienThuoc', key: 'tienThuoc', render: (val: number) => formatCurrency(val) },
    { title: 'BHYT Chi trả (80%)', dataIndex: 'bhytChiTra', key: 'bhytChiTra', render: (val: number) => <Text style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(val)}</Text> },
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
            <Button icon={<PrinterOutlined />} size="small" type="dashed" onClick={() => showToast('Đã gửi lệnh in hóa đơn nội bộ!', 'info')}>In Hóa Đơn Nội Bộ</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isDarkMode
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)'
            : 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #e2e8f0 100%)',
          padding: '20px 24px',
          borderRadius: '12px',
          border: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd',
          boxShadow: isDarkMode ? '0 10px 30px rgba(0, 0, 0, 0.3)' : '0 10px 30px rgba(2, 132, 199, 0.08)'
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: isDarkMode ? '#38bdf8' : '#0369a1' }}>
            Quản lý Viện phí & Hóa đơn Nội bộ
          </Title>
          <Text style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
            Tính toán chi phí khám bệnh, tiền thuốc, chỉ định cận lâm sàng & Theo dõi trạng thái thu phí
          </Text>
        </div>
        <Space>
          <Input placeholder="Tìm kiếm theo Mã HĐ / Tên BN / CCCD..." prefix={<SearchOutlined />} style={{ width: 320 }} />
        </Space>
      </div>

      <Row gutter={[20, 20]}>
        <Col span={8}>
          <Card style={{ borderRadius: 16, border: isDarkMode ? '1px solid #334155' : undefined }}>
            <Statistic
              title={<span style={{ color: isDarkMode ? '#94a3b8' : undefined }}>TỔNG THU VIỆN PHÍ HÔM NAY</span>}
              value={158800000}
              formatter={(val) => formatCurrency(Number(val))}
              valueStyle={{ color: isDarkMode ? '#38bdf8' : '#0284c7', fontWeight: 800 }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card style={{ borderRadius: 16, border: isDarkMode ? '1px solid #334155' : undefined }}>
            <Statistic
              title={<span style={{ color: isDarkMode ? '#94a3b8' : undefined }}>QUỸ BHYT CHI TRẢ TẠM TÍNH</span>}
              value={98400000}
              formatter={(val) => formatCurrency(Number(val))}
              valueStyle={{ color: '#10b981', fontWeight: 800 }}
              prefix={<SafetyCertificateOutlined />}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card style={{ borderRadius: 16, border: isDarkMode ? '1px solid #334155' : undefined }}>
            <Statistic
              title={<span style={{ color: isDarkMode ? '#94a3b8' : undefined }}>HÓA ĐƠN CHỜ THU PHÍ</span>}
              value={invoices.filter((i) => i.trangThai === 'Chưa thanh toán').length}
              valueStyle={{ color: '#f59e0b', fontWeight: 800 }}
              suffix="hóa đơn"
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<span style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Danh sách Hóa đơn Chi phí Khám chữa bệnh</span>}
        style={{ borderRadius: 16, border: isDarkMode ? '1px solid #334155' : undefined }}
      >
        <Table dataSource={invoices} columns={columns} rowKey="id" />
      </Card>

      {/* Modal QR Chuyển khoản nội bộ */}
      <Modal
        title={<span style={{ color: isDarkMode ? '#38bdf8' : '#0369a1' }}>Thông tin Chuyển khoản Viện phí Nội bộ (Mã QR Tham khảo)</span>}
        open={isQrModalOpen}
        onCancel={() => setIsQrModalOpen(false)}
        footer={null}
        style={{ textAlign: 'center' }}
      >
        {selectedInvoice && (
          <div>
            <Title level={4} style={{ margin: '8px 0', color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
              Bệnh nhân: {selectedInvoice.tenBenhNhan}
            </Title>
            <Text type="secondary" style={{ color: isDarkMode ? '#cbd5e1' : undefined }}>
              Mã Hóa đơn: {selectedInvoice.maHoaDon}
            </Text>

            <div style={{ margin: '20px auto', width: 220, padding: 12, border: '2px solid #0284c7', borderRadius: 16, background: '#fff' }}>
              <Image src={selectedInvoice.qrCodeUrl} alt="VietQR" width={196} preview={false} />
            </div>

            <Title level={2} style={{ color: '#f43f5e', margin: '0 0 16px' }}>
              {formatCurrency(selectedInvoice.benhNhanThanhToan)}
            </Title>
            <Text style={{ color: isDarkMode ? '#cbd5e1' : undefined }}>
              Nội dung CK: <strong style={{ color: isDarkMode ? '#38bdf8' : '#0284c7' }}>{selectedInvoice.maHoaDon}</strong>
            </Text>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 12 }}>
              <Button onClick={() => setIsQrModalOpen(false)}>Đóng</Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                size="large"
                style={{ background: '#10b981', borderColor: '#10b981' }}
                onClick={() => handleConfirmPayment(selectedInvoice.id)}
              >
                Xác nhận Đã thu đủ tiền
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
