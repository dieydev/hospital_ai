import React, { useEffect, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Table,
  Button,
  Space,
  Input,
  Tag,
  Card,
  Row,
  Col,
  Typography,
  Modal,
  Form,
  Select,
  Divider,
  Badge,
  Tooltip,
  Tabs,
  InputNumber,
  Radio,
} from 'antd';
import {
  PlusOutlined,
  PrinterOutlined,
  UserAddOutlined,
  SoundOutlined,
  ReloadOutlined,
  ForwardOutlined,
  CheckCircleOutlined,
  ScanOutlined,
  QrcodeOutlined,
  HeartOutlined,
  FileDoneOutlined,
} from '@ant-design/icons';
import { useThemeStore } from '../store/useThemeStore';
import { queueService, DepartmentItem, QueueTicketItem } from '../services/queueService';
import { patientService, Patient } from '../services/patientService';
import { appointmentService } from '../services/appointmentService';
import { signalrService } from '../services/signalrService';
import { showSuccessAlert, showToast, showErrorAlert } from '../utils/sweetAlert';

const { Title, Text } = Typography;
const { Option } = Select;

export const ReceptionPage: React.FC = () => {
  const { isDarkMode } = useThemeStore();

  const [loading, setLoading] = useState(false);
  const [queueList, setQueueList] = useState<QueueTicketItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string | undefined>(undefined);
  const [patients, setPatients] = useState<Patient[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Ticket Thermal Print State
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketToPrint, setTicketToPrint] = useState<QueueTicketItem | null>(null);

  // QR Scan State for App Check-in (Bỏ cấp STT)
  const [isQrScanOpen, setIsQrScanOpen] = useState(false);
  const [qrInputCode, setQrInputCode] = useState('');
  const [qrProcessing, setQrProcessing] = useState(false);

  // Triage / Vital Signs State
  const [activeTabKey, setActiveTabKey] = useState<string>('queue');
  const [isTriageModalOpen, setIsTriageModalOpen] = useState(false);
  const [selectedTicketForTriage, setSelectedTicketForTriage] = useState<QueueTicketItem | null>(null);
  const [triageForm] = Form.useForm();
  const [triageSubmitting, setTriageSubmitting] = useState(false);
  const [triageHeight, setTriageHeight] = useState<number>(168);
  const [triageWeight, setTriageWeight] = useState<number>(65);

  const [triagedMap, setTriagedMap] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem('hospital_triage_vital_signs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const calculateBmi = (h: number, w: number) => {
    if (!h || !w || h <= 0) return { bmi: 0, text: 'Chưa đủ dữ liệu', color: 'default' };
    const hMeter = h / 100;
    const bmi = Number((w / (hMeter * hMeter)).toFixed(1));
    if (bmi < 18.5) return { bmi, text: 'Thiếu cân (Gầy)', color: 'blue' };
    if (bmi < 23) return { bmi, text: 'Thể trạng Chuẩn', color: 'green' };
    if (bmi < 25) return { bmi, text: 'Thừa cân (Tiền béo phì)', color: 'orange' };
    return { bmi, text: 'Béo phì (Cần chú ý)', color: 'red' };
  };

  const handleOpenTriageModal = (ticket: QueueTicketItem) => {
    setSelectedTicketForTriage(ticket);
    const existing = triagedMap[ticket.id];
    if (existing) {
      triageForm.setFieldsValue({
        bloodPressure: existing.bloodPressure || '120/80',
        pulse: existing.pulse || 78,
        temperature: existing.temperature || 36.8,
        spO2: existing.spO2 || 98,
        respiratoryRate: existing.respiratoryRate || 18,
        height: existing.height || 168,
        weight: existing.weight || 65,
        initialSymptoms: existing.initialSymptoms || '',
        triageLevel: existing.triageLevel || (ticket.priority === 'Emergency' ? 'Emergency' : 'Normal'),
      });
      setTriageHeight(existing.height || 168);
      setTriageWeight(existing.weight || 65);
    } else {
      triageForm.setFieldsValue({
        bloodPressure: '120/80',
        pulse: 78,
        temperature: 36.8,
        spO2: 98,
        respiratoryRate: 18,
        height: 168,
        weight: 65,
        initialSymptoms: '',
        triageLevel: ticket.priority === 'Emergency' ? 'Emergency' : 'Normal',
      });
      setTriageHeight(168);
      setTriageWeight(65);
    }
    setIsTriageModalOpen(true);
  };

  const handleSaveTriage = async (values: any) => {
    if (!selectedTicketForTriage) return;
    setTriageSubmitting(true);
    try {
      const bmiResult = calculateBmi(values.height, values.weight);
      const triageRecord = {
        ticketId: selectedTicketForTriage.id,
        patientCode: selectedTicketForTriage.patientCode,
        patientName: selectedTicketForTriage.patientName,
        patientAge: selectedTicketForTriage.patientAge,
        patientGender: selectedTicketForTriage.patientGender,
        departmentName: selectedTicketForTriage.departmentName,
        sequenceNumber: selectedTicketForTriage.sequenceNumber,
        bloodPressure: values.bloodPressure,
        pulse: values.pulse,
        temperature: values.temperature,
        spO2: values.spO2,
        respiratoryRate: values.respiratoryRate,
        height: values.height,
        weight: values.weight,
        bmi: bmiResult.bmi,
        bmiClassification: bmiResult.text,
        initialSymptoms: values.initialSymptoms || '',
        triageLevel: values.triageLevel,
        triagedAt: new Date().toISOString(),
      };

      const updatedMap = {
        ...triagedMap,
        [selectedTicketForTriage.id]: triageRecord,
      };

      setTriagedMap(updatedMap);
      localStorage.setItem('hospital_triage_vital_signs', JSON.stringify(updatedMap));

      // Lưu thêm theo patientCode để Bác sĩ có thể tự động đọc khi chọn Bệnh nhân
      try {
        localStorage.setItem(`vitals_${selectedTicketForTriage.patientCode}`, JSON.stringify(triageRecord));
      } catch (e) {
        console.warn('Cache vital signs by patient code error', e);
      }

      setIsTriageModalOpen(false);
      showSuccessAlert(
        'Đã Lưu Sinh Hiệu & Hoàn Tất Sàng Lọc!',
        `Bệnh nhân: ${selectedTicketForTriage.patientName} (STT #${selectedTicketForTriage.sequenceNumber})\n` +
        `• Huyết áp: ${values.bloodPressure} mmHg • Mạch: ${values.pulse} bpm\n` +
        `• SpO2: ${values.spO2}% • Thân nhiệt: ${values.temperature}°C\n` +
        `• BMI: ${bmiResult.bmi} (${bmiResult.text})\n\n` +
        `Hồ sơ sinh hiệu đã được liên thông sang buồng khám Bác sĩ!`
      );
    } catch {
      showErrorAlert('Lỗi lưu sàng lọc', 'Không thể lưu chỉ số sinh hiệu. Vui lòng thử lại.');
    } finally {
      setTriageSubmitting(false);
    }
  };

  const handleQrScanSubmit = async () => {
    if (!qrInputCode.trim()) {
      showToast('Vui lòng quét hoặc nhập mã QR tiếp nhận!', 'warning');
      return;
    }
    setQrProcessing(true);
    try {
      const apt = await appointmentService.checkInWithQr(qrInputCode.trim());
      setIsQrScanOpen(false);
      setQrInputCode('');
      fetchData();
      showSuccessAlert(
        'Check-in Thành Công Bằng Mã QR!',
        `Đã tiếp nhận bệnh nhân: ${apt.patientName} (${apt.patientCode})\nChuyên khoa: ${apt.departmentName}\nKhung giờ hẹn: ${apt.appointmentTime} - ${apt.appointmentDate}`
      );
    } catch (err: any) {
      showErrorAlert('Không tìm thấy lịch hẹn', err.message || 'Mã QR không hợp lệ hoặc không có trong hệ thống.');
    } finally {
      setQrProcessing(false);
    }
  };

  // Fetch queue and departments
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [deptRes, queueRes, patientRes] = await Promise.all([
        queueService.getDepartments(),
        queueService.getTodayQueue(selectedDeptId),
        patientService.getPatients(),
      ]);
      setDepartments(deptRes);
      setQueueList(queueRes);
      setPatients(patientRes.items || []);
    } catch {
      showErrorAlert('Lỗi tải dữ liệu', 'Không thể kết nối danh sách hàng chờ từ hệ thống.');
    } finally {
      setLoading(false);
    }
  }, [selectedDeptId]);

  useEffect(() => {
    fetchData();
    const unsubscribe = signalrService.subscribeQueueUpdates(() => {
      fetchData();
    });
    return () => unsubscribe();
  }, [fetchData]);

  // Handle Issue Ticket
  const handleIssueTicket = async (values: any) => {
    setSubmitting(true);
    try {
      let targetPatientId = values.patientId;

      // If typed new patient name instead of selecting existing patient
      if (!targetPatientId && values.hoTen) {
        const newPatient = await patientService.createPatient({
          fullName: values.hoTen,
          identityCardNumber: values.soCCCD || `038090${Date.now().toString().slice(-6)}`,
          gender: values.gioiTinh || 'Nam',
          dateOfBirth: values.ngaySinh || '1990-01-01',
          phoneNumber: values.soDienThoai || '0900000000',
          address: values.diaChi || 'TP.HCM',
        });
        targetPatientId = newPatient.id;
      }

      if (!targetPatientId) {
        showErrorAlert('Thiếu thông tin', 'Vui lòng chọn bệnh nhân hoặc nhập tên bệnh nhân mới.');
        setSubmitting(false);
        return;
      }

      const priorityVal = values.triageLevel || 'Normal';
      const depts = await queueService.getDepartments();
      const targetDeptId = values.departmentId || (depts.length > 0 ? depts[0].id : '');

      const ticket = await queueService.issueQueueTicket({
        patientId: targetPatientId,
        departmentId: targetDeptId,
        priority: priorityVal === 'Emergency' || priorityVal === 'Elderly' || priorityVal === 'Pregnant' || priorityVal === 'Child' ? 'Emergency' : 'Normal',
      });

      showSuccessAlert(
        `Cấp số #${ticket.sequenceNumber} thành công!`,
        `Đã phát phiếu khám số #${ticket.sequenceNumber} cho bệnh nhân ${ticket.patientName} tại ${ticket.departmentName}.`
      );

      setIsModalOpen(false);
      form.resetFields();
      fetchData();

      // Open print ticket modal
      setTicketToPrint(ticket);
      setIsTicketModalOpen(true);
    } catch {
      showErrorAlert('Không thể cấp số', 'Có lỗi xảy ra trong quá trình tạo phiếu khám.');
    } finally {
      setSubmitting(false);
    }
  };

  // Speaker Call Audio Simulation
  const handleCallSpeaker = async (ticket: QueueTicketItem) => {
    const speechMsg = `Xin mời bệnh nhân ${ticket.patientName}, số thứ tự ${ticket.sequenceNumber}, vào ${ticket.departmentName}, ${ticket.location}.`;
    
    // Web Speech API browser simulation
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speechMsg);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }

    try {
      await queueService.updateQueueTicketStatus(ticket.id, 'Calling');
      showToast(`📢 Đang gọi phát loa: Bệnh nhân ${ticket.patientName} (#${ticket.sequenceNumber})`, 'info');
      fetchData();
    } catch {
      showToast('Đã phát loa gọi số!', 'info');
    }
  };

  // Call Next Patient in queue
  const handleCallNext = async () => {
    const deptId = selectedDeptId || (departments.length > 0 ? departments[0].id : '');
    const nextTicket = await queueService.callNextPatient(deptId);
    if (nextTicket) {
      handleCallSpeaker(nextTicket);
    } else {
      showToast('Không có bệnh nhân nào đang chờ trong hàng chờ này!', 'warning');
    }
  };

  // Change Status Action
  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await queueService.updateQueueTicketStatus(ticketId, newStatus);
      showToast(`Đã chuyển trạng thái phiếu sang ${newStatus}!`, 'success');
      fetchData();
    } catch {
      showErrorAlert('Lỗi', 'Không thể cập nhật trạng thái phiếu.');
    }
  };

  // Stats calculation
  const callingTicket = queueList.find((q) => q.status === 'Calling');
  const waitingCount = queueList.filter((q) => q.status === 'Waiting').length;
  const finishedCount = queueList.filter((q) => q.status === 'Finished').length;
  const emergencyCount = queueList.filter((q) => q.priority === 'Emergency' || q.priority === 'Priority').length;

  const columns = [
    {
      title: 'Số STT',
      dataIndex: 'sequenceNumber',
      key: 'sequenceNumber',
      render: (stt: number, record: QueueTicketItem) => (
        <Space>
          <Badge count={record.priority === 'Emergency' ? 'ƯU TIÊN' : 0} style={{ backgroundColor: '#ef4444' }}>
            <Text strong style={{ fontSize: 22, color: record.priority !== 'Normal' ? '#ef4444' : isDarkMode ? '#38bdf8' : '#0284c7' }}>
              #{stt}
            </Text>
          </Badge>
        </Space>
      ),
    },
    {
      title: 'Mã BN',
      dataIndex: 'patientCode',
      key: 'patientCode',
      render: (t: string) => <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{t}</Tag>,
    },
    {
      title: 'Họ và Tên Bệnh nhân',
      dataIndex: 'patientName',
      key: 'patientName',
      render: (t: string, record: QueueTicketItem) => (
        <div>
          <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a', fontSize: 14 }}>
            {t}
          </Text>
          <Text style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b', display: 'block' }}>
            {record.patientGender} • {record.patientAge} tuổi • CCCD: {record.identityCardNumber}
          </Text>
        </div>
      ),
    },
    {
      title: 'Phòng khám nhận',
      dataIndex: 'departmentName',
      key: 'departmentName',
      render: (t: string, record: QueueTicketItem) => (
        <div>
          <Text style={{ fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#334155' }}>{t}</Text>
          <Text style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b', display: 'block' }}>{record.location}</Text>
        </div>
      ),
    },
    {
      title: 'Thời gian cấp',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (dateStr: string) => new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
    {
      title: 'Trạng thái Hàng chờ',
      dataIndex: 'status',
      key: 'status',
      render: (st: string) => {
        const colors: Record<string, string> = {
          Waiting: 'gold',
          Calling: 'cyan',
          Processing: 'processing',
          Skipped: 'default',
          Finished: 'green',
        };
        const labels: Record<string, string> = {
          Waiting: 'Đang chờ',
          Calling: 'Đang gọi loa',
          Processing: 'Đang khám',
          Skipped: 'Qua lượt',
          Finished: 'Hoàn thành',
        };
        return <Tag color={colors[st] || 'default'}>{labels[st] || st}</Tag>;
      },
    },
    {
      title: 'Sinh hiệu & Sàng lọc',
      key: 'triage',
      width: 170,
      render: (_: any, record: QueueTicketItem) => {
        const triaged = triagedMap[record.id];
        if (triaged) {
          return (
            <Tooltip
              title={`Huyết áp: ${triaged.bloodPressure} mmHg | Mạch: ${triaged.pulse} bpm | Nhiệt độ: ${triaged.temperature}°C | SpO2: ${triaged.spO2}% | BMI: ${triaged.bmi} (${triaged.bmiClassification})`}
            >
              <Tag
                color="cyan"
                icon={<CheckCircleOutlined />}
                style={{ borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                onClick={() => handleOpenTriageModal(record)}
              >
                Đã đo ({triaged.bloodPressure})
              </Tag>
            </Tooltip>
          );
        }
        return (
          <Tag
            color="orange"
            icon={<HeartOutlined />}
            style={{ borderRadius: 6, cursor: 'pointer' }}
            onClick={() => handleOpenTriageModal(record)}
          >
            Chờ đo sinh hiệu
          </Tag>
        );
      },
    },
    {
      title: 'Thao tác Tiếp nhận & Sàng lọc',
      key: 'action',
      render: (_: any, record: QueueTicketItem) => (
        <Space wrap>
          <Tooltip title="Đo sinh hiệu tiền lâm sàng (Huyết áp, Mạch, SpO2, BMI) và phân luồng">
            <Button
              icon={<HeartOutlined />}
              size="small"
              style={{ color: '#ea580c', borderColor: '#fdba74' }}
              onClick={() => handleOpenTriageModal(record)}
            >
              Sàng lọc
            </Button>
          </Tooltip>
          <Tooltip title="Phát loa phát thanh gọi bệnh nhân vào phòng khám">
            <Button
              icon={<SoundOutlined />}
              size="small"
              type="primary"
              style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
              onClick={() => handleCallSpeaker(record)}
            >
              Gọi loa
            </Button>
          </Tooltip>
          {record.status === 'Calling' && (
            <Button
              size="small"
              type="dashed"
              style={{ color: '#10b981', borderColor: '#10b981' }}
              onClick={() => handleStatusChange(record.id, 'Processing')}
            >
              Vào khám
            </Button>
          )}
          {record.status === 'Processing' && (
            <Button
              size="small"
              type="dashed"
              icon={<CheckCircleOutlined />}
              style={{ color: '#059669' }}
              onClick={() => handleStatusChange(record.id, 'Finished')}
            >
              Xong
            </Button>
          )}
          <Button
            icon={<PrinterOutlined />}
            size="small"
            type="text"
            onClick={() => {
              setTicketToPrint(record);
              setIsTicketModalOpen(true);
            }}
          >
            In phiếu STT
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Modern Medical Header Banner */}
      <div className="medical-hero-banner relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 backdrop-blur-md">
              <span className="status-dot-active bg-emerald-400" /> Quầy Lễ Tân • Cấp Số Hàng Chờ Tự Động
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight margin-0">
            Tiếp nhận Bệnh nhân & Cấp số Hàng chờ Realtime
          </h1>
          <p className="text-sky-100 text-xs md:text-sm mt-1">
            Điều phối luồng tiếp đón, phát số thứ tự tự động và gọi loa thông minh theo phòng khám
          </p>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} className="medical-hero-btn-secondary rounded-lg font-medium">
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<ScanOutlined />}
            size="large"
            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            className="rounded-lg font-semibold flex items-center gap-1.5 shadow-md"
            onClick={() => setIsQrScanOpen(true)}
          >
            Quét QR Tiếp Nhận (App)
          </Button>
          <Button
            type="primary"
            icon={<ForwardOutlined />}
            size="large"
            className="bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-lg font-semibold flex items-center gap-1.5 shadow-md"
            onClick={handleCallNext}
          >
            Gọi loa Số tiếp theo
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            className="medical-hero-btn-primary rounded-lg font-semibold flex items-center gap-1.5"
            onClick={() => setIsModalOpen(true)}
          >
            Đăng ký & Cấp số mới
          </Button>
        </Space>
      </div>

      {/* Realtime Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card className="rounded-xl border-l-4 border-l-sky-600 bg-white dark:bg-slate-800 hover-lift text-center">
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>Số STT Đang gọi phát loa</Text>
            <Title level={1} style={{ color: isDarkMode ? '#38bdf8' : '#0284c7', margin: '6px 0', fontSize: 36, fontWeight: 900 }}>
              #{callingTicket ? callingTicket.sequenceNumber : '---'}
            </Title>
            <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
              {callingTicket ? callingTicket.patientName : 'Chưa có bệnh nhân'}
            </Text>
          </Card>
        </Col>

        <Col span={6}>
          <Card
            style={{
              borderRadius: 16,
              textAlign: 'center',
              background: isDarkMode ? '#0f172a' : '#fffbeb',
              borderColor: isDarkMode ? '#f59e0b' : '#fef3c7',
            }}
          >
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>Bệnh nhân Đang chờ</Text>
            <Title level={1} style={{ color: '#f59e0b', margin: '6px 0', fontSize: 36, fontWeight: 900 }}>
              {waitingCount}
            </Title>
            <Text style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>Thời gian chờ trung bình: ~8 phút</Text>
          </Card>
        </Col>

        <Col span={6}>
          <Card
            style={{
              borderRadius: 16,
              textAlign: 'center',
              background: isDarkMode ? '#0f172a' : '#ecfdf5',
              borderColor: isDarkMode ? '#10b981' : '#a7f3d0',
            }}
          >
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>Đã khám Hoàn thành</Text>
            <Title level={1} style={{ color: '#10b981', margin: '6px 0', fontSize: 36, fontWeight: 900 }}>
              {finishedCount}
            </Title>
            <Text style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>Hôm nay ({new Date().toLocaleDateString('vi-VN')})</Text>
          </Card>
        </Col>

        <Col span={6}>
          <Card
            style={{
              borderRadius: 16,
              textAlign: 'center',
              background: isDarkMode ? '#0f172a' : '#fef2f2',
              borderColor: isDarkMode ? '#ef4444' : '#fecaca',
            }}
          >
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>Đối tượng Ưu tiên / Cấp cứu</Text>
            <Title level={1} style={{ color: '#ef4444', margin: '6px 0', fontSize: 36, fontWeight: 900 }}>
              {emergencyCount}
            </Title>
            <Text style={{ color: '#ef4444', fontWeight: 600 }}>Tự động đưa lên đầu hàng chờ</Text>
          </Card>
        </Col>
      </Row>

      {/* Main Tabs: Phân định rõ 2 Vai trò Tiếp Nhận & Sàng Lọc */}
      <Card
        style={{
          borderRadius: 16,
          border: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd',
          boxShadow: '0 10px 30px rgba(2, 132, 199, 0.08)',
        }}
      >
        <Tabs
          activeKey={activeTabKey}
          onChange={setActiveTabKey}
          type="card"
          items={[
            {
              key: 'queue',
              label: (
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserAddOutlined style={{ color: '#0284c7' }} />
                  1. Quầy Tiếp Nhận & Hàng Chờ Cấp Số (Reception Desk)
                </span>
              ),
              children: (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 16,
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div>
                      <Title level={5} style={{ margin: 0, color: '#0369a1' }}>
                        Danh sách Cấp số Hàng chờ Khám Realtime
                      </Title>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Theo dõi thứ tự bệnh nhân, gọi loa và điều phối vào các buồng khám chuyên khoa
                      </Text>
                    </div>

                    <Space wrap>
                      <Select
                        placeholder="Lọc theo Khoa / Phòng khám"
                        allowClear
                        style={{ width: 260 }}
                        onChange={(val) => setSelectedDeptId(val)}
                      >
                        {departments.map((d) => (
                          <Option key={d.id} value={d.id}>
                            {d.departmentName} ({d.location})
                          </Option>
                        ))}
                      </Select>
                      <Button
                        type="primary"
                        icon={<ScanOutlined />}
                        style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                        onClick={() => setIsQrScanOpen(true)}
                      >
                        Quét QR App
                      </Button>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        style={{ backgroundColor: '#0ea5e9' }}
                        onClick={() => setIsModalOpen(true)}
                      >
                        Tiếp nhận mới
                      </Button>
                    </Space>
                  </div>

                  <Table
                    dataSource={queueList}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 8, showSizeChanger: false }}
                  />
                </div>
              ),
            },
            {
              key: 'triage',
              label: (
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HeartOutlined style={{ color: '#ea580c' }} />
                  2. Bàn Sàng Lọc & Đo Sinh Hiệu (Triage & Vital Signs Desk)
                  <Badge
                    count={queueList.filter((q) => !triagedMap[q.id] && q.status === 'Waiting').length}
                    style={{ backgroundColor: '#f97316' }}
                  />
                </span>
              ),
              children: (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 16,
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div>
                      <Title level={5} style={{ margin: 0, color: '#ea580c' }}>
                        Bàn Khám Sàng Lọc Phân Luồng & Đo Sinh Hiệu Tiền Lâm Sàng
                      </Title>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Đo Huyết áp, Mạch, Thân nhiệt, SpO2, BMI và phân loại mức độ bệnh trước khi bệnh nhân vào gặp Bác sĩ
                      </Text>
                    </div>

                    <Space>
                      <Tag color="cyan" style={{ padding: '4px 10px', fontSize: 13, borderRadius: 6 }}>
                        Đã đo sinh hiệu: <strong>{Object.keys(triagedMap).length}</strong>
                      </Tag>
                      <Tag color="orange" style={{ padding: '4px 10px', fontSize: 13, borderRadius: 6 }}>
                        Chờ sàng lọc: <strong>{queueList.filter((q) => !triagedMap[q.id]).length}</strong>
                      </Tag>
                      <Tag color="red" style={{ padding: '4px 10px', fontSize: 13, borderRadius: 6 }}>
                        Ưu tiên khẩn: <strong>{emergencyCount}</strong>
                      </Tag>
                    </Space>
                  </div>

                  {/* Bảng danh sách bệnh nhân tại Bàn Sàng Lọc */}
                  <Table
                    dataSource={queueList}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 8, showSizeChanger: false }}
                    columns={[
                      {
                        title: 'STT',
                        dataIndex: 'sequenceNumber',
                        key: 'sequenceNumber',
                        width: 90,
                        render: (stt: number, record: QueueTicketItem) => (
                          <Text
                            strong
                            style={{
                              fontSize: 18,
                              color: record.priority !== 'Normal' ? '#ef4444' : '#0284c7',
                            }}
                          >
                            #{stt}
                          </Text>
                        ),
                      },
                      {
                        title: 'Bệnh nhân',
                        key: 'patient',
                        render: (_: any, r: QueueTicketItem) => (
                          <div>
                            <Text strong style={{ fontSize: 14 }}>{r.patientName}</Text>
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                              {r.patientGender} • {r.patientAge} tuổi • Mã: {r.patientCode}
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: 'Phòng khám dự kiến',
                        dataIndex: 'departmentName',
                        key: 'dept',
                        render: (t: string) => <Tag color="blue">{t}</Tag>,
                      },
                      {
                        title: 'Kết quả Đo Sinh hiệu',
                        key: 'vitals',
                        render: (_: any, r: QueueTicketItem) => {
                          const v = triagedMap[r.id];
                          if (!v) {
                            return <Tag color="orange">Chưa có chỉ số</Tag>;
                          }
                          return (
                            <div style={{ fontSize: 12 }}>
                              <span style={{ fontWeight: 600, color: '#0369a1' }}>
                                HA: {v.bloodPressure} mmHg
                              </span>{' '}
                              • Mạch: {v.pulse} bpm • SpO2: {v.spO2}%
                              <div style={{ fontSize: 11, color: '#64748b' }}>
                                Thân nhiệt: {v.temperature}°C • BMI: {v.bmi} ({v.bmiClassification})
                              </div>
                            </div>
                          );
                        },
                      },
                      {
                        title: 'Phân luồng Triage',
                        key: 'triageLevel',
                        width: 140,
                        render: (_: any, r: QueueTicketItem) => {
                          const v = triagedMap[r.id];
                          const level = v?.triageLevel || r.priority;
                          if (level === 'Emergency') {
                            return <Tag color="red">🚨 Khẩn cấp</Tag>;
                          }
                          if (level === 'Priority' || level === 'Elderly' || level === 'Child') {
                            return <Tag color="orange">🟡 Ưu tiên</Tag>;
                          }
                          return <Tag color="green">🟢 Bình thường</Tag>;
                        },
                      },
                      {
                        title: 'Thao tác Sàng lọc',
                        key: 'action',
                        width: 160,
                        render: (_: any, r: QueueTicketItem) => (
                          <Button
                            type="primary"
                            icon={<HeartOutlined />}
                            style={{
                              backgroundColor: triagedMap[r.id] ? '#059669' : '#ea580c',
                              borderColor: triagedMap[r.id] ? '#059669' : '#ea580c',
                            }}
                            onClick={() => handleOpenTriageModal(r)}
                          >
                            {triagedMap[r.id] ? 'Cập nhật sinh hiệu' : 'Đo sinh hiệu'}
                          </Button>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Modal Đăng ký Tiếp nhận & Cấp số Mới */}
      <Modal
        title={
          <Space>
            <UserAddOutlined style={{ color: '#0284c7' }} />
            <span style={{ color: isDarkMode ? '#38bdf8' : '#0369a1', fontWeight: 700 }}>
              Đăng ký Tiếp nhận & Phát phiếu Cấp số mới
            </span>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleIssueTicket}>
          <Form.Item label="Chọn Bệnh nhân Đã đăng ký hệ thống" name="patientId">
            <Select
              showSearch
              placeholder="Gõ tên, số CCCD hoặc Mã bệnh nhân để chọn..."
              optionFilterProp="children"
              allowClear
              size="large"
            >
              {patients.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.maBenhNhan} - {p.hoTen} (CCCD: {p.soCCCD})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 12 }}>
            * Hoặc nhập thông tin bệnh nhân mới nếu chưa có hồ sơ:
          </Text>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item label="Họ và Tên Bệnh nhân Mới" name="hoTen">
                <Input placeholder="Ví dụ: Nguyễn Văn An" size="large" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item label="Giới tính" name="gioiTinh" initialValue="Nam">
                <Select size="large">
                  <Option value="Nam">Nam</Option>
                  <Option value="Nữ">Nữ</Option>
                  <Option value="Khác">Khác</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Số CCCD (12 số)" name="soCCCD">
                <Input placeholder="03809000xxxx" size="large" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Số Điện thoại" name="soDienThoai">
                <Input placeholder="0901234567" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Chọn Phòng khám & Chuyên khoa Nhận khám"
            name="departmentId"
            rules={[{ required: true, message: 'Vui lòng chọn phòng khám!' }]}
            initialValue={departments[0]?.id}
          >
            <Select size="large">
              {departments.map((d) => (
                <Option key={d.id} value={d.id}>
                  {d.departmentName} - {d.location}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Phân loại Luồng Ưu tiên (Triage Level)"
            name="triageLevel"
            initialValue="Normal"
          >
            <Select size="large">
              <Option value="Normal">🟢 Thông thường (Khám theo thứ tự)</Option>
              <Option value="Emergency">🚨 Ưu tiên Cấp cứu / Bệnh nặng</Option>
              <Option value="Elderly">👴 Ưu tiên Người cao tuổi (≥ 75 tuổi)</Option>
              <Option value="Child">👶 Ưu tiên Trẻ em dưới 6 tuổi</Option>
              <Option value="Pregnant">🤰 Ưu tiên Phụ nữ mang thai</Option>
            </Select>
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy bỏ</Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<PrinterOutlined />}
                loading={submitting}
                style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
              >
                Cấp số & In phiếu Nhiệt
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Modal In Phiếu STT Nhiệt K80 */}
      <Modal
        title={
          <Space>
            <PrinterOutlined style={{ color: '#0284c7' }} />
            <span>In Phiếu Số Thứ Tự (STT Ticket K80)</span>
          </Space>
        }
        open={isTicketModalOpen}
        onCancel={() => setIsTicketModalOpen(false)}
        width={400}
        footer={[
          <Button key="close" onClick={() => setIsTicketModalOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            style={{ backgroundColor: '#0284c7' }}
            onClick={() => {
              window.print();
              showToast('Đã in phiếu STT K80 nhiệt!', 'success');
            }}
          >
            In Phiếu STT
          </Button>,
        ]}
      >
        {ticketToPrint && (
          <div
            id="printable-ticket"
            style={{
              padding: 20,
              backgroundColor: '#ffffff',
              color: '#0f172a',
              textAlign: 'center',
              fontFamily: 'monospace',
              border: '2px dashed #94a3b8',
              borderRadius: 12,
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 6 }}>
              <img
                src="/logo_icon.png"
                alt="D-Medical Logo"
                style={{ height: 42, objectFit: 'contain', marginBottom: 4 }}
              />
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: '#0369a1' }}>
              BV ĐA KHOA QUỐC TẾ D-MEDICAL
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>PHIẾU KHÁM BỆNH & BỐC SỐ TỰ ĐỘNG</div>
            <Divider style={{ margin: '10px 0' }} />

            <div style={{ fontSize: 12, color: '#475569' }}>SỐ THỨ TỰ CỦA BẠN:</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: ticketToPrint.priority === 'Emergency' ? '#ef4444' : '#0284c7', margin: '4px 0' }}>
              #{ticketToPrint.sequenceNumber}
            </div>

            {ticketToPrint.priority === 'Emergency' && (
              <Tag color="red" style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>
                🚨 LUỒNG ƯU TIÊN / CẤP CỨU
              </Tag>
            )}

            <div style={{ textAlign: 'left', marginTop: 12, fontSize: 12, backgroundColor: '#f0f9ff', padding: 10, borderRadius: 8 }}>
              <div>Bệnh nhân: <strong>{ticketToPrint.patientName}</strong></div>
              <div>Mã BN: <strong>{ticketToPrint.patientCode}</strong></div>
              <div>Phòng khám: <strong>{ticketToPrint.departmentName}</strong></div>
              <div>Vị trí: <strong>{ticketToPrint.location}</strong></div>
              <div>Thời gian cấp: <strong>{new Date().toLocaleTimeString('vi-VN')}</strong></div>
            </div>

            {/* QR Code tra cứu trên Mobile App */}
            <div style={{ margin: '14px 0 8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <QRCodeSVG
                value={`https://dmedical.hospital.vn/queue/${ticketToPrint.id || ticketToPrint.sequenceNumber}`}
                size={84}
                level="M"
              />
              <span style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>Quét mã QR để theo dõi hàng chờ trên App</span>
            </div>

            <div style={{ marginTop: 10, fontSize: 10, color: '#94a3b8' }}>
              Vui lòng theo dõi màn hình TV và loa gọi số trước cửa phòng khám.<br />
              D-Medical xin cảm ơn Quý bệnh nhân!
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Quét Mã QR Tiếp Nhận (App Mobile - Bỏ STT) */}
      <Modal
        title={
          <Space>
            <ScanOutlined style={{ color: '#0284c7' }} />
            <span>Tiếp Nhận Điện Tử Bằng Mã QR (Bệnh Nhân App)</span>
          </Space>
        }
        open={isQrScanOpen}
        onCancel={() => setIsQrScanOpen(false)}
        onOk={handleQrScanSubmit}
        confirmLoading={qrProcessing}
        okText="Xác Nhận Tiếp Nhận"
        cancelText="Đóng"
        width={450}
        centered
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
            Bệnh nhân đã đặt lịch trên Mobile App chỉ cần đưa mã QR để quét (không cần bốc số thứ tự STT giấy):
          </p>
          <Input
            size="large"
            prefix={<QrcodeOutlined style={{ color: '#0284c7' }} />}
            placeholder="Quét mã QR hoặc nhập: MEDQR|apt-... hoặc Mã BN"
            value={qrInputCode}
            onChange={(e) => setQrInputCode(e.target.value)}
            onPressEnter={handleQrScanSubmit}
            autoFocus
            style={{ borderRadius: 10, fontFamily: 'monospace' }}
          />
        </div>
      </Modal>

      {/* Modal Bàn Sàng Lọc - Đo Chỉ Số Sinh Hiệu & Phân Luồng Triage */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ea580c' }}>
            <HeartOutlined style={{ fontSize: 20 }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>
              Bàn Sàng Lọc Y Tế • Đo Chỉ Số Sinh Hiệu & Phân Luồng Triage
            </span>
          </div>
        }
        open={isTriageModalOpen}
        onCancel={() => setIsTriageModalOpen(false)}
        footer={null}
        destroyOnClose
        width={720}
        centered
      >
        {selectedTicketForTriage && (
          <div>
            {/* Header thông tin bệnh nhân */}
            <div
              style={{
                backgroundColor: isDarkMode ? '#1e293b' : '#f0f9ff',
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid #bae6fd',
                marginBottom: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div>
                <Text style={{ fontSize: 12, color: '#64748b' }}>Bệnh nhân đang sàng lọc:</Text>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0369a1' }}>
                  {selectedTicketForTriage.patientName}{' '}
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>
                    ({selectedTicketForTriage.patientGender} • {selectedTicketForTriage.patientAge} tuổi)
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Mã BN: <strong style={{ color: '#0f172a' }}>{selectedTicketForTriage.patientCode}</strong> • Chuyên khoa:{' '}
                  <strong>{selectedTicketForTriage.departmentName}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>Số Thứ Tự Cấp</Text>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0284c7', lineHeight: 1 }}>
                  #{selectedTicketForTriage.sequenceNumber}
                </div>
              </div>
            </div>

            <Form
              form={triageForm}
              layout="vertical"
              onFinish={handleSaveTriage}
            >
              <Divider style={{ margin: '10px 0 16px' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0284c7' }}>
                  I. CHỈ SỐ SINH HIỆU TIỀN LÂM SÀNG (VITAL SIGNS)
                </span>
              </Divider>

              <Row gutter={12}>
                <Col span={6}>
                  <Form.Item
                    label="Huyết áp (BP)"
                    name="bloodPressure"
                    rules={[{ required: true, message: 'Nhập huyết áp' }]}
                  >
                    <Input placeholder="vd: 120/80" addonAfter="mmHg" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label="Mạch (Pulse)"
                    name="pulse"
                    rules={[{ required: true, message: 'Nhập nhịp tim' }]}
                  >
                    <InputNumber min={30} max={220} style={{ width: '100%' }} addonAfter="bpm" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label="Thân nhiệt (Temp)"
                    name="temperature"
                    rules={[{ required: true, message: 'Nhập thân nhiệt' }]}
                  >
                    <InputNumber min={34} max={43} step={0.1} style={{ width: '100%' }} addonAfter="°C" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label="Nồng độ SpO2"
                    name="spO2"
                    rules={[{ required: true, message: 'Nhập SpO2' }]}
                  >
                    <InputNumber min={70} max={100} style={{ width: '100%' }} addonAfter="%" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={6}>
                  <Form.Item label="Nhịp thở (RR)" name="respiratoryRate">
                    <InputNumber min={10} max={60} style={{ width: '100%' }} addonAfter="lần/ph" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Chiều cao (Height)" name="height">
                    <InputNumber
                      min={40}
                      max={230}
                      style={{ width: '100%' }}
                      addonAfter="cm"
                      onChange={(v) => setTriageHeight(Number(v) || 168)}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Cân nặng (Weight)" name="weight">
                    <InputNumber
                      min={2}
                      max={250}
                      style={{ width: '100%' }}
                      addonAfter="kg"
                      onChange={(v) => setTriageWeight(Number(v) || 65)}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <div style={{ paddingTop: 28 }}>
                    {(() => {
                      const res = calculateBmi(triageHeight, triageWeight);
                      return (
                        <Tooltip title="Tự động tính BMI theo chuẩn WHO Tây Thái Bình Dương cho người châu Á">
                          <Tag
                            color={res.color}
                            style={{
                              width: '100%',
                              textAlign: 'center',
                              padding: '5px 0',
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: 6,
                            }}
                          >
                            BMI: {res.bmi} • {res.text}
                          </Tag>
                        </Tooltip>
                      );
                    })()}
                  </div>
                </Col>
              </Row>

              <Divider style={{ margin: '10px 0 16px' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#ea580c' }}>
                  II. TRIỆU CHỨNG BAN ĐẦU & PHÂN LUỒNG TRIAGE
                </span>
              </Divider>

              <Form.Item
                label="Lý do khám / Triệu chứng ban đầu ghi nhận tại bàn sàng lọc"
                name="initialSymptoms"
              >
                <Input.TextArea
                  rows={2}
                  placeholder="Ví dụ: Đau đầu âm ỉ kèm chóng mặt 2 ngày, không sốt, tiền sử tăng huyết áp..."
                />
              </Form.Item>

              <Form.Item
                label="Mức độ Phân luồng Ưu tiên (Triage Priority)"
                name="triageLevel"
                rules={[{ required: true, message: 'Chọn mức độ ưu tiên' }]}
              >
                <Radio.Group style={{ width: '100%' }}>
                  <Row gutter={[12, 12]}>
                    <Col span={8}>
                      <Radio.Button
                        value="Normal"
                        style={{
                          width: '100%',
                          textAlign: 'center',
                          borderRadius: 8,
                          height: 'auto',
                          padding: '8px 4px',
                        }}
                      >
                        <div style={{ color: '#16a34a', fontWeight: 700 }}>🟢 Bình Thường</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Khám theo số thứ tự</div>
                      </Radio.Button>
                    </Col>
                    <Col span={8}>
                      <Radio.Button
                        value="Priority"
                        style={{
                          width: '100%',
                          textAlign: 'center',
                          borderRadius: 8,
                          height: 'auto',
                          padding: '8px 4px',
                        }}
                      >
                        <div style={{ color: '#ea580c', fontWeight: 700 }}>🟡 Cần Ưu Tiên</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Người già / Trẻ nhỏ / Sốt</div>
                      </Radio.Button>
                    </Col>
                    <Col span={8}>
                      <Radio.Button
                        value="Emergency"
                        style={{
                          width: '100%',
                          textAlign: 'center',
                          borderRadius: 8,
                          height: 'auto',
                          padding: '8px 4px',
                        }}
                      >
                        <div style={{ color: '#dc2626', fontWeight: 700 }}>🚨 Cấp Cứu Khẩn</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Đẩy ngay lên đầu phòng khám</div>
                      </Radio.Button>
                    </Col>
                  </Row>
                </Radio.Group>
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <Button onClick={() => setIsTriageModalOpen(false)}>Hủy bỏ</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<FileDoneOutlined />}
                  loading={triageSubmitting}
                  style={{
                    backgroundColor: '#ea580c',
                    borderColor: '#ea580c',
                    fontWeight: 600,
                  }}
                >
                  Lưu Sinh Hiệu & Xác Nhận Phân Luồng
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};
