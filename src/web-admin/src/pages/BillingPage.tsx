import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Input, Tag, Typography, Row, Col, Modal, Statistic, Image, Select, message } from 'antd';
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
import { billingService } from '../services/billingService';

const { Title, Text } = Typography;
const { Option } = Select;

export const BillingPage: React.FC = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const { isDarkMode } = useThemeStore();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBillings();
  }, [statusFilter]);

  const fetchBillings = async () => {
    setLoading(true);
    try {
      const data = await billingService.getBillings(statusFilter === 'ALL' ? undefined : statusFilter, 'Registration');
      setInvoices(data);
    } catch (error) {
      console.error("Failed to fetch billings:", error);
      message.error("Lỗi khi tải danh sách hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchKw =
      !searchKeyword ||
      inv.maHoaDon.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      inv.tenBenhNhan.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      inv.maBenhNhan.toLowerCase().includes(searchKeyword.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || inv.trangThai === statusFilter;
    return matchKw && matchStatus;
  });

  const handleOpenQrModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsQrModalOpen(true);
  };

  const handleOpenPrintModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsPrintModalOpen(true);
  };

  const handleConfirmPayment = async (id: string) => {
    try {
      await billingService.payCash(id);
      const inv = invoices.find((i) => i.id === id);
      setInvoices(invoices.map((i) => (i.id === id ? { ...i, trangThai: 'Đã thanh toán', phuongThucThanhToan: 'Tiền mặt' } : i)));
      showSuccessAlert(
        'Thanh toán Thành công!',
        `Đã thu thành công số tiền viện phí cho hóa đơn ${inv?.maHoaDon || ''}`
      );
      setIsQrModalOpen(false);
    } catch (error) {
      console.error(error);
      message.error("Có lỗi xảy ra khi xác nhận thanh toán.");
    }
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
    { title: 'Tiền Khám (VND)', dataIndex: 'tongTien', key: 'tongTien', render: (val: number) => <Text strong style={{ color: '#f43f5e', fontSize: 16 }}>{formatCurrency(val)}</Text> },
    { title: 'Loại HĐ', dataIndex: 'loaiHoaDon', key: 'loaiHoaDon', render: (val: string) => <Tag color="purple">{val}</Tag> },
    { title: 'Phương thức', dataIndex: 'phuongThucThanhToan', key: 'phuongThucThanhToan' },
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
            <Button icon={<PrinterOutlined />} size="small" type="dashed" onClick={() => handleOpenPrintModal(record)}>In Hóa Đơn</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Modern Medical Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 p-6 md:p-8 text-white shadow-md border border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="status-dot-active" />
            <Text className="text-xs text-sky-300 font-semibold uppercase tracking-wider">Viện Phí & Thanh Toán • BHYT & VietQR</Text>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight margin-0">
            Quản lý Viện phí & Hóa đơn Khám chữa bệnh
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1">
            Tính toán chi phí khám, tiền thuốc, dịch vụ CLS, mức hưởng BHYT và xuất hóa đơn thanh toán
          </p>
        </div>
        <Space wrap>
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 160 }}>
            <Option value="ALL">Tất cả trạng thái</Option>
            <Option value="Chưa thanh toán">Chưa thanh toán</Option>
            <Option value="Đã thanh toán">Đã thanh toán</Option>
          </Select>
          <Input
            placeholder="Tìm Mã HĐ, Tên BN, Mã BN..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: 260 }}
          />
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 hover-lift">
            <Statistic
              title={<span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">TỔNG THU VIỆN PHÍ HÔM NAY</span>}
              value={158800000}
              formatter={(val) => formatCurrency(Number(val))}
              valueStyle={{ color: isDarkMode ? '#38bdf8' : '#0284c7', fontWeight: 800 }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 hover-lift">
            <Statistic
              title={<span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">QUỸ BHYT CHI TRẢ TẠM TÍNH</span>}
              value={98400000}
              formatter={(val) => formatCurrency(Number(val))}
              valueStyle={{ color: '#10b981', fontWeight: 800 }}
              prefix={<SafetyCertificateOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 hover-lift">
            <Statistic
              title={<span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">HÓA ĐƠN CHỜ THU PHÍ</span>}
              value={invoices.filter((i) => i.trangThai === 'Chưa thanh toán').length}
              valueStyle={{ color: '#f59e0b', fontWeight: 800 }}
              suffix="hóa đơn"
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<span className="font-semibold text-slate-800 dark:text-slate-100 text-base">Danh sách Hóa đơn Chi phí Khám chữa bệnh</span>}
        bordered={false}
        className="rounded-xl bg-white dark:bg-slate-800 hover-lift"
      >
        <Table dataSource={filteredInvoices} columns={columns} rowKey="id" loading={loading} />
      </Card>

      {/* Modal QR Chuyển khoản VietQR Ngân hàng */}
      <Modal
        title={<span style={{ color: isDarkMode ? '#38bdf8' : '#0369a1', fontWeight: 800 }}>Tạo Mã VietQR Thanh Toán Viện Phí Động</span>}
        open={isQrModalOpen}
        onCancel={() => setIsQrModalOpen(false)}
        footer={null}
        width={480}
        style={{ textAlign: 'center' }}
      >
        {selectedInvoice && (
          <div>
            <div style={{ backgroundColor: '#f0f9ff', padding: 12, borderRadius: 12, border: '1px solid #bae6fd', marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0, color: '#0369a1' }}>
                {selectedInvoice.tenBenhNhan}
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Mã BN: <strong>{selectedInvoice.maBenhNhan}</strong> • Mã HĐ: <strong>{selectedInvoice.maHoaDon}</strong>
              </Text>
            </div>

            <div style={{ margin: '0 auto 16px', width: 240, padding: 12, border: '2px solid #0284c7', borderRadius: 16, background: '#fff', boxShadow: '0 8px 24px rgba(2, 132, 199, 0.15)' }}>
              <Image
                src={`https://img.vietqr.io/image/MB-1990002026-compact2.png?amount=${selectedInvoice.tongTien}&addInfo=THANHTOAN%20${selectedInvoice.maHoaDon}&accountName=BV%20DA%20KHOA%20HOSPITAL%20AI`}
                alt="VietQR Bank Payment"
                width={216}
                preview={false}
                fallback="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=VIETQR_HOSPITAL_AI_350000"
              />
            </div>

            <Title level={2} style={{ color: '#f43f5e', margin: '0 0 8px', fontWeight: 900 }}>
              {formatCurrency(selectedInvoice.tongTien)}
            </Title>

            <div style={{ textAlign: 'left', backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', padding: 12, borderRadius: 8, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>Ngân hàng thụ hưởng: <strong style={{ color: '#0284c7' }}>MB Bank (NHTM CP Quân Đội)</strong></div>
              <div>Số tài khoản: <strong style={{ color: '#0369a1', fontFamily: 'monospace', fontSize: 14 }}>1990 0020 26</strong></div>
              <div>Tên tài khoản: <strong>BV DA KHOA HOSPITAL AI</strong></div>
              <div>Nội dung chuyển khoản: <strong style={{ color: '#f43f5e', fontFamily: 'monospace' }}>THANHTOAN {selectedInvoice.maHoaDon}</strong></div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 12 }}>
              <Button onClick={() => setIsQrModalOpen(false)}>Hủy bỏ</Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                size="large"
                style={{ background: '#10b981', borderColor: '#10b981' }}
                onClick={() => handleConfirmPayment(selectedInvoice.id)}
              >
                Xác nhận Đã Nhận Đủ Tiền
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal In Hóa Đơn Xem trước */}
      <Modal
        title={<span style={{ color: isDarkMode ? '#38bdf8' : '#0369a1' }}>Xem trước Hóa đơn Thu tiền Viện phí</span>}
        open={isPrintModalOpen}
        onCancel={() => setIsPrintModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsPrintModalOpen(false)}>Đóng</Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            onClick={() => {
              showToast('Đã gửi lệnh tới máy in hóa đơn y tế!', 'success');
              setIsPrintModalOpen(false);
            }}
          >
            In Hóa Đơn (A5/A4)
          </Button>,
        ]}
      >
        {selectedInvoice && (
          <div style={{ padding: 16, border: '1px dashed #cbd5e1', borderRadius: 8, background: isDarkMode ? '#0f172a' : '#f8fafc' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0, color: '#0284c7' }}>BỆNH VIỆN ĐA KHOA HOSPITAL AI</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>HÓA ĐƠN THU TIỀN VIỆN PHÍ & THUỐC</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text>Số HĐ: <strong>{selectedInvoice.maHoaDon}</strong></Text>
              <Text>Ngày: {selectedInvoice.ngayLap}</Text>
            </div>
            <div style={{ borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', padding: '8px 0', marginBottom: 12 }}>
              {selectedInvoice.items && selectedInvoice.items.map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>{item.tenDichVu} (x{item.soLuong}):</Text>
                  <Text>{formatCurrency(item.thanhTien)}</Text>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <Text strong>TỔNG TIỀN PHẢI THANH TOÁN:</Text>
              <Text strong style={{ fontSize: 18, color: '#f43f5e' }}>{formatCurrency(selectedInvoice.tongTien)}</Text>
            </div>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Text style={{ fontSize: 12, fontStyle: 'italic', color: '#64748b' }}>Trạng thái: {selectedInvoice.trangThai}</Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
