import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Space, Input, Tabs, Modal, Button, Tooltip, Badge } from 'antd';
import { SearchOutlined, UserOutlined, RobotOutlined, DatabaseOutlined, CodeOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { AuditLog } from '../types';
import { useThemeStore } from '../store/useThemeStore';
import { geminiService, MongoAILogDocument } from '../services/geminiService';

const { Text } = Typography;

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
    <div className="flex flex-col gap-6">
      {/* Modern Medical Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 p-6 md:p-8 text-white shadow-md border border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="status-dot-active" />
            <Text className="text-xs text-sky-300 font-semibold uppercase tracking-wider">Kiểm Toán Hệ Thống • Hybrid DB (SQL Server & MongoDB)</Text>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight margin-0">
            Nhật ký & Kiểm toán Hệ thống (Audit Log & AI Trace)
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1">
            Ghi vết truy cập SQL Server 2022 và Nhật ký câu lệnh AI Prompts NoSQL MongoDB
          </p>
        </div>
        <Input
          placeholder="Tìm nhật ký theo Tên, Thao tác, Prompt, IP..."
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{ width: 320 }}
        />
      </div>

      <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 hover-lift">
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
