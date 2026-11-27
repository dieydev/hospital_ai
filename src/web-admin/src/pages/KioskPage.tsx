import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Modal,
  Progress,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExperimentOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  HomeOutlined,
  IdcardOutlined,
  KeyOutlined,
  MedicineBoxOutlined,
  PrinterOutlined,
  ReloadOutlined,
  ScanOutlined,
  SoundOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  UserAddOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { KioskQrScanner, playScannerBeep } from '../components/KioskQrScanner';
import { KioskTouchNumpad } from '../components/KioskTouchNumpad';
import {
  KIOSK_TERMINALS,
  KioskBillingSummary,
  KioskCheckInResponse,
  KioskClsReturnResponse,
  KioskPreviousExamSummary,
  KioskWalkInRequest,
  clearPairedTerminalSecret,
  getKioskHeaders,
  getPairedTerminalSecret,
  kioskService,
  parseKioskQrClient,
  setPairedTerminalSecret,
} from '../services/kioskService';
import { DepartmentItem, QueueTicketItem, queueService } from '../services/queueService';
import { signalrService } from '../services/signalrService';
import { useAuthStore } from '../store/useAuthStore';
import { showToast } from '../utils/sweetAlert';
import { speakVietnamese, stopVietnameseSpeech } from '../utils/vietnameseSpeaker';

const { Title, Text } = Typography;

const AUTO_RESET_SECONDS = 20;

const KIOSK_BG = 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #e2e8f0 100%)';
const CARD_SHADOW = '0 10px 30px rgba(2, 132, 199, 0.1)';

/**
 * Màn hình Trạm Kiosk Tự Phục Vụ Bệnh Viện (Hospital AI Smart Kiosk)
 * Đáp ứng đầy đủ 4 quy trình thực tế theo 2 Lưu đồ Khám mới & Tái khám:
 * 1. Quét QR / CCCD Check-in Lịch hẹn & Tái khám (có kiểm tra lịch sử khám cũ + Cổng viện phí)
 * 2. Đăng ký Walk-in bằng CCCD / BHYT + Bàn phím cảm ứng + Tự động nhận diện ưu tiên Luật 15/2023/QH15
 * 3. Quét QR Quay lại Phòng khám Đọc Kết quả Cận lâm sàng (CLS)
 * 4. Thanh toán VietQR / VNPay Sandbox tự động mở khóa cấp STT & In phiếu nhiệt K80
 */
