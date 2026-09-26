# BÁO CÁO TIẾN ĐỘ THỰC HIỆN ĐỀ TÀI TỐT NGHIỆP

**Tên đề tài:** Hệ thống Quản lý Quá trình Khám chữa bệnh & Hồ sơ Bệnh án Điện tử (EMR) Tích hợp Trí tuệ Nhân tạo cho Bệnh viện Đa khoa Quốc tế D-Medical  
**Sinh viên thực hiện:** Nguyễn Thành Duy  
**Ngày cập nhật:** 26/09/2026  
**Trạng thái chung:** **Đã hoàn thành ~95% khối lượng công việc toàn dự án**

---

## 📊 1. TỔNG QUAN TIẾN ĐỘ THỰC HIỆN

| STT | Hạng mục công việc | Tỷ lệ hoàn thành | Trạng thái | Ghi chú |
| :---: | :--- | :---: | :---: | :--- |
| 1 | Khảo sát quy trình y tế & Thiết kế CSDL | **100%** | 🟢 Hoàn thành | Đã chuẩn hóa bảng CSDL SQL Server 2022 |
| 2 | Kiến trúc Hệ thống Backend Microservices | **100%** | 🟢 Hoàn thành | .NET 9 Microservices + Docker Compose 7 Containers |
| 3 | API Gateway & Phân quyền Security | **100%** | 🟢 Hoàn thành | YARP Reverse Proxy + Bearer JWT Token |
| 4 | Web Admin Portal (Bác sĩ, Lễ tân, Quản trị) | **95%** | 🟢 Hoàn thành | Đã hoàn thiện 13 màn hình nghiệp vụ chính |
| 5 | Mobile Patient App (Flutter Bệnh nhân) | **95%** | 🟢 Hoàn thành | Đầy đủ luồng Đặt khám, Hàng chờ, EMR, Viện phí, Nhắc thuốc |
| 6 | Đóng gói Docker & Docker Compose | **100%** | 🟢 Hoàn thành | 7 Containers hoạt động ổn định trên Docker Desktop |
| 7 | Tích hợp Trợ lý Y tế AI (Google Gemini) | **92%** | 🟢 Hoàn thành | Hỗ trợ gợi ý phác đồ SOAP, chuẩn đoán ICD-10 & tương tác thuốc |
| 8 | Viết Quyển Báo cáo Đồ án Tốt nghiệp | **85%** | 🟡 Đang hoàn thiện | Đã soạn thảo các chương 1-4, cập nhật các màn hình mới |

---

## 🛠️ 2. CHI TIẾT KẾT QUẢ ĐÃ ĐẠT ĐƯỢC

### 2.1. Kiến trúc Hệ thống Microservices & Docker
- Vận hành độc lập qua **Docker Compose**:
  1. **`hospitalai-sqlserver`**: Container SQL Server 2022 lưu trữ dữ liệu y tế tập trung.
  2. **`hospitalai-api-gateway`**: Cổng API Gateway tập trung (sử dụng .NET 9 YARP) định tuyến request động trên port `5000`.
  3. **`hospitalai-identity-service`**: Microservice xử lý Đăng nhập, Đăng ký, Cấp Token JWT & Phân quyền (Port `5001`).
  4. **`hospitalai-patient-service`**: Microservice Quản lý Hồ sơ Bệnh nhân (Port `5002`).
  5. **`hospitalai-queue-service`**: Microservice Tiếp nhận Bệnh nhân & Cấp số hàng chờ tự động (Port `5003`).
  6. **`hospitalai-examination-service`**: Microservice Khám bệnh SOAP, ICD-10 & Kê đơn thuốc (Port `5004`).
  7. **`hospitalai-web-admin`**: Web Application đóng gói qua Nginx Web Server (Port `3000`).

