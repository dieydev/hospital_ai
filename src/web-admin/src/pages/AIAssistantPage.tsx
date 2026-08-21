import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Typography, Tag, Avatar, Spin, Divider, Row, Col, Alert, Space } from 'antd';
import { RobotOutlined, SendOutlined, FileTextOutlined, SafetyCertificateOutlined, BulbOutlined } from '@ant-design/icons';
import { useThemeStore } from '../store/useThemeStore';

import { geminiService } from '../services/geminiService';

const { Text } = Typography;
const { TextArea } = Input;

export const AIAssistantPage: React.FC = () => {
  const { isDarkMode } = useThemeStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string; sources?: string[]; icd10?: Array<{ code: string; name: string }> }>>([
    {
      sender: 'ai',
      text: 'Xin chào Bác sĩ! Tôi là Trợ lý AI Y tế (tích hợp nền tảng Hospital AI Medical Engine). Tôi có thể hỗ trợ Bác sĩ tra cứu thông tin bệnh án bằng ngôn ngữ tự nhiên, tóm tắt diễn biến EMR phức tạp, tư vấn tương tác thuốc và gợi ý mã bệnh ICD-10 chuẩn.',
      time: '08:00',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
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

    try {
      const res = await geminiService.askGemini(query);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: res.text,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          sources: res.sources,
          icd10: res.icd10Suggestions,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Xin lỗi Bác sĩ, có lỗi kết nối đến Gemini AI API. Vui lòng kiểm tra lại mạng hoặc thử lại.',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Modern Medical Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 p-6 md:p-8 text-white shadow-md border border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="status-dot-active" />
            <Text className="text-xs text-sky-300 font-semibold uppercase tracking-wider">Trợ Lý Lâm Sàng • Google Gemini 3.6 Flash</Text>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight margin-0">
            Trợ lý Trí tuệ Nhân tạo Y tế (Hospital AI Medical Engine)
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1">
            Hỗ trợ tra cứu EMR bằng ngôn ngữ tự nhiên, tóm tắt bệnh án, gợi ý chẩn đoán ICD-10 và kiểm tra tương tác thuốc
          </p>
        </div>
        <Tag color="cyan" icon={<SafetyCertificateOutlined />} className="px-3 py-1.5 text-xs rounded-lg font-semibold m-0">
          Hospital AI Engine Ready
        </Tag>
      </div>

      <Row gutter={[16, 16]} style={{ flex: 1, minHeight: 0 }}>
        {/* Main Chat Panel */}
        <Col span={16} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Card
            className="rounded-xl bg-white dark:bg-slate-800 hover-lift"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              height: '100%',
            }}
            styles={{
              body: {
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: 16,
                overflow: 'hidden',
                height: '100%',
              },
            }}
          >
            {/* Chat Messages */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
              {messages.map((m, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start', gap: 12 }}>
                  {m.sender === 'ai' && <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#10b981' }} />}

                  <div style={{ maxWidth: '80%' }}>
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: m.sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                        background: m.sender === 'user'
                          ? '#0284c7'
                          : isDarkMode ? '#0f172a' : '#f0f9ff',
                        color: m.sender === 'user'
                          ? '#ffffff'
                          : isDarkMode ? '#f8fafc' : '#0f172a',
                        whiteSpace: 'pre-wrap',
                        border: m.sender === 'ai' && isDarkMode ? '1px solid #334155' : undefined,
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
                        <Text type="secondary" style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : undefined }}>Nguồn tham chiếu RAG:</Text>
                        {m.sources.map((s, i) => (
                          <Tag key={i} color="cyan" style={{ fontSize: 10 }}>{s}</Tag>
                        ))}
                      </div>
                    )}

                    <Text type="secondary" style={{ fontSize: 10, display: 'block', textAlign: m.sender === 'user' ? 'right' : 'left', marginTop: 4, color: isDarkMode ? '#94a3b8' : undefined }}>
                      {m.time}
                    </Text>
                  </div>

                  {m.sender === 'user' && <Avatar icon={<FileTextOutlined />} style={{ backgroundColor: '#0284c7' }} />}
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#10b981' }} />
                  <Spin tip="Gemini đang phân tích và tổng hợp dữ liệu..." />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <Divider style={{ margin: '12px 0', borderColor: isDarkMode ? '#334155' : undefined }} />

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
              <Button
                type="primary"
                icon={<SendOutlined />}
                size="large"
                onClick={() => handleSend()}
                style={{ height: '100%', minWidth: 100, backgroundColor: '#0284c7', borderColor: '#0284c7' }}
              >
                Gửi
              </Button>
            </div>
          </Card>
        </Col>

        {/* AI Quick Prompt Suggestions */}
        <Col span={8}>
          <Card
            title={
              <Space>
                <BulbOutlined style={{ color: '#f59e0b' }} />
                <span style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Prompt Mẫu Chuyên Môn</span>
              </Space>
            }
            style={{ borderRadius: 12, height: '100%', border: isDarkMode ? '1px solid #334155' : undefined }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button
                block
                style={{
                  textAlign: 'left',
                  height: 'auto',
                  padding: '12px 14px',
                  borderRadius: 10,
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  lineHeight: '1.4',
                  border: isDarkMode ? '1px solid #334155' : undefined,
                  background: isDarkMode ? '#1e293b' : '#ffffff',
                }}
                onClick={() => handleSend('Tóm tắt hồ sơ bệnh án gần nhất của bệnh nhân Nguyễn Văn An')}
              >
                📄 <strong>Tóm tắt Bệnh án:</strong> Tóm tắt diễn biến lượt khám ngày 02/08/2026 của BN Nguyễn Văn An.
              </Button>

              <Button
                block
                style={{
                  textAlign: 'left',
                  height: 'auto',
                  padding: '12px 14px',
                  borderRadius: 10,
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  lineHeight: '1.4',
                  border: isDarkMode ? '1px solid #334155' : undefined,
                  background: isDarkMode ? '#1e293b' : '#ffffff',
                }}
                onClick={() => handleSend('Gợi ý mã ICD-10 cho bệnh nhân ho kéo dài, sốt về chiều và sút cân')}
              >
                🏷️ <strong>Gợi ý mã ICD-10:</strong> Nhập các dấu hiệu lâm sàng để AI tìm kiếm mã chuẩn.
              </Button>

              <Button
                block
                style={{
                  textAlign: 'left',
                  height: 'auto',
                  padding: '12px 14px',
                  borderRadius: 10,
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  lineHeight: '1.4',
                  border: isDarkMode ? '1px solid #334155' : undefined,
                  background: isDarkMode ? '#1e293b' : '#ffffff',
                }}
                onClick={() => handleSend('Tương tác thuốc giữa Paracetamol và Warfarin khi dùng kéo dài')}
              >
                💊 <strong>Kiểm tra Tương tác thuốc:</strong> Tra cứu mức độ tương tác giữa 2 loại thuốc kê đơn.
              </Button>
            </div>

            <Alert
              type="warning"
              showIcon
              style={{ marginTop: 24 }}
              message="Lưu ý Y tế:"
              description="Các gợi ý từ AI Gemini mang tính chất tham khảo hỗ trợ chuyên môn. Quyết định chẩn đoán và điều trị cuối cùng thuộc về Bác sĩ."
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
