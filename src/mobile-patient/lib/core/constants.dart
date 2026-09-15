import 'dart:io' show Platform;

class AppConstants {
  static const String appName = 'Hospital AI';
  // Use 10.0.2.2 for Android Emulator, localhost for iOS/Web/Windows
  static String get baseUrl {
    // For physical device, use local IP address instead of 10.0.2.2 or localhost
    return 'http://172.16.0.14:5000/api';
  }
}
