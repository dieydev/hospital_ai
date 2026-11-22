import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Typography,
  Space,
  Button,
  Card,
  Tag,
  Alert,
  Row,
  Col,
  Divider,
  Modal,
  Table,
  Badge,
} from 'antd';
import {
  PrinterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ScanOutlined,
  HomeOutlined,
  ReloadOutlined,
  VideoCameraOutlined,
  VideoCameraAddOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { queueService, QueueTicketItem } from '../services/queueService';
import { appointmentService } from '../services/appointmentService';
import { patientService } from '../services/patientService';
import { showToast } from '../utils/sweetAlert';

const { Title, Text } = Typography;

export const KioskPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('vi-VN'));
  const [currentDate] = useState(
    new Date().toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  );

  // Scan input & state
  const [inputCode, setInputCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Result state
  const [kioskStatus, setKioskStatus] = useState<
    'idle' | 'success' | 'error_unpaid' | 'error_not_found'
  >('idle');
  const [resultMessage, setResultMessage] = useState<string>('');
  const [matchedTicket, setMatchedTicket] = useState<QueueTicketItem | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Live Queue Tickets from Reception (Đối soát thực tế)
  const [liveQueue, setLiveQueue] = useState<QueueTicketItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // Camera stream state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live queue from reception
  const fetchLiveQueue = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const tickets = await queueService.getTodayQueue();
      setLiveQueue(tickets);
    } catch (err) {
      console.warn('Lỗi tải hàng chờ tại Kiosk:', err);
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveQueue();
    // Auto focus input for physical barcode scanner guns
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [fetchLiveQueue]);

  // Voice speaker announcement
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

  // Camera toggle handler
  const handleToggleCamera = async () => {
    if (isCameraActive) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      setIsCameraActive(false);
      setCameraError(null);
    } else {
      setCameraError(null);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Trình duyệt không hỗ trợ truy cập camera trực tiếp.');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
        showToast('Đã kích hoạt camera máy quét Kiosk!', 'success');
      } catch (err: any) {
        setCameraError(err.message || 'Không thể mở webcam hoặc quyền bị chặn.');
        setIsCameraActive(false);
      }
    }
  };

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Core Kiosk Processing Logic: Đối soát chính xác lượt tiếp nhận mà Lễ tân đã làm
  const handleProcessScan = async (codeToTest?: string) => {
    const rawVal = (codeToTest || inputCode).trim();
    if (!rawVal) {
      showToast('Vui lòng đưa mã QR trước đầu đọc hoặc nhập mã tiếp nhận!', 'warning');
      return;
    }

    setIsProcessing(true);
    setKioskStatus('idle');

    setTimeout(async () => {
      try {
        let cleanKey = rawVal;
        let isUnpaidTest = false;

        // 1. Phân tích chuỗi URL: https://dmedical.hospital.vn/queue/ticket-101 hoặc /queue/101
        if (cleanKey.includes('/queue/')) {
          const parts = cleanKey.split('/queue/');
          if (parts[1]) cleanKey = parts[1].trim();
        }

        // 2. Phân tích định dạng MEDQR:
        // Ví dụ: MEDQR|apt-001|BN20260015|... hoặc MEDQR|TAIKHAM|BN20260016|...
        if (cleanKey.startsWith('MEDQR|')) {
          const parts = cleanKey.split('|');
          if (parts.length >= 3) {
            cleanKey = parts[2] || parts[1];
          } else if (parts.length >= 2) {
            cleanKey = parts[1];
          }
        }

        // 3. Phân tích chuỗi JSON nếu QR chứa payload đối tượng
        if (cleanKey.startsWith('{') && cleanKey.endsWith('}')) {
          try {
            const parsed = JSON.parse(cleanKey);
            cleanKey = parsed.ticketId || parsed.appointmentId || parsed.patientCode || cleanKey;
          } catch {}
        }

        const normalizedKey = cleanKey.toLowerCase().replace('#', '').replace('stt', '').trim();

        // Kiểm tra trigger test chưa nộp phí
        if (
          normalizedKey.includes('unpaid') ||
          normalizedKey.includes('chuatt') ||
          rawVal === 'BN2026_UNPAID'
        ) {
          isUnpaidTest = true;
        }

        // 4. Tra cứu đối soát trong danh sách Hàng chờ Tiếp nhận (Queue Tickets) do Lễ tân tạo
        const currentQueue = await queueService.getTodayQueue();
        setLiveQueue(currentQueue);

        const foundInQueue = currentQueue.find((t) => {
          const tId = t.id.toLowerCase();
          const tCode = t.patientCode.toLowerCase();
          const tSeq = String(t.sequenceNumber);
          const tCccd = t.identityCardNumber || '';
          const tBhyt = (t.healthInsuranceNumber || '').toLowerCase();

          return (
            tId === normalizedKey ||
            tCode === normalizedKey ||
            tSeq === normalizedKey ||
            tCccd === cleanKey ||
            tBhyt === normalizedKey ||
            cleanKey.toLowerCase().includes(tCode) ||
            cleanKey.toLowerCase().includes(tId)
          );
        });

        if (foundInQueue) {
          // TÌM THẤY LƯỢT KHÁM DO TIẾP NHẬN ĐÃ TẠO!
          setMatchedTicket(foundInQueue);

          // Kiểm tra điều kiện Cổng Tài Chính (Sơ đồ 1 & 2): Chưa đóng tiền khám dịch vụ
          if (isUnpaidTest || foundInQueue.paymentStatus === 'Unpaid') {
            setKioskStatus('error_unpaid');
            setResultMessage(
              `Bệnh nhân ${foundInQueue.patientName} (${foundInQueue.patientCode}) đã được cấp số #${foundInQueue.sequenceNumber} tại ${foundInQueue.departmentName}, nhưng chưa hoàn tất đóng tạm ứng viện phí khám ban đầu.`
            );
            speakAnnouncement(
              `Lượt khám của bệnh nhân ${foundInQueue.patientName} chưa thanh toán phí khám. Vui lòng qua quầy thu ngân hoặc quét mã VietQR để hoàn tất.`
            );
            setIsProcessing(false);
            return;
          }

          // Đủ điều kiện -> Hiển thị Số Thứ Tự và phòng khám cho người bệnh
          setKioskStatus('success');
          setResultMessage('');
          const speechText = `Xin chào ${foundInQueue.patientName}. Số thứ tự khám của bạn là số ${foundInQueue.sequenceNumber}. Xin mời đến ${foundInQueue.departmentName}, ${foundInQueue.location}.`;
          speakAnnouncement(speechText);
          setIsProcessing(false);
          return;
        }

        // 5. Tra cứu trong Lịch hẹn khám Online (Appointments) nếu bệnh nhân đặt qua App và tự check-in
        const appointments = await appointmentService.getAppointments();
        const foundApt = appointments.find((a) => {
          const aId = a.id.toLowerCase();
          const aCode = a.patientCode.toLowerCase();
          const aPhone = a.patientPhone;
          return (
            aId === normalizedKey ||
            aCode === normalizedKey ||
            aPhone === cleanKey ||
            (a.qrCode && a.qrCode.toLowerCase().includes(normalizedKey))
          );
        });

        if (foundApt) {
          // Idempotency: Kiểm tra nếu lịch hẹn này đã được cấp STT trong ngày (chống cấp trùng STT tại Kiosk)
          const existingTicket = currentQueue.find(
            (t) => (t.appointmentId && t.appointmentId === foundApt.id) ||
                   (t.patientCode && t.patientCode.toLowerCase() === foundApt.patientCode.toLowerCase())
          );

          if (existingTicket) {
            if (existingTicket.status === 'Finished') {
              setKioskStatus('error_not_found');
              setResultMessage(`Lịch hẹn của bệnh nhân ${foundApt.patientName} đã hoàn thành lượt khám hôm nay.`);
              speakAnnouncement(`Lượt khám của ${foundApt.patientName} đã được hoàn tất.`);
              setIsProcessing(false);
              return;
            }

            // Đã có STT đang chờ hoặc đang gọi -> Hiển thị lại STT hiện có, không cấp trùng
            setMatchedTicket(existingTicket);
            setKioskStatus('success');
            setResultMessage('');
            const speechText = `Bệnh nhân ${existingTicket.patientName} đã có số thứ tự #${existingTicket.sequenceNumber}. Xin mời đến ${existingTicket.departmentName}, ${existingTicket.location}.`;
            speakAnnouncement(speechText);
            setIsProcessing(false);
            return;
          }

          // Lấy mã ID bệnh nhân thực tế từ hệ thống để cấp STT chuẩn CSDL
          let realPatientId = '';
          try {
            const patientData = await patientService.getPatientByCode(foundApt.patientCode);
            if (patientData && patientData.id) {
              realPatientId = patientData.id;
            }
          } catch {}

          if (!realPatientId) {
            realPatientId = '00000000-0000-0000-0000-' + foundApt.patientCode.padEnd(12, '0').slice(-12);
          }

          // Bệnh nhân có lịch hẹn đặt trước -> Kiosk tự động cấp STT vào phòng khám theo hẹn!
          const depts = await queueService.getDepartments();
          const targetDept =
            depts.find((d) =>
              d.departmentName.toLowerCase().includes(foundApt.departmentName.toLowerCase())
            ) || depts[0];

          const newTicket = await queueService.issueQueueTicket({
            patientId: realPatientId,
            appointmentId: foundApt.id,
            departmentId: targetDept.id,
            priority: foundApt.appointmentType === 'FollowUp' ? 'Priority' : 'Normal',
            patientName: foundApt.patientName,
            patientCode: foundApt.patientCode,
            patientAge: foundApt.patientAge,
            patientGender: foundApt.patientGender,
            visitType: foundApt.appointmentType === 'FollowUp' ? 'FollowUp' : 'New',
            paymentStatus: 'Paid',
          });

          await appointmentService.updateStatus(foundApt.id, 'Completed');

          setMatchedTicket(newTicket);
          setKioskStatus('success');
          setResultMessage('');

          const speechText = `Xác nhận lịch hẹn thành công cho ${newTicket.patientName}. Số thứ tự của bạn là ${newTicket.sequenceNumber}. Xin mời đến ${newTicket.departmentName}, ${newTicket.location}.`;
          speakAnnouncement(speechText);

          // Cập nhật lại danh sách hàng chờ
          const refreshedQueue = await queueService.getTodayQueue();
          setLiveQueue(refreshedQueue);
          setIsProcessing(false);
          return;
        }

        // 6. Xử lý trường hợp test UNPAID giả lập không gắn phiếu
        if (isUnpaidTest) {
          setKioskStatus('error_unpaid');
          setResultMessage(
            'Lượt khám Dịch Vụ chưa thanh toán tạm ứng viện phí ban đầu (150.000 VNĐ).'
          );
          speakAnnouncement(
            'Lượt khám của quý khách chưa thanh toán phí khám. Vui lòng qua quầy thu ngân để hoàn tất.'
          );
          setIsProcessing(false);
          return;
        }

        // 7. KHÔNG TÌM THẤY -> BÁO LỖI VÀ HƯỚNG DẪN RA QUẦY TIẾP NHẬN
        // (TUYỆT ĐỐI KHÔNG TỰ Ý GÁN DỮ LIỆU BỆNH NHÂN KHÁC)
        setKioskStatus('error_not_found');
        setResultMessage(
          `Không tìm thấy thông tin lượt tiếp nhận hoặc lịch hẹn nào với mã "${rawVal}" trong ngày hôm nay.`
        );
        speakAnnouncement(
          'Không tìm thấy thông tin lượt khám của quý khách. Xin vui lòng liên hệ quầy tiếp nhận để được nhân viên y tế hỗ trợ.'
        );
        setIsProcessing(false);
      } catch (err: any) {
        setKioskStatus('error_not_found');
        setResultMessage(err.message || 'Lỗi kết nối máy chủ tiếp nhận Kiosk.');
        setIsProcessing(false);
      }
    }, 450);
  };

  const handleResetKiosk = () => {
    setInputCode('');
    setKioskStatus('idle');
    setMatchedTicket(null);
    setIsPrintModalOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
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
      {/* Top Header */}
      <header
        style={{
          padding: '16px 36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Space size={16} align="center">
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            }}
          >
            <ScanOutlined style={{ fontSize: 30, color: '#0284c7' }} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, color: '#ffffff' }}>
              D-MEDICAL SMART KIOSK
            </div>
            <div style={{ fontSize: 13, color: '#bae6fd', fontWeight: 600 }}>
              MÁY QUÉT ĐẦU ĐỌC CHECK-IN & TRA CỨU SỐ THỨ TỰ TỰ ĐỘNG • SẢNH A
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

      {/* Main Container */}
      <main style={{ flex: 1, padding: '28px 36px', maxWidth: 1320, margin: '0 auto', width: '100%' }}>
        <Row gutter={[28, 28]} align="stretch">
          {/* CỘT TRÁI: ĐẦU ĐỌC QUANG HỌC MÁY QUÉT KIOSK */}
          <Col xs={24} lg={13}>
            <Card
              style={{
                borderRadius: 24,
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.96)',
                color: '#0f172a',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              bodyStyle={{ padding: 32 }}
            >
              <div>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
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
                    BƯỚC 4: QUÉT MÃ TIẾP NHẬN ĐÃ CẤP TẠI QUẦY
                  </Tag>
                  <Title level={2} style={{ margin: '10px 0 4px', color: '#0369a1', fontWeight: 800 }}>
                    Đầu Đọc Máy Quét Kiosk
                  </Title>
                  <Text style={{ fontSize: 14, color: '#64748b' }}>
                    Đưa mã QR trên <strong>Phiếu tiếp nhận</strong>, <strong>Thẻ BHYT/CCCD</strong> hoặc <strong>Ứng dụng Bệnh nhân</strong> trước ống kính
                  </Text>
                </div>

                {/* KHUNG QUÉT QUANG HỌC CHUYÊN DỤNG (SCANNER VIEWFINDER) */}
                <div
                  style={{
                    position: 'relative',
                    width: 310,
                    height: 290,
                    margin: '0 auto 20px',
                    borderRadius: 20,
                    backgroundColor: '#0a192f',
                    overflow: 'hidden',
                    boxShadow: '0 12px 35px rgba(2, 132, 199, 0.25), inset 0 0 25px rgba(0,0,0,0.8)',
                    border: '2px solid #0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Camera thật nếu người dùng bật */}
                  {isCameraActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    /* Mô phỏng đầu đọc quang học Kiosk thông minh */
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        position: 'relative',
                      }}
                    >
                      {/* Lưới radar mờ */}
                      <div
                        style={{
                          position: 'absolute',
                          width: 190,
                          height: 190,
                          borderRadius: '50%',
                          border: '1px dashed rgba(56, 189, 248, 0.25)',
                          animation: 'radarSpin 10s linear infinite',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          width: 110,
                          height: 110,
                          borderRadius: '50%',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                        }}
                      />

                      <ScanOutlined
                        style={{
                          fontSize: 68,
                          color: '#38bdf8',
                          opacity: 0.85,
                          marginBottom: 12,
                          filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.5))',
                        }}
                      />
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#e0f2fe',
                          letterSpacing: 1.5,
                          textTransform: 'uppercase',
                        }}
                      >
                        Vùng Quét Mã Tiếp Nhận
                      </div>
                      <div style={{ fontSize: 11, color: '#38bdf8', marginTop: 4 }}>
                        Đầu đọc quang học đang hoạt động
                      </div>
                    </div>
                  )}

                  {/* 4 Góc Định Vị Viewfinder (Reticle Corners) */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      width: 28,
                      height: 28,
                      borderTop: '4px solid #38bdf8',
                      borderLeft: '4px solid #38bdf8',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      width: 28,
                      height: 28,
                      borderTop: '4px solid #38bdf8',
                      borderRight: '4px solid #38bdf8',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 16,
                      left: 16,
                      width: 28,
                      height: 28,
                      borderBottom: '4px solid #38bdf8',
                      borderLeft: '4px solid #38bdf8',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 16,
                      right: 16,
                      width: 28,
                      height: 28,
                      borderBottom: '4px solid #38bdf8',
                      borderRight: '4px solid #38bdf8',
                    }}
                  />

                  {/* Tâm ngắm Crosshair */}
                  <div
                    style={{
                      position: 'absolute',
                      width: 18,
                      height: 18,
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      borderRadius: '50%',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Tia quét Laser đỏ chuyển động liên tục */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: 3,
                      backgroundColor: '#ef4444',
                      boxShadow: '0 0 12px 2px #ef4444, 0 0 4px #ffffff',
                      animation: 'scanLaser 2.2s ease-in-out infinite alternate',
                    }}
                  />
                </div>

                {/* Trạng thái đầu đọc & Toggle Camera */}
                <div style={{ textAlign: 'center', marginBottom: 18 }}>
                  <Space size={14}>
                    <Tag
                      color="cyan"
                      style={{
                        padding: '3px 12px',
                        borderRadius: 12,
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#22c55e',
                          marginRight: 6,
                          boxShadow: '0 0 6px #22c55e',
                        }}
                      />
                      Cảm biến Barcode / QR: Sẵn sàng
                    </Tag>

                    <Button
                      size="small"
                      icon={isCameraActive ? <VideoCameraAddOutlined /> : <VideoCameraOutlined />}
                      onClick={handleToggleCamera}
                      style={{
                        borderRadius: 8,
                        borderColor: '#0284c7',
                        color: '#0284c7',
                        fontWeight: 600,
                      }}
                    >
                      {isCameraActive ? 'Tắt Camera Webcam' : 'Bật Camera Webcam'}
                    </Button>
                  </Space>
                  {cameraError && (
                    <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>
                      ⚠️ {cameraError}
                    </div>
                  )}
                </div>

                {/* Ô Nhập Mã / Bắn Mã Máy Quét Barcode Tự Động */}
                <div style={{ maxWidth: 500, margin: '0 auto' }}>
                  <Space.Compact style={{ width: '100%' }}>
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Quét mã QR hoặc nhập Mã BN / STT / CCCD..."
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleProcessScan()}
                      style={{
                        width: '100%',
                        height: 50,
                        padding: '0 16px',
                        fontSize: 15,
                        border: '2px solid #bae6fd',
                        borderRadius: '12px 0 0 12px',
                        outline: 'none',
                        fontFamily: 'monospace',
                        color: '#0f172a',
                        fontWeight: 600,
                      }}
                    />
                    <Button
                      type="primary"
                      onClick={() => handleProcessScan()}
                      loading={isProcessing}
                      style={{
                        height: 50,
                        padding: '0 26px',
                        fontSize: 15,
                        fontWeight: 700,
                        backgroundColor: '#0284c7',
                        borderColor: '#0284c7',
                        borderRadius: '0 12px 12px 0',
                      }}
                    >
                      Quét Mã
                    </Button>
                  </Space.Compact>
                </div>
              </div>

              {/* Nút Test Nhanh Kịch Bản */}
              <div
                style={{
                  marginTop: 22,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#0369a1',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <ThunderboltOutlined /> THỬ NHANH CÁC TÌNH HUỐNG THỰC TẾ:
                </div>
                <Space wrap size={[8, 8]}>
                  <Button
                    size="small"
                    type="primary"
                    style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 600 }}
                    onClick={() => {
                      setInputCode('BN20260013');
                      handleProcessScan('BN20260013');
                    }}
                  >
                    1. Quét STT #101 Quầy đã tạo (Phan Thu Thảo)
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
                    2. Lượt khám chưa đóng phí (Bị chặn nộp viện phí)
                  </Button>

                  <Button
                    size="small"
                    style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed', color: '#fff', fontWeight: 600 }}
                    onClick={() => {
                      setInputCode('apt-001');
                      handleProcessScan('apt-001');
                    }}
                  >
                    3. Lịch hẹn App (Trần Văn Nam)
                  </Button>

                  <Button
                    size="small"
                    onClick={() => {
                      setInputCode('MA_KHONG_CO_THUC_999');
                      handleProcessScan('MA_KHONG_CO_THUC_999');
                    }}
                  >
                    4. Mã không tồn tại (Chưa qua Quầy)
                  </Button>
                </Space>
              </div>
            </Card>
          </Col>

          {/* CỘT PHẢI: MÀN HÌNH HIỂN THỊ KẾT QUẢ THẨM ĐỊNH & THÔNG TIN SỐ THỨ TỰ */}
          <Col xs={24} lg={11}>
            <Card
              style={{
                borderRadius: 24,
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.96)',
                color: '#0f172a',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
              bodyStyle={{ padding: 28, height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 14, marginBottom: 18 }}>
                <Title level={4} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
                  Thông Tin Số Thứ Tự & Tiếp Nhận
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Liên thông trực tiếp từ Quầy Tiếp Nhận & Cổng Tài Chính Bệnh Viện
                </Text>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {/* 1. TRẠNG THÁI CHỜ QUÉT */}
                {kioskStatus === 'idle' && (
                  <div style={{ textAlign: 'center', padding: '30px 16px' }}>
                    <div
                      style={{
                        width: 90,
                        height: 90,
                        margin: '0 auto 16px',
                        borderRadius: '50%',
                        backgroundColor: '#f0f9ff',
                        border: '2px solid #bae6fd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ScanOutlined style={{ fontSize: 44, color: '#0284c7' }} />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                      Máy quét Kiosk sẵn sàng
                    </div>
                    <Text type="secondary" style={{ fontSize: 14, display: 'block', marginTop: 8, lineHeight: 1.6 }}>
                      Người bệnh chỉ cần đưa mã QR trên phiếu tiếp nhận do nhân viên y tế cấp hoặc lịch hẹn trên App để hệ thống nhận diện và hiển thị thông tin STT phòng khám.
                    </Text>
                  </div>
                )}

                {/* 2. TRẠNG THÁI LỖI: CHƯA NỘP TẠM ỨNG VIỆN PHÍ */}
                {kioskStatus === 'error_unpaid' && (
                  <div style={{ textAlign: 'center' }}>
                    <CloseCircleOutlined style={{ fontSize: 60, color: '#ef4444', marginBottom: 12 }} />
                    <Title level={3} style={{ color: '#ef4444', margin: '0 0 8px', fontWeight: 800 }}>
                      CHƯA NỘP TẠM ỨNG VIỆN PHÍ
                    </Title>
                    <Alert
                      type="warning"
                      showIcon
                      icon={<WarningOutlined />}
                      message="Cần thanh toán phí khám dịch vụ ban đầu"
                      description={resultMessage}
                      style={{ textAlign: 'left', marginBottom: 16, borderRadius: 12 }}
                    />

                    <div
                      style={{
                        padding: 16,
                        borderRadius: 14,
                        backgroundColor: '#fef2f2',
                        border: '1.5px solid #fecaca',
                        textAlign: 'left',
                        marginBottom: 18,
                      }}
                    >
                      <div style={{ fontWeight: 800, color: '#991b1b', marginBottom: 6 }}>
                        👉 HƯỚNG DẪN BỆNH NHÂN:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, color: '#7f1d1d', fontSize: 13, lineHeight: 1.6 }}>
                        <li>Quý khách vui lòng đến <strong>Quầy Thu Ngân 01 - 04 (Khu A)</strong> để nộp phí khám ban đầu.</li>
                        <li>Hoặc quét mã <strong>VietQR</strong> bên dưới bằng ứng dụng Ngân hàng để thanh toán tự động:</li>
                      </ul>
                      <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <QRCodeSVG value="VIETQR-HOSPITAL-EXAM-FEE-150000" size={100} />
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', marginTop: 6 }}>
                          Số tiền: 150.000 VNĐ • Nội dung: Tạm ứng khám bệnh
                        </div>
                      </div>
                    </div>

                    <Button size="large" onClick={handleResetKiosk} block style={{ borderRadius: 10, fontWeight: 700 }}>
                      Quay Lại / Quét Mã Khác
                    </Button>
                  </div>
                )}

                {/* 3. TRẠNG THÁI LỖI: KHÔNG TÌM THẤY LƯỢT KHÁM */}
                {kioskStatus === 'error_not_found' && (
                  <div style={{ textAlign: 'center' }}>
                    <CloseCircleOutlined style={{ fontSize: 60, color: '#dc2626', marginBottom: 12 }} />
                    <Title level={3} style={{ color: '#dc2626', margin: '0 0 8px', fontWeight: 800 }}>
                      KHÔNG TÌM THẤY LƯỢT KHÁM
                    </Title>
                    <Alert
                      type="error"
                      showIcon
                      message="Mã tiếp nhận không hợp lệ hoặc chưa làm thủ tục"
                      description={resultMessage}
                      style={{ textAlign: 'left', marginBottom: 16, borderRadius: 12 }}
                    />

                    <div
                      style={{
                        padding: 16,
                        borderRadius: 14,
                        backgroundColor: '#f8fafc',
                        border: '1.5px solid #e2e8f0',
                        textAlign: 'left',
                        marginBottom: 18,
                      }}
                    >
                      <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                        👉 HƯỚNG DẪN TIẾP NHẬN:
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                        1. Quý khách vui lòng di chuyển đến <strong>Quầy Tiếp Đón & Đăng Ký Khám (Cửa số 1, Sảnh A)</strong> để nhân viên y tế làm thủ tục tiếp nhận và cấp phiếu khám.<br />
                        2. Nếu quý khách đã đặt lịch khám qua ứng dụng, hãy kiểm tra lại mã lịch hẹn trong phần "Lịch khám của tôi" trên điện thoại.
                      </p>
                    </div>

                    <Button size="large" onClick={handleResetKiosk} block style={{ borderRadius: 10, fontWeight: 700 }}>
                      Thử Lại / Quét Mã Khác
                    </Button>
                  </div>
                )}

                {/* 4. TRẠNG THÁI THÀNH CÔNG: HIỆN THÔNG TIN STT DO TIẾP NHẬN ĐÃ TẠO */}
                {kioskStatus === 'success' && matchedTicket && (
                  <div style={{ textAlign: 'center' }}>
                    <CheckCircleOutlined style={{ fontSize: 56, color: '#16a34a', marginBottom: 8 }} />
                    <Title level={3} style={{ color: '#16a34a', margin: '0 0 4px', fontWeight: 800 }}>
                      TIẾP NHẬN THÀNH CÔNG!
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Thông tin lượt khám đã được xác nhận và hiển thị tại buồng khám
                    </Text>

                    {/* Thẻ Phiếu STT Nhiệt Nổi Bật */}
                    <div
                      style={{
                        margin: '16px 0',
                        padding: '20px 18px',
                        borderRadius: 16,
                        backgroundColor: '#f0fdf4',
                        border: '2px solid #86efac',
                        boxShadow: '0 8px 24px rgba(22, 163, 74, 0.12)',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>
                        {matchedTicket.departmentName}
                      </div>

                      {/* SỐ THỨ TỰ LỚN RÕ RÀNG */}
                      <div
                        style={{
                          fontSize: 60,
                          fontWeight: 900,
                          color: matchedTicket.priority === 'Emergency' ? '#dc2626' : '#0369a1',
                          lineHeight: 1.1,
                          margin: '8px 0',
                          letterSpacing: -1,
                        }}
                      >
                        #{matchedTicket.sequenceNumber}
                      </div>

                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                        {matchedTicket.patientName}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                        Mã BN: <strong>{matchedTicket.patientCode}</strong> • {matchedTicket.patientGender || 'Nam'} ({matchedTicket.patientAge || 30} tuổi)
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <Tag color={matchedTicket.visitType === 'FollowUp' ? 'purple' : 'blue'} style={{ fontWeight: 700 }}>
                          {matchedTicket.visitType === 'FollowUp' ? 'Tái Khám Theo Hẹn' : 'Khám Lần Đầu'}
                        </Tag>
                        <Tag color={matchedTicket.paymentStatus === 'InsuranceWaived' ? 'cyan' : 'green'} style={{ fontWeight: 700 }}>
                          {matchedTicket.paymentStatus === 'InsuranceWaived' ? 'BHYT Chi Trả' : 'Đã Nộp Phí Khám'}
                        </Tag>
                        {matchedTicket.priority === 'Emergency' && (
                          <Tag color="red" style={{ fontWeight: 800 }}>🚨 Ưu Tiên / Cấp Cứu</Tag>
                        )}
                      </div>

                      <Divider style={{ margin: '12px 0' }} />

                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0369a1' }}>
                        📍 {matchedTicket.location}
                      </div>
                    </div>

                    <Space style={{ width: '100%' }} direction="vertical" size={10}>
                      <Button
                        type="primary"
                        icon={<PrinterOutlined />}
                        size="large"
                        onClick={() => setIsPrintModalOpen(true)}
                        block
                        style={{
                          backgroundColor: '#0284c7',
                          borderColor: '#0284c7',
                          fontWeight: 700,
                          borderRadius: 10,
                          height: 46,
                        }}
                      >
                        In Lại Phiếu Số Thứ Tự
                      </Button>
                      <Button
                        size="large"
                        onClick={handleResetKiosk}
                        block
                        style={{ borderRadius: 10, fontWeight: 600, height: 44 }}
                      >
                        Hoàn Tất / Bệnh Nhân Tiếp Theo
                      </Button>
                    </Space>
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>

        {/* BẢNG ĐỐI SOÁT: DANH SÁCH LƯỢT KHÁM DO QUẦY TIẾP NHẬN VỪA CẤP HÔM NAY */}
        <div style={{ marginTop: 28 }}>
          <Card
            style={{
              borderRadius: 20,
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.96)',
              color: '#0f172a',
            }}
            bodyStyle={{ padding: 24 }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <div>
                <Title level={4} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
                  📋 Danh Sách Phiếu Đã Tiếp Nhận Tại Quầy Hôm Nay (Thời Gian Thực)
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Bệnh nhân có thể bấm trực tiếp vào nút <strong>"Quét Thử Phiếu Này"</strong> để mô phỏng đưa phiếu vào máy quét Kiosk
                </Text>
              </div>

              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchLiveQueue}
                  loading={loadingQueue}
                  style={{ borderRadius: 8, fontWeight: 600 }}
                >
                  Cập Nhật Danh Sách
                </Button>
                <Button
                  type="primary"
                  onClick={() => navigate('/reception')}
                  style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', borderRadius: 8, fontWeight: 600 }}
                >
                  Qua Quầy Tiếp Nhận Tạo Thêm Phiếu
                </Button>
              </Space>
            </div>

            <Table
              dataSource={liveQueue}
              rowKey="id"
              loading={loadingQueue}
              pagination={{ pageSize: 5 }}
              size="middle"
              columns={[
                {
                  title: 'Số Thứ Tự',
                  dataIndex: 'sequenceNumber',
                  key: 'sequenceNumber',
                  width: 110,
                  render: (seq: number, r: QueueTicketItem) => (
                    <Tag
                      color={r.priority === 'Emergency' ? 'red' : 'blue'}
                      style={{ fontSize: 16, fontWeight: 900, padding: '4px 10px' }}
                    >
                      #{seq}
                    </Tag>
                  ),
                },
                {
                  title: 'Họ Và Tên',
                  dataIndex: 'patientName',
                  key: 'patientName',
                  render: (name: string, r: QueueTicketItem) => (
                    <div>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        Mã BN: {r.patientCode} • {r.patientGender || 'Nam'} ({r.patientAge || 30}t)
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Khoa & Buồng Khám',
                  dataIndex: 'departmentName',
                  key: 'departmentName',
                  render: (dept: string, r: QueueTicketItem) => (
                    <div>
                      <div style={{ fontWeight: 700, color: '#0369a1' }}>{dept}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{r.location}</div>
                    </div>
                  ),
                },
                {
                  title: 'Phân Loại',
                  dataIndex: 'visitType',
                  key: 'visitType',
                  width: 140,
                  render: (vt: string) => (
                    <Tag color={vt === 'FollowUp' ? 'purple' : 'default'} style={{ fontWeight: 700 }}>
                      {vt === 'FollowUp' ? 'Tái khám hẹn' : 'Khám mới'}
                    </Tag>
                  ),
                },
                {
                  title: 'Viện Phí',
                  dataIndex: 'paymentStatus',
                  key: 'paymentStatus',
                  width: 140,
                  render: (pay: string) => {
                    if (pay === 'Unpaid') return <Tag color="error">Chưa nộp tiền</Tag>;
                    if (pay === 'InsuranceWaived') return <Tag color="cyan">BHYT 100%</Tag>;
                    return <Tag color="success">Đã nộp phí</Tag>;
                  },
                },
                {
                  title: 'Trạng Thái',
                  dataIndex: 'status',
                  key: 'status',
                  width: 120,
                  render: (status: string) => {
                    if (status === 'Calling') return <Badge status="processing" text="Đang gọi" />;
                    if (status === 'Waiting') return <Badge status="warning" text="Đang chờ" />;
                    if (status === 'Finished') return <Badge status="success" text="Đã khám" />;
                    return <Badge status="default" text={status} />;
                  },
                },
                {
                  title: 'Thao Tác Kiosk',
                  key: 'action',
                  width: 150,
                  align: 'center',
                  render: (_: any, record: QueueTicketItem) => (
                    <Button
                      type="primary"
                      size="small"
                      icon={<ScanOutlined />}
                      onClick={() => {
                        setInputCode(record.patientCode);
                        handleProcessScan(record.patientCode);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        backgroundColor: '#0284c7',
                        borderColor: '#0284c7',
                        fontWeight: 700,
                        borderRadius: 6,
                      }}
                    >
                      Quét Phiếu Này
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </main>

      {/* Modal Giả Lập In Phiếu STT Kiosk */}
      <Modal
        title={
          <Space>
            <PrinterOutlined style={{ color: '#0284c7' }} />
            <span style={{ fontWeight: 700 }}>In Phiếu Số Thứ Tự - Kiosk Sảnh A</span>
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
        {matchedTicket && (
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
              {matchedTicket.visitType === 'FollowUp' ? '[ TÁI KHÁM THEO HẸN ]' : '[ KHÁM LẦN ĐẦU ]'}
            </div>

            <div style={{ fontSize: 52, fontWeight: 900, color: '#000', margin: '6px 0' }}>
              #{matchedTicket.sequenceNumber}
            </div>

            <div style={{ fontSize: 13, fontWeight: 700 }}>{matchedTicket.patientName}</div>
            <div style={{ fontSize: 11 }}>Mã BN: {matchedTicket.patientCode}</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 8 }}>
              {matchedTicket.departmentName}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0284c7' }}>
              {matchedTicket.location}
            </div>

            <Divider style={{ margin: '10px 0' }} />
            <div style={{ fontSize: 10, color: '#64748b' }}>
              Thời gian in: {new Date().toLocaleTimeString('vi-VN')} {new Date().toLocaleDateString('vi-VN')}
            </div>
            <div style={{ fontSize: 10, color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>
              * Quý khách vui lòng theo dõi màn hình LCD và loa thông báo tại cửa phòng khám.
            </div>
          </div>
        )}
      </Modal>

      {/* Global CSS for Scanner animations */}
      <style>{`
        @keyframes scanLaser {
          0% { top: 12%; opacity: 0.4; }
          50% { top: 86%; opacity: 1; }
          100% { top: 12%; opacity: 0.4; }
        }
        @keyframes radarSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default KioskPage;
