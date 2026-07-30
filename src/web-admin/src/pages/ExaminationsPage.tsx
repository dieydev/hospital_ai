import React from 'react';
import { Card, Form, Input, Button, Row, Col, Typography, Divider, Alert } from 'antd';
import { RobotOutlined, SaveOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const ExaminationsPage: React.FC = () => {
  return (
    <div>
      <Title level={3}>Phòng khám Ngoại trú - Ghi nhận SOAP & Khám Bệnh</Title>

      <Alert
        message="Trợ lý AI hỗ trợ"
        description="Nhập triệu chứng chủ quan (Subjective) để AI hỗ trợ gợi ý chẩn đoán ICD-10 và kiểm tra tương tác thuốc."
        type="info"
        showIcon
        icon={<RobotOutlined />}
        style={{ marginBottom: 20 }}
      />

      <Form layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Card title="S (Subjective) - Triệu chứng chủ quan" size="small">
              <Form.Item label="Lý do khám & Triệu chứng người bệnh khai">
                <TextArea rows={4} placeholder="Ví dụ: Bệnh nhân đau họng 3 ngày, sốt nhẹ 38 độ C, ho khan..." />
              </Form.Item>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="O (Objective) - Khám khách quan & Sinh hiệu" size="small">
              <Row gutter={8}>
                <Col span={12}><Form.Item label="Mạch (lần/phút)"><Input placeholder="78" /></Form.Item></Col>
                <Col span={12}><Form.Item label="Nhiệt độ (°C)"><Input placeholder="37.5" /></Form.Item></Col>
                <Col span={12}><Form.Item label="Huyết áp (mmHg)"><Input placeholder="120/80" /></Form.Item></Col>
                <Col span={12}><Form.Item label="Cân nặng (kg)"><Input placeholder="65" /></Form.Item></Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0' }} />

        <Row gutter={16}>
          <Col span={12}>
            <Card title="A (Assessment) - Đánh giá & Mã ICD-10" size="small">
              <Form.Item label="Mã ICD-10 & Chẩn đoán bệnh chính">
                <Input placeholder="J02.9 - Viêm họng cấp tính, không đặc hiệu" />
              </Form.Item>
              <Text type="secondary">AI Gợi ý: J02 (Viêm họng cấp), J03 (Viêm Amydal cấp)</Text>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="P (Plan) - Kế hoạch điều trị & Đơn thuốc" size="small">
              <Form.Item label="Hướng xử trí & Kê đơn thuốc">
                <TextArea rows={3} placeholder="1. Paracetamol 500mg (Sáng 1v, Tối 1v)\n2. Augmentin 1g (Sáng 1v, Tối 1v sau ăn)" />
              </Form.Item>
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <Button type="primary" size="large" icon={<SaveOutlined />}>Hoàn tất Khám & Lưu EMR</Button>
        </div>
      </Form>
    </div>
  );
};
