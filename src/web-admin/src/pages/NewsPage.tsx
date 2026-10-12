import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Typography, Input, Tag, Button, Modal } from 'antd';
import {
  SearchOutlined,
  CalendarOutlined,
  EyeOutlined,
  ArrowRightOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PatientPortalHeader } from '../components/PatientPortalHeader';
import { PatientPortalFooter } from '../components/PatientPortalFooter';

const { Title, Paragraph } = Typography;

interface NewsArticle {
  id: string;
  title: string;
  category: string;
  categoryColor: string;
  date: string;
  author: string;
  views: number;
  summary: string;
  content: string;
  image: string;
}

const ARTICLES_DATA: NewsArticle[] = [
  {
    id: 'news-01',
    title: 'D-Medical Tiên Phong Áp Dụng Tiếp Nhận Bệnh Nhân Bằng QR Code & Kiosk Không Chạm',
    category: 'Hoạt động Bệnh viện',
    categoryColor: 'blue',
    date: '10/10/2026',
    author: 'Ban Truyền Thông D-Medical',
    views: 1420,
    summary: 'Người bệnh đặt lịch trước chỉ cần quét mã QR tại Kiosk tầng 1 để nhận ngay số thứ tự ưu tiên và vào thẳng phòng khám, giảm 80% thời gian chờ đợi.',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80',
    content: `Nhằm mang lại trải nghiệm y tế số hiện đại và tiện lợi cho người dân, Bệnh viện Đa khoa D-Medical đã chính thức vận hành hệ thống Kiosk tự phục vụ thông minh tại tất cả các sảnh tiếp đón.\n\nNgười bệnh sau khi đăng ký lịch khám trực tuyến trên Cổng thông tin sẽ nhận được một Mã Tiếp Nhận QR Code duy nhất. Khi đến viện, chỉ cần đưa mã QR vào đầu đọc tại Kiosk, hệ thống sẽ tự động đối soát thông tin BHYT, in phiếu tiếp nhận và kết nối thẳng với phần mềm phòng khám của Bác sĩ.\n\nGiải pháp này giúp người bệnh không còn phải xếp hàng bốc số lấy phiếu truyền thống, giảm thiểu tối đa tình trạng tập trung đông người và rút ngắn thời gian làm thủ tục chỉ còn dưới 30 giây.`,
  },
  {
    id: 'news-02',
    title: 'Chính Sách BHYT Thông Tuyến 2026: Quyền Lợi & Danh Mục Thanh Toán Tại D-Medical',
    category: 'Bảo hiểm & BHYT',
    categoryColor: 'green',
    date: '08/10/2026',
    author: 'Phòng Kế Hoạch Tổng Hợp',
    views: 2850,
    summary: 'Bệnh viện hỗ trợ thanh toán BHYT thông tuyến toàn quốc cho mọi đối tượng có thẻ, bảo đảm quyền lợi tối đa theo danh mục quy định của Bộ Y Tế.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80',
    content: `Theo quy định thông tuyến khám chữa bệnh, người dân có thẻ Bảo hiểm Y tế (BHYT) trên toàn quốc khi đến thăm khám tại Bệnh viện Đa khoa D-Medical đều được hưởng đầy đủ quyền lợi hỗ trợ chi phí theo mức hưởng ghi trên thẻ mà không cần giấy chuyển tuyến.\n\nBệnh viện đã tích hợp hệ thống Giám định BHYT điện tử kết nối cổng BHXH Việt Nam, giúp tự động trừ viện phí hợp lệ ngay trên hóa đơn (bao gồm tiền khám, xét nghiệm máu, siêu âm, chụp X-quang, CT Scanner và tiền thuốc). Quý người bệnh vui lòng mang theo thẻ BHYT giấy hoặc xuất trình CCCD gắn chip / ứng dụng VssID khi đến khám.`,
  },
  {
    id: 'news-03',
    title: 'Tầm Soát Sớm Ung Thư Dạ Dày - Đại Tràng Bằng Công Nghệ Nội Soi NBI Nhuộm Màu',
    category: 'Y học thường thức',
    categoryColor: 'cyan',
    date: '05/10/2026',
    author: 'BS. CKII. Đinh Khắc Vương',
    views: 1980,
    summary: 'Công nghệ dải tần ánh sáng hẹp NBI phóng đại gấp 100 lần, giúp phát hiện các tổn thương tiền ung thư biểu mô đường tiêu hóa từ kích thước vài milimet.',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80',
    content: `Ung thư đường tiêu hóa (dạ dày, thực quản, đại tràng) là một trong những bệnh lý ác tính phổ biến nhất tại Việt Nam. Đáng chú ý, ở giai đoạn sớm, bệnh hầu như không có triệu chứng rõ ràng.\n\nTại Khoa Tiêu Hóa D-Medical, hệ thống máy nội soi NBI Olympus EVIS X1 sử dụng ánh sáng đặc biệt bước sóng 415nm và 540nm giúp hiển thị rõ mạng lưới vi mạch và cấu trúc bề mặt niêm mạc. Qua đó, bác sĩ có thể chẩn đoán sớm các polyp loạn sản hoặc ung thư giai đoạn sớm, thực hiện can thiệp cắt polyp hoặc cắt hớt niêm mạc ESD ngay trong quá trình nội soi mà không cần phẫu thuật mở.`,
  },
  {
    id: 'news-04',
    title: 'Phòng Ngừa Đột Quỵ & Biến Chứng Tim Mạch Trong Mùa Lạnh Cho Người Cao Tuổi',
    category: 'Y học thường thức',
    categoryColor: 'cyan',
    date: '02/10/2026',
    author: 'TS. BS. Huỳnh Quốc Dũng',
    views: 1650,
    summary: 'Thời tiết lạnh khiến mạch máu co thắt đột ngột, làm tăng huyết áp và nguy cơ nhồi máu cơ tim, đột quỵ não. Những lời khuyên y khoa cần nhớ.',
    image: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=600&auto=format&fit=crop&q=80',
    content: `Nhiệt độ thay đổi đột ngột là yếu tố kích hoạt các cơn tăng huyết áp kịch phát và hình thành cục máu đông. Bác sĩ khuyến cáo người có tiền sử tăng huyết áp, rối loạn mỡ máu hoặc tiểu đường cần:\n1. Không thức dậy và ra khỏi giường quá nhanh vào sáng sớm.\n2. Uống đủ nước ấm, giữ ấm vùng đầu, cổ và bàn chân.\n3. Tuân thủ uống thuốc hạ áp theo đúng đơn bác sĩ, không tự ý ngưng thuốc khi thấy huyết áp bình thường.\n4. Đi khám tầm soát mạch não bằng chụp MRI 3.0 Tesla định kỳ mỗi năm một lần.`,
  },
  {
    id: 'news-05',
    title: 'Ưu Đãi 15% Các Gói Khám Sức Khỏe Gia Đình & Tầm Soát Tổng Quát Toàn Diện',
    category: 'Gói khám & Ưu đãi',
    categoryColor: 'orange',
    date: '28/09/2026',
    author: 'Trung Tâm Chăm Sóc Sức Khỏe D-Medical',
    views: 2100,
    summary: 'Chương trình tri ân sức khỏe gia đình: Giảm 15% gói tầm soát tim mạch, tiểu đường và ung thư định kỳ khi đăng ký theo nhóm từ 2 người trở lên.',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80',
    content: `Khám sức khỏe định kỳ mỗi 6 - 12 tháng là chìa khóa vàng giúp phát hiện sớm các nguy cơ tiềm ẩn trước khi bệnh khởi phát. D-Medical trân trọng gửi đến quý khách hàng gói ưu đãi chăm sóc sức khỏe gia đình trọn gói, bao gồm đầy đủ danh mục xét nghiệm sinh hóa, siêu âm ổ bụng tổng quát, đo điện tim và tư vấn chuyên sâu cùng Bác sĩ Chuyên khoa II.`,
  },
  {
    id: 'news-06',
    title: 'D-Medical Duy Trì Lịch Trực Phòng Khám Ngoài Giờ Đến 21:00 & Cấp Cứu 24/7',
    category: 'Hoạt động Bệnh viện',
    categoryColor: 'blue',
    date: '25/09/2026',
    author: 'Ban Giám Đốc Bệnh Viện',
    views: 1320,
    summary: 'Tạo điều kiện thuận lợi cho người đi làm và học sinh thăm khám ngoài giờ hành chính mà vẫn được hưởng đầy đủ dịch vụ cận lâm sàng và BHYT.',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80',
    content: `Thấu hiểu nhu cầu thăm khám của người dân bận rộn trong giờ hành chính, Bệnh viện Đa khoa D-Medical tiếp tục mở rộng khung giờ khám từ 17:00 đến 21:00 vào các ngày trong tuần và trọn vẹn cả ngày Thứ Bảy, Chủ Nhật. Khoa Cấp cứu và Đơn nguyên Hồi sức tích cực luôn duy trì trực chiến 24/24 sẵn sàng tiếp nhận xử lý mọi ca bệnh khẩn cấp.`,
  },
];

