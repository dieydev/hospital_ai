import 'dart:io' show Platform;

class AppConstants {
  static const String appName = 'D-Medical';
  static const String hospitalFullName = 'Hệ thống Y tế Quốc tế D-Medical';
  static const String slogan = 'Healthcare Connected';
  // Use 10.0.2.2 for Android Emulator, localhost for iOS/Web/Windows
  static String get baseUrl {
    // For Android Emulator, use 10.0.2.2
    // For iOS Simulator, use localhost
    // For physical device, change to your machine's local IP (e.g. 192.168.1.x)
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:5000/api';
    }
    return 'http://localhost:5000/api';
  }
}
