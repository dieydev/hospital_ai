# Quy tắc Thiết kế & Giao diện Dự án Hospital AI (Design Rules)

## 🎨 Bảng Màu Chuẩn Bắt Buộc (Strict Medical Color Palette)
Tất cả các màn hình Web Admin, Mobile Patient App, Thống kê, Báo cáo và Component từ nay về sau BẮT BUỘC tuân thủ đúng hệ màu Y tế Số (Modern Medical AI Theme) dưới đây:

### 1. Palette Tokens:
- **Primary Color (Nút bấm, Link, Active, Accent)**: `#0284c7` (Sky 600)
- **Primary Dark (Tiêu đề, Header, Highlight)**: `#0369a1` (Sky 700)
- **Background Gradient (Trang web)**: `linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #e2e8f0 100%)`
- **Background Soft Light**: `#f0f9ff`
- **Card Background**: `#ffffff` (Pure White)
- **Border Color**: `#bae6fd` (Sky 200)
- **Text Main / Headings**: `#0f172a` (Slate 900)
- **Text Sub-label / Form Label**: `#334155` (Slate 700)
- **Text Muted / Secondary**: `#64748b` (Slate 500)
- **Text Placeholder / Disabled**: `#94a3b8` (Slate 400)
- **Card Box Shadow**: `0 10px 30px rgba(2, 132, 199, 0.1)`

### 2. Yêu cầu Áp dụng:
- Giữ nguyên sự đồng bộ 100% giữa Web Admin React và Mobile Patient App Flutter.
- Không tự ý thay đổi tone màu sẫm đen tối mờ hoặc dùng các màu neon không đúng bảng màu trên.
