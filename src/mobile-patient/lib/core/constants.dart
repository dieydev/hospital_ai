import 'dart:io' show Platform;

class AppConstants {
  static const String appName = 'Hospital AI';
  // Use 10.0.2.2 for Android Emulator, localhost for iOS/Web/Windows
  static String get baseUrl {
    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:5000/api';
      }
    } catch (e) {
      // Ignored for web
    }
    return 'http://localhost:5000/api';
  }
}
