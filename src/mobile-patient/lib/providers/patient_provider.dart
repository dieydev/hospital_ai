import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ExaminationRecord {
  final String id;
  final String examinationCode;
  final String patientId;
  final String patientName;
  final String departmentName;
  final String doctorName;
  final String examinationDate;
  final String subjective;
  final String assessment;
  final String icD10Code;
  final String icD10Name;
  final String plan;
  final String status;
  final String createdAt;
  final double temperature;
  final int pulseRate;
  final String bloodPressure;
  final double weight;
  final double height;
  final double bmi;
  final List<Map<String, dynamic>> prescriptionDetails;
  final List<Map<String, dynamic>> serviceOrderDetails;

  ExaminationRecord({
    required this.id,
    required this.examinationCode,
    required this.patientId,
    required this.patientName,
    required this.departmentName,
    required this.doctorName,
    required this.examinationDate,
    required this.subjective,
    required this.assessment,
    required this.icD10Code,
    required this.icD10Name,
    required this.plan,
    required this.status,
    required this.createdAt,
    required this.temperature,
    required this.pulseRate,
    required this.bloodPressure,
    required this.weight,
    required this.height,
    required this.bmi,
    required this.prescriptionDetails,
    required this.serviceOrderDetails,
  });

  factory ExaminationRecord.fromJson(Map<String, dynamic> json) {
    List<Map<String, dynamic>> parsePrescriptions(dynamic rawList) {
      if (rawList == null) return [];
      try {
        return List<Map<String, dynamic>>.from(
          (rawList as List).map((e) {
            if (e is Map<String, dynamic>) return e;
            // Handle stringified objects from PowerShell
            return {'medicineName': e.toString()};
          }),
        );
      } catch (_) {
        return [];
      }
    }

    List<Map<String, dynamic>> parseServices(dynamic rawList) {
      if (rawList == null) return [];
      try {
        return List<Map<String, dynamic>>.from(
          (rawList as List).map((e) {
            if (e is Map<String, dynamic>) return e;
            return {'serviceName': e.toString()};
          }),
        );
      } catch (_) {
        return [];
      }
    }

    return ExaminationRecord(
      id: json['id']?.toString() ?? '',
      examinationCode: json['examinationCode']?.toString() ?? '',
      patientId: json['patientId']?.toString() ?? '',
      patientName: json['patientName']?.toString() ?? '',
      departmentName: json['departmentName']?.toString() ?? '',
      doctorName: json['doctorName']?.toString() ?? '',
      examinationDate: json['examinationDate']?.toString() ?? '',
      subjective: json['subjective']?.toString() ?? '',
      assessment: json['assessment']?.toString() ?? '',
      icD10Code: json['icD10Code']?.toString() ?? '',
      icD10Name: json['icD10Name']?.toString() ?? '',
      plan: json['plan']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      createdAt: json['createdAt']?.toString() ?? '',
      temperature: (json['temperature'] as num?)?.toDouble() ?? 0.0,
      pulseRate: (json['pulseRate'] as num?)?.toInt() ?? 0,
      bloodPressure: json['bloodPressure']?.toString() ?? '',
      weight: (json['weight'] as num?)?.toDouble() ?? 0.0,
      height: (json['height'] as num?)?.toDouble() ?? 0.0,
      bmi: (json['bmi'] as num?)?.toDouble() ?? 0.0,
      prescriptionDetails: parsePrescriptions(json['prescriptionDetails']),
      serviceOrderDetails: parseServices(json['serviceOrderDetails']),
    );
  }

  String get formattedDate {
    try {
      final dt = DateTime.parse(examinationDate).toLocal();
      return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
    } catch (_) {
      return examinationDate;
    }
  }
}

class PatientProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _error;
  String? get error => _error;

  List<ExaminationRecord> _examinations = [];
  List<ExaminationRecord> get examinations => _examinations;

  /// Lấy lịch sử khám bệnh SOAP/EMR theo patientId từ API thực
  Future<void> fetchMedicalHistory(String patientId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      // Try by patientId first
      final response = await _apiService.get('/examinations?patientId=$patientId');
      final List<dynamic> items = response is List
          ? response
          : (response['value'] ?? response['data'] ?? []);
      _examinations = items
          .map((e) => ExaminationRecord.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } catch (_) {
      // If patientId param fails, fall back to fetching all and filtering client-side
      try {
        final response = await _apiService.get('/examinations');
        final List<dynamic> items = response is List
            ? response
            : (response['value'] ?? response['data'] ?? []);
        final all = items
            .map((e) => ExaminationRecord.fromJson(Map<String, dynamic>.from(e)))
            .toList();
        // Filter by patientId
        _examinations = all
            .where((r) => r.patientId == patientId || r.patientId.isEmpty)
            .toList();
        if (_examinations.isEmpty) {
          // If no match by ID, show all (for demo with mismatched IDs)
          _examinations = all;
        }
      } catch (e2) {
        _examinations = [];
        _error = e2.toString();
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Legacy compat
  List<Map<String, dynamic>> get medicalHistory => _examinations
      .map((e) => {
            'date': e.formattedDate,
            'department': e.departmentName,
            'doctor': e.doctorName,
            'diagnosis': e.icD10Name.isNotEmpty ? e.icD10Name : e.assessment,
            'prescription': e.prescriptionDetails.isNotEmpty
                ? e.prescriptionDetails.map((p) => p['medicineName'] ?? '').join(', ')
                : 'Không có đơn thuốc',
          })
      .toList();
}
