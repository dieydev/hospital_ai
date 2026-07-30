import React, { useState } from 'react';
import { Card, Input, Button, List, Typography, Tag, Space, Spin } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  sources?: string[];
}

export const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: 'Xin chào Bác sĩ! Tôi là Trợ lý AI Y tế được tích hợp Gemini RAG. Tôi có thể hỗ trợ tra cứu phác đồ điều trị của Bộ Y Tế, gợi ý mã bệnh ICD-10 hoặc tóm tắt hồ sơ bệnh án.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        sender: 'ai',
        text: 'Theo Hướng dẫn điều trị của Bộ Y Tế (Tài liệu Phác đồ Nội khoa 2024), đối với bệnh nhân viêm họng cấp tính kèm sốt nhẹ, phác đồ khuyến cáo là nghỉ ngơi, nâng cao thể trạng, kết hợp kháng sinh nhóm Beta-lactam nếu có nhiễm khuẩn.',
        sources: ['Quyết định số 2122/QĐ-BYT Hướng dẫn chẩn đoán và điều trị bệnh tai mũi họng', 'Cơ sở dữ liệu Phác đồ Y tế HospitalAI'],
      };
      setMessages((prev) => [...prev, aiMsg]);
      setLoading(false);
    }, 1200);
  };

  return (
    <div>
      <Title level={3}>
        <RobotOutlined style={{ color: '#00b4d8', marginRight: 8 }} />
        Trợ lý AI & Hỗ trợ RAG Chuyên môn Y tế
      </Title>

      <Card style={{ height: '65vh', display: 'flex', flexDirection: 'column' }} bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
          <List
            dataSource={messages}
            renderItem={(item) => (
              <div style={{ display: 'flex', justifyContent: item.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
                <Space align="start">
                  {item.sender === 'ai' && <RobotOutlined style={{ fontSize: 24, color: '#0077b6' }} />}
                  <div
                    style={{
                      maxWidth: '600px',
                      padding: '12px 16px',
                      borderRadius: 12,
                      background: item.sender === 'user' ? '#0077b6' : '#f0f2f5',
                      color: item.sender === 'user' ? '#fff' : '#000',
                    }}
                  >
                    <Text style={{ color: item.sender === 'user' ? '#fff' : '#000' }}>{item.text}</Text>
                    {item.sources && (
                      <div style={{ marginTop: 8, borderTop: '1px solid #d9d9d9', paddingTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Nguồn trích dẫn RAG:</Text>
                        {item.sources.map((s, idx) => (
                          <Tag color="cyan" key={idx} style={{ marginTop: 4, display: 'block' }}>{s}</Tag>
                        ))}
                      </div>
                    )}
                  </div>
                  {item.sender === 'user' && <UserOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
                </Space>
              </div>
            )}
          />
          {loading && <Spin style={{ margin: '16px 0' }} tip="AI đang truy vấn tri thức RAG..." />}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={handleSend}
            placeholder="Nhập câu hỏi tra cứu phác đồ, thuật ngữ y khoa hoặc tìm kiếm hồ sơ bệnh án..."
            size="large"
          />
          <Button type="primary" size="large" icon={<SendOutlined />} onClick={handleSend}>Gửi</Button>
        </div>
      </Card>
    </div>
  );
};
