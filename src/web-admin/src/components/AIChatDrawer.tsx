import React, { useState, useRef, useEffect } from 'react';
import { Drawer, Input, Button, Typography, Tag, Avatar, Spin, Divider, Space, Tooltip } from 'antd';
import {
  RobotOutlined,
  SendOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  BulbOutlined,
  CloseOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useThemeStore } from '../store/useThemeStore';
import { geminiService } from '../services/geminiService';

const { Text } = Typography;
const { TextArea } = Input;

interface AIChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  time: string;
  sources?: string[];
  icd10?: Array<{ code: string; name: string }>;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({ open, onClose }) => {
  const { isDarkMode } = useThemeStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Xin chào Bác sĩ! Tôi là Trợ lý AI Y tế (Gemini 3.6 Flash). Tôi sẵn sàng hỗ trợ tra cứu bệnh án EMR, gợi ý mã ICD-10 và rà soát tương tác thuốc ngay trên màn hình này.',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, open]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const newMsg: Message = {
      sender: 'user',
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
          text: 'Xin lỗi Bác sĩ, không thể kết nối tới dịch vụ Gemini AI. Vui lòng kiểm tra lại mạng hoặc thử lại.',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        sender: 'ai',
        text: 'Đã làm mới phiên trò chuyện. Tôi có thể giúp gì cho Bác sĩ?',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size={30} icon={<RobotOutlined />} style={{ background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)' }} />
            <div>
              <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a', fontSize: 14, display: 'block', lineHeight: 1.2 }}>
                Trợ lý Gemini AI
              </Text>
              <Text type="secondary" style={{ fontSize: 10, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                Hỗ trợ Y tế & Tra cứu EMR
              </Text>
            </div>
          </div>
          <Space>
            <Tooltip title="Làm mới hội thoại">
              <Button type="text" size="small" icon={<ClearOutlined />} onClick={handleClear} />
            </Tooltip>
          </Space>
        </div>
      }
      placement="right"
      width={360}
      onClose={onClose}
      open={open}
      closeIcon={<CloseOutlined style={{ color: isDarkMode ? '#cbd5e1' : '#475569', fontSize: 14 }} />}
      styles={{
        header: {
          background: isDarkMode ? '#1e293b' : '#ffffff',
          borderBottom: isDarkMode ? '1px solid #334155' : '1px solid #e0f2fe',
          padding: '10px 14px',
        },
        body: {
          background: isDarkMode ? '#0f172a' : '#f8fafc',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        },
      }}
    >
      {/* Privacy Notice Badge */}
      <div
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          background: isDarkMode ? '#1e293b' : '#f0f9ff',
          border: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <SafetyCertificateOutlined style={{ color: '#0284c7', fontSize: 16 }} />
        <Text style={{ fontSize: 11, color: isDarkMode ? '#cbd5e1' : '#0369a1' }}>
          Đã bật <strong>Bảo mật PII</strong>: Tự động khử dữ liệu cá nhân trước khi gửi AI.
        </Text>
      </div>

      {/* Chat Messages Container */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start', gap: 10 }}>
            {m.sender === 'ai' && <Avatar size={30} icon={<RobotOutlined />} style={{ backgroundColor: '#0284c7', flexShrink: 0 }} />}

            <div style={{ maxWidth: '85%' }}>
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background: m.sender === 'user' ? '#0284c7' : isDarkMode ? '#1e293b' : '#ffffff',
                  color: m.sender === 'user' ? '#ffffff' : isDarkMode ? '#f8fafc' : '#0f172a',
                  whiteSpace: 'pre-wrap',
                  fontSize: 13,
                  lineHeight: 1.5,
                  border: m.sender === 'ai' ? (isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0') : 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {m.text}

                {m.icd10 && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {m.icd10.map((item) => (
                      <Tag key={item.code} color="blue" style={{ fontSize: 11, padding: '2px 8px' }}>
                        <strong>{item.code}</strong> - {item.name}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>

              {m.sources && (
                <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {m.sources.map((s, i) => (
                    <Tag key={i} color="cyan" style={{ fontSize: 9, margin: 0 }}>{s}</Tag>
                  ))}
                </div>
              )}

              <Text type="secondary" style={{ fontSize: 10, display: 'block', textAlign: m.sender === 'user' ? 'right' : 'left', marginTop: 2, color: isDarkMode ? '#94a3b8' : undefined }}>
                {m.time}
              </Text>
            </div>

            {m.sender === 'user' && <Avatar size={30} icon={<FileTextOutlined />} style={{ backgroundColor: '#3b82f6', flexShrink: 0 }} />}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8 }}>
            <Avatar size={30} icon={<RobotOutlined />} style={{ backgroundColor: '#0284c7' }} />
            <Spin size="small" tip="AI đang xử lý..." />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <Text style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b', display: 'block', marginBottom: 6 }}>
          <BulbOutlined style={{ color: '#f59e0b', marginRight: 4 }} /> Gợi ý câu hỏi nhanh:
        </Text>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Tag
            color="sky"
            style={{ cursor: 'pointer', padding: '4px 8px', fontSize: 11, borderRadius: 6, margin: 0 }}
            onClick={() => handleSend('Tóm tắt bệnh án gần nhất của bệnh nhân Nguyễn Văn An')}
          >
            📋 Tóm tắt bệnh án BN20260001
          </Tag>
          <Tag
            color="cyan"
            style={{ cursor: 'pointer', padding: '4px 8px', fontSize: 11, borderRadius: 6, margin: 0 }}
            onClick={() => handleSend('Gợi ý mã chẩn đoán ICD-10 cho trường hợp sốt cao, ho có đờm')}
          >
            🔍 Gợi ý mã ICD-10
          </Tag>
          <Tag
            color="orange"
            style={{ cursor: 'pointer', padding: '4px 8px', fontSize: 11, borderRadius: 6, margin: 0 }}
            onClick={() => handleSend('Kiểm tra tương tác thuốc giữa Paracetamol 500mg và Augmentin 1g')}
          >
            💊 Tương tác thuốc
          </Tag>
        </div>
      </div>

      <Divider style={{ margin: '8px 0', borderColor: isDarkMode ? '#334155' : '#e0f2fe' }} />

      {/* Input Bar */}
      <div style={{ display: 'flex', gap: 8 }}>
        <TextArea
          rows={2}
          placeholder="Hỏi AI về thông tin y tế, ICD-10 hoặc tóm tắt EMR..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          style={{ borderRadius: 8, fontSize: 13 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => handleSend()}
          style={{ height: 'auto', padding: '0 16px', background: '#0284c7', borderRadius: 8 }}
        >
          Gửi
        </Button>
      </div>
    </Drawer>
  );
};
