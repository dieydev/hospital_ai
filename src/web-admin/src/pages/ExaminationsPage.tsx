import React, { useState } from 'react';
import { Card, Form, Input, Button, Row, Col, Typography, Space, Divider, Table, Tag, Alert, Badge, message } from 'antd';
import {
  SaveOutlined,
  RobotOutlined,
  PlusOutlined,
  DeleteOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { EPrescriptionItem, ServiceOrderItem } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const ExaminationsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ code: string; name: string; match: string }>>([]);

  const [prescription, setPrescription] = useState<EPrescriptionItem[]>([
    { id: '1', thuocId: 'TH01', tenThuoc: 'Paracetamol 500mg (Hasan)', donViTinh: 'Viên', soLuong: 20, lieuDung: 'Sáng 1v, Tối 1v sau ăn' },
    { id: '2', thuocId: 'TH02', tenThuoc: 'Augmentin 1g (Amoxicillin/Clavulanate)', donViTinh: 'Viên', soLuong: 14, lieuDung: 'Sáng 1v, Tối 1v sau ăn (7 ngày)' },
  ]);

  const [services] = useState<ServiceOrderItem[]>([
    { id: '1', dichVuId: 'DV01', tenDichVu: 'Công thức máu toàn phần (CBC)', loaiDichVu: 'Xét nghiệm', donGia: 85000, trangThai: 'Đã có kết quả', ketQua: 'WBC 11.2 (Tăng nhẹ), RBC 4.5' },
    { id: '2', dichVuId: 'DV02', tenDichVu: 'X-Quang Phổi thẳng', loaiDichVu: 'Chẩn đoán hình ảnh', donGia: 150000, trangThai: 'Đã có kết quả', ketQua: 'Phế trường 2 bên sáng, chưa thấy tổn thương thâm nhiễm' },
  ]);

  const handleConsultAiICD10 = () => {
    const subjective = form.getFieldValue('subjective');
    if (!subjective) {
      message.warning('Vui lòng nhập triệu chứng (Subjective) trước khi tham khảo AI!');
      return;
    }

    setAiLoading(true);
    setTimeout(() => {
      setAiSuggestions([
        { code: 'J02.9', name: 'Viêm họng cấp tính, không đặc hiệu', match: '98% Phù hợp' },
        { code: 'J03.9', name: 'Viêm amydal cấp tính, không đặc hiệu', match: '85% Phù hợp' },
        { code: 'J06.9', name: 'Nhiễm trùng đường hô hấp trên cấp tính', match: '72% Phù hợp' },
      ]);
      setAiLoading(false);
      message.success('Trợ lý AI đã phân tích triệu chứng và đề xuất 3 mã ICD-10 phù hợp!');
    }, 1000);
  };

  const handleSelectICD10 = (item: { code: string; name: string }) => {
    form.setFieldsValue({
      icd10Code: `${item.code} - ${item.name}`,
    });
  };

  const prescriptionColumns = [
    { title: 'Tên Thuốc & Hàm lượng', dataIndex: 'tenThuoc', key: 'tenThuoc', render: (t: string) => <Text strong>{t}</Text> },
    { title: 'ĐVT', dataIndex: 'donViTinh', key: 'donViTinh', width: 80 },
    { title: 'Số lượng', dataIndex: 'soLuong', key: 'soLuong', width: 90, render: (sl: number) => <Text strong style={{ color: '#1677ff' }}>{sl}</Text> },
    { title: 'Liều dùng & Hướng dẫn', dataIndex: 'lieuDung', key: 'lieuDung' },
    {
      title: 'Thao tác',
      key: 'action',
      width: 60,
      render: (_: unknown, record: EPrescriptionItem) => (
        <Button icon={<DeleteOutlined />} danger size="small" type="text" onClick={() => setPrescription(prescription.filter((p) => p.id !== record.id))} />
      ),
    },
  ];

  const serviceColumns = [
    { title: 'Tên Dịch vụ / Xét nghiệm', dataIndex: 'tenDichVu', key: 'tenDichVu', render: (t: string) => <Text strong>{t}</Text> },
    { title: 'Phân loại', dataIndex: 'loaiDichVu', key: 'loaiDichVu', render: (l: string) => <Tag color="blue">{l}</Tag> },
    { title: 'Kết quả cận lâm sàng', dataIndex: 'ketQua', key: 'ketQua', render: (kq: string) => kq ? <Text style={{ color: '#389e0d' }}>{kq}</Text> : <Text type="secondary">Chờ thực hiện...</Text> },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (st: string) => <Tag color={st === 'Đã có kết quả' ? 'success' : 'warning'}>{st}</Tag>,
    },
  ];

  const onFinishExamination = () => {
    message.success('Đã hoàn tất ca khám, lưu Hồ sơ bệnh án (EMR) và chuyển hóa đơn sang phân hệ Viện phí!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Patient Header Banner */}
      <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #e6f7ff 0%, #ffffff 100%)', borderColor: '#91caff' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space size="large">
              <Badge count="ĐANG KHÁM" style={{ backgroundColor: '#52c41a' }}>
                <Title level={4} style={{ margin: 0 }}>Nguyễn Văn An (36 tuổi - Nam)</Title>
              </Badge>
              <Text>Mã BN: <strong style={{ color: '#1677ff' }}>BN20260001</strong></Text>
              <Text>CCCD: <strong>038090001234</strong></Text>
              <Tag color="green">BHYT: DN40101234567</Tag>
            </Space>
          </Col>
          <Col>
            <Text type="secondary">Tiền sử: Tăng huyết áp • Dị ứng: Không</Text>
          </Col>
        </Row>
      </Card>

      <Form form={form} layout="vertical" onFinish={onFinishExamination} initialValues={{ subjective: 'Bệnh nhân đau họng 3 ngày, sốt nhẹ 38°C, ho khan nhiều về đêm, nuốt vướng.', icd10Code: 'J02.9 - Viêm họng cấp tính, không đặc hiệu' }}>
        {/* SOAP Section 1: Subjective & Objective */}
        <Row gutter={16}>
          <Col span={12}>
            <Card title="S (Subjective) - Triệu chứng chủ quan" size="small" style={{ borderRadius: 12, height: '100%' }}>
              <Form.Item name="subjective" label="Hỏi bệnh & Bệnh nhân khai báo">
                <TextArea rows={5} placeholder="Nhập chi tiết các triệu chứng cơ năng, thời gian khởi phát..." />
              </Form.Item>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="O (Objective) - Khám khách quan & Sinh hiệu" size="small" style={{ borderRadius: 12 }}>
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item label="Mạch (lần/phút)">
                    <Input defaultValue="78" suffix="bpm" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Nhiệt độ (°C)">
                    <Input defaultValue="38.0" suffix="°C" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Huyết áp (mmHg)">
                    <Input defaultValue="125/80" suffix="mmHg" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Nhip thở (lần/phút)">
                    <Input defaultValue="18" suffix="l/p" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Cân nặng (kg)">
                    <Input defaultValue="68" suffix="kg" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Chiều cao (cm)">
                    <Input defaultValue="172" suffix="cm" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0' }} />

        {/* SOAP Section 2: Assessment & AI ICD-10 Helper */}
        <Row gutter={16}>
          <Col span={14}>
            <Card
              title={
                <Space>
                  <span>A (Assessment) - Chẩn đoán & Mã bệnh ICD-10</span>
                </Space>
              }
              extra={
                <Button type="primary" ghost icon={<RobotOutlined />} onClick={handleConsultAiICD10} loading={aiLoading}>
                  AI Gợi ý ICD-10
                </Button>
              }
              size="small"
              style={{ borderRadius: 12 }}
            >
              <Form.Item name="icd10Code" label="Mã ICD-10 & Tên chẩn đoán chính" rules={[{ required: true }]}>
                <Input size="large" placeholder="Nhập hoặc chọn mã ICD-10..." />
              </Form.Item>

              {aiSuggestions.length > 0 && (
                <Alert
                  type="info"
                  showIcon
                  icon={<RobotOutlined />}
                  message="Gợi ý chẩn đoán từ Trợ lý AI (Google Gemini):"
                  description={
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {aiSuggestions.map((item) => (
                        <div key={item.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text>
                            <strong style={{ color: '#1677ff' }}>{item.code}</strong> - {item.name} <Tag color="green">{item.match}</Tag>
                          </Text>
                          <Button size="small" type="link" onClick={() => handleSelectICD10(item)}>
                            Áp dụng mã này
                          </Button>
                        </div>
                      ))}
                    </div>
                  }
                  style={{ marginBottom: 12 }}
                />
              )}
            </Card>
          </Col>

          <Col span={10}>
            <Card title="Chỉ định Cận lâm sàng (Xét nghiệm / X-Quang)" size="small" extra={<Button icon={<PlusOutlined />} type="dashed" size="small">Thêm chỉ định</Button>} style={{ borderRadius: 12 }}>
              <Table dataSource={services} columns={serviceColumns} rowKey="id" pagination={false} size="small" />
            </Card>
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0' }} />

        {/* SOAP Section 3: Plan & E-Prescription */}
        <Card
          title={
            <Space>
              <MedicineBoxOutlined style={{ color: '#1677ff' }} />
              <span>P (Plan) - Đơn thuốc Điện tử & Hướng xử trí điều trị</span>
            </Space>
          }
          extra={<Button icon={<PlusOutlined />} type="primary" size="small">Kê thêm Thuốc</Button>}
          style={{ borderRadius: 12 }}
        >
          <Table dataSource={prescription} columns={prescriptionColumns} rowKey="id" pagination={false} style={{ marginBottom: 16 }} />

          <Form.Item label="Lời khuyên của Bác sĩ & Hẹn tái khám">
            <TextArea rows={2} defaultValue="Uống nhiều nước ấm, nghỉ ngơi, súc họng bằng nước muối sinh lý. Tái khám sau 5 ngày hoặc khi có biểu hiện sốt cao liên tục." />
          </Form.Item>
        </Card>

        {/* Submit Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
          <Button size="large">Lưu Nháp</Button>
          <Button type="primary" htmlType="submit" size="large" icon={<SaveOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a', height: 48, padding: '0 32px', fontWeight: 600 }}>
            Hoàn tất Ca khám & Xuất EMR
          </Button>
        </div>
      </Form>
    </div>
  );
};
