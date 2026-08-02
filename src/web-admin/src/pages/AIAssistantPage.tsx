import React, { useState } from 'react';
import { Card, Input, Button, Typography, Tag, Avatar, Spin, Divider, Row, Col, Alert, Space } from 'antd';
import { RobotOutlined, SendOutlined, FileTextOutlined, SafetyCertificateOutlined, BulbOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string; sources?: string[]; icd10?: Array<{ code: string; name: string }> }>>([
    {
      sender: 'ai',
      text: 'Xin chào Bác sĩ! Tôi là Trợ lý AI Y tế (tích hợp Google Gemini API). Tôi có thể hỗ trợ Bác sĩ tra cứu thông tin bệnh án bằng ngôn ngữ tự nhiên, tóm tắt diễn biến EMR phức tạp và gợi ý mã bệnh ICD-10 chuẩn.',
      time: '08:00',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const newMsg = {
      sender: 'user' as const,
      text: query,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    setTimeout(() => {
      let aiResponseText = '';
      let sources: string[] | undefined;
      let icd10: Array<{ code: string; name: string }> | undefined;

      if (query.toLowerCase().includes('tóm tắt') || query.toLowerCase().includes('nguyễn văn an')) {
        aiResponseText = `**Tóm tắt diễn biến Hồ sơ Bệnh án EMR (Bệnh nhân Nguyễn Văn An - Mã BN20260001):**\n\n- **Tiền sử:** Tăng huyết áp độ 1 (đang dùng Amlodipine 5mg).\n- **Khám ngày 02/08/2026:** Đau họng 3 ngày, sốt 38.0°C, ho khan nhiều về đêm. Sinh hiệu ổn định ngoại trừ sốt nhẹ.\n- **Kết quả cận lâm sàng:** Xét nghiệm CBC cho thấy Bạch cầu (WBC) tăng nhẹ (11.2 G/L), X-quang phổi thẳng chưa phát hiện tổn thương thâm nhiễm.\n- **Chẩn đoán:** Viêm họng cấp tính (ICD-10: J02.9).\n- **Đơn thuốc kê khai:** Paracetamol 500mg, Augmentin 1g trong 7 ngày.`;
        sources = ['EMR_LK20260802-01.pdf', 'KetQuaXetNghiem_CBC_02082026.pdf'];
      } else if (query.toLowerCase().includes('icd') || query.toLowerCase().includes('triệu chứng')) {
        aiResponseText = `Dựa trên triệu chứng ho kéo dài 2 tuần, sốt về chiều và sút cân nhẹ, hệ thống gợi ý các mã chuẩn đoán ICD-10 tham khảo cho Bác sĩ:`;
        icd10 = [
          { code: 'A15.0', name: 'Lao phổi xác định bằng vi khuẩn học và sinh học' },
          { code: 'J40', name: 'Viêm phế quản không xác định cấp hay mãn' },
          { code: 'J44.9', name: 'Bệnh phổi tắc nghẽn mãn tính (COPD), không đặc hiệu' },
        ];
        sources = ['Bộ Y Tế - Danh mục ICD-10 Tiêu chuẩn Quốc gia'];
      } else {
        aiResponseText = `Theo khuyến cáo của Bộ Y tế và Dược thư Quốc gia, khi sử dụng phối hợp Paracetamol và Warfarin liều kéo dài (>2g/ngày trong trên 3 ngày) có thể làm tăng nhẹ chỉ số INR, cần theo dõi thời gian prothrombin của bệnh nhân.`;
        sources = ['Dược thư Quốc gia Việt Nam 2024'];
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiResponseText,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          sources,
          icd10,
        },
      ]);
      setLoading(false);
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Trợ lý AI Y tế (Google Gemini Pro Engine)</Title>
          <Text type="secondary">Hỗ trợ tra cứu EMR bằng ngôn ngữ tự nhiên, tóm tắt bệnh án và gợi ý chẩn đoán ICD-10</Text>
        </div>
        <Tag color="blue" icon={<SafetyCertificateOutlined />} style={{ padding: '6px 16px', fontSize: 14 }}>
          Gemini Health API Ready
        </Tag>
      </div>

      <Row gutter={16} style={{ flex: 1, minHeight: 0 }}>
        {/* Main Chat Panel */}
        <Col span={16} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden' }} bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16 }}>
            {/* Chat Messages */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.map((m, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start', gap: 12 }}>
                  {m.sender === 'ai' && <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a' }} />}

                  <div style={{ maxWidth: '80%' }}>
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: m.sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                        background: m.sender === 'user' ? '#1677ff' : '#f0f5ff',
                        color: m.sender === 'user' ? '#fff' : '#000',
                        whiteSpace: 'pre-wrap',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                      }}
                    >
                      {m.text}

                      {m.icd10 && (
                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {m.icd10.map((item) => (
                            <Tag key={item.code} color="blue" style={{ fontSize: 13, padding: 6 }}>
                              <strong>{item.code}</strong> - {item.name}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </div>

                    {m.sources && (
                      <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>Nguồn tham chiếu RAG:</Text>
                        {m.sources.map((s, i) => (
                          <Tag key={i} color="cyan" style={{ fontSize: 10 }}>{s}</Tag>
                        ))}
                      </div>
                    )}

                    <Text type="secondary" style={{ fontSize: 10, display: 'block', textAlign: m.sender === 'user' ? 'right' : 'left', marginTop: 4 }}>
                      {m.time}
                    </Text>
                  </div>

                  {m.sender === 'user' && <Avatar icon={<FileTextOutlined />} style={{ backgroundColor: '#1677ff' }} />}
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a' }} />
                  <Spin tip="Gemini đang phân tích và tổng hợp dữ liệu..." />
                </div>
              )}
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* Input Bar */}
            <div style={{ display: 'flex', gap: 8 }}>
              <TextArea
                rows={2}
                placeholder="Nhập câu hỏi tra cứu y khoa hoặc yêu cầu tóm tắt EMR..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button type="primary" icon={<SendOutlined />} size="large" onClick={() => handleSend()} style={{ height: '100%', minWidth: 100 }}>
                Gửi
              </Button>
            </div>
          </Card>
        </Col>

        {/* AI Quick Prompt Suggestions */}
        <Col span={8}>
          <Card title={<Space><BulbOutlined style={{ color: '#fa8c16' }} /><span>Prompt Mẫu Chuyên Môn</span></Space>} style={{ borderRadius: 12, height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button block style={{ textAlign: 'left', height: 'auto', padding: 12 }} onClick={() => handleSend('Tóm tắt hồ sơ bệnh án gần nhất của bệnh nhân Nguyễn Văn An')}>
                📄 <strong>Tóm tắt Bệnh án:</strong> Tóm tắt diễn biến lượt khám ngày 02/08/2026 của BN Nguyễn Văn An.
              </Button>

              <Button block style={{ textAlign: 'left', height: 'auto', padding: 12 }} onClick={() => handleSend('Gợi ý mã ICD-10 cho bệnh nhân ho kéo dài, sốt về chiều và sút cân')}>
                🏷️ <strong>Gợi ý mã ICD-10:</strong> Nhập các dấu hiệu lâm sàng để AI tìm kiếm mã chuẩn.
              </Button>

              <Button block style={{ textAlign: 'left', height: 'auto', padding: 12 }} onClick={() => handleSend('Tương tác thuốc giữa Paracetamol và Warfarin khi dùng kéo dài')}>
                💊 <strong>Kiểm tra Tương tác thuốc:</strong> Tra cứu mức độ tương tác giữa 2 loại thuốc kê đơn.
              </Button>
            </div>

            <Alert type="warning" showIcon style={{ marginTop: 24 }} message="Lưu ý Y tế:" description="Các gợi ý từ AI Gemini mang tính chất tham khảo hỗ trợ chuyên môn. Quyết định chẩn đoán và điều trị cuối cùng thuộc về Bác sĩ." />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
