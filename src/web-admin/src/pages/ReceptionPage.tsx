import React, { useState } from 'react';
import { Table, Button, Space, Input, Tag, Card, Row, Col, Typography, Modal, Form, Select, Switch, message, Badge } from 'antd';
import { PlusOutlined, SearchOutlined, QrcodeOutlined, PrinterOutlined, UserAddOutlined } from '@ant-design/icons';
import { QueueTicket } from '../types';
import { getStatusTagColor } from '../utils/formatters';

const { Title, Text } = Typography;
const { Option } = Select;

export const ReceptionPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const [queueList, setQueueList] = useState<QueueTicket[]>([
    { id: '1', stt: 101, maBenhNhan: 'BN20260001', tenBenhNhan: 'Nguyễn Văn An', soCCCD: '038090001234', phongKham: 'Phòng 102 - Khoa Nội', bacSiKham: 'BS. CKII. Nguyễn Thanh Duy', trangThai: 'Đang khám', thoiGianCap: '08:15', uuTien: false },
    { id: '2', stt: 102, maBenhNhan: 'BN20260002', tenBenhNhan: 'Trần Thị Bình', soCCCD: '038185005678', phongKham: 'Phòng 102 - Khoa Nội', bacSiKham: 'BS. CKII. Nguyễn Thanh Duy', trangThai: 'Chờ cận lâm sàng', thoiGianCap: '08:30', uuTien: false },
    { id: '3', stt: 103, maBenhNhan: 'BN20260003', tenBenhNhan: 'Lê Hoàng Nam', soCCCD: '038192009876', phongKham: 'Phòng 105 - Khoa Nhi', bacSiKham: 'BS. CKI. Phạm Minh Đức', trangThai: 'Đang chờ', thoiGianCap: '08:45', uuTien: true },
    { id: '4', stt: 104, maBenhNhan: 'BN20260004', tenBenhNhan: 'Phạm Thu Cúc', soCCCD: '038177003456', phongKham: 'Phòng 102 - Khoa Nội', bacSiKham: 'BS. CKII. Nguyễn Thanh Duy', trangThai: 'Đang chờ', thoiGianCap: '09:00', uuTien: false },
  ]);

  const handleAddTicket = (values: { hoTen: string; soCCCD: string; phongKham: string; uuTien?: boolean }) => {
    const nextStt = queueList.length > 0 ? Math.max(...queueList.map((q) => q.stt)) + 1 : 101;
    const newTicket: QueueTicket = {
      id: Date.now().toString(),
      stt: nextStt,
      maBenhNhan: `BN202600${queueList.length + 5}`,
      tenBenhNhan: values.hoTen,
      soCCCD: values.soCCCD,
      phongKham: values.phongKham,
      bacSiKham: 'BS. CKII. Nguyễn Thanh Duy',
      trangThai: 'Đang chờ',
      thoiGianCap: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      uuTien: !!values.uuTien,
    };

    setQueueList([newTicket, ...queueList]);
    message.success(`Đã cấp thành công số khám STT #${nextStt} cho bệnh nhân ${values.hoTen}`);
    setIsModalOpen(false);
    form.resetFields();
  };

  const columns = [
    {
      title: 'Số STT',
      dataIndex: 'stt',
      key: 'stt',
      render: (stt: number, record: QueueTicket) => (
        <Space>
          <Badge count={record.uuTien ? 'Ưu tiên' : 0} style={{ backgroundColor: '#ff4d4f' }}>
            <Text strong style={{ fontSize: 20, color: record.uuTien ? '#ff4d4f' : '#1677ff' }}>
              #{stt}
            </Text>
          </Badge>
        </Space>
      ),
    },
    { title: 'Mã BN', dataIndex: 'maBenhNhan', key: 'maBenhNhan' },
    { title: 'Họ và Tên', dataIndex: 'tenBenhNhan', key: 'tenBenhNhan', render: (t: string) => <Text strong>{t}</Text> },
    { title: 'Số CCCD', dataIndex: 'soCCCD', key: 'soCCCD' },
    { title: 'Phòng khám', dataIndex: 'phongKham', key: 'phongKham' },
    { title: 'Bác sĩ phân công', dataIndex: 'bacSiKham', key: 'bacSiKham' },
    { title: 'Thời gian cấp', dataIndex: 'thoiGianCap', key: 'thoiGianCap' },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (st: string) => <Tag color={getStatusTagColor(st)}>{st}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: () => (
        <Space>
          <Button icon={<PrinterOutlined />} size="small" type="dashed">In phiếu</Button>
          <Button icon={<QrcodeOutlined />} size="small" type="link">Quét QR</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Tiếp nhận Bệnh nhân & Cấp số thứ tự</Title>
          <Text type="secondary">Quản lý luồng tiếp nhận bệnh nhân tại quầy lễ tân bệnh viện</Text>
        </div>
        <Space>
          <Input placeholder="Quét CCCD/Mã QR BHYT..." prefix={<SearchOutlined />} style={{ width: 280 }} />
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsModalOpen(true)}>
            Đăng ký & Cấp số mới
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={6}>
          <Card style={{ borderRadius: 12, textAlign: 'center', background: '#e6f7ff', borderColor: '#91caff' }}>
            <Text type="secondary">Số STT Đang gọi khám</Text>
            <Title level={1} style={{ color: '#1677ff', margin: '8px 0' }}>#101</Title>
            <Text strong>Phòng 102 - Khoa Nội</Text>
          </Card>
        </Col>

        <Col span={6}>
          <Card style={{ borderRadius: 12, textAlign: 'center', background: '#fff7e6', borderColor: '#ffd591' }}>
            <Text type="secondary">Bệnh nhân Đang chờ</Text>
            <Title level={1} style={{ color: '#fa8c16', margin: '8px 0' }}>14</Title>
            <Text>Thời gian chờ TB: ~12 phút</Text>
          </Card>
        </Col>

        <Col span={6}>
          <Card style={{ borderRadius: 12, textAlign: 'center', background: '#f6ffed', borderColor: '#b7eb8f' }}>
            <Text type="secondary">Đã khám Hoàn thành</Text>
            <Title level={1} style={{ color: '#52c41a', margin: '8px 0' }}>85</Title>
            <Text>Hôm nay (2026-08-02)</Text>
          </Card>
        </Col>

        <Col span={6}>
          <Card style={{ borderRadius: 12, textAlign: 'center', background: '#fff2f0', borderColor: '#ffccc7' }}>
            <Text type="secondary">Ưu tiên (Cấp cứu/Người già)</Text>
            <Title level={1} style={{ color: '#ff4d4f', margin: '8px 0' }}>2</Title>
            <Text style={{ color: '#ff4d4f' }}>Đang sắp xếp luồng nhanh</Text>
          </Card>
        </Col>
      </Row>

      <Card title="Danh sách Cấp số Hàng chờ Khám bệnh" style={{ borderRadius: 12 }}>
        <Table dataSource={queueList} columns={columns} rowKey="id" />
      </Card>

      {/* Modal Đăng ký tiếp nhận mới */}
      <Modal
        title={
          <Space>
            <UserAddOutlined style={{ color: '#1677ff' }} />
            <span>Tiếp nhận & Cấp số Khám Mới</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleAddTicket} initialValues={{ phongKham: 'Phòng 102 - Khoa Nội' }}>
          <Form.Item label="Họ và Tên Bệnh nhân" name="hoTen" rules={[{ required: true, message: 'Nhập họ tên!' }]}>
            <Input placeholder="Ví dụ: Nguyễn Văn An" size="large" />
          </Form.Item>

          <Form.Item label="Số CCCD / Thẻ BHYT" name="soCCCD" rules={[{ required: true, message: 'Nhập số CCCD!' }]}>
            <Input placeholder="03809000xxxx" size="large" />
          </Form.Item>

          <Form.Item label="Chọn Phòng khám & Chuyên khoa" name="phongKham" rules={[{ required: true }]}>
            <Select size="large">
              <Option value="Phòng 102 - Khoa Nội">Phòng 102 - Khoa Nội Tổng Hợp</Option>
              <Option value="Phòng 105 - Khoa Nhi">Phòng 105 - Khoa Nhi</Option>
              <Option value="Phòng 201 - Khoa Mắt">Phòng 201 - Khoa Mắt</Option>
              <Option value="Phòng 204 - Khoa Sản">Phòng 204 - Khoa Sản</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Đối tượng Ưu tiên (Người cao tuổi / Phụ nữ thai sản / Cấp cứu)" name="uuTien" valuePropName="checked">
            <Switch />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" size="large" icon={<PrinterOutlined />}>
                Cấp số & In phiếu
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
