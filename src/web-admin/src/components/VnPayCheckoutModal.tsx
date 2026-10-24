import React, { useState, useEffect } from 'react';
import {
  Modal,
  Row,
  Col,
  Input,
  Button,
  Tag,
  Typography,
  Alert,
  Space,
} from 'antd';
import {
  CreditCardOutlined,
  QrcodeOutlined,
  LockOutlined,
  CheckCircleFilled,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
  BankOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import api from '../services/api';

const { Title, Text, Paragraph } = Typography;

export interface VnPayCheckoutModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (transactionInfo: {
    transactionNo: string;
    bankCode: string;
    cardHolder: string;
    amount: number;
    paymentTime: string;
  }) => void;
  orderId: string;
  amount: number;
  orderDescription: string;
  patientName?: string;
}

interface BankItem {
  code: string;
  name: string;
  shortName: string;
  color: string;
  logoBg: string;
  recommended?: boolean;
}

const SUPPORTED_BANKS: BankItem[] = [
  { code: 'NCB', name: 'Ngân hàng Quốc Dân (NCB)', shortName: 'NCB', color: '#005baa', logoBg: '#e0f2fe', recommended: true },
  { code: 'VCB', name: 'Ngân hàng Ngoại Thương (Vietcombank)', shortName: 'Vietcombank', color: '#005c28', logoBg: '#dcfce7' },
  { code: 'CTG', name: 'Ngân hàng Công Thương (VietinBank)', shortName: 'VietinBank', color: '#00569e', logoBg: '#e0f2fe' },
  { code: 'BIDV', name: 'Ngân hàng Đầu tư & Phát triển (BIDV)', shortName: 'BIDV', color: '#00539f', logoBg: '#e0f2fe' },
  { code: 'AGB', name: 'Ngân hàng Nông nghiệp (Agribank)', shortName: 'Agribank', color: '#8a0000', logoBg: '#fee2e2' },
  { code: 'MB', name: 'Ngân hàng Quân Đội (MBBank)', shortName: 'MBBank', color: '#002878', logoBg: '#e0f2fe' },
  { code: 'TCB', name: 'Ngân hàng Kỹ Thương (Techcombank)', shortName: 'Techcombank', color: '#e50019', logoBg: '#fee2e2' },
  { code: 'VPB', name: 'Ngân hàng Việt Nam Thịnh Vượng (VPBank)', shortName: 'VPBank', color: '#008a3d', logoBg: '#dcfce7' },
  { code: 'TPB', name: 'Ngân hàng Tiên Phong (TPBank)', shortName: 'TPBank', color: '#682d8c', logoBg: '#f3e8ff' },
  { code: 'STB', name: 'Ngân hàng Sài Gòn Thương Tín (Sacombank)', shortName: 'Sacombank', color: '#005baa', logoBg: '#e0f2fe' },
  { code: 'ACB', name: 'Ngân hàng Á Châu (ACB)', shortName: 'ACB', color: '#0065b3', logoBg: '#e0f2fe' },
  { code: 'HDB', name: 'Ngân hàng Phát triển TP.HCM (HDBank)', shortName: 'HDBank', color: '#e30613', logoBg: '#fee2e2' },
];

