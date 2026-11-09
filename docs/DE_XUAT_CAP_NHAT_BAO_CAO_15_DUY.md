# ĐỐI CHIẾU VÀ ĐỀ XUẤT CẬP NHẬT ĐỀ CƯƠNG / BÁO CÁO TỐT NGHIỆP
## Đề tài 15: Hệ thống Quản lý Khám chữa bệnh & Hồ sơ Bệnh án Điện tử (EMR) Bệnh viện Đa khoa Tích hợp AI
**Sinh viên thực hiện:** Nguyễn Thanh Duy - MSSV: 2224801030170 - Lớp: D22KTPM01  
**Giảng viên hướng dẫn:** ThS. Cao Thanh Xuân  
**Ngày đối chiếu:** 06/11/2026

---

### TỔNG QUAN ĐỐI CHIẾU:
File cũ (`docs/15_NguyenThanhDuy.docx`) được soạn thảo từ giai đoạn ban đầu (Đề cương đăng ký). Thực tế dự án hiện tại của bạn đã **vượt trội hơn rất nhiều** cả về kiến trúc kỹ thuật, tính năng lâm sàng, pháp lý y tế và năng lực AI.

---

### CHI TIẾT CÁC MỤC CẦN CẬP NHẬT TRONG FILE WORD:

#### 1. MỤC 3: MỤC TIÊU NGHIÊN CỨU & NĂNG LỰC HỆ THỐNG
* **Nội dung cũ trong file:**
  - Chỉ ghi: Tích hợp Google Gemini API để tóm tắt bệnh án, gợi ý mã ICD-10.
  - Chỉ có ứng dụng Flutter cho bệnh nhân và Web cho cán bộ y tế.
* **Cập nhật thực tế của dự án:**
  - **Bổ sung Cổng thông tin & Đặt khám trực tuyến trên Web (Web Patient Portal):** Người bệnh không chỉ dùng Mobile App mà còn có thể đặt khám trực tiếp trên Web với trải nghiệm Omni-channel.
  - **Nâng cấp năng lực AI chuyên sâu:** Không dừng ở chat văn bản, hệ thống đã phát triển:
    1. **AI Vision (Đa phương thức):** Phân tích hình ảnh X-Quang lồng ngực (Chest X-Ray), X-Quang xương khớp, phát hiện đông đặc phổi, bóng tim to.
    2. **AI Kiểm tra tương tác thuốc (Drug-Drug Interaction - DDI):** Tự động rà soát đa đơn theo Dược thư Quốc gia Việt Nam (bắt các cặp nguy hiểm như *Clopidogrel + Omeprazole*, *Ciprofloxacin + NSAID*).
    3. **Bộ lọc an toàn lâm sàng (Clinical Guardrails & Anti-Hallucination):** Chặn đứng câu hỏi ngoài y khoa và khử khuẩn thông tin cá nhân (PII Redaction) chuẩn HIPAA & Nghị định 13/2023/NĐ-CP.

---

#### 2. MỤC 4.1: NỘI DUNG NGHIÊN CỨU (CÁC PHÂN HỆ NGHIỆP VỤ)
Cần bổ sung các phân hệ mà bạn đã lập trình hoàn chỉnh nhưng file cũ chưa liệt kê:
1. **Phân hệ Ký số Bác sĩ & Đóng mộc Bệnh án Điện tử (Digital Signature & EMR Legal Compliance):**
   - Áp dụng giải thuật băm SHA-256 kết hợp mã hóa khóa công khai RSA để Bác sĩ ký số xác nhận bệnh án.
   - Cơ chế đóng dấu mộc đỏ y tế điện tử và khóa bất biến (Immutability Lock) chống sửa đổi dữ liệu sau khi xuất viện.
2. **Phân hệ Tiếp nhận Điện tử & Điều phối Hàng chờ Thông minh (Smart Queue & Check-in):**
   - Check-in tự động bằng vé QR Pass điện tử tại quầy/Kiosk không cần bốc số giấy.
   - Điều phối hàng chờ Realtime qua SignalR WebSocket kết nối đồng thời: Màn hình LED TV sảnh, Web Bác sĩ và Điện thoại người bệnh.
