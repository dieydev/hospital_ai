# BÁO CÁO TIẾN ĐỘ THỰC HIỆN ĐỀ TÀI TỐT NGHIỆP

**Tên đề tài:** Hệ thống Quản lý Quá trình Khám chữa bệnh & Hồ sơ Bệnh án Điện tử (EMR) Tích hợp Trí tuệ Nhân tạo cho Bệnh viện Đa khoa  
**Sinh thực hiện:** Nguyễn Thành Duy  
**Ngày báo cáo:** 07/08/2026  
**Trạng thái chung:** **Đã hoàn thành ~95% khối lượng công việc**

---

## 📊 1. TỔNG QUAN TIẾN ĐỘ THỰC HIỆN

| STT | Hạng mục công việc | Tỷ lệ hoàn thành | Trạng thái | Ghi chú |
| :---: | :--- | :---: | :---: | :--- |
| 1 | Khảo sát quy trình y tế & Thiết kế CSDL | **100%** | 🟢 Hoàn thành | Đã chuẩn hóa bảng CSDL SQL Server |
| 2 | Kiến trúc Hệ thống Backend Microservices | **100%** | 🟢 Hoàn thành | Đã chuyển đổi từ Monolith sang Microservices + Docker |
| 3 | API Gateway & Phân quyền Security | **100%** | 🟢 Hoàn thành | YARP Reverse Proxy + Bearer JWT Token |
| 4 | Web Admin Portal (Bác sĩ, Lễ tân, QTV) | **95%** | 🟢 Hoàn thành | Đã hoàn thiện 12 màn hình nghiệp vụ chính |
| 5 | Mobile Patient App (Bệnh nhân) | **90%** | 🟢 Hoàn thành | Flutter UI + tích hợp gọi API |
| 6 | Đóng gói Docker & Docker Compose | **100%** | 🟢 Hoàn thành | 7 Containers hoạt động ổn định |
| 7 | Tích hợp Trợ lý Y tế AI (Google Gemini) | **90%** | 🟢 Hoàn thành | Hỗ trợ gợi ý phác đồ & chuẩn đoán ICD-10 |
| 8 | Viết Quyển Báo cáo Đồ án Tốt nghiệp | **85%** | 🟡 Đang hoàn thiện | Đã soạn thảo các chương 1-4 |

---

## 🛠️ 2. CHI TIẾT KẾT QUẢ ĐÃ ĐẠT ĐƯỢC

### 2.1. Kiến trúc Hệ thống Microservices & Docker
- Hệ thống đã được nâng cấp hoàn toàn sang kiến trúc **Microservices** hiện đại, vận hành độc lập qua **Docker Compose**:
  1. **`hospitalai-sqlserver`**: Container SQL Server 2022 lưu trữ dữ liệu y tế tập trung.
  2. **`hospitalai-api-gateway`**: Cổng API Gateway tập trung (sử dụng .NET 9 YARP) định tuyến request động trên port `5000`.
  3. **`hospitalai-identity-service`**: Microservice xử lý Đăng nhập, Đăng ký, Cấp Token JWT & Phân quyền (Port `5001`).
  4. **`hospitalai-patient-service`**: Microservice Quản lý Hồ sơ Bệnh nhân (Port `5002`).
  5. **`hospitalai-queue-service`**: Microservice Tiếp nhận Bệnh nhân & Cấp số hàng chờ tự động (Port `5003`).
  6. **`hospitalai-examination-service`**: Microservice Khám bệnh SOAP, ICD-10 & Kê đơn thuốc (Port `5004`).
  7. **`hospitalai-web-admin`**: Web Application đóng gói qua Nginx Web Server (Port `3000`).

### 2.2. Web Admin Portal (React + Vite + TypeScript + Ant Design)
- Đã hoàn thiện hệ thống giao diện chuẩn y tế số (Strict Medical Palette: `#0284c7`, `#0369a1`, `#bae6fd`):
  - **Trang Đăng nhập (LoginPage):** Đăng nhập JWT Bearer Token, lưu phiên làm việc.
  - **Trang Tổng quan (DashboardPage):** Biểu đồ thống kê lượt khám, hàng chờ, doanh thu & tình hình bệnh nhân.
  - **Trang Tiếp nhận & Cấp số (ReceptionPage):** Tìm kiếm bệnh nhân theo CCCD/Mã BN, cấp số thứ tự tự động theo phòng khám.
  - **Trang Quản lý Bệnh nhân (PatientsPage):** Thêm mới, cập nhật, xóa, tra cứu hồ sơ bệnh nhân.
  - **Trang Phòng khám SOAP (ExaminationsPage):** Nhập sinh hiệu (Mạch, Huyết áp, SpO2), Ghi nhận SOAP (Subjective, Objective, Assessment, Plan), gợi ý ICD-10 và kê đơn thuốc.
  - **Trang Hồ sơ bệnh án điện tử (MedicalRecordsPage):** Tra cứu EMR toàn bộ lịch sử khám chữa bệnh.
  - **Trang Quản lý Viện phí (BillingPage):** Tính tổng tiền khám, tiền thuốc, dịch vụ CLS.
  - **Trang Trợ lý AI Y tế (AIAssistantPage):** Chat hỏi đáp phác đồ điều trị, tra cứu thông tin dược phẩm.

### 2.3. Mobile Patient App (Flutter)
- Giao diện thân thiện dành cho bệnh nhân:
  - Đăng ký/Đăng nhập tài khoản bệnh nhân.
  - Xem danh mục phòng khám & đăng ký lấy số thứ tự khám trực tuyến.
  - Theo dõi tiến trình hàng chờ theo thời gian thực.
  - Tra cứu hồ sơ khám bệnh & đơn thuốc điện tử.

---

## 📋 3. KẾ HOẠCH BÀN GIAO & CÔNG VIỆC TIẾP THEO

1. **Rà soát Quyển Báo cáo:** Cập nhật các sơ đồ kiến trúc Microservices và luồng dữ liệu mới vào quyển Word báo cáo đồ án (`docs/15_NguyenThanhDuy.docx`).
2. **Chạy Thử nghiệm Toàn diện (System Integration Testing):** Kiểm thử tải kết nối giữa Web Admin, Mobile App và 4 Microservices qua Docker Gateway.
3. **Chuẩn bị Slide Thuyết minh:** Soạn thảo slide báo cáo bảo vệ Đồ án Tốt nghiệp.
