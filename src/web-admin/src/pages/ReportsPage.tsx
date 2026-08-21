import React, { useState } from 'react';
import { Card, Row, Col, Typography, Statistic, DatePicker, Button, Space } from 'antd';
import { DownloadOutlined, UserOutlined, DollarOutlined, MedicineBoxOutlined, AreaChartOutlined, PieChartOutlined, BarChartOutlined, FieldTimeOutlined } from '@ant-design/icons';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
} from 'recharts';
import { formatCurrency } from '../utils/formatters';
import { useThemeStore } from '../store/useThemeStore';
import { showSuccessAlert } from '../utils/sweetAlert';

const { Text } = Typography;
const { RangePicker } = DatePicker;

export const ReportsPage: React.FC = () => {
  const { isDarkMode } = useThemeStore();

  // Chart 1: Monthly Growth (Combined Bar & Line with Dual Y Axis)
  const [patientData] = useState([
    { month: 'Tháng 3', luotKham: 1250, doanhThuTrieu: 320 },
    { month: 'Tháng 4', luotKham: 1420, doanhThuTrieu: 380 },
    { month: 'Tháng 5', luotKham: 1680, doanhThuTrieu: 450 },
    { month: 'Tháng 6', luotKham: 1550, doanhThuTrieu: 410 },
    { month: 'Tháng 7', luotKham: 1890, doanhThuTrieu: 520 },
    { month: 'Tháng 8', luotKham: 1980, doanhThuTrieu: 560 },
  ]);

  // Chart 2: Disease ICD-10 Category Distribution (Donut Pie Chart)
  const diseaseCategoryData = [
    { name: 'J02-J06 (Viêm đường hô hấp trên)', value: 40, color: '#0284c7' },
    { name: 'K29-K30 (Bệnh Tiêu hóa & Dạ dày)', value: 25, color: '#10b981' },
    { name: 'I10-I15 (Tăng huyết áp & Tim mạch)', value: 20, color: '#f59e0b' },
    { name: 'M17-M25 (Bệnh Cơ Xương Khớp)', value: 15, color: '#8b5cf6' },
  ];

  // Chart 3: Peak Hours Load (Area Chart)
  const hourlyLoadData = [
    { hour: '07:00 - 08:00', sang: 120, chieu: 0 },
    { hour: '08:00 - 09:00', sang: 240, chieu: 0 },
    { hour: '09:00 - 10:00', sang: 310, chieu: 0 },
    { hour: '10:00 - 11:00', sang: 210, chieu: 0 },
    { hour: '13:00 - 14:00', sang: 0, chieu: 180 },
    { hour: '14:00 - 15:00', sang: 0, chieu: 260 },
    { hour: '15:00 - 16:00', sang: 0, chieu: 190 },
    { hour: '16:00 - 17:00', sang: 0, chieu: 95 },
  ];

  // Chart 4: Department Performance (Horizontal Bar Chart)
  const departmentData = [
    { dept: 'Khoa Nội Tổng Hợp', luotKham: 640, doanhThuTrieu: 185 },
    { dept: 'Khoa Ngoại', luotKham: 420, doanhThuTrieu: 210 },
    { dept: 'Khoa Nhi', luotKham: 380, doanhThuTrieu: 95 },
    { dept: 'Khoa Mắt', luotKham: 290, doanhThuTrieu: 82 },
    { dept: 'Khoa Răng Hàm Mặt', luotKham: 250, doanhThuTrieu: 68 },
  ];

  const handleExportExcel = () => {
    const csvRows = [
      ['Thang', 'SoLuotKham', 'DoanhThuTrieuVND'].join(','),
      ...patientData.map((d) => [d.month, d.luotKham, d.doanhThuTrieu].join(',')),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Bao_Cao_Thong_Ke_HospitalAI_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccessAlert('Kết xuất Báo cáo thành công!', 'Tệp Báo cáo Excel (CSV) đã được tải về máy tính.');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Modern Medical Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 p-6 md:p-8 text-white shadow-md border border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="status-dot-active" />
            <Text className="text-xs text-sky-300 font-semibold uppercase tracking-wider">Phân Tích Dữ Liệu Y Tế • Business Intelligence (BI)</Text>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight margin-0">
            Thống kê & Báo cáo Bệnh viện (BI Analytics Dashboard)
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1">
            Báo cáo tổng hợp lượt khám, tăng trưởng doanh thu, mô hình bệnh tật ICD-10 và phân bổ ca trực theo khung giờ
          </p>
        </div>
        <Space wrap>
          <RangePicker className="rounded-lg" />
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            size="large"
            className="bg-sky-600 hover:bg-sky-700 border-none rounded-lg font-semibold flex items-center gap-1.5"
            onClick={handleExportExcel}
          >
            Xuất File Excel (CSV)
          </Button>
        </Space>
      </div>

      {/* Top Metric Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 hover-lift">
            <Statistic
              title={<span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">TỔNG LƯỢT KHÁM (THÁNG 8)</span>}
              value={1980}
              valueStyle={{ color: isDarkMode ? '#38bdf8' : '#0284c7', fontWeight: 800 }}
              prefix={<UserOutlined />}
              suffix="lượt"
            />
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 hover-lift">
            <Statistic
              title={<span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">DOANH THU LÂM SÀNG</span>}
              value={560000000}
              formatter={(val) => formatCurrency(Number(val))}
              valueStyle={{ color: '#10b981', fontWeight: 800 }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 hover-lift">
            <Statistic
              title={<span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">TỶ LỆ KHÁM BHYT</span>}
              value={68.4}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#8b5cf6', fontWeight: 800 }}
              prefix={<MedicineBoxOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 hover-lift">
            <Statistic
              title={<span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">ĐẶT KHÁM MOBILE APP</span>}
              value={42.5}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#f59e0b', fontWeight: 800 }}
              prefix={<AreaChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Row 1: Dual Charts (Monthly Growth Composed & ICD-10 Donut) */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <BarChartOutlined className="text-sky-600" />
                <span className="font-semibold text-slate-800 dark:text-slate-100 text-base">
                  1. Biểu đồ Tăng trưởng Lượt khám & Doanh thu Theo Tháng (Có Chú thích)
                </span>
              </div>
            }
            bordered={false}
            className="rounded-xl bg-white dark:bg-slate-800 hover-lift"
          >
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={patientData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="month" stroke={isDarkMode ? '#94a3b8' : '#64748b'} tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" orientation="left" stroke={isDarkMode ? '#38bdf8' : '#0284c7'} tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" stroke={isDarkMode ? '#34d399' : '#10b981'} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(val: number, name: string) => [
                      name.includes('Doanh thu') ? `${val} Triệu VNĐ` : `${val} Lượt`,
                      name,
                    ]}
                    contentStyle={{
                      borderRadius: 8,
                      background: isDarkMode ? '#0f172a' : '#ffffff',
                      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                      fontSize: 12,
                    }}
                  />
                  <Legend verticalAlign="top" align="right" height={36} wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="left" dataKey="luotKham" fill="#0284c7" name="Số lượt khám (Lượt)" radius={[6, 6, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="doanhThuTrieu" fill="#10b981" stroke="#10b981" strokeWidth={3} name="Doanh thu (Triệu VNĐ)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <PieChartOutlined className="text-emerald-600" />
                <span className="font-semibold text-slate-800 dark:text-slate-100 text-base">
                  2. Cơ cấu Mô hình Bệnh tật ICD-10 (Donut Chart)
                </span>
              </div>
            }
            bordered={false}
            className="rounded-xl bg-white dark:bg-slate-800 hover-lift"
          >
            <div className="w-full h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diseaseCategoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {diseaseCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`${val}% tổng số ca`, 'Tỷ lệ']}
                    contentStyle={{
                      borderRadius: 8,
                      background: isDarkMode ? '#0f172a' : '#ffffff',
                      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                      fontSize: 12,
                    }}
                  />
                  <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 2: Dual Charts (Peak Hours Area Chart & Department Horizontal Bar) */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <FieldTimeOutlined className="text-amber-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-100 text-base">
                  3. Phân bổ Lượt khám Theo Khung Giờ (Peak Hours Area Chart)
                </span>
              </div>
            }
            bordered={false}
            className="rounded-xl bg-white dark:bg-slate-800 hover-lift"
          >
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyLoadData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSang" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorChieu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="hour" stroke={isDarkMode ? '#94a3b8' : '#64748b'} tick={{ fontSize: 11 }} />
                  <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      background: isDarkMode ? '#0f172a' : '#ffffff',
                      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                      fontSize: 12,
                    }}
                  />
                  <Legend verticalAlign="top" align="right" height={36} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="sang" stroke="#0284c7" fillOpacity={1} fill="url(#colorSang)" name="Ca Sáng (07:30 - 11:30)" />
                  <Area type="monotone" dataKey="chieu" stroke="#f59e0b" fillOpacity={1} fill="url(#colorChieu)" name="Ca Chiều (13:00 - 17:00)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <BarChartOutlined className="text-purple-600" />
                <span className="font-semibold text-slate-800 dark:text-slate-100 text-base">
                  4. Top 5 Khoa Khám Có Số Lượt Cao Nhất (Department Bar Chart)
                </span>
              </div>
            }
            bordered={false}
            className="rounded-xl bg-white dark:bg-slate-800 hover-lift"
          >
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={departmentData} margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis type="number" stroke={isDarkMode ? '#94a3b8' : '#64748b'} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="dept" stroke={isDarkMode ? '#94a3b8' : '#64748b'} tick={{ fontSize: 11 }} width={130} />
                  <Tooltip
                    formatter={(val: number, name: string) => [
                      name.includes('Doanh thu') ? `${val} Triệu VNĐ` : `${val} Lượt`,
                      name,
                    ]}
                    contentStyle={{
                      borderRadius: 8,
                      background: isDarkMode ? '#0f172a' : '#ffffff',
                      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                      fontSize: 12,
                    }}
                  />
                  <Legend verticalAlign="top" align="right" height={36} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="luotKham" name="Số lượt khám (Lượt)" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                  <Bar dataKey="doanhThuTrieu" name="Doanh thu (Triệu VNĐ)" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
