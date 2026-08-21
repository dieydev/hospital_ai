import React from 'react';
import { Row, Col, Card, Typography, Table, Tag, Button, Progress } from 'antd';
import {
  UserOutlined,
  ScheduleOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  PlusOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  PieChartOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
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

  const receptionSourceData = [
    { name: 'Đăng ký qua Flutter Mobile App', value: 45, color: '#0284c7' },
    { name: 'Trực tiếp tại quầy Lễ tân', value: 35, color: '#10b981' },
    { name: 'Cấp cứu & BHYT Ưu tiên', value: 20, color: '#f59e0b' },
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
        <span className="font-bold text-lg text-sky-600 dark:text-sky-400 font-mono">
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
      {/* Professional Medical Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 p-6 md:p-8 text-white shadow-md border border-slate-700/50">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                <span className="status-dot-active" /> Ca trực Sáng • Khoa Nội Tổng Hợp
              </span>
              <span className="text-xs text-slate-300">Hệ thống Y tế Hospital AI</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2">
              Bảng Điều Khiển Bệnh Viện & Hồ Sơ Bệnh Án Điện Tử (EMR)
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Xin chào, <strong className="text-sky-300">BS. CKII. Nguyễn Thanh Duy</strong>. Hệ thống ghi nhận <strong className="text-white">42 ca khám bệnh</strong> đang trong danh sách chờ tiếp nhận và xử lý hôm nay.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              className="bg-sky-600 hover:bg-sky-700 border-none h-11 px-5 rounded-lg font-semibold flex items-center gap-2"
              onClick={() => navigate('/reception')}
            >
              Tiếp nhận Bệnh nhân
            </Button>
            <Button
              size="large"
              icon={<MedicineBoxOutlined />}
              className="h-11 px-5 rounded-lg font-semibold bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md flex items-center gap-2"
              onClick={() => navigate('/examinations')}
            >
              Phòng Khám SOAP
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="rounded-xl border-l-4 border-l-sky-600 bg-white dark:bg-slate-800 hover-lift">
            <div className="flex justify-between items-start">
              <div>
                <Text type="secondary" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">TỔNG TIẾP NHẬN HÔM NAY</Text>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">158</h2>
              </div>
              <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-slate-900 text-sky-600 flex items-center justify-center text-lg shrink-0">
                <UserOutlined />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Tag color="green" icon={<ArrowUpOutlined />} className="m-0 font-semibold text-xs">+12.5%</Tag>
              <Text type="secondary" className="text-xs text-slate-500 dark:text-slate-400">Tăng so với hôm qua</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="rounded-xl border-l-4 border-l-amber-500 bg-white dark:bg-slate-800 hover-lift">
            <div className="flex justify-between items-start">
              <div>
                <Text type="secondary" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">ĐẶT LỊCH MOBILE APP</Text>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  45 <span className="text-xs font-normal text-slate-400">/ 50 lượt</span>
                </h2>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-slate-900 text-amber-500 flex items-center justify-center text-lg shrink-0">
                <ScheduleOutlined />
              </div>
            </div>
            <Progress percent={90} showInfo={false} strokeColor="#f59e0b" className="mt-3" />
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="rounded-xl border-l-4 border-l-emerald-500 bg-white dark:bg-slate-800 hover-lift">
            <div className="flex justify-between items-start">
              <div>
                <Text type="secondary" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">CA KHÁM HOÀN THÀNH</Text>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">92</h2>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-slate-900 text-emerald-500 flex items-center justify-center text-lg shrink-0">
                <CheckCircleFilled />
              </div>
            </div>
            <Text type="secondary" className="text-xs text-slate-500 dark:text-slate-400 block mt-2">66 ca đang xử lý & chờ kết quả</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="rounded-xl border-l-4 border-l-indigo-500 bg-white dark:bg-slate-800 hover-lift">
            <div className="flex justify-between items-start">
              <div>
                <Text type="secondary" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">DOANH THU TẠM TÍNH</Text>
                <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{formatCurrency(158800000)}</h2>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-slate-900 text-indigo-500 flex items-center justify-center text-lg shrink-0">
                <DollarOutlined />
              </div>
            </div>
            <Text type="secondary" className="text-xs text-slate-500 dark:text-slate-400 block mt-2">BHYT: 62% • VietQR: 38%</Text>
          </Card>
        </Col>
      </Row>

      {/* Main Charts & AI Clinical Knowledge Side Panel */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <BarChartOutlined className="text-sky-600" />
                <span className="font-semibold text-slate-800 dark:text-slate-100 text-base">
                  Thống kê Lượt khám Lâm sàng theo Chuyên khoa (Có Chú thích)
                </span>
              </div>
            }
            bordered={false}
            className="rounded-xl bg-white dark:bg-slate-800 hover-lift"
          >
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} stroke={isDarkMode ? '#94a3b8' : '#64748b'} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} stroke={isDarkMode ? '#94a3b8' : '#64748b'} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value} lượt`, 'Số lượt khám']}
                    contentStyle={{
                      borderRadius: 8,
                      background: isDarkMode ? '#0f172a' : '#ffffff',
                      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                      fontSize: 12,
                    }}
                  />
                  <Legend verticalAlign="top" align="right" height={36} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="lutKham" fill="#0284c7" name="Số lượt khám lâm sàng (Ca)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <PieChartOutlined className="text-emerald-600" />
                <span className="font-semibold text-slate-800 dark:text-slate-100 text-base">
                  Phân bổ Kênh Đăng ký Tiếp nhận (Donut Chart)
                </span>
              </div>
            }
            bordered={false}
            className="rounded-xl bg-white dark:bg-slate-800 hover-lift"
          >
            <div className="w-full h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={receptionSourceData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {receptionSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`${val}% tiếp nhận`, 'Tỷ lệ']}
                    contentStyle={{
                      borderRadius: 8,
                      background: isDarkMode ? '#0f172a' : '#ffffff',
                      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                      fontSize: 12,
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
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
        className="rounded-2xl shadow-md bg-white dark:bg-slate-800 hover-lift"
      >
        <Table dataSource={recentQueue} columns={columns} rowKey="stt" pagination={false} />
      </Card>
    </div>
  );
};
