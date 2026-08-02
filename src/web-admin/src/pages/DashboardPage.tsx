import React from 'react';
import { Row, Col, Card, Statistic, Typography, Table, Tag, Button, Space, Progress, Avatar } from 'antd';
import {
  UserOutlined,
  ScheduleOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  RobotOutlined,
  PlusOutlined,
  RightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
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
    { name: 'Khoa Răng Hàm Mặt', lutKham: 52, revenue: 18900000 },
  ];

  const recentQueue = [
    { stt: 101, maBN: 'BN20260001', hoTen: 'Nguyễn Văn An', phong: 'Phòng 102 - Khoa Nội', bacSi: 'BS. CKII. Nguyễn Thanh Duy', trangThai: 'Đang khám', time: '08:30' },
    { stt: 102, maBN: 'BN20260002', hoTen: 'Trần Thị Bình', phong: 'Phòng 102 - Khoa Nội', bacSi: 'BS. CKII. Nguyễn Thanh Duy', trangThai: 'Chờ cận lâm sàng', time: '08:45' },
    { stt: 103, maBN: 'BN20260003', hoTen: 'Lê Hoàng Nam', phong: 'Phòng 105 - Khoa Nhi', bacSi: 'BS. CKI. Phạm Minh Đức', trangThai: 'Đang chờ', time: '09:00' },
    { stt: 104, maBN: 'BN20260004', hoTen: 'Phạm Thu Cúc', phong: 'Phòng 102 - Khoa Nội', bacSi: 'BS. CKII. Nguyễn Thanh Duy', trangThai: 'Đang chờ', time: '09:15' },
    { stt: 105, maBN: 'BN20260005', hoTen: 'Vũ Đức Đạt', phong: 'Phòng 201 - Khoa Mắt', bacSi: 'BS. Trần Ngọc Mai', trangThai: 'Hoàn thành', time: '08:15' },
  ];

  const columns = [
    { title: 'STT', dataIndex: 'stt', key: 'stt', render: (val: number) => <Text strong style={{ color: '#1677ff', fontSize: 16 }}>#{val}</Text> },
    { title: 'Mã BN', dataIndex: 'maBN', key: 'maBN' },
    { title: 'Bệnh nhân', dataIndex: 'hoTen', key: 'hoTen', render: (text: string) => <Text strong>{text}</Text> },
    { title: 'Phòng khám', dataIndex: 'phong', key: 'phong' },
    { title: 'Bác sĩ phụ trách', dataIndex: 'bacSi', key: 'bacSi' },
    { title: 'Thời gian', dataIndex: 'time', key: 'time' },
    {
      title: 'Trạng thái',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #002140 0%, #1677ff 100%)',
          borderRadius: 16,
          padding: '24px 32px',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}
      >
        <div>
          <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 700 }}>
            Hệ thống Quản lý Khám chữa bệnh & Hồ sơ bệnh án
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }}>
            Chào mừng trở lại, <strong style={{ color: '#ffd666' }}>BS. CKII. Nguyễn Thanh Duy</strong>! Hôm nay có <strong>42 bệnh nhân</strong> đăng ký khám tại Khoa Nội.
          </Text>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} size="large" style={{ background: '#52c41a', borderColor: '#52c41a' }} onClick={() => navigate('/reception')}>
            Tiếp nhận Mới
          </Button>
          <Button icon={<MedicineBoxOutlined />} size="large" onClick={() => navigate('/examinations')}>
            Vào Màn hình Khám (SOAP)
          </Button>
        </Space>
      </div>

      {/* Metric Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title="Tổng Bệnh nhân Tiếp nhận Hôm nay"
              value={158}
              precision={0}
              valueStyle={{ color: '#1677ff', fontWeight: 700 }}
              prefix={<UserOutlined />}
              suffix={<Text type="success" style={{ fontSize: 13 }}><ArrowUpOutlined /> +12%</Text>}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>Đã đăng ký qua App & Tại quầy</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title="Lịch hẹn khám Trực tuyến"
              value={45}
              valueStyle={{ color: '#fa8c16', fontWeight: 700 }}
              prefix={<ScheduleOutlined />}
              suffix={<Text type="secondary" style={{ fontSize: 13 }}>/ 50 slots</Text>}
            />
            <Progress percent={90} size="small" status="active" strokeColor="#fa8c16" />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title="Lượt Khám hoàn thành"
              value={92}
              valueStyle={{ color: '#52c41a', fontWeight: 700 }}
              prefix={<MedicineBoxOutlined />}
              suffix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>66 lượt đang khám & chờ CLS</Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title="Doanh thu Viện phí Tạm tính"
              value={158800000}
              formatter={(val) => formatCurrency(Number(val))}
              valueStyle={{ color: '#722ed1', fontWeight: 700, fontSize: 20 }}
              prefix={<DollarOutlined />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>BHYT chi trả: 62% • VietQR: 38%</Text>
          </Card>
        </Col>
      </Row>

      {/* Main Charts & Side Panels */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Thống kê Lượt khám theo Chuyên khoa" bordered={false} style={{ borderRadius: 12 }}>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`${value} lượt`, 'Số lượt khám']} />
                  <Bar dataKey="lutKham" fill="#1677ff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Trợ lý AI Y tế (Google Gemini)" extra={<Button type="link" onClick={() => navigate('/ai-assistant')}>Mở AI <RightOutlined /></Button>} bordered={false} style={{ borderRadius: 12, background: 'linear-gradient(180deg, #f6ffed 0%, #ffffff 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Avatar size={48} icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a' }} />
              <div>
                <Text strong style={{ fontSize: 15, display: 'block' }}>Gemini Pro Health Model</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>Sẵn sàng hỗ trợ tra cứu & tóm tắt EMR</Text>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button block style={{ textAlign: 'left', height: 40, borderRadius: 8 }} onClick={() => navigate('/ai-assistant')}>
                💡 <strong>Tóm tắt bệnh án:</strong> BN20260001 (Đau họng, sốt 38°C)
              </Button>
              <Button block style={{ textAlign: 'left', height: 40, borderRadius: 8 }} onClick={() => navigate('/ai-assistant')}>
                🔍 <strong>Gợi ý mã ICD-10:</strong> Triệu chứng Ho khan, tức ngực
              </Button>
              <Button block style={{ textAlign: 'left', height: 40, borderRadius: 8 }} onClick={() => navigate('/ai-assistant')}>
                📚 <strong>Tra cứu Dược lý:</strong> Tương tác Paracetamol & Warfarin
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Live Queue Table */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClockCircleOutlined style={{ color: '#1677ff' }} />
            <span>Hàng chờ Khám Bệnh Trực tiếp</span>
          </div>
        }
        extra={<Button type="primary" ghost onClick={() => navigate('/reception')}>Quản lý Hàng chờ</Button>}
        bordered={false}
        style={{ borderRadius: 12 }}
      >
        <Table dataSource={recentQueue} columns={columns} rowKey="stt" pagination={false} size="middle" />
      </Card>
    </div>
  );
};
