import React, { useState } from 'react';
import { Table, Button, Space, Input, Tag, Typography, Card, Modal, Form, Select, DatePicker, Row, Col, message } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined, FileTextOutlined, SafetyOutlined } from '@ant-design/icons';
import { Patient } from '../types';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

export const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const [patients, setPatients] = useState<Patient[]>([
    { id: '1', maBenhNhan: 'BN20260001', hoTen: 'Nguyễn Văn An', gioiTinh: 'Nam', ngaySinh: '1990-05-15', soCCCD: '038090001234', maTheBHYT: 'DN40101234567', soDienThoai: '0912345678', diaChi: 'TP. Thủ Dầu Một, Bình Dương', tienSuBenh: 'Tăng huyết áp nhẹ', diUngThuoc: 'Không' },
    { id: '2', maBenhNhan: 'BN20260002', hoTen: 'Trần Thị Bình', gioiTinh: 'Nữ', ngaySinh: '1985-11-20', soCCCD: '038185005678', maTheBHYT: 'GD40109876543', soDienThoai: '0987654321', diaChi: 'TP. Hồ Chí Minh', tienSuBenh: 'Đái tháo đường Tuýp 2', diUngThuoc: 'Penicillin' },
    { id: '3', maBenhNhan: 'BN20260003', hoTen: 'Lê Hoàng Nam', gioiTinh: 'Nam', ngaySinh: '2012-08-04', soCCCD: '038212009876', maTheBHYT: 'TE40105554433', soDienThoai: '0933445566', diaChi: 'TP. Bến Cát, Bình Dương', tienSuBenh: 'Viêm phế quản co thắt', diUngThuoc: 'Không' },
    { id: '4', maBenhNhan: 'BN20260004', hoTen: 'Phạm Thu Cúc', gioiTinh: 'Nữ', ngaySinh: '1995-02-18', soCCCD: '038195003456', maTheBHYT: 'DN40107778899', soDienThoai: '0908112233', diaChi: 'TP. Dĩ An, Bình Dương', tienSuBenh: 'Không', diUngThuoc: 'Aspirin' },
  ]);

  const [searchText, setSearchText] = useState('');

  const handleCreatePatient = (values: any) => {
    const newPatient: Patient = {
      id: Date.now().toString(),
      maBenhNhan: `BN2026000${patients.length + 1}`,
      hoTen: values.hoTen,
      gioiTinh: values.gioiTinh,
      ngaySinh: values.ngaySinh ? values.ngaySinh.format('YYYY-MM-DD') : '1990-01-01',
      soCCCD: values.soCCCD,
      maTheBHYT: values.maTheBHYT,
      soDienThoai: values.soDienThoai,
      diaChi: values.diaChi,
      tienSuBenh: values.tienSuBenh || 'Không',
      diUngThuoc: values.diUngThuoc || 'Không',
    };

    setPatients([newPatient, ...patients]);
    message.success(`Đã thêm mới hồ sơ bệnh nhân ${values.hoTen} thành công!`);
    setIsModalOpen(false);
    form.resetFields();
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.hoTen.toLowerCase().includes(searchText.toLowerCase()) ||
      p.maBenhNhan.toLowerCase().includes(searchText.toLowerCase()) ||
      p.soCCCD.includes(searchText)
  );

  const columns = [
    {
      title: 'Mã Bệnh Nhân',
      dataIndex: 'maBenhNhan',
      key: 'maBenhNhan',
      render: (text: string) => <Text strong style={{ color: '#1677ff' }}>{text}</Text>,
    },
    { title: 'Họ và Tên', dataIndex: 'hoTen', key: 'hoTen', render: (text: string) => <Text strong>{text}</Text> },
    {
      title: 'Giới tính',
      dataIndex: 'gioiTinh',
      key: 'gioiTinh',
      render: (g: string) => <Tag color={g === 'Nam' ? 'blue' : 'magenta'}>{g}</Tag>,
    },
    { title: 'Ngày sinh', dataIndex: 'ngaySinh', key: 'ngaySinh' },
    { title: 'Số CCCD', dataIndex: 'soCCCD', key: 'soCCCD' },
    {
      title: 'Thẻ BHYT',
      dataIndex: 'maTheBHYT',
      key: 'maTheBHYT',
      render: (bhyt: string) => (bhyt ? <Tag color="green" icon={<SafetyOutlined />}>{bhyt}</Tag> : <Text type="secondary">N/A</Text>),
    },
    { title: 'Số điện thoại', dataIndex: 'soDienThoai', key: 'soDienThoai' },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: unknown, record: Patient) => (
        <Space size="small">
          <Button icon={<FileTextOutlined />} type="primary" ghost size="small" onClick={() => navigate('/emr', { state: { patientId: record.id } })}>
            EMR
          </Button>
          <Button icon={<EyeOutlined />} type="link" size="small" onClick={() => navigate(`/patients/${record.id}`)}>
            Chi tiết
          </Button>
          <Button icon={<EditOutlined />} type="text" size="small" />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Quản lý Hồ sơ Bệnh nhân</Title>
          <Text type="secondary">Quản lý thông tin hành chính, thẻ BHYT, tiền sử bệnh và dị ứng thuốc của bệnh nhân</Text>
        </div>
        <Space>
          <Input
            placeholder="Tìm kiếm theo Mã BN / Họ tên / CCCD..."
            prefix={<SearchOutlined />}
            style={{ width: 320 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsModalOpen(true)}>
            Thêm Bệnh nhân Mới
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Table dataSource={filteredPatients} columns={columns} rowKey="id" />
      </Card>

      {/* Modal Thêm Bệnh Nhân Mới */}
      <Modal
        title="Tiếp nhận & Tạo Hồ sơ Bệnh nhân Mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreatePatient}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Họ và Tên Bệnh nhân" name="hoTen" rules={[{ required: true, message: 'Nhập họ tên!' }]}>
                <Input placeholder="Ví dụ: Nguyễn Văn An" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Giới tính" name="gioiTinh" rules={[{ required: true }]}>
                <Select placeholder="Chọn giới tính">
                  <Option value="Nam">Nam</Option>
                  <Option value="Nữ">Nữ</Option>
                  <Option value="Khác">Khác</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Ngày sinh" name="ngaySinh" rules={[{ required: true }]}>
                <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Số CCCD / Định danh cá nhân" name="soCCCD" rules={[{ required: true }]}>
                <Input placeholder="03809000xxxx" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Mã thẻ BHYT (nếu có)" name="maTheBHYT">
                <Input placeholder="DN4010xxxxxxx" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Số điện thoại" name="soDienThoai" rules={[{ required: true }]}>
                <Input placeholder="09xxxxxxxx" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Địa chỉ cư trú" name="diaChi" rules={[{ required: true }]}>
                <Input placeholder="Số nhà, đường, phường/xã, tỉnh thành" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Tiền sử bệnh lý (Tiểu đường, Tăng huyết áp...)" name="tienSuBenh">
                <Input.TextArea rows={2} placeholder="Nhập tiền sử bệnh lý..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tiền sử Dị ứng thuốc" name="diUngThuoc">
                <Input.TextArea rows={2} placeholder="Ví dụ: Penicillin, Aspirin..." />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Lưu thông tin Bệnh nhân</Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
