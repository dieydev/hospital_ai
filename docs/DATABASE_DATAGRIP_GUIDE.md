# HƯỚNG DẪN QUY TRÌNH KHỞI TẠO, KẾT NỐI HỆ CSDL HYBRID (SQL SERVER & MONGODB) VỚI DATAGRIP

> **Dự án:** Hệ thống Quản lý Khám chữa bệnh & Bệnh án Điện tử (EMR) tích hợp Trí tuệ Nhân tạo - Hospital AI  
> **Tác giả:** Nguyễn Thanh Duy  
> **Kiến trúc CSDL:** Hybrid (SQL Server 2022 RDBMS + MongoDB 7.0 NoSQL)

---

## 🏗️ 1. TỔNG QUAN KIẾN TRÚC HỆ CƠ SỞ DỮ LIỆU LAI (HYBRID DATABASE)

Hệ thống được thiết kế theo mô hình CSDL Lai để tối ưu hóa hiệu năng và khả năng mở rộng:

1. **SQL Server 2022 (RDBMS - Dữ liệu Quan hệ):**
   - Quản lý các dữ liệu cấu trúc cố định có tính toàn vẹn cao: Tài khoản, Phân quyền Role, Hồ sơ Bệnh nhân, Số thứ tự tiếp nhận hàng chờ, Phiếu khám SOAP, Đơn thuốc điện tử, Viện phí và Bệnh án EMR.
2. **MongoDB 7.0 (NoSQL - Dữ liệu Tài liệu AI):**
   - Quản lý các dữ liệu linh hoạt, không cố định hình dạng của Trợ lý Y tế AI: Lịch sử Chatbot Gemini, Prompts gửi đi, Phản hồi từ Model `gemini-3.6-flash`, Độ trễ xử lý (Latency ms), Gợi ý mã bệnh ICD-10 và Cảnh báo tương tác thuốc.

---

## 🚀 2. QUY TRÌNH KHỞI TẠO CSDL BẰNG DOCKER COMPOSE

### Bước 1: Mở Terminal tại thư mục gốc dự án (`d:\DATN\Hospital_AI`)
### Bước 2: Chạy lệnh khởi tạo toàn bộ các Containers CSDL:

```bash
docker compose up -d sqlserver mongodb
```

### Bước 3: Kiểm tra trạng thái hoạt động:

```bash
docker compose ps
```
- Container `hospitalai-sqlserver` hoạt động tại Port host **`14333`** (để tránh xung đột port 1433 với SQL Server Windows).
- Container `hospitalai-mongodb` hoạt động tại Port host **`27017`**.

---

## 🛢️ 3. QUY TRÌNH NẠP DỮ LIỆU BAN ĐẦU (SEED DATA)

1. **Đối với SQL Server:**
   - Sử dụng script khởi tạo chuẩn sẵn có tại đường dẫn: `docs/HospitalAI_DB.sql`.
   - Script tự động tạo database `HospitalAI_DB`, các Schema bảng và dữ liệu mẫu.

2. **Đối với MongoDB:**
   - MongoDB áp dụng cơ chế **Dynamic Schema (Lazy Creation)**: CSDL `HospitalAI_AI_Logs` và Collection `ai_prompt_logs` sẽ tự động sinh ra ngay khi ứng dụng Web Admin hoặc người dùng gửi câu hỏi/tương tác đầu tiên với Gemini AI.

---

## 💻 4. HƯỚNG DẪN KẾT NỐI DATAGRIP CHI TIẾT TỪ A - Z

### 🍃 PHẦN A: Kết nối MongoDB (NoSQL) trong DataGrip

1. **Mở DataGrip**, tại bảng điều khiển *Database* góc trái ➔ Bấm dấu **`+` (New)** ➔ Chọn **Data Source** ➔ Chọn **MongoDB**.
2. **Điền thông tin kết nối:**
   - **Name:** `HospitalAI_AI_Logs@localhost`
   - **Host:** `localhost`
   - **Port:** `27017`
   - **Authentication:** `No authentication`
   - **Database:** `HospitalAI_AI_Logs`
3. **Tải Driver:** Bấm nút `Download Driver` (nếu có thông báo).
4. **Kiểm tra:** Bấm nút **Test Connection** ➔ Thấy hiện thông báo xanh **`Succeeded` 🟢** ➔ Bấm **OK**.
5. **Thao tác xem dữ liệu:** Mở `HospitalAI_AI_Logs` ➔ `collections` ➔ Nhấp đúp chuột vào **`ai_prompt_logs`** để mở bảng dữ liệu NoSQL JSON.

---

### 🛢️ PHẦN B: Kết nối SQL Server (Docker Container) trong DataGrip

*(Sử dụng tài khoản sa quản trị mặc định trong Docker)*

1. Bấm dấu **`+` (New)** ➔ Chọn **Data Source** ➔ Chọn **Microsoft SQL Server**.
2. **Điền thông tin kết nối:**
   - **Name:** `HospitalAI_DB_Docker@localhost`
   - **Host:** `localhost`
   - **Port:** `14333` *(Lưu ý: Điền cổng 14333)*
   - **Authentication:** `User & Password`
   - **User:** `sa`
   - **Password:** `HospitalAI@2026!Secret`
   - **Database:** `HospitalAI_DB`
3. **Cấu hình SSL:** Chuyển sang tab **Advanced**, tìm mục `trustServerCertificate` chọn `true`.
4. **Kiểm tra:** Bấm **Test Connection** ➔ Thấy báo xanh **`Succeeded` 🟢** ➔ Bấm **OK**.

---

### 💻 PHẦN C: Kết nối SQL Server (Windows Native Instance) trong DataGrip

*(Nếu bạn dùng bản SQL Server cài trực tiếp trên máy Windows)*

1. Bấm dấu **`+` (New)** ➔ Chọn **Data Source** ➔ Chọn **Microsoft SQL Server**.
2. **Điền thông tin kết nối:**
   - **Host:** `localhost`
   - **Port:** `1433`
   - **Authentication:** `Windows credentials`
   - **Database:** `HospitalAI_DB`
3. **Nạp Script SQL:**
   - Sau khi kết nối thành công, nhấp chuột phải vào tên kết nối ➔ Chọn **Open File...** ➔ Chọn file `docs/HospitalAI_DB.sql`.
   - Bấm nút **▶️ Run / Execute** (`Ctrl + Enter`) để nạp bảng và dữ liệu.

---

## 📌 5. SUMMARY CÁC THÔNG SỐ KẾT NỐI NHANH

| Hệ CSDL | Loại CSDL | Host | Port | Authentication / User | Password | Database Name |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MongoDB** | NoSQL | `localhost` | `27017` | `No authentication` | *(Để trống)* | `HospitalAI_AI_Logs` |
| **SQL Server (Docker)** | RDBMS | `localhost` | `14333` | `User & Password (sa)` | `HospitalAI@2026!Secret` | `HospitalAI_DB` |
| **SQL Server (Windows)** | RDBMS | `localhost` | `1433` | `Windows credentials` | *(Theo máy Windows)* | `HospitalAI_DB` |
