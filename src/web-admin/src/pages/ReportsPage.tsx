import React from 'react';
import { Card, Row, Col, Typography, Statistic, DatePicker, Button, Space } from 'antd';
import { DownloadOutlined, UserOutlined, DollarOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '../utils/formatters';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export const ReportsPage: React.FC = () => {
  const patientData = [
    { month: 'Tháng 3', luotKham: 1250, doanhThu: 320000000 },
    { month: 'Tháng 4', luotKham: 1420, doanhThu: 380000000 },
    { month: 'Tháng 5', luotKham: 1680, doanhThu: 450000000 },
    { month: 'Tháng 6', luotKham: 1550, doanhThu: 410000000 },
    { month: 'Tháng 7', luotKham: 1890, doanhThu: 520000000 },
    { month: 'Tháng 8', luotKham: 1980, doanhThu: 560000000 },
  ];

  const diseaseCategoryData = [
    { name: 'Viêm đường hô hấp trên', value: 40, color: '#1677ff' },
    { name: 'Bệnh Tiêu hóa & Dạ dày', value: 25, color: '#52c41a' },
    { name: 'Bệnh Tăng huyết áp & Tim mạch', value: 20, color: '#fa8c16' },
    { name: 'Bệnh Cơ Xương Khớp', value: 15, color: '#722ed1' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Thống kê & Báo cáo Tổng quan Bệnh viện</Title>
          <Text type="secondary">Báo cáo lượt khám bệnh, doanh thu viện phí và cơ cấu mô hình bệnh tật</Text>
        </div>
        <Space>
          <RangePicker />
          <Button type="primary" icon={<DownloadOutlined />} size="large">
            Xuất Báo cáo Excel
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={8}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="Tổng Số lượt Khám (Tháng 8/2026)" value={1980} valueStyle={{ color: '#1677ff', fontWeight: 700 }} prefix={<UserOutlined />} />
          </Card>
        </Col>

        <Col span={8}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="Tổng Doanh thu Viện phí" value={560000000} formatter={(val) => formatCurrency(Number(val))} valueStyle={{ color: '#52c41a', fontWeight: 700 }} prefix={<DollarOutlined />} />
          </Card>
        </Col>

        <Col span={8}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="Tỷ lệ BHYT Chi trả" value={68.4} precision={1} suffix="%" valueStyle={{ color: '#722ed1', fontWeight: 700 }} prefix={<MedicineBoxOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <Card title="Biểu đồ Tăng trưởng Lượt khám & Doanh thu" style={{ borderRadius: 12 }}>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={patientData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="luotKham" fill="#1677ff" name="Số lượt khám" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col span={10}>
          <Card title="Cơ cấu Mô hình Bệnh tật (ICD-10)" style={{ borderRadius: 12 }}>
            <div style={{ width: '100%', height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={diseaseCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {diseaseCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
