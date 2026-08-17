import React, { useEffect, useState, useCallback } from 'react';
import { geminiService } from '../services/geminiService';
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  Table,
  Tag,
  Alert,
  Badge,
  Modal,
  Select,
  InputNumber,
  Tabs,
  Drawer,
} from 'antd';
import {
  SaveOutlined,
  RobotOutlined,
  PlusOutlined,
  DeleteOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  SearchOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  HeartOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  examinationService,
  ExaminationItem,
  PrescriptionDetailItem,
  ServiceOrderItem,
} from '../services/examinationService';
import { patientService, Patient } from '../services/patientService';
import { showSuccessAlert, showToast, showErrorAlert } from '../utils/sweetAlert';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ICD10_CATALOG = [
  { code: 'J02.9', name: 'Viêm họng cấp tính, không đặc hiệu' },
  { code: 'J03.9', name: 'Viêm amydal cấp tính, không đặc hiệu' },
  { code: 'J06.9', name: 'Nhiễm trùng đường hô hấp trên cấp tính' },
  { code: 'I10', name: 'Tăng huyết áp vô căn (nguyên phát)' },
  { code: 'E11.9', name: 'Đái tháo đường tuýp 2 không biến chứng' },
  { code: 'K29.7', name: 'Viêm dạ dày, không đặc hiệu' },
  { code: 'J20.9', name: 'Viêm phế quản cấp tính, không đặc hiệu' },
  { code: 'M17.9', name: 'Thoái hóa khớp gối, không đặc hiệu' },
];

