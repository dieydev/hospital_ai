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
      final response = await _apiService.get('/patients/$patientId/history');
      _medicalHistory = List<Map<String, dynamic>>.from(response);
    } catch (e) {
      _medicalHistory = [];
      // rethrow; // Uncomment if UI needs to show error
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
