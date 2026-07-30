import 'package:flutter/material.dart';

class AuthProvider extends ChangeNotifier {
  bool _isAuthenticated = false;
  String? _token;

  bool get isAuthenticated => _isAuthenticated;
  String? get token => _token;

  void login(String token) {
    _isAuthenticated = true;
    _token = token;
    notifyListeners();
  }

  void logout() {
    _isAuthenticated = false;
    _token = null;
    notifyListeners();
  }
}