export const KioskPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isStaffLoggedIn = Boolean(
    user?.vaiTro?.some((r) =>
      ['admin', 'receptionist', 'triage', 'quản trị viên', 'nhân viên tiếp nhận', 'nhân viên sàng lọc bệnh'].includes(
        r.toLowerCase()
      )
    )
  );

  // Cấu hình trạm & trạng thái hệ thống
  const [selectedTerminalId, setSelectedTerminalId] = useState<string>(KIOSK_TERMINALS[0].terminalId);
  const [activeTab, setActiveTab] = useState<string>('checkin');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isElderlyMode, setIsElderlyMode] = useState<boolean>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('dmedical_elderly_mode') === 'true' : false
  );
  // Mặc định bật chế độ Công cộng (Che PII trên bảng sảnh). Staff có thể bật Chế độ Demo Hội đồng để test nhanh.
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Đồng hồ thời gian thực
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('vi-VN'));
  const currentDate = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Dữ liệu nền từ Backend
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [liveQueue, setLiveQueue] = useState<QueueTicketItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState<boolean>(false);
  const [boardDeptFilter, setBoardDeptFilter] = useState<string>('ALL');
  const [boardTypeFilter, setBoardTypeFilter] = useState<string>('ALL');

  // Trạng thái Tab 1: Quét QR Check-in
  const [scanCode, setScanCode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [checkInResult, setCheckInResult] = useState<KioskCheckInResponse | null>(null);
  const scanInputRef = useRef<HTMLInputElement | null>(null);

  // Trạng thái Tab 2: Walk-in CCCD (Phương án A: Kiosk chỉ cấp STT, không thu tiền tại Kiosk)
  const [walkInForm] = Form.useForm();
  const [walkInLoading, setWalkInLoading] = useState<boolean>(false);
  const [walkInPaymentMode, setWalkInPaymentMode] = useState<'BHYT' | 'ServiceCounter'>('BHYT');
  const [walkInWaitForTriage, setWalkInWaitForTriage] = useState<boolean>(true);
  const [activeNumpadTarget, setActiveNumpadTarget] = useState<'scan' | 'cccd' | 'phone' | 'cls'>('scan');

  // Trạng thái Tab 3: Quay lại đọc KQ CLS
  const [clsScanCode, setClsScanCode] = useState<string>('');
  const [clsLoading, setClsLoading] = useState<boolean>(false);
  const [clsResult, setClsResult] = useState<KioskClsReturnResponse | null>(null);
  const clsInputRef = useRef<HTMLInputElement | null>(null);

  // Theo dõi trạng thái thanh toán hóa đơn từ Quầy Thu ngân / SePay / VNPay (Chỉ đọc, không thu trực tiếp tại Kiosk)
  const [trackedBilling, setTrackedBilling] = useState<KioskBillingSummary | null>(null);
  const [pendingClsCode, setPendingClsCode] = useState<string | null>(null);

  // Trạng thái In phiếu nhiệt & Auto-reset bảo mật PII
  const [ticketToPrint, setTicketToPrint] = useState<QueueTicketItem | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [resetCountdown, setResetCountdown] = useState<number>(0);

  // Phát âm giọng nói Tiếng Việt (Chuông + MP3 /api/queue/tts + dự phòng Web Speech API)
  const speakAnnouncement = useCallback(
    (text: string) => {
      if (!isSoundEnabled) return;
      void speakVietnamese(text, {
        chime: true,
        rate: 0.96,
        headers: getKioskHeaders(selectedTerminalId),
      });
    },
    [isSoundEnabled, selectedTerminalId]
  );

  // Đồng hồ giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);
    return () => {
      clearInterval(timer);
      stopVietnameseSpeech();
    };
  }, []);

  // Trạng thái ghép nối trạm Kiosk vật lý (Không nhúng secret vào JS bundle công cộng)
  const [isPairingRequired, setIsPairingRequired] = useState<boolean>(false);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState<boolean>(false);
  const [pairingSecretInput, setPairingSecretInput] = useState<string>('');

  // Tải Khoa phòng + Bảng hàng chờ từ Backend
  const fetchKioskData = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const [depts, boardRes] = await Promise.all([
        queueService.getDepartments(),
        kioskService.getPublicBoard(selectedTerminalId, {
          departmentId: boardDeptFilter === 'ALL' ? undefined : boardDeptFilter,
          queueType: boardTypeFilter === 'ALL' ? undefined : boardTypeFilter,
          includeMaskedNames: !isDemoMode && !isStaffLoggedIn,
        }),
      ]);
      setDepartments(depts);
      setLiveQueue(boardRes.tickets);
      setIsOnline(boardRes.online);
      setIsPairingRequired(Boolean(boardRes.authRequired && !isStaffLoggedIn && !getPairedTerminalSecret(selectedTerminalId)));
    } catch {
      setIsOnline(false);
    } finally {
      setLoadingQueue(false);
    }
  }, [selectedTerminalId, boardDeptFilter, boardTypeFilter, isDemoMode, isStaffLoggedIn]);

  // Khởi tạo SignalR Realtime
  useEffect(() => {
    fetchKioskData();
    signalrService.initConnection();
    const unsub = signalrService.subscribeQueueUpdates(() => {
      fetchKioskData();
    });
    return () => {
      unsub();
    };
  }, [fetchKioskData]);

  // Chế độ Elderly Mode
  const handleToggleElderly = (checked: boolean) => {
    setIsElderlyMode(checked);
    localStorage.setItem('dmedical_elderly_mode', String(checked));
    if (checked) {
      document.documentElement.classList.add('elderly-mode');
      document.body.classList.add('elderly-mode');
    } else {
      document.documentElement.classList.remove('elderly-mode');
      document.body.classList.remove('elderly-mode');
    }
  };

  // Chế độ Toàn màn hình
  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      showToast('Trình duyệt không cho phép chuyển toàn màn hình tự động.', 'info');
    }
  };

  // Đổi trạm Kiosk thông minh
  const handleTerminalChange = (termId: string) => {
    setSelectedTerminalId(termId);
    const term = KIOSK_TERMINALS.find((t) => t.terminalId === termId);
    if (term?.zoneType === 'Paraclinical') setActiveTab('cls_return');
    else if (term?.zoneType === 'FollowUp' || term?.zoneType === 'Reception') setActiveTab('checkin');
    showToast(`Đã chuyển cấu hình trạm: ${term?.terminalName}`, 'info');
  };

  // Reset màn hình Kiosk
  const handleResetScreen = useCallback(() => {
    setScanCode('');
    setCheckInResult(null);
    setClsScanCode('');
    setClsResult(null);
    setTrackedBilling(null);
    setPendingClsCode(null);
    setResetCountdown(0);
    setTicketToPrint(null);
    setIsPrintModalOpen(false);
    if (activeTab === 'checkin' && scanInputRef.current) scanInputRef.current.focus();
    if (activeTab === 'cls_return' && clsInputRef.current) clsInputRef.current.focus();
  }, [activeTab]);

  // Đếm ngược tự động xóa thông tin bệnh nhân sau 20 giây (Bảo mật PII tại sảnh)
  useEffect(() => {
    if (resetCountdown <= 0) return;
    const id = setInterval(() => {
      setResetCountdown((prev) => {
        if (prev <= 1) {
          handleResetScreen();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [resetCountdown, handleResetScreen]);

  const startSuccessLifecycle = useCallback(
    (ticket: QueueTicketItem, speech: string, unpaidBilling?: KioskBillingSummary) => {
      setTicketToPrint(ticket);
      setTrackedBilling(unpaidBilling ?? null);
      setPendingClsCode(null);
      setResetCountdown(AUTO_RESET_SECONDS);
      if (isSoundEnabled) {
        playScannerBeep();
        speakAnnouncement(speech);
      }
      fetchKioskData();
    },
    [fetchKioskData, isSoundEnabled, speakAnnouncement]
  );

  // ───────────────────────────────────────────────────────────────────────────
  // XỬ LÝ TAB 1: QUÉT QR CHECK-IN (KHÁM MỚI / TÁI KHÁM / CCCD)
  // ───────────────────────────────────────────────────────────────────────────
  const handleCheckInSubmit = useCallback(
    async (rawCodeInput?: string) => {
      const code = (rawCodeInput ?? scanCode).trim();
      if (!code) {
        showToast('Vui lòng quét mã QR hoặc nhập Mã BN / CCCD / Lịch hẹn!', 'warning');
        return;
      }

      const parsed = parseKioskQrClient(code);
      setIsProcessing(true);
      setResetCountdown(0);

      try {
        const res = await kioskService.checkInQr(code, selectedTerminalId);
        setCheckInResult(res);
        setIsOnline(!res.isOfflineFallback);

        if ((res.outcome === 'SUCCESS' || res.outcome === 'ALREADY_CHECKED_IN') && res.ticket) {
          const isFollowUp = res.visitType === 'FollowUp';
          let speech = `${isFollowUp ? 'Tiếp nhận tái khám thành công' : 'Check-in thành công'} cho ${res.ticket.patientName}. Số thứ tự của bạn là ${res.ticket.sequenceNumber}. Xin mời đến ${res.ticket.departmentName}, ${res.ticket.location}.`;
          if (res.unpaidBilling) {
            speech += ` Vui lòng thanh toán viện phí tại Quầy Thu ngân.`;
          }
          startSuccessLifecycle(res.ticket, speech, res.unpaidBilling);
        } else if (res.outcome === 'NOT_FOUND' && parsed.format === 'CCCD_CHIP') {
          // Nếu quét CCCD mà chưa có lịch hẹn -> Gợi ý chuyển sang Tab Walk-in tự động điền sẵn toàn bộ thông tin CCCD!
          walkInForm.setFieldsValue({
            fullName: parsed.fullName,
            identityCardNumber: parsed.identityCardNumber,
            dateOfBirth: parsed.dateOfBirth ? dayjs(parsed.dateOfBirth) : undefined,
            gender: parsed.gender || 'Nam',
            address: parsed.address,
          });
          showToast('Đã đọc thông tin từ thẻ CCCD! Chuyển sang mục Đăng ký Khám Mới để chọn khoa.', 'info');
          setActiveTab('walkin');
        } else {
          speakAnnouncement(res.message || 'Không thể tiếp nhận lượt khám này. Xin vui lòng liên hệ quầy tiếp nhận.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ Kiosk.';
        setCheckInResult({
          outcome: 'REJECTED',
          message: msg,
          visitType: 'New',
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [scanCode, selectedTerminalId, startSuccessLifecycle, speakAnnouncement, walkInForm]
  );

  // ───────────────────────────────────────────────────────────────────────────
  // ĐỌC TRẠNG THÁI THANH TOÁN TỰ ĐỘNG (3 GIÂY / LẦN) — CHỈ HIỂN THỊ TRẠNG THÁI, KHÔNG THU TẠI KIOSK
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!trackedBilling || trackedBilling.billingId.startsWith('offline-')) return;
    if (trackedBilling.status === 'Paid' || trackedBilling.status === 'Cancelled') return;

    let active = true;
    const timer = setInterval(async () => {
      try {
        const latest = await kioskService.getBillingStatus(trackedBilling.billingId, selectedTerminalId);
        if (!active) return;

        setTrackedBilling(latest);

        if (latest.status === 'Paid') {
          clearInterval(timer);
          showToast(`Hóa đơn ${latest.billingCode} đã được xác nhận thanh toán!`, 'success');
          setCheckInResult((prev) =>
            prev?.ticket ? { ...prev, ticket: { ...prev.ticket, paymentStatus: 'Paid' }, unpaidBilling: latest } : prev
          );
          setTicketToPrint((prev) => (prev ? { ...prev, paymentStatus: 'Paid' } : prev));

          if (activeTab === 'cls_return' && pendingClsCode) {
            const clsRes = await kioskService.processClsReturn(pendingClsCode, selectedTerminalId);
            if (!active) return;
            setClsResult(clsRes);
            if (clsRes.outcome === 'SUCCESS' && clsRes.ticket) {
              startSuccessLifecycle(
                clsRes.ticket,
                `Đã xác nhận thanh toán. Mời bệnh nhân ${clsRes.ticket.patientName} quay lại ${clsRes.ticket.departmentName} đọc kết quả.`
              );
            }
          } else {
            fetchKioskData();
          }
        } else if (latest.status === 'Cancelled') {
          clearInterval(timer);
        }
      } catch {
        // Bỏ qua lỗi mạng thoáng qua khi đang poll trạng thái
      }
    }, 3000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [trackedBilling, selectedTerminalId, activeTab, pendingClsCode, startSuccessLifecycle, fetchKioskData]);

  // ───────────────────────────────────────────────────────────────────────────
  // XỬ LÝ TAB 2: WALK-IN ĐĂNG KÝ TRỰC TIẾP BẰNG CCCD / BHYT
  // ───────────────────────────────────────────────────────────────────────────
  const handleFillWalkInFromCccdScan = (rawQr: string) => {
    const parsed = parseKioskQrClient(rawQr);
    if (parsed.format === 'CCCD_CHIP') {
      walkInForm.setFieldsValue({
        fullName: parsed.fullName,
        identityCardNumber: parsed.identityCardNumber,
        dateOfBirth: parsed.dateOfBirth ? dayjs(parsed.dateOfBirth) : undefined,
        gender: parsed.gender || 'Nam',
        address: parsed.address,
      });
      showToast(`Đã nạp tự động hồ sơ CCCD: ${parsed.fullName}`, 'success');
    } else if (/^\d{9,12}$/.test(parsed.lookupKey)) {
      walkInForm.setFieldsValue({ identityCardNumber: parsed.lookupKey });
    } else {
      showToast('Chuỗi vừa nhập không phải định dạng QR CCCD gắn chip Việt Nam.', 'warning');
    }
  };

  const handleWalkInSubmit = async (values: {
    fullName: string;
    identityCardNumber: string;
    phoneNumber?: string;
    dateOfBirth?: dayjs.Dayjs;
    gender: string;
    address?: string;
    healthInsuranceNumber?: string;
    departmentId: string;
    isPregnant?: boolean;
    isDisabled?: boolean;
    hasRevolutionaryMerit?: boolean;
  }) => {
    setWalkInLoading(true);
    setCheckInResult(null);
    setTrackedBilling(null);

    const payload: KioskWalkInRequest = {
      fullName: values.fullName,
      identityCardNumber: values.identityCardNumber,
      phoneNumber: values.phoneNumber,
      dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : undefined,
      gender: values.gender || 'Nam',
      address: values.address,
      healthInsuranceNumber: walkInPaymentMode === 'BHYT' ? values.healthInsuranceNumber : undefined,
      departmentId: values.departmentId || departments[0]?.id || '',
      requirePrepayment: false,
      waitForTriage: walkInWaitForTriage,
      isPregnant: Boolean(values.isPregnant),
      isDisabled: Boolean(values.isDisabled),
      hasRevolutionaryMerit: Boolean(values.hasRevolutionaryMerit),
      terminalId: selectedTerminalId,
    };

    try {
      const res = await kioskService.issueWalkIn(payload, selectedTerminalId);

      setCheckInResult(res);
      if (res.ticket) {
        let speech = `Đăng ký khám thành công cho ${res.ticket.patientName}. Số thứ tự của bạn là ${res.ticket.sequenceNumber}. Xin mời đến ${res.ticket.departmentName}, ${res.ticket.location}.`;
        if (res.unpaidBilling) {
          speech += ` Vui lòng thanh toán viện phí tại Quầy Thu ngân.`;
        }
        startSuccessLifecycle(res.ticket, speech, res.unpaidBilling);
        walkInForm.resetFields();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể đăng ký khám tại Kiosk.';
      showToast(msg, 'error');
    } finally {
      setWalkInLoading(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // XỬ LÝ TAB 3: QUÉT QR QUAY LẠI PHÒNG KHÁM ĐỌC KẾT QUẢ CLS
  // ───────────────────────────────────────────────────────────────────────────
  const handleClsReturnSubmit = useCallback(
    async (rawInput?: string) => {
      const code = (rawInput ?? clsScanCode).trim();
      if (!code) {
        showToast('Vui lòng quét QR phiếu chỉ định hoặc nhập Mã BN / STT!', 'warning');
        return;
      }

      setClsLoading(true);
      setClsResult(null);
      setTrackedBilling(null);

      try {
        const res = await kioskService.processClsReturn(code, selectedTerminalId);
        setClsResult(res);

        if (res.outcome === 'SUCCESS' && res.ticket) {
          startSuccessLifecycle(
            res.ticket,
            `Đã có kết quả cận lâm sàng cho ${res.ticket.patientName}. Đã xếp hàng chờ ưu tiên quay lại ${res.ticket.departmentName}.`
          );
        } else if (res.outcome === 'UNPAID_CLS' && res.unpaidBilling) {
          setTrackedBilling(res.unpaidBilling);
          setPendingClsCode(code);
          speakAnnouncement('Quý khách có khoản viện phí cận lâm sàng chưa thanh toán. Vui lòng thanh toán tại Quầy Thu ngân.');
        } else {
          speakAnnouncement(res.message);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Không thể kiểm tra kết quả cận lâm sàng.';
        showToast(msg, 'error');
      } finally {
        setClsLoading(false);
      }
    },
    [clsScanCode, selectedTerminalId, startSuccessLifecycle, speakAnnouncement]
  );

  // Xử lý nhấn phím trên bàn phím số cảm ứng ảo
  const handleNumpadChar = (char: string) => {
    if (activeTab === 'checkin' || activeNumpadTarget === 'scan') {
      setScanCode((prev) => prev + char);
    } else if (activeTab === 'cls_return' || activeNumpadTarget === 'cls') {
      setClsScanCode((prev) => prev + char);
    } else if (activeTab === 'walkin') {
      const field = activeNumpadTarget === 'phone' ? 'phoneNumber' : 'identityCardNumber';
      const cur = walkInForm.getFieldValue(field) || '';
      walkInForm.setFieldValue(field, `${cur}${char}`);
    }
  };

  const handleNumpadBackspace = () => {
    if (activeTab === 'checkin' || activeNumpadTarget === 'scan') {
      setScanCode((prev) => prev.slice(0, -1));
    } else if (activeTab === 'cls_return' || activeNumpadTarget === 'cls') {
      setClsScanCode((prev) => prev.slice(0, -1));
    } else if (activeTab === 'walkin') {
      const field = activeNumpadTarget === 'phone' ? 'phoneNumber' : 'identityCardNumber';
      const cur = String(walkInForm.getFieldValue(field) || '');
      walkInForm.setFieldValue(field, cur.slice(0, -1));
    }
  };

  const handleNumpadClear = () => {
    if (activeTab === 'checkin' || activeNumpadTarget === 'scan') {
      setScanCode('');
    } else if (activeTab === 'cls_return' || activeNumpadTarget === 'cls') {
      setClsScanCode('');
    } else if (activeTab === 'walkin') {
      const field = activeNumpadTarget === 'phone' ? 'phoneNumber' : 'identityCardNumber';
      walkInForm.setFieldValue(field, '');
    }
  };

  const handleTriggerPrint = (ticket?: QueueTicketItem | null) => {
    if (ticket) setTicketToPrint(ticket);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Helper render Thẻ Lịch sử Đợt khám trước (Tái khám)
  const renderPreviousExamBox = (prev?: KioskPreviousExamSummary) => {
    if (!prev) return null;
    return (
      <div
        style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 12,
          backgroundColor: '#f5f3ff',
          border: '1px solid #ddd6fe',
          textAlign: 'left',
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 800, color: '#6d28d9', marginBottom: 4 }}>
          📋 ĐÃ LIÊN KẾT HỒ SƠ ĐỢT KHÁM TRƯỚC ({prev.examinationCode})
        </div>
        <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.5 }}>
          • Ngày khám cũ: <strong>{prev.examinationDate}</strong> ({prev.departmentName})
          <br />• Chẩn đoán cũ: <strong>{prev.icd10Code}</strong> - {prev.icd10Name}
          {prev.followUpAppointmentCode && (
            <>
              <br />• Giấy hẹn tái khám: <strong>{prev.followUpAppointmentCode}</strong>
            </>
          )}
        </div>
      </div>
    );
  };

  // Helper render Thông báo qua Quầy Thu ngân (Phương án A: Kiosk chỉ đọc trạng thái, không thu tiền trực tiếp)
  const renderCounterBillingNoticeBox = (billing: KioskBillingSummary) => (
    <div style={{ textAlign: 'center' }}>
      <WarningOutlined style={{ fontSize: 50, color: '#f59e0b', marginBottom: 8 }} />
      <Title level={3} style={{ color: '#0369a1', margin: '0 0 6px', fontWeight: 800 }}>
        VUI LÒNG THANH TOÁN TẠI QUẦY THU NGÂN
      </Title>
      <Alert
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        message={`Mã Thanh Toán: ${billing.billingCode} • ${billing.amount.toLocaleString('vi-VN')} VNĐ`}
        description={billing.description || 'Vui lòng di chuyển tới Quầy Thu ngân để thanh toán bằng Tiền mặt hoặc VietQR SePay.'}
        style={{ textAlign: 'left', marginBottom: 14, borderRadius: 12 }}
      />

      <div
        style={{
          padding: 16,
          borderRadius: 14,
          backgroundColor: '#f0f9ff',
          border: '1.5px solid #bae6fd',
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 13, color: '#334155', marginBottom: 10 }}>
          Bệnh nhân: <strong>{billing.patientName}</strong> ({billing.patientCode}) • Số tiền:{' '}
          <strong style={{ color: '#dc2626' }}>{billing.amount.toLocaleString('vi-VN')} VNĐ</strong>
        </div>

        <Tag color="processing" icon={<SyncOutlined spin />} style={{ fontSize: 12, padding: '4px 12px' }}>
          Kiosk đang tự động theo dõi trạng thái thanh toán từ Thu ngân (3s/lần)...
        </Tag>
      </div>

      <Button size="large" onClick={handleResetScreen} block style={{ borderRadius: 10, fontWeight: 700 }}>
        Quay Lại / Người Tiếp Theo
      </Button>
    </div>
  );

  // Helper render Thẻ Phiếu STT thành công
  const renderTicketResultBox = (
    ticket: QueueTicketItem,
    title: string,
    prevExam?: KioskPreviousExamSummary
  ) => (
    <div style={{ textAlign: 'center' }}>
      <CheckCircleOutlined style={{ fontSize: 48, color: '#10b981', marginBottom: 6 }} />
      <Title level={3} style={{ color: '#0369a1', margin: '0 0 2px', fontWeight: 800 }}>
        {title}
      </Title>
      <Text style={{ color: '#64748b', fontSize: 13 }}>
        Thông tin đã đồng bộ tức thì tới Bàn Sàng Lọc & Phòng Khám
      </Text>

      <div
        style={{
          margin: '14px 0',
          padding: '18px 16px',
          borderRadius: 16,
          backgroundColor: '#f0f9ff',
          border: '2px solid #bae6fd',
          boxShadow: CARD_SHADOW,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>
          {ticket.departmentName}
        </div>

        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: ticket.priority === 'Emergency' ? '#dc2626' : '#0284c7',
            lineHeight: 1.05,
            margin: '6px 0',
          }}
        >
          #{ticket.sequenceNumber}
        </div>

        <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{ticket.patientName}</div>
        <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>
          Mã BN: <strong>{ticket.patientCode}</strong> • {ticket.patientGender || 'Nam'} ({ticket.patientAge || 30} tuổi)
        </div>

        <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Tag color={ticket.visitType === 'FollowUp' ? 'purple' : 'blue'} style={{ fontWeight: 700 }}>
            {ticket.visitType === 'FollowUp' ? 'Tái Khám Theo Hẹn' : 'Khám Lần Đầu'}
          </Tag>
          {ticket.queueType === 'ParaclinicalResult' && (
            <Tag color="orange" style={{ fontWeight: 700 }}>⚡ Ưu Tiên Đọc KQ CLS</Tag>
          )}
          <Tag
            color={
              ticket.paymentStatus === 'InsuranceWaived'
                ? 'cyan'
                : ticket.paymentStatus === 'PendingTriage'
                  ? 'geekblue'
                  : ticket.paymentStatus === 'Unpaid'
                    ? 'orange'
                    : 'green'
            }
            style={{ fontWeight: 700 }}
          >
            {ticket.paymentStatus === 'InsuranceWaived'
              ? 'BHYT Chi Trả'
              : ticket.paymentStatus === 'PendingTriage'
                ? 'Chờ Sàng lọc phân khoa -> Thu ngân'
                : ticket.paymentStatus === 'Unpaid'
                  ? 'Chưa thanh toán • Quầy Thu Ngân'
                  : 'Đã Hoàn Tất Phí'}
          </Tag>
          {ticket.priority === 'Priority' && (
            <Tag color="gold" style={{ fontWeight: 700 }}>⭐ Đối Tượng Ưu Tiên</Tag>
          )}
          {ticket.priority === 'Emergency' && (
            <Tag color="red" style={{ fontWeight: 800 }}>🚨 Cấp Cứu</Tag>
          )}
        </div>

        {ticket.paymentStatus === 'PendingTriage' && (
          <Alert
            type="info"
            showIcon
            style={{ marginTop: 10, textAlign: 'left', borderRadius: 10 }}
            message="Chờ Nhân viên Sàng lọc (Triage) phân chuyên khoa chính thức"
            description="Sau khi Sàng lọc đo sinh hiệu & chỉ định đúng khoa, hóa đơn sẽ được chốt chính xác gửi sang Quầy Thu ngân (Tiền mặt / VietQR SePay)."
          />
        )}

        {trackedBilling && trackedBilling.status === 'Unpaid' && (
          <Alert
            type="warning"
            showIcon
            style={{ marginTop: 10, textAlign: 'left', borderRadius: 10 }}
            message={`Vui lòng thanh toán hóa đơn ${trackedBilling.billingCode} (${trackedBilling.amount.toLocaleString('vi-VN')} VNĐ) tại Quầy Thu ngân`}
            description="Kiosk không trực tiếp thu tiền. Sau khi Thu ngân xác nhận hoặc SePay gạch nợ, trạng thái trên phiếu sẽ tự cập nhật."
          />
        )}

        {ticket.priorityReason && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#0369a1', fontWeight: 600 }}>
            📌 {ticket.priorityReason}
          </div>
        )}

        {renderPreviousExamBox(prevExam)}

        <Divider style={{ margin: '10px 0', borderColor: '#bae6fd' }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0369a1' }}>📍 {ticket.location}</div>
      </div>

      {resetCountdown > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
            Tự động làm mới màn hình bảo mật sau <strong>{resetCountdown}s</strong>
          </div>
          <Progress
            percent={Math.round((resetCountdown / AUTO_RESET_SECONDS) * 100)}
            showInfo={false}
            strokeColor="#0284c7"
            size="small"
          />
        </div>
      )}

      <Row gutter={10}>
        <Col span={12}>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            size="large"
            block
            onClick={() => handleTriggerPrint(ticket)}
            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 700, borderRadius: 10, height: 46 }}
          >
            In Phiếu K80
          </Button>
        </Col>
        <Col span={12}>
          <Button
            size="large"
            block
            onClick={() => {
              setTicketToPrint(ticket);
              setIsPrintModalOpen(true);
            }}
            style={{ borderColor: '#bae6fd', color: '#0369a1', fontWeight: 700, borderRadius: 10, height: 46 }}
          >
            Xem Mẫu Phiếu
          </Button>
        </Col>
      </Row>
      <Button
        size="large"
        onClick={handleResetScreen}
        block
        style={{ marginTop: 10, borderRadius: 10, fontWeight: 600, height: 42 }}
      >
        Hoàn Tất / Bệnh Nhân Tiếp Theo
      </Button>
    </div>
  );

  // Phiếu nhiệt K80 tái sử dụng cho cả Preview Modal & Direct Print Portal
  const renderThermalSlipMarkup = (ticket: QueueTicketItem) => (
    <div
      style={{
        padding: 18,
        backgroundColor: '#ffffff',
        border: '1px dashed #94a3b8',
        borderRadius: 8,
        textAlign: 'center',
        fontFamily: 'monospace',
        color: '#000000',
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 14 }}>BỆNH VIỆN ĐA KHOA D-MEDICAL</div>
      <div style={{ fontSize: 11 }}>120 Hoàng Hoa Thám, P.7, Q.Bình Thạnh, TP.HCM</div>
      <div style={{ fontSize: 11 }}>Tổng đài: 1900 8888 • Kiosk: {selectedTerminalId}</div>
      <Divider style={{ margin: '8px 0', borderColor: '#000' }} />

      <div style={{ fontSize: 12.5, fontWeight: 700 }}>PHIẾU SỐ THỨ TỰ KHÁM BỆNH</div>
      <div style={{ fontSize: 11.5, fontWeight: 700 }}>
        {ticket.queueType === 'ParaclinicalResult'
          ? '[ ƯU TIÊN ĐỌC KẾT QUẢ CLS ]'
          : ticket.visitType === 'FollowUp'
            ? '[ TÁI KHÁM THEO HẸN ]'
            : '[ KHÁM LẦN ĐẦU ]'}
      </div>

      <div style={{ fontSize: 54, fontWeight: 900, margin: '4px 0', lineHeight: 1.1 }}>#{ticket.sequenceNumber}</div>

      <div style={{ fontSize: 13.5, fontWeight: 700 }}>{ticket.patientName}</div>
      <div style={{ fontSize: 11.5 }}>Mã BN: {ticket.patientCode}</div>
      {ticket.priorityReason && (
        <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 4 }}>* {ticket.priorityReason}</div>
      )}
      <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 6 }}>{ticket.departmentName}</div>
      <div style={{ fontSize: 12, fontWeight: 700 }}>{ticket.location}</div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
        <QRCodeSVG
          value={`MEDQR|${ticket.id}|${ticket.patientCode}|${ticket.sequenceNumber}`}
          size={96}
          level="M"
          marginSize={2}
          fgColor="#0f172a"
          bgColor="#ffffff"
        />
      </div>
      <div style={{ fontSize: 10 }}>Dùng mã QR trên để quét quay lại phòng khám sau CLS</div>

      <Divider style={{ margin: '8px 0', borderColor: '#000' }} />
      <div style={{ fontSize: 10 }}>
        Giờ in: {new Date().toLocaleTimeString('vi-VN')} {new Date().toLocaleDateString('vi-VN')}
      </div>
    </div>
  );

  const selectedTerminal = KIOSK_TERMINALS.find((t) => t.terminalId === selectedTerminalId) || KIOSK_TERMINALS[0];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: KIOSK_BG,
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Be Vietnam Pro', 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* HEADER CHUẨN Y TẾ SỐ */}
      <header
        style={{
          padding: '14px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          borderBottom: '1px solid #bae6fd',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 16px rgba(2, 132, 199, 0.08)',
        }}
      >
        <Space size={14} align="center">
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 14px rgba(2, 132, 199, 0.28)',
            }}
          >
            <ScanOutlined style={{ fontSize: 26, color: '#ffffff' }} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#0369a1', letterSpacing: -0.3 }}>
              D-MEDICAL SMART KIOSK
            </div>
            <div style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600 }}>
              {selectedTerminal.terminalName} •{' '}
              <span style={{ color: isOnline ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                {isOnline ? '● Kết nối SQL Server & SignalR' : '● Ngoại tuyến (Local)'}
              </span>
            </div>
          </div>
        </Space>

        <Space wrap size={10}>
          <Select
            value={selectedTerminalId}
            onChange={handleTerminalChange}
            style={{ width: 255 }}
            options={KIOSK_TERMINALS.map((t) => ({
              value: t.terminalId,
              label: `${t.location} (${t.terminalId})`,
            }))}
          />

          <Button
            icon={<SoundOutlined />}
            onClick={() => setIsSoundEnabled((v) => !v)}
            style={{
              borderRadius: 10,
              borderColor: isSoundEnabled ? '#0284c7' : '#cbd5e1',
              color: isSoundEnabled ? '#0284c7' : '#64748b',
              fontWeight: 600,
            }}
          >
            Loa: {isSoundEnabled ? 'Bật' : 'Tắt'}
          </Button>

          <Space size={6} style={{ padding: '4px 10px', borderRadius: 10, backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
            <Text style={{ fontSize: 12, fontWeight: 600, color: '#0369a1' }}>Chữ to:</Text>
            <Switch size="small" checked={isElderlyMode} onChange={handleToggleElderly} />
          </Space>

          <Button
            icon={isDemoMode ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            onClick={() => setIsDemoMode((d) => !d)}
            style={{
              borderRadius: 10,
              borderColor: isDemoMode ? '#7c3aed' : '#bae6fd',
              color: isDemoMode ? '#7c3aed' : '#0369a1',
              fontWeight: 600,
            }}
          >
            {isDemoMode ? 'Chế độ Demo: Bật' : 'Sảnh Công Cộng (Che PII)'}
          </Button>

          <Button
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={handleToggleFullscreen}
            style={{ borderRadius: 10, borderColor: '#bae6fd', color: '#0369a1', fontWeight: 600 }}
          >
            {isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          </Button>

          <div style={{ textAlign: 'right', paddingLeft: 6 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0284c7', lineHeight: 1.1 }}>{currentTime}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{currentDate}</div>
          </div>

          <Button
            icon={<KeyOutlined />}
            onClick={() => {
              setPairingSecretInput(getPairedTerminalSecret(selectedTerminalId));
              setIsPairingModalOpen(true);
            }}
            style={{
              borderRadius: 10,
              borderColor: isPairingRequired ? '#f59e0b' : '#bae6fd',
              color: isPairingRequired ? '#b45309' : '#0369a1',
              fontWeight: 600,
            }}
          >
            {isPairingRequired ? 'Ghép Nối Trạm' : 'Thiết Bị Kiosk'}
          </Button>

          <Button
            icon={<HomeOutlined />}
            onClick={() => navigate(isStaffLoggedIn ? '/reception' : '/')}
            style={{
              backgroundColor: '#0284c7',
              borderColor: '#0284c7',
              color: '#ffffff',
              fontWeight: 600,
              borderRadius: 10,
            }}
          >
            {isStaffLoggedIn ? 'Về Quầy' : 'Trang Chủ'}
          </Button>
        </Space>
      </header>

      {/* NỘI DUNG CHÍNH */}
      <main style={{ flex: 1, padding: '20px 28px', maxWidth: 1380, margin: '0 auto', width: '100%' }}>
        {isPairingRequired && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16, borderRadius: 12, borderColor: '#fcd34d' }}
            message="Trạm Kiosk chưa được ghép nối khóa bảo mật thiết bị"
            description="Để bảo vệ dữ liệu bệnh nhân theo tiêu chuẩn thực tế, khóa trạm Kiosk không được nhúng vào mã nguồn công cộng. Quản trị viên / Kỹ thuật IT vui lòng nhấn 'Ghép Nối Trạm' để nhập khóa thiết bị từ cấu hình máy chủ hoặc đăng nhập bằng tài khoản Tiếp nhận / Admin."
            action={
              <Space>
                <Button
                  size="small"
                  type="primary"
                  icon={<KeyOutlined />}
                  onClick={() => {
                    setPairingSecretInput('');
                    setIsPairingModalOpen(true);
                  }}
                >
                  Ghép Nối Ngay
                </Button>
                <Button size="small" onClick={() => navigate('/login?redirect=/kiosk')}>
                  Đăng Nhập Staff
                </Button>
              </Space>
            }
          />
        )}
        <Tabs
          activeKey={activeTab}
          onChange={(k) => {
            setActiveTab(k);
            if (k === 'checkin') setActiveNumpadTarget('scan');
            if (k === 'cls_return') setActiveNumpadTarget('cls');
          }}
          size="large"
          type="card"
          items={[
            {
              key: 'checkin',
              label: (
                <Space>
                  <ScanOutlined />
                  <span style={{ fontWeight: 700 }}>1. Quét QR Check-in (Khám Mới & Tái Khám)</span>
                </Space>
              ),
              children: (
                <Row gutter={[24, 24]} align="stretch">
                  <Col xs={24} lg={13}>
                    <Card
                      style={{
                        borderRadius: 18,
                        border: '1px solid #bae6fd',
                        boxShadow: CARD_SHADOW,
                        backgroundColor: '#ffffff',
                        height: '100%',
                      }}
                    >
                      <div style={{ textAlign: 'center', marginBottom: 14 }}>
                        <Tag color="blue" style={{ fontWeight: 700, borderRadius: 12 }}>
                          QUÉT MÃ LỊCH HẸN APP • GIẤY HẸN TÁI KHÁM • THẺ CCCD GẮN CHIP
                        </Tag>
                        <Title level={3} style={{ margin: '8px 0 4px', color: '#0369a1' }}>
                          Đầu Đọc Quang Học Kiosk Tự Phục Vụ
                        </Title>
                      </div>

                      <KioskQrScanner
                        value={scanCode}
                        onChange={(v) => setScanCode(v)}
                        onScanSubmit={(code) => handleCheckInSubmit(code)}
                        isProcessing={isProcessing}
                        inputRef={scanInputRef}
                      />

                      <div style={{ marginTop: 14 }}>
                        <KioskTouchNumpad
                          onKeyPress={handleNumpadChar}
                          onBackspace={handleNumpadBackspace}
                          onClear={handleNumpadClear}
                          onSubmit={() => handleCheckInSubmit()}
                          submitLabel="Kiểm Tra Mã & Cấp Số Thứ Tự"
                        />
                      </div>

                      {isDemoMode && (
                        <div
                          style={{
                            marginTop: 14,
                            padding: 12,
                            borderRadius: 12,
                            backgroundColor: '#f8fafc',
                            border: '1px dashed #bae6fd',
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', marginBottom: 8 }}>
                            <ThunderboltOutlined /> CÔNG CỤ TEST NHANH (CHẾ ĐỘ DEMO HỘI ĐỒNG):
                          </div>
                          <Space wrap size={[6, 6]}>
                            <Button
                              size="small"
                              type="primary"
                              onClick={() => {
                                setScanCode('BN20260013');
                                handleCheckInSubmit('BN20260013');
                              }}
                            >
                              1. Phiếu Quầy (#101)
                            </Button>
                            <Button
                              size="small"
                              danger
                              onClick={() => {
                                setScanCode('BN2026_UNPAID');
                                handleCheckInSubmit('BN2026_UNPAID');
                              }}
                            >
                              2. Chặn Chưa Nộp Phí
                            </Button>
                            <Button
                              size="small"
                              onClick={() => {
                                const sampleCccd = '079092001234|272123456|Nguyễn Văn An|15081992|Nam|120 Hoàng Hoa Thám, Bình Thạnh, TP.HCM|10052021';
                                setScanCode(sampleCccd);
                                handleCheckInSubmit(sampleCccd);
                              }}
                            >
                              3. Quét QR CCCD gắn chip
                            </Button>
                            <Button
                              size="small"
                              onClick={() => {
                                setScanCode('apt-003');
                                handleCheckInSubmit('apt-003');
                              }}
                            >
                              4. Chặn Lịch Hẹn Ngày Mai
                            </Button>
                          </Space>
                        </div>
                      )}
                    </Card>
                  </Col>

                  <Col xs={24} lg={11}>
                    <Card
                      style={{
                        borderRadius: 18,
                        border: '1px solid #bae6fd',
                        boxShadow: CARD_SHADOW,
                        backgroundColor: '#ffffff',
                        height: '100%',
                      }}
                    >
                      <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 16 }}>
                        <Title level={4} style={{ margin: 0, color: '#0369a1' }}>
                          Kết Quả Thẩm Định & Số Thứ Tự
                        </Title>
                        <Text style={{ fontSize: 12.5, color: '#64748b' }}>
                          Đối soát trực tiếp với Lịch Hẹn, Bệnh Án Điện Tử & Hóa Đơn Viện Phí
                        </Text>
                      </div>

                      {!checkInResult && (
                        <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                          <div
                            style={{
                              width: 88,
                              height: 88,
                              margin: '0 auto 14px',
                              borderRadius: '50%',
                              backgroundColor: '#f0f9ff',
                              border: '2px solid #bae6fd',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <ScanOutlined style={{ fontSize: 42, color: '#0284c7' }} />
                          </div>
                          <Title level={4} style={{ color: '#0f172a', marginBottom: 6 }}>
                            Kiosk Sẵn Sàng Tiếp Nhận
                          </Title>
                          <Text style={{ color: '#64748b', lineHeight: 1.6 }}>
                            Quý khách vui lòng đưa mã QR trên <strong>Ứng dụng Bệnh nhân</strong>,{' '}
                            <strong>Giấy hẹn tái khám</strong> hoặc <strong>Thẻ CCCD gắn chip</strong> trước ống kính.
                          </Text>
                        </div>
                      )}

                      {checkInResult &&
                        (checkInResult.outcome === 'SUCCESS' || checkInResult.outcome === 'ALREADY_CHECKED_IN') &&
                        checkInResult.ticket &&
                        renderTicketResultBox(
                          checkInResult.ticket,
                          checkInResult.visitType === 'FollowUp'
                            ? 'TIẾP NHẬN TÁI KHÁM THÀNH CÔNG'
                            : 'TIẾP NHẬN KHÁM THÀNH CÔNG',
                          checkInResult.previousExam
                        )}

                      {checkInResult &&
                        (checkInResult.outcome === 'NOT_FOUND' || checkInResult.outcome === 'REJECTED') && (
                          <div style={{ textAlign: 'center', padding: '12px 0' }}>
                            <CloseCircleOutlined style={{ fontSize: 54, color: '#dc2626', marginBottom: 10 }} />
                            <Title level={4} style={{ color: '#dc2626', marginBottom: 8 }}>
                              {checkInResult.outcome === 'REJECTED'
                                ? 'LƯỢT KHÁM CHƯA ĐỦ ĐIỀU KIỆN'
                                : 'KHÔNG TÌM THẤY THÔNG TIN'}
                            </Title>
                            <Alert
                              type="error"
                              showIcon
                              message={checkInResult.message}
                              style={{ textAlign: 'left', marginBottom: 16, borderRadius: 10 }}
                            />
                            <div
                              style={{
                                padding: 14,
                                borderRadius: 12,
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                textAlign: 'left',
                                fontSize: 13,
                                color: '#334155',
                                marginBottom: 14,
                              }}
                            >
                              <strong>👉 Hướng dẫn xử lý:</strong>
                              <br />• Nếu chưa đặt lịch, hãy chuyển sang tab <strong>"2. Đăng Ký Khám Mới (CCCD)"</strong>{' '}
                              để Kiosk cấp số trực tiếp.
                              <br />• Hoặc liên hệ <strong>Quầy Tiếp Đón Cửa số 1 - Sảnh A</strong> để nhân viên hỗ trợ.
                            </div>
                            <Button size="large" block onClick={handleResetScreen} style={{ borderRadius: 10, fontWeight: 700 }}>
                              Quét Lại Mã Khác
                            </Button>
                          </div>
                        )}
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'walkin',
              label: (
                <Space>
                  <UserAddOutlined />
                  <span style={{ fontWeight: 700 }}>2. Đăng Ký Khám Mới (CCCD / BHYT)</span>
                </Space>
              ),
              children: (
                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={14}>
                    <Card
                      style={{
                        borderRadius: 18,
                        border: '1px solid #bae6fd',
                        boxShadow: CARD_SHADOW,
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <Title level={4} style={{ color: '#0369a1', marginTop: 0 }}>
                        <IdcardOutlined /> Tự Đăng Ký Khám Chưa Đặt Lịch (Walk-in)
                      </Title>
                      <Alert
                        type="info"
                        showIcon
                        message="Mẹo nhanh: Bạn có thể dán hoặc quét mã QR trên mặt trước thẻ CCCD gắn chip vào ô CCCD để tự điền toàn bộ hồ sơ!"
                        style={{ marginBottom: 16, borderRadius: 10 }}
                      />

                      <Form form={walkInForm} layout="vertical" onFinish={handleWalkInSubmit}>
                        <Row gutter={12}>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="identityCardNumber"
                              label={<Text strong>Số CCCD / CMND *</Text>}
                              rules={[
                                { required: true, message: 'Vui lòng nhập số CCCD!' },
                                { pattern: /^\d{9,12}$/, message: 'Số CCCD phải gồm 9-12 chữ số!' },
                              ]}
                            >
                              <Input
                                size="large"
                                placeholder="Nhập 12 số CCCD hoặc quét QR CCCD..."
                                onFocus={() => setActiveNumpadTarget('cccd')}
                                onChange={(e) => {
                                  if (e.target.value.includes('|')) {
                                    handleFillWalkInFromCccdScan(e.target.value);
                                  }
                                }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="fullName"
                              label={<Text strong>Họ Và Tên Bệnh Nhân *</Text>}
                              rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                            >
                              <Input size="large" placeholder="VD: Nguyễn Văn An" />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={12}>
                          <Col xs={24} sm={8}>
                            <Form.Item name="dateOfBirth" label={<Text strong>Ngày Sinh</Text>}>
                              <DatePicker size="large" format="DD/MM/YYYY" style={{ width: '100%' }} placeholder="Chọn ngày sinh" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={8}>
                            <Form.Item name="gender" initialValue="Nam" label={<Text strong>Giới Tính</Text>}>
                              <Select
                                size="large"
                                options={[
                                  { value: 'Nam', label: 'Nam' },
                                  { value: 'Nữ', label: 'Nữ' },
                                  { value: 'Khác', label: 'Khác' },
                                ]}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={8}>
                            <Form.Item name="phoneNumber" label={<Text strong>Số Điện Thoại</Text>}>
                              <Input
                                size="large"
                                placeholder="09xxxxxxxx"
                                onFocus={() => setActiveNumpadTarget('phone')}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: 10,
                            backgroundColor: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            marginBottom: 12,
                          }}
                        >
                          <Checkbox
                            checked={walkInWaitForTriage}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setWalkInWaitForTriage(checked);
                              if (checked && !walkInForm.getFieldValue('departmentId') && departments[0]?.id) {
                                walkInForm.setFieldValue('departmentId', departments[0].id);
                              }
                            }}
                          >
                            <Text strong style={{ color: '#0369a1' }}>
                              Khám mới — Cần Nhân viên Sàng lọc (Triage) phân khoa trước khi Thu ngân chốt tiền (Cách 1)
                            </Text>
                          </Checkbox>
                        </div>

                        <Row gutter={12}>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="departmentId"
                              initialValue={departments[0]?.id}
                              label={
                                <Text strong>
                                  {walkInWaitForTriage ? 'Khoa Tiếp nhận / Dự kiến *' : 'Chọn Chuyên Khoa Khám *'}
                                </Text>
                              }
                              rules={[{ required: true, message: 'Vui lòng chọn chuyên khoa!' }]}
                            >
                              <Select
                                size="large"
                                placeholder="Chọn khoa cần khám..."
                                options={departments.map((d) => ({
                                  value: d.id,
                                  label: `${d.departmentName} (${d.location})`,
                                }))}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item label={<Text strong>Đối Tượng Khám Bệnh</Text>}>
                              <Radio.Group
                                value={walkInPaymentMode}
                                onChange={(e) => setWalkInPaymentMode(e.target.value)}
                                optionType="button"
                                buttonStyle="solid"
                                size="middle"
                                style={{ width: '100%' }}
                              >
                                <Radio.Button value="BHYT">Có BHYT</Radio.Button>
                                <Radio.Button value="ServiceCounter">Khám Dịch Vụ (Thu ngân)</Radio.Button>
                              </Radio.Group>
                            </Form.Item>
                          </Col>
                        </Row>

                        {walkInPaymentMode === 'BHYT' && (
                          <Form.Item name="healthInsuranceNumber" label={<Text strong>Mã Thẻ Bảo Hiểm Y Tế (Nếu có)</Text>}>
                            <Input size="large" placeholder="VD: DN4010123456789" />
                          </Form.Item>
                        )}

                        <Form.Item name="address" label={<Text strong>Địa Chỉ Liên Hệ</Text>}>
                          <Input size="large" placeholder="Số nhà, Phường/Xã, Quận/Huyện, Tỉnh/TP" />
                        </Form.Item>

                        <div
                          style={{
                            padding: 12,
                            borderRadius: 12,
                            backgroundColor: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            marginBottom: 16,
                          }}
                        >
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0369a1', marginBottom: 6 }}>
                            Đối tượng Ưu tiên theo Điều 3 Luật KBCB 15/2023/QH15 (Người ≥75t & Trẻ &lt;6t tự động duyệt):
                          </div>
                          <Space wrap>
                            <Form.Item name="isPregnant" valuePropName="checked" noStyle>
                              <Checkbox>Phụ nữ có thai</Checkbox>
                            </Form.Item>
                            <Form.Item name="isDisabled" valuePropName="checked" noStyle>
                              <Checkbox>Người khuyết tật nặng</Checkbox>
                            </Form.Item>
                            <Form.Item name="hasRevolutionaryMerit" valuePropName="checked" noStyle>
                              <Checkbox>Người có công với CM</Checkbox>
                            </Form.Item>
                          </Space>
                        </div>

                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={walkInLoading}
                          size="large"
                          block
                          icon={<MedicineBoxOutlined />}
                          style={{
                            height: 50,
                            borderRadius: 12,
                            fontSize: 16,
                            fontWeight: 700,
                            backgroundColor: '#0284c7',
                          }}
                        >
                          Xác Nhận Đăng Ký & Lấy Số Thứ Tự
                        </Button>
                      </Form>
                    </Card>
                  </Col>

                  <Col xs={24} lg={10}>
                    <Card
                      style={{
                        borderRadius: 18,
                        border: '1px solid #bae6fd',
                        boxShadow: CARD_SHADOW,
                        backgroundColor: '#ffffff',
                        marginBottom: 20,
                      }}
                    >
                      <Title level={5} style={{ color: '#0369a1', marginTop: 0 }}>
                        Bàn Phím Số Cảm Ứng ({activeNumpadTarget === 'phone' ? 'Đang nhập SĐT' : 'Đang nhập CCCD'})
                      </Title>
                      <KioskTouchNumpad
                        showPrefixes={false}
                        onKeyPress={handleNumpadChar}
                        onBackspace={handleNumpadBackspace}
                        onClear={handleNumpadClear}
                      />
                    </Card>

                    {checkInResult?.ticket && activeTab === 'walkin' && (
                      <Card style={{ borderRadius: 18, border: '1px solid #bae6fd', boxShadow: CARD_SHADOW }}>
                        {renderTicketResultBox(checkInResult.ticket, 'ĐÃ CẤP SỐ THỨ TỰ KHÁM MỚI')}
                      </Card>
                    )}
                  </Col>
                </Row>
              ),
            },
            {
              key: 'cls_return',
              label: (
                <Space>
                  <ExperimentOutlined />
                  <span style={{ fontWeight: 700 }}>3. Quay Lại Đọc Kết Quả CLS</span>
                </Space>
              ),
              children: (
                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={12}>
                    <Card
                      style={{
                        borderRadius: 18,
                        border: '1px solid #bae6fd',
                        boxShadow: CARD_SHADOW,
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <Tag color="orange" style={{ fontWeight: 700, borderRadius: 12, marginBottom: 8 }}>
                        MẮT XÍCH 6: XÉT NGHIỆM / X-QUANG QUAY LẠI PHÒNG KHÁM
                      </Tag>
                      <Title level={4} style={{ color: '#0369a1', marginTop: 0 }}>
                        Quét QR Phiếu Khám Để Xếp Hàng Đọc Kết Quả CLS
                      </Title>

                      <KioskQrScanner
                        value={clsScanCode}
                        onChange={(v) => setClsScanCode(v)}
                        onScanSubmit={(code) => handleClsReturnSubmit(code)}
                        isProcessing={clsLoading}
                        inputRef={clsInputRef}
                        placeholder="Quét mã QR trên phiếu STT / Mã BN (VD: BN20260777)..."
                        submitText="Kiểm Tra KQ CLS"
                      />

                      <div style={{ marginTop: 14 }}>
                        <KioskTouchNumpad
                          onKeyPress={handleNumpadChar}
                          onBackspace={handleNumpadBackspace}
                          onClear={handleNumpadClear}
                          onSubmit={() => handleClsReturnSubmit()}
                          submitLabel="Kiểm Tra Kết Quả & Báo Bác Sĩ"
                        />
                      </div>
                    </Card>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Card
                      style={{
                        borderRadius: 18,
                        border: '1px solid #bae6fd',
                        boxShadow: CARD_SHADOW,
                        backgroundColor: '#ffffff',
                        height: '100%',
                      }}
                    >
                      <Title level={4} style={{ color: '#0369a1', marginTop: 0 }}>
                        Trạng Thái Kết Quả Cận Lâm Sàng
                      </Title>

                      {!clsResult && !trackedBilling && (
                        <div style={{ textAlign: 'center', padding: '50px 16px', color: '#64748b' }}>
                          <ExperimentOutlined style={{ fontSize: 52, color: '#0284c7', marginBottom: 12 }} />
                          <div>
                            Sau khi hoàn tất chụp X-Quang / Xét nghiệm, quý khách quét lại mã QR trên phiếu STT để hệ thống kiểm tra kết quả và báo Bác sĩ mời vào đọc kết quả.
                          </div>
                        </div>
                      )}

                      {trackedBilling && clsResult?.outcome === 'UNPAID_CLS' && renderCounterBillingNoticeBox(trackedBilling)}

                      {clsResult && clsResult.outcome !== 'UNPAID_CLS' && (
                        <div>
                          <Alert
                            type={
                              clsResult.outcome === 'SUCCESS'
                                ? 'success'
                                : clsResult.outcome === 'PENDING_RESULTS'
                                  ? 'warning'
                                  : 'error'
                            }
                            showIcon
                            message={clsResult.message}
                            style={{ marginBottom: 14, borderRadius: 10 }}
                          />

                          {clsResult.serviceItems.length > 0 && (
                            <Table
                              dataSource={clsResult.serviceItems}
                              rowKey="serviceName"
                              size="small"
                              pagination={false}
                              style={{ marginBottom: 16 }}
                              columns={[
                                { title: 'Dịch vụ CLS', dataIndex: 'serviceName', key: 'serviceName' },
                                {
                                  title: 'Trạng thái',
                                  dataIndex: 'status',
                                  key: 'status',
                                  render: (st: string) => {
                                    const done =
                                      st?.toLowerCase().includes('đã có') ||
                                      st?.toLowerCase().includes('completed') ||
                                      st?.toLowerCase().includes('hoàn');
                                    return <Tag color={done ? 'green' : 'gold'}>{st}</Tag>;
                                  },
                                },
                              ]}
                            />
                          )}

                          {clsResult.outcome === 'SUCCESS' &&
                            clsResult.ticket &&
                            renderTicketResultBox(clsResult.ticket, 'ĐÃ XẾP VÀO HÀNG CHỜ ĐỌC KQ CLS')}
                        </div>
                      )}
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'board',
              label: (
                <Space>
                  <Badge dot={liveQueue.some((q) => q.status === 'Calling')} color="#10b981">
                    <ReloadOutlined />
                  </Badge>
                  <span style={{ fontWeight: 700 }}>4. Bảng Hàng Chờ Sảnh ({liveQueue.length})</span>
                </Space>
              ),
              children: (
                <Card
                  style={{
                    borderRadius: 18,
                    border: '1px solid #bae6fd',
                    boxShadow: CARD_SHADOW,
                    backgroundColor: '#ffffff',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <Title level={4} style={{ margin: 0, color: '#0369a1' }}>
                        📋 Bảng Theo Dõi Hàng Chờ Trực Tuyến Tại Sảnh (SignalR Realtime)
                      </Title>
                      <Text style={{ fontSize: 13, color: '#64748b' }}>
                        {!isDemoMode && !isStaffLoggedIn
                          ? 'Đang bật chế độ Bảo vệ Dữ liệu Cá nhân (Che một phần tên & CCCD trên màn hình sảnh).'
                          : 'Đang hiển thị thông tin đầy đủ ở Chế độ Quản trị / Demo Hội đồng.'}
                      </Text>
                    </div>

                    <Space wrap>
                      <Select
                        value={boardDeptFilter}
                        onChange={setBoardDeptFilter}
                        style={{ width: 210 }}
                        options={[
                          { value: 'ALL', label: 'Tất cả Khoa/Phòng' },
                          ...departments.map((d) => ({ value: d.id, label: d.departmentName })),
                        ]}
                      />
                      <Select
                        value={boardTypeFilter}
                        onChange={setBoardTypeFilter}
                        style={{ width: 190 }}
                        options={[
                          { value: 'ALL', label: 'Tất cả lượt khám' },
                          { value: 'Exam', label: 'Khám ban đầu / Tái khám' },
                          { value: 'ParaclinicalResult', label: '⚡ Chờ đọc KQ CLS' },
                        ]}
                      />
                      <Button
                        icon={<ReloadOutlined />}
                        loading={loadingQueue}
                        onClick={fetchKioskData}
                        style={{ borderRadius: 8, borderColor: '#0284c7', color: '#0284c7', fontWeight: 600 }}
                      >
                        Làm Mới
                      </Button>
                    </Space>
                  </div>

                  <Table
                    dataSource={liveQueue}
                    rowKey="id"
                    loading={loadingQueue}
                    pagination={{ pageSize: 8 }}
                    size="middle"
                    columns={[
                      {
                        title: 'STT',
                        dataIndex: 'sequenceNumber',
                        key: 'sequenceNumber',
                        width: 95,
                        render: (seq: number, r: QueueTicketItem) => (
                          <Tag
                            color={r.priority === 'Emergency' ? 'red' : r.priority === 'Priority' ? 'gold' : 'blue'}
                            style={{ fontSize: 16, fontWeight: 900, padding: '4px 10px' }}
                          >
                            #{seq}
                          </Tag>
                        ),
                      },
                      {
                        title: 'Bệnh Nhân',
                        dataIndex: 'patientName',
                        key: 'patientName',
                        render: (name: string, r: QueueTicketItem) => (
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{name}</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>
                              Mã BN: {r.patientCode} {r.identityCardNumber ? `• CCCD: ${r.identityCardNumber}` : ''}
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: 'Khoa & Phòng Khám',
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
                        title: 'Luồng',
                        key: 'type',
                        width: 170,
                        render: (_: unknown, r: QueueTicketItem) => (
                          <Space direction="vertical" size={2}>
                            <Tag color={r.visitType === 'FollowUp' ? 'purple' : 'blue'}>
                              {r.visitType === 'FollowUp' ? 'Tái khám' : 'Khám mới'}
                            </Tag>
                            {r.queueType === 'ParaclinicalResult' && (
                              <Tag color="orange">⚡ Đọc KQ CLS</Tag>
                            )}
                          </Space>
                        ),
                      },
                      {
                        title: 'Viện Phí',
                        dataIndex: 'paymentStatus',
                        key: 'paymentStatus',
                        width: 130,
                        render: (pay?: string) => {
                          if (pay === 'Unpaid') return <Tag color="error">Chưa nộp phí</Tag>;
                          if (pay === 'InsuranceWaived') return <Tag color="cyan">BHYT</Tag>;
                          return <Tag color="success">Đã thu phí</Tag>;
                        },
                      },
                      {
                        title: 'Trạng Thái',
                        dataIndex: 'status',
                        key: 'status',
                        width: 130,
                        render: (status: string) => {
                          if (status === 'Calling') return <Badge status="processing" text="Đang gọi số" />;
                          if (status === 'Waiting') return <Badge status="warning" text="Đang chờ" />;
                          if (status === 'WaitingCLS') return <Badge status="default" text="Đang làm CLS" />;
                          if (status === 'Finished') return <Badge status="success" text="Hoàn tất" />;
                          return <Badge status="default" text={status} />;
                        },
                      },
                      ...(isDemoMode
                        ? [
                          {
                            title: 'Test Quét',
                            key: 'action',
                            width: 120,
                            render: (_: unknown, r: QueueTicketItem) => (
                              <Button
                                size="small"
                                type="primary"
                                icon={<ScanOutlined />}
                                onClick={() => {
                                  setActiveTab('checkin');
                                  setScanCode(r.patientCode);
                                  handleCheckInSubmit(r.patientCode);
                                }}
                              >
                                Quét thử
                              </Button>
                            ),
                          },
                        ]
                        : []),
                    ]}
                  />
                </Card>
              ),
            },
          ]}
        />
      </main>

      {/* Modal Xem Trước Phiếu Nhiệt */}
      <Modal
        title={
          <Space>
            <PrinterOutlined style={{ color: '#0284c7' }} />
            <span style={{ fontWeight: 700 }}>Xem Trước Phiếu Số Thứ Tự (Khổ Nhiệt 80mm)</span>
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
            onClick={() => handleTriggerPrint(ticketToPrint)}
          >
            In Ra Máy In Nhiệt (ESC/POS)
          </Button>,
        ]}
        width={380}
      >
        {ticketToPrint && renderThermalSlipMarkup(ticketToPrint)}
      </Modal>

      {/* Modal Ghép Nối Khóa Bảo Mật Trạm Kiosk */}
      <Modal
        title={
          <Space>
            <KeyOutlined style={{ color: '#0284c7' }} />
            <span style={{ fontWeight: 700 }}>Ghép Nối Thiết Bị Kiosk ({selectedTerminalId})</span>
          </Space>
        }
        open={isPairingModalOpen}
        onCancel={() => setIsPairingModalOpen(false)}
        footer={[
          <Button
            key="clear"
            danger
            onClick={() => {
              clearPairedTerminalSecret(selectedTerminalId);
              setPairingSecretInput('');
              setIsPairingModalOpen(false);
              fetchKioskData();
              showToast(`Đã hủy ghép nối khóa trạm ${selectedTerminalId}.`, 'info');
            }}
          >
            Hủy Khóa Trạm
          </Button>,
          <Button key="cancel" onClick={() => setIsPairingModalOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="save"
            type="primary"
            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            onClick={() => {
              if (!pairingSecretInput.trim()) {
                showToast('Vui lòng nhập khóa bảo mật của trạm Kiosk!', 'warning');
                return;
              }
              setPairedTerminalSecret(selectedTerminalId, pairingSecretInput.trim());
              setIsPairingModalOpen(false);
              fetchKioskData();
              showToast(`Đã lưu khóa ghép nối cho ${selectedTerminalId}.`, 'success');
            }}
          >
            Lưu & Kết Nối Trạm
          </Button>,
        ]}
        width={460}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Text style={{ fontSize: 13, color: '#334155' }}>
            Nhập <strong>X-Kiosk-Terminal-Secret</strong> được cấp riêng cho trạm <strong>{selectedTerminal.terminalName}</strong> trong biến môi trường máy chủ:
          </Text>
          <Input.Password
            size="large"
            prefix={<KeyOutlined style={{ color: '#0284c7' }} />}
            placeholder="Nhập khóa bí mật thiết bị trạm Kiosk..."
            value={pairingSecretInput}
            onChange={(e) => setPairingSecretInput(e.target.value)}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Khóa chỉ được lưu cục bộ trên trình duyệt của máy Kiosk tại sảnh, tuyệt đối không nhúng sẵn trong mã nguồn công khai.
          </Text>
        </div>
      </Modal>

      {/* Portal Ẩn Chuyên Dụng Cho Lệnh In Nhiệt (Tránh Lỗi .ant-modal-wrap { display: none } Khi In) */}
      <div id="printable-ticket" className="print-only-ticket">
        {ticketToPrint && renderThermalSlipMarkup(ticketToPrint)}
      </div>

      <style>{`
        @keyframes scanLaser {
          0% { top: 10%; opacity: 0.4; }
          50% { top: 88%; opacity: 1; }
          100% { top: 10%; opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default KioskPage;
