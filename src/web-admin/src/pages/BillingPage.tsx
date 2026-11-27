import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Tag,
  Typography,
  Row,
  Col,
  Modal,
  Statistic,
  Image,
  Select,
  Alert,
  Tooltip,
  Spin,
  message,
} from 'antd';
import {
  DollarOutlined,
  SearchOutlined,
  QrcodeOutlined,
  CheckCircleOutlined,
  PrinterOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  WarningOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { Invoice } from '../types';
import { formatCurrency, getStatusTagColor } from '../utils/formatters';
import { useThemeStore } from '../store/useThemeStore';
import { showSuccessAlert, showToast } from '../utils/sweetAlert';
import {
  billingService,
  BillingStatusSummary,
  PaymentQrPublicConfig,
} from '../services/billingService';

const { Title, Text } = Typography;
const { Option } = Select;

export const BillingPage: React.FC = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const { isDarkMode } = useThemeStore();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrConfig, setQrConfig] = useState<PaymentQrPublicConfig | null>(null);
  const [liveBillingStatus, setLiveBillingStatus] = useState<BillingStatusSummary | null>(null);
  const [manualTxnRef, setManualTxnRef] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchBillings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await billingService.getBillings(statusFilter, typeFilter);
      setInvoices(data);
    } catch (error: any) {
      console.error('Failed to fetch billings:', error);
      message.error(error?.response?.data?.message || 'Lỗi khi tải danh sách hóa đơn từ máy chủ');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchBillings();
  }, [fetchBillings]);

  useEffect(() => {
    billingService
      .getPublicQrConfig()
      .then((cfg) => setQrConfig(cfg))
      .catch(() => {
        // Bỏ qua nếu chưa tải được cấu hình public QR
      });
  }, []);

  // Tự động kiểm tra trạng thái thanh toán SePay / VNPay mỗi 3 giây khi mở Modal QR
  useEffect(() => {
    if (!isQrModalOpen || !selectedInvoice) return;

    let isMounted = true;
    const pollStatus = async () => {
      try {
        const latest = await billingService.getBillingStatus(selectedInvoice.id);
        if (!isMounted) return;

        setLiveBillingStatus(latest);

        if (latest.status === 'Paid') {
          clearInterval(timer);
          setIsQrModalOpen(false);
          setManualTxnRef('');
          await fetchBillings();
          showSuccessAlert(
            'Thanh toán Tự động Thành công!',
            `Hóa đơn ${latest.paymentCode} đã được gạch nợ qua ${latest.paymentMethod || 'SePay VietQR'}${latest.transactionRef ? ` (Mã GD: ${latest.transactionRef})` : ''}.`
          );
        } else if (latest.status === 'Cancelled') {
          clearInterval(timer);
          setIsQrModalOpen(false);
          setManualTxnRef('');
          await fetchBillings();
          showToast(`Hóa đơn ${latest.paymentCode} đã chuyển sang trạng thái Đã hủy.`, 'warning');
        }
      } catch {
        // Không làm gián đoạn giao diện nếu mất nhịp mạng tạm thời
      }
    };

    pollStatus();
    const timer = setInterval(pollStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [isQrModalOpen, selectedInvoice, fetchBillings]);

  const filteredInvoices = invoices.filter((inv) => {
    const code = (inv.maThanhToan || inv.maHoaDon || '').toLowerCase();
    const kw = searchKeyword.toLowerCase();
    const matchKw =
      !searchKeyword ||
      code.includes(kw) ||
      (inv.tenBenhNhan || '').toLowerCase().includes(kw) ||
      (inv.maBenhNhan || '').toLowerCase().includes(kw) ||
      (inv.transactionRef || '').toLowerCase().includes(kw);

    const matchStatus = statusFilter === 'ALL' || inv.trangThai === statusFilter || inv.status === statusFilter;
    const matchType = typeFilter === 'ALL' || inv.loaiHoaDon === typeFilter;
    return matchKw && matchStatus && matchType;
  });

  const handleOpenQrModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setLiveBillingStatus(null);
    setManualTxnRef('');
    setIsQrModalOpen(true);
  };

  const handleCloseQrModal = () => {
    setIsQrModalOpen(false);
    setLiveBillingStatus(null);
    setManualTxnRef('');
  };

  const handleOpenPrintModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsPrintModalOpen(true);
  };

  const handleConfirmPayment = async (id: string, isTransfer: boolean = false) => {
    const inv = invoices.find((i) => i.id === id);
    const displayCode = inv?.maThanhToan || inv?.maHoaDon || '';
    setSubmittingPayment(true);
    try {
      if (isTransfer) {
        const cleanRef = manualTxnRef.trim();
        if (cleanRef.length < 6) {
          message.warning('Vui lòng nhập mã giao dịch / mã chuẩn chi ngân hàng tối thiểu 6 ký tự.');
          return;
        }
        await billingService.payTransfer(id, cleanRef);
      } else {
        await billingService.payCash(id);
      }

      const newMethod = isTransfer ? 'Chuyển khoản VietQR (Thu ngân đối soát)' : 'Tiền mặt';
      await fetchBillings();
      showSuccessAlert(
        'Thanh toán Thành công!',
        `Đã xác nhận thu viện phí cho hóa đơn ${displayCode} qua ${newMethod}.`
      );
      handleCloseQrModal();
    } catch (error: any) {
      const serverMsg =
        error?.response?.data?.message ||
        error?.response?.data?.Message ||
        error?.message ||
        'Có lỗi xảy ra khi xác nhận thanh toán.';
      message.error(serverMsg);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const renderLoaiHoaDonTag = (loai: string) => {
    switch (loai) {
      case 'Registration':
        return <Tag color="cyan">Khám ban đầu</Tag>;
      case 'ServiceOrder':
        return <Tag color="purple">Cận lâm sàng CLS</Tag>;
      case 'Prescription':
        return <Tag color="green">Toa thuốc</Tag>;
      default:
        return <Tag color="blue">{loai}</Tag>;
    }
  };

  const totalRevenue = invoices
    .filter((i) => i.trangThai === 'Đã thanh toán' || i.status === 'Paid')
    .reduce((sum, i) => sum + (i.tongTien || 0), 0);

  const pendingCount = invoices.filter((i) => i.trangThai === 'Chưa thanh toán' || i.status === 'Unpaid').length;
  const bhytEstimated = Math.round(totalRevenue * 0.7);

  const columns = [
    {
      title: 'Mã Thanh Toán',
      dataIndex: 'maHoaDon',
      key: 'maHoaDon',
      render: (_: string, record: Invoice) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: isDarkMode ? '#38bdf8' : '#0284c7', fontFamily: 'monospace' }}>
            {record.maThanhToan || record.maHoaDon}
          </Text>
          {record.transactionRef && (
            <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
              Ref: {record.transactionRef}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Bệnh nhân',
      dataIndex: 'tenBenhNhan',
      key: 'tenBenhNhan',
      render: (t: string) => <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>{t}</Text>,
    },
    { title: 'Mã BN', dataIndex: 'maBenhNhan', key: 'maBenhNhan', render: (c: string) => <Tag color="blue">{c}</Tag> },
    {
      title: 'Tiền Viện Phí',
      dataIndex: 'tongTien',
      key: 'tongTien',
      render: (val: number) => <Text strong style={{ color: '#f43f5e', fontSize: 16 }}>{formatCurrency(val)}</Text>,
    },
    { title: 'Loại HĐ', dataIndex: 'loaiHoaDon', key: 'loaiHoaDon', render: (val: string) => renderLoaiHoaDonTag(val) },
    { title: 'Phương thức', dataIndex: 'phuongThucThanhToan', key: 'phuongThucThanhToan', render: (val: string) => val || '---' },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (st: string, record: Invoice) => (
        <Space direction="vertical" size={4}>
          <Tag color={st === 'Đã hủy' || record.status === 'Cancelled' ? 'red' : getStatusTagColor(st)}>{st}</Tag>
          {record.ghiChuDoiSoat && (
            <Tooltip title={record.ghiChuDoiSoat}>
              <Tag color="warning" icon={<WarningOutlined />} style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Cần đối soát SePay
              </Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Thao tác Thu phí',
      key: 'action',
      render: (_: unknown, record: Invoice) => {
        const isUnpaid = record.status ? record.status === 'Unpaid' : record.trangThai === 'Chưa thanh toán';
        return (
          <Space>
            {isUnpaid ? (
              <>
                <Button
                  icon={<CheckCircleOutlined />}
                  type="primary"
                  size="small"
                  loading={submittingPayment}
                  style={{ background: '#10b981', borderColor: '#10b981' }}
                  onClick={() => handleConfirmPayment(record.id, false)}
                >
                  Thu tiền mặt
                </Button>
                <Button icon={<QrcodeOutlined />} size="small" onClick={() => handleOpenQrModal(record)}>
                  QR SePay / Đối soát
                </Button>
              </>
            ) : (
              <Button icon={<PrinterOutlined />} size="small" type="dashed" onClick={() => handleOpenPrintModal(record)}>
                In Hóa Đơn
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const activeQrUrl = liveBillingStatus?.vietQrUrl || selectedInvoice?.vietQrUrl;
  const activePaymentCode = liveBillingStatus?.paymentCode || selectedInvoice?.maThanhToan || selectedInvoice?.maHoaDon || '';
  const activeDiscrepancyNote = liveBillingStatus?.discrepancyNote || selectedInvoice?.ghiChuDoiSoat;
  const isSandboxMode = liveBillingStatus?.isSandbox ?? selectedInvoice?.isSandbox ?? qrConfig?.isSandbox ?? true;

  return (
    <div className="flex flex-col gap-6">
      {/* Modern Medical Header Banner */}
      <div className="medical-hero-banner relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 backdrop-blur-md">
              <span className="status-dot-active bg-emerald-400" /> Viện Phí & Thanh Toán • BHYT & SePay VietQR
            </span>
            {isSandboxMode && (
              <Tag color="gold" style={{ fontWeight: 800, margin: 0 }}>
                SANDBOX TEST MODE
              </Tag>
            )}
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight margin-0">
            Quản lý Viện phí & Hóa đơn Khám chữa bệnh
          </h1>
          <p className="text-sky-100 text-xs md:text-sm mt-1">
            Thu tiền mặt, tạo VietQR SePay đối soát tự động qua Webhook và đối soát thủ công dự phòng
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Input
            placeholder="Tìm mã thanh toán (HAI...), tên BN, mã GD..."
            prefix={<SearchOutlined className="text-sky-300" />}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full md:w-64 rounded-xl bg-white/95 text-slate-800 border-0"
          />
          <Select value={statusFilter} onChange={setStatusFilter} className="w-40" dropdownStyle={{ borderRadius: '10px' }}>
            <Option value="ALL">Tất cả Trạng thái</Option>
            <Option value="Unpaid">Chưa thanh toán</Option>
            <Option value="Paid">Đã thanh toán</Option>
            <Option value="Cancelled">Đã hủy</Option>
          </Select>
          <Select value={typeFilter} onChange={setTypeFilter} className="w-40" dropdownStyle={{ borderRadius: '10px' }}>
            <Option value="ALL">Tất cả Loại HĐ</Option>
            <Option value="Registration">Khám ban đầu</Option>
            <Option value="ServiceOrder">Cận lâm sàng</Option>
            <Option value="Prescription">Toa thuốc</Option>
          </Select>
        </div>
      </div>

      {isSandboxMode && (
        <Alert
          type="warning"
          showIcon
          message="Đang chạy ở chế độ SEPAY SANDBOX (Test Mode)"
          description={`Tài khoản nhận giả lập: ${qrConfig?.bankCode || 'MB'} - ${qrConfig?.accountNumber || '0000000001'} (${qrConfig?.accountName || 'HOSPITAL AI DEMO'}). Tuyệt đối không chuyển tiền thật vào tài khoản giả lập này; chỉ dùng SePay CLI / mô phỏng giao dịch Sandbox.`}
          style={{ borderRadius: 12 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 hover-lift">
            <Statistic
              title={<span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">TỔNG DOANH THU ĐÃ THU</span>}
              value={totalRevenue}
              formatter={(val) => formatCurrency(Number(val))}
              valueStyle={{ color: '#0284c7', fontWeight: 800 }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 hover-lift">
            <Statistic
              title={<span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">QUỸ BHYT CHI TRẢ TẠM TÍNH (~70%)</span>}
              value={bhytEstimated}
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
              value={pendingCount}
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

      {/* Modal QR Chuyển khoản SePay VietQR + Auto-Poll + Đối soát thủ công */}
      <Modal
        title={
          <Space>
            <span style={{ color: isDarkMode ? '#38bdf8' : '#0369a1', fontWeight: 800 }}>
              Thu Viện Phí VietQR (SePay)
            </span>
            {isSandboxMode && <Tag color="orange" style={{ fontWeight: 800 }}>SANDBOX</Tag>}
          </Space>
        }
        open={isQrModalOpen}
        onCancel={handleCloseQrModal}
        footer={null}
        width={520}
        style={{ textAlign: 'center' }}
      >
        {selectedInvoice && (
          <div>
            {isSandboxMode && (
              <Alert
                type="info"
                showIcon
                message="MÔI TRƯỜNG KIỂM THỬ SANDBOX — KHÔNG CHUYỂN TIỀN THẬT"
                style={{ marginBottom: 12, textAlign: 'left', borderRadius: 10 }}
              />
            )}

            <div style={{ backgroundColor: '#f0f9ff', padding: 12, borderRadius: 12, border: '1px solid #bae6fd', marginBottom: 14 }}>
              <Title level={4} style={{ margin: 0, color: '#0369a1' }}>
                {selectedInvoice.tenBenhNhan}
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Mã BN: <strong>{selectedInvoice.maBenhNhan}</strong> • Mã TT:{' '}
                <strong style={{ fontFamily: 'monospace', color: '#0284c7' }}>{activePaymentCode}</strong>
              </Text>
            </div>

            {activeDiscrepancyNote && (
              <Alert
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                message="Phát hiện chênh lệch / ngoại lệ Webhook SePay — Cần Thu ngân kiểm tra"
                description={activeDiscrepancyNote}
                style={{ textAlign: 'left', marginBottom: 14, borderRadius: 10 }}
              />
            )}

            <div style={{ margin: '0 auto 14px', width: 240, padding: 12, border: '2px solid #0284c7', borderRadius: 16, background: '#fff', boxShadow: '0 8px 24px rgba(2, 132, 199, 0.15)' }}>
              {activeQrUrl ? (
                <Image
                  src={activeQrUrl}
                  alt="VietQR SePay Payment"
                  width={216}
                  preview={false}
                />
              ) : (
                <div style={{ padding: 24 }}>
                  <Spin />
                  <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
                    Chưa có URL QR từ cấu hình Backend
                  </div>
                </div>
              )}
            </div>

            <Title level={2} style={{ color: '#f43f5e', margin: '0 0 8px', fontWeight: 900 }}>
              {formatCurrency(selectedInvoice.tongTien)}
            </Title>

            <div style={{ marginBottom: 12 }}>
              <Tag color="processing" icon={<SyncOutlined spin />} style={{ padding: '4px 12px', fontSize: 12 }}>
                Đang lắng nghe Webhook SePay tự động (3 giây/lần)...
              </Tag>
            </div>

            <div style={{ textAlign: 'left', backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', padding: 12, borderRadius: 8, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div>Ngân hàng thụ hưởng: <strong style={{ color: '#0284c7' }}>{qrConfig?.bankCode || 'MB'} ({qrConfig?.bankBin || '970422'})</strong></div>
              <div>Số tài khoản: <strong style={{ color: '#0369a1', fontFamily: 'monospace', fontSize: 14 }}>{qrConfig?.accountNumber || '---'}</strong></div>
              <div>Tên tài khoản: <strong>{qrConfig?.accountName || '---'}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  Nội dung CK bắt buộc:{' '}
                  <strong style={{ color: '#f43f5e', fontFamily: 'monospace' }}>{activePaymentCode}</strong>
                </span>
                <Button
                  size="small"
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(activePaymentCode);
                    showToast(`Đã sao chép mã ${activePaymentCode}`, 'success');
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: 14, padding: 12, borderRadius: 10, border: '1px dashed #cbd5e1', textAlign: 'left' }}>
              <Text strong style={{ fontSize: 12.5, display: 'block', marginBottom: 6 }}>
                Đối soát thủ công dự phòng (nếu Webhook chậm hoặc xử lý chênh lệch tiền):
              </Text>
              <Input
                placeholder="Nhập mã giao dịch / mã chuẩn chi ngân hàng (≥ 6 ký tự)..."
                value={manualTxnRef}
                onChange={(e) => setManualTxnRef(e.target.value)}
                style={{ marginBottom: 10 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <Button onClick={handleCloseQrModal}>Đóng</Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={submittingPayment}
                  disabled={manualTxnRef.trim().length < 6}
                  style={{ background: '#10b981', borderColor: '#10b981' }}
                  onClick={() => handleConfirmPayment(selectedInvoice.id, true)}
                >
                  Xác nhận Đối soát Thủ công
                </Button>
              </div>
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
              <Text>Mã TT: <strong>{selectedInvoice.maThanhToan || selectedInvoice.maHoaDon}</strong></Text>
              <Text>Ngày: {selectedInvoice.ngayLap}</Text>
            </div>
            {selectedInvoice.transactionRef && (
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Mã giao dịch: {selectedInvoice.transactionRef}</Text>
              </div>
            )}
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
              <Text style={{ fontSize: 12, fontStyle: 'italic', color: '#64748b' }}>
                Trạng thái: {selectedInvoice.trangThai} ({selectedInvoice.phuongThucThanhToan || '---'})
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
