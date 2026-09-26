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
  bool get isProfileComplete => _user != null && _user!.isComplete;

  AuthProvider() {
    _loadUserFromPrefs();
  }

  Future<void> _loadUserFromPrefs() async {
    _token = await _storage.read(key: 'auth_token');
    final savedUserJson = await _storage.read(key: 'saved_user_profile');
    if (_token != null) {
      _isAuthenticated = true;
      if (savedUserJson != null) {
        try {
          // Parse saved user
          final Map<String, dynamic> jsonMap = Map<String, dynamic>.from(
            Uri.splitQueryString(savedUserJson),
          );
          _user = PatientModel.fromJson(jsonMap);
        } catch (_) {}
      }

      // Try fetching profile from API /auth/me
      try {
        final profile = await _apiService.get('/auth/me');
        if (profile != null) {
          _user = PatientModel.fromJson(profile);
          await _persistUser(_user!);
        }
      } catch (e) {
        // Keep offline cached user if token exists
      }
    }
    notifyListeners();
  }

  Future<void> _persistUser(PatientModel user) async {
    // Store simple serialized format
    final queryStr = Uri(queryParameters: {
      'id': user.id,
      'fullName': user.hoTen,
      'phoneNumber': user.soDienThoai ?? '',
      'patientCode': user.maBenhNhan,
      'identityCardNumber': user.soCCCD,
      'gender': user.gioiTinh,
      'dateOfBirth': user.ngaySinh,
      'address': user.diaChi ?? '',
      'healthInsuranceNumber': user.maTheBHYT ?? '',
      'isProfileComplete': user.isProfileComplete ? 'true' : 'false',
    }).query;
    await _storage.write(key: 'saved_user_profile', value: queryStr);
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
        await _persistUser(_user!);
        notifyListeners();
      } else {
        throw Exception('Không nhận được token từ server.');
      }
    } catch (e) {
      rethrow;
    }
  }

  /// Gửi mã OTP về số điện thoại
  Future<Map<String, dynamic>> sendOtp(String phoneNumber) async {
    try {
      return await _apiService.sendOtp(phoneNumber);
    } catch (e) {
      rethrow;
    }
  }

  /// Đăng ký / Xác thực bằng Số điện thoại + OTP
  Future<void> registerWithPhoneOtp(String phoneNumber, String otpCode) async {
    try {
      final response = await _apiService.verifyOtpAndLogin(phoneNumber, otpCode);
      final token = response['token'];
      final userJson = response['user'];

      if (token != null) {
        _isAuthenticated = true;
        _token = token;
        _user = PatientModel.fromJson(userJson ?? {
          'phoneNumber': phoneNumber,
          'fullName': 'Bệnh nhân mới',
          'isProfileComplete': false,
        });

        await _storage.write(key: 'auth_token', value: token);
        await _persistUser(_user!);
        notifyListeners();
      } else {
        throw Exception('Không nhận được phiên đăng nhập hợp lệ.');
      }
    } catch (e) {
      rethrow;
    }
  }

  /// Hoàn thiện đầy đủ hồ sơ bệnh nhân (Bắt buộc trước khi thao tác trong app)
  Future<void> completeProfile({
    required String fullName,
    required String cccd,
    required String dateOfBirth,
    required String gender,
    required String address,
    String? healthInsuranceNumber,
    String? emergencyContactName,
    String? emergencyContactPhone,
    String? emergencyContactRelation,
  }) async {
    try {
      final payload = {
        'id': _user?.id,
        'phoneNumber': _user?.soDienThoai,
        'fullName': fullName.trim(),
        'identityCardNumber': cccd.trim(),
        'dateOfBirth': dateOfBirth.trim(),
        'gender': gender,
        'address': address.trim(),
        'healthInsuranceNumber': healthInsuranceNumber?.trim(),
        'emergencyContactName': emergencyContactName?.trim(),
        'emergencyContactPhone': emergencyContactPhone?.trim(),
        'emergencyContactRelation': emergencyContactRelation?.trim(),
      };

      final updatedJson = await _apiService.completeProfile(payload);
      _user = PatientModel.fromJson(updatedJson);
      await _persistUser(_user!);
      notifyListeners();
    } catch (e) {
      // Cập nhật local nếu offline
      _user = _user?.copyWith(
        hoTen: fullName.trim(),
        soCCCD: cccd.trim(),
        ngaySinh: dateOfBirth.trim(),
        gioiTinh: gender,
        diaChi: address.trim(),
        maTheBHYT: healthInsuranceNumber?.trim(),
        isProfileComplete: true,
      ) ?? PatientModel(
        id: 'pat_${DateTime.now().millisecondsSinceEpoch}',
        maBenhNhan: 'BN2026${DateTime.now().millisecond.toString().padLeft(6, '0')}',
        hoTen: fullName.trim(),
        gioiTinh: gender,
        ngaySinh: dateOfBirth.trim(),
        soCCCD: cccd.trim(),
        diaChi: address.trim(),
        maTheBHYT: healthInsuranceNumber?.trim(),
        soDienThoai: _user?.soDienThoai ?? '',
        isProfileComplete: true,
      );
      if (_user != null) await _persistUser(_user!);
      notifyListeners();
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
      await _apiService.register({
        'username': username,
        'password': password,
        'fullName': fullName,
        'phoneNumber': phoneNumber,
        'identityCardNumber': cccd,
        'gender': gender,
        'email': '',
        'role': 'Patient'
      });
      await login(username, password);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateProfile(PatientModel updatedUser) async {
    _user = updatedUser;
    await _persistUser(updatedUser);
    notifyListeners();
  }

  Future<void> logout() async {
    _isAuthenticated = false;
    _token = null;
    _user = null;
    await _storage.delete(key: 'auth_token');
    await _storage.delete(key: 'saved_user_profile');
    notifyListeners();
  }
}
