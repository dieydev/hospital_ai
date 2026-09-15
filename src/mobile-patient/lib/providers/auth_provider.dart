import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/patient_model.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  final _storage = const FlutterSecureStorage();
  
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
    _token = await _storage.read(key: 'auth_token');
    if (_token != null) {
      _isAuthenticated = true;
      // Ideally fetch from /api/patients/me here
      // But for now we just mark as authenticated. 
      // If fetching fails, we should logout.
      try {
        // Mocking user profile load for now if API isn't ready
        // final userJson = await _apiService.get('/patients/me');
        // _user = PatientModel.fromJson(userJson);
      } catch (e) {
        // If token is invalid or expired
        await logout();
      }
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
        
        await _storage.write(key: 'auth_token', value: token);
        notifyListeners();
      } else {
        throw Exception('Không nhận được token từ server.');
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<void> register({
    required String username,
    required String password,
    required String fullName,
    required String phoneNumber,
    required String cccd,
    required String gender,
  }) async {
    try {
      final response = await _apiService.register({
        'username': username,
        'password': password,
        'fullName': fullName,
        'phoneNumber': phoneNumber,
        'identityCardNumber': cccd,
        'gender': gender,
        'email': '', // optional
        'role': 'Patient'
      });
      // After successful registration, we login automatically or just return success
      // If the backend returns a token, we handle it here. Usually, we need to login explicitly.
      // Assuming register doesn't return a token, we should call login.
      await login(username, password);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> logout() async {
    _isAuthenticated = false;
    _token = null;
    _user = null;
    await _storage.delete(key: 'auth_token');
    notifyListeners();
  }
}
