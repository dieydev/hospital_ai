import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Typography, Collapse, Button, Tag } from 'antd';
import {
  CalendarOutlined,
  QrcodeOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  CheckCircleFilled,
  QuestionCircleOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import { PatientPortalHeader } from '../components/PatientPortalHeader';
import { PatientPortalFooter } from '../components/PatientPortalFooter';

const { Title, Paragraph } = Typography;

export const GuidePage: React.FC = () => {
  const navigate = useNavigate();

  const stepsData = [
    {
      title: 'Bước 1: Chọn Chuyên Khoa hoặc Bác Sĩ',
      description: 'Lựa chọn khoa khám hoặc Bác sĩ chuyên khoa theo nhu cầu sức khỏe của bạn.',
      icon: <CalendarOutlined style={{ fontSize: 22 }} />,
      detail: 'Bạn có thể chọn theo Chuyên khoa mũi nhọn (Nội, Ngoại, Tim mạch, Tiêu hóa...), theo Bác sĩ Chuyên khoa II hoặc chọn Gói tầm soát sức khỏe toàn diện.',
    },
    {
      title: 'Bước 2: Chọn Ngày & Khung Giờ Khám',
      description: 'Chủ động chọn giờ khám mong muốn còn quota chỗ trống.',
      icon: <ClockCircleOutlined style={{ fontSize: 22 }} />,
      detail: 'Hệ thống hiển thị trực quan các khung giờ trong ngày (từ 07:00 đến 16:30) kèm số lượng chỗ trống thực tế. Đặt càng sớm số thứ tự khám càng thấp.',
    },
    {
      title: 'Bước 3: Nhận Mã QR Tiếp Nhận Điện Tử',
      description: 'Nhận Phiếu hẹn điện tử có mã QR ngay trên màn hình và tin nhắn SMS.',
      icon: <QrcodeOutlined style={{ fontSize: 22 }} />,
      detail: 'Phiếu tiếp nhận chứa đầy đủ thông tin: Bác sĩ, phòng khám, tầng, ngày giờ và mã QR bảo mật. Bạn có thể lưu vào điện thoại hoặc in ra.',
    },
    {
      title: 'Bước 4: Đến Viện Quét QR & Vào Khám Ngay',
      description: 'Quét QR tại Kiosk tầng 1 và vào thẳng phòng khám đúng giờ đã hẹn.',
      icon: <CheckCircleFilled style={{ fontSize: 22 }} />,
      detail: 'Đến bệnh viện trước giờ hẹn 10 - 15 phút, quét mã QR tại Kiosk tự phục vụ sảnh Khu A để lấy phiếu ưu tiên, không cần qua quầy đăng ký truyền thống.',
    },
  ];

  const faqItems = [
    {
      key: '1',
      label: 'Tôi có thể đổi lịch hoặc hủy lịch khám sau khi đã đặt không?',
      children: (
        <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7 }}>
          Có. Bạn hoàn toàn có thể tự đổi lịch hẹn sang ngày/giờ khác hoặc hủy lịch hẹn hoàn toàn miễn phí trước giờ khám ít nhất 02 tiếng. Bạn chỉ cần vào mục <strong>Tra cứu phiếu hẹn QR</strong> hoặc đăng nhập tài khoản Bệnh nhân để thực hiện thao tác. Khung giờ cũ sẽ được tự động hoàn trả cho người bệnh khác.
        </div>
      ),
    },
    {
      key: '2',
      label: 'Bệnh viện có áp dụng Bảo hiểm Y tế (BHYT) thông tuyến toàn quốc không?',
      children: (
        <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7 }}>
          Có. D-Medical áp dụng chính sách BHYT thông tuyến toàn quốc theo quy định của Bộ Y Tế. Người bệnh có thẻ BHYT tại bất kỳ tỉnh thành nào đều được hưởng đúng mức quyền lợi ghi trên thẻ (80%, 95% hoặc 100%) mà không cần giấy chuyển tuyến. Hệ thống tự động khấu trừ chi phí BHYT ngay khi xuất hóa đơn.
        </div>
      ),
    },
    {
      key: '3',
      label: 'Khi đi khám tôi cần mang theo những giấy tờ gì?',
      children: (
        <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7 }}>
          Quý khách chỉ cần mang theo:
          <ul style={{ paddingLeft: 20, marginTop: 6 }}>
            <li>Căn cước công dân (CCCD) gắn chip hoặc điện thoại có cài ứng dụng VNeID / VssID.</li>
            <li>Thẻ BHYT (nếu chưa tích hợp CCCD).</li>
            <li>Mã QR hẹn khám đã nhận khi đặt lịch online.</li>
            <li>Toa thuốc hoặc hồ sơ bệnh án cũ (nếu có tái khám).</li>
          </ul>
        </div>
      ),
    },
    {
      key: '4',
      label: 'Thời gian làm việc và khung giờ khám bệnh tại D-Medical như thế nào?',
      children: (
        <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7 }}>
          Bệnh viện tiếp nhận khám chữa bệnh liên tục tất cả các ngày trong tuần:
          <ul style={{ paddingLeft: 20, marginTop: 6 }}>
            <li><strong>Khám hành chính:</strong> 06:30 - 17:00 (Thứ 2 đến Chủ Nhật).</li>
            <li><strong>Khám ngoài giờ:</strong> 17:00 - 21:00 (Các ngày trong tuần và cuối tuần).</li>
            <li><strong>Khoa Cấp Cứu & Hồi sức:</strong> Tiếp nhận 24/24 tất cả các ngày trong năm.</li>
          </ul>
        </div>
      ),
    },
    {
      key: '5',
      label: 'Bệnh viện hỗ trợ những hình thức thanh toán nào?',
      children: (
        <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7 }}>
          Bệnh viện hỗ trợ thanh toán viện phí đa dạng và tiện lợi: Quét mã VietQR chuẩn NAPAS 247, Thẻ ATM/Visa/MasterCard qua POS, Ví điện tử (Momo, ZaloPay, VNPay) và tiền mặt tại quầy viện phí hoặc Kiosk thông minh.
        </div>
      ),
    },
  ];

  return (
    <div className="booking-page-container" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PatientPortalHeader />

      {/* Hero Banner Hướng Dẫn */}
      <section
        style={{
          background: '#f0f9ff',
          padding: '46px 20px 38px',
          textAlign: 'center',
          borderBottom: '1px solid #bae6fd',
        }}
      >
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <Tag color="cyan" style={{ padding: '3px 14px', borderRadius: 20, fontWeight: 700, fontSize: 12.5, marginBottom: 12 }}>
            CẨM NANG NGƯỜI BỆNH • TIỆN LỢI & KHÔNG CHỜ ĐỢI
          </Tag>
          <Title level={1} style={{ color: '#0c4a6e', fontWeight: 900, fontSize: 'clamp(26px, 3.8vw, 36px)', margin: '0 0 14px' }}>
            Hướng Dẫn Quy Trình Đặt Khám & Thăm Khám
          </Title>
          <Paragraph style={{ color: '#475569', fontSize: 15.5, maxWidth: 700, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Trải nghiệm khám chữa bệnh văn minh, không chen lấn với quy trình 4 bước đặt lịch trực tuyến, tiếp nhận tự động qua mã QR tại Kiosk D-Medical.
          </Paragraph>

          <Button
            type="primary"
            size="large"
            icon={<CalendarOutlined />}
            style={{ backgroundColor: '#0284c7', borderRadius: 12, fontWeight: 700, height: 48, padding: '0 28px' }}
            onClick={() => navigate('/booking')}
          >
            Bắt Đầu Đặt Lịch Khám Ngay
          </Button>
        </div>
      </section>

      {/* Nội dung chính */}
      <main style={{ maxWidth: 1480, width: '95%', margin: '0 auto', padding: '40px 16px' }}>
        {/* Quy trình 4 bước */}
        <section style={{ marginBottom: 54 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={2} style={{ color: '#0f172a', fontWeight: 900, margin: '0 0 8px' }}>
              4 Bước Thăm Khám Nhanh Chóng
            </Title>
            <Paragraph style={{ color: '#64748b', fontSize: 15 }}>
              Tiết kiệm đến 80% thời gian chờ đợi so với hình thức bốc số truyền thống
            </Paragraph>
          </div>

          <Row gutter={[20, 20]}>
            {stepsData.map((step, idx) => (
              <Col xs={24} sm={12} lg={6} key={idx}>
                <Card
                  bordered={false}
                  style={{
                    borderRadius: 18,
                    height: '100%',
                    background: '#ffffff',
                    border: '1.5px solid #bae6fd',
                    boxShadow: '0 6px 20px rgba(2, 132, 199, 0.06)',
                  }}
                  bodyStyle={{ padding: 22 }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: '#e0f2fe',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 14,
                      fontWeight: 900,
                      fontSize: 18,
                    }}
                  >
                    0{idx + 1}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15.5, color: '#0f172a', marginBottom: 8, lineHeight: 1.35 }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                    {step.detail}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* Giấy tờ cần chuẩn bị & Chính sách BHYT */}
        <section style={{ marginBottom: 54 }}>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 18,
                  height: '100%',
                  background: '#ffffff',
                  border: '1px solid #bae6fd',
                  boxShadow: '0 6px 20px rgba(2, 132, 199, 0.06)',
                }}
                bodyStyle={{ padding: 24 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <IdcardOutlined style={{ fontSize: 24, color: '#0284c7' }} />
                  <Title level={3} style={{ margin: 0, color: '#0369a1', fontWeight: 800 }}>
                    Giấy Tờ Cần Chuẩn Bị
                  </Title>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: '#334155' }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <CheckCircleFilled style={{ color: '#16a34a', marginTop: 3 }} />
                    <span><strong>Mã QR tiếp nhận:</strong> Lưu trên điện thoại hoặc in từ màn hình xác nhận.</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <CheckCircleFilled style={{ color: '#16a34a', marginTop: 3 }} />
                    <span><strong>CCCD gắn chip hoặc VNeID:</strong> Để đối soát thông tin bệnh nhân nhanh.</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <CheckCircleFilled style={{ color: '#16a34a', marginTop: 3 }} />
                    <span><strong>Thẻ BHYT hoặc VssID:</strong> Được hưởng chiết khấu BHYT trực tiếp.</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <CheckCircleFilled style={{ color: '#16a34a', marginTop: 3 }} />
                    <span><strong>Hồ sơ cũ & Toa thuốc:</strong> Giúp bác sĩ nắm rõ tiền sử điều trị.</span>
                  </div>
                </div>
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
                  boxShadow: '0 6px 20px rgba(2, 132, 199, 0.06)',
                }}
                bodyStyle={{ padding: 24 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <EnvironmentOutlined style={{ fontSize: 24, color: '#0284c7' }} />
                  <Title level={3} style={{ margin: 0, color: '#0369a1', fontWeight: 800 }}>
                    Sơ Đồ Khoa Phòng & Chỉ Dẫn
                  </Title>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: '#334155' }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Tag color="blue" style={{ fontWeight: 800 }}>KHU A</Tag>
                    <span>Sảnh đón tiếp, Kiosk check-in QR, Khoa Cấp cứu 24/7, Khoa Khám bệnh tổng quát.</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Tag color="cyan" style={{ fontWeight: 800 }}>KHU B</Tag>
                    <span>Khoa Nội Tổng Hợp, Khoa Tim Mạch, Khoa Tiêu Hóa & Nội soi kỹ thuật cao NBI.</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Tag color="purple" style={{ fontWeight: 800 }}>KHU C</Tag>
                    <span>Trung tâm Chẩn đoán hình ảnh (MRI 3.0T, CT 128 lát, X-quang) & Xét nghiệm tự động.</span>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </section>

        {/* Câu hỏi thường gặp (FAQ) */}
        <section style={{ marginBottom: 50 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Title level={2} style={{ color: '#0f172a', fontWeight: 900, margin: '0 0 8px' }}>
              <QuestionCircleOutlined style={{ color: '#0284c7', marginRight: 8 }} />
              Câu Hỏi Thường Gặp (FAQ)
            </Title>
            <Paragraph style={{ color: '#64748b', fontSize: 15 }}>
              Giải đáp nhanh các thắc mắc phổ biến về quy trình đặt khám và chính sách y tế
            </Paragraph>
          </div>

          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <Collapse
              defaultActiveKey={['1', '2']}
              items={faqItems}
              style={{
                borderRadius: 16,
                background: '#ffffff',
                border: '1.5px solid #bae6fd',
                boxShadow: '0 6px 20px rgba(2, 132, 199, 0.06)',
              }}
            />
          </div>
        </section>

        {/* CTA Banner */}
        <div
          style={{
            background: '#0284c7',
            color: '#ffffff',
            borderRadius: 20,
            padding: '34px 28px',
            textAlign: 'center',
            border: '1px solid #0369a1',
          }}
        >
          <Title level={2} style={{ color: '#ffffff', fontWeight: 900, margin: '0 0 10px' }}>
            Sẵn Sàng Thăm Khám Sức Khỏe Cho Bạn & Gia Đình?
          </Title>
          <Paragraph style={{ color: '#e0f2fe', fontSize: 15, maxWidth: 640, margin: '0 auto 22px' }}>
            Chủ động chọn Bác sĩ và giờ khám ngay trên website để nhận ngay Mã Tiếp Nhận QR Code tiện lợi.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            style={{ backgroundColor: '#ffffff', color: '#0284c7', fontWeight: 800, borderRadius: 12, height: 46, padding: '0 30px' }}
            onClick={() => navigate('/booking')}
          >
            Đặt Khám Ngay Bây Giờ
          </Button>
        </div>
      </main>

      <PatientPortalFooter />
    </div>
  );
};