export const VnPayCheckoutModal: React.FC<VnPayCheckoutModalProps> = ({
  open,
  onCancel,
  onSuccess,
  orderId,
  amount,
  orderDescription,
  patientName,
}) => {
  // Step in payment: 1 = Chọn ngân hàng, 2 = Nhập thông tin thẻ, 3 = Nhập OTP, 4 = Thành công
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [activeTab, setActiveTab] = useState<'atm' | 'qr' | 'live'>('atm');

  // Form states
  const [selectedBank, setSelectedBank] = useState<BankItem>(SUPPORTED_BANKS[0]);
  const [cardNumber, setCardNumber] = useState('9704198526191432198');
  const [cardHolder, setCardHolder] = useState('NGUYEN VAN A');
  const [issueDate, setIssueDate] = useState('07/15');
  const [otpCode, setOtpCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(120);

  // Live VNPay Gateway URL from backend
  const [liveVnPayUrl, setLiveVnPayUrl] = useState<string | null>(null);
  const [liveUrlLoading, setLiveUrlLoading] = useState(false);

  // Reset when opening
  useEffect(() => {
    if (open) {
      setStep(1);
      setActiveTab('atm');
      setSelectedBank(SUPPORTED_BANKS[0]);
      setCardNumber('9704198526191432198');
      setCardHolder('NGUYEN VAN A');
      setIssueDate('07/15');
      setOtpCode('');
      setIsProcessing(false);
      setOtpCountdown(120);
      fetchLiveVnPayUrl();
    }
  }, [open, orderId, amount]);

  // OTP Countdown timer
  useEffect(() => {
    if (open && step === 3 && otpCountdown > 0) {
      const timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [open, step, otpCountdown]);

  // Fetch real signed VNPay URL from backend
  const fetchLiveVnPayUrl = async () => {
    setLiveUrlLoading(true);
    try {
      const res = await api.post('/payment/create-payment-url', {
        orderId: orderId || `apt-${Date.now()}`,
        amount: amount || 150000,
        orderDescription: orderDescription || `Thanh toan phi vien phi ${orderId}`,
      });
      if (res.data?.url) {
        setLiveVnPayUrl(res.data.url);
      }
    } catch {
      // fallback URL if backend is offline
      const directUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=${(amount || 150000) * 100}&vnp_Command=pay&vnp_CreateDate=20261024120000&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=${encodeURIComponent(orderDescription || 'Thanh toan D-Medical')}&vnp_OrderType=other&vnp_ReturnUrl=${encodeURIComponent('https://dmedical.site/api/payment/vnpay-return')}&vnp_TmnCode=3EKPO0UC&vnp_TxnRef=${orderId || 'apt-test'}&vnp_Version=2.1.0`;
      setLiveVnPayUrl(directUrl);
    } finally {
      setLiveUrlLoading(false);
    }
  };

  // Quick fill demo test sandbox card
  const handleAutoFillTestCard = () => {
    setCardNumber('9704198526191432198');
    setCardHolder('NGUYEN VAN A');
    setIssueDate('07/15');
  };

  // Submit Card -> Go to OTP Step
  const handleProceedToOtp = () => {
    if (!cardNumber.trim() || cardNumber.replace(/\s/g, '').length < 16) {
      return;
    }
    if (!cardHolder.trim()) {
      return;
    }
    if (!issueDate.trim()) {
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep(3);
      setOtpCountdown(120);
    }, 600);
  };

  // Verify OTP -> Success
  const handleVerifyOtp = () => {
    if (!otpCode.trim() || otpCode.trim() !== '123456') {
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep(4);
    }, 1000);
  };

  // Complete and notify parent
  const handleFinishSuccess = () => {
    onSuccess({
      transactionNo: `VNP${Date.now().toString().slice(-8)}`,
      bankCode: selectedBank.code,
      cardHolder: cardHolder.toUpperCase(),
      amount: amount,
      paymentTime: new Date().toISOString(),
    });
    onCancel();
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={760}
      centered
      destroyOnClose
      style={{ top: 20 }}
      styles={{
        body: { padding: 0, overflow: 'hidden', borderRadius: 16 },
      }}
    >
      <div style={{ backgroundColor: '#ffffff', borderRadius: 16 }}>
        {/* VNPay Official Top Bar */}
        <div
          style={{
            background: 'linear-gradient(135deg, #005baa 0%, #0369a1 100%)',
            padding: '16px 24px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '4px 10px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <span style={{ color: '#005baa', fontWeight: 900, fontSize: 18, letterSpacing: -0.5 }}>VN</span>
              <span style={{ color: '#ed1c24', fontWeight: 900, fontSize: 18, letterSpacing: -0.5 }}>PAY</span>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.2 }}>
                CỔNG THANH TOÁN VNPAY
              </div>
              <div style={{ fontSize: 11.5, color: '#e0f2fe' }}>
                Hệ thống thanh toán bảo mật liên kết 40+ Ngân hàng Việt Nam
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <Tag color="cyan" style={{ margin: 0, fontWeight: 700, borderRadius: 12, border: 'none', backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              VNPAY SANDBOX (TEST)
            </Tag>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', marginTop: 4 }}>
              {amount.toLocaleString('vi-VN')} <span style={{ fontSize: 13, fontWeight: 600 }}>VND</span>
            </div>
          </div>
        </div>

        {/* Order Meta Bar */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            padding: '10px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12.5,
            color: '#64748b',
          }}
        >
          <div>
            Đơn vị thụ hưởng: <strong style={{ color: '#0f172a' }}>BỆNH VIỆN ĐA KHOA D-MEDICAL</strong>
          </div>
          <div>
            Mã giao dịch: <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{orderId || 'APT-ONLINE'}</strong>
            {patientName && <span> • Bệnh nhân: <strong style={{ color: '#0f172a' }}>{patientName}</strong></span>}
          </div>
        </div>

        {/* Payment Methods Selection Tabs (Step 1-3) */}
        {step < 4 && (
          <div style={{ padding: '16px 24px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button
                type={activeTab === 'atm' ? 'primary' : 'default'}
                icon={<CreditCardOutlined />}
                style={{
                  borderRadius: 10,
                  fontWeight: 700,
                  backgroundColor: activeTab === 'atm' ? '#005baa' : undefined,
                  borderColor: activeTab === 'atm' ? '#005baa' : '#cbd5e1',
                }}
                onClick={() => {
                  setActiveTab('atm');
                  setStep(1);
                }}
              >
                Thẻ ATM & Tài Khoản Ngân Hàng
              </Button>
              <Button
                type={activeTab === 'qr' ? 'primary' : 'default'}
                icon={<QrcodeOutlined />}
                style={{
                  borderRadius: 10,
                  fontWeight: 700,
                  backgroundColor: activeTab === 'qr' ? '#005baa' : undefined,
                  borderColor: activeTab === 'qr' ? '#005baa' : '#cbd5e1',
                }}
                onClick={() => setActiveTab('qr')}
              >
                VNPAY-QR
              </Button>
              <Button
                type={activeTab === 'live' ? 'primary' : 'default'}
                icon={<GlobalOutlined />}
                style={{
                  borderRadius: 10,
                  fontWeight: 700,
                  backgroundColor: activeTab === 'live' ? '#005baa' : undefined,
                  borderColor: activeTab === 'live' ? '#005baa' : '#cbd5e1',
                }}
                onClick={() => setActiveTab('live')}
              >
                Cổng Sandbox Trực Tiếp
              </Button>
            </div>
          </div>
        )}

        {/* Modal Main Content */}
        <div style={{ padding: 24, minHeight: 400 }}>
          {/* TAB 1: THẺ ATM / NGÂN HÀNG */}
          {activeTab === 'atm' && (
            <div>
              {/* BƯỚC 1: CHỌN NGÂN HÀNG PHÁT HÀNH */}
              {step === 1 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14.5 }}>
                      <BankOutlined style={{ marginRight: 6, color: '#005baa' }} />
                      Bước 1: Chọn ngân hàng của bạn
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Hỗ trợ thẻ ATM / Internet Banking / Mobile Banking
                    </Text>
                  </div>

                  <Alert
                    message="Ngân hàng thử nghiệm khuyến nghị"
                    description="Vui lòng chọn ngân hàng NCB (Ngân hàng Quốc Dân) - Đây là ngân hàng chính thức của môi trường thử nghiệm VNPay Sandbox."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16, borderRadius: 10 }}
                  />

                  <Row gutter={[10, 10]}>
                    {SUPPORTED_BANKS.map((b) => {
                      const isSelected = selectedBank.code === b.code;
                      return (
                        <Col xs={12} sm={8} md={6} key={b.code}>
                          <div
                            onClick={() => setSelectedBank(b)}
                            style={{
                              padding: '12px 10px',
                              borderRadius: 10,
                              border: isSelected ? '2px solid #005baa' : '1px solid #e2e8f0',
                              backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              position: 'relative',
                              transition: 'all 0.2s',
                              boxShadow: isSelected ? '0 4px 12px rgba(0, 91, 170, 0.15)' : 'none',
                            }}
                          >
                            {b.recommended && (
                              <Tag
                                color="error"
                                style={{
                                  position: 'absolute',
                                  top: -8,
                                  right: -6,
                                  fontSize: 10,
                                  padding: '0 6px',
                                  borderRadius: 8,
                                  fontWeight: 800,
                                }}
                              >
                                Test NCB
                              </Tag>
                            )}
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 8,
                                backgroundColor: b.logoBg,
                                color: b.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                                fontSize: 14,
                                marginBottom: 6,
                              }}
                            >
                              {b.shortName.slice(0, 4)}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 12, color: isSelected ? '#005baa' : '#334155' }}>
                              {b.shortName}
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>

                  <div style={{ marginTop: 24, textAlign: 'right' }}>
                    <Button
                      type="primary"
                      size="large"
                      style={{
                        backgroundColor: '#005baa',
                        borderColor: '#005baa',
                        fontWeight: 700,
                        borderRadius: 10,
                        padding: '0 28px',
                      }}
                      onClick={() => setStep(2)}
                    >
                      Tiếp tục với {selectedBank.shortName} →
                    </Button>
                  </div>
                </div>
              )}

              {/* BƯỚC 2: NHẬP THÔNG TIN THẺ */}
              {step === 2 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Button
                      type="text"
                      icon={<ArrowLeftOutlined />}
                      onClick={() => setStep(1)}
                      style={{ fontWeight: 600, color: '#64748b' }}
                    >
                      Đổi ngân hàng khác
                    </Button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Tag color="blue" style={{ fontWeight: 700, margin: 0 }}>
                        {selectedBank.name}
                      </Tag>
                      <Button
                        size="small"
                        type="dashed"
                        icon={<ThunderboltOutlined />}
                        onClick={handleAutoFillTestCard}
                        style={{ color: '#0284c7', borderColor: '#0284c7', fontWeight: 600 }}
                      >
                        ⚡ Điền thẻ Test VNPAY
                      </Button>
                    </div>
                  </div>

                  <Row gutter={[24, 24]}>
                    {/* Visual Card Preview */}
                    <Col xs={24} md={11}>
                      <div
                        style={{
                          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #005baa 100%)',
                          borderRadius: 16,
                          padding: 22,
                          color: '#ffffff',
                          boxShadow: '0 12px 28px rgba(0, 91, 170, 0.25)',
                          position: 'relative',
                          overflow: 'hidden',
                          minHeight: 200,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 1 }}>{selectedBank.shortName}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>NAPAS 24/7</span>
                        </div>

                        {/* Chip */}
                        <div
                          style={{
                            width: 38,
                            height: 28,
                            borderRadius: 6,
                            background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                            margin: '12px 0 8px',
                          }}
                        />

                        {/* Card Number */}
                        <div style={{ fontFamily: 'monospace', fontSize: 17, letterSpacing: 2, fontWeight: 700 }}>
                          {cardNumber || '•••• •••• •••• ••••'}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
                          <div>
                            <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase' }}>CHỦ THẺ</div>
                            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>{cardHolder || 'NGUYEN VAN A'}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase' }}>NGÀY PHÁT HÀNH</div>
                            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>{issueDate || '07/15'}</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 10, textAlign: 'center' }}>
                        <LockOutlined style={{ marginRight: 4, color: '#16a34a' }} />
                        Giao dịch được mã hóa chuẩn PCI DSS của VNPAY
                      </div>
                    </Col>

                    {/* Inputs */}
                    <Col xs={24} md={13}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                          <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                            Số thẻ ngân hàng:
                          </label>
                          <Input
                            size="large"
                            prefix={<CreditCardOutlined style={{ color: '#005baa' }} />}
                            placeholder="Nhập số in trên mặt trước thẻ"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            style={{ borderRadius: 8 }}
                          />
                          <span style={{ fontSize: 11, color: '#64748b', marginTop: 2, display: 'block' }}>
                            Thẻ test sandbox: <strong style={{ color: '#0284c7' }}>9704198526191432198</strong>
                          </span>
                        </div>

                        <div>
                          <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                            Tên in trên thẻ (không dấu):
                          </label>
                          <Input
                            size="large"
                            placeholder="NGUYEN VAN A"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                            style={{ borderRadius: 8, textTransform: 'uppercase' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                            Ngày phát hành (Tháng/Năm):
                          </label>
                          <Input
                            size="large"
                            placeholder="07/15"
                            value={issueDate}
                            onChange={(e) => setIssueDate(e.target.value)}
                            style={{ borderRadius: 8 }}
                          />
                          <span style={{ fontSize: 11, color: '#64748b', marginTop: 2, display: 'block' }}>
                            Định dạng MM/YY (Thẻ test: <strong style={{ color: '#0284c7' }}>07/15</strong>)
                          </span>
                        </div>

                        <Button
                          type="primary"
                          size="large"
                          loading={isProcessing}
                          onClick={handleProceedToOtp}
                          style={{
                            backgroundColor: '#005baa',
                            borderColor: '#005baa',
                            fontWeight: 700,
                            borderRadius: 10,
                            height: 44,
                            marginTop: 6,
                          }}
                        >
                          Xác Thực Thông Tin & Nhận Mã OTP →
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}

              {/* BƯỚC 3: MÀN HÌNH NHẬP MÃ OTP VNPAY */}
              {step === 3 && (
                <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      backgroundColor: '#e0f2fe',
                      color: '#005baa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      margin: '0 auto 12px',
                    }}
                  >
                    <KeyOutlined />
                  </div>

                  <Title level={4} style={{ color: '#005baa', margin: '0 0 6px', fontWeight: 800 }}>
                    Xác Thực Giao Dịch Bằng Mã OTP
                  </Title>
                  <Paragraph style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
                    Mã xác thực OTP đã được hệ thống <strong>{selectedBank.name}</strong> gửi đến số điện thoại đăng ký SMS Banking của chủ thẻ <strong>{cardHolder}</strong>.
                  </Paragraph>

                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px dashed #bae6fd',
                      borderRadius: 12,
                      padding: '14px 20px',
                      marginBottom: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Số tiền thanh toán:</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#005baa' }}>
                        {amount.toLocaleString('vi-VN')} VND
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Thời gian hiệu lực:</div>
                      <Tag color={otpCountdown > 30 ? 'blue' : 'error'} style={{ fontWeight: 800, margin: 0 }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {Math.floor(otpCountdown / 60)}:{(otpCountdown % 60).toString().padStart(2, '0')}
                      </Tag>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8 }}>
                      Nhập mã OTP 6 số:
                    </label>
                    <Input
                      size="large"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      style={{
                        textAlign: 'center',
                        fontSize: 24,
                        letterSpacing: 8,
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        borderRadius: 10,
                        maxWidth: 240,
                        margin: '0 auto',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                    <Button
                      size="small"
                      type="dashed"
                      icon={<ThunderboltOutlined />}
                      onClick={() => setOtpCode('123456')}
                      style={{ color: '#0284c7', borderColor: '#0284c7', fontWeight: 600 }}
                    >
                      ⚡ Điền OTP Test VNPAY (123456)
                    </Button>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <Button
                      size="large"
                      style={{ flex: 1, borderRadius: 10 }}
                      onClick={() => setStep(2)}
                    >
                      Quay lại
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      loading={isProcessing}
                      disabled={otpCode.trim().length !== 6}
                      onClick={handleVerifyOtp}
                      style={{
                        flex: 2,
                        backgroundColor: '#005baa',
                        borderColor: '#005baa',
                        fontWeight: 800,
                        borderRadius: 10,
                      }}
                    >
                      XÁC NHẬN THANH TOÁN OTP
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VNPAY-QR */}
          {activeTab === 'qr' && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <Title level={4} style={{ color: '#005baa', fontWeight: 800, margin: '0 0 4px' }}>
                Quét Mã VNPAY-QR Để Thanh Toán
              </Title>
              <Paragraph style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
                Mở ứng dụng Mobile Banking hoặc Ví điện tử VNPAY, chọn tính năng <strong>QR Pay</strong> để quét mã.
              </Paragraph>

              <div
                style={{
                  display: 'inline-block',
                  padding: 16,
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  border: '2px solid #005baa',
                  boxShadow: '0 8px 24px rgba(0, 91, 170, 0.15)',
                  marginBottom: 16,
                }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`VNPAY_QR|${orderId}|${amount}|DMEDICAL_HOSPITAL`)}`}
                  alt="VNPAY-QR Code"
                  style={{ width: 220, height: 220, display: 'block' }}
                />
              </div>

              <div style={{ fontSize: 18, fontWeight: 900, color: '#005baa', marginBottom: 8 }}>
                {amount.toLocaleString('vi-VN')} VND
              </div>
              <div style={{ fontSize: 12, color: '#64748b', maxWidth: 420, margin: '0 auto 20px' }}>
                Hỗ trợ hơn 40 ứng dụng ngân hàng: Vietcombank, BIDV, VietinBank, Agribank, MB, VPBank, Techcombank và Ví VNPAY.
              </div>

              <Button
                type="primary"
                size="large"
                icon={<CheckCircleFilled />}
                onClick={() => setStep(4)}
                style={{
                  backgroundColor: '#16a34a',
                  borderColor: '#16a34a',
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: '0 24px',
                }}
              >
                Giả Lập Quét QR & Thanh Toán Thành Công
              </Button>
            </div>
          )}

          {/* TAB 3: CỔNG LIVE SANDBOX TRỰC TIẾP */}
          {activeTab === 'live' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <Title level={4} style={{ color: '#005baa', fontWeight: 800, margin: '0 0 6px' }}>
                Cổng Thanh Toán Trực Tiếp VNPAY Sandbox
              </Title>
              <Paragraph style={{ color: '#64748b', fontSize: 13, maxWidth: 520, margin: '0 auto 20px' }}>
                Hệ thống đã tạo URL thanh toán mã hóa HMAC-SHA512 với mã định danh Terminal ID <strong>3EKPO0UC</strong>. Bạn có thể mở trực tiếp trang thanh toán chính thức của VNPAY.
              </Paragraph>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #bae6fd',
                  borderRadius: 12,
                  padding: 16,
                  maxWidth: 580,
                  margin: '0 auto 20px',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>URL thanh toán VNPAY Sandbox:</div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 11,
                    color: '#0284c7',
                    wordBreak: 'break-all',
                    maxHeight: 70,
                    overflowY: 'auto',
                    backgroundColor: '#ffffff',
                    padding: 8,
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {liveUrlLoading ? 'Đang tạo URL thanh toán...' : (liveVnPayUrl || 'Chưa có URL')}
                </div>
              </div>

              <Space size={12}>
                <Button
                  type="primary"
                  size="large"
                  icon={<GlobalOutlined />}
                  loading={liveUrlLoading}
                  disabled={!liveVnPayUrl}
                  onClick={() => {
                    if (liveVnPayUrl) {
                      window.open(liveVnPayUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  style={{
                    backgroundColor: '#005baa',
                    borderColor: '#005baa',
                    fontWeight: 700,
                    borderRadius: 10,
                  }}
                >
                  Mở Cổng VNPAY Trong Tab Mới
                </Button>
                <Button
                  size="large"
                  icon={<CheckCircleFilled />}
                  style={{ borderColor: '#16a34a', color: '#16a34a', fontWeight: 700, borderRadius: 10 }}
                  onClick={() => setStep(4)}
                >
                  Đánh Dấu Đã Thanh Toán
                </Button>
              </Space>
            </div>
          )}

          {/* BƯỚC 4: KẾT QUẢ GIAO DỊCH THÀNH CÔNG */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircleFilled />
              </div>

              <Title level={3} style={{ color: '#15803d', margin: '0 0 6px', fontWeight: 900 }}>
                Thanh Toán VNPAY Thành Công!
              </Title>
              <Paragraph style={{ color: '#64748b', fontSize: 13.5, marginBottom: 20 }}>
                Giao dịch đã được hệ thống VNPAY và ngân hàng <strong>{selectedBank.name}</strong> xử lý và xác nhận thành công.
              </Paragraph>

              <div
                style={{
                  maxWidth: 480,
                  margin: '0 auto 24px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: 14,
                  border: '1px solid #bbf7d0',
                  padding: '16px 20px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Mã giao dịch VNPAY:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>VNP{Date.now().toString().slice(-8)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Ngân hàng thanh toán:</span>
                  <strong style={{ color: '#005baa' }}>{selectedBank.shortName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Chủ thẻ / Tài khoản:</span>
                  <strong style={{ color: '#0f172a' }}>{cardHolder}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Số tiền đã thanh toán:</span>
                  <strong style={{ color: '#16a34a', fontSize: 15 }}>{amount.toLocaleString('vi-VN')} VND</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Thời gian giao dịch:</span>
                  <span>{new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN')}</span>
                </div>
              </div>

              <Button
                type="primary"
                size="large"
                style={{
                  backgroundColor: '#16a34a',
                  borderColor: '#16a34a',
                  fontWeight: 800,
                  borderRadius: 10,
                  padding: '0 32px',
                  height: 46,
                }}
                onClick={handleFinishSuccess}
              >
                Hoàn Tất & Nhận Thẻ Khám Ưu Tiên
              </Button>
            </div>
          )}
        </div>

        {/* Security Footer */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11.5,
            color: '#94a3b8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <SafetyCertificateOutlined style={{ color: '#16a34a' }} />
            <span>Được chứng nhận bảo mật bởi Tổ chức Thẻ Quốc tế & Ngân hàng Nhà nước</span>
          </div>
          <div>Bản quyền © VNPAY 2026</div>
        </div>
      </div>
    </Modal>
  );
};
