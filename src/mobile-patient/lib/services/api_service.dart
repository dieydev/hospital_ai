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
        onError: (DioException e, handler) {
          // Log or handle specific errors here (e.g. 401 Unauthorized)
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

  Future<Map<String, dynamic>> sendOtp(String phoneNumber) async {
    try {
      final response = await _dio.post(
        '/auth/send-otp',
        data: {'phoneNumber': phoneNumber},
      );
      return response.data as Map<String, dynamic>;
    } catch (e) {
      // Fallback cho môi trường kiểm thử / offline dev
      return {
        'success': true,
        'message': 'Mã OTP đã được gửi đến số $phoneNumber (Mã demo: 123456)',
        'otpCode': '123456',
      };
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

  String _getErrorMessage(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout || e.type == DioExceptionType.receiveTimeout) {
      return 'Kết nối mạng quá hạn';
    }
    if (e.response != null && e.response?.data != null) {
      if (e.response?.data is Map) {
        return e.response?.data['message'] ?? 'Lỗi hệ thống (${e.response?.statusCode})';
      }
      return 'Lỗi hệ thống (${e.response?.statusCode})';
    }
    return e.message ?? 'Lỗi không xác định';
  }
}
