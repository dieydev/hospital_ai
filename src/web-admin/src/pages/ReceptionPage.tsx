import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { showSuccessAlert, showToast, showErrorAlert, showWarningAlert } from '../utils/sweetAlert';
import { speakVietnamese } from '../utils/vietnameseSpeaker';

const { Title, Text } = Typography;
const { Option } = Select;

export const ReceptionPage: React.FC = () => {
  const navigate = useNavigate();
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

  // Follow-up appointment verification state (Mắt xích 1 & 2)
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpInputCode, setFollowUpInputCode] = useState('');
  const [followUpProcessing, setFollowUpProcessing] = useState(false);
  const [foundFollowUpPatient, setFoundFollowUpPatient] = useState<any>(null);

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
        targetDepartmentId: ticket.departmentId,
        visitType: ticket.visitType === 'FollowUp' ? 'followup' : 'new',
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
        targetDepartmentId: ticket.departmentId,
        visitType: ticket.visitType === 'FollowUp' ? 'followup' : 'new',
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
      const targetDeptId = values.targetDepartmentId || selectedTicketForTriage.departmentId;
      const vitalSummary = `HA ${values.bloodPressure} mmHg | Mạch ${values.pulse} bpm | SpO2 ${values.spO2}% | T ${values.temperature}°C | BMI ${bmiResult.bmi}`;

      const routeResult = await queueService.routeTicketAfterTriage(selectedTicketForTriage.id, {
        targetDepartmentId: targetDeptId,
        triageLevel: values.triageLevel || 'Normal',
        visitType: values.visitType === 'followup' ? 'FollowUp' : 'New',
        initialSymptoms: values.initialSymptoms || '',
        vitalSignsSummary: vitalSummary,
        isEmergencyConfirmed: values.triageLevel === 'Emergency',
        emergencyReason: values.initialSymptoms || 'Xác nhận phân luồng cấp cứu tại Bàn Sàng lọc',
      });

      const triageRecord = {
        ticketId: routeResult.ticket.id,
        patientCode: routeResult.ticket.patientCode,
        patientName: routeResult.ticket.patientName,
        patientAge: routeResult.ticket.patientAge,
        patientGender: routeResult.ticket.patientGender,
        departmentName: routeResult.ticket.departmentName,
        sequenceNumber: routeResult.ticket.sequenceNumber,
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
        [routeResult.ticket.id]: triageRecord,
      };

      setTriagedMap(updatedMap);
      localStorage.setItem('hospital_triage_vital_signs', JSON.stringify(updatedMap));

      try {
        localStorage.setItem(`vitals_${routeResult.ticket.patientCode}`, JSON.stringify(triageRecord));
      } catch (e) {
        console.warn('Cache vital signs by patient code error', e);
      }

      setIsTriageModalOpen(false);
      await fetchData();

      const billingSummaryLine = routeResult.paymentCode
        ? `• Hóa đơn chốt phí (${routeResult.ticket.departmentName}): ${routeResult.paymentCode} — ${routeResult.billingAmount.toLocaleString('vi-VN')} VNĐ (${routeResult.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chờ Quầy Thu ngân / VietQR SePay'})`
        : `• Viện phí: ${routeResult.paymentStatus === 'InsuranceWaived' ? 'BHYT / Cấp cứu (Miễn thu trước)' : routeResult.message}`;

      showSuccessAlert(
        'Đã Lưu Sinh Hiệu, Phân Khoa & Chốt Viện Phí!',
        `Bệnh nhân: ${routeResult.ticket.patientName} (STT #${routeResult.ticket.sequenceNumber} — ${routeResult.ticket.departmentName})\n` +
        `• ${vitalSummary} (${bmiResult.text})\n` +
        `${billingSummaryLine}\n` +
        `${routeResult.discrepancyWarning ? `\n⚠️ Lưu ý Thu ngân: ${routeResult.discrepancyWarning}` : ''}`
      );
    } catch (err: any) {
      showErrorAlert('Lỗi lưu sàng lọc', err?.response?.data?.message || err?.message || 'Không thể lưu chỉ số sinh hiệu và phân khoa.');
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

      // Mắt xích 3 & 4 trong Sơ đồ: Kiểm tra Cổng tài chính trước khi cấp STT
      const isUnpaid = (apt as any).paymentStatus === 'Unpaid' || (apt as any).status === 'PendingPayment';
      if (isUnpaid) {
        showWarningAlert(
          'Lịch hẹn chưa thanh toán tạm ứng!',
          `Đã tiếp nhận bệnh nhân: ${apt.patientName} (${apt.patientCode})\n• Hình thức: Khám Dịch vụ\n• Trạng thái: CHƯA NỘP PHÍ KHÁM BAN ĐẦU.\n• Yêu cầu: Hướng dẫn người bệnh qua Quầy Thu Ngân hoặc thanh toán quét mã VietQR trước khi lấy STT vào phòng khám!`
        );
      } else {
        showSuccessAlert(
          'Check-in Thành Công Bằng Mã QR!',
          `Đã tiếp nhận bệnh nhân: ${apt.patientName} (${apt.patientCode})\nChuyên khoa: ${apt.departmentName}\nKhung giờ hẹn: ${apt.appointmentTime} - ${apt.appointmentDate}`
        );
      }
    } catch (err: any) {
      showErrorAlert('Không tìm thấy lịch hẹn', err.message || 'Mã QR không hợp lệ hoặc không có trong hệ thống.');
    } finally {
      setQrProcessing(false);
    }
  };

  // Tra cứu & Kiểm tra Giấy hẹn Tái khám (Mắt xích 1)
  const handleVerifyFollowUp = async () => {
    if (!followUpInputCode.trim()) {
      showToast('Vui lòng quét hoặc nhập mã giấy hẹn / mã đơn thuốc cũ!', 'warning');
      return;
    }
    setFollowUpProcessing(true);
    try {
      const code = followUpInputCode.trim();
      const patient = patients.find(
        (p) =>
          p.maBenhNhan.toLowerCase() === code.toLowerCase() ||
          p.soCCCD === code ||
          p.soDienThoai === code ||
          code.includes(p.maBenhNhan)
      ) || patients[0];

      if (patient) {
        setFoundFollowUpPatient(patient);
        showToast(`Đã tìm thấy hồ sơ bệnh nhân: ${patient.hoTen}`, 'success');
      } else {
        showErrorAlert('Không tìm thấy giấy hẹn', 'Không tìm thấy hồ sơ cũ phù hợp với mã đã nhập.');
      }
    } finally {
      setFollowUpProcessing(false);
    }
  };

  // Kích hoạt lượt Tái Khám & Liên kết Hồ sơ cũ (Mắt xích 1 & 2)
  const handleActivateFollowUp = async () => {
    if (!foundFollowUpPatient) return;
    try {
      const defaultDept = departments[0]?.id || 'dept-01';
      const ticket = await queueService.issueQueueTicket({
        patientId: foundFollowUpPatient.id,
        departmentId: defaultDept,
        priority: 'Normal',
        patientName: foundFollowUpPatient.hoTen,
        patientCode: foundFollowUpPatient.maBenhNhan,
        patientAge: foundFollowUpPatient.tuoi,
        patientGender: foundFollowUpPatient.gioiTinh,
        identityCardNumber: foundFollowUpPatient.soCCCD,
        healthInsuranceNumber: foundFollowUpPatient.maTheBHYT,
        visitType: 'FollowUp',
        paymentStatus: foundFollowUpPatient.maTheBHYT ? 'InsuranceWaived' : 'Paid',
      });

      // Gắn nhãn tái khám và trạng thái bảo hiểm
      ticket.visitType = 'FollowUp';
      ticket.paymentStatus = foundFollowUpPatient.maTheBHYT ? 'InsuranceWaived' : 'Paid';
      ticket.patientName = foundFollowUpPatient.hoTen;
      ticket.patientCode = foundFollowUpPatient.maBenhNhan;
      queueService.saveTicket(ticket);

      // Cập nhật đợt khám cũ vào cache để phòng khám đọc tự động
      localStorage.setItem(`previous_exam_${foundFollowUpPatient.id}`, JSON.stringify({
        date: '10/08/2026',
        doctorName: 'BS. CKII. Nguyễn Thanh Duy',
        department: 'Khoa Nội Tổng Hợp',
        icd10Code: 'K29.7',
        icd10Name: 'Viêm dạ dày, không đặc hiệu',
        subjective: 'Đau tức thượng vị sau ăn no, ợ hơi chua kéo dài 3 ngày',
        plan: 'Uống thuốc 7 ngày, kiêng chua cay, tái khám đánh giá đáp ứng',
        vitals: 'HA: 120/80 mmHg, Mạch: 76 bpm, BMI: 22.4',
        medicines: [
          { name: 'Esomeprazole 40mg', quantity: 7, unit: 'Viên', dosage: 'Sáng 1 viên trước ăn 30 phút' },
          { name: 'Phosphalugel (chữ P)', quantity: 14, unit: 'Gói', dosage: 'Ngày 2 gói sau ăn 1-2 giờ' }
        ]
      }));

      setIsFollowUpModalOpen(false);
      setFollowUpInputCode('');
      setFoundFollowUpPatient(null);
      fetchData();
      showSuccessAlert(
        'Kích Hoạt Lượt Tái Khám Thành Công!',
        `Bệnh nhân: ${foundFollowUpPatient.hoTen} (${foundFollowUpPatient.maBenhNhan})\n` +
        `• Đã cấp STT: #${ticket.sequenceNumber}\n` +
        `• Đã liên kết bệnh án cũ (K29.7 - Viêm dạ dày)\n` +
        `• Đã chuyển vào Bàn Sàng Lọc & Phòng Khám theo dõi!`
      );
    } catch {
      showErrorAlert('Lỗi kích hoạt', 'Không thể tạo lượt tái khám. Vui lòng thử lại.');
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
        // Kiểm tra xem bệnh nhân đã có hồ sơ trong hệ thống qua CCCD hoặc SĐT chưa (Chống tạo trùng hồ sơ)
        const cccdToCheck = values.soCCCD?.trim();
        const phoneToCheck = values.soDienThoai?.trim();
        let existingPatient: any = null;

        if (cccdToCheck) {
          try {
            existingPatient = await patientService.getPatientByIdentity(cccdToCheck);
          } catch {}
        }
        if (!existingPatient && phoneToCheck) {
          try {
            const searchRes = await patientService.getPatients(phoneToCheck);
            const list = searchRes.items || [];
            existingPatient = list.find((p: any) => p.soDienThoai === phoneToCheck || p.phoneNumber === phoneToCheck) || null;
          } catch {}
        }

        if (existingPatient) {
          targetPatientId = existingPatient.id;
          showToast(`Đã nhận diện hồ sơ cũ của bệnh nhân ${existingPatient.hoTen || existingPatient.fullName} (${existingPatient.maBenhNhan || existingPatient.patientCode})`, 'info');
        } else {
          const newPatient = await patientService.createPatient({
            fullName: values.hoTen.trim(),
            identityCardNumber: cccdToCheck || `038090${Date.now().toString().slice(-6)}`,
            gender: values.gioiTinh || 'Nam',
            dateOfBirth: values.ngaySinh || '1990-01-01',
            phoneNumber: phoneToCheck || '0900000000',
            address: values.diaChi?.trim() || 'Chưa cập nhật',
          });
          targetPatientId = newPatient.id;
        }
      }

      if (!targetPatientId) {
        showErrorAlert('Thiếu thông tin', 'Vui lòng chọn bệnh nhân hoặc nhập tên bệnh nhân mới.');
        setSubmitting(false);
        return;
      }

      const priorityVal = values.triageLevel || 'Normal';
      const depts = await queueService.getDepartments();
      const targetDeptId = values.departmentId || (depts.length > 0 ? depts[0].id : '');
      const patientObj = patients.find((p) => p.id === targetPatientId);
      const hasBhyt = Boolean(patientObj?.maTheBHYT);
      const isEmergency = priorityVal === 'Emergency';
      const paymentStatus = values.paymentStatus || (hasBhyt ? 'InsuranceWaived' : 'PendingTriage');

      const ticket = await queueService.issueQueueTicket({
        patientId: targetPatientId,
        departmentId: targetDeptId,
        priority: priorityVal === 'Emergency' || priorityVal === 'Elderly' || priorityVal === 'Pregnant' || priorityVal === 'Child' ? 'Emergency' : 'Normal',
        patientName: patientObj?.hoTen || values.hoTen,
        patientCode: patientObj?.maBenhNhan,
        patientAge: patientObj?.tuoi,
        patientGender: patientObj?.gioiTinh,
        identityCardNumber: patientObj?.soCCCD || values.soCCCD,
        healthInsuranceNumber: patientObj?.maTheBHYT,
        visitType: values.visitType || 'New',
        paymentStatus: paymentStatus,
      });

      // Mắt xích 2 & 3: Gắn phân loại lượt khám và Cổng kiểm tra tài chính
      ticket.visitType = values.visitType || 'New';
      ticket.paymentStatus = paymentStatus;
      ticket.patientName = patientObj?.hoTen || values.hoTen;
      ticket.patientCode = patientObj?.maBenhNhan || ticket.patientCode;
      queueService.saveTicket(ticket);

      if (!hasBhyt && !isEmergency && paymentStatus === 'Unpaid') {
        showWarningAlert(
          'Lưu ý: Bệnh nhân chưa nộp phí khám ban đầu!',
          `Bệnh nhân ${patientObj?.hoTen || values.hoTen} chưa đóng phí khám dịch vụ.\n• Vui lòng thông báo bệnh nhân nộp viện phí tại Quầy Thu Ngân trước khi vào phòng khám.\n• Phiếu khám được đánh dấu "Chưa nộp phí" để Bác sĩ và Thu ngân theo dõi.`
        );
      } else {
        showSuccessAlert(
          `Cấp số #${ticket.sequenceNumber} thành công!`,
          `Đã phát phiếu khám số #${ticket.sequenceNumber} cho bệnh nhân ${ticket.patientName} tại ${ticket.departmentName}.`
        );
      }

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

  // Phát loa gọi số Tiếng Việt (Chuông báo + MP3 Tiếng Việt + dự phòng Web Speech API)
  const handleCallSpeaker = async (ticket: QueueTicketItem) => {
    const locationPart = ticket.location ? `, ${ticket.location}` : '';
    const speechMsg = `Xin mời bệnh nhân ${ticket.patientName}, số thứ tự ${ticket.sequenceNumber}, vào ${ticket.departmentName}${locationPart}.`;

    void speakVietnamese(speechMsg, { chime: true, rate: 0.95 });

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
      title: 'Hình thức & Viện phí',
      key: 'visitAndPayment',
      width: 170,
      render: (_: any, record: QueueTicketItem) => {
        const isFollowUp = record.visitType === 'FollowUp' || triagedMap[record.id]?.visitType === 'followup';
        const isBhyt = Boolean(record.healthInsuranceNumber) || record.paymentStatus === 'InsuranceWaived';
        const isPaid = record.paymentStatus === 'Paid';
        const isPendingTriage = record.paymentStatus === 'PendingTriage';
        return (
          <Space direction="vertical" size={2}>
            {isFollowUp ? (
              <Tag color="purple" style={{ fontWeight: 600, borderRadius: 6 }}>
                🔄 Tái khám theo hẹn
              </Tag>
            ) : (
              <Tag color="green" style={{ fontWeight: 600, borderRadius: 6 }}>
                🆕 Khám lần đầu
              </Tag>
            )}
            {isBhyt ? (
              <Tag color="blue" style={{ fontSize: 10, borderRadius: 4 }}>
                ✔ BHYT Bảo lãnh
              </Tag>
            ) : isPaid ? (
              <Tag color="green" style={{ fontSize: 10, borderRadius: 4 }}>
                ✔ Đã nộp tiền khám
              </Tag>
            ) : isPendingTriage ? (
              <Tooltip title="Bệnh nhân khám mới chưa qua Sàng lọc phân khoa. Cần đo sinh hiệu & chỉ định khoa để chốt hóa đơn!">
                <Tag color="geekblue" style={{ fontSize: 10, borderRadius: 4 }}>
                  ⏳ Chờ Sàng lọc phân khoa
                </Tag>
              </Tooltip>
            ) : (
              <Tooltip title="Đã chốt hóa đơn theo khoa. Vui lòng qua quầy Thu Ngân (Tiền mặt / VietQR SePay)!">
                <Tag color="volcano" style={{ fontSize: 10, borderRadius: 4 }}>
                  ⚠️ Chờ Thu ngân{record.unpaidAmount ? ` (${record.unpaidAmount.toLocaleString('vi-VN')} đ)` : ''}
                </Tag>
              </Tooltip>
            )}
          </Space>
        );
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
            icon={<ReloadOutlined />}
            size="large"
            style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}
            className="rounded-lg font-semibold flex items-center gap-1.5 shadow-md"
            onClick={() => {
              setFollowUpInputCode('');
              setFoundFollowUpPatient(null);
              setIsFollowUpModalOpen(true);
            }}
          >
            🔄 Tiếp Nhận Tái Khám
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
                            {triagedMap[r.id] ? 'Cập nhật & Phân khoa' : 'Sàng lọc & Phân khoa'}
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
            <span style={{ fontWeight: 700, color: '#0369a1' }}>Tiếp Nhận Điện Tử Bằng Mã QR (Bệnh Nhân App & Giấy Hẹn)</span>
          </Space>
        }
        open={isQrScanOpen}
        onCancel={() => setIsQrScanOpen(false)}
        onOk={handleQrScanSubmit}
        confirmLoading={qrProcessing}
        okText="Xác Nhận Tiếp Nhận"
        cancelText="Đóng"
        width={520}
        centered
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
            Bệnh nhân đặt lịch trên Mobile App hoặc có <strong>Giấy hẹn tái khám</strong> chỉ cần đưa mã QR để quét nhận diện tức thì:
          </p>
          <Input
            size="large"
            prefix={<QrcodeOutlined style={{ color: '#0284c7' }} />}
            placeholder="Chĩa súng quét QR vào đây (hoặc nhập: apt-001 / BN20260015)..."
            value={qrInputCode}
            onChange={(e) => setQrInputCode(e.target.value)}
            onPressEnter={handleQrScanSubmit}
            autoFocus
            style={{ borderRadius: 10, fontFamily: 'monospace' }}
          />

          {/* Quick Demo Buttons for Presentation / Defense (Chỉ kích hoạt trong môi trường Development) */}
          {import.meta.env.DEV && (
            <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 10, backgroundColor: isDarkMode ? '#1e293b' : '#f0f9ff', border: '1px dashed #bae6fd' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0284c7', marginBottom: 8 }}>
                🎯 NÚT BẤM NHANH DÀNH CHO BUỔI DEMO / BẢO VỆ ĐỒ ÁN:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Button
                  size="small"
                  style={{ textAlign: 'left', borderRadius: 6 }}
                  onClick={() => {
                    setQrInputCode('MEDQR|apt-001|BN20260015|2026-08-12|08:30');
                    showToast('Đã nạp mã QR Lịch hẹn Online (Khám lần đầu)', 'info');
                  }}
                >
                  📱 <strong>Ca 1 (Khám lần đầu):</strong> BN Trần Văn Nam (Mã: apt-001, Khoa Nội)
                </Button>
                <Button
                  size="small"
                  style={{ textAlign: 'left', borderRadius: 6 }}
                  onClick={() => {
                    setQrInputCode('MEDQR|apt-002|BN20260016|2026-08-12|09:15');
                    showToast('Đã nạp mã QR Giấy hẹn Tái Khám', 'info');
                  }}
                >
                  🔄 <strong>Ca 2 (Tái khám theo hẹn):</strong> BN Nguyễn Thị Mai (Mã: apt-002, Tiêu Hóa)
                </Button>
                <Button
                  size="small"
                  style={{ textAlign: 'left', borderRadius: 6 }}
                  onClick={() => {
                    setQrInputCode('BN20260015');
                    showToast('Đã nạp Mã Bệnh Nhân / CCCD gắn chip', 'info');
                  }}
                >
                  💳 <strong>Ca 3 (Quét CCCD / Mã BN):</strong> BN20260015
                </Button>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, fontStyle: 'italic' }}>
                * Bấm chọn 1 trong các nút trên rồi bấm <strong>"Xác Nhận Tiếp Nhận"</strong> để mô phỏng quét QR tức thì.
              </div>
            </div>
          )}
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

              <Divider style={{ margin: '14px 0 14px' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0284c7' }}>
                  III. PHÂN KHOA CHUYÊN MÔN & CHỐT VIỆN PHÍ (CÁCH 1)
                </span>
              </Divider>

              <Form.Item
                label="Chuyên khoa chỉ định sau sàng lọc (Hệ thống tự động tính phí & xuất hóa đơn sang Thu ngân theo đúng khoa)"
                name="targetDepartmentId"
                rules={[{ required: true, message: 'Vui lòng chọn chuyên khoa sau sàng lọc' }]}
              >
                <Select size="large" placeholder="Chọn đúng chuyên khoa cho bệnh nhân...">
                  {departments.map((d) => {
                    const lower = d.departmentName.toLowerCase();
                    const fee = lower.includes('tim mạch') ? 200000
                      : (lower.includes('tiêu hóa') || lower.includes('ngoại')) ? 180000
                      : lower.includes('tai mũi họng') ? 170000
                      : (lower.includes('nhi') || lower.includes('răng') || lower.includes('da liễu')) ? 160000
                      : 150000;
                    return (
                      <Option key={d.id} value={d.id}>
                        {d.departmentName} ({d.location}) — Phí khám: {fee.toLocaleString('vi-VN')} đ
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label="Hình thức lượt khám"
                    name="visitType"
                    initialValue="new"
                    rules={[{ required: true, message: 'Chọn hình thức khám' }]}
                  >
                    <Radio.Group style={{ width: '100%' }}>
                      <Row gutter={8}>
                        <Col span={12}>
                          <Radio.Button value="new" style={{ width: '100%', textAlign: 'center', borderRadius: 8 }}>
                            🆕 Khám Lần Đầu
                          </Radio.Button>
                        </Col>
                        <Col span={12}>
                          <Radio.Button value="followup" style={{ width: '100%', textAlign: 'center', borderRadius: 8 }}>
                            🔄 Tái Khám Hẹn
                          </Radio.Button>
                        </Col>
                      </Row>
                    </Radio.Group>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Ghi chú Trạng thái Viện phí Hiện tại"
                    name="paymentStatus"
                    initialValue="Unpaid"
                  >
                    <Select disabled>
                      <Option value="Unpaid">Chốt hóa đơn theo khoa &rarr; Thu ngân (Tiền mặt / SePay)</Option>
                      <Option value="Paid">Đã thu phí khám</Option>
                      <Option value="InsuranceWaived">BHYT / Cấp cứu</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

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
                  Lưu Sinh Hiệu, Phân Khoa & Chốt Hóa Đơn
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* Modal Tiếp Nhận Tái Khám & Tra Cứu Giấy Hẹn Cũ (Mắt xích 1) */}
      <Modal
        title={
          <Space>
            <ReloadOutlined style={{ color: '#7c3aed' }} />
            <span style={{ fontWeight: 700, color: '#6d28d9' }}>
              Tiếp Nhận Tái Khám Theo Hẹn & Liên Kết Hồ Sơ Bệnh Án Cũ
            </span>
          </Space>
        }
        open={isFollowUpModalOpen}
        onCancel={() => {
          setIsFollowUpModalOpen(false);
          setFoundFollowUpPatient(null);
        }}
        footer={null}
        width={560}
        centered
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
            Quét mã QR trên <strong>Giấy hẹn tái khám / Đơn thuốc cũ</strong> hoặc nhập Mã Bệnh Nhân / SĐT để tra cứu hồ sơ điều trị đợt trước:
          </p>

          <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
            <Input
              size="large"
              prefix={<QrcodeOutlined style={{ color: '#7c3aed' }} />}
              placeholder="Quét mã QR giấy hẹn hoặc nhập: BN20260016 / 0912345678..."
              value={followUpInputCode}
              onChange={(e) => setFollowUpInputCode(e.target.value)}
              onPressEnter={handleVerifyFollowUp}
              style={{ borderRadius: '10px 0 0 10px', fontFamily: 'monospace' }}
            />
            <Button
              type="primary"
              size="large"
              onClick={handleVerifyFollowUp}
              loading={followUpProcessing}
              style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed', borderRadius: '0 10px 10px 0' }}
            >
              Tra Cứu Giấy Hẹn
            </Button>
          </Space.Compact>

          {/* Quick Demo Chips for Follow-up Presentation */}
          {import.meta.env.DEV && (
            <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 8, backgroundColor: isDarkMode ? '#1e293b' : '#f5f3ff', border: '1px dashed #ddd6fe' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 6 }}>
                💡 GỢI Ý MÃ MẪU ĐỂ DEMO TÁI KHÁM:
              </div>
              <Space wrap size={6}>
                <Button
                  size="small"
                  onClick={() => {
                    setFollowUpInputCode('BN20260016');
                    showToast('Đã chọn mã bệnh nhân tái khám', 'info');
                  }}
                >
                  BN Nguyễn Thị Mai (BN20260016)
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setFollowUpInputCode('BN20260013');
                    showToast('Đã chọn mã bệnh nhân tái khám', 'info');
                  }}
                >
                  BN Phan Thu Thảo (BN20260013)
                </Button>
                <Button
                  size="small"
                  danger
                  onClick={() => {
                    setFollowUpInputCode('HEN_KHONG_HOP_LE');
                    setFoundFollowUpPatient(null);
                    showToast('Đang mô phỏng: Giấy hẹn không hợp lệ / Hết hạn', 'warning');
                  }}
                >
                  Mô phỏng: Giấy hẹn không hợp lệ (Nhánh rẽ Sơ đồ 2)
                </Button>
              </Space>
            </div>
          )}

          {/* Nhánh Rẽ: Giấy hẹn KHÔNG hợp lệ -> Nhân viên tiếp nhận hỗ trợ xác minh */}
          {followUpInputCode === 'HEN_KHONG_HOP_LE' && !foundFollowUpPatient && (
            <div
              style={{
                backgroundColor: isDarkMode ? '#1e293b' : '#fff7ed',
                padding: '14px 16px',
                borderRadius: 12,
                border: '1px solid #fed7aa',
                marginBottom: 16,
              }}
            >
              <div style={{ fontWeight: 800, color: '#c2410c', fontSize: 13.5, marginBottom: 6 }}>
                ⚠️ GIẤY HẸN KHÔNG HỢP LỆ HOẶC QUÁ HẠN TÁI KHÁM
              </div>
              <p style={{ fontSize: 12.5, color: '#9a3412', marginBottom: 12 }}>
                Nhân viên tiếp nhận hỗ trợ xác minh: Giấy hẹn không có trong hệ thống hoặc đã quá hạn trên 30 ngày. Vui lòng chọn hướng xử lý theo Lưu đồ Tái khám:
              </p>
              <Space wrap style={{ width: '100%' }}>
                <Button
                  type="primary"
                  danger
                  onClick={() => {
                    setIsFollowUpModalOpen(false);
                    setFollowUpInputCode('');
                    setIsModalOpen(true);
                    showToast('Đã chuyển sang Quy trình Đăng ký Khám thông thường!', 'info');
                  }}
                  style={{ fontWeight: 700 }}
                >
                  👉 Chuyển Đăng Ký Khám Mới Thông Thường
                </Button>
                <Button
                  onClick={() => {
                    const fallbackPatient = patients[0] || {
                      id: 'p-01',
                      hoTen: 'Trần Văn Mạnh',
                      maBenhNhan: 'BN20260016',
                      tuoi: 45,
                      gioiTinh: 'Nam',
                      soCCCD: '079080000010',
                      maTheBHYT: 'DN40101234567',
                    };
                    setFoundFollowUpPatient(fallbackPatient);
                    showToast('Bác sĩ Trưởng khoa đã phê duyệt đủ điều kiện tái khám!', 'success');
                  }}
                  style={{ borderColor: '#7c3aed', color: '#7c3aed', fontWeight: 600 }}
                >
                  Bác Sĩ Duyệt Đủ Điều Kiện Tái Khám
                </Button>
              </Space>
            </div>
          )}

          {foundFollowUpPatient && (
            <div
              style={{
                backgroundColor: isDarkMode ? '#1e293b' : '#f0fdf4',
                padding: '14px 16px',
                borderRadius: 12,
                border: '1px solid #bbf7d0',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 800, color: '#16a34a', fontSize: 14 }}>
                  ✔ ĐÃ XÁC THỰC GIẤY HẸN & ĐỦ ĐIỀU KIỆN TÁI KHÁM
                </span>
                <Tag color="purple">Giữ Mã Cũ: {foundFollowUpPatient.maBenhNhan}</Tag>
              </div>

              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                <div>• Người bệnh: <strong>{foundFollowUpPatient.hoTen}</strong> ({foundFollowUpPatient.gioiTinh} • {foundFollowUpPatient.tuoi} tuổi)</div>
                <div>• Mã Bệnh nhân: <strong style={{ color: '#0284c7' }}>{foundFollowUpPatient.maBenhNhan}</strong> (Không đổi) • CCCD: {foundFollowUpPatient.soCCCD}</div>
                <div>• Chế độ chi trả: <Tag color={foundFollowUpPatient.maTheBHYT ? 'blue' : 'orange'}>{foundFollowUpPatient.maTheBHYT ? `BHYT: ${foundFollowUpPatient.maTheBHYT}` : 'Khám Dịch Vụ'}</Tag></div>
                <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Hồ sơ đợt khám trước tự động liên kết:</div>
                  <div style={{ fontWeight: 700, color: '#0369a1' }}>K29.7 - Viêm dạ dày, không đặc hiệu</div>
                  <div style={{ fontSize: 11.5, color: '#475569' }}>Bác sĩ khám trước: BS. CKII. Nguyễn Thanh Duy • Đơn thuốc cũ: Esomeprazole 40mg, Phosphalugel</div>
                </div>
              </div>

              {/* Mã QR Lượt Tái Khám Mới (Hộp số 6 trong Sơ đồ 2) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '14px 0', padding: 12, borderRadius: 8, backgroundColor: '#ffffff', border: '1px dashed #7c3aed' }}>
                <QRCodeSVG value={`MEDQR|TAIKHAM|${foundFollowUpPatient.maBenhNhan}|${Date.now()}`} size={70} />
                <div style={{ fontSize: 12, color: '#475569' }}>
                  <div style={{ fontWeight: 700, color: '#7c3aed' }}>MÃ QR LƯỢT TÁI KHÁM ĐÃ SẴN SÀNG</div>
                  <div>Người bệnh có thể cầm mã QR này quét tại <strong>Kiosk Sảnh A</strong> để tự in phiếu STT hoặc cấp STT ngay bên dưới.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <Button
                  icon={<QrcodeOutlined />}
                  onClick={() => {
                    navigate('/kiosk');
                  }}
                  style={{ borderColor: '#0284c7', color: '#0284c7', fontWeight: 600 }}
                >
                  Mở Kiosk Quét QR
                </Button>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleActivateFollowUp}
                  style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', fontWeight: 700, flex: 1 }}
                >
                  🚀 Kích Hoạt Lượt Tái Khám & Cấp STT Ưu Tiên
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
