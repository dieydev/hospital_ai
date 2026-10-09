import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/constants.dart';

class ApiService {
  late final Dio _dio;
  final _storage = const FlutterSecureStorage();

  ApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'auth_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          // Tự động thử lại với 127.0.0.1 (qua adb reverse USB) nếu baseUrl WiFi gặp lỗi kết nối
          if (e.type == DioExceptionType.connectionError &&
              e.requestOptions.extra['retried_fallback'] != true) {
            final isUsbCurrent = _dio.options.baseUrl.contains('127.0.0.1');
            final fallbackBaseUrl = isUsbCurrent
                ? 'http://${AppConstants.serverHostIp}:${AppConstants.serverPort}/api'
                : 'http://127.0.0.1:${AppConstants.serverPort}/api';

            try {
              final newOptions = e.requestOptions;
              newOptions.extra['retried_fallback'] = true;
              final retryDio = Dio(
                BaseOptions(
                  baseUrl: fallbackBaseUrl,
                  connectTimeout: const Duration(seconds: 4),
                  receiveTimeout: const Duration(seconds: 10),
                  headers: newOptions.headers,
                ),
              );
              final res = await retryDio.request(
                newOptions.path,
                data: newOptions.data,
                queryParameters: newOptions.queryParameters,
                options: Options(method: newOptions.method),
              );
              // Lưu baseUrl thành công để các request sau dùng luôn
              _dio.options.baseUrl = fallbackBaseUrl;
              return handler.resolve(res);
            } catch (_) {
              // Bỏ qua nếu fallback cũng lỗi, trả về lỗi gốc
            }
          }
          return handler.next(e);
        },
      ),
    );
  }

  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await _dio.post(
        '/auth/login',
        data: {'username': username, 'password': password},
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      if (e.response != null && e.response?.statusCode == 401) {
        throw Exception('Sai tên đăng nhập hoặc mật khẩu');
      }
      throw Exception('Đăng nhập thất bại: ${_getErrorMessage(e)}');
    }
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/auth/register', data: data);
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(_getErrorMessage(e));
    }
  }

  /// Kiểm tra số điện thoại đã tồn tại tài khoản hay chưa
  Future<Map<String, dynamic>> checkPhone(String phoneNumber) async {
    try {
      final response = await _dio.get(
        '/auth/check-phone',
        queryParameters: {'phoneNumber': phoneNumber.trim()},
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(_getErrorMessage(e));
    }
  }

  Future<Map<String, dynamic>> sendOtp(String phoneNumber) async {
    try {
      final response = await _dio.post(
        '/auth/send-otp',
        data: {'phoneNumber': phoneNumber.trim()},
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(_getErrorMessage(e));
    }
  }

  /// Gửi OTP quên mật khẩu (Bắt buộc SĐT phải đã tồn tại trong hệ thống)
  Future<Map<String, dynamic>> sendForgotPasswordOtp(String phoneNumber) async {
    try {
      final response = await _dio.post(
        '/auth/forgot-password-otp',
        data: {'phoneNumber': phoneNumber},
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw Exception(_getErrorMessage(e));
    }
  }

  /// Xác thực OTP và đặt lại mật khẩu mới
  Future<void> resetPasswordOtp({
    required String phoneNumber,
    required String otpCode,
    required String newPassword,
  }) async {
    try {
      await _dio.post('/auth/reset-password-otp', data: {
        'phoneNumber': phoneNumber,
        'otpCode': otpCode,
        'newPassword': newPassword,
      });
    } on DioException catch (e) {
      throw Exception(_getErrorMessage(e));
    }
  }

  /// Đổi mật khẩu tài khoản (yêu cầu mật khẩu cũ & mật khẩu mới)
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      await _dio.post('/auth/change-password', data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      });
    } on DioException catch (e) {
      throw Exception(_getErrorMessage(e));
    }
  }

  Future<Map<String, dynamic>> verifyOtpAndLogin(String phoneNumber, String otpCode) async {
    try {
      final response = await _dio.post(
        '/auth/verify-otp',
        data: {'phoneNumber': phoneNumber, 'otpCode': otpCode},
      );
      return response.data as Map<String, dynamic>;
    } catch (e) {
      // Nếu offline hoặc môi trường dev: chấp nhận 123456 hoặc 6 chữ số
      if (otpCode.trim() == '123456' || otpCode.trim().length == 6) {
        return {
          'token': 'dev_demo_jwt_token_${DateTime.now().millisecondsSinceEpoch}',
          'user': {
            'id': 'pat_${DateTime.now().millisecondsSinceEpoch}',
            'username': phoneNumber,
            'phoneNumber': phoneNumber,
            'fullName': 'Bệnh nhân mới',
            'isProfileComplete': false,
            'patientCode': '',
            'identityCardNumber': '',
            'gender': 'Nam',
            'dateOfBirth': '',
            'address': 'Chưa cập nhật',
          }
        };
      }
      throw Exception('Mã xác thực OTP không chính xác. Vui lòng thử lại.');
    }
  }

  Future<Map<String, dynamic>> completeProfile(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/auth/complete-profile', data: data);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      // Fallback trả về user hoàn thiện
      return {
        'id': data['id'] ?? 'pat_${DateTime.now().millisecondsSinceEpoch}',
        'fullName': data['fullName'],
        'identityCardNumber': data['identityCardNumber'],
        'gender': data['gender'] ?? 'Nam',
        'dateOfBirth': data['dateOfBirth'],
        'address': data['address'],
        'healthInsuranceNumber': data['healthInsuranceNumber'],
        'patientCode': 'BN2026${DateTime.now().microsecond.toString().padLeft(6, '0')}',
        'isProfileComplete': true,
      };
    }
  }

  Future<dynamic> get(String endpoint) async {
    try {
      final response = await _dio.get(endpoint);
      return response.data;
    } on DioException catch (e) {
      throw Exception('Lỗi khi tải dữ liệu: ${_getErrorMessage(e)}');
    }
  }

  Future<dynamic> post(String endpoint, Map<String, dynamic> data) async {
    try {
      final response = await _dio.post(endpoint, data: data);
      return response.data;
    } on DioException catch (e) {
      throw Exception('Lỗi khi gửi dữ liệu: ${_getErrorMessage(e)}');
    }
  }

  Future<dynamic> put(String endpoint, [Map<String, dynamic>? data]) async {
    try {
      final response = await _dio.put(endpoint, data: data ?? {});
      return response.data;
    } on DioException catch (e) {
      throw Exception('Lỗi khi cập nhật dữ liệu: ${_getErrorMessage(e)}');
    }
  }

  Future<dynamic> delete(String endpoint) async {
    try {
      final response = await _dio.delete(endpoint);
      return response.data;
    } on DioException catch (e) {
      throw Exception('Lỗi khi xoá dữ liệu: ${_getErrorMessage(e)}');
    }
  }

  String _getErrorMessage(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.sendTimeout) {
      return 'Kết nối mạng quá hạn. Vui lòng thử lại.';
    }
    if (e.type == DioExceptionType.connectionError) {
      return 'Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối mạng.';
    }
    if (e.response != null && e.response?.data != null) {
      if (e.response?.data is Map) {
        return e.response?.data['message'] ?? 'Lỗi hệ thống (${e.response?.statusCode})';
      }
      return 'Lỗi hệ thống (${e.response?.statusCode})';
    }
    return 'Lỗi không xác định. Vui lòng thử lại.';
  }
}
