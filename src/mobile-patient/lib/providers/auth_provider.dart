import 'dart:convert';
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
          if (savedUserJson.trim().startsWith('{')) {
            _user = PatientModel.fromJson(jsonDecode(savedUserJson));
          } else {
            final Map<String, dynamic> jsonMap = Map<String, dynamic>.from(
              Uri.splitQueryString(savedUserJson),
            );
            _user = PatientModel.fromJson(jsonMap);
          }
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

  Future<void> refreshProfile() async {
    try {
      final profile = await _apiService.get('/auth/me');
      if (profile != null) {
        _user = PatientModel.fromJson(profile);
        await _persistUser(_user!);
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> _persistUser(PatientModel user) async {
    try {
      final jsonStr = jsonEncode(user.toJson());
      await _storage.write(key: 'saved_user_profile', value: jsonStr);
    } catch (_) {}
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
      // Khi mất kết nối hoặc máy chủ EC2/Backend chưa khởi động:
      // Tự động kích hoạt tài khoản trải nghiệm ngoại tuyến nếu nhập đúng tài khoản mẫu
      final cleanUser = username.trim().toLowerCase();
      final isDemoAccount = (cleanUser == '0987654321' || cleanUser == 'patient01' || cleanUser == '0912345678') && password.trim() == '123456';
      if (isDemoAccount) {
        _isAuthenticated = true;
        _token = 'offline_demo_token_patient01';
        _user = PatientModel(
          id: 'pat-demo-001',
          maBenhNhan: 'BN2026000001',
          hoTen: 'Nguyễn Văn An',
          gioiTinh: 'Nam',
          ngaySinh: '1990-05-15',
          soCCCD: '038090001234',
          soDienThoai: '0987654321',
          diaChi: '123 Đường Bác Bác, TP. Thủ Dầu Một, Bình Dương',
          maTheBHYT: 'DN40101234567',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          isProfileComplete: true,
        );
        await _persistUser(_user!);
        notifyListeners();
        return;
      }
      rethrow;
    }
  }

  /// Kiểm tra số điện thoại đã tồn tại tài khoản hay chưa
  Future<bool> checkPhoneExists(String phoneNumber) async {
    try {
      final res = await _apiService.checkPhone(phoneNumber);
      return res['exists'] == true;
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
    await login(phoneNumber, newPassword);
  }

  /// Đăng ký tài khoản Bệnh nhân với đầy đủ thông tin định danh y tế
  Future<void> registerPatient({
    required String phoneNumber,
    required String password,
    required String fullName,
    required String identityCardNumber,
    required String dateOfBirth,
    required String gender,
    required String address,
    String? otpCode,
  }) async {
    DateTime? dob;
    try {
      if (dateOfBirth.contains('/')) {
        final parts = dateOfBirth.split('/');
        if (parts.length == 3) {
          dob = DateTime(int.parse(parts[2]), int.parse(parts[1]), int.parse(parts[0]));
        }
      } else if (dateOfBirth.isNotEmpty) {
        dob = DateTime.tryParse(dateOfBirth);
      }
    } catch (_) {}

    final regRes = await _apiService.register({
      'username': phoneNumber,
      'phoneNumber': phoneNumber,
      'password': password,
      'fullName': fullName.trim(),
      'identityCardNumber': identityCardNumber.trim(),
      'dateOfBirth': dob?.toIso8601String(),
      'gender': gender,
      'address': address.trim(),
      'role': 'Patient',
      if (otpCode != null && otpCode.isNotEmpty) 'otpCode': otpCode,
    });
    if (regRes.isNotEmpty) {
      _user = PatientModel.fromJson(regRes);
      await _persistUser(_user!);
      notifyListeners();
    }
    await login(phoneNumber, password);
  }

  /// Đăng ký tài khoản với Số điện thoại + Mật khẩu (sau khi xác thực OTP thành công)
  Future<void> registerWithPassword(
    String phoneNumber,
    String password,
    String otpCode, {
    String? fullName,
    String? cccd,
    String? dob,
    String? gender,
    String? address,
  }) async {
    if (fullName != null && cccd != null) {
      await registerPatient(
        phoneNumber: phoneNumber,
        password: password,
        fullName: fullName,
        identityCardNumber: cccd,
        dateOfBirth: dob ?? '',
        gender: gender ?? 'Nam',
        address: address ?? 'Chưa cập nhật',
        otpCode: otpCode,
      );
    } else {
      await _apiService.register({
        'username': phoneNumber,
        'phoneNumber': phoneNumber,
        'password': password,
        'fullName': 'Bệnh nhân mới',
        'role': 'Patient',
        'otpCode': otpCode,
      });
      await login(phoneNumber, password);
    }
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
    await _apiService.changePassword(
      currentPassword: currentPassword,
      newPassword: newPassword,
    );
    return true;
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
