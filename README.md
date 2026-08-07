# Hospital AI System (Hệ thống Quản lý Khám chữa bệnh & Hồ sơ Bệnh án điện tử tích hợp AI)

## 📌 Giới thiệu Đề tài
Hệ thống Quản lý Quá trình Khám chữa bệnh và Hồ sơ bệnh án cho bệnh viện đa khoa có tích hợp Trí tuệ nhân tạo (AI) hỗ trợ đội ngũ y tế.
Dự án được chuyển đổi hoàn toàn sang **Kiến trúc Microservices** được đóng gói và vận hành qua **Docker Desktop & Docker Compose**:

1. **API Gateway**: .NET 9 YARP (Yet Another Reverse Proxy) điều hướng request tập trung trên cổng `5000`.
2. **Backend Microservices**: 4 Dịch vụ .NET 9 riêng biệt:
   - `IdentityService` (Port `5001`): Đăng nhập, phân quyền & Token JWT.
   - `PatientService` (Port `5002`): Hồ sơ & quản lý thông tin bệnh nhân.
   - `QueueService` (Port `5003`): Tiếp nhận & phát số hàng chờ tự động.
   - `ExaminationService` (Port `5004`): Khám bệnh (SOAP), chuẩn đoán ICD-10 & kê đơn thuốc.
3. **Web Admin Portal**: ReactJS + Vite + TypeScript + Ant Design (Container hóa qua Nginx trên cổng `3000`).
4. **Mobile Patient App**: Flutter dành cho Bệnh nhân (Đăng ký, xem hàng chờ, xem EMR).
5. **Database**: Containerized SQL Server 2022 lưu trữ dữ liệu y tế tập trung (Port `1433`).
6. **AI Integration**: Google Gemini API hỗ trợ RAG Tra cứu Phác đồ y tế, gợi ý ICD-10, tóm tắt bệnh án.

---

## 📁 Cấu trúc Dự án
```text
Hospital_AI/
│
├── docker-compose.yml          # Điều phối 7 Containers (DB, Gateway, 4 Services, Web Admin)
├── .dockerignore
├── docs/                       # Báo cáo đồ án, báo cáo tiến độ & SQL Script
│   └── PROGRESS_REPORT.md      # Báo cáo Tiến độ Chi tiết Đồ án
│
├── src/
│   ├── backend/                # Solution .NET 9 Microservices
│   │   ├── building-blocks/    # Domain, Application, Infrastructure
│   │   └── services/           # Gateway, Identity, Patient, Queue, Examination Services
│   │
│   ├── web-admin/              # Web Portal Admin/Bác sĩ (React + Vite + TS + Nginx)
│   └── mobile-patient/         # Mobile App Bệnh nhân (Flutter)
│
├── README.md
└── LICENSE
```

---

## 🚀 Hướng dẫn Chạy ứng dụng qua Docker

### Khởi chạy toàn bộ hệ thống (Recommended)
```bash
docker compose up --build -d
```

Các cổng truy cập:
- **Web Admin Dashboard**: `http://localhost:3000` (Đăng nhập: `admin` / `Admin@123`)
- **API Gateway**: `http://localhost:5000/health`
- **Swagger API Docs**:
  - Auth Service: `http://localhost:5001/swagger`
  - Patient Service: `http://localhost:5002/swagger`
  - Queue Service: `http://localhost:5003/swagger`
  - Examination Service: `http://localhost:5004/swagger`

---

## 💻 Chạy cục bộ từng dịch vụ (Development)

### Web Admin (Vite Dev Server)
```bash
cd src/web-admin
npm install
npm run dev
```

### Mobile Patient (Flutter App)
```bash
cd src/mobile-patient
flutter pub get
flutter run
```
