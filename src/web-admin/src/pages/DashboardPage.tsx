import React from 'react';
import { Row, Col, Card, Typography, Table, Tag, Button, Space, Progress, Avatar } from 'antd';
import {
  UserOutlined,
  ScheduleOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  RobotOutlined,
  PlusOutlined,
  RightOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../store/useThemeStore';

const { Text } = Typography;

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();

  const chartData = [
    { name: 'Khoa Nội', lutKham: 142, revenue: 28500000 },
    { name: 'Khoa Ngoại', lutKham: 98, revenue: 45000000 },
    { name: 'Khoa Nhi', lutKham: 115, revenue: 19800000 },
    { name: 'Khoa Sản', lutKham: 86, revenue: 32400000 },
    { name: 'Khoa Mắt', lutKham: 64, revenue: 14200000 },
    { name: 'Khoa RHM', lutKham: 52, revenue: 18900000 },
  ];

  const recentQueue = [
    { stt: 101, maBN: 'BN20260001', hoTen: 'Nguyễn Văn An', phong: 'Phòng 102 - Khoa Nội', bacSi: 'BS. CKII. Nguyễn Thanh Duy', trangThai: 'Đang khám', time: '08:30' },
    { stt: 102, maBN: 'BN20260002', hoTen: 'Trần Thị Bình', phong: 'Phòng 102 - Khoa Nội', bacSi: 'BS. CKII. Nguyễn Thanh Duy', trangThai: 'Chờ cận lâm sàng', time: '08:45' },
    { stt: 103, maBN: 'BN20260003', hoTen: 'Lê Hoàng Nam', phong: 'Phòng 105 - Khoa Nhi', bacSi: 'BS. CKI. Phạm Minh Đức', trangThai: 'Đang chờ', time: '09:00' },
    { stt: 104, maBN: 'BN20260004', hoTen: 'Phạm Thu Cúc', phong: 'Phòng 102 - Khoa Nội', bacSi: 'BS. CKII. Nguyễn Thanh Duy', trangThai: 'Đang chờ', time: '09:15' },
    { stt: 105, maBN: 'BN20260005', hoTen: 'Vũ Đức Đạt', phong: 'Phòng 201 - Khoa Mắt', bacSi: 'BS. Trần Ngọc Mai', trangThai: 'Hoàn thành', time: '08:15' },
  ];

  const columns = [
    {
      title: 'Số STT',
      dataIndex: 'stt',
      key: 'stt',
      render: (val: number) => (
        <span className="font-extrabold text-xl text-sky-600 dark:text-sky-400 font-mono">
          #{val}
        </span>
      ),
    },
    {
      title: 'Mã Bệnh nhân',
      dataIndex: 'maBN',
      key: 'maBN',
      render: (code: string) => <Tag color="blue" className="font-mono text-xs px-2 py-0.5 rounded-md">{code}</Tag>,
    },
    {
      title: 'Bệnh nhân',
      dataIndex: 'hoTen',
      key: 'hoTen',
      render: (text: string) => <Text strong className="text-slate-900 dark:text-slate-100 font-semibold">{text}</Text>
    },
    { title: 'Phòng khám', dataIndex: 'phong', key: 'phong' },
    { title: 'Bác sĩ phụ trách', dataIndex: 'bacSi', key: 'bacSi' },
    { title: 'Thời gian cấp', dataIndex: 'time', key: 'time', render: (t: string) => <Text type="secondary">{t}</Text> },
    {
      title: 'Trạng thái khám',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (st: string) => {
        let color = 'default';
        if (st === 'Đang khám') color = 'processing';
        if (st === 'Chờ cận lâm sàng') color = 'purple';
        if (st === 'Đang chờ') color = 'warning';
        if (st === 'Hoàn thành') color = 'success';
        return <Tag color={color} className="font-medium">{st}</Tag>;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* High-End Hero Banner with Tailwind CSS */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-sky-900 p-8 text-white shadow-xl border border-sky-800/40">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <ThunderboltOutlined style={{ fontSize: 240, color: '#38bdf8' }} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="status-dot-active" /> Ca trực Sáng
              </span>
              <span className="text-xs text-sky-200">02 Tháng 08, 2026</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
              Bảng điều khiển Quản lý Bệnh viện & Hồ sơ EMR
            </h1>
            <p className="text-sky-100 text-sm md:text-base leading-relaxed">
              Chào mừng trở lại, <strong className="text-yellow-300">BS. CKII. Nguyễn Thanh Duy</strong>! Hôm nay có <strong className="text-white">42 ca khám bệnh</strong> phân công tại Khoa Nội.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              className="bg-emerald-600 hover:bg-emerald-700 border-none h-12 px-6 rounded-xl font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2"
              onClick={() => navigate('/reception')}
            >
              Tiếp nhận Mới
            </Button>
            <Button
              size="large"
              icon={<MedicineBoxOutlined />}
              className="h-12 px-6 rounded-xl font-bold bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md flex items-center gap-2"
              onClick={() => navigate('/examinations')}
            >
              Màn hình Khám (SOAP)
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="rounded-2xl border-l-4 border-l-sky-600 shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <Text type="secondary" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">TỔNG TIẾP NHẬN HÔM NAY</Text>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">158</h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-slate-900 text-sky-600 flex items-center justify-center text-xl shadow-sm">
                <UserOutlined />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Tag color="green" icon={<ArrowUpOutlined />} className="m-0 font-bold">+12.5%</Tag>
              <Text type="secondary" className="text-xs text-slate-500 dark:text-slate-400">So với hôm qua</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="rounded-2xl border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <Text type="secondary" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">ĐẶT LỊCH TRỰC TUYẾN APP</Text>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
                  45 <span className="text-sm font-medium text-slate-400">/ 50 slots</span>
                </h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-slate-900 text-amber-500 flex items-center justify-center text-xl shadow-sm">
                <ScheduleOutlined />
              </div>
            </div>
            <Progress percent={90} showInfo={false} strokeColor="#f59e0b" className="mt-4" />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="rounded-2xl border-l-4 border-l-emerald-500 shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <Text type="secondary" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">CA KHÁM HOÀN THÀNH</Text>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">92</h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-slate-900 text-emerald-500 flex items-center justify-center text-xl shadow-sm">
                <CheckCircleFilled />
              </div>
            </div>
            <Text type="secondary" className="text-xs text-slate-500 dark:text-slate-400 block mt-3">66 ca đang khám & chờ kết quả CLS</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="rounded-2xl border-l-4 border-l-indigo-500 shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <Text type="secondary" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">DOANH THU VIỆN PHÍ TẠM TÍNH</Text>
                <h2 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">{formatCurrency(158800000)}</h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-slate-900 text-indigo-500 flex items-center justify-center text-xl shadow-sm">
                <DollarOutlined />
              </div>
            </div>
            <Text type="secondary" className="text-xs text-slate-500 dark:text-slate-400 block mt-3">BHYT: 62% • VietQR: 38%</Text>
          </Card>
        </Col>
      </Row>

      {/* Main Charts & AI Helper Side Panel */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Card
            title={<span className="font-bold text-slate-800 dark:text-slate-100 text-lg">Thống kê Lượt khám theo Chuyên khoa</span>}
            bordered={false}
            className="rounded-2xl shadow-md bg-white dark:bg-slate-800"
          >
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} stroke={isDarkMode ? '#94a3b8' : '#64748b'} />
                  <YAxis axisLine={false} tickLine={false} stroke={isDarkMode ? '#94a3b8' : '#64748b'} />
                  <Tooltip
                    formatter={(value: number) => [`${value} lượt`, 'Số lượt khám']}
                    contentStyle={{
                      borderRadius: 12,
                      background: isDarkMode ? '#0f172a' : '#ffffff',
                      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}
                  />
                  <Bar dataKey="lutKham" fill="url(#colorUv)" radius={[8, 8, 0, 0]}>
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isDarkMode ? '#38bdf8' : '#0284c7'} stopOpacity={1} />
                        <stop offset="100%" stopColor={isDarkMode ? '#0284c7' : '#38bdf8'} stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <RobotOutlined className="text-sky-600 dark:text-sky-400" />
                <span className="font-bold text-slate-800 dark:text-slate-100 text-lg">Trợ lý AI Y tế (Hỗ trợ Lâm sàng)</span>
              </Space>
            }
            extra={<Button type="link" className="text-sky-600 font-bold" onClick={() => navigate('/ai-assistant')}>Mở AI <RightOutlined /></Button>}
            bordered={false}
            className="rounded-2xl shadow-md border border-sky-100 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            <div className="flex items-center gap-3.5 mb-5">
              <Avatar size={48} icon={<RobotOutlined />} className="bg-sky-600 shadow-md shadow-sky-600/30" />
              <div>
                <Text strong className="text-base block text-slate-900 dark:text-slate-100 font-bold">Hệ thống Trợ lý AI Y tế</Text>
                <Text type="secondary" className="text-xs text-slate-500 dark:text-slate-400">Tra cứu tri thức & Tóm tắt EMR tự động</Text>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <Button block className="text-left h-auto p-3 rounded-xl hover:border-sky-500 hover:text-sky-600 transition-all duration-200" onClick={() => navigate('/ai-assistant')}>
                💡 <strong>Tóm tắt bệnh án:</strong> BN20260001 (Đau họng, sốt 38°C)
              </Button>
              <Button block className="text-left h-auto p-3 rounded-xl hover:border-sky-500 hover:text-sky-600 transition-all duration-200" onClick={() => navigate('/ai-assistant')}>
                🔍 <strong>Gợi ý mã ICD-10:</strong> Ho khan, tức ngực về đêm
              </Button>
              <Button block className="text-left h-auto p-3 rounded-xl hover:border-sky-500 hover:text-sky-600 transition-all duration-200" onClick={() => navigate('/ai-assistant')}>
                📚 <strong>Tra cứu Dược lý:</strong> Tương tác Paracetamol & Warfarin
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Live Queue Table */}
      <Card
        title={
          <div className="flex items-center gap-2.5">
            <ClockCircleOutlined className="text-sky-600 dark:text-sky-400 text-lg" />
            <span className="font-bold text-slate-800 dark:text-slate-100 text-lg">Hàng chờ Gọi Khám Bệnh Trực tiếp</span>
          </div>
        }
        extra={<Button type="primary" ghost className="rounded-lg font-semibold" onClick={() => navigate('/reception')}>Quản lý Tiếp nhận</Button>}
        bordered={false}
        className="rounded-2xl shadow-md bg-white dark:bg-slate-800"
      >
        <Table dataSource={recentQueue} columns={columns} rowKey="stt" pagination={false} />
      </Card>
    </div>
  );
};
