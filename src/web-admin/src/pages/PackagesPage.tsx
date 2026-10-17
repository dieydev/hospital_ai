import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Typography, Input, Tag, Button, Modal, Divider } from 'antd';
import {
  SearchOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  InfoCircleOutlined,
  UserOutlined,
  AlertOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { PatientPortalHeader } from '../components/PatientPortalHeader';
import { PatientPortalFooter } from '../components/PatientPortalFooter';
import { CountUpNumber } from '../components/CountUpNumber';
import { HEALTH_PACKAGES_CATALOG, HealthPackageOption } from '../data/medicalCatalogs';
import './PatientBookingPage.css';

const { Title, Paragraph, Text } = Typography;

export const PackagesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [detailModalPackage, setDetailModalPackage] = useState<HealthPackageOption | null>(null);

  const categories = [
    { key: 'all', label: 'Tất Cả Gói Khám' },
    { key: 'Tổng Quát', label: 'Gói Tổng Quát' },
    { key: 'VIP & Toàn Diện', label: 'VIP Toàn Diện' },
    { key: 'Tim Mạch', label: 'Tim Mạch & Đột Quỵ' },
    { key: 'Tiêu Hóa', label: 'Tiêu Hóa & Gan Mật' },
    { key: 'Hô Hấp', label: 'Hô Hấp & Phổi' },
    { key: 'Phụ Khoa', label: 'Sức Khỏe Phụ Nữ' },
  ];

  const filteredPackages = HEALTH_PACKAGES_CATALOG.filter((pkg) => {
    const matchCat = selectedCategory === 'all' || pkg.category === selectedCategory;
    const matchSearch =
      !searchKeyword ||
      pkg.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      pkg.recommendedFor.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      pkg.category.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      pkg.items.some((it) => it.toLowerCase().includes(searchKeyword.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="booking-page-container" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PatientPortalHeader />

      {/* Hero Banner Gói Khám */}
      <section
        style={{
          background: '#f0f9ff',
          padding: '48px 20px 40px',
          textAlign: 'center',
          borderBottom: '1px solid #bae6fd',
        }}
      >
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <Tag color="cyan" style={{ padding: '3px 14px', borderRadius: 20, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
            CHỦ ĐỘNG TẦM SOÁT • PHÒNG NGỪA BỆNH TẬT
          </Tag>
          <Title level={1} style={{ color: '#0c4a6e', fontWeight: 900, fontSize: 'clamp(28px, 4vw, 38px)', margin: '0 0 14px' }}>
            Các Gói Khám Sức Khỏe & Tầm Soát Toàn Diện
          </Title>
          <Paragraph style={{ color: '#475569', fontSize: 16, maxWidth: 740, margin: '0 auto 26px', lineHeight: 1.65 }}>
            Được xây dựng khoa học bởi Hội đồng Y khoa D-Medical, giúp bạn và gia đình kiểm tra toàn diện, phát hiện sớm các nguy cơ tiềm ẩn trước khi bệnh có biểu hiện ra ngoài.
          </Paragraph>

          {/* Ô Tìm kiếm gói khám */}
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#0284c7', fontSize: 18 }} />}
              placeholder="Tìm theo tên gói, xét nghiệm, đối tượng, bệnh lý..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
              size="large"
              style={{
                borderRadius: 30,
                border: '1.5px solid #bae6fd',
                boxShadow: '0 8px 24px rgba(2, 132, 199, 0.08)',
                height: 50,
                fontSize: 15,
              }}
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 16px 50px' }}>
        {/* 4 Thống kê Gói Khám */}
        <Row gutter={[16, 16]} style={{ marginBottom: 36 }}>
          {[
            { end: 15, suffix: '%', label: 'Ưu Đãi Đặt Online', sub: 'Tiết kiệm chi phí so với khám lẻ', color: '#e11d48' },
            { end: 38, suffix: '+', label: 'Danh Mục Cận Lâm Sàng', sub: 'Xét nghiệm máu, siêu âm, MRI, CT', color: '#0284c7' },
            { end: 100, suffix: '%', label: 'Bác Sĩ CKII Trực Tiếp Tư Vấn', sub: 'Giải thích chi tiết kết quả 1-1', color: '#059669' },
            { end: 45, suffix: ' Phút', label: 'Trả Kết Quả Xét Nghiệm', sub: 'Đồng bộ trực tuyến lên hồ sơ điện tử', color: '#d97706' },
          ].map((stat, idx) => (
            <Col xs={12} sm={12} md={6} key={idx}>
              <Card
                className="about-stat-card"
                bordered={false}
                style={{
                  borderRadius: 16,
                  textAlign: 'center',
                  background: '#ffffff',
                  border: '1px solid #bae6fd',
                  boxShadow: '0 4px 16px rgba(2, 132, 199, 0.05)',
                  height: '100%',
                  padding: '12px 8px',
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 900, color: stat.color, marginBottom: 2 }}>
                  <CountUpNumber end={stat.end} suffix={stat.suffix} duration={1800} />
                </div>
                <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0f172a', marginBottom: 2 }}>{stat.label}</div>
                <div style={{ fontSize: 11.5, color: '#64748b' }}>{stat.sub}</div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28, justifyContent: 'center' }}>
          {categories.map((cat) => (
            <Button
              key={cat.key}
              type={selectedCategory === cat.key ? 'primary' : 'default'}
              shape="round"
              size="middle"
              onClick={() => setSelectedCategory(cat.key)}
              style={{
                fontWeight: 700,
                backgroundColor: selectedCategory === cat.key ? '#0284c7' : '#ffffff',
                borderColor: selectedCategory === cat.key ? '#0284c7' : '#cbd5e1',
                color: selectedCategory === cat.key ? '#ffffff' : '#334155',
                boxShadow: selectedCategory === cat.key ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none',
              }}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Count */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ fontSize: 15, color: '#475569' }}>
            Hiển thị <span style={{ color: '#0284c7' }}>{filteredPackages.length}</span> gói khám sức khỏe
          </Text>
        </div>

        {/* Package Grid Cards */}
        <Row gutter={[24, 24]}>
          {filteredPackages.map((pkg) => (
            <Col xs={24} md={12} lg={8} key={pkg.id}>
              <Card
                className="about-stat-card"
                bordered={false}
                style={{
                  borderRadius: 20,
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  position: 'relative',
                }}
                styles={{
                  body: {
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                  },
                }}
              >
                {/* Badge Tag */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <Tag
                    color={pkg.badgeColor}
                    style={{
                      borderRadius: 12,
                      fontWeight: 800,
                      padding: '3px 12px',
                      fontSize: 11.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    {pkg.badge}
                  </Tag>
                  {pkg.duration && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b' }}>
                      <ClockCircleOutlined style={{ color: '#0284c7' }} />
                      <span>{pkg.duration}</span>
                    </div>
                  )}
                </div>

                {/* Package Title */}
                <Title level={4} style={{ color: '#0f172a', fontWeight: 900, margin: '0 0 8px', fontSize: 17, lineHeight: 1.4 }}>
                  {pkg.name}
                </Title>

                {/* Recommended For */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    fontSize: 12.5,
                    color: '#475569',
                    marginBottom: 16,
                  }}
                >
                  <UserOutlined style={{ color: '#0284c7', marginRight: 6 }} />
                  {pkg.recommendedFor}
                </div>

                {/* Items Checklist */}
                <div style={{ marginBottom: 18, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>
                    Danh mục nổi bật ({pkg.items.length} hạng mục):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {pkg.items.slice(0, 4).map((it, iIdx) => (
                      <div key={iIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12.5, color: '#334155' }}>
                        <CheckCircleFilled style={{ color: '#10b981', marginTop: 2, flexShrink: 0 }} />
                        <span style={{ lineHeight: 1.4 }}>{it}</span>
                      </div>
                    ))}
                    {pkg.items.length > 4 && (
                      <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 700, paddingLeft: 18 }}>
                        + Thêm {pkg.items.length - 4} danh mục xét nghiệm khác...
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing Box */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: '#f0f9ff',
                    border: '1.5px solid #bae6fd',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Giá niêm yết:</span>
                    <span style={{ fontSize: 13, textDecoration: 'line-through', color: '#94a3b8' }}>
                      {pkg.originalPrice.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0369a1' }}>Giá ưu đãi trực tuyến:</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: '#e11d48' }}>
                      {pkg.discountPrice.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 4, borderTop: '1px dashed #bae6fd' }}>
                    <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>Hỗ trợ trừ BHYT tối đa:</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#059669' }}>
                      -{pkg.bhytSupport.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                  <Button
                    style={{ flex: 1, borderRadius: 10, fontWeight: 700, borderColor: '#bae6fd', color: '#0284c7' }}
                    onClick={() => setDetailModalPackage(pkg)}
                    icon={<InfoCircleOutlined />}
                  >
                    Xem Chi Tiết
                  </Button>
                  <Button
                    type="primary"
                    style={{ flex: 1.4, borderRadius: 10, fontWeight: 700, backgroundColor: '#0284c7' }}
                    onClick={() => navigate(`/booking?mode=byPackage&packageId=${pkg.id}`)}
                    icon={<CalendarOutlined />}
                  >
                    Đặt Gói Này
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </main>

      {/* Detail Package Modal */}
      <Modal
        open={Boolean(detailModalPackage)}
        onCancel={() => setDetailModalPackage(null)}
        footer={null}
        width={720}
        centered
        styles={{
          content: { borderRadius: 20, padding: 28 },
        }}
      >
        {detailModalPackage && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Tag color={detailModalPackage.badgeColor} style={{ fontWeight: 800, borderRadius: 12, padding: '3px 12px' }}>
                {detailModalPackage.badge}
              </Tag>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                <ClockCircleOutlined style={{ color: '#0284c7' }} /> Thời gian ước tính: <strong>{detailModalPackage.duration || '2 - 3 giờ'}</strong>
              </div>
            </div>

            <Title level={3} style={{ color: '#0c4a6e', fontWeight: 900, margin: '0 0 10px' }}>
              {detailModalPackage.name}
            </Title>

            <div style={{ color: '#475569', fontSize: 14, marginBottom: 16 }}>
              Phù hợp cho: <strong>{detailModalPackage.recommendedFor}</strong>
            </div>

            <Divider style={{ margin: '14px 0' }} />

            {/* Chi tiết danh mục */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <UnorderedListOutlined style={{ color: '#0284c7' }} /> Danh mục khám & xét nghiệm chi tiết:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto', paddingRight: 6 }}>
                {detailModalPackage.items.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      fontSize: 13.5,
                      color: '#334155',
                      padding: '6px 10px',
                      background: '#f8fafc',
                      borderRadius: 8,
                    }}
                  >
                    <CheckCircleFilled style={{ color: '#10b981', marginTop: 3, flexShrink: 0 }} />
                    <span>{it}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hướng dẫn chuẩn bị */}
            {detailModalPackage.preparation && (
              <div style={{ marginBottom: 20, background: '#fffbeb', border: '1px solid #fde68a', padding: 14, borderRadius: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#b45309', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertOutlined /> Lưu ý chuẩn bị trước khi đến khám:
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, color: '#92400e', fontSize: 12.5, lineHeight: 1.6 }}>
                  {detailModalPackage.preparation.map((prep, pIdx) => (
                    <li key={pIdx}>{prep}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Giá & Nút đặt */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 18px',
                background: '#f0f9ff',
                borderRadius: 14,
                border: '1.5px solid #bae6fd',
                marginBottom: 20,
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Chi phí trọn gói:</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#e11d48' }}>
                    {detailModalPackage.discountPrice.toLocaleString('vi-VN')} đ
                  </span>
                  <span style={{ fontSize: 13, textDecoration: 'line-through', color: '#94a3b8' }}>
                    {detailModalPackage.originalPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
              <Tag color="green" style={{ fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>
                BHYT hỗ trợ tới {detailModalPackage.bhytSupport.toLocaleString('vi-VN')} đ
              </Tag>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Button size="large" style={{ flex: 1, borderRadius: 12, fontWeight: 700 }} onClick={() => setDetailModalPackage(null)}>
                Đóng
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<CalendarOutlined />}
                style={{ flex: 2, borderRadius: 12, fontWeight: 800, backgroundColor: '#0284c7' }}
                onClick={() => {
                  setDetailModalPackage(null);
                  navigate(`/booking?mode=byPackage&packageId=${detailModalPackage.id}`);
                }}
              >
                Đặt Gói Khám Này Ngay
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <PatientPortalFooter />
    </div>
  );
};
