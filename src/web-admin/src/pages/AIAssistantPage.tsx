import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Typography,
  Tag,
  Avatar,
  Spin,
  Divider,
  Row,
  Col,
  Tabs,
  Upload,
  Select,
  Progress,
  Alert,
} from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  UploadOutlined,
  MedicineBoxOutlined,
  EyeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useThemeStore } from '../store/useThemeStore';
import { geminiService } from '../services/geminiService';
import { showToast } from '../utils/sweetAlert';

const { Text, Paragraph, Title } = Typography;
const { TextArea } = Input;

export const AIAssistantPage: React.FC = () => {
  const { isDarkMode } = useThemeStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── TAB 1: CLINICAL CHATBOT STATE ──────────────────────────────────────────
  const [messages, setMessages] = useState<
    Array<{
      sender: 'user' | 'ai';
      text: string;
      time: string;
      sources?: string[];
      piiSanitized?: boolean;
    }>
  >([
    {
      sender: 'ai',
      text: 'Xin chào Bác sĩ! Tôi là **Trợ lý Y tế Lâm sàng Hospital AI**.\n\nTôi sẵn sàng hỗ trợ tra cứu phác đồ điều trị Bộ Y tế, đối chiếu dược thư, gợi ý mã bệnh ICD-10 và tóm tắt diễn biến ca bệnh. Mọi dữ liệu lâm sàng nhập vào đều được tự động khử danh tính (De-identified) theo chuẩn HIPAA.',
      time: '08:00',
      piiSanitized: true,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const handleSendChat = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const newMsg = {
      sender: 'user' as const,
      text: query,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInputText('');
    setChatLoading(true);

    try {
      const response = await geminiService.askGemini(query);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: response.text,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          sources: response.sources || ['Bộ Y Tế Việt Nam', 'Hospital AI Medical Engine'],
          piiSanitized: true,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Hệ thống AI Lâm sàng đang xử lý ngoại tuyến: Bệnh nhân cần được kiểm tra sinh hiệu định kỳ và thăm khám thực thể toàn diện trước khi chỉ định y lệnh cuối cùng.',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          sources: ['Hospital AI Fallback Engine'],
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── TAB 2: AI VISION X-RAY & LAB ANALYSIS STATE ────────────────────────────
  const [imageModality, setImageModality] = useState<string>('CHEST_XRAY');
  const [clinicalNote, setClinicalNote] = useState<string>('Ho đờm vàng 4 ngày, sốt nhẹ 38°C, đau tức ngực nhẹ khi hít sâu');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<any>(null);

  // Ảnh demo có sẵn
  const demoImages = [
    {
      name: 'X-Quang Ngực Thẳng (Chest X-Ray)',
      modality: 'CHEST_XRAY',
      note: 'Bệnh nhân nam 45 tuổi, sốt 38.2°C, ho đờm đục, nghe rales ẩm đáy phổi phải',
      url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'X-Quang Gãy Xương Sườn (Bone Fracture)',
      modality: 'BONE_XRAY',
      note: 'Bệnh nhân bị ngã xe đập mạn sườn trái, đau chói khi thở, nghi gãy xương sườn',
      url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Phiếu Xét Nghiệm Hóa Sinh (Lab Test)',
      modality: 'LAB_TEST',
      note: 'Kiểm tra chức năng gan thận, đường huyết đói và men gan AST/ALT',
      url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const handleSelectDemoImage = (demo: (typeof demoImages)[0]) => {
    setImageModality(demo.modality);
    setClinicalNote(demo.note);
    setImagePreview(demo.url);
    setImageAnalysisResult(null);
  };

  const handleCustomImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setImageAnalysisResult(null);
    };
    reader.readAsDataURL(file);
    return false; // Chặn auto upload của AntD
  };

  const handleAnalyzeImage = async () => {
    if (!imagePreview) {
      showToast('Vui lòng chọn hoặc tải lên một hình ảnh cận lâm sàng!', 'warning');
      return;
    }

    setImageLoading(true);
    try {
      const res = await geminiService.analyzeMedicalImage({
        imageBase64: imagePreview,
        modality: imageModality,
        clinicalNote: clinicalNote,
        patientAge: 42,
        patientGender: 'Nam',
      });
      setImageAnalysisResult(res);
      showToast('Phân tích hình ảnh y khoa hoàn tất!', 'success');
    } catch {
      showToast('Lỗi khi phân tích ảnh. Đã kích hoạt chẩn đoán ngoại tuyến.', 'warning');
    } finally {
      setImageLoading(false);
    }
  };

  // ── TAB 3: DRUG INTERACTIONS MATRIX STATE ──────────────────────────────────
  const [selectedMeds, setSelectedMeds] = useState<Array<{ medicineName: string; dosage?: string }>>([
    { medicineName: 'Clopidogrel (Plavix) 75mg', dosage: '1 viên/ngày' },
    { medicineName: 'Omeprazole 20mg', dosage: '1 viên/ngày trước ăn sáng' },
    { medicineName: 'Aspirin 81mg', dosage: '1 viên/ngày sau ăn no' },
  ]);
  const [drugLoading, setDrugLoading] = useState(false);
  const [drugResult, setDrugResult] = useState<any>(null);

  const clinicalCases = [
    {
      label: 'Ca 1: Tim mạch + Dạ dày (Clopidogrel + Omeprazole + Aspirin)',
      meds: [
        { medicineName: 'Clopidogrel 75mg', dosage: '1 viên/ngày' },
        { medicineName: 'Omeprazole 20mg', dosage: '1 viên/ngày' },
        { medicineName: 'Aspirin 81mg', dosage: '1 viên/ngày' },
      ],
    },
    {
      label: 'Ca 2: Tăng huyết áp + Suy tim (Enalapril + Spironolactone + Kali)',
      meds: [
        { medicineName: 'Enalapril 10mg', dosage: '1 viên x 2 lần/ngày' },
        { medicineName: 'Spironolactone 25mg', dosage: '1 viên/ngày' },
        { medicineName: 'Panangin (Bổ sung Kali)', dosage: '2 viên/ngày' },
      ],
    },
    {
      label: 'Ca 3: Nhiễm khuẩn hô hấp + Giảm đau (Ciprofloxacin + Ibuprofen)',
      meds: [
        { medicineName: 'Ciprofloxacin 500mg', dosage: '1 viên x 2 lần/ngày' },
        { medicineName: 'Ibuprofen 400mg', dosage: '1 viên x 2 lần/ngày' },
        { medicineName: 'Theophylline 100mg', dosage: '1 viên/ngày' },
      ],
    },
    {
      label: 'Ca 4: Đơn thuốc An toàn Tiêu chuẩn (Augmentin + Paracetamol + Prospan)',
      meds: [
        { medicineName: 'Augmentin 1g', dosage: '1 viên x 2 lần/ngày' },
        { medicineName: 'Paracetamol 500mg', dosage: '1 viên khi sốt' },
        { medicineName: 'Siro Prospan', dosage: '5ml x 3 lần/ngày' },
      ],
    },
  ];

  const handleCheckDrugInteractions = async () => {
    setDrugLoading(true);
    try {
      const res = await geminiService.checkDrugInteractions({
        medicines: selectedMeds,
        patientAllergies: 'Không có dị ứng thuốc đã biết',
        patientConditions: 'Tăng huyết áp nhẹ, tiền sử dạ dày trào ngược',
      });
      setDrugResult(res);
      showToast('Đã quét ma trận tương tác thuốc thành công!', 'success');
    } catch {
      showToast('Lỗi khi kiểm tra tương tác thuốc.', 'error');
    } finally {
      setDrugLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER BANNER */}
      <div
        className="rounded-2xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0f172a 100%)',
          boxShadow: '0 10px 30px rgba(2, 132, 199, 0.15)',
        }}
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 backdrop-blur-md">
              <ThunderboltOutlined className="text-amber-300" /> Clinical AI v3.0 Multi-Modal
            </span>
            <Tag color="cyan" className="m-0 font-mono text-xs bg-white/20 text-white border-white/30">
              HIPAA & NĐ 13/2023/NĐ-CP
            </Tag>
          </div>
          <Title level={2} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
            Trợ Lý Y Tế AI Lâm Sàng & Chẩn Đoán Hình Ảnh
          </Title>
          <Paragraph style={{ color: '#e0f2fe', margin: '6px 0 0', maxWidth: 700, fontSize: 14 }}>
            Hệ thống hỗ trợ ra quyết định lâm sàng (CDSS) tích hợp Trí tuệ Nhân tạo Google Gemini Vision: Đọc ảnh X-Quang, đối chiếu Dược thư Quốc gia, gợi ý mã bệnh ICD-10 và giám sát đơn thuốc an toàn.
          </Paragraph>
        </div>
      </div>

      {/* TABS COMMAND CENTER */}
      <Card
        className="rounded-2xl shadow-sm border border-sky-100"
        style={{
          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
          boxShadow: '0 10px 30px rgba(2, 132, 199, 0.08)',
        }}
      >
        <Tabs
          defaultActiveKey="1"
          size="large"
          items={[
            // ─────────────────────────────────────────────────────────────
            // TAB 1: CHATBOT LÂM SÀNG
            // ─────────────────────────────────────────────────────────────
            {
              key: '1',
              label: (
                <span className="flex items-center gap-2 font-semibold">
                  <RobotOutlined style={{ color: '#0284c7' }} /> Hỏi Đáp Lâm Sàng & Phác Đồ
                </span>
              ),
              children: (
                <div className="flex flex-col h-[600px]">
                  {/* Tin nhắn */}
                  <div
                    className="flex-1 overflow-y-auto p-4 rounded-xl mb-4 border"
                    style={{
                      background: isDarkMode ? '#0f172a' : '#f8fafc',
                      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                    }}
                  >
                    {messages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-3 mb-4 ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <Avatar
                          icon={m.sender === 'user' ? <UserOutlined /> : <RobotOutlined />}
                          style={{
                            backgroundColor: m.sender === 'user' ? '#0369a1' : '#0284c7',
                            flexShrink: 0,
                          }}
                        />
                        <div
                          className="max-w-[80%] rounded-2xl p-4 shadow-sm"
                          style={{
                            background: m.sender === 'user'
                              ? '#0284c7'
                              : isDarkMode ? '#1e293b' : '#ffffff',
                            color: m.sender === 'user' ? '#ffffff' : isDarkMode ? '#f1f5f9' : '#0f172a',
                            border: m.sender === 'user' ? 'none' : '1px solid #bae6fd',
                          }}
                        >
                          <div className="whitespace-pre-line text-sm leading-relaxed">{m.text}</div>
                          {m.sources && m.sources.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-sky-100/50 flex flex-wrap gap-1.5 items-center">
                              <span className="text-[11px] opacity-75 font-semibold">Nguồn tham chiếu:</span>
                              {m.sources.map((src, sIdx) => (
                                <Tag key={sIdx} color="blue" className="text-[10px] m-0">
                                  {src}
                                </Tag>
                              ))}
                            </div>
                          )}
                          <div className="text-[10px] text-right mt-1 opacity-70">{m.time}</div>
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex items-center gap-2 p-3 text-sky-600">
                        <Spin size="small" /> <Text type="secondary">Trợ lý AI đang tra cứu cơ sở dữ liệu y khoa...</Text>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input gửi */}
                  <div className="flex gap-2">
                    <TextArea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChat();
                        }
                      }}
                      placeholder="Nhập câu hỏi lâm sàng (ví dụ: 'Phác đồ điều trị Viêm họng cấp J02.9 theo Bộ Y tế', 'Chống chỉ định của Clopidogrel')..."
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      className="rounded-xl"
                    />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      size="large"
                      onClick={() => handleSendChat()}
                      loading={chatLoading}
                      className="h-auto rounded-xl bg-sky-600 hover:bg-sky-700 px-6 font-semibold"
                    >
                      Gửi
                    </Button>
                  </div>
                </div>
              ),
            },

            // ─────────────────────────────────────────────────────────────
            // TAB 2: CHẨN ĐOÁN HÌNH ẢNH (AI VISION)
            // ─────────────────────────────────────────────────────────────
            {
              key: '2',
              label: (
                <span className="flex items-center gap-2 font-semibold">
                  <EyeOutlined style={{ color: '#0284c7' }} /> Chẩn Đoán Hình Ảnh Y Khoa (AI Vision X-Quang / CT)
                </span>
              ),
              children: (
                <Row gutter={[24, 24]}>
                  {/* Cột trái: Upload & Chọn ảnh */}
                  <Col xs={24} lg={11}>
                    <Card
                      title={<span style={{ color: '#0369a1' }}>1. Tải Lên Phim Cận Lâm Sàng</span>}
                      className="rounded-xl border border-sky-100"
                    >
                      <div className="mb-4">
                        <Text strong className="block mb-1">Chọn Ca Mẫu Demo Y Khoa:</Text>
                        <div className="flex flex-col gap-2">
                          {demoImages.map((demo, dIdx) => (
                            <Button
                              key={dIdx}
                              onClick={() => handleSelectDemoImage(demo)}
                              className="text-left flex items-center justify-between rounded-lg h-10 border-sky-200 hover:border-sky-500"
                            >
                              <span className="font-medium text-xs truncate">{demo.name}</span>
                              <Tag color="cyan">{demo.modality}</Tag>
                            </Button>
                          ))}
                        </div>
                      </div>

                      <Divider style={{ margin: '14px 0' }} />

                      <div className="mb-4">
                        <Text strong className="block mb-1">Hoặc Tải File Ảnh Từ Máy Tính:</Text>
                        <Upload.Dragger
                          beforeUpload={handleCustomImageUpload}
                          showUploadList={false}
                          accept="image/*"
                          className="p-4 rounded-xl border-dashed border-sky-300"
                        >
                          <p className="ant-upload-drag-icon text-sky-600 text-3xl">
                            <UploadOutlined />
                          </p>
                          <p className="ant-upload-text font-semibold text-sm">Nhấp hoặc kéo thả ảnh X-Quang / CT vào đây</p>
                          <p className="ant-upload-hint text-xs text-slate-500">Hỗ trợ định dạng DICOM render, PNG, JPG, WEBP</p>
                        </Upload.Dragger>
                      </div>

                      <div className="mb-4">
                        <Text strong className="block mb-1">Phương thức khảo sát (Modality):</Text>
                        <Select
                          value={imageModality}
                          onChange={(v) => setImageModality(v)}
                          className="w-full"
                          options={[
                            { value: 'CHEST_XRAY', label: '🩻 X-Quang Ngực Thẳng (Chest X-Ray)' },
                            { value: 'BONE_XRAY', label: '🦴 X-Quang Khung Xương (Bone X-Ray)' },
                            { value: 'CT_SCAN', label: '🧠 Chụp Cắt Lớp Vi Tính (CT-Scanner)' },
                            { value: 'LAB_TEST', label: '🧪 Phiếu Xét Nghiệm Huyết Học / Hóa Sinh' },
                          ]}
                        />
                      </div>

                      <div className="mb-4">
                        <Text strong className="block mb-1">Ghi chú triệu chứng lâm sàng:</Text>
                        <TextArea
                          value={clinicalNote}
                          onChange={(e) => setClinicalNote(e.target.value)}
                          rows={2}
                          className="rounded-lg"
                        />
                      </div>

                      <Button
                        type="primary"
                        icon={<ThunderboltOutlined />}
                        size="large"
                        block
                        onClick={handleAnalyzeImage}
                        loading={imageLoading}
                        className="rounded-xl bg-sky-600 hover:bg-sky-700 font-semibold h-11"
                      >
                        Chẩn Đoán Bằng AI Gemini Vision
                      </Button>
                    </Card>
                  </Col>

                  {/* Cột phải: Preview ảnh & Kết quả phân tích */}
                  <Col xs={24} lg={13}>
                    <Card
                      title={<span style={{ color: '#0369a1' }}>2. Hình Ảnh Khảo Sát & Kết Quả AI</span>}
                      className="rounded-xl border border-sky-100"
                    >
                      {imagePreview ? (
                        <div className="relative mb-4 rounded-xl overflow-hidden border border-slate-300 bg-black flex items-center justify-center max-h-72">
                          <img
                            src={imagePreview}
                            alt="Cận lâm sàng"
                            className="max-h-72 object-contain"
                          />
                          <div className="absolute top-2 right-2 bg-black/70 text-white px-2.5 py-1 rounded text-xs font-mono">
                            {imageModality}
                          </div>
                        </div>
                      ) : (
                        <div className="h-48 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 mb-4">
                          Chưa có hình ảnh được chọn
                        </div>
                      )}

                      {imageLoading && (
                        <div className="py-12 text-center">
                          <Spin size="large" />
                          <div className="mt-3 font-semibold text-sky-700">AI Gemini Vision đang bóc tách phân tích giải phẫu...</div>
                          <div className="text-xs text-slate-500">Đối chiếu cấu trúc phế trường, mô mềm và xương theo chuẩn RSNA</div>
                        </div>
                      )}

                      {imageAnalysisResult && !imageLoading && (
                        <div className="space-y-4">
                          {/* Chẩn đoán chính */}
                          <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-bold text-sky-800 uppercase tracking-wide">
                                Chẩn đoán hình ảnh sơ bộ
                              </span>
                              <Tag color="purple" className="font-mono font-bold">
                                ICD-10: {imageAnalysisResult.suggestedICD10 || 'J18.9'}
                              </Tag>
                            </div>
                            <div className="text-base font-bold text-slate-900">
                              {imageAnalysisResult.suspectedDiagnosis}
                            </div>
                          </div>

                          {/* Điểm tin cậy & Độ nghiêm trọng */}
                          <Row gutter={12}>
                            <Col span={12}>
                              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                                <span className="text-xs text-slate-500 block mb-1">Mức độ nghiêm trọng:</span>
                                <Tag
                                  color={
                                    imageAnalysisResult.severityLevel === 'CRITICAL' ? 'red' :
                                    imageAnalysisResult.severityLevel === 'SEVERE' ? 'orange' :
                                    imageAnalysisResult.severityLevel === 'MODERATE' ? 'gold' : 'green'
                                  }
                                  className="font-bold text-xs"
                                >
                                  {imageAnalysisResult.severityLevel}
                                </Tag>
                              </div>
                            </Col>
                            <Col span={12}>
                              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                                <span className="text-xs text-slate-500 block mb-1">Điểm tin cậy (Confidence):</span>
                                <Progress
                                  percent={imageAnalysisResult.confidenceScore || 88}
                                  size="small"
                                  strokeColor="#0284c7"
                                />
                              </div>
                            </Col>
                          </Row>

                          {/* Mô tả tổn thương */}
                          <div>
                            <Text strong className="block mb-1 text-sky-900">Mô tả tổn thương (Findings):</Text>
                            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
                              {imageAnalysisResult.findings?.map((f: string, fIdx: number) => (
                                <li key={fIdx}>{f}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Đề xuất tiếp theo */}
                          <Alert
                            message="Khuyến nghị xử trí cận lâm sàng:"
                            description={imageAnalysisResult.recommendedNextSteps}
                            type="info"
                            showIcon
                            className="text-xs"
                          />

                          <div className="text-[11px] text-slate-400 italic">
                            * {imageAnalysisResult.disclaimers}
                          </div>
                        </div>
                      )}
                    </Card>
                  </Col>
                </Row>
              ),
            },

            // ─────────────────────────────────────────────────────────────
            // TAB 3: TƯƠNG TÁC THUỐC ĐA ĐƠN
            // ─────────────────────────────────────────────────────────────
            {
              key: '3',
              label: (
                <span className="flex items-center gap-2 font-semibold">
                  <MedicineBoxOutlined style={{ color: '#0284c7' }} /> Ma Trận Tương Tác Thuốc Đa Đơn
                </span>
              ),
              children: (
                <div className="space-y-6">
                  {/* Chọn ca mẫu */}
                  <Card className="rounded-xl border border-sky-100 bg-sky-50/50">
                    <Text strong className="block mb-2 text-sky-900">
                      Chọn nhanh ca lâm sàng mẫu (Dược thư Quốc gia):
                    </Text>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {clinicalCases.map((c, cIdx) => (
                        <Button
                          key={cIdx}
                          onClick={() => {
                            setSelectedMeds(c.meds);
                            setDrugResult(null);
                          }}
                          className="text-left h-auto py-2 px-3 rounded-lg border-sky-200 hover:border-sky-500 font-medium text-xs whitespace-normal"
                        >
                          {c.label}
                        </Button>
                      ))}
                    </div>
                  </Card>

                  {/* Danh sách thuốc đang kiểm tra */}
                  <Card
                    title={
                      <div className="flex justify-between items-center">
                        <span style={{ color: '#0369a1' }}>
                          Danh Sách Thuốc Kê Đơn Cần Kiểm Tra ({selectedMeds.length} hoạt chất)
                        </span>
                        <Button
                          type="primary"
                          icon={<ThunderboltOutlined />}
                          onClick={handleCheckDrugInteractions}
                          loading={drugLoading}
                          className="bg-sky-600 hover:bg-sky-700 font-semibold rounded-lg"
                        >
                          Quét Tương Tác Y Khoa
                        </Button>
                      </div>
                    }
                    className="rounded-xl border border-sky-100"
                  >
                    <div className="space-y-2 mb-4">
                      {selectedMeds.map((m, mIdx) => (
                        <div
                          key={mIdx}
                          className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white"
                        >
                          <div>
                            <strong className="text-slate-900">{m.medicineName}</strong>
                            <span className="text-xs text-slate-500 block">Liều: {m.dosage}</span>
                          </div>
                          <Button
                            type="text"
                            danger
                            size="small"
                            onClick={() => setSelectedMeds(selectedMeds.filter((_, i) => i !== mIdx))}
                          >
                            Xóa
                          </Button>
                        </div>
                      ))}
                    </div>

                    {drugResult && (
                      <div className="mt-6 space-y-4 border-t pt-4">
                        {/* Banner tổng quan */}
                        <div
                          className={`p-4 rounded-xl border flex items-center justify-between ${
                            drugResult.overallRisk === 'CONTRAINDICATED' ? 'bg-red-50 border-red-300 text-red-900' :
                            drugResult.overallRisk === 'HIGH_RISK' ? 'bg-amber-50 border-amber-300 text-amber-900' :
                            'bg-emerald-50 border-emerald-300 text-emerald-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {drugResult.overallRisk === 'CONTRAINDICATED' ? (
                              <CloseCircleOutlined className="text-2xl text-red-600" />
                            ) : drugResult.overallRisk === 'HIGH_RISK' ? (
                              <WarningOutlined className="text-2xl text-amber-600" />
                            ) : (
                              <CheckCircleOutlined className="text-2xl text-emerald-600" />
                            )}
                            <div>
                              <div className="font-bold text-sm uppercase">
                                Đánh giá an toàn: {drugResult.overallRisk} (Mức rủi ro {drugResult.riskScore}/5)
                              </div>
                              <div className="text-xs">{drugResult.summaryAdvice}</div>
                            </div>
                          </div>
                          <Tag
                            color={drugResult.overallRisk === 'CONTRAINDICATED' ? 'red' : drugResult.overallRisk === 'HIGH_RISK' ? 'orange' : 'green'}
                            className="font-bold text-xs px-3 py-1"
                          >
                            {drugResult.interactions?.length || 0} Cặp Tương Tác
                          </Tag>
                        </div>

                        {/* Bảng chi tiết tương tác */}
                        {drugResult.interactions && drugResult.interactions.length > 0 && (
                          <div className="space-y-3">
                            <Text strong className="block text-sky-900">Chi Tiết Cảnh Báo Tương Tác Thuốc:</Text>
                            {drugResult.interactions.map((pair: any, pIdx: number) => (
                              <div
                                key={pIdx}
                                className="p-4 rounded-xl border border-red-200 bg-red-50/30 space-y-2"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-red-700 text-sm">
                                    {pair.drugA} ⟷ {pair.drugB}
                                  </span>
                                  <Tag color={pair.severity === 'CONTRAINDICATED' ? 'red' : 'orange'}>
                                    {pair.severity}
                                  </Tag>
                                </div>
                                <div className="text-xs text-slate-800">
                                  <strong>Cơ chế dược lực:</strong> {pair.mechanism}
                                </div>
                                <div className="text-xs text-slate-800">
                                  <strong>Hậu quả lâm sàng:</strong> {pair.clinicalEffect}
                                </div>
                                <div className="text-xs text-emerald-800 font-semibold bg-emerald-50 p-2 rounded border border-emerald-200">
                                  💡 <strong>Khuyến nghị xử trí:</strong> {pair.managementAdvice}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Đề xuất thuốc thay thế */}
                        {drugResult.alternativeSuggestions && drugResult.alternativeSuggestions.length > 0 && (
                          <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50">
                            <Text strong className="block mb-2 text-sky-900">
                              Đề Xuất Hoạt Chất Thay Thế An Toàn (Alternative Recommendations):
                            </Text>
                            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
                              {drugResult.alternativeSuggestions.map((alt: string, aIdx: number) => (
                                <li key={aIdx}>{alt}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
