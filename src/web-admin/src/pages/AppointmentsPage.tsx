import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Row,
  Col,
  Typography,
  Input,
  Select,
  Modal,
  Avatar,
  Tabs,
  DatePicker,
  Progress,
  Switch,
  InputNumber,
  Form,
  Statistic,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  PhoneOutlined,
  IdcardOutlined,
  MedicineBoxOutlined,
  QrcodeOutlined,
  ScanOutlined,
  LockOutlined,
  UnlockOutlined,
  SettingOutlined,
  PrinterOutlined,
  TeamOutlined,
  CheckOutlined,
  StopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useThemeStore } from '../store/useThemeStore';
import { showSuccessAlert, showToast, showErrorAlert } from '../utils/sweetAlert';
import {
  appointmentService,
  OnlineAppointmentItem,
  TimeSlotQuotaItem,
} from '../services/appointmentService';

const { Text } = Typography;
const { Option } = Select;

export const AppointmentsPage: React.FC = () => {
  const { isDarkMode } = useThemeStore();

  // Active Tab: 'appointments' or 'slots'
  const [activeTab, setActiveTab] = useState<'appointments' | 'slots'>('appointments');

  // Appointments State
  const [appointments, setAppointments] = useState<OnlineAppointmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [prevLength, setPrevLength] = useState<number>(0);

  // Time Slots Management State
  const [slotDate, setSlotDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [slots, setSlots] = useState<TimeSlotQuotaItem[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlotQuotaItem | null>(null);
  const [slotModalVisible, setSlotModalVisible] = useState(false);
  const [slotForm] = Form.useForm();

  // QR Check-in & QR Display Modal States
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedAptForQr, setSelectedAptForQr] = useState<OnlineAppointmentItem | null>(null);
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [scanInputCode, setScanInputCode] = useState('');
  const [scanProcessing, setScanProcessing] = useState(false);

  // Fetch Appointments
  const fetchAppointments = useCallback(async () => {
    try {
      const data = await appointmentService.getAppointments();
      setAppointments(data);
      if (prevLength > 0 && data.length > prevLength) {
        const latest = data[0];
        showToast(`🔥 Đặt lịch mới từ Mobile App: ${latest.patientName} (${latest.departmentName})`, 'success');
      }
      setPrevLength(data.length);
    } catch {
      // Fallback silent
    }
  }, [prevLength]);

  // Fetch Time Slots
  const fetchTimeSlots = useCallback(async () => {
    setSlotsLoading(true);
    try {
      const data = await appointmentService.getTimeSlots(slotDate);
      setSlots(data);
    } catch {
      // Fallback
    } finally {
      setSlotsLoading(false);
    }
  }, [slotDate]);

  useEffect(() => {
    setLoading(true);
    fetchAppointments().finally(() => setLoading(false));
    fetchTimeSlots();

    // Polling sync
    const interval = setInterval(() => {
      fetchAppointments();
      if (activeTab === 'slots') {
        fetchTimeSlots();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchAppointments, fetchTimeSlots, activeTab]);

  // Actions: Confirm Appointment
  const handleConfirmAppointment = async (item: OnlineAppointmentItem) => {
    await appointmentService.updateStatus(item.id, 'Confirmed');
    fetchAppointments();
    showSuccessAlert(
      'Đã xác nhận Lịch hẹn!',
      `Lịch hẹn của bệnh nhân ${item.patientName} (${item.appointmentTime} ngày ${item.appointmentDate}) đã được duyệt thành công. Mã QR tiếp nhận đã sẵn sàng.`
    );
  };

  // Actions: Direct QR Check-in (BỎ CẤP STT, DÙNG MÃ QR ĐIỆN TỬ)
  const handleCheckInDirect = async (item: OnlineAppointmentItem) => {
    try {
      await appointmentService.checkInWithQr(item.id);
      fetchAppointments();
      fetchTimeSlots();
      showSuccessAlert(
        'Tiếp Nhận Thành Công Bằng Mã QR!',
        `Bệnh nhân ${item.patientName} đã được Check-in vào hệ thống khám qua Mã QR (không cần phát STT giấy).`
      );
    } catch (err: any) {
      showErrorAlert('Lỗi tiếp nhận', err.message || 'Không thể xác thực mã QR.');
    }
  };

  // Actions: Cancel Appointment
  const handleCancelAppointment = (item: OnlineAppointmentItem) => {
    Modal.confirm({
      title: 'Hủy Lịch hẹn khám này?',
      content: `Bạn có chắc chắn muốn hủy lịch hẹn của bệnh nhân ${item.patientName}?`,
      okText: 'Xác nhận Hủy',
      okType: 'danger',
      cancelText: 'Quay lại',
      onOk: async () => {
        await appointmentService.updateStatus(item.id, 'Cancelled');
        fetchAppointments();
        fetchTimeSlots();
        showToast('Đã hủy lịch hẹn khám thành công!', 'info');
      },
    });
  };

  // Actions: Toggle Lock Slot (Chặn đặt khám bên Mobile App)
  const handleToggleLockSlot = async (slot: TimeSlotQuotaItem) => {
    try {
      const updated = await appointmentService.toggleLockTimeSlot(slot.id);
      setSlots((prev) => prev.map((s) => (s.id === slot.id ? updated : s)));
      if (updated.isLocked) {
        showToast(`🔒 Đã KHÓA khung giờ ${slot.timeSlot}. Bệnh nhân trên Mobile App sẽ không thể đặt khung giờ này!`, 'info');
      } else {
        showToast(`🔓 Đã MỞ LẠI khung giờ ${slot.timeSlot}. Bệnh nhân có thể tiếp tục đặt lịch.`, 'success');
      }
    } catch {
      showErrorAlert('Thao tác thất bại', 'Không thể thay đổi trạng thái khóa khung giờ.');
    }
  };

  // Actions: Save Slot Capacity Edit
  const handleSaveSlotCapacity = async () => {
    if (!editingSlot) return;
    try {
      const values = await slotForm.validateFields();
      const updated = await appointmentService.updateTimeSlot(editingSlot.id, {
        maxCapacity: values.maxCapacity,
        isLocked: values.isLocked,
        note: values.note,
      });
      setSlots((prev) => prev.map((s) => (s.id === editingSlot.id ? updated : s)));
      setSlotModalVisible(false);
      showSuccessAlert(
        'Cập nhật thành công!',
        `Đã cập nhật khung giờ ${updated.timeSlot}: Giới hạn ${updated.maxCapacity} lượt đặt khám.`
      );
    } catch {
      // Validate error
    }
  };

  // Actions: Handle Scan or Input QR Check-in
  const handleExecuteScanCheckIn = async () => {
    if (!scanInputCode.trim()) {
      showToast('Vui lòng nhập hoặc quét mã QR tiếp nhận!', 'warning');
      return;
    }
    setScanProcessing(true);
    try {
      const checkedInApt = await appointmentService.checkInWithQr(scanInputCode.trim());
      setScanModalVisible(false);
      setScanInputCode('');
      fetchAppointments();
      fetchTimeSlots();
      showSuccessAlert(
        'Check-in Thành Công!',
        `Đã tiếp nhận bệnh nhân: ${checkedInApt.patientName} (${checkedInApt.patientCode})\nPhòng khám: ${checkedInApt.departmentName}\nKhung giờ hẹn: ${checkedInApt.appointmentTime} - ${checkedInApt.appointmentDate}`
      );
    } catch (err: any) {
      showErrorAlert('Không tìm thấy lịch hẹn', err.message || 'Mã QR không hợp lệ hoặc không tồn tại trong hệ thống.');
    } finally {
      setScanProcessing(false);
    }
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter((item) => {
    const matchSearch =
      item.patientName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.patientCode.toLowerCase().includes(searchText.toLowerCase()) ||
      item.patientPhone.includes(searchText) ||
      (item.qrCode && item.qrCode.toLowerCase().includes(searchText.toLowerCase()));
    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchDept = selectedDept === 'ALL' || item.departmentName === selectedDept;
    return matchSearch && matchStatus && matchDept;
  });

  // Table Columns: Appointments
  const appointmentColumns = [
    {
      title: 'Bệnh nhân',
      key: 'patientName',
      width: 220,
      render: (record: OnlineAppointmentItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            style={{
              backgroundColor: record.patientGender === 'Nam' ? '#0284c7' : '#ec4899',
              fontWeight: 'bold',
              flexShrink: 0,
            }}
            icon={<UserOutlined />}
          >
            {record.patientName.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
              {record.patientName}
            </div>
            <div style={{ fontSize: 12, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
              {record.patientGender} • {record.patientAge} tuổi
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Mã BN & SĐT',
      key: 'contactInfo',
      width: 190,
      render: (record: OnlineAppointmentItem) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IdcardOutlined style={{ color: '#0284c7', fontSize: 13 }} />
            <Tag color="blue" style={{ margin: 0, fontFamily: 'monospace', fontWeight: 600 }}>
              {record.patientCode}
            </Tag>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isDarkMode ? '#cbd5e1' : '#334155', fontSize: 13, fontWeight: 500 }}>
            <PhoneOutlined style={{ color: '#10b981', fontSize: 13 }} />
            <span style={{ fontFamily: 'monospace' }}>{record.patientPhone}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Chuyên khoa & Bác sĩ',
      key: 'dept',
      width: 210,
      render: (record: OnlineAppointmentItem) => (
        <div>
          <div style={{ fontWeight: 600, color: isDarkMode ? '#38bdf8' : '#0284c7', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MedicineBoxOutlined /> {record.departmentName}
          </div>
          <Text style={{ fontSize: 12, color: isDarkMode ? '#cbd5e1' : '#64748b' }}>
            {record.doctorName}
          </Text>
        </div>
      ),
    },
    {
      title: 'Ngày & Giờ hẹn',
      key: 'time',
      width: 170,
      render: (record: OnlineAppointmentItem) => (
        <div style={{ whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13 }}>
            <CalendarOutlined style={{ color: '#0284c7' }} />
            <span>{record.appointmentDate}</span>
          </div>
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ClockCircleOutlined style={{ color: '#0284c7' }} />
            <Tag color="cyan" style={{ margin: 0, fontFamily: 'monospace', fontWeight: 'bold' }}>
              {record.appointmentTime}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Mã QR Tiếp Nhận',
      key: 'qrCode',
      width: 160,
      render: (record: OnlineAppointmentItem) => (
        <Button
          size="small"
          icon={<QrcodeOutlined style={{ color: '#0284c7' }} />}
          onClick={() => {
            setSelectedAptForQr(record);
            setQrModalVisible(true);
          }}
          style={{ borderColor: '#bae6fd', color: '#0369a1', fontWeight: 600 }}
        >
          Xem Mã QR
        </Button>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 170,
      render: (status: OnlineAppointmentItem['status']) => {
        let color = 'default';
        let text = 'Chờ xử lý';
        if (status === 'Pending') {
          color = 'processing';
          text = 'Chờ xác nhận';
        } else if (status === 'Confirmed') {
          color = 'success';
          text = 'Đã duyệt (Chờ QR)';
        } else if (status === 'Completed') {
          color = 'cyan';
          text = 'Đã tiếp nhận (QR)';
        } else if (status === 'Cancelled') {
          color = 'error';
          text = 'Đã hủy';
        }
        return (
          <Tag color={color} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (record: OnlineAppointmentItem) => (
        <Space size={6} wrap={false}>
          {record.status === 'Pending' && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleConfirmAppointment(record)}
            >
              Duyệt
            </Button>
          )}

          {record.status === 'Confirmed' && (
            <Button
              type="primary"
              size="small"
              style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
              icon={<CheckOutlined />}
              onClick={() => handleCheckInDirect(record)}
            >
              Check-in QR
            </Button>
          )}

          {record.status === 'Completed' && (
            <Tag color="green" icon={<CheckCircleOutlined />} style={{ margin: 0, fontWeight: 600 }}>
              Đã đón tiếp
            </Tag>
          )}

          {record.status !== 'Cancelled' && record.status !== 'Completed' && (
            <Button
              type="text"
              danger
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => handleCancelAppointment(record)}
            >
              Hủy
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Table Columns: Time Slots Quota Management
  const slotColumns = [
    {
      title: 'Khung giờ khám',
      key: 'timeSlot',
      width: 200,
      render: (slot: TimeSlotQuotaItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              backgroundColor: slot.period === 'Morning' ? '#e0f2fe' : '#fef3c7',
              color: slot.period === 'Morning' ? '#0369a1' : '#b45309',
              fontWeight: 700,
              fontFamily: 'monospace',
              fontSize: 13,
            }}
          >
            {slot.timeSlot}
          </div>
          <Tag color={slot.period === 'Morning' ? 'blue' : 'orange'}>
            {slot.period === 'Morning' ? 'Ca Sáng' : 'Ca Chiều'}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Giới hạn tối đa',
      key: 'maxCapacity',
      width: 160,
      render: (slot: TimeSlotQuotaItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TeamOutlined style={{ color: '#0284c7' }} />
          <span style={{ fontWeight: 700, fontSize: 14 }}>{slot.maxCapacity} bệnh nhân</span>
        </div>
      ),
    },
    {
      title: 'Số lượng đã đặt',
      key: 'bookedCount',
      width: 260,
      render: (slot: TimeSlotQuotaItem) => {
        const percent = Math.min(100, Math.round((slot.bookedCount / slot.maxCapacity) * 100));
        const statusColor = slot.bookedCount >= slot.maxCapacity ? '#ef4444' : percent > 60 ? '#f59e0b' : '#0284c7';
        return (
          <div style={{ width: '100%', maxWidth: 220 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#334155' }}>
                Đã đặt: <strong>{slot.bookedCount}</strong> / {slot.maxCapacity}
              </span>
              <span style={{ fontWeight: 700, color: statusColor }}>{percent}%</span>
            </div>
            <Progress
              percent={percent}
              showInfo={false}
              strokeColor={statusColor}
              trailColor={isDarkMode ? '#334155' : '#e2e8f0'}
              size="small"
            />
          </div>
        );
      },
    },
    {
      title: 'Trạng thái trên App',
      key: 'status',
      width: 220,
      render: (slot: TimeSlotQuotaItem) => {
        if (slot.isLocked) {
          return (
            <Tag color="error" icon={<LockOutlined />} style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
              ĐÃ KHÓA THỦ CÔNG (Chặn App)
            </Tag>
          );
        }
        if (slot.bookedCount >= slot.maxCapacity) {
          return (
            <Tag color="warning" icon={<StopOutlined />} style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
              HẾT CHỖ (Đã đủ số lượng)
            </Tag>
          );
        }
        const remaining = slot.maxCapacity - slot.bookedCount;
        return (
          <Tag color="success" icon={<CheckCircleOutlined />} style={{ padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
            CÒN TRỐNG ({remaining} chỗ)
          </Tag>
        );
      },
    },
    {
      title: 'Khóa / Mở (Admin)',
      key: 'lockAction',
      width: 170,
      render: (slot: TimeSlotQuotaItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Switch
            checked={!slot.isLocked}
            onChange={() => handleToggleLockSlot(slot)}
            checkedChildren={<UnlockOutlined />}
            unCheckedChildren={<LockOutlined />}
            style={{ backgroundColor: !slot.isLocked ? '#0284c7' : '#ef4444' }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: slot.isLocked ? '#ef4444' : '#0284c7' }}>
            {slot.isLocked ? 'Đang khóa' : 'Đang mở'}
          </span>
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'editAction',
      width: 120,
      fixed: 'right' as const,
      render: (slot: TimeSlotQuotaItem) => (
        <Button
          size="small"
          icon={<SettingOutlined />}
          onClick={() => {
            setEditingSlot(slot);
            slotForm.setFieldsValue({
              maxCapacity: slot.maxCapacity,
              isLocked: slot.isLocked,
              note: slot.note,
            });
            setSlotModalVisible(true);
          }}
        >
          Cấu hình
        </Button>
      ),
    },
  ];

  // Calculations for Slot Dashboard
  const totalSlots = slots.length;
  const lockedOrFullSlots = slots.filter((s) => s.isLocked || s.bookedCount >= s.maxCapacity).length;
  const availableSlots = slots.filter((s) => !s.isLocked && s.bookedCount < s.maxCapacity).length;
  const totalBookedForDate = slots.reduce((acc, curr) => acc + curr.bookedCount, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Modern Medical Header Banner */}
      <div className="medical-hero-banner relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 backdrop-blur-md">
              <span className="status-dot-active bg-emerald-400" /> Hệ Thống Quản Lý Tiếp Nhận Bệnh Nhân Bằng Mã QR
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight margin-0">
            Quản Lý Lịch Hẹn Đặt Khám & Giới Hạn Khung Giờ (Bỏ Cấp STT)
          </h1>
          <p className="text-sky-100 text-xs md:text-sm mt-1">
            Quản lý số lượng tối đa từng khung giờ để khóa trên Mobile App • Tiếp nhận bệnh nhân hoàn toàn qua Mã QR điện tử
          </p>
        </div>
        <Space wrap>
          <Button
            type="primary"
            icon={<ScanOutlined />}
            size="large"
            style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontWeight: 'bold' }}
            onClick={() => setScanModalVisible(true)}
          >
            Quét / Nhập QR Tiếp Nhận
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchAppointments();
              fetchTimeSlots();
            }}
            loading={loading || slotsLoading}
            className="medical-hero-btn-secondary rounded-lg font-medium"
          >
            Làm mới
          </Button>
        </Space>
      </div>

      {/* Navigation Tabs */}
      <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 p-0 shadow-sm">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as any)}
          type="line"
          tabBarStyle={{ padding: '0 20px', marginBottom: 0 }}
          items={[
            {
              key: 'appointments',
              label: (
                <span className="text-sm font-semibold flex items-center gap-2 py-2">
                  <CalendarOutlined /> Danh Sách Lịch Hẹn & Tiếp Nhận QR ({appointments.length})
                </span>
              ),
            },
            {
              key: 'slots',
              label: (
                <span className="text-sm font-semibold flex items-center gap-2 py-2">
                  <ClockCircleOutlined /> Quản Lý Khung Giờ & Khóa Đặt Khám App ({availableSlots} mở / {totalSlots})
                </span>
              ),
            },
          ]}
        />
      </Card>

      {/* TAB 1: DANH SÁCH LỊCH HẸN & TIẾP NHẬN BẰNG MÃ QR */}
      {activeTab === 'appointments' && (
        <div className="flex flex-col gap-6">
          {/* Filter & Search Bar */}
          <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 hover-lift">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={8}>
                <Input
                  placeholder="Tìm theo tên BN, Mã BN, SĐT hoặc Mã QR..."
                  prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </Col>

              <Col xs={12} sm={6} md={5}>
                <Select
                  style={{ width: '100%' }}
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                >
                  <Option value="ALL">Tất cả trạng thái</Option>
                  <Option value="Pending">Chờ xác nhận</Option>
                  <Option value="Confirmed">Đã duyệt (Chờ QR)</Option>
                  <Option value="Completed">Đã tiếp nhận (QR)</Option>
                  <Option value="Cancelled">Đã hủy</Option>
                </Select>
              </Col>

              <Col xs={12} sm={6} md={5}>
                <Select
                  style={{ width: '100%' }}
                  value={selectedDept}
                  onChange={(val) => setSelectedDept(val)}
                >
                  <Option value="ALL">Tất cả Chuyên khoa</Option>
                  <Option value="Khoa Nội Tổng Hợp">Khoa Nội Tổng Hợp</Option>
                  <Option value="Khoa Tiêu Hóa">Khoa Tiêu Hóa</Option>
                  <Option value="Khoa Tim Mạch">Khoa Tim Mạch</Option>
                  <Option value="Khoa Nhi">Khoa Nhi</Option>
                  <Option value="Khoa Mắt">Khoa Mắt</Option>
                  <Option value="Khoa Ngoại Tổng Quát">Khoa Ngoại Tổng Quát</Option>
                </Select>
              </Col>

              <Col xs={24} sm={24} md={6} style={{ textAlign: 'right' }}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setSearchText('');
                    setStatusFilter('ALL');
                    setSelectedDept('ALL');
                  }}
                >
                  Làm mới bộ lọc
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Main Appointments Table */}
          <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 hover-lift">
            <Table
              dataSource={filteredAppointments}
              columns={appointmentColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 8 }}
              scroll={{ x: 1100 }}
            />
          </Card>
        </div>
      )}

      {/* TAB 2: QUẢN LÝ KHUNG GIỜ & KHÓA ĐẶT KHÁM TRÊN APP */}
      {activeTab === 'slots' && (
        <div className="flex flex-col gap-6">
          {/* Slot Statistics Summary Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 hover-lift shadow-sm">
                <Statistic
                  title={<span style={{ fontWeight: 600, color: '#64748b' }}>Tổng số Khung giờ</span>}
                  value={totalSlots}
                  suffix="khung giờ"
                  prefix={<ClockCircleOutlined style={{ color: '#0284c7' }} />}
                  valueStyle={{ fontWeight: 700, color: '#0284c7' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 hover-lift shadow-sm">
                <Statistic
                  title={<span style={{ fontWeight: 600, color: '#64748b' }}>Đang Mở Nhận Đặt (App)</span>}
                  value={availableSlots}
                  suffix="khung giờ"
                  prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
                  valueStyle={{ fontWeight: 700, color: '#10b981' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 hover-lift shadow-sm">
                <Statistic
                  title={<span style={{ fontWeight: 600, color: '#64748b' }}>Đã Khóa / Hết Chỗ</span>}
                  value={lockedOrFullSlots}
                  suffix="khung giờ"
                  prefix={<LockOutlined style={{ color: '#ef4444' }} />}
                  valueStyle={{ fontWeight: 700, color: '#ef4444' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 hover-lift shadow-sm">
                <Statistic
                  title={<span style={{ fontWeight: 600, color: '#64748b' }}>Lượt Đã Đặt Trong Ngày</span>}
                  value={totalBookedForDate}
                  suffix="bệnh nhân"
                  prefix={<TeamOutlined style={{ color: '#8b5cf6' }} />}
                  valueStyle={{ fontWeight: 700, color: '#8b5cf6' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Date Selector & Instructions */}
          <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 hover-lift">
            <Row gutter={[16, 16]} align="middle" justify="space-between">
              <Col xs={24} md={12}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#334155' }}>
                    Chọn Ngày Kiểm Tra & Cấu Hình:
                  </span>
                  <DatePicker
                    value={dayjs(slotDate)}
                    onChange={(date) => {
                      if (date) setSlotDate(date.format('YYYY-MM-DD'));
                    }}
                    format="DD/MM/YYYY"
                    allowClear={false}
                    style={{ width: 170 }}
                  />
                  <Button icon={<ReloadOutlined />} onClick={fetchTimeSlots} loading={slotsLoading}>
                    Tải lại
                  </Button>
                </div>
              </Col>
              <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 13, color: '#0284c7', fontWeight: 600 }}>
                  💡 Gạt công tắc "Khóa/Mở" để chặn hoặc mở đặt khám tức thì trên Flutter App
                </span>
              </Col>
            </Row>
          </Card>

          {/* Slots Table */}
          <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 hover-lift">
            <Table
              dataSource={slots}
              columns={slotColumns}
              rowKey="id"
              loading={slotsLoading}
              pagination={false}
              scroll={{ x: 1000 }}
            />
          </Card>
        </div>
      )}

      {/* MODAL 1: XEM MÃ QR PHIẾU KHÁM ĐIỆN TỬ (BỎ CẤP STT GIẤY) */}
      <Modal
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()}>
            In Phiếu Khám QR
          </Button>,
          <Button
            key="checkin"
            type="primary"
            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            icon={<CheckCircleOutlined />}
            onClick={() => {
              if (selectedAptForQr) {
                handleCheckInDirect(selectedAptForQr);
                setQrModalVisible(false);
              }
            }}
          >
            Xác Nhận Tiếp Nhận Bằng QR
          </Button>,
        ]}
        width={440}
        centered
      >
        {selectedAptForQr && (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div style={{ marginBottom: 12 }}>
              <Tag color="cyan" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20, fontWeight: 700 }}>
                PHIẾU KHÁM ĐIỆN TỬ CHUẨN QR
              </Tag>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0369a1', marginTop: 8, marginBottom: 4 }}>
                BỆNH VIỆN ĐA KHOA D-MEDICAL
              </h2>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Mã tiếp nhận QR (Thay thế hoàn toàn Số thứ tự)
              </div>
            </div>

            {/* QR Code Container */}
            <div
              style={{
                display: 'inline-block',
                padding: 16,
                backgroundColor: '#ffffff',
                borderRadius: 16,
                border: '2px solid #bae6fd',
                boxShadow: '0 8px 24px rgba(2, 132, 199, 0.12)',
                margin: '12px 0',
              }}
            >
              <QRCodeSVG
                value={selectedAptForQr.qrCode || `MEDQR|${selectedAptForQr.id}|${selectedAptForQr.patientCode}`}
                size={180}
                level="H"
                fgColor="#0369a1"
              />
            </div>

            <div style={{ marginTop: 8, fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#0284c7' }}>
              {selectedAptForQr.id.toUpperCase()}
            </div>

            <Divider style={{ margin: '14px 0' }} />

            {/* Patient & Appointment Info */}
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Bệnh nhân:</span>
                <strong style={{ color: '#0f172a' }}>{selectedAptForQr.patientName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Mã BN:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedAptForQr.patientCode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Chuyên khoa:</span>
                <strong style={{ color: '#0284c7' }}>{selectedAptForQr.departmentName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Bác sĩ khám:</span>
                <span>{selectedAptForQr.doctorName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Ngày & Giờ hẹn:</span>
                <strong style={{ color: '#0369a1' }}>
                  {selectedAptForQr.appointmentTime} • {selectedAptForQr.appointmentDate}
                </strong>
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                padding: '10px 12px',
                borderRadius: 10,
                backgroundColor: '#f0f9ff',
                border: '1px dashed #bae6fd',
                fontSize: 12,
                color: '#0369a1',
                textAlign: 'left',
              }}
            >
              ℹ️ Bệnh nhân đưa mã QR này tại quầy tiếp nhận để quét vào khám ngay, không cần bốc số thứ tự STT giấy.
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: QUÉT / NHẬP MÃ QR TIẾP NHẬN TỪ BỆNH NHÂN */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0369a1' }}>
            <ScanOutlined style={{ fontSize: 20 }} />
            <span>Tiếp Nhận Bệnh Nhân Qua Mã QR</span>
          </div>
        }
        open={scanModalVisible}
        onCancel={() => setScanModalVisible(false)}
        onOk={handleExecuteScanCheckIn}
        confirmLoading={scanProcessing}
        okText="Xác Nhận Tiếp Nhận"
        cancelText="Đóng"
        width={460}
        centered
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
            Quét mã QR từ màn hình ứng dụng di động của bệnh nhân (hoặc nhập Mã phiếu hẹn / Mã BN) để hoàn tất thủ tục đón tiếp điện tử:
          </p>

          <Input
            size="large"
            prefix={<QrcodeOutlined style={{ color: '#0284c7' }} />}
            placeholder="Quét mã QR hoặc nhập: MEDQR|apt-... hoặc apt-001..."
            value={scanInputCode}
            onChange={(e) => setScanInputCode(e.target.value)}
            onPressEnter={handleExecuteScanCheckIn}
            autoFocus
            style={{ borderRadius: 10, fontFamily: 'monospace' }}
          />

          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 10,
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              fontSize: 12,
              color: '#0369a1',
            }}
          >
            <strong>Mẹo tiếp nhận nhanh:</strong> Sử dụng súng quét mã vạch/QR cắm cổng USB hoặc camera máy tính để quét thẳng vào ô nhập trên. Hệ thống sẽ tự động tìm và xác nhận trong 1 giây.
          </div>
        </div>
      </Modal>

      {/* MODAL 3: CẤU HÌNH KHUNG GIỜ & GIỚI HẠN SỐ LƯỢNG */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0369a1' }}>
            <SettingOutlined />
            <span>Cấu Hình Khung Giờ Khám: {editingSlot?.timeSlot}</span>
          </div>
        }
        open={slotModalVisible}
        onCancel={() => setSlotModalVisible(false)}
        onOk={handleSaveSlotCapacity}
        okText="Lưu Cấu Hình"
        cancelText="Hủy"
        width={420}
        centered
      >
        <Form form={slotForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="maxCapacity"
            label="Số lượng đặt khám tối đa (Max Capacity)"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng tối đa' }]}
            extra="Số lượng bệnh nhân tối đa được phép đăng ký qua Mobile App trong khung giờ này"
          >
            <InputNumber min={1} max={50} style={{ width: '100%' }} size="large" />
          </Form.Item>

          <Form.Item
            name="isLocked"
            label="Khóa khung giờ (Chặn đặt trên App)"
            valuePropName="checked"
            extra="Khi bật Khóa, Mobile App sẽ chuyển khung giờ này thành màu xám và không cho chọn"
          >
            <Switch
              checkedChildren="ĐANG KHÓA"
              unCheckedChildren="ĐANG MỞ"
              style={{ backgroundColor: slotForm.getFieldValue('isLocked') ? '#ef4444' : '#0284c7' }}
            />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú quản lý (nếu có)">
            <Input.TextArea placeholder="Ví dụ: Giảm tải do bác sĩ hội chẩn, ca ưu tiên..." rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AppointmentsPage;