### 2.2. Web Admin Portal (React + Vite + TypeScript + Ant Design)
- Chuẩn hóa bộ nhận diện thương hiệu **Bệnh viện Quốc tế D-Medical** và Strict Medical Palette (`#0284c7`, `#0369a1`, `#bae6fd`):
  - **Trang Đăng nhập (LoginPage):** Đăng nhập JWT Bearer Token, hiển thị logo D-Medical sắc nét.
  - **Trang Tổng quan (DashboardPage):** Biểu đồ thống kê lượt khám, hàng chờ, doanh thu & tình hình bệnh nhân.
  - **Trang Tiếp nhận & Cấp số (ReceptionPage):** Tìm kiếm bệnh nhân theo CCCD/Mã BN, cấp số thứ tự tự động theo phòng khám.
  - **Trang Quản lý Bệnh nhân (PatientsPage):** Thêm mới, cập nhật, xóa, tra cứu hồ sơ bệnh nhân.
  - **Trang Phòng khám SOAP (ExaminationsPage):** Nhập sinh hiệu (Mạch, Huyết áp, SpO2), Ghi nhận SOAP (Subjective, Objective, Assessment, Plan), gợi ý ICD-10 và kê đơn thuốc.
  - **Trang Hồ sơ bệnh án điện tử (MedicalRecordsPage):** Tra cứu EMR toàn bộ lịch sử khám chữa bệnh.
  - **Trang Quản lý Lịch hẹn (AppointmentsPage):** Tiếp nhận và duyệt lịch hẹn trực tuyến từ Mobile App.
  - **Trang Quản lý Viện phí (BillingPage):** Tính tổng tiền khám, tiền thuốc, dịch vụ CLS, xuất hóa đơn QR.
  - **Trang Trợ lý AI Y tế (AIAssistantPage):** Chat hỏi đáp phác đồ điều trị, tra cứu thông tin dược phẩm.
  - **Trang Báo cáo & Nhật ký (ReportsPage, AuditLogPage, CatalogsPage).**

### 2.3. Mobile Patient App (Flutter)
- Ứng dụng di động y tế số hoàn chỉnh dành cho Bệnh nhân:
  - **Nhận diện thương hiệu D-Medical:** Tích hợp bộ logo vector chuẩn y tế, icon ứng dụng Android Launcher đồng bộ.
  - **Màn hình Giới thiệu Onboarding & Phân luồng:** Giới thiệu 3 trụ cột (Đặt khám 4.0, Bệnh án EMR, Trợ lý AI); tích hợp khảo sát ban đầu *"Bạn đã từng khám bệnh tại Bệnh viện D-Medical chưa?"* phân luồng sang Đăng nhập (bệnh nhân cũ để đồng bộ EMR) hoặc Đăng ký (bệnh nhân mới để cấp mã BN).
  - **Bốc số thứ tự & Hàng chờ Online (QueueStatusView):** Theo dõi số người đang chờ phía trước thời gian thực.
  - **Bệnh án điện tử EMR (MedicalHistoryView):** Xem lịch sử các lần khám, chẩn đoán, toa thuốc chi tiết.
  - **Thanh toán Viện phí Trực tuyến (HospitalPaymentView):** Hỗ trợ VietQR, VNPAY, MoMo, tự động tính trừ giảm 80% BHYT.
  - **Theo dõi Chỉ số Sinh hiệu (HealthMonitorView):** Quản lý Huyết áp, Nhịp tim, Đường huyết, BMI, SpO2 kèm biểu đồ xu hướng.
  - **Sổ Tiêm chủng Vắc xin (VaccineView):** Tra cứu danh mục vắc xin, quản lý lịch tiêm phòng và đặt lịch mũi tiêm mới.
  - **Nhắc lịch Uống thuốc & Tái khám (MedicationReminderView):** Lập lịch uống thuốc theo các buổi Sáng/Trưa/Tối, đánh dấu đã uống, tích hợp liên kết trực tiếp từ đơn thuốc EMR.
  - **Trung tâm Trợ giúp (HelpCenterView):** Gọi cấp cứu 115 khẩn cấp, hotline bệnh viện, hỏi đáp y tế thường gặp.

---

## 📋 3. KẾ HOẠCH BÀN GIAO & CÔNG VIỆC TIẾP THEO

1. **Rà soát Quyển Báo cáo:** Cập nhật các ảnh chụp giao diện mới của Web Admin và Mobile App vào quyển Word báo cáo đồ án (`docs/15_NguyenThanhDuy.docx`).
2. **Kịch bản Thuyết minh Demo (Live Demo Script):** Chuẩn bị kịch bản trình chiếu tương tác hai chiều giữa Web Bác sĩ và App Bệnh nhân trước Hội đồng chấm tốt nghiệp.
3. **Slide Báo cáo:** Soạn thảo slide thuyết trình PowerPoint bảo vệ Đồ án Tốt nghiệp.
