import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Space, Input, Tabs, Modal, Button, Tooltip, Badge } from 'antd';
import { SearchOutlined, UserOutlined, RobotOutlined, DatabaseOutlined, CodeOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { AuditLog } from '../types';
import { useThemeStore } from '../store/useThemeStore';
import { geminiService, MongoAILogDocument } from '../services/geminiService';

const { Title, Text } = Typography;

export const AuditLogPage: React.FC = () => {
  const { isDarkMode } = useThemeStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [mongoLogs, setMongoLogs] = useState<MongoAILogDocument[]>([]);
  const [selectedJsonDoc, setSelectedJsonDoc] = useState<MongoAILogDocument | null>(null);

  useEffect(() => {
    geminiService.getAILogsFromMongo().then((data) => setMongoLogs(data));
  }, []);

  const [auditLogs] = useState<AuditLog[]>([
    {
      id: 'log-001',
      thoiGian: '2026-08-08 09:30:15',
      nguoiThucHien: 'BS. CKII. Nguyễn Thanh Duy',
      vaiTro: 'Doctor',
      hanhDong: 'HOÀN TẤT KHÁM & TẠO ĐƠN THUỐC',
      module: 'Khám bệnh (SOAP)',
      chiTiet: 'Tạo EMR lượt khám LK20260802-01 cho BN Nguyễn Văn An (BN20260001). Gắn mã ICD-10 J02.9.',
      ipAddress: '192.168.1.45',
      isAiAction: false,
    },
    {
      id: 'log-002',
      thoiGian: '2026-08-08 09:25:40',
      nguoiThucHien: 'BS. CKII. Nguyễn Thanh Duy',
      vaiTro: 'Doctor',
      hanhDong: 'GỌI TRỢ LÝ AI GEMINI',
      module: 'Trợ lý AI Y tế',
      chiTiet: 'AI gợi ý mã bệnh ICD-10 dựa trên triệu chứng [Đau họng, sốt 38°C, ho khan]. Kết quả: J02.9 (98%).',
      ipAddress: '192.168.1.45',
      isAiAction: true,
    },
    {
      id: 'log-003',
      thoiGian: '2026-08-08 09:15:02',
      nguoiThucHien: 'Lễ tân Trần Thị Hương',
      vaiTro: 'Receptionist',
      hanhDong: 'CẤP SỐ THỨ TỰ KHÁM',
      module: 'Tiếp nhận bệnh nhân',
      chiTiet: 'Cấp số STT #101 cho bệnh nhân Nguyễn Văn An (Phòng 102 - Khoa Nội).',
      ipAddress: '192.168.1.12',
      isAiAction: false,
    },
    {
      id: 'log-004',
      thoiGian: '2026-08-08 08:50:11',
      nguoiThucHien: 'Bệnh nhân Nguyễn Văn An',
      vaiTro: 'Patient (Mobile App)',
      hanhDong: 'ĐẶT LỊCH KHÁM TRỰC TUYẾN',
      module: 'Mobile App Flutter',
      chiTiet: 'Đặt lịch khám thành công ngày 08/08/2026 khung giờ 09:00 - 09:30 tại Khoa Nội.',
      ipAddress: '14.226.12.89',
      isAiAction: false,
    },
  ]);

  const filteredLogs = auditLogs.filter((log) => {
    if (!searchKeyword) return true;
    const q = searchKeyword.toLowerCase();
    return (
      log.nguoiThucHien.toLowerCase().includes(q) ||
      log.hanhDong.toLowerCase().includes(q) ||
      log.module.toLowerCase().includes(q) ||
      log.chiTiet.toLowerCase().includes(q) ||
      log.ipAddress.includes(q)
    );
  });

  const filteredMongoLogs = mongoLogs.filter((doc) => {
    if (!searchKeyword) return true;
    const q = searchKeyword.toLowerCase();
    return (
      doc._id.toLowerCase().includes(q) ||
      doc.doctorName.toLowerCase().includes(q) ||
      doc.promptText.toLowerCase().includes(q) ||
      doc.responseText.toLowerCase().includes(q) ||
      doc.actionType.toLowerCase().includes(q)
    );
  });

  const sqlColumns = [
    { title: 'Thời gian', dataIndex: 'thoiGian', key: 'thoiGian', width: 170, render: (t: string) => <Text style={{ fontSize: 13, color: isDarkMode ? '#cbd5e1' : undefined }}>{t}</Text> },
    {
      title: 'Người thực hiện',
      dataIndex: 'nguoiThucHien',
      key: 'nguoiThucHien',
      render: (n: string, r: AuditLog) => (
        <Space>
          <UserOutlined style={{ color: isDarkMode ? '#38bdf8' : '#0284c7' }} />
          <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>{n}</Text>
          <Tag color="blue">{r.vaiTro}</Tag>
        </Space>
      )
    },
    { title: 'Hành động', dataIndex: 'hanhDong', key: 'hanhDong', render: (h: string, r: AuditLog) => <Tag color={r.isAiAction ? 'purple' : 'green'}>{h}</Tag> },
    { title: 'Phân hệ', dataIndex: 'module', key: 'module' },
    { title: 'Chi tiết thao tác', dataIndex: 'chiTiet', key: 'chiTiet', render: (c: string) => <Text style={{ color: isDarkMode ? '#cbd5e1' : undefined }}>{c}</Text> },
    { title: 'IP Address', dataIndex: 'ipAddress', key: 'ipAddress', width: 120, render: (ip: string) => <Text type="secondary" style={{ fontFamily: 'monospace' }}>{ip}</Text> },
  ];

  const mongoColumns = [
    {
      title: 'Document ID (_id)',
      dataIndex: '_id',
      key: '_id',
      width: 170,
      render: (id: string) => <Tag color="green" style={{ fontFamily: 'monospace' }}>{id}</Tag>,
    },
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (t: string) => <Text style={{ fontSize: 13 }}>{t}</Text>,
    },
    {
      title: 'Bác sĩ / Vai trò',
      key: 'doctor',
      render: (r: MongoAILogDocument) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.doctorName}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.userRole}</Text>
        </div>
      ),
    },
    {
      title: 'Loại tác vụ AI',
      dataIndex: 'actionType',
      key: 'actionType',
      render: (type: MongoAILogDocument['actionType']) => {
        let color = 'blue';
        let text: string = type;
        if (type === 'CHAT_ASSISTANT') { color = 'purple'; text = 'Chat Trợ lý AI'; }
        else if (type === 'ICD10_SUGGESTION') { color = 'cyan'; text = 'Gợi ý ICD-10'; }
        else if (type === 'DRUG_SAFETY_CHECK') { color = 'orange'; text = 'Cảnh báo Dược phẩm'; }
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'AI Model Engine',
      dataIndex: 'modelUsed',
      key: 'modelUsed',
      render: (model: string) => <Tag color="gold" className="font-mono">{model}</Tag>,
    },
    {
      title: 'Prompt Câu hỏi',
      dataIndex: 'promptText',
      key: 'promptText',
      ellipsis: true,
      render: (text: string) => <Tooltip title={text}><span>{text}</span></Tooltip>,
    },
    {
      title: 'Thời gian xử lý',
      dataIndex: 'latencyMs',
      key: 'latencyMs',
      width: 120,
      render: (ms: number) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#10b981' }} />
          <Text style={{ fontWeight: 600 }}>{ms} ms</Text>
        </Space>
      ),
    },
    {
      title: 'Document JSON',
      key: 'view',
      width: 120,
      render: (record: MongoAILogDocument) => (
        <Button
          size="small"
          icon={<CodeOutlined />}
          onClick={() => setSelectedJsonDoc(record)}
        >
          JSON NoSQL
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isDarkMode
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)'
            : 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #e2e8f0 100%)',
          padding: '20px 24px',
          borderRadius: '12px',
          border: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd',
          boxShadow: isDarkMode ? '0 10px 30px rgba(0, 0, 0, 0.3)' : '0 10px 30px rgba(2, 132, 199, 0.08)'
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: isDarkMode ? '#38bdf8' : '#0369a1' }}>
            Nhật ký & Kiểm toán Hệ thống (Audit Log)
          </Title>
          <Text style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
            Tích hợp CSDL Lai (Hybrid): SQL Server 2022 (Nghiệp vụ Y tế) & MongoDB NoSQL (Nhật ký AI & Prompts)
          </Text>
        </div>
        <Input
          placeholder="Tìm kiếm nhật ký theo Tên / Thao tác / Prompt / IP..."
          prefix={<SearchOutlined />}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{ width: 340 }}
        />
      </div>

      <Card style={{ borderRadius: 12, border: isDarkMode ? '1px solid #334155' : undefined }}>
        <Tabs
          defaultActiveKey="sql"
          items={[
            {
              key: 'sql',
              label: (
                <span>
                  <DatabaseOutlined style={{ color: '#0284c7' }} /> Nhật ký Hệ thống (SQL Server RDBMS)
                </span>
              ),
              children: <Table dataSource={filteredLogs} columns={sqlColumns} rowKey="id" />,
            },
            {
              key: 'mongo',
              label: (
                <span>
                  <RobotOutlined style={{ color: '#10b981' }} /> Nhật ký AI & Prompts (MongoDB NoSQL)
                  <Badge count={mongoLogs.length} offset={[8, -2]} color="#10b981" />
                </span>
              ),
              children: <Table dataSource={filteredMongoLogs} columns={mongoColumns} rowKey="_id" />,
            },
          ]}
        />
      </Card>

      {/* JSON NoSQL Document Modal Viewer */}
      <Modal
        title="Chi tiết NoSQL Document (MongoDB HospitalAI_AI_Logs)"
        open={!!selectedJsonDoc}
        onCancel={() => setSelectedJsonDoc(null)}
        footer={[<Button key="close" onClick={() => setSelectedJsonDoc(null)}>Đóng</Button>]}
        width={650}
      >
        {selectedJsonDoc && (
          <pre
            style={{
              background: isDarkMode ? '#0f172a' : '#1e293b',
              color: '#38bdf8',
              padding: 16,
              borderRadius: 10,
              fontSize: 13,
              overflowX: 'auto',
              maxHeight: 400,
            }}
          >
            {JSON.stringify(selectedJsonDoc, null, 2)}
          </pre>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogPage;
