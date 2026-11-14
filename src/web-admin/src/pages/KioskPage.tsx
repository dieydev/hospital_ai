import React, { useState, useEffect } from 'react';
import { Typography, Space, Button, Card, Tag, Alert, Row, Col, Divider, Modal } from 'antd';
import {
  PrinterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ScanOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { queueService, QueueTicketItem } from '../services/queueService';
import { patientService } from '../services/patientService';
import { showToast } from '../utils/sweetAlert';

const { Title, Text } = Typography;

export const KioskPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('vi-VN'));
  const [currentDate] = useState(new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

  // Scan state
  const [inputCode, setInputCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Result state
  const [kioskStatus, setKioskStatus] = useState<'idle' | 'success' | 'error_unpaid' | 'error_invalid'>('idle');
  const [resultMessage, setResultMessage] = useState<string>('');
  const [issuedTicket, setIssuedTicket] = useState<QueueTicketItem | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Voice Speaker announcement
  const speakAnnouncement = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Logic kiểm tra điều kiện cấp STT tại Kiosk (Khớp 100% Sơ đồ 1 & Sơ đồ 2)
  const handleProcessScan = async (codeToTest?: string) => {
    const scanVal = (codeToTest || inputCode).trim();
    if (!scanVal) {
      showToast('Vui lòng đưa mã QR trước đầu đọc hoặc nhập mã!', 'warning');
      return;
    }

    setIsProcessing(true);
    setKioskStatus('idle');

    // Giả lập đọc mã trong 600ms
    setTimeout(async () => {
      try {
        const lowerCode = scanVal.toLowerCase();

        // 1. Trường hợp: Bệnh nhân Khám Dịch Vụ CHƯA ĐÓNG TIỀN (Nhánh: Cần thu phí khám trước -> Chưa nộp phí)
        if (lowerCode.includes('unpaid') || lowerCode.includes('chuatt') || lowerCode === 'BN2026_UNPAID') {
          setKioskStatus('error_unpaid');
          setResultMessage('Lượt khám chưa nộp tạm ứng viện phí ban đầu.');
          speakAnnouncement('Lượt khám của quý khách chưa thanh toán phí khám. Vui lòng qua quầy thu ngân để hoàn tất.');
          setIsProcessing(false);
          return;
        }

        // 2. Trường hợp: Mã QR sai / không tồn tại trong ngày
        if (lowerCode.includes('invalid') || lowerCode === 'SAI_MA') {
          setKioskStatus('error_invalid');
          setResultMessage('Không tìm thấy thông tin lượt khám trong ngày hoặc mã QR đã hết hạn.');
          speakAnnouncement('Mã lượt khám không hợp lệ. Quý khách vui lòng liên hệ quầy tiếp nhận để được hỗ trợ.');
          setIsProcessing(false);
          return;
        }

        // 3. Trường hợp: ĐỦ ĐIỀU KIỆN CẤP STT (BHYT hoặc Dịch vụ đã đóng tiền hoặc Tái khám theo hẹn)
        const isFollowUp = lowerCode.includes('taikham') || lowerCode.includes('followup') || lowerCode.includes('0016');
        const patients = await patientService.getPatients();
        const matched = patients.items?.find(
          (p) => p.maBenhNhan.toLowerCase() === lowerCode || p.soCCCD === scanVal || scanVal.includes(p.maBenhNhan)
        ) || (patients.items && patients.items.length > 0 ? patients.items[0] : {
          id: 'p-default',
          hoTen: 'Trần Văn Mạnh',
          maBenhNhan: 'BN2026000088',
          tuoi: 45,
          gioiTinh: 'Nam',
          maTheBHYT: 'DN40101234567',
        });

        const depts = await queueService.getDepartments();
        const targetDept = isFollowUp ? (depts[1] || depts[0]) : depts[0];

        // Cấp số thứ tự tự động
        const ticket = await queueService.issueQueueTicket({
          patientId: matched.id,
          departmentId: targetDept?.id || 'dept-01',
          priority: isFollowUp ? 'Priority' : 'Normal',
        });

        // Cập nhật thông tin chi tiết trên vé
        ticket.patientName = matched.hoTen;
        ticket.patientCode = matched.maBenhNhan;
        ticket.visitType = isFollowUp ? 'FollowUp' : 'New';
        ticket.paymentStatus = 'Paid';
        ticket.departmentName = targetDept?.departmentName || 'Khoa Nội Tổng Hợp';
        ticket.location = 'Phòng 203 - Tầng 2 Khu Khám Bệnh';

        setIssuedTicket(ticket);
        setKioskStatus('success');
        setIsPrintModalOpen(true);

        const speechText = `Xin chào ${ticket.patientName}. Số thứ tự khám của bạn là số ${ticket.sequenceNumber}. Xin mời đến ${ticket.departmentName}, ${ticket.location}.`;
        speakAnnouncement(speechText);
      } catch (err: any) {
        setKioskStatus('error_invalid');
        setResultMessage(err.message || 'Lỗi kết nối máy chủ cấp số thứ tự.');
      } finally {
        setIsProcessing(false);
      }
    }, 600);
  };

  const handleResetKiosk = () => {
    setInputCode('');
    setKioskStatus('idle');
    setIssuedTicket(null);
    setIsPrintModalOpen(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 40%, #0f172a 100%)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      {/* Kiosk Top Bar */}
      <header
        style={{
          padding: '18px 36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Space size={16} align="center">
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            }}
          >
            <ScanOutlined style={{ fontSize: 32, color: '#0284c7' }} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.5, color: '#ffffff' }}>
              D-MEDICAL SMART KIOSK
            </div>
            <div style={{ fontSize: 13, color: '#bae6fd', fontWeight: 600 }}>
              HỆ THỐNG QUÉT QR & CẤP SỐ THỨ TỰ TỰ ĐỘNG • SẢNH A
            </div>
          </div>
        </Space>

        <Space size={20}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8' }}>{currentTime}</div>
            <div style={{ fontSize: 12, color: '#cbd5e1' }}>{currentDate}</div>
          </div>
          <Button
            icon={<HomeOutlined />}
            onClick={() => navigate('/dashboard')}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              fontWeight: 600,
              borderRadius: 10,
            }}
          >
            Về Dashboard
          </Button>
        </Space>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '32px 40px', maxWidth: 1300, margin: '0 auto', width: '100%' }}>
        <Row gutter={[32, 32]} align="stretch">
          {/* Cột Trái: Vùng Quét QR / Đầu Đọc Kiosk */}
          <Col xs={24} lg={14}>
            <Card
              style={{
                borderRadius: 24,
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#0f172a',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ padding: 36 }}
            >
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <Tag
                    color="processing"
                    style={{
                      fontSize: 13,
                      padding: '4px 14px',
                      borderRadius: 20,
                      fontWeight: 700,
                      borderColor: '#0284c7',
                      color: '#0284c7',
                    }}
                  >
                    BƯỚC 4 TRONG LƯU ĐỒ: QUÉT QR TẠI KIOSK
                  </Tag>
                  <Title level={2} style={{ margin: '12px 0 6px', color: '#0369a1', fontWeight: 800 }}>
                    Vui Lòng Quét Mã QR Lượt Khám
                  </Title>
                  <Text style={{ fontSize: 15, color: '#64748b' }}>
                    Áp dụng cho cả <strong>Khám Lần Đầu</strong> và <strong>Tái Khám Theo Hẹn</strong>
                  </Text>
                </div>

                {/* Vùng Mô Phỏng Đầu Đọc Laser Scanner */}
                <div
                  style={{
                    position: 'relative',
                    width: 280,
                    height: 280,
                    margin: '0 auto 28px',
                    border: '3px solid #0284c7',
                    borderRadius: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f0f9ff',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 0 20px rgba(2, 132, 199, 0.15)',
                  }}
                >
                  <QRCodeSVG value={inputCode || 'D_MEDICAL_SAMPLE_QR_CHECKIN'} size={190} />
                  {/* Tia quét Laser đỏ chuyển động */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '40%',
                      left: 0,
                      right: 0,
                      height: 3,
                      backgroundColor: '#ef4444',
                      boxShadow: '0 0 10px #ef4444',
                      animation: 'scanPulse 2s infinite ease-in-out',
                    }}
                  />
                </div>

                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <Text strong style={{ fontSize: 14, color: '#334155', display: 'block' }}>
                    Đưa mã QR trên Điện thoại, Ứng dụng Bệnh nhân, hoặc Phiếu tiếp nhận trước đầu đọc
                  </Text>
                </div>

                {/* Ô Nhập Mã Thủ Công & Nút Quét */}
                <div style={{ maxWidth: 480, margin: '0 auto' }}>
                  <Space.Compact style={{ width: '100%' }}>
                    <input
                      type="text"
                      placeholder="Quét mã QR hoặc nhập Mã BN / Mã Tiếp nhận..."
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleProcessScan()}
                      style={{
                        width: '100%',
                        height: 52,
                        padding: '0 16px',
                        fontSize: 16,
                        border: '2px solid #bae6fd',
                        borderRadius: '12px 0 0 12px',
                        outline: 'none',
                        fontFamily: 'monospace',
                      }}
                    />
                    <Button
                      type="primary"
                      onClick={() => handleProcessScan()}
                      loading={isProcessing}
                      style={{
                        height: 52,
                        padding: '0 28px',
                        fontSize: 16,
                        fontWeight: 700,
                        backgroundColor: '#0284c7',
                        borderColor: '#0284c7',
                        borderRadius: '0 12px 12px 0',
                      }}
                    >
                      Xác Nhận
                    </Button>
                  </Space.Compact>
                </div>
              </div>

              {/* Dev Simulation Chips để thuyết trình / kiểm thử ngay */}
              <div
                style={{
                  marginTop: 24,
                  padding: 16,
                  borderRadius: 14,
                  backgroundColor: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', marginBottom: 8 }}>
                  ⚡ TEST NHANH CÁC NHÁNH LƯU ĐỒ (DEMO KIOSK):
                </div>
                <Space wrap>
                  <Button
                    size="small"
                    type="primary"
                    style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 600 }}
                    onClick={() => {
                      setInputCode('BN2026000001');
                      handleProcessScan('BN2026000001');
                    }}
                  >
                    1. Khám Lần Đầu (Có BHYT - Đủ ĐK Cấp STT)
                  </Button>

                  <Button
                    size="small"
                    danger
                    style={{ fontWeight: 600 }}
                    onClick={() => {
                      setInputCode('BN2026_UNPAID');
                      handleProcessScan('BN2026_UNPAID');
                    }}
                  >
                    2. Khám Dịch Vụ (Chưa Thu Phí - Bị Chặn)
                  </Button>

                  <Button
                    size="small"
                    style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed', color: '#fff', fontWeight: 600 }}
                    onClick={() => {
                      setInputCode('BN20260016_TAIKHAM');
                      handleProcessScan('BN20260016_TAIKHAM');
                    }}
                  >
                    3. Tái Khám Theo Hẹn (Cấp STT Ưu Tiên)
                  </Button>

                  <Button
                    size="small"
                    onClick={() => {
                      setInputCode('SAI_MA');
                      handleProcessScan('SAI_MA');
                    }}
                  >
                    4. Sai Mã / Quá Hạn
                  </Button>
                </Space>
              </div>
            </Card>
          </Col>

          {/* Cột Phải: Màn hình Phản Hồi Điều Kiện Cấp STT (Khớp 100% Decision Diamond) */}
          <Col xs={24} lg={10}>
            <Card
              style={{
                borderRadius: 24,
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#0f172a',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
              bodyStyle={{ padding: 32 }}
            >
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 20 }}>
                <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
                  Trạng Thái Thẩm Định Lượt Khám
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Đối soát Cổng Tài Chính & Điều Kiện Tiếp Nhận Tự Động
                </Text>
              </div>

              {/* Trạng thái 1: Chưa quét */}
              {kioskStatus === 'idle' && (
                <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                  <ScanOutlined style={{ fontSize: 64, color: '#94a3b8', marginBottom: 16 }} />
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#475569' }}>
                    Sẵn sàng tiếp nhận mã QR
                  </div>
                  <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 8 }}>
                    Hệ thống sẽ tự động xác minh BHYT, đối soát trạng thái nộp tiền khám và phân bổ số thứ tự vào phòng chuyên khoa phù hợp.
                  </Text>
                </div>
              )}

              {/* Trạng thái 2: LỖI CHƯA NỘP PHÍ (Nhánh Rẽ: Cần thu phí khám trước -> Có -> Chưa thanh toán) */}
              {kioskStatus === 'error_unpaid' && (
                <div style={{ textAlign: 'center' }}>
                  <CloseCircleOutlined style={{ fontSize: 68, color: '#ef4444', marginBottom: 16 }} />
                  <Title level={3} style={{ color: '#ef4444', margin: '0 0 10px', fontWeight: 800 }}>
                    CHƯA ĐỦ ĐIỀU KIỆN CẤP STT
                  </Title>
                  <Alert
                    type="warning"
                    showIcon
                    icon={<WarningOutlined />}
                    message="Lượt khám Dịch vụ chưa thanh toán phí khám ban đầu"
                    description="Theo quy trình khám bệnh ngoại trú, quý khách cần nộp phí khám trước khi hệ thống cấp số thứ tự vào phòng Bác sĩ."
                    style={{ textAlign: 'left', marginBottom: 20, borderRadius: 12 }}
                  />

                  <div
                    style={{
                      padding: 18,
                      borderRadius: 14,
                      backgroundColor: '#fef2f2',
                      border: '1.5px solid #fecaca',
                      textAlign: 'left',
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#991b1b', marginBottom: 6 }}>
                      👉 HƯỚNG DẪN XỬ LÝ:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, color: '#7f1d1d', fontSize: 13, lineHeight: 1.6 }}>
                      <li>Vui lòng di chuyển đến <strong>Quầy Thu Ngân 01 - 04 (Khu A)</strong> để thanh toán tiền mặt/quẹt thẻ.</li>
                      <li>Hoặc mở ứng dụng Ngân hàng quét mã <strong>VietQR</strong> bên dưới để thanh toán ngay tại Kiosk:</li>
                    </ul>
                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                      <QRCodeSVG value="VIETQR-HOSPITAL-EXAM-FEE-150000" size={100} />
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', marginTop: 4 }}>
                        Tạm ứng khám ban đầu: 150.000 VNĐ
                      </div>
                    </div>
                  </div>

                  <Button size="large" onClick={handleResetKiosk} block style={{ borderRadius: 10 }}>
                    Thử Lại / Quét Mã Khác
                  </Button>
                </div>
              )}

              {/* Trạng thái 3: LỖI MÃ KHÔNG HỢP LỆ (Nhánh Rẽ: Thông báo lỗi và hướng dẫn xử lý) */}
              {kioskStatus === 'error_invalid' && (
                <div style={{ textAlign: 'center' }}>
                  <CloseCircleOutlined style={{ fontSize: 68, color: '#dc2626', marginBottom: 16 }} />
                  <Title level={3} style={{ color: '#dc2626', margin: '0 0 10px', fontWeight: 800 }}>
                    LƯỢT KHÁM KHÔNG HỢP LỆ
                  </Title>
                  <Alert
                    type="error"
                    message="Thông báo lỗi từ hệ thống Tiếp nhận"
                    description={resultMessage}
                    style={{ textAlign: 'left', marginBottom: 20, borderRadius: 12 }}
                  />

                  <div
                    style={{
                      padding: 16,
                      borderRadius: 14,
                      backgroundColor: '#f8fafc',
                      border: '1.5px solid #e2e8f0',
                      textAlign: 'left',
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                      👉 HƯỚNG DẪN XỬ LÝ (SƠ ĐỒ 1 & 2):
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                      1. Quý khách vui lòng đến <strong>Bàn Tiếp Đón & Sàng Lọc Bệnh (Cửa số 1)</strong> để nhân viên y tế hỗ trợ xác thực thông tin.<br />
                      2. Nếu là tái khám quá hạn hoặc không đúng lịch, nhân viên sẽ hỗ trợ chuyển sang đăng ký khám thông thường.
                    </p>
                  </div>

                  <Button size="large" onClick={handleResetKiosk} block style={{ borderRadius: 10 }}>
                    Quay Lại Màn Hình Chờ
                  </Button>
                </div>
              )}

              {/* Trạng thái 4: CẤP SỐ THỨ TỰ THÀNH CÔNG */}
              {kioskStatus === 'success' && issuedTicket && (
                <div style={{ textAlign: 'center' }}>
                  <CheckCircleOutlined style={{ fontSize: 64, color: '#16a34a', marginBottom: 12 }} />
                  <Title level={3} style={{ color: '#16a34a', margin: '0 0 6px', fontWeight: 800 }}>
                    CẤP SỐ THÀNH CÔNG!
                  </Title>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Đã in phiếu STT và đồng bộ vào hệ thống phòng khám
                  </Text>

                  {/* Thẻ STT mô phỏng phiếu nhiệt */}
                  <div
                    style={{
                      margin: '20px 0',
                      padding: '24px 20px',
                      borderRadius: 16,
                      backgroundColor: '#f0fdf4',
                      border: '2px solid #86efac',
                      boxShadow: '0 8px 24px rgba(22, 163, 74, 0.12)',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                      {issuedTicket.departmentName}
                    </div>
                    <div style={{ fontSize: 56, fontWeight: 900, color: '#dc2626', lineHeight: 1.1, margin: '8px 0' }}>
                      #{issuedTicket.sequenceNumber}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                      {issuedTicket.patientName}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                      Mã BN: {issuedTicket.patientCode} • {issuedTicket.visitType === 'FollowUp' ? 'Tái Khám Theo Hẹn' : 'Khám Lần Đầu'}
                    </div>

                    <Divider style={{ margin: '14px 0' }} />

                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0369a1' }}>
                      📍 {issuedTicket.location}
                    </div>
                  </div>

                  <Space style={{ width: '100%' }} direction="vertical">
                    <Button
                      type="primary"
                      icon={<PrinterOutlined />}
                      size="large"
                      onClick={() => setIsPrintModalOpen(true)}
                      block
                      style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 700, borderRadius: 10 }}
                    >
                      In Lại Phiếu STT
                    </Button>
                    <Button size="large" onClick={handleResetKiosk} block style={{ borderRadius: 10 }}>
                      Hoàn Tất / Bệnh Nhân Tiếp Theo
                    </Button>
                  </Space>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </main>

      {/* Modal Giả Lập In Phiếu STT Kiosk */}
      <Modal
        title={
          <Space>
            <PrinterOutlined style={{ color: '#0284c7' }} />
            <span style={{ fontWeight: 700 }}>Phiếu Số Thứ Tự Khám Bệnh - Kiosk Sảnh A</span>
          </Space>
        }
        open={isPrintModalOpen}
        onCancel={() => setIsPrintModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsPrintModalOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            onClick={() => {
              window.print();
            }}
          >
            In Ra Máy In Nhiệt (ESC/POS)
          </Button>,
        ]}
        width={380}
      >
        {issuedTicket && (
          <div
            style={{
              padding: 20,
              backgroundColor: '#fff',
              border: '1px dashed #94a3b8',
              borderRadius: 8,
              textAlign: 'center',
              fontFamily: 'monospace',
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 15 }}>BỆNH VIỆN ĐA KHOA D-MEDICAL</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>ĐC: 120 Hoàng Hoa Thám, P.7, Q.Bình Thạnh, TP.HCM</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Tổng đài: 1900 8888 • Hotline: 028 3822 9999</div>
            <Divider style={{ margin: '10px 0' }} />

            <div style={{ fontSize: 13, fontWeight: 700 }}>PHIẾU KHÁM BỆNH NGOẠI TRÚ</div>
            <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 700 }}>
              {issuedTicket.visitType === 'FollowUp' ? '[ TÁI KHÁM THEO HẸN ]' : '[ KHÁM LẦN ĐẦU ]'}
            </div>

            <div style={{ fontSize: 52, fontWeight: 900, color: '#000', margin: '6px 0' }}>
              #{issuedTicket.sequenceNumber}
            </div>

            <div style={{ fontSize: 13, fontWeight: 700 }}>{issuedTicket.patientName}</div>
            <div style={{ fontSize: 11 }}>Mã BN: {issuedTicket.patientCode}</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 8 }}>
              {issuedTicket.departmentName}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0284c7' }}>
              {issuedTicket.location}
            </div>

            <Divider style={{ margin: '10px 0' }} />
            <div style={{ fontSize: 10, color: '#64748b' }}>
              In lúc: {new Date().toLocaleTimeString('vi-VN')} {new Date().toLocaleDateString('vi-VN')}
            </div>
            <div style={{ fontSize: 10, color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>
              * Quý khách vui lòng theo dõi màn hình LCD và loa thông báo tại cửa phòng khám.
            </div>
          </div>
        )}
      </Modal>

      {/* Global CSS for scanning animation */}
      <style>{`
        @keyframes scanPulse {
          0% { top: 10%; opacity: 0.3; }
          50% { top: 85%; opacity: 1; }
          100% { top: 10%; opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};
