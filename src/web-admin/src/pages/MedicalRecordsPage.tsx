import React, { useState } from 'react';
import { Card, Timeline, Typography, Tag, Button, Space, Row, Col, Modal, Table, Divider } from 'antd';
import {
  FilePdfOutlined,
  PrinterOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { formatCurrency, formatDate } from '../utils/formatters';

const { Title, Text } = Typography;

export const MedicalRecordsPage: React.FC = () => {
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const historyItems = [
    {
      id: 'emr-001',
      ngayKham: '2026-08-02',
      maLuotKham: 'LK20260802-01',
      bacSiKham: 'BS. CKII. Nguyễn Thanh Duy',
      khoaKham: 'Khoa Nội Tổng Hợp',
      chanDoanChinh: 'Viêm họng cấp tính, không đặc hiệu',
      maICD10: 'J02.9',
      trieuChung: 'Bệnh nhân đau họng 3 ngày, sốt 38°C, ho khan',
      sinhHieu: 'Mạch: 78 bpm | HA: 125/80 mmHg | Nhiệt độ: 38.0°C | BMI: 23.0',
      donThuoc: [
        { tenThuoc: 'Paracetamol 500mg', soLuong: '20 viên', lieuDung: 'Sáng 1v, Tối 1v' },
        { tenThuoc: 'Augmentin 1g', soLuong: '14 viên', lieuDung: 'Sáng 1v, Tối 1v' },
      ],
      xetNghiem: [
        { ten: 'Công thức máu toàn phần (CBC)', ketQua: 'WBC 11.2 (Tăng nhẹ)' },
        { ten: 'X-Quang Phổi thẳng', ketQua: 'Phế trường 2 bên sáng' },
      ],
      chiPhi: 385000,
    },
    {
      id: 'emr-002',
      ngayKham: '2026-05-14',
      maLuotKham: 'LK20260514-08',
      bacSiKham: 'BS. CKI. Lê Văn Tuấn',
      khoaKham: 'Khoa Tiêu Hóa',
      chanDoanChinh: 'Viêm dạ dày - tá tràng cấp',
      maICD10: 'K29.7',
      trieuChung: 'Đau thượng vị ợ chua, buồn nôn sau khi ăn đồ cay nóng',
      sinhHieu: 'Mạch: 72 bpm | HA: 120/75 mmHg | Nhiệt độ: 36.8°C | BMI: 22.8',
      donThuoc: [
        { tenThuoc: 'Esomeprazole 40mg', soLuong: '14 viên', lieuDung: 'Sáng 1v trước ăn 30p' },
        { tenThuoc: 'Phosphalugel (Sữa dạ dày)', soLuong: '20 gói', lieuDung: 'Uống khi đau 1 gói' },
      ],
      xetNghiem: [{ ten: 'Nội soi dạ dày không đau', ketQua: 'Niêm mạc hang vị sung huyết nhẹ' }],
      chiPhi: 1250000,
    },
  ];

  const handleOpenPdf = (record: any) => {
    setSelectedRecord(record);
    setIsPdfModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Patient Banner */}
      <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #001529 0%, #002140 100%)', color: '#fff' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space size="large">
              <Title level={3} style={{ color: '#fff', margin: 0 }}>
                HỒ SƠ BỆNH ÁN ĐIỆN TỬ (EMR) - NGUYỄN VĂN AN
              </Title>
              <Tag color="blue">BN20260001</Tag>
            </Space>
            <div style={{ marginTop: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.75)' }}>
                CCCD: <strong>038090001234</strong> • Ngày sinh: <strong>1990-05-15 (36 tuổi)</strong> • BHYT: <strong>DN40101234567</strong>
              </Text>
            </div>
          </Col>
          <Col>
            <Button type="primary" icon={<FilePdfOutlined />} size="large" onClick={() => handleOpenPdf(historyItems[0])}>
              Xuất Bệnh án EMR (PDF)
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Timeline view */}
      <Row gutter={16}>
        <Col span={16}>
          <Card title={<Space><HistoryOutlined style={{ color: '#1677ff' }} /><span>Dòng thời gian Diễn biến Lịch sử Khám bệnh</span></Space>} style={{ borderRadius: 12 }}>
            <Timeline
              mode="left"
              items={historyItems.map((item) => ({
                color: item.id === 'emr-001' ? 'green' : 'blue',
                children: (
                  <Card size="small" style={{ marginBottom: 16, borderRadius: 8, borderColor: '#e8e8e8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong style={{ fontSize: 16, color: '#1677ff' }}>
                        {formatDate(item.ngayKham)} - {item.khoaKham}
                      </Text>
                      <Tag color="purple">Mã ICD-10: {item.maICD10}</Tag>
                    </div>

                    <p><strong>Bác sĩ khám:</strong> {item.bacSiKham}</p>
                    <p><strong>Triệu chứng:</strong> {item.trieuChung}</p>
                    <p><strong>Chẩn đoán:</strong> <Text strong style={{ color: '#d4b106' }}>{item.chanDoanChinh}</Text></p>

                    <Divider style={{ margin: '8px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary">Tổng chi phí lượt khám: <strong>{formatCurrency(item.chiPhi)}</strong></Text>
                      <Button type="link" icon={<FilePdfOutlined />} onClick={() => handleOpenPdf(item)}>
                        Xem PDF Chi tiết
                      </Button>
                    </div>
                  </Card>
                ),
              }))}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card title="Tóm tắt Tiền sử & Dị ứng" style={{ borderRadius: 12 }}>
            <p><strong>Nhóm máu:</strong> <Tag color="red">O+</Tag></p>
            <p><strong>Tiền sử bệnh nội khoa:</strong> Tăng huyết áp độ 1</p>
            <p><strong>Tiền sử dị ứng thuốc:</strong> Không ghi nhận</p>
            <p><strong>Tổng số lượt khám đã thực hiện:</strong> 12 lượt</p>
          </Card>
        </Col>
      </Row>

      {/* PDF EMR Preview Modal */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
            <span>HỒ SƠ BỆNH ÁN ĐIỆN TỬ - ELECTRONIC MEDICAL RECORD (PDF PREVIEW)</span>
          </Space>
        }
        open={isPdfModalOpen}
        onCancel={() => setIsPdfModalOpen(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setIsPdfModalOpen(false)}>Đóng</Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />}>In File PDF</Button>,
        ]}
      >
        {selectedRecord && (
          <div style={{ padding: 20, border: '1px solid #d9d9d9', borderRadius: 8, background: '#fff' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #001529', paddingBottom: 12, marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>BỆNH VIỆN ĐA KHOA HOSPITAL AI</Title>
              <Text type="secondary">Địa chỉ: Đường Lê Hồng Phong, TP. Thủ Dầu Một, Bình Dương</Text>
              <Title level={3} style={{ color: '#001529', marginTop: 12, marginBottom: 0 }}>PHIẾU KHÁM BỆNH & HỒ SƠ EMR</Title>
              <Text type="secondary">Mã lượt khám: {selectedRecord.maLuotKham}</Text>
            </div>

            <Row gutter={[16, 8]}>
              <Col span={12}><Text>Họ tên: <strong>NGUYỄN VĂN AN</strong></Text></Col>
              <Col span={12}><Text>Ngày sinh: <strong>1990-05-15 (Nam)</strong></Text></Col>
              <Col span={12}><Text>Mã BN: <strong>BN20260001</strong></Text></Col>
              <Col span={12}><Text>Mã thẻ BHYT: <strong>DN40101234567</strong></Text></Col>
              <Col span={24}><Text>Địa chỉ: <strong>TP. Thủ Dầu Một, Bình Dương</strong></Text></Col>
            </Row>

            <Divider style={{ margin: '12px 0' }} />

            <Title level={5}>I. KẾT QUẢ KHÁM LÂM SÀNG (SOAP)</Title>
            <p><strong>1. Triệu chứng cơ năng (Subjective):</strong> {selectedRecord.trieuChung}</p>
            <p><strong>2. Sinh hiệu (Objective):</strong> {selectedRecord.sinhHieu}</p>
            <p><strong>3. Chẩn đoán xác định (Assessment):</strong> {selectedRecord.chanDoanChinh} (Mã ICD-10: <strong>{selectedRecord.maICD10}</strong>)</p>

            <Title level={5} style={{ marginTop: 16 }}>II. ĐƠN THUỐC ĐIỆN TỬ (PLAN)</Title>
            <Table
              dataSource={selectedRecord.donThuoc}
              columns={[
                { title: 'STT', key: 'stt', render: (_: any, __: any, index: number) => index + 1 },
                { title: 'Tên Thuốc', dataIndex: 'tenThuoc', key: 'tenThuoc' },
                { title: 'Số lượng', dataIndex: 'soLuong', key: 'soLuong' },
                { title: 'Liều dùng', dataIndex: 'lieuDung', key: 'lieuDung' },
              ]}
              pagination={false}
              size="small"
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">Bệnh nhân ký tên</Text>
                <div style={{ height: 60 }} />
                <Text strong>Nguyễn Văn An</Text>
              </div>

              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">Bác sĩ khám bệnh</Text>
                <div style={{ height: 60 }} />
                <Text strong>{selectedRecord.bacSiKham}</Text>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