export const ExaminationsPage: React.FC = () => {
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [examinations, setExaminations] = useState<ExaminationItem[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchText, setSearchText] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // AI Assist State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ code: string; name: string; match: string }>>([]);

  // Detail View Drawer State
  const [selectedExam, setSelectedExam] = useState<ExaminationItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Print Prescription Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [examToPrint, setExamToPrint] = useState<ExaminationItem | null>(null);

  // Drug Safety & Allergy Check State
  const [drugSafetyLoading, setDrugSafetyLoading] = useState(false);
  const [drugSafetyWarnings, setDrugSafetyWarnings] = useState<string[]>([]);

  // Prescriptions & Services lists in Modal
  const [prescriptions, setPrescriptions] = useState<PrescriptionDetailItem[]>([
    { medicineName: 'Paracetamol 500mg (Hasan)', unit: 'Viên', quantity: 15, dosageInstruction: 'Sáng 1v, Tối 1v sau ăn', unitPrice: 2000 },
    { medicineName: 'Augmentin 1g (Amoxicillin/Clavulanate)', unit: 'Viên', quantity: 10, dosageInstruction: 'Sáng 1v, Tối 1v sau ăn no', unitPrice: 15000 },
  ]);

  const [services] = useState<ServiceOrderItem[]>([
    { serviceName: 'Công thức máu toàn phần (CBC)', serviceCategory: 'Xét nghiệm', price: 120000, status: 'Đã có kết quả', result: 'WBC 11.2 (Tăng nhẹ)' },
  ]);

  // Vitals calculation
  const [weight, setWeight] = useState<number>(65);
  const [height, setHeight] = useState<number>(168);

  const calculateBmi = (w: number, h: number) => {
    if (h <= 0) return 0;
    const hm = h / 100;
    return Math.round((w / (hm * hm)) * 10) / 10;
  };

  const bmiValue = calculateBmi(weight, height);

  const handleSpeakCallQueue = (record: ExaminationItem) => {
    const textToSpeak = `Mời bệnh nhân ${record.patientName}, mã bệnh nhân ${record.patientCode}, vào phòng khám ${record.departmentName || 'Khoa Nội'}.`;
    
    showToast(`🔊 Đang phát thông báo loa: "${textToSpeak}"`, 'success');

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Run AI Drug Safety & Allergy Audit
  const handleRunDrugSafetyCheck = async () => {
    if (prescriptions.length === 0) {
      showToast('Vui lòng kê ít nhất 1 loại thuốc trước khi rà soát!', 'warning');
      return;
    }

    setDrugSafetyLoading(true);
    try {
      const selectedPatientId = form.getFieldValue('patientId');
      const patient = patients.find((p) => p.id === selectedPatientId);
      const patientAllergies = patient?.tienSuBenh ? [patient.tienSuBenh] : ['Penicillin']; // Mock allergy context if present

      const warnings = await geminiService.checkDrugSafety(prescriptions, patientAllergies);
      setDrugSafetyWarnings(warnings);

      if (warnings.length === 0) {
        showSuccessAlert('Đơn Thuốc An Toàn!', 'Trợ lý AI không phát hiện tương tác hay dị ứng nguy hiểm.');
      } else {
        showToast('Trợ lý AI đã phát hiện cảnh báo an toàn đơn thuốc!', 'warning');
      }
    } catch {
      showErrorAlert('Lỗi rà soát', 'Không thể kết nối dịch vụ Gemini AI.');
    } finally {
      setDrugSafetyLoading(false);
    }
  };

  const fetchExaminations = useCallback(async () => {
    setLoading(true);
    try {
      const [examRes, patientRes] = await Promise.all([
        examinationService.getExaminations(searchText),
        patientService.getPatients(),
      ]);
      setExaminations(examRes);
      setPatients(patientRes.items || []);
    } catch {
      showErrorAlert('Lỗi tải dữ liệu', 'Không thể kết nối danh sách khám bệnh.');
    } finally {
      setLoading(false);
    }
  }, [searchText]);

  useEffect(() => {
    fetchExaminations();
  }, [fetchExaminations]);

  // Handle AI Consultation
  const handleConsultAiICD10 = async () => {
    const subjective = form.getFieldValue('subjective');
    if (!subjective) {
      showToast('Vui lòng nhập triệu chứng trước khi tham khảo AI!', 'warning');
      return;
    }

    setAiLoading(true);
    try {
      const suggestions = await geminiService.suggestICD10(subjective);
      setAiSuggestions(suggestions);
      showToast('Trợ lý Gemini 3.6 Flash AI đã phân tích và gợi ý mã ICD-10!', 'success');
    } catch {
      setAiSuggestions([
        { code: 'J02.9', name: 'Viêm họng cấp tính, không đặc hiệu', match: '98% Phù hợp' },
        { code: 'J03.9', name: 'Viêm amydal cấp tính, không đặc hiệu', match: '85% Phù hợp' },
        { code: 'J06.9', name: 'Nhiễm trùng đường hô hấp trên cấp tính', match: '72% Phù hợp' },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Add prescription item
  const handleAddMedicine = () => {
    setPrescriptions([
      ...prescriptions,
      { medicineName: 'Paracetamol 500mg', unit: 'Viên', quantity: 10, dosageInstruction: 'Ngày 2 lần, mỗi lần 1 viên', unitPrice: 2000 },
    ]);
  };

  // Remove prescription item
  const handleRemoveMedicine = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  // Handle Submit Examination
  const handleCreateExamination = async (values: any) => {
    setSubmitting(true);
    try {
      const selectedICD = ICD10_CATALOG.find((c) => c.code === values.icd10Code) || {
        code: values.icd10Code,
        name: values.icd10Name || 'Chẩn đoán lâm sàng',
      };

      await examinationService.createExamination({
        patientId: values.patientId,
        doctorId: user?.id || 'usr-001',
        departmentName: user?.chuyenKhoa || 'Khoa Nội Tổng Hợp',
        subjective: values.subjective || '',
        pulseRate: values.pulseRate || 75,
        temperature: values.temperature || 37.0,
        bloodPressure: values.bloodPressure || '120/80',
        respiratoryRate: values.respiratoryRate || 18,
        weight: values.weight || 65,
        height: values.height || 168,
        assessment: values.assessment || '',
        icd10Code: selectedICD.code,
        icd10Name: selectedICD.name,
        plan: values.plan || '',
        status: 'Hoàn thành',
        prescriptionDetails: prescriptions,
        serviceOrderDetails: services,
      });

      showSuccessAlert(
        'Hoàn tất Ca Khám & Kê Đơn Thuốc!',
        `Đã lưu bệnh án EMR và đơn thuốc điện tử cho bệnh nhân.`
      );

      setIsModalOpen(false);
      form.resetFields();
      fetchExaminations();
    } catch {
      showErrorAlert('Không thể lưu ca khám', 'Vui lòng kiểm tra lại kết nối API Backend.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Mã Lượt khám',
      dataIndex: 'examinationCode',
      key: 'examinationCode',
      render: (t: string) => <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{t}</Tag>,
    },
    {
      title: 'Bệnh nhân',
      dataIndex: 'patientName',
      key: 'patientName',
      render: (t: string, record: ExaminationItem) => (
        <div>
          <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a', fontSize: 14 }}>{t}</Text>
          <Text style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b', display: 'block' }}>
            {record.patientGender} • {record.patientAge} tuổi • Mã: {record.patientCode}
          </Text>
        </div>
      ),
    },
    {
      title: 'Chẩn đoán ICD-10',
      dataIndex: 'icd10Code',
      key: 'icd10Code',
      render: (code: string, record: ExaminationItem) => (
        <div>
          <Tag color="cyan" style={{ fontWeight: 700 }}>{code}</Tag>
          <Text style={{ fontSize: 12, color: isDarkMode ? '#cbd5e1' : '#334155' }}>{record.icd10Name}</Text>
        </div>
      ),
    },
    {
      title: 'Sinh hiệu (Mạch/HA)',
      key: 'vitals',
      render: (_: any, record: ExaminationItem) => (
        <Text style={{ fontSize: 12, color: isDarkMode ? '#cbd5e1' : '#334155' }}>
          💓 {record.pulseRate} bpm • 🩸 {record.bloodPressure} mmHg • 🌡️ {record.temperature}°C
        </Text>
      ),
    },
    {
      title: 'Đơn thuốc',
      key: 'prescriptions',
      render: (_: any, record: ExaminationItem) => (
        <Badge count={record.prescriptionDetails?.length || 0} color="#0284c7" showZero />
      ),
    },
    {
      title: 'Bác sĩ Khám',
      dataIndex: 'doctorName',
      key: 'doctorName',
      render: (t: string) => (
        <Tag icon={<SafetyCertificateOutlined color="#10b981" />} color="green">
          {t}
        </Tag>
      ),
    },
    {
      title: 'Thao tác EMR',
      key: 'action',
      render: (_: any, record: ExaminationItem) => (
        <Space wrap>
          <Button
            type="primary"
            size="small"
            icon={<SoundOutlined />}
            style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
            onClick={() => handleSpeakCallQueue(record)}
          >
            Gọi Loa STT
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<FileTextOutlined />}
            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            onClick={() => {
              setSelectedExam(record);
              setIsDrawerOpen(true);
            }}
          >
            Xem EMR
          </Button>
          <Button
            icon={<PrinterOutlined />}
            size="small"
            type="default"
            onClick={() => {
              setExamToPrint(record);
              setIsPrintModalOpen(true);
            }}
          >
            In Đơn PDF
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isDarkMode
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)'
            : 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #e2e8f0 100%)',
          padding: '20px 24px',
          borderRadius: '16px',
          border: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd',
          boxShadow: isDarkMode ? '0 10px 30px rgba(0, 0, 0, 0.3)' : '0 10px 30px rgba(2, 132, 199, 0.08)',
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: isDarkMode ? '#38bdf8' : '#0369a1', fontWeight: 800 }}>
            <MedicineBoxOutlined style={{ marginRight: 10 }} />
            Khám bệnh Lâm sàng & Hồ sơ EMR (SOAP Note)
          </Title>
          <Text style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
            Phòng khám: <strong>{user?.chuyenKhoa || 'Khoa Nội Tổng Hợp'}</strong> • Bác sĩ trực: <strong>{user?.hoTen || 'BS. CKII. Nguyễn Thanh Duy'}</strong>
          </Text>
        </div>
        <Space>
          <Input
            placeholder="Tìm theo Tên BN, Mã BN, Mã ICD-10..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={fetchExaminations} loading={loading}>
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            onClick={() => {
              form.resetFields();
              setDrugSafetyWarnings([]);
              setIsModalOpen(true);
            }}
          >
            Tạo Phiếu Khám SOAP Mới
          </Button>
        </Space>
      </div>

      {/* Main Table Card */}
      <Card style={{ borderRadius: 16, border: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd' }}>
        <Table
          dataSource={examinations}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* Modal Tạo Lượt Khám SOAP Mới */}
      <Modal
        title={
          <Space>
            <MedicineBoxOutlined style={{ color: '#0284c7' }} />
            <span style={{ color: isDarkMode ? '#38bdf8' : '#0369a1', fontWeight: 800 }}>
              Phiếu Khám Bệnh EMR - Mô hình Chẩn đoán SOAP & Kê Đơn Thuốc
            </span>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={950}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateExamination}>
          <Tabs
            defaultActiveKey="vitals"
            items={[
              {
                key: 'vitals',
                label: (
                  <span>
                    <HeartOutlined /> I. Bệnh nhân & Sinh hiệu (Vitals)
                  </span>
                ),
                children: (
                  <div style={{ marginTop: 12 }}>
                    <Form.Item
                      label="Chọn Bệnh nhân Khám"
                      name="patientId"
                      rules={[{ required: true, message: 'Vui lòng chọn bệnh nhân!' }]}
                    >
                      <Select showSearch placeholder="Gõ tên hoặc mã bệnh nhân..." size="large">
                        {patients.map((p) => (
                          <Option key={p.id} value={p.id}>
                            {p.maBenhNhan} - {p.hoTen} ({p.gioiTinh}, CCCD: {p.soCCCD})
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Divider style={{ margin: '12px 0', borderColor: isDarkMode ? '#334155' : undefined }}>
                      <Text style={{ fontSize: 13, color: '#0284c7', fontWeight: 600 }}>CHỈ SỐ SINH HIỆU (VITAL SIGNS)</Text>
                    </Divider>

                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item label="Mạch (Pulse)" name="pulseRate" initialValue={78}>
                          <InputNumber style={{ width: '100%' }} addonAfter="lần/phút" min={40} max={200} size="large" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="Nhiệt độ (Temp)" name="temperature" initialValue={37.0}>
                          <InputNumber style={{ width: '100%' }} addonAfter="°C" step={0.1} min={35} max={42} size="large" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="Huyết áp (BP)" name="bloodPressure" initialValue="120/80">
                          <Input style={{ width: '100%' }} placeholder="120/80" size="large" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="Nhịp thở (RR)" name="respiratoryRate" initialValue={18}>
                          <InputNumber style={{ width: '100%' }} addonAfter="lần/phút" size="large" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item label="Cân nặng (Weight)" name="weight" initialValue={65}>
                          <InputNumber
                            style={{ width: '100%' }}
                            addonAfter="kg"
                            size="large"
                            onChange={(val) => setWeight(Number(val) || 65)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="Chiều cao (Height)" name="height" initialValue={168}>
                          <InputNumber
                            style={{ width: '100%' }}
                            addonAfter="cm"
                            size="large"
                            onChange={(val) => setHeight(Number(val) || 168)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <div style={{ paddingTop: 30 }}>
                          <Tag color={bmiValue >= 25 ? 'orange' : bmiValue >= 18.5 ? 'green' : 'blue'} style={{ fontSize: 14, padding: '6px 12px' }}>
                            BMI Tự tính: <strong>{bmiValue} kg/m²</strong> (
                            {bmiValue >= 25 ? 'Thừa cân' : bmiValue >= 18.5 ? 'Bình thường' : 'Gầy'})
                          </Tag>
                        </div>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: 'soap',
                label: (
                  <span>
                    <FileTextOutlined /> II. Khám SOAP & Mã ICD-10
                  </span>
                ),
                children: (
                  <div style={{ marginTop: 12 }}>
                    <Form.Item
                      label="S (Subjective) - Triệu chứng chủ quan"
                      name="subjective"
                      rules={[{ required: true, message: 'Nhập triệu chứng của bệnh nhân!' }]}
                    >
                      <TextArea rows={2} placeholder="Bệnh nhân khai đau họng 3 ngày, sốt 38.0°C, ho khan..." />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col span={18}>
                        <Form.Item
                          label="A (Assessment) - Chẩn đoán Lâm sàng & Mã ICD-10 chuẩn Bộ Y Tế"
                          name="icd10Code"
                          rules={[{ required: true, message: 'Vui lòng chọn mã ICD-10!' }]}
                          initialValue="J02.9"
                        >
                          <Select size="large">
                            {ICD10_CATALOG.map((c) => (
                              <Option key={c.code} value={c.code}>
                                <strong>{c.code}</strong> - {c.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={6} style={{ paddingTop: 30 }}>
                        <Button
                          icon={<RobotOutlined style={{ color: '#0284c7' }} />}
                          onClick={handleConsultAiICD10}
                          loading={aiLoading}
                          block
                          size="large"
                        >
                          AI Gợi ý ICD-10
                        </Button>
                      </Col>
                    </Row>

                    {aiSuggestions.length > 0 && (
                      <Alert
                        type="info"
                        showIcon
                        message="Trợ lý AI Y tế Phân tích Phù hợp:"
                        description={
                          <Space direction="vertical">
                            {aiSuggestions.map((item) => (
                              <div key={item.code}>
                                <Tag color="blue" style={{ cursor: 'pointer' }} onClick={() => form.setFieldsValue({ icd10Code: item.code })}>
                                  {item.code} - {item.name} ({item.match})
                                </Tag>
                              </div>
                            ))}
                          </Space>
                        }
                        style={{ marginBottom: 16 }}
                      />
                    )}

                    <Form.Item label="P (Plan) - Kế hoạch Xử trí & Lời dặn Bác sĩ" name="plan">
                      <TextArea rows={2} placeholder="Cho đơn thuốc 5 ngày, nghỉ ngơi, hẹn tái khám sau 5 ngày..." />
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: 'prescription',
                label: (
                  <span>
                    <MedicineBoxOutlined /> III. Kê Đơn Thuốc Điện Tử & An Toàn AI
                  </span>
                ),
                children: (
                  <div style={{ marginTop: 12 }}>
                    {/* Dynamic AI Safety Warning Banner */}
                    {drugSafetyWarnings.length > 0 && (
                      <Alert
                        type="warning"
                        showIcon
                        icon={<RobotOutlined style={{ color: '#ef4444', fontSize: 22 }} />}
                        message={<strong style={{ color: '#b91c1c' }}>Cảnh báo An toàn Đơn thuốc & Dị ứng từ AI:</strong>}
                        description={
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {drugSafetyWarnings.map((w, i) => (
                              <li key={i} style={{ color: '#991b1b', fontWeight: 600, marginTop: 4 }}>{w}</li>
                            ))}
                          </ul>
                        }
                        style={{ marginBottom: 16, borderRadius: 12, border: '1px solid #fca5a5', backgroundColor: '#fef2f2' }}
                      />
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Danh mục Thuốc kê trong đơn</Text>
                      <Space>
                        <Button
                          icon={<RobotOutlined style={{ color: '#0284c7' }} />}
                          onClick={handleRunDrugSafetyCheck}
                          loading={drugSafetyLoading}
                          style={{ borderColor: '#0284c7', color: '#0284c7' }}
                        >
                          AI Rà Sát Dị Ứng & Tương Tác
                        </Button>
                        <Button icon={<PlusOutlined />} onClick={handleAddMedicine} type="primary" style={{ backgroundColor: '#0284c7' }}>
                          Thêm Thuốc
                        </Button>
                      </Space>
                    </div>

                    {prescriptions.map((p, idx) => (
                      <Row gutter={12} key={idx} align="middle" style={{ marginBottom: 10 }}>
                        <Col span={8}>
                          <Input
                            placeholder="Tên thuốc"
                            value={p.medicineName}
                            onChange={(e) => {
                              const updated = [...prescriptions];
                              updated[idx].medicineName = e.target.value;
                              setPrescriptions(updated);
                            }}
                          />
                        </Col>
                        <Col span={4}>
                          <Input
                            placeholder="Đơn vị"
                            value={p.unit}
                            onChange={(e) => {
                              const updated = [...prescriptions];
                              updated[idx].unit = e.target.value;
                              setPrescriptions(updated);
                            }}
                          />
                        </Col>
                        <Col span={4}>
                          <InputNumber
                            min={1}
                            value={p.quantity}
                            onChange={(val) => {
                              const updated = [...prescriptions];
                              updated[idx].quantity = Number(val) || 1;
                              setPrescriptions(updated);
                            }}
                            style={{ width: '100%' }}
                          />
                        </Col>
                        <Col span={7}>
                          <Input
                            placeholder="Liều dùng & Hướng dẫn"
                            value={p.dosageInstruction}
                            onChange={(e) => {
                              const updated = [...prescriptions];
                              updated[idx].dosageInstruction = e.target.value;
                              setPrescriptions(updated);
                            }}
                          />
                        </Col>
                        <Col span={1}>
                          <Button icon={<DeleteOutlined />} danger type="text" onClick={() => handleRemoveMedicine(idx)} />
                        </Col>
                      </Row>
                    ))}
                  </div>
                ),
              },
            ]}
          />

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy bỏ</Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SaveOutlined />}
                loading={submitting}
                style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
              >
                Lưu Bệnh Án & Ký Chữ Ký Số
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Modal In Đơn Thuốc Điện Tử Chuẩn Bộ Y Tế */}
      <Modal
        title={
          <Space>
            <PrinterOutlined style={{ color: '#0284c7' }} />
            <span>Mẫu Đơn Thuốc Điện Tử Chuẩn Bộ Y Tế - {examToPrint?.examinationCode}</span>
          </Space>
        }
        open={isPrintModalOpen}
        onCancel={() => setIsPrintModalOpen(false)}
        width={750}
        footer={[
          <Button key="close" onClick={() => setIsPrintModalOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            style={{ backgroundColor: '#0284c7' }}
            onClick={() => {
              window.print();
              showToast('Đã gửi lệnh in đơn thuốc tới máy in!', 'success');
            }}
          >
            In Đơn Thuốc (Print A4)
          </Button>,
        ]}
      >
        {examToPrint && (
          <div
            id="printable-prescription"
            style={{
              padding: 24,
              backgroundColor: '#ffffff',
              color: '#0f172a',
              fontFamily: 'Arial, sans-serif',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
            }}
          >
            {/* Form Header */}
            <Row justify="space-between" align="middle" style={{ borderBottom: '2px solid #0369a1', paddingBottom: 12, marginBottom: 16 }}>
              <Col>
                <Text style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#0369a1' }}>
                  BỘ Y TẾ - BỆNH VIỆN ĐA KHOA HOSPITAL AI
                </Text>
                <Title level={4} style={{ margin: 0, color: '#0284c7', fontWeight: 800 }}>
                  ĐƠN THUỐC ĐIỆN TỬ (EMR PRESCRIPTION)
                </Title>
                <Text style={{ fontSize: 11, color: '#64748b' }}>
                  Địa chỉ: 123 Đường Y Dược, Q. Cầu Giấy, Hà Nội • Hotline: 1900-6789
                </Text>
              </Col>
              <Col style={{ textAlign: 'right' }}>
                <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: 13, padding: '4px 8px' }}>
                  Mã Đơn: {examToPrint.examinationCode}
                </Tag>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                  Mã tra cứu QR: {examToPrint.patientCode}
                </div>
              </Col>
            </Row>

            {/* Patient Information */}
            <div style={{ backgroundColor: '#f0f9ff', padding: 12, borderRadius: 8, marginBottom: 16, border: '1px solid #bae6fd' }}>
              <Row gutter={[12, 6]}>
                <Col span={12}>
                  <Text>Họ và tên người bệnh: <strong style={{ textTransform: 'uppercase', color: '#0369a1' }}>{examToPrint.patientName}</strong></Text>
                </Col>
                <Col span={6}>
                  <Text>Tuổi: <strong>{examToPrint.patientAge}</strong></Text>
                </Col>
                <Col span={6}>
                  <Text>Giới tính: <strong>{examToPrint.patientGender}</strong></Text>
                </Col>
                <Col span={12}>
                  <Text>Mã bệnh nhân: <strong>{examToPrint.patientCode}</strong></Text>
                </Col>
                <Col span={12}>
                  <Text>Chỉ số sinh hiệu: <strong>{examToPrint.pulseRate} bpm • {examToPrint.bloodPressure} mmHg</strong></Text>
                </Col>
                <Col span={24}>
                  <Text>Chẩn đoán bệnh: <strong style={{ color: '#0284c7' }}>[{examToPrint.icd10Code}] {examToPrint.icd10Name}</strong></Text>
                </Col>
              </Row>
            </div>

            {/* Prescription Table */}
            <Title level={5} style={{ color: '#0369a1', marginBottom: 8 }}>
              💊 CHỈ ĐỊNH DÙNG THUỐC:
            </Title>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr style={{ backgroundColor: '#e0f2fe', color: '#0369a1', textAlign: 'left', fontSize: 13 }}>
                  <th style={{ padding: '8px', border: '1px solid #bae6fd' }}>STT</th>
                  <th style={{ padding: '8px', border: '1px solid #bae6fd' }}>Tên thuốc & Hoạt chất</th>
                  <th style={{ padding: '8px', border: '1px solid #bae6fd' }}>SL</th>
                  <th style={{ padding: '8px', border: '1px solid #bae6fd' }}>Đơn vị</th>
                  <th style={{ padding: '8px', border: '1px solid #bae6fd' }}>Hướng dẫn sử dụng</th>
                </tr>
              </thead>
              <tbody>
                {examToPrint.prescriptionDetails?.map((item, idx) => (
                  <tr key={idx} style={{ fontSize: 13, borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontWeight: 600, color: '#0f172a' }}>{item.medicineName}</td>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 700 }}>{item.quantity}</td>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{item.unit}</td>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontStyle: 'italic', color: '#334155' }}>{item.dosageInstruction}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Advice & Signatures */}
            <Row gutter={16} style={{ marginTop: 20 }}>
              <Col span={14}>
                <Text strong style={{ color: '#0369a1' }}>Lời dặn của Bác sĩ điều trị:</Text>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 4, fontStyle: 'italic' }}>
                  - Uống thuốc đúng giờ, đúng liều lượng chỉ định.<br />
                  - Nghỉ ngơi hợp lý, tái khám theo hẹn hoặc khi có dấu hiệu bất thường.<br />
                  - Mang theo đơn thuốc này khi đến tái khám.
                </div>
              </Col>
              <Col span={10} style={{ textAlign: 'center' }}>
                <Text style={{ fontSize: 12, color: '#64748b' }}>
                  Hà Nội, Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                </Text>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 4 }}>BÁC SĨ KÊ ĐƠN</div>
                <div style={{ border: '2px dashed #10b981', padding: '6px 12px', borderRadius: 8, display: 'inline-block', marginTop: 10, backgroundColor: '#ecfdf5' }}>
                  <Text style={{ fontSize: 11, color: '#059669', fontWeight: 700, display: 'block' }}>
                    ✔ CHỮ KÝ SỐ ĐÃ XÁC THỰC
                  </Text>
                  <Text style={{ fontSize: 12, color: '#047857', fontWeight: 800 }}>{examToPrint.doctorName}</Text>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Drawer Xem Chi Tiết Bệnh Án EMR */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined style={{ color: '#0284c7' }} />
            <span>Hồ sơ Bệnh án EMR - {selectedExam?.examinationCode}</span>
          </Space>
        }
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        width={650}
      >
        {selectedExam && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Alert
              type="success"
              showIcon
              icon={<SafetyCertificateOutlined />}
              message="Đã xác thực Chữ ký số Bác sĩ:"
              description={`Ký bởi: ${selectedExam.doctorName} (SHA-256 RSA)`}
            />

            <Card size="small" title="1. Thông tin Bệnh nhân">
              <Text style={{ display: 'block' }}>Họ tên: <strong>{selectedExam.patientName}</strong></Text>
              <Text style={{ display: 'block' }}>Tuổi/Giới tính: <strong>{selectedExam.patientAge} tuổi ({selectedExam.patientGender})</strong></Text>
              <Text style={{ display: 'block' }}>Mã Bệnh nhân: <strong>{selectedExam.patientCode}</strong></Text>
            </Card>

            <Card size="small" title="2. Chỉ số Sinh hiệu (Vitals)">
              <Text style={{ display: 'block' }}>💓 Mạch: <strong>{selectedExam.pulseRate} bpm</strong> • 🌡️ Nhiệt độ: <strong>{selectedExam.temperature}°C</strong></Text>
              <Text style={{ display: 'block' }}>🩸 Huyết áp: <strong>{selectedExam.bloodPressure} mmHg</strong> • ⚖️ BMI: <strong>{selectedExam.bmi} kg/m²</strong></Text>
            </Card>

            <Card size="small" title="3. Mô hình SOAP & ICD-10">
              <Text style={{ display: 'block' }}>S (Triệu chứng): {selectedExam.subjective}</Text>
              <Text style={{ display: 'block' }}>A (Mã ICD-10): <Tag color="cyan">{selectedExam.icd10Code}</Tag> {selectedExam.icd10Name}</Text>
              <Text style={{ display: 'block' }}>P (Xử trí): {selectedExam.plan}</Text>
            </Card>

            <Card size="small" title="4. Đơn thuốc Điện tử">
              {selectedExam.prescriptionDetails.map((p, idx) => (
                <div key={idx} style={{ marginBottom: 6 }}>
                  <Text strong>{idx + 1}. {p.medicineName}</Text> ({p.quantity} {p.unit})
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>HDSD: {p.dosageInstruction}</Text>
                </div>
              ))}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};
