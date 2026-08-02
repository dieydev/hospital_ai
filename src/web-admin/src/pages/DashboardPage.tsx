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
  ThunderboltFilled,
} from '@ant-design/icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

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
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 18, color: '#0284c7' }}>
          #{val}
        </span>
      ),
    },
    {
      title: 'Mã Bệnh nhân',
      dataIndex: 'maBN',
      key: 'maBN',
      render: (code: string) => <Tag color="blue" style={{ fontSize: 12 }}>{code}</Tag>,
    },
    { title: 'Bệnh nhân', dataIndex: 'hoTen', key: 'hoTen', render: (text: string) => <Text strong style={{ color: '#0f172a' }}>{text}</Text> },
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
        return <Tag color={color}>{st}</Tag>;
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* High-End Hero Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #0369a1 60%, #0284c7 100%)',
          borderRadius: 20,
          padding: '28px 36px',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 12px 30px rgba(3, 105, 161, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 680 }}>
          <Space align="center" style={{ marginBottom: 8 }}>
            <Tag color="#10b981" style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20 }}>
              <span className="status-dot-active" style={{ marginRight: 6 }} /> Ca trực Sáng
            </Tag>
            <Text style={{ color: '#93c5fd', fontSize: 13 }}>02 Tháng 08, 2026</Text>
          </Space>
          <Title level={2} style={{ color: '#fff', margin: '4px 0 8px', fontWeight: 800, fontSize: 26 }}>
            Bảng điều khiển Quản lý Bệnh viện & Hồ sơ EMR
          </Title>
          <Text style={{ color: '#e0f2fe', fontSize: 15, lineHeight: 1.5 }}>
            Chào mừng trở lại, <strong style={{ color: '#fef08a' }}>BS. CKII. Nguyễn Thanh Duy</strong>! Hôm nay có <strong>42 ca khám bệnh</strong> phân công tại Khoa Nội.
          </Text>
        </div>

        <Space size="middle" style={{ position: 'relative', zIndex: 2 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderColor: '#10b981',
              height: 48,
              padding: '0 24px',
              borderRadius: 12,
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
            }}
            onClick={() => navigate('/reception')}
          >
            Tiếp nhận Mới
          </Button>
          <Button
            size="large"
            icon={<MedicineBoxOutlined />}
            style={{
              height: 48,
              padding: '0 24px',
              borderRadius: 12,
              fontWeight: 700,
              background: 'rgba(255, 255, 255, 0.15)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: '#fff',
              backdropFilter: 'blur(10px)',
            }}
            onClick={() => navigate('/examinations')}
          >
            Màn hình Khám (SOAP)
          </Button>
        </Space>
      </div>

      {/* Metric Cards Grid */}
      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 16, borderLeft: '4px solid #0284c7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>TỔNG TIẾP NHẬN HÔM NAY</Text>
                <Title level={2} style={{ margin: '8px 0 0', fontWeight: 800, color: '#0f172a' }}>158</Title>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                <UserOutlined />
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Tag color="green" icon={<ArrowUpOutlined />}>+12.5%</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>So với hôm qua</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 16, borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>ĐẶT LỊCH TRỰC TUYẾN APP</Text>
                <Title level={2} style={{ margin: '8px 0 0', fontWeight: 800, color: '#0f172a' }}>45 <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>/ 50 slots</span></Title>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                <ScheduleOutlined />
              </div>
            </div>
            <Progress percent={90} showInfo={false} strokeColor="#f59e0b" style={{ marginTop: 16 }} />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 16, borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>CA KHÁM HOÀN THÀNH</Text>
                <Title level={2} style={{ margin: '8px 0 0', fontWeight: 800, color: '#0f172a' }}>92</Title>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                <CheckCircleFilled />
              </div>
            </div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>66 ca đang khám & chờ kết quả CLS</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 16, borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>DOANH THU VIỆN PHÍ TẠM TÍNH</Text>
                <Title level={3} style={{ margin: '8px 0 0', fontWeight: 800, color: '#8b5cf6' }}>{formatCurrency(158800000)}</Title>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                <DollarOutlined />
              </div>
            </div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>BHYT: 62% • VietQR: 38%</Text>
          </Card>
        </Col>
      </Row>

      {/* Main Charts & AI Helper Side Panel */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Card title="Thống kê Lượt khám theo Chuyên khoa" bordered={false} style={{ borderRadius: 16 }}>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => [`${value} lượt`, 'Số lượt khám']} contentStyle={{ borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="lutKham" fill="url(#colorUv)" radius={[8, 8, 0, 0]}>
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity={1} />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.8} />
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
                <RobotOutlined style={{ color: '#10b981' }} />
                <span>Trợ lý AI Y tế (Google Gemini)</span>
              </Space>
            }
            extra={<Button type="link" onClick={() => navigate('/ai-assistant')}>Mở AI <RightOutlined /></Button>}
            bordered={false}
            style={{ borderRadius: 16, background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)', borderColor: '#bbf7d0' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <Avatar size={48} icon={<ThunderboltFilled />} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }} />
              <div>
                <Text strong style={{ fontSize: 16, display: 'block', color: '#0f172a' }}>Gemini Pro Health Engine</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>Tra cứu tri thức & Tóm tắt EMR tự động</Text>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button block style={{ textAlign: 'left', height: 'auto', padding: 12, borderRadius: 10 }} onClick={() => navigate('/ai-assistant')}>
                💡 <strong>Tóm tắt bệnh án:</strong> BN20260001 (Đau họng, sốt 38°C)
              </Button>
              <Button block style={{ textAlign: 'left', height: 'auto', padding: 12, borderRadius: 10 }} onClick={() => navigate('/ai-assistant')}>
                🔍 <strong>Gợi ý mã ICD-10:</strong> Ho khan, tức ngực về đêm
              </Button>
              <Button block style={{ textAlign: 'left', height: 'auto', padding: 12, borderRadius: 10 }} onClick={() => navigate('/ai-assistant')}>
                📚 <strong>Tra cứu Dược lý:</strong> Tương tác Paracetamol & Warfarin
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Live Queue Table */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClockCircleOutlined style={{ color: '#0284c7', fontSize: 18 }} />
            <span>Hàng chờ Gọi Khám Bệnh Trực tiếp</span>
          </div>
        }
        extra={<Button type="primary" ghost onClick={() => navigate('/reception')}>Quản lý Tiếp nhận</Button>}
        bordered={false}
        style={{ borderRadius: 16 }}
      >
        <Table dataSource={recentQueue} columns={columns} rowKey="stt" pagination={false} />
      </Card>
    </div>
  );
};
