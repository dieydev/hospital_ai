import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';
import '../models/patient_model.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  final _storage = const FlutterSecureStorage();
  final _localAuth = LocalAuthentication();

  bool _isAuthenticated = false;
  String? _token;
  PatientModel? _user;
  bool _biometricsEnabled = false;
  bool _biometricsAvailable = false;

  bool get isAuthenticated => _isAuthenticated;
  String? get token => _token;
  PatientModel? get user => _user;
  bool get isProfileComplete => _user != null && _user!.isComplete;
  bool get biometricsEnabled => _biometricsEnabled;
  bool get biometricsAvailable => _biometricsAvailable;

  AuthProvider() {
    _loadUserFromPrefs();
  }

  Future<void> _loadUserFromPrefs() async {
    _token = await _storage.read(key: 'auth_token');
    final savedUserJson = await _storage.read(key: 'saved_user_profile');
    final bioFlag = await _storage.read(key: 'biometrics_enabled');
    _biometricsEnabled = bioFlag == 'true';

    // Kiểm tra thiết bị có hỗ trợ sinh trắc học không
    try {
      _biometricsAvailable = await _localAuth.canCheckBiometrics ||
          await _localAuth.isDeviceSupported();
    } catch (_) {
      _biometricsAvailable = false;
    }

    if (_token != null) {
      _isAuthenticated = true;
      if (savedUserJson != null) {
        try {
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

  /// Gửi mã OTP về số điện thoại (Luồng Đăng ký mới - SĐT chưa tồn tại)
  Future<Map<String, dynamic>> sendOtp(String phoneNumber) async {
    try {
      return await _apiService.sendOtp(phoneNumber);
    } catch (e) {
      rethrow;
    }
  }

  /// Gửi OTP quên mật khẩu (Luồng Bệnh nhân cũ - SĐT phải đã tồn tại)
  Future<Map<String, dynamic>> sendForgotPasswordOtp(String phoneNumber) async {
    try {
      return await _apiService.sendForgotPasswordOtp(phoneNumber);
    } catch (e) {
      rethrow;
    }
  }

  /// Xác thực OTP quên mật khẩu, đặt lại mật khẩu mới, sau đó tự động đăng nhập
  Future<void> resetPasswordOtp({
    required String phoneNumber,
    required String otpCode,
    required String newPassword,
  }) async {
    await _apiService.resetPasswordOtp(
      phoneNumber: phoneNumber,
      otpCode: otpCode,
      newPassword: newPassword,
    );
    // Tự động đăng nhập với mật khẩu mới vừa đặt
    try {
      await login(phoneNumber, newPassword);
    } catch (_) {
      // Fallback offline/demo: tạo session tạm để user vào được app
      _isAuthenticated = true;
      _token = 'demo_reset_token_${DateTime.now().millisecondsSinceEpoch}';
      _user ??= PatientModel(
        id: 'pat_${DateTime.now().millisecondsSinceEpoch}',
        maBenhNhan: '',
        hoTen: 'Bệnh nhân',
        gioiTinh: 'Nam',
        ngaySinh: '',
        soCCCD: '',
        diaChi: '',
        soDienThoai: phoneNumber,
        isProfileComplete: false,
      );
      await _storage.write(key: 'auth_token', value: _token!);
      notifyListeners();
    }
  }

  /// Đăng ký tài khoản với Số điện thoại + Mật khẩu (sau khi xác thực OTP thành công)
  Future<void> registerWithPassword(String phoneNumber, String password, String otpCode) async {
    await _apiService.register({
      'username': phoneNumber,
      'phoneNumber': phoneNumber,
      'password': password,
      'fullName': 'Bệnh nhân mới',
      'role': 'Patient',
    });
    await login(phoneNumber, password);
  }

  // ── BIOMETRICS ────────────────────────────────────────────────────────────

  /// Kích hoạt / Tắt đăng nhập sinh trắc học (FaceID / Vân tay)
  Future<void> setBiometricsEnabled(bool enabled) async {
    _biometricsEnabled = enabled;
    await _storage.write(key: 'biometrics_enabled', value: enabled ? 'true' : 'false');
    notifyListeners();
  }

  /// Thực hiện xác thực sinh trắc học. Trả về true nếu thành công.
  Future<bool> authenticateWithBiometrics() async {
    try {
      if (!_biometricsAvailable) return false;
      return await _localAuth.authenticate(
        localizedReason: 'Đăng nhập D-Medical bằng vân tay hoặc Face ID của bạn',
        options: const AuthenticationOptions(
          biometricOnly: false,
          stickyAuth: true,
        ),
      );
    } catch (e) {
      return false;
    }
  }

  /// Kiểm tra điều kiện cho phép auto-login bằng sinh trắc học
  Future<bool> canBiometricAutoLogin() async {
    if (!_biometricsEnabled || !_biometricsAvailable) return false;
    final storedToken = await _storage.read(key: 'auth_token');
    return storedToken != null && storedToken.isNotEmpty;
  }

  // ── COMPLETE PROFILE ──────────────────────────────────────────────────────

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
    try {
      if (updatedUser.id.isNotEmpty && !updatedUser.id.startsWith('pat_')) {
        await _apiService.put('/patients/${updatedUser.id}', {
          'fullName': updatedUser.hoTen,
          'gender': updatedUser.gioiTinh,
          'dateOfBirth': updatedUser.ngaySinh.isNotEmpty ? updatedUser.ngaySinh : DateTime.now().toIso8601String(),
          'identityCardNumber': updatedUser.soCCCD,
          'healthInsuranceNumber': updatedUser.maTheBHYT ?? '',
          'phoneNumber': updatedUser.soDienThoai ?? '',
          'email': updatedUser.email ?? '',
          'address': updatedUser.diaChi ?? '',
        });
      }
    } catch (_) {
      // Giữ fallback local nếu server offline hoặc token hết hạn
    }
    notifyListeners();
  }

  /// Đổi mật khẩu tài khoản người dùng
  Future<bool> changePassword(String currentPassword, String newPassword) async {
    try {
      await _apiService.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
      );
      return true;
    } catch (e) {
      final msg = e.toString();
      // Nếu offline / demo fallback
      if (msg.contains('Không thể kết nối') || msg.contains('Kết nối mạng')) {
        return true;
      }
      rethrow;
    }
  }

  Future<void> logout() async {
    _isAuthenticated = false;
    _token = null;
    _user = null;
    await _storage.delete(key: 'auth_token');
    await _storage.delete(key: 'saved_user_profile');
    // Giữ lại cờ biometrics_enabled để lần sau vẫn nhận ra
    notifyListeners();
  }
}
