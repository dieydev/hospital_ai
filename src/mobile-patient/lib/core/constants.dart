import 'dart:io' show Platform;

class AppConstants {
  static const String appName = 'D-Medical';
  static const String hospitalFullName = 'Hệ thống Y tế Quốc tế D-Medical';
  static const String slogan = 'Healthcare Connected';
  // Cấu hình IP máy chủ Backend API Gateway (Port 5000)
  // - Máy tính host IP Wi-Fi hiện tại: 192.168.1.6
  // - Máy ảo Android Emulator loopback mặc định: 10.0.2.2
  static const String serverHostIp = '192.168.1.6';
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
