import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AppointmentProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  List<String> _departments = [
    'Khoa Nội Tổng Hợp',
    'Khoa Nhi',
    'Khoa Mắt',
    'Khoa Tai Mũi Họng',
    'Khoa Tim Mạch',
    'Khoa Tiêu Hóa',
    'Khoa Ngoại Tổng Quát',
    'Khoa Răng Hàm Mặt',
    'Khoa Da Liễu',
    'Khoa Sản Phụ Khoa',
    'Khoa Cấp Cứu & Hồi Sức',
  ];
  List<String> get departments => _departments;

  List<Map<String, dynamic>> _doctors = [];
  List<Map<String, dynamic>> get doctors => _doctors;

  final List<String> _timeSlots = [
    '07:30 - 08:00',
    '08:00 - 08:30',
    '08:30 - 09:00',
    '09:00 - 09:30',
    '09:30 - 10:00',
    '10:00 - 10:30',
    '13:30 - 14:00',
    '14:00 - 14:30',
    '14:30 - 15:00',
    '15:00 - 15:30',
    '15:30 - 16:00',
  ];
  List<String> get timeSlots => _timeSlots;

  // Danh mục Bác sĩ chuyên khoa chuẩn của từng Khoa phòng tại Bệnh viện D-Medical
  static final Map<String, List<Map<String, dynamic>>> _specialistDoctorsCatalog = {
    'Khoa Nội Tổng Hợp': [
      {
        'id': '11111111-1111-1111-1111-111111111111',
        'name': 'BS. CKII. Nguyễn Thanh Duy',
        'dept': 'Khoa Nội Tổng Hợp',
        'title': 'Trưởng Khoa Nội • 15 năm KN',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=DuyDoctor',
      },
      {
        'id': '22222222-2222-2222-2222-222222222222',
        'name': 'ThS. BS. Trần Thị Thu Hà',
        'dept': 'Khoa Nội Tổng Hợp',
        'title': 'Bác sĩ Nội khoa • 8 năm KN',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=HaDoctor',
      },
    ],
    'Khoa Nhi': [
      {
        'id': '33333333-3333-3333-3333-333333333333',
        'name': 'BS. CKI. Phạm Minh Đức',
        'dept': 'Khoa Nhi',
        'title': 'Trưởng Khoa Nhi • Chuyên khoa Sơ sinh',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=DucDoctor',
      },
      {
        'id': '44444444-4444-4444-4444-444444444444',
        'name': 'BS. Đặng Hồng Hạnh',
        'dept': 'Khoa Nhi',
        'title': 'Bác sĩ Nhi khoa • Tiêm chủng',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=HanhDoctor',
      },
    ],
    'Khoa Mắt': [
      {
        'id': '55555555-5555-5555-5555-555555555555',
        'name': 'BS. CKI. Trần Ngọc Mai',
        'dept': 'Khoa Mắt',
        'title': 'Trưởng Khoa Mắt • Phẫu thuật Phaco',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=MaiDoctor',
      },
      {
        'id': '66666666-6666-6666-6666-666666666666',
        'name': 'BS. Vũ Hoàng Long',
        'dept': 'Khoa Mắt',
        'title': 'Nhãn khoa & Khúc xạ thị giác',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=LongDoctor',
      },
    ],
    'Khoa Tai Mũi Họng': [
      {
        'id': '77777777-7777-7777-7777-777777777777',
        'name': 'BS. CKII. Lê Văn Tuấn',
        'dept': 'Khoa Tai Mũi Họng',
        'title': 'Trưởng Khoa TMH • Nội soi vi phẫu',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=TuanDoctor',
      },
      {
        'id': '88888888-8888-8888-8888-888888888888',
        'name': 'ThS. BS. Nguyễn Mai Linh',
        'dept': 'Khoa Tai Mũi Họng',
        'title': 'Bác sĩ Tai Mũi Họng',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=LinhDoctor',
      },
    ],
    'Khoa Tim Mạch': [
      {
        'id': '99999999-9999-9999-9999-999999999999',
        'name': 'TS. BS. Huỳnh Quốc Dũng',
        'dept': 'Khoa Tim Mạch',
        'title': 'Viện Tim Mạch • Can thiệp tim mạch',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=DungDoctor',
      },
      {
        'id': 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'name': 'BS. CKI. Vũ Thu Trang',
        'dept': 'Khoa Tim Mạch',
        'title': 'Siêu âm Tim & Tăng huyết áp',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=TrangDoctor',
      },
    ],
    'Khoa Tiêu Hóa': [
      {
        'id': 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'name': 'BS. CKII. Đinh Khắc Vương',
        'dept': 'Khoa Tiêu Hóa',
        'title': 'Trưởng Khoa Tiêu Hóa • Nội soi HP',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=VuongDoctor',
      },
      {
        'id': 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'name': 'BS. Hoàng Lan Anh',
        'dept': 'Khoa Tiêu Hóa',
        'title': 'Bác sĩ Gan Mật & Tiêu hóa',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=LanAnhDoctor',
      },
    ],
    'Khoa Ngoại Tổng Quát': [
      {
        'id': 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'name': 'BS. CKII. Đỗ Hoàng Giang',
        'dept': 'Khoa Ngoại Tổng Quát',
        'title': 'Trưởng Khoa Ngoại • Phẫu thuật Nội soi',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=GiangDoctor',
      },
      {
        'id': 'dddddddd-dddd-dddd-dddd-ddddddddddd2',
        'name': 'ThS. BS. Nguyễn Quốc Bảo',
        'dept': 'Khoa Ngoại Tổng Quát',
        'title': 'Phẫu thuật viên Tiêu hóa',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=BaoDoctor',
      },
    ],
    'Khoa Răng Hàm Mặt': [
      {
        'id': 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'name': 'BS. CKI. Hoàng Trọng Nghĩa',
        'dept': 'Khoa Răng Hàm Mặt',
        'title': 'Chuyên gia Chỉnh nha & Cấy Implant',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=NghiaDoctor',
      },
      {
        'id': 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2',
        'name': 'BS. Bùi Phương Thảo',
        'dept': 'Khoa Răng Hàm Mặt',
        'title': 'Nha khoa Tổng quát',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThaoDoctor',
      },
    ],
    'Khoa Da Liễu': [
      {
        'id': 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        'name': 'BS. CKI. Nguyễn Phương Anh',
        'dept': 'Khoa Da Liễu',
        'title': 'Da liễu & Laser Thẩm mỹ da',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=PhuongAnhDoctor',
      },
    ],
    'Khoa Sản Phụ Khoa': [
      {
        'id': '12121212-1212-1212-1212-121212121212',
        'name': 'BS. CKII. Lê Thị Kim Phượng',
        'dept': 'Khoa Sản Phụ Khoa',
        'title': 'Trưởng Khoa Sản • Quản lý thai kỳ',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=PhuongSanDoctor',
      },
      {
        'id': '12121212-1212-1212-1212-121212121213',
        'name': 'BS. Nguyễn Thị Ngọc Bích',
        'dept': 'Khoa Sản Phụ Khoa',
        'title': 'Khám Phụ khoa & Vô sinh',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=BichDoctor',
      },
    ],
    'Khoa Cấp Cứu & Hồi Sức': [
      {
        'id': '13131313-1313-1313-1313-131313131313',
        'name': 'BS. CKI. Trịnh Văn Thành',
        'dept': 'Khoa Cấp Cứu & Hồi Sức',
        'title': 'Trưởng kíp Cấp cứu 24/7',
        'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThanhDoctor',
      },
    ],
  };

  Future<void> fetchDepartments() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final res = await _apiService.get('/queue/departments');
      final fetchedDepts = List<String>.from(res.map((d) => d['departmentName']));
      if (fetchedDepts.isNotEmpty) {
        // Gộp danh mục từ server với danh mục chuyên khoa chuẩn để không bị thiếu khoa
        final combined = Set<String>.from(fetchedDepts)..addAll(_departments);
        _departments = combined.toList();
      }
    } catch (_) {
      // Giữ danh sách khoa mặc định nếu backend bận
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
      // Lọc theo khoa phòng
      final filtered = allDoctors.where((doc) {
        final d = doc['dept']?.toString() ?? '';
        return d == department || d.contains(department) || department.contains(d);
      }).toList();

      if (filtered.isNotEmpty) {
        _doctors = filtered;
      } else {
        _doctors = _specialistDoctorsCatalog[department] ??
            [
              {
                'id': 'doc_default',
                'name': 'BS. Chuyên khoa $department',
                'dept': department,
                'title': 'Bác sĩ Khám & Điều trị',
                'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=$department',
              }
            ];
      }
    } catch (_) {
      // Khi offline / fallback: Luôn lấy từ danh mục chuyên khoa của bệnh viện
      _doctors = _specialistDoctorsCatalog[department] ??
          [
            {
              'id': 'doc_default',
              'name': 'BS. Chuyên khoa $department',
              'dept': department,
              'title': 'Bác sĩ Khám & Điều trị',
              'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=$department',
            }
          ];
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
