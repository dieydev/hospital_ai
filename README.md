# Hospital AI System (Hệ thống Quản lý Khám chữa bệnh & Hồ sơ Bệnh án điện tử tích hợp AI)

## 📌 Giới thiệu Đề tài
Hệ thống Quản lý Quá trình Khám chữa bệnh và Hồ sơ bệnh án cho bệnh viện đa khoa có tích hợp Trí tuệ nhân tạo (AI) hỗ trợ đội ngũ y tế.
Dự án được xây dựng bao gồm:
1. **Backend**: ASP.NET Core 9 Web API theo kiến trúc **Clean Architecture**.
2. **Web Admin**: ReactJS + Vite + TypeScript + Ant Design dành cho Quản trị viên, Bác sĩ, Lễ tân và KTV.
3. **Mobile App**: Flutter dành cho Bệnh nhân (Đăng ký, đặt lịch khám, xem EMR, thanh toán VNPay QR).
4. **Database**: SQL Server lưu trữ dữ liệu y tế tập trung.
5. **AI Integration**: Google Gemini API hỗ trợ RAG Tra cứu Phác đồ y tế, gợi ý ICD-10, tóm tắt bệnh án.

## 📁 Cấu trúc Dự án
```
Hospital_AI/
│
├── docs/                     # Báo cáo đề tài, tài liệu phân rã chức năng & SQL Script
├── src/
│   ├── backend/              # Solution .NET 9 Clean Architecture (Domain, Application, Infrastructure, API)
│   ├── web-admin/            # Web Portal Admin/Bác sĩ (React + Vite + TypeScript + AntD)
│   └── mobile-patient/       # Mobile App Bệnh nhân (Flutter)
│
├── .gitignore
├── README.md
└── LICENSE
```

## 🚀 Hướng dẫn Chạy ứng dụng

### Backend (.NET 9 Web API)
```bash
cd src/backend
dotnet restore
dotnet run --project HospitalAI.API
```

### Web Admin (React + Vite + TS)
```bash
cd src/web-admin
npm install
npm run dev
```

### Mobile Patient (Flutter)
```bash
cd src/mobile-patient
flutter pub get
flutter run
```