export const NewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const categories = ['Tất cả', 'Hoạt động Bệnh viện', 'Y học thường thức', 'Bảo hiểm & BHYT', 'Gói khám & Ưu đãi'];

  const filteredArticles = ARTICLES_DATA.filter((item) => {
    const matchCategory = activeCategory === 'Tất cả' || item.category === activeCategory;
    const matchSearch =
      !searchKeyword ||
      item.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="booking-page-container" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PatientPortalHeader />

      {/* Hero Banner Tin Tức */}
      <section
        style={{
          background: 'linear-gradient(180deg, #dcf0fa 0%, #ebf7fd 55%, #ffffff 100%)',
          padding: '44px 20px 36px',
          textAlign: 'center',
          borderBottom: '1px solid #bae6fd',
        }}
      >
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <Tag color="cyan" style={{ padding: '3px 12px', borderRadius: 20, fontWeight: 700, fontSize: 12.5, marginBottom: 12 }}>
            TRUYỀN THÔNG & CẨM NANG Y KHOA CHÍNH THỐNG
          </Tag>
          <Title level={1} style={{ color: '#0c4a6e', fontWeight: 900, fontSize: 'clamp(26px, 3.8vw, 36px)', margin: '0 0 12px' }}>
            Tin Tức & Kiến Thức Sức Khỏe D-Medical
          </Title>
          <Paragraph style={{ color: '#475569', fontSize: 15.5, maxWidth: 660, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Cập nhật những tiến bộ y khoa, hướng dẫn phòng ngừa bệnh tật và chính sách BHYT mới nhất từ Hội đồng Chuyên môn Bệnh viện Đa khoa D-Medical.
          </Paragraph>

          {/* Ô Tìm kiếm bài viết */}
          <div style={{ maxWidth: 540, margin: '0 auto' }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#0284c7', fontSize: 18 }} />}
              placeholder="Tìm kiếm bài viết, triệu chứng, bảo hiểm..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
              size="large"
              style={{
                borderRadius: 30,
                border: '1.5px solid #bae6fd',
                boxShadow: '0 6px 20px rgba(2, 132, 199, 0.08)',
                height: 48,
              }}
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '36px 16px' }}>
        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32, justifyContent: 'center' }}>
          {categories.map((cat) => (
            <Button
              key={cat}
              type={activeCategory === cat ? 'primary' : 'default'}
              style={{
                borderRadius: 20,
                fontWeight: 700,
                backgroundColor: activeCategory === cat ? '#0284c7' : '#ffffff',
                borderColor: activeCategory === cat ? '#0284c7' : '#bae6fd',
                color: activeCategory === cat ? '#ffffff' : '#334155',
              }}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Danh sách bài viết */}
        {filteredArticles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            Không tìm thấy bài viết nào phù hợp với từ khóa "{searchKeyword}".
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {filteredArticles.map((article) => (
              <Col xs={24} sm={12} lg={8} key={article.id}>
                <Card
                  hoverable
                  bordered={false}
                  style={{
                    borderRadius: 18,
                    overflow: 'hidden',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid #bae6fd',
                    boxShadow: '0 6px 20px rgba(2, 132, 199, 0.06)',
                  }}
                  bodyStyle={{ padding: 18, display: 'flex', flexDirection: 'column', flex: 1 }}
                  cover={
                    <div style={{ height: 190, overflow: 'hidden', position: 'relative' }}>
                      <img
                        src={article.image}
                        alt={article.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                      />
                      <Tag
                        color={article.categoryColor}
                        style={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          fontWeight: 700,
                          borderRadius: 8,
                          margin: 0,
                        }}
                      >
                        {article.category}
                      </Tag>
                    </div>
                  }
                  onClick={() => setSelectedArticle(article)}
                >
                  <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span><CalendarOutlined /> {article.date}</span>
                    <span><EyeOutlined /> {article.views} lượt xem</span>
                  </div>

                  <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', lineHeight: 1.4, marginBottom: 10, flex: 1 }}>
                    {article.title}
                  </div>

                  <Paragraph
                    ellipsis={{ rows: 3 }}
                    style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 16 }}
                  >
                    {article.summary}
                  </Paragraph>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 10, marginTop: 'auto' }}>
                    <span style={{ fontSize: 12, color: '#0284c7', fontWeight: 600 }}>
                      <UserOutlined /> {article.author}
                    </span>
                    <span style={{ color: '#0284c7', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Đọc tiếp <ArrowRightOutlined style={{ fontSize: 11 }} />
                    </span>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* CTA Đặt lịch */}
        <div
          style={{
            marginTop: 50,
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            borderRadius: 20,
            padding: '32px 28px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(2, 132, 199, 0.25)',
          }}
        >
          <Title level={2} style={{ color: '#ffffff', fontWeight: 900, margin: '0 0 10px' }}>
            Bạn Cần Tư Vấn Sức Khỏe Hoặc Khám Bệnh?
          </Title>
          <Paragraph style={{ color: '#e0f2fe', fontSize: 15, maxWidth: 640, margin: '0 auto 20px' }}>
            Đội ngũ bác sĩ chuyên khoa D-Medical luôn sẵn sàng đồng hành cùng bạn. Đặt hẹn trực tuyến ngay hôm nay để được khám đúng giờ.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            style={{ backgroundColor: '#ffffff', color: '#0284c7', fontWeight: 800, borderRadius: 12, height: 46, padding: '0 28px' }}
            onClick={() => navigate('/booking')}
          >
            Đặt Lịch Khám Trực Tuyến Ngay
          </Button>
        </div>
      </main>

      {/* Modal Chi tiết Bài viết khi click */}
      <Modal
        open={Boolean(selectedArticle)}
        onCancel={() => setSelectedArticle(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedArticle(null)}>
            Đóng
          </Button>,
          <Button
            key="book"
            type="primary"
            style={{ backgroundColor: '#0284c7' }}
            onClick={() => {
              setSelectedArticle(null);
              navigate('/booking');
            }}
          >
            Đặt Khám Ngay
          </Button>,
        ]}
        width={760}
        destroyOnClose
      >
        {selectedArticle && (
          <div style={{ padding: '8px 4px' }}>
            <Tag color={selectedArticle.categoryColor} style={{ fontWeight: 700, borderRadius: 8, marginBottom: 8 }}>
              {selectedArticle.category}
            </Tag>
            <Title level={3} style={{ color: '#0f172a', fontWeight: 900, lineHeight: 1.35, margin: '4px 0 12px' }}>
              {selectedArticle.title}
            </Title>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#64748b', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
              <span>Tác giả: <strong>{selectedArticle.author}</strong></span>
              <span>Ngày đăng: {selectedArticle.date}</span>
              <span>Lượt đọc: {selectedArticle.views}</span>
            </div>

            <img
              src={selectedArticle.image}
              alt={selectedArticle.title}
              style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 12, marginBottom: 18 }}
            />

            <div style={{ fontSize: 14.5, color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {selectedArticle.content}
            </div>
          </div>
        )}
      </Modal>

      <PatientPortalFooter />
    </div>
  );
};
