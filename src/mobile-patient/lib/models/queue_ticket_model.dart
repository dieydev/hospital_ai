import 'package:flutter/material.dart';

class QueueTicketModel {
  final String id;
  final String patientId;
  final String patientCode;
  final String patientName;
  final String patientGender;
  final int patientAge;
  final String identityCardNumber;
  final String? healthInsuranceNumber;
  final String departmentId;
  final String departmentName;
  final String location;
  final int sequenceNumber;
  final String status; // Waiting, Calling, Processing, Skipped, Finished
  final String priority; // Normal, Priority, Emergency
  final DateTime createdAt;

  QueueTicketModel({
    required this.id,
    required this.patientId,
    required this.patientCode,
    required this.patientName,
    required this.patientGender,
    required this.patientAge,
    required this.identityCardNumber,
    this.healthInsuranceNumber,
    required this.departmentId,
    required this.departmentName,
    required this.location,
    required this.sequenceNumber,
    required this.status,
    required this.priority,
    required this.createdAt,
  });

  bool get isWaiting => status.toLowerCase() == 'waiting';
  bool get isCalling => status.toLowerCase() == 'calling';
  bool get isProcessing => status.toLowerCase() == 'processing' || status.toLowerCase() == 'examining';
  bool get isFinished => status.toLowerCase() == 'finished' || status.toLowerCase() == 'completed';
  bool get isSkipped => status.toLowerCase() == 'skipped';

  bool get isEmergency => priority.toLowerCase() == 'emergency' || priority.toLowerCase() == 'priority';

  String get statusDisplay {
    switch (status.toLowerCase()) {
      case 'calling':
        return 'Mời vào phòng khám';
      case 'processing':
      case 'examining':
        return 'Đang trong phòng khám';
      case 'finished':
      case 'completed':
        return 'Đã khám xong';
      case 'skipped':
        return 'Đã qua lượt';
      case 'waiting':
      default:
        return 'Đang chờ khám';
    }
  }

  Color get statusColor {
    switch (status.toLowerCase()) {
      case 'calling':
        return const Color(0xFF10B981); // Emerald
      case 'processing':
      case 'examining':
        return const Color(0xFF0284C7); // Sky 600
      case 'finished':
      case 'completed':
        return const Color(0xFF64748B); // Slate 500
      case 'skipped':
        return const Color(0xFFEF4444); // Red
      case 'waiting':
      default:
        return const Color(0xFFF59E0B); // Amber
    }
  }

  factory QueueTicketModel.fromJson(Map<String, dynamic> json) {
    return QueueTicketModel(
      id: json['id']?.toString() ?? '',
      patientId: json['patientId']?.toString() ?? '',
      patientCode: json['patientCode']?.toString() ?? '',
      patientName: json['patientName']?.toString() ?? '',
      patientGender: json['patientGender']?.toString() ?? '',
      patientAge: json['patientAge'] is int ? json['patientAge'] : int.tryParse(json['patientAge']?.toString() ?? '0') ?? 0,
      identityCardNumber: json['identityCardNumber']?.toString() ?? '',
      healthInsuranceNumber: json['healthInsuranceNumber']?.toString(),
      departmentId: json['departmentId']?.toString() ?? '',
      departmentName: json['departmentName']?.toString() ?? 'Phòng Khám',
      location: json['location']?.toString() ?? 'Tầng 1',
      sequenceNumber: json['sequenceNumber'] is int ? json['sequenceNumber'] : int.tryParse(json['sequenceNumber']?.toString() ?? '0') ?? 0,
      status: json['status']?.toString() ?? 'Waiting',
      priority: json['priority']?.toString() ?? 'Normal',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'patientId': patientId,
      'patientCode': patientCode,
      'patientName': patientName,
      'patientGender': patientGender,
      'patientAge': patientAge,
      'identityCardNumber': identityCardNumber,
      'healthInsuranceNumber': healthInsuranceNumber,
      'departmentId': departmentId,
      'departmentName': departmentName,
      'location': location,
      'sequenceNumber': sequenceNumber,
      'status': status,
      'priority': priority,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

class DepartmentQueueSummary {
  final String departmentId;
  final String departmentName;
  final String location;
  final String roomType;
  final int? currentCallingNumber;
  final int totalWaiting;
  final int totalServingToday;

  DepartmentQueueSummary({
    required this.departmentId,
    required this.departmentName,
    required this.location,
    required this.roomType,
    this.currentCallingNumber,
    required this.totalWaiting,
    required this.totalServingToday,
  });

  factory DepartmentQueueSummary.fromDepartment(
    Map<String, dynamic> deptJson,
    List<QueueTicketModel> allTickets,
  ) {
    final deptId = deptJson['id']?.toString() ?? '';
    final ticketsInDept = allTickets.where((t) => t.departmentId.toLowerCase() == deptId.toLowerCase()).toList();

    // Find calling or processing
    final calling = ticketsInDept.where((t) => t.isCalling || t.isProcessing).toList();
    int? currentCallingNumber;
    if (calling.isNotEmpty) {
      currentCallingNumber = calling.first.sequenceNumber;
    }

    final totalWaiting = ticketsInDept.where((t) => t.isWaiting).length;

    return DepartmentQueueSummary(
      departmentId: deptId,
      departmentName: deptJson['departmentName']?.toString() ?? 'Khoa Khám',
      location: deptJson['location']?.toString() ?? 'Khu A',
      roomType: deptJson['roomType']?.toString() ?? 'Clinical',
      currentCallingNumber: currentCallingNumber,
      totalWaiting: totalWaiting,
      totalServingToday: ticketsInDept.length,
    );
  }
}
