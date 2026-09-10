import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/constants.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  final String baseUrl = AppConstants.baseUrl;

  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'tenDangNhap': username, 'matKhau': password}),
    ).timeout(const Duration(seconds: 2));

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Đăng nhập thất bại');
    }
  }
  
  Future<List<dynamic>> get(String endpoint) async {
    final response = await http.get(
      Uri.parse('$baseUrl$endpoint'),
      headers: await _getHeaders(),
    ).timeout(const Duration(seconds: 2));
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to load data');
  }

  Future<Map<String, dynamic>> post(String endpoint, Map<String, dynamic> body) async {
    final response = await http.post(
      Uri.parse('$baseUrl$endpoint'),
      headers: await _getHeaders(),
      body: jsonEncode(body),
    ).timeout(const Duration(seconds: 2));
    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to post data');
  }
}
