import 'dart:io' show Platform;

class AppConstants {
  static const String appName = 'D-Medical';
  static const String hospitalFullName = 'Hệ thống Y tế Quốc tế D-Medical';
  static const String slogan = 'Healthcare Connected';
  // Domain máy chủ Production chính thức
  static const String productionApiUrl = 'https://dmedical.site/api';
  
  // Cấu hình IP máy chủ Backend API Gateway cục bộ khi dev
  // - Máy tính host IP Wi-Fi hiện tại: 192.168.1.29
  // - Đã hỗ trợ adb reverse tcp:5000 tcp:5000 khi cắm cáp USB (127.0.0.1)
  static const String serverHostIp = '192.168.1.14';
  static const int serverPort = 5000;
  
  // Đặt = true để dùng domain chính thức dmedical.site cho điện thoại thật / 4G
  static const bool useProduction = true;

  static String get baseUrl {
    if (useProduction) {
      return productionApiUrl;
    }
    // Nếu chạy trên Web hoặc Windows desktop
    if (!Platform.isAndroid && !Platform.isIOS) {
      return 'http://localhost:$serverPort/api';
    }
    // Dùng IP Wi-Fi của máy để đảm bảo cả Điện thoại thật và Máy ảo đều kết nối ngay lập tức
    return 'http://$serverHostIp:$serverPort/api';
  }
}
