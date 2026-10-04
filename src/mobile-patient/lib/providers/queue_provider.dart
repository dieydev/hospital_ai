import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/patient_model.dart';
import '../models/queue_ticket_model.dart';
import '../services/api_service.dart';

class QueueProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  List<QueueTicketModel> _allTickets = [];
  List<QueueTicketModel> get allTickets => _allTickets;

  List<Map<String, dynamic>> _departments = [];
  List<Map<String, dynamic>> get departments => _departments;

  List<DepartmentQueueSummary> _departmentSummaries = [];
  List<DepartmentQueueSummary> get departmentSummaries => _departmentSummaries;

  QueueTicketModel? _myTicket;
  QueueTicketModel? get myTicket => _myTicket;
  bool get hasActiveTicket => _myTicket != null;

  int? _currentCallingNumber;
  int? get currentCallingNumber => _currentCallingNumber;

  int _remainingAhead = 0;
  int get remainingAhead => _remainingAhead;

  int get estimatedWaitMinutes => _remainingAhead * 8;

  bool get isMyTurn => _myTicket != null && _myTicket!.isCalling;

  Timer? _pollingTimer;
  String? _lastTrackedId;
  String? _lastTrackedCccd;
  String? _lastTrackedCode;
  String? _lastTrackedName;
  String? _manualTrackedTicketId;

  // Track previous status to detect call event
  String? _previousStatus;
  bool _justCalledAlert = false;
  bool get justCalledAlert => _justCalledAlert;

  void dismissCallAlert() {
    _justCalledAlert = false;
    notifyListeners();
  }

  /// Chọn theo dõi trực tiếp một phiếu cụ thể (Ví dụ phiếu #101)
  void trackTicket(QueueTicketModel ticket) {
    _manualTrackedTicketId = ticket.id;
    _myTicket = ticket;
    _calculateStatsForTicket(ticket);
    notifyListeners();
  }

  /// Tra cứu phiếu theo số thứ tự (ví dụ: "101") hoặc số CCCD / Mã BN
  bool trackByNumberOrQuery(String query) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return false;

    final found = _allTickets.firstWhere(
      (t) =>
          t.sequenceNumber.toString() == q ||
          t.sequenceNumber.toString() == q.replaceAll('#', '') ||
          t.patientCode.toLowerCase() == q ||
          t.identityCardNumber.trim() == q ||
          _normalizeText(t.patientName).contains(_normalizeText(q)),
      orElse: () => QueueTicketModel(
        id: '',
        patientId: '',
        patientCode: '',
        patientName: '',
        patientGender: '',
        patientAge: 0,
        identityCardNumber: '',
        departmentId: '',
        departmentName: '',
        location: '',
        sequenceNumber: 0,
        status: '',
        priority: '',
        createdAt: DateTime.now(),
      ),
    );

    if (found.id.isNotEmpty) {
      trackTicket(found);
      return true;
    }
    return false;
  }

  /// Xoá chế độ theo dõi thủ công
  void clearManualTracking() {
    _manualTrackedTicketId = null;
    _myTicket = null;
    fetchQueue(silent: true);
  }

  /// Chuẩn hoá tiếng Việt không dấu để so khớp tên
  static String _normalizeText(String str) {
    var withDia = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ';
    var withoutDia = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD';
    for (int i = 0; i < withDia.length; i++) {
      str = str.replaceAll(withDia[i], withoutDia[i]);
    }
    return str.toLowerCase().trim();
  }

  /// Bắt đầu cập nhật thời gian thực (Polling mỗi 3 giây)
  void startRealtimePolling({
    String? patientId,
    String? cccd,
    String? patientCode,
    String? patientName,
  }) {
    _lastTrackedId = patientId;
    _lastTrackedCccd = cccd;
    _lastTrackedCode = patientCode;
    _lastTrackedName = patientName;

    // Fetch ngay lập tức
    fetchQueue(
      patientId: patientId,
      cccd: cccd,
      patientCode: patientCode,
      patientName: patientName,
    );

    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      fetchQueue(
        patientId: _lastTrackedId,
        cccd: _lastTrackedCccd,
        patientCode: _lastTrackedCode,
        patientName: _lastTrackedName,
        silent: true,
      );
    });
  }

  /// Dừng cập nhật nền khi thoát màn hình
  void stopRealtimePolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  /// Tải dữ liệu hàng chờ từ Backend Gateway
  Future<void> fetchQueue({
    String? patientId,
    String? cccd,
    String? patientCode,
    String? patientName,
    bool silent = false,
  }) async {
    if (!silent) {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();
    }

    try {
      // 1. Tải danh sách phòng khám & khoa
      final deptData = await _apiService.get('/queue/departments');
      if (deptData is List) {
        _departments = deptData.map((d) => Map<String, dynamic>.from(d)).toList();
      }

      // 2. Tải danh sách hàng chờ trong ngày
      final queueData = await _apiService.get('/queue');
      if (queueData is List) {
        _allTickets = queueData.map((q) => QueueTicketModel.fromJson(Map<String, dynamic>.from(q))).toList();
      } else {
        _allTickets = [];
      }

      // 3. Xây dựng bảng tóm tắt từng phòng khám (Department Summaries)
      _departmentSummaries = _departments.map((dept) {
        return DepartmentQueueSummary.fromDepartment(dept, _allTickets);
      }).toList();

      // 4. Tìm kiếm vé của bệnh nhân đang theo dõi
      QueueTicketModel? foundTicket;

      // Ưu tiên 1: Vé được chỉ định theo dõi thủ công bằng ID
      if (_manualTrackedTicketId != null) {
        final matches = _allTickets.where((t) => t.id == _manualTrackedTicketId);
        if (matches.isNotEmpty) {
          foundTicket = matches.first;
        }
      }

      // Ưu tiên 2: Tự động so khớp theo ID, CCCD, Mã BN, hoặc Tên bệnh nhân
      if (foundTicket == null) {
        for (final t in _allTickets) {
          if (t.isSkipped) continue;

          final matchId = patientId != null &&
              patientId.isNotEmpty &&
              t.patientId.toLowerCase() == patientId.toLowerCase();

          final matchCccd = cccd != null &&
              cccd.isNotEmpty &&
              t.identityCardNumber.trim() == cccd.trim();

          final matchCode = patientCode != null &&
              patientCode.isNotEmpty &&
              t.patientCode.toLowerCase() == patientCode.toLowerCase();

          final matchName = patientName != null &&
              patientName.trim().isNotEmpty &&
              _normalizeText(t.patientName) == _normalizeText(patientName);

          if (matchId || matchCccd || matchCode || matchName) {
            foundTicket = t;
            if (!t.isFinished) {
              break;
            }
          }
        }
      }

      _myTicket = foundTicket;

      // 5. Nếu có vé, tính toán STT đang gọi & số lượt chờ trước
      if (_myTicket != null) {
        _calculateStatsForTicket(_myTicket!);
      } else {
        _currentCallingNumber = null;
        _remainingAhead = 0;
        _previousStatus = null;
      }

      _errorMessage = null;
    } catch (e) {
      if (!silent) {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      }
    } finally {
      if (!silent) {
        _isLoading = false;
      }
      notifyListeners();
    }
  }

  void _calculateStatsForTicket(QueueTicketModel ticket) {
    final deptTickets = _allTickets
        .where((t) => t.departmentId.toLowerCase() == ticket.departmentId.toLowerCase())
        .toList();

    // Tìm vé đang gọi loa trong cùng phòng
    final callingTicket = deptTickets.firstWhere(
      (t) => t.isCalling,
      orElse: () => deptTickets.firstWhere(
        (t) => t.isProcessing,
        orElse: () => deptTickets.firstWhere(
          (t) => t.isWaiting,
          orElse: () => ticket,
        ),
      ),
    );

    _currentCallingNumber = callingTicket.sequenceNumber;

    // Đếm số người Waiting đang xếp trước mình
    _remainingAhead = deptTickets.where((t) {
      return t.isWaiting && t.sequenceNumber < ticket.sequenceNumber;
    }).length;

    // Phát hiện sự kiện vừa được Gọi loa (Transition to Calling)
    if (_previousStatus != null &&
        _previousStatus != 'Calling' &&
        ticket.isCalling) {
      _justCalledAlert = true;
    }
    _previousStatus = ticket.status;
  }

  /// Lấy số thứ tự khám trực tuyến (Real-time Issue Ticket)
  Future<QueueTicketModel> issueOnlineTicket({
    required String departmentId,
    required PatientModel patient,
    String priority = 'Normal',
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // Xác định GUID bệnh nhân trên hệ thống Backend
      String realPatientGuid = patient.id;

      // Kiểm tra xem ID có phải là định dạng GUID chuẩn hay không (36 ký tự)
      final isGuid = RegExp(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')
          .hasMatch(realPatientGuid);

      if (!isGuid) {
        // Thử tìm bệnh nhân theo CCCD
        try {
          final cccdClean = patient.soCCCD.trim();
          final existingPatient = await _apiService.get('/patients/identity/$cccdClean');
          if (existingPatient != null && existingPatient['id'] != null) {
            realPatientGuid = existingPatient['id'].toString();
          }
        } catch (_) {
          // Bệnh nhân chưa có trong DB SQL Server -> Tạo mới ngay
          final createData = {
            'fullName': patient.hoTen.trim(),
            'gender': patient.gioiTinh,
            'dateOfBirth': patient.ngaySinh.isNotEmpty ? patient.ngaySinh : '1995-01-01',
            'identityCardNumber': patient.soCCCD.trim(),
            'healthInsuranceNumber': patient.maTheBHYT,
            'phoneNumber': patient.soDienThoai ?? '',
            'address': patient.diaChi ?? 'TP.HCM',
          };
          final newPatient = await _apiService.post('/patients', createData);
          if (newPatient != null && newPatient['id'] != null) {
            realPatientGuid = newPatient['id'].toString();
          }
        }
      }

      // Gửi yêu cầu Cấp số thứ tự đến QueueService
      final issuePayload = {
        'patientId': realPatientGuid,
        'departmentId': departmentId,
        'priority': priority,
      };

      final ticketResult = await _apiService.post('/queue/issue', issuePayload);
      final newTicket = QueueTicketModel.fromJson(Map<String, dynamic>.from(ticketResult));

      _myTicket = newTicket;
      _manualTrackedTicketId = newTicket.id;
      _lastTrackedId = realPatientGuid;
      _lastTrackedCccd = newTicket.identityCardNumber;
      _lastTrackedCode = newTicket.patientCode;
      _lastTrackedName = newTicket.patientName;

      // Làm mới lại toàn bộ hàng chờ
      await fetchQueue(
        patientId: realPatientGuid,
        cccd: newTicket.identityCardNumber,
        patientCode: newTicket.patientCode,
        patientName: newTicket.patientName,
        silent: true,
      );

      return newTicket;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Huỷ hoặc bỏ qua phiếu của tôi (Bác sĩ hoặc bệnh nhân xin dời lượt)
  Future<void> cancelMyTicket() async {
    if (_myTicket == null) return;
    _isLoading = true;
    notifyListeners();

    try {
      await _apiService.put('/queue/${_myTicket!.id}/status', {'status': 'Skipped'});
      _manualTrackedTicketId = null;
      _myTicket = null;
      await fetchQueue(silent: true);
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }
}
