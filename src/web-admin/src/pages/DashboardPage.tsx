import React from 'react';
import { Row, Col, Card, Statistic, Typography } from 'antd';
import { UserOutlined, MedicineBoxOutlined, RobotOutlined, DollarOutlined } from '@ant-design/icons';

const { Title } = Typography;

export const DashboardPage: React.FC = () => {
  return (
    <div>
      <Title level={3}>Bảng điều khiển Tổng quan Bệnh viện</Title>
      <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
        <Col span={6}>
          <Card bordered={false} style={{ background: '#e6f7ff' }}>
            <Statistic title="Bệnh nhân tiếp nhận hôm nay" value={128} prefix={<UserOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: '#f6ffed' }}>
            <Statistic title="Ca khám đã hoàn thành" value={94} prefix={<MedicineBoxOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: '#fff7e6' }}>
            <Statistic title="Lượt AI hỗ trợ RAG & ICD" value={342} prefix={<RobotOutlined />} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: '#fff0f6' }}>
            <Statistic title="Doanh thu viện phí (VNPay)" value={45200000} prefix={<DollarOutlined />} valueStyle={{ color: '#eb2f96' }} suffix="VNĐ" />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
