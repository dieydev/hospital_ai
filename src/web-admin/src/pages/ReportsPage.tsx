import React from 'react';
import { Card, Row, Col, Typography, Statistic, DatePicker, Button, Space } from 'antd';
import { DownloadOutlined, UserOutlined, DollarOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '../utils/formatters';
import { useThemeStore } from '../store/useThemeStore';
import { showToast } from '../utils/sweetAlert';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export const ReportsPage: React.FC = () => {
  const { isDarkMode } = useThemeStore();

  const patientData = [
    { month: 'Tháng 3', luotKham: 1250, doanhThu: 320000000 },
    { month: 'Tháng 4', luotKham: 1420, doanhThu: 380000000 },
    { month: 'Tháng 5', luotKham: 1680, doanhThu: 450000000 },
    { month: 'Tháng 6', luotKham: 1550, doanhThu: 410000000 },
    { month: 'Tháng 7', luotKham: 1890, doanhThu: 520000000 },
    { month: 'Tháng 8', luotKham: 1980, doanhThu: 560000000 },
  ];

  const diseaseCategoryData = [
    { name: 'Viêm đường hô hấp trên', value: 40, color: '#0284c7' },
    { name: 'Bệnh Tiêu hóa & Dạ dày', value: 25, color: '#10b981' },
    { name: 'Bệnh Tăng huyết áp & Tim mạch', value: 20, color: '#f59e0b' },
    { name: 'Bệnh Cơ Xương Khớp', value: 15, color: '#8b5cf6' },
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
            Thống kê & Báo cáo Tổng quan Bệnh viện
          </Title>
          <Text style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
            Báo cáo lượt khám bệnh, doanh thu viện phí và cơ cấu mô hình bệnh tật
          </Text>
        </div>
        <Space>
          <RangePicker />
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            size="large"
            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            onClick={() => showToast('Đang kết xuất tệp Báo cáo Excel...', 'info')}
          >
            Xuất Báo cáo Excel
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={8}>
          <Card style={{ borderRadius: 12, border: isDarkMode ? '1px solid #334155' : undefined }}>
            <Statistic
              title={<span style={{ color: isDarkMode ? '#94a3b8' : undefined }}>Tổng Số lượt Khám (Tháng 8/2026)</span>}
              value={1980}
              valueStyle={{ color: isDarkMode ? '#38bdf8' : '#0284c7', fontWeight: 800 }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card style={{ borderRadius: 12, border: isDarkMode ? '1px solid #334155' : undefined }}>
            <Statistic
              title={<span style={{ color: isDarkMode ? '#94a3b8' : undefined }}>Tổng Doanh thu Viện phí</span>}
              value={560000000}
              formatter={(val) => formatCurrency(Number(val))}
              valueStyle={{ color: '#10b981', fontWeight: 800 }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card style={{ borderRadius: 12, border: isDarkMode ? '1px solid #334155' : undefined }}>
            <Statistic
              title={<span style={{ color: isDarkMode ? '#94a3b8' : undefined }}>Tỷ lệ BHYT Chi trả</span>}
              value={68.4}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#8b5cf6', fontWeight: 800 }}
              prefix={<MedicineBoxOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <Card
            title={<span style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Biểu đồ Tăng trưởng Lượt khám & Doanh thu</span>}
            style={{ borderRadius: 12, border: isDarkMode ? '1px solid #334155' : undefined }}
          >
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={patientData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="month" stroke={isDarkMode ? '#94a3b8' : '#64748b'} />
                  <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      background: isDarkMode ? '#0f172a' : '#ffffff',
                      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}
                  />
                  <Bar dataKey="luotKham" fill={isDarkMode ? '#38bdf8' : '#0284c7'} name="Số lượt khám" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col span={10}>
          <Card
            title={<span style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Cơ cấu Mô hình Bệnh tật (ICD-10)</span>}
            style={{ borderRadius: 12, border: isDarkMode ? '1px solid #334155' : undefined }}
          >
            <div style={{ width: '100%', height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={diseaseCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {diseaseCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      background: isDarkMode ? '#0f172a' : '#ffffff',
                      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
