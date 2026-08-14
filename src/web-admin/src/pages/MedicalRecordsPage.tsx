import React, { useState } from 'react';
import { Card, Timeline, Typography, Tag, Button, Space, Row, Col, Modal, Table, Divider } from 'antd';
import {
  FilePdfOutlined,
  PrinterOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useThemeStore } from '../store/useThemeStore';
import { showToast } from '../utils/sweetAlert';

const { Title, Text } = Typography;

export const MedicalRecordsPage: React.FC = () => {
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const { isDarkMode } = useThemeStore();

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
      <Card
        style={{
          borderRadius: 12,
          background: isDarkMode
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            : 'linear-gradient(135deg, #001529 0%, #002140 100%)',
          color: '#fff',
          borderColor: isDarkMode ? '#334155' : undefined,
          boxShadow: isDarkMode ? '0 10px 30px rgba(0,0,0,0.3)' : '0 10px 30px rgba(2, 132, 199, 0.08)'
        }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Space size="large">
              <Title level={3} style={{ color: '#fff', margin: 0 }}>
                HỒ SƠ BỆNH ÁN ĐIỆN TỬ (EMR) - NGUYỄN VĂN AN
              </Title>
              <Tag color="blue" style={{ fontSize: 13, padding: '2px 10px' }}>BN20260001</Tag>
            </Space>
            <div style={{ marginTop: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.75)' }}>
                CCCD: <strong>038090001234</strong> • Ngày sinh: <strong>1990-05-15 (36 tuổi)</strong> • BHYT: <strong>DN40101234567</strong>
              </Text>
            </div>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<FilePdfOutlined />}
              size="large"
              style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
              onClick={() => handleOpenPdf(historyItems[0])}
            >
              Xuất Bệnh án EMR (PDF)
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Timeline view */}
      <Row gutter={16}>
        <Col span={16}>
          <Card
            title={
              <Space>
                <HistoryOutlined style={{ color: isDarkMode ? '#38bdf8' : '#0284c7' }} />
                <span style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Dòng thời gian Diễn biến Lịch sử Khám bệnh</span>
              </Space>
            }
            style={{ borderRadius: 12, borderColor: isDarkMode ? '#334155' : undefined }}
          >
            <Timeline
              mode="left"
              items={historyItems.map((item) => ({
                color: item.id === 'emr-001' ? 'green' : 'blue',
                children: (
                  <Card
                    size="small"
                    style={{
                      marginBottom: 16,
                      borderRadius: 8,
                      borderColor: isDarkMode ? '#334155' : '#e8e8e8',
                      background: isDarkMode ? '#0f172a' : '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong style={{ fontSize: 16, color: isDarkMode ? '#38bdf8' : '#0284c7' }}>
                        {formatDate(item.ngayKham)} - {item.khoaKham}
                      </Text>
                      <Tag color="purple">Mã ICD-10: {item.maICD10}</Tag>
                    </div>

                    <p style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
                      <strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Bác sĩ khám:</strong> {item.bacSiKham}
                    </p>
                    <p style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
                      <strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Triệu chứng:</strong> {item.trieuChung}
                    </p>
                    <p style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
                      <strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Chẩn đoán:</strong>{' '}
                      <Text strong style={{ color: isDarkMode ? '#f59e0b' : '#d97706' }}>{item.chanDoanChinh}</Text>
                    </p>

                    <Divider style={{ margin: '8px 0', borderColor: isDarkMode ? '#334155' : undefined }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary" style={{ color: isDarkMode ? '#94a3b8' : undefined }}>
                        Tổng chi phí lượt khám: <strong style={{ color: isDarkMode ? '#38bdf8' : '#0284c7' }}>{formatCurrency(item.chiPhi)}</strong>
                      </Text>
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
          <Card
            title={<span style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Tóm tắt Tiền sử & Dị ứng</span>}
            style={{ borderRadius: 12, borderColor: isDarkMode ? '#334155' : undefined }}
          >
            <p style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
              <strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Nhóm máu:</strong> <Tag color="red">O+</Tag>
            </p>
            <p style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
              <strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Tiền sử bệnh nội khoa:</strong> Tăng huyết áp độ 1
            </p>
            <p style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
              <strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Tiền sử dị ứng thuốc:</strong> Không ghi nhận
            </p>
            <p style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
              <strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Tổng số lượt khám đã thực hiện:</strong> 12 lượt
            </p>
          </Card>
        </Col>
      </Row>

      {/* PDF EMR Preview Modal */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#0284c7' }} />
            <span style={{ color: isDarkMode ? '#38bdf8' : '#0369a1' }}>HỒ SƠ BỆNH ÁN ĐIỆN TỬ - ELECTRONIC MEDICAL RECORD (PDF PREVIEW)</span>
          </Space>
        }
        open={isPdfModalOpen}
        onCancel={() => setIsPdfModalOpen(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setIsPdfModalOpen(false)}>Đóng</Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }} onClick={() => showToast('Đã gửi lệnh in Hồ sơ EMR!', 'info')}>In File PDF</Button>,
        ]}
      >
        {selectedRecord && (
          <div
            style={{
              padding: 20,
              border: isDarkMode ? '1px solid #334155' : '1px solid #d9d9d9',
              borderRadius: 8,
              background: isDarkMode ? '#1e293b' : '#ffffff',
              color: isDarkMode ? '#f8fafc' : '#0f172a'
            }}
          >
            <div style={{ textAlign: 'center', borderBottom: isDarkMode ? '2px solid #38bdf8' : '2px solid #001529', paddingBottom: 12, marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0, color: isDarkMode ? '#38bdf8' : '#0369a1' }}>BỆNH VIỆN ĐA KHOA HOSPITAL AI</Title>
              <Text type="secondary" style={{ color: isDarkMode ? '#cbd5e1' : undefined }}>Địa chỉ: Đường Lê Hồng Phong, TP. Thủ Dầu Một, Bình Dương</Text>
              <Title level={3} style={{ color: isDarkMode ? '#f8fafc' : '#001529', marginTop: 12, marginBottom: 0 }}>PHIẾU KHÁM BỆNH & HỒ SƠ EMR</Title>
              <Text type="secondary" style={{ color: isDarkMode ? '#cbd5e1' : undefined }}>Mã lượt khám: {selectedRecord.maLuotKham}</Text>
            </div>

            <Row gutter={[16, 8]}>
              <Col span={12}><Text style={{ color: isDarkMode ? '#cbd5e1' : undefined }}>Họ tên: <strong style={{ color: isDarkMode ? '#f8fafc' : undefined }}>NGUYỄN VĂN AN</strong></Text></Col>
              <Col span={12}><Text style={{ color: isDarkMode ? '#cbd5e1' : undefined }}>Ngày sinh: <strong style={{ color: isDarkMode ? '#f8fafc' : undefined }}>1990-05-15 (Nam)</strong></Text></Col>
              <Col span={12}><Text style={{ color: isDarkMode ? '#cbd5e1' : undefined }}>Mã BN: <strong style={{ color: isDarkMode ? '#38bdf8' : '#0284c7' }}>BN20260001</strong></Text></Col>
              <Col span={12}><Text style={{ color: isDarkMode ? '#cbd5e1' : undefined }}>Mã thẻ BHYT: <strong style={{ color: isDarkMode ? '#f8fafc' : undefined }}>DN40101234567</strong></Text></Col>
              <Col span={24}><Text style={{ color: isDarkMode ? '#cbd5e1' : undefined }}>Địa chỉ: <strong style={{ color: isDarkMode ? '#f8fafc' : undefined }}>TP. Thủ Dầu Một, Bình Dương</strong></Text></Col>
            </Row>

            <Divider style={{ margin: '12px 0', borderColor: isDarkMode ? '#334155' : undefined }} />

            <Title level={5} style={{ color: isDarkMode ? '#38bdf8' : '#0369a1' }}>I. KẾT QUẢ KHÁM LÂM SÀNG (SOAP)</Title>
            <p><strong>1. Triệu chứng cơ năng (Subjective):</strong> {selectedRecord.trieuChung}</p>
            <p><strong>2. Sinh hiệu (Objective):</strong> {selectedRecord.sinhHieu}</p>
            <p><strong>3. Chẩn đoán xác định (Assessment):</strong> {selectedRecord.chanDoanChinh} (Mã ICD-10: <strong style={{ color: isDarkMode ? '#38bdf8' : '#0284c7' }}>{selectedRecord.maICD10}</strong>)</p>

            <Title level={5} style={{ marginTop: 16, color: isDarkMode ? '#38bdf8' : '#0369a1' }}>II. ĐƠN THUỐC ĐIỆN TỬ (PLAN)</Title>
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: isDarkMode ? '1px dashed #334155' : '1px dashed #cbd5e1' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ background: '#ffffff', padding: 8, borderRadius: 8, display: 'inline-block', border: '1px solid #bae6fd' }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=EMR_${selectedRecord.maLuotKham}_BN20260001`}
                    alt="EMR QR Code"
                    style={{ width: 90, height: 90, display: 'block' }}
                  />
                </div>
                <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 4, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                  Mã QR Tra cứu EMR Điện tử
                </Text>
              </div>

              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ color: isDarkMode ? '#94a3b8' : undefined, display: 'block', fontSize: 12 }}>Bác sĩ Khám & Ký số</Text>
                <Tag color="green" style={{ marginTop: 4, marginBottom: 8, fontWeight: 700 }}>
                  <SafetyCertificateOutlined /> Đã ký số SHA-256
                </Tag>
                <Text strong style={{ color: isDarkMode ? '#f8fafc' : undefined, display: 'block' }}>{selectedRecord.bacSiKham}</Text>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
