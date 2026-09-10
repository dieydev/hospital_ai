import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AppointmentProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  bool _isLoading = false;
  bool get isLoading => _isLoading;
  
  List<String> _departments = [];
  List<String> get departments => _departments;

  List<Map<String, dynamic>> _doctors = [];
  List<Map<String, dynamic>> get doctors => _doctors;

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
    notifyListeners();
    try {
      // Temporary fallback until backend is fully up
      try {
        final res = await _apiService.get('/departments');
        _departments = List<String>.from(res.map((d) => d['name']));
      } catch (e) {
        _departments = [
          'Khoa Nội Tổng Hợp',
          'Khoa Nhi',
          'Khoa Mắt',
          'Khoa Ngoại',
          'Khoa Tai Mũi Họng',
          'Khoa Răng Hàm Mặt',
        ];
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchDoctors(String department) async {
    _isLoading = true;
    notifyListeners();
    try {
      try {
        final res = await _apiService.get('/doctors?department=$department');
        _doctors = List<Map<String, dynamic>>.from(res);
      } catch (e) {
        // Fallback dummy data
        final dummyDoctors = [
          {
            'name': 'BS. CKII. Nguyễn Thanh Duy',
            'dept': 'Khoa Nội Tổng Hợp',
            'title': 'Trưởng Khoa Nội',
            'avatar': 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
          },
          {
            'name': 'BS. CKI. Lê Văn Tuấn',
            'dept': 'Khoa Nội Tổng Hợp',
            'title': 'Bác sĩ Điều trị',
            'avatar': 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
          },
          {
            'name': 'BS. CKI. Phạm Minh Đức',
            'dept': 'Khoa Nhi',
            'title': 'Trưởng Khoa Nhi',
            'avatar': 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
          },
          {
            'name': 'BS. Trần Ngọc Mai',
            'dept': 'Khoa Mắt',
            'title': 'Trưởng Khoa Mắt',
            'avatar': 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
          },
          {
            'name': 'BS. CKII. Hoàng Văn Hùng',
            'dept': 'Khoa Ngoại',
            'title': 'Trưởng Khoa Ngoại',
            'avatar': 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop&q=80',
          },
          {
            'name': 'BS. CKI. Vũ Thị Hà',
            'dept': 'Khoa Tai Mũi Họng',
            'title': 'Trưởng Khoa TMH',
            'avatar': 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=150&auto=format&fit=crop&q=80',
          },
          {
            'name': 'BS. Đỗ Minh Triết',
            'dept': 'Khoa Răng Hàm Mặt',
            'title': 'Trưởng Khoa RHM',
            'avatar': 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
          }
        ];
        _doctors = dummyDoctors.where((d) => d['dept'] == department).toList();
      }
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
      return null;
    }
  }
}
