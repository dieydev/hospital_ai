import 'dart:io' show Platform;

class AppConstants {
  static const String appName = 'D-Medical';
  static const String hospitalFullName = 'Hệ thống Y tế Quốc tế D-Medical';
  static const String slogan = 'Healthcare Connected';
  // Cấu hình IP máy chủ Backend API Gateway (Port 5000)
  // - Máy tính host IP Wi-Fi hiện tại: 10.10.10.175
  // - Đã hỗ trợ adb reverse tcp:5000 tcp:5000 khi cắm cáp USB (127.0.0.1)
  static const String serverHostIp = '10.10.10.175';
  static const int serverPort = 5000;

  static String get baseUrl {
    // Nếu chạy trên Web hoặc Windows desktop
    if (!Platform.isAndroid && !Platform.isIOS) {
      return 'http://localhost:$serverPort/api';
    }
    // Dùng IP Wi-Fi của máy để đảm bảo cả Điện thoại thật và Máy ảo đều kết nối ngay lập tức
    return 'http://$serverHostIp:$serverPort/api';
  }
}
