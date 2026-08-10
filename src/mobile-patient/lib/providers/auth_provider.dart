import 'package:flutter/material.dart';
import '../models/patient_model.dart';

class AuthProvider extends ChangeNotifier {
  bool _isAuthenticated = false;
  String? _token;
  PatientModel? _user;

  bool get isAuthenticated => _isAuthenticated;
  String? get token => _token;
  PatientModel? get user => _user;

  void login(String token, [PatientModel? user]) {
    _isAuthenticated = true;
    _token = token;
    _user = user;
    notifyListeners();
  }

  void logout() {
    _isAuthenticated = false;
    _token = null;
    _user = null;
    notifyListeners();
  }
}
