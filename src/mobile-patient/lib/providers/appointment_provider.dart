import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AppointmentProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;
  
  List<String> _departments = [];
  List<String> get departments => _departments;

  List<Map<String, dynamic>> _doctors = [];
  List<Map<String, dynamic>> get doctors => _doctors;

  // Ideally this should also come from API to avoid conflict, 
  // but keeping it as requested until backend provides a specific endpoint.
  List<String> _timeSlots = [
    '07:30 - 08:00',
    '08:00 - 08:30',
    '08:30 - 09:00',
    '09:00 - 09:30',
    '09:30 - 10:00',
    '10:00 - 10:30',
    '13:30 - 14:00',
    '14:00 - 14:30',
    '14:30 - 15:00',
  ];
  List<String> get timeSlots => _timeSlots;

  Future<void> fetchDepartments() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final res = await _apiService.get('/queue/departments');
      _departments = List<String>.from(res.map((d) => d['departmentName']));
    } catch (e) {
      _departments = [];
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchDoctors(String department) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final res = await _apiService.get('/auth/doctors');
      final allDoctors = List<Map<String, dynamic>>.from(res);
      // Filter by department locally since backend doesn't filter
      _doctors = allDoctors.where((doc) => doc['dept'] == department).toList();
    } catch (e) {
      _doctors = [];
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> bookAppointment(Map<String, dynamic> appointmentData) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _apiService.post('/appointments', appointmentData);
    } catch (e) {
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<String?> getVnPayUrl(double amount, String orderDescription) async {
    try {
      final res = await _apiService.post('/payment/create-payment-url', {
        'amount': amount,
        'orderDescription': orderDescription,
        'orderId': 'LH${DateTime.now().millisecondsSinceEpoch.toString().substring(6)}'
      });
      return res['url'] as String?;
    } catch (e) {
      rethrow;
    }
  }
}
