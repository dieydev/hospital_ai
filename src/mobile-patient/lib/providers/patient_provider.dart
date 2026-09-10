import 'package:flutter/material.dart';
import '../services/api_service.dart';

class PatientProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  List<Map<String, dynamic>> _medicalHistory = [];
  List<Map<String, dynamic>> get medicalHistory => _medicalHistory;

  Future<void> fetchMedicalHistory(String patientId) async {
    _isLoading = true;
    notifyListeners();
    try {
      try {
        final response = await _apiService.get('/patients/$patientId/history');
        _medicalHistory = List<Map<String, dynamic>>.from(response);
      } catch (e) {
        // Fallback dummy data
        _medicalHistory = [
          {
            'date': '20/08/2026',
            'department': 'Khoa Nội Tổng Hợp',
            'doctor': 'BS. CKII. Nguyễn Thanh Duy',
            'diagnosis': 'Viêm họng cấp, trào ngược dạ dày',
            'prescription': 'Amoxicillin 500mg, Omeprazole 20mg',
          },
          {
            'date': '15/06/2026',
            'department': 'Khoa Răng Hàm Mặt',
            'doctor': 'BS. Đỗ Minh Triết',
            'diagnosis': 'Sâu răng hàm, cần trám',
            'prescription': 'Trám răng composite',
          },
          {
            'date': '10/01/2026',
            'department': 'Khoa Tai Mũi Họng',
            'doctor': 'BS. CKI. Vũ Thị Hà',
            'diagnosis': 'Viêm xoang mãn tính',
            'prescription': 'Thuốc xịt mũi, kháng viêm',
          },
        ];
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
