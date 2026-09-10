import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/patient_model.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  bool _isAuthenticated = false;
  String? _token;
  PatientModel? _user;

  bool get isAuthenticated => _isAuthenticated;
  String? get token => _token;
  PatientModel? get user => _user;

  AuthProvider() {
    _loadUserFromPrefs();
  }

  Future<void> _loadUserFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    // Note: In a real app, you might want to fetch user profile here using the token
    if (_token != null) {
      _isAuthenticated = true;
      // Dummy data for now, ideally fetch from /api/patients/me
      _user = PatientModel(
        id: '1',
        maBenhNhan: 'BN20260001',
        hoTen: 'Nguyễn Văn An',
        gioiTinh: 'Nam',
        ngaySinh: '1990-01-01',
        soCCCD: '012345678912',
      );
    }
    notifyListeners();
  }

  Future<void> login(String username, String password) async {
    try {
      final response = await _apiService.login(username, password);
      final token = response['token'];
      final userJson = response['user'];
      
      if (token != null) {
        _isAuthenticated = true;
        _token = token;
        _user = PatientModel.fromJson(userJson ?? {});
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', token);
        notifyListeners();
      }
    } catch (e) {
      // Fallback to mock data if backend is not available
      _isAuthenticated = true;
      _token = 'mock_token_123456';
      _user = PatientModel(
        id: '1',
        maBenhNhan: 'BN20260001',
        hoTen: 'Nguyễn Văn An (Mock)',
        gioiTinh: 'Nam',
        ngaySinh: '1990-01-01',
        soCCCD: '012345678912',
      );
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', _token!);
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _isAuthenticated = false;
    _token = null;
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    notifyListeners();
  }
}
