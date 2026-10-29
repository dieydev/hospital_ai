import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Typography, Button, Tag } from 'antd';
import {
  SafetyCertificateOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  UserOutlined,
  MedicineBoxOutlined,
  ApartmentOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { PatientPortalHeader } from '../components/PatientPortalHeader';
import { PatientPortalFooter } from '../components/PatientPortalFooter';
import { CountUpNumber } from '../components/CountUpNumber';
import './PatientBookingPage.css';

const { Title, Paragraph } = Typography;

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="booking-page-container" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PatientPortalHeader />

      {/* Hero Banner Giới Thiệu */}
      <section
        style={{
          background: '#f0f9ff',
          padding: '50px 20px 40px',
          textAlign: 'center',
          borderBottom: '1px solid #bae6fd',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Tag color="processing" style={{ padding: '4px 14px', borderRadius: 20, fontWeight: 700, fontSize: 13, marginBottom: 16 }}>
            BỆNH VIỆN ĐA KHOA D-MEDICAL • THÀNH LẬP 2012
          </Tag>
          <Title level={1} style={{ color: '#0c4a6e', fontWeight: 900, fontSize: 'clamp(28px, 4vw, 40px)', margin: '0 0 16px' }}>
            Tiên Phong Y Tế Kỹ Thuật Cao & Chuyển Đổi Số Toàn Diện
          </Title>
          <Paragraph style={{ color: '#334155', fontSize: 'clamp(15px, 2vw, 17px)', lineHeight: 1.7, maxWidth: 760, margin: '0 auto 28px' }}>
            Bệnh viện Đa khoa D-Medical tự hào là trung tâm y tế uy tín hàng đầu, kết hợp giữa y đức, chuyên môn sâu sắc của đội ngũ Thầy thuốc và công nghệ AI hiện đại nhằm mang lại giải pháp chăm sóc sức khỏe an toàn, chuẩn xác và tận tâm nhất cho mọi gia đình.
          </Paragraph>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Button
              type="primary"
              size="large"
              icon={<CalendarOutlined />}
              style={{ backgroundColor: '#0284c7', borderRadius: 12, fontWeight: 700, height: 48, padding: '0 28px' }}
              onClick={() => navigate('/booking')}
            >
              Đặt Lịch Khám Trực Tuyến
            </Button>
            <Button
              size="large"
              style={{ borderColor: '#0284c7', color: '#0284c7', borderRadius: 12, fontWeight: 700, height: 48, padding: '0 24px' }}
              onClick={() => navigate('/huong-dan')}
            >
              Quy Trình Khám & BHYT
            </Button>
          </div>
        </div>
      </section>

      {/* Nội dung chính */}
      <main style={{ maxWidth: 1480, width: '95%', margin: '0 auto', padding: '40px 16px' }}>
        {/* 4 Thống kê nổi bật với hiệu ứng nhảy số tự động */}
        <Row gutter={[20, 20]} style={{ marginBottom: 48 }}>
          {[
            {
              end: 50,
              suffix: '+',
              label: 'Bác Sĩ Chuyên Khoa',
              sub: 'Trưởng khoa, CKII & Giảng viên ĐHYD',
              icon: <UserOutlined style={{ fontSize: 24, color: '#0284c7' }} />,
              bg: '#e0f2fe',
              borderColor: '#bae6fd',
              color: '#0284c7',
            },
            {
              end: 500,
              suffix: '+',
              label: 'Giường Bệnh Nội Trú',
              sub: 'Phòng tiện nghi tiêu chuẩn quốc tế',
              icon: <MedicineBoxOutlined style={{ fontSize: 24, color: '#059669' }} />,
              bg: '#ecfdf5',
              borderColor: '#a7f3d0',
              color: '#059669',
            },
            {
              end: 9,
              suffix: '+',
              label: 'Khoa Lâm Sàng Kỹ Thuật Cao',
              sub: 'Tim mạch, Tiêu hóa, Cấp cứu 24/7',
              icon: <ApartmentOutlined style={{ fontSize: 24, color: '#d97706' }} />,
              bg: '#fef3c7',
              borderColor: '#fde68a',
              color: '#d97706',
            },
            {
              end: 99.2,
              suffix: '%',
              decimals: 1,
              label: 'Mức Độ Hài Lòng',
              sub: 'Đánh giá từ hơn 200.000 lượt khám/năm',
              icon: <SmileOutlined style={{ fontSize: 24, color: '#e11d48' }} />,
              bg: '#ffe4e6',
              borderColor: '#fecdd3',
              color: '#e11d48',
            },
          ].map((stat, idx) => (
            <Col xs={12} sm={12} md={6} key={idx}>
              <Card
                className="about-stat-card"
                bordered={false}
                style={{
                  borderRadius: 18,
                  textAlign: 'center',
                  background: '#ffffff',
                  border: `1.5px solid ${stat.borderColor}`,
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
                  height: '100%',
                  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="about-stat-icon-wrap"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: stat.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    transition: 'transform 0.3s ease',
                  }}
                >
                  {stat.icon}
                </div>
                <div style={{ fontSize: 34, fontWeight: 900, color: stat.color, marginBottom: 4, letterSpacing: '-0.5px' }}>
                  <CountUpNumber
                    end={stat.end}
                    suffix={stat.suffix}
                    decimals={stat.decimals || 0}
                    duration={2000}
                  />
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.45 }}>
                  {stat.sub}
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Tầm nhìn & Sứ mệnh */}
        <section style={{ marginBottom: 50 }}>
          <Row gutter={[28, 28]}>
            <Col xs={24} md={12}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 18,
                  height: '100%',
                  background: '#ffffff',
                  border: '1px solid #bae6fd',
                  boxShadow: '0 8px 24px rgba(2, 132, 199, 0.06)',
                  padding: 8,
                }}
              >
                <Tag color="cyan" style={{ fontWeight: 700, borderRadius: 8, marginBottom: 12 }}>
                  TẦM NHÌN CHIẾN LƯỢC
                </Tag>
                <Title level={3} style={{ color: '#0369a1', margin: '0 0 12px', fontWeight: 800 }}>
                  Trung Tâm Y Tế Đổi Mới Sáng Tạo & Số Hóa Toàn Diện
                </Title>
                <Paragraph style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.7 }}>
                  Trở thành bệnh viện đa khoa hàng đầu tại khu vực phía Nam về chất lượng điều trị lâm sàng, đi đầu trong việc ứng dụng Trí tuệ Nhân tạo (AI) và hồ sơ bệnh án điện tử (EMR) nhằm loại bỏ hoàn toàn cảnh chen lấn, tối ưu thời gian chờ đợi cho người bệnh.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 18,
                  height: '100%',
                  background: '#ffffff',
                  border: '1px solid #bae6fd',
                  boxShadow: '0 8px 24px rgba(2, 132, 199, 0.06)',
                  padding: 8,
                }}
              >
                <Tag color="blue" style={{ fontWeight: 700, borderRadius: 8, marginBottom: 12 }}>
                  SỨ MỆNH PHỤNG SỰ
                </Tag>
                <Title level={3} style={{ color: '#0369a1', margin: '0 0 12px', fontWeight: 800 }}>
                  Lấy Người Bệnh Làm Trung Tâm • Y Đức Đi Cùng Chuyên Môn
                </Title>
                <Paragraph style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.7 }}>
                  Cam kết mang đến dịch vụ y tế an toàn, nhân văn và minh bạch. Mọi người dân đều có quyền được tiếp cận quy trình khám chữa bệnh chất lượng cao với chi phí hợp lý, được hỗ trợ BHYT thông tuyến và hưởng bảo lãnh viện phí trọn gói.
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </section>

        {/* Hệ thống Trang thiết bị Y tế Kỹ thuật cao */}
        <section style={{ marginBottom: 50 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Title level={2} style={{ color: '#0f172a', fontWeight: 900, margin: '0 0 8px' }}>
              Trang Thiết Bị Y Tế & Công Nghệ Hàng Đầu
            </Title>
            <Paragraph style={{ color: '#64748b', fontSize: 15 }}>
              Hệ thống phòng mổ và chẩn đoán hình ảnh đồng bộ đạt tiêu chuẩn quốc tế
            </Paragraph>
          </div>

          <Row gutter={[20, 20]}>
            {[
              {
                title: 'Cộng hưởng từ MRI 3.0 Tesla Silent Scan',
                desc: 'Độ phân giải siêu cao, phát hiện sớm dị dạng mạch não, tầm soát đột quỵ và thoái hóa thần kinh.',
                tag: 'Chẩn đoán hình ảnh',
              },
              {
                title: 'Máy chụp Cắt lớp vi tính CT Scanner 128 Lát',
                desc: 'Tốc độ quét nhanh, liều tia X cực thấp, chuyên sâu dựng hình động mạch vành tim và phổi.',
                tag: 'Kỹ thuật cao',
              },
              {
                title: 'Hệ thống Nội soi Tiêu hóa NBI Nhuộm màu',
                desc: 'Phóng đại hình ảnh gấp 100 lần, phát hiện ung thư biểu mô thực quản - dạ dày - đại tràng ở giai đoạn sớm.',
                tag: 'Tiêu hóa',
              },
              {
                title: 'Hệ thống Xét nghiệm Tự động Hóa Cobas 8000',
                desc: 'Công suất 8.000 test/giờ, độ chính xác tuyệt đối, kết quả xét nghiệm máu và sinh hóa trả trực tuyến trong 45 phút.',
                tag: 'Cận lâm sàng',
              },
            ].map((item, idx) => (
              <Col xs={24} sm={12} md={6} key={idx}>
                <Card
                  bordered={false}
                  style={{
                    borderRadius: 16,
                    height: '100%',
                    background: '#ffffff',
                    border: '1px solid #bae6fd',
                    boxShadow: '0 4px 16px rgba(2, 132, 199, 0.05)',
                  }}
                >
                  <Tag color="cyan" style={{ marginBottom: 10, fontWeight: 700 }}>{item.tag}</Tag>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', marginBottom: 8, lineHeight: 1.4 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.55 }}>
                    {item.desc}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* Giấy phép hoạt động & Chứng nhận */}
        <section
          style={{
            background: '#f0f9ff',
            border: '1.5px solid #bae6fd',
            borderRadius: 20,
            padding: '30px 28px',
            marginBottom: 40,
          }}
        >
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={16}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <SafetyCertificateOutlined style={{ fontSize: 24, color: '#0284c7' }} />
                <Title level={3} style={{ margin: 0, color: '#0369a1', fontWeight: 800 }}>
                  Pháp Lý & Chứng Nhận Chất Lượng Quốc Tế
                </Title>
              </div>
              <Paragraph style={{ color: '#334155', fontSize: 14, margin: '0 0 12px', lineHeight: 1.6 }}>
                Bệnh viện hoạt động theo <strong>Giấy phép Khám bệnh, chữa bệnh số 0864/BYT-GPHĐ</strong> do Bộ Y Tế cấp. Quy trình quản lý chất lượng đạt chứng nhận <strong>ISO 9001:2015</strong> và liên tục đạt danh hiệu Cơ sở Y tế An toàn - Xanh - Sạch - Đẹp.
              </Paragraph>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13, color: '#0f172a', fontWeight: 600 }}>
                <span><CheckCircleFilled style={{ color: '#16a34a' }} /> Giám định BHYT tự động</span>
                <span><CheckCircleFilled style={{ color: '#16a34a' }} /> Bác sĩ đủ chứng chỉ hành nghề</span>
                <span><CheckCircleFilled style={{ color: '#16a34a' }} /> Bảo mật hồ sơ bệnh án 100%</span>
              </div>
            </Col>
            <Col xs={24} md={8} style={{ textAlign: 'center' }}>
              <Button
                type="primary"
                size="large"
                style={{ backgroundColor: '#0284c7', borderRadius: 12, fontWeight: 700, height: 46 }}
                onClick={() => navigate('/booking')}
              >
                Đặt Lịch Khám Ngay <ArrowRightOutlined />
              </Button>
            </Col>
          </Row>
        </section>
      </main>

      <PatientPortalFooter />
    </div>
  );
};