3. **Phân hệ Cơ chế Ngoại tuyến & Khóa định ngạch (Atomic Quota Locking):**
   - Kiểm soát hạn mức 5 bệnh nhân/khung giờ bằng `SemaphoreSlim`, chống race condition / đặt trùng lịch khi nhiều người bấm cùng lúc.
   - Hỗ trợ tạo vé QR offline khi mất kết nối mạng.

---

#### 3. MỤC 4.2: PHẠM VI GIỚI HẠN (ĐẶC BIỆT QUAN TRỌNG - BẮT BUỘC SỬA!)
* **Trong file cũ ghi:**
  > *"Đề tài không nghiên cứu các thiết bị IoT y tế, không kết nối tự động với máy xét nghiệm, không áp dụng chuẩn dữ liệu HL7/FHIR, **không tích hợp cổng thanh toán trực tuyến bên thứ ba**..."*
* **Thực tế dự án đã làm được:**
  - Bạn **ĐÃ TÍCH HỢP THÀNH CÔNG** Cổng thanh toán trực tuyến quốc gia **VNPAY Sandbox** (chuẩn VNPAY 2.1.0 với mã kiểm tra chữ ký SHA-256) và **VietQR Động**.
  - **Cách sửa trong Word:** XÓA bỏ cụm từ *"không tích hợp cổng thanh toán trực tuyến bên thứ ba"*, và chuyển tính năng **Thanh toán Viện phí Trực tuyến VNPAY & VietQR** vào danh sách các chức năng đã hoàn thành!

---

#### 4. MỤC 5: CÔNG NGHỆ SỬ DỤNG (TECHNOLOGY STACK)
* **Trong file cũ ghi:**
  - Backend: "ASP.NET Core Web API theo kiến trúc phân lớp".
  - CSDL: "SQL Server".
* **Cập nhật kiến trúc thực tế (Kiến trúc phân tán Microservices hiện đại):**
  - **Kiến trúc Microservices trên nền .NET 9:** Hệ thống gồm 5 dịch vụ độc lập:
    - `HospitalAI.Gateway` (:5000 - YARP Reverse Proxy, Rate Limiting 150 req/m, Timeouts).
    - `HospitalAI.IdentityService` (:5001 - Xác thực JWT, OTP, PBKDF2/SHA-256 Password Hash).
    - `HospitalAI.PatientService` (:5002 - Hồ sơ y tế, BHYT, CCCD, tiền sử bệnh).
    - `HospitalAI.QueueService` (:5003 - Quota slot, hàng chờ SignalR, vé QR Pass).
    - `HospitalAI.ExaminationService` (:5004 - Bệnh án EMR, ICD-10, Ký số RSA, Clinical AI).
  - **Cơ sở dữ liệu Đa mô hình (Polyglot Persistence):**
    - **SQL Server 2022:** Lưu trữ dữ liệu quan hệ, giao dịch tài chính, EMR và bệnh nhân.
    - **MongoDB 7.0:** Lưu trữ phi cấu trúc phục vụ **Audit Logs** và **Nhật ký can thiệp AI** (AI Logs) với dung lượng lớn.
  - **Ảo hóa & Triển khai Container:** Toàn bộ hệ thống được container hóa và điều phối bằng **Docker & Docker Compose**.
  - **Giao tiếp Realtime:** Sử dụng **SignalR WebSockets** và **Firebase Cloud Messaging (FCM)**.

---

#### 5. MỤC 6: SẢN PHẨM HOÀN THÀNH (DELIVERABLES)
Bổ sung các sản phẩm thực tế:
- **01 Website Quản trị Bệnh viện & Bác sĩ (React 18 + Vite + AntD 5).**
- **01 Cổng thông tin & Đặt khám trực tuyến Web Patient Portal (Giao diện chuẩn y tế số, hỗ trợ Elderly Mode chữ to cho người cao tuổi).**
- **01 Ứng dụng di động Flutter (Mobile Patient App)** dành cho người bệnh, đã build file APK Release hoàn chỉnh (`app-release.apk`).
- **Hệ thống Microservices Backend .NET 9 + API Gateway YARP** đóng gói trong Docker.
- **Tích hợp thành công Cổng thanh toán VNPAY Sandbox.**
- **Bệnh án điện tử EMR hợp chuẩn xuất file PDF có chữ ký số Bác sĩ và Mộc đỏ Bệnh viện.**

