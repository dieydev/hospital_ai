import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsProvider extends ChangeNotifier {
  String _language = 'VI';
  bool _biometricsEnabled = true;
  bool _notificationsEnabled = true;

  String get language => _language;
  bool get biometricsEnabled => _biometricsEnabled;
  bool get notificationsEnabled => _notificationsEnabled;

  SettingsProvider() {
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _language = prefs.getString('app_language') ?? 'VI';
    _biometricsEnabled = prefs.getBool('app_biometrics') ?? true;
    _notificationsEnabled = prefs.getBool('app_notifications') ?? true;
    notifyListeners();
  }

  Future<void> setLanguage(String lang) async {
    _language = lang;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('app_language', lang);
    notifyListeners();
  }

  Future<void> toggleBiometrics(bool value) async {
    _biometricsEnabled = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('app_biometrics', value);
    notifyListeners();
  }

  Future<void> toggleNotifications(bool value) async {
    _notificationsEnabled = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('app_notifications', value);
    notifyListeners();
  }
}
