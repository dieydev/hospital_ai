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

  List<Map<String, dynamic>> _slotQuotas = [];
  List<Map<String, dynamic>> get slotQuotas => _slotQuotas;

  Future<void> fetchTimeSlotsWithCapacity(String date, {String? department}) async {
    try {
      final res = await _apiService.get('/appointments/slots?date=$date');
      if (res is List) {
        _slotQuotas = List<Map<String, dynamic>>.from(res);
        notifyListeners();
      }
    } catch (_) {
      // Fallback: giữ danh sách hiện tại
    }
  }

  // Danh mục Bác sĩ chuyên khoa chuẩn của từng Khoa phòng tại Bệnh viện D-Medical
  static final Map<String, List<Map<String, dynamic>>> _specialistDoctorsCatalog = {
    'Khoa Nội Tổng Hợp': [
      {
        'id': 'doc-01',
        'name': 'BS. CKII. Nguyễn Thanh Duy',
        'dept': 'Khoa Nội Tổng Hợp',
        'title': 'Trưởng Khoa Nội • Bác sĩ Chuyên Khoa II',
        'experience': '15 năm kinh nghiệm BV Chợ Rẫy',
        'avatar': 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-02',
        'name': 'ThS. BS. Trần Thị Thu Hà',
        'dept': 'Khoa Nội Tổng Hợp',
        'title': 'Thạc sĩ Y học • Chuyên khoa Nội Tim Mạch',
        'experience': '8 năm kinh nghiệm Nội tim mạch',
        'avatar': 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-03',
        'name': 'BS. CKI. Lê Hoàng Nam',
        'dept': 'Khoa Nội Tổng Hợp',
        'title': 'Bác sĩ CKI • Chuyên khoa Nội Thần Kinh',
        'experience': '10 năm kinh nghiệm BV Nhân Dân Gia Định',
        'avatar': 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-04',
        'name': 'ThS. BS. Nguyễn Minh Châu',
        'dept': 'Khoa Nội Tổng Hợp',
        'title': 'Thạc sĩ Y học • Nội Hô Hấp',
        'experience': '9 năm kinh nghiệm BV Phạm Ngọc Thạch',
        'avatar': 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-05',
        'name': 'BS. CKI. Phạm Quốc Bảo',
        'dept': 'Khoa Nội Tổng Hợp',
        'title': 'Bác sĩ CKI • Nội Cơ Xương Khớp',
        'experience': '11 năm kinh nghiệm Nội cơ xương khớp',
        'avatar': 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80',
      },
    ],
    'Khoa Tiêu Hóa & Gan Mật': [
      {
        'id': 'doc-06',
        'name': 'BS. CKII. Đinh Khắc Vương',
        'dept': 'Khoa Tiêu Hóa & Gan Mật',
        'title': 'Trưởng Khoa Tiêu Hóa • Bác sĩ CKII',
        'experience': '16 năm kinh nghiệm Gan Mật & Dạ dày',
        'avatar': 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-07',
        'name': 'BS. Hoàng Lan Anh',
        'dept': 'Khoa Tiêu Hóa & Gan Mật',
        'title': 'Bác sĩ Nội soi Tiêu Hóa NBI',
        'experience': '7 năm kinh nghiệm Nội soi tiêu hóa',
        'avatar': 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-08',
        'name': 'TS. BS. Vũ Đức Trọng',
        'dept': 'Khoa Tiêu Hóa & Gan Mật',
        'title': 'Tiến sĩ Y khoa • Chuyên gia Bệnh Gan Mật',
        'experience': '18 năm kinh nghiệm Viêm gan & Xơ gan',
        'avatar': 'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-09',
        'name': 'ThS. BS. Lê Thị Cẩm Tú',
        'dept': 'Khoa Tiêu Hóa & Gan Mật',
        'title': 'Thạc sĩ Bác sĩ • Bệnh học Đại Tràng',
        'experience': '9 năm kinh nghiệm Nội soi đại trực tràng',
        'avatar': 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-10',
        'name': 'BS. CKI. Nguyễn Trọng Nhân',
        'dept': 'Khoa Tiêu Hóa & Gan Mật',
        'title': 'Bác sĩ CKI • Can thiệp Nội soi Tiêu Hóa',
        'experience': '8 năm kinh nghiệm Can thiệp cầm máu tiêu hóa',
        'avatar': 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&auto=format&fit=crop&q=80',
      },
    ],
    'Khoa Tim Mạch Can Thiệp': [
      {
        'id': 'doc-11',
        'name': 'TS. BS. Huỳnh Quốc Dũng',
        'dept': 'Khoa Tim Mạch Can Thiệp',
        'title': 'Tiến sĩ Y khoa • Trưởng Khoa Tim Mạch',
        'experience': '20 năm kinh nghiệm Can thiệp mạch',
        'avatar': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-12',
        'name': 'BS. CKI. Vũ Thu Trang',
        'dept': 'Khoa Tim Mạch Can Thiệp',
        'title': 'Bác sĩ CKI • Siêu âm Tim Doppler 4D',
        'experience': '9 năm kinh nghiệm Tăng huyết áp & Van tim',
        'avatar': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-13',
        'name': 'PGS. TS. BS. Ngô Tuấn Anh',
        'dept': 'Khoa Tim Mạch Can Thiệp',
        'title': 'Phó Giáo Sư • Chuyên gia Mạch Vành Cấp',
        'experience': '24 năm kinh nghiệm Viện Tim',
        'avatar': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-14',
        'name': 'ThS. BS. Đỗ Hoàng Sơn',
        'dept': 'Khoa Tim Mạch Can Thiệp',
        'title': 'Thạc sĩ Y học • Rối Loạn Nhịp & Điện Sinh Lý',
        'experience': '12 năm kinh nghiệm Holter ECG',
        'avatar': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-15',
        'name': 'BS. CKI. Bùi Thị Bích Ngọc',
        'dept': 'Khoa Tim Mạch Can Thiệp',
        'title': 'Bác sĩ CKI • Quản lý Suy Tim & Dự Phòng Đột Quỵ',
        'experience': '8 năm kinh nghiệm Tim mạch dự phòng',
        'avatar': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
      },
    ],
    'Khoa Nhi & Tiêm Chủng': [
      {
        'id': 'doc-16',
        'name': 'BS. CKI. Phạm Minh Đức',
        'dept': 'Khoa Nhi & Tiêm Chủng',
        'title': 'Trưởng Khoa Nhi • Chuyên gia Nhi Khoa Tổng Quát',
        'experience': '12 năm kinh nghiệm Nhi đồng 1',
        'avatar': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-17',
        'name': 'ThS. BS. Nguyễn Thị Thảo My',
        'dept': 'Khoa Nhi & Tiêm Chủng',
        'title': 'Thạc sĩ Nhi Khoa • Chuyên gia Hô Hấp Nhi',
        'experience': '8 năm kinh nghiệm BV Nhi Đồng 2',
        'avatar': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-18',
        'name': 'BS. CKII. Dương Hoàng Nam',
        'dept': 'Khoa Nhi & Tiêm Chủng',
        'title': 'Bác sĩ CKII • Bệnh Truyền Nhiễm & Vắc Xin',
        'experience': '17 năm kinh nghiệm Bệnh Nhiệt Đới & Nhi',
        'avatar': 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-19',
        'name': 'BS. CKI. Đặng Thùy Dương',
        'dept': 'Khoa Nhi & Tiêm Chủng',
        'title': 'Bác sĩ CKI • Dinh Dưỡng & Phát Triển Trẻ Em',
        'experience': '10 năm kinh nghiệm Dinh dưỡng Lâm sàng',
        'avatar': 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-20',
        'name': 'ThS. BS. Trần Gia Bảo',
        'dept': 'Khoa Nhi & Tiêm Chủng',
        'title': 'Thạc sĩ Bác sĩ • Hồi Sức Sơ Sinh & Nhũ Nhi',
        'experience': '9 năm kinh nghiệm Hồi sức sơ sinh',
        'avatar': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
      },
    ],
    'Khoa Ngoại Tổng Quát & Chấn Thương': [
      {
        'id': 'doc-21',
        'name': 'BS. CKII. Nguyễn Văn Toàn',
        'dept': 'Khoa Ngoại Tổng Quát & Chấn Thương',
        'title': 'Trưởng Khoa Ngoại • Phẫu Thuật Viên Nội Soi',
        'experience': '22 năm kinh nghiệm Ngoại Tổng Quát',
        'avatar': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-22',
        'name': 'TS. BS. Trần Hải Đăng',
        'dept': 'Khoa Ngoại Tổng Quát & Chấn Thương',
        'title': 'Tiến sĩ Y khoa • Chấn Thương Chỉnh Hình',
        'experience': '16 năm kinh nghiệm Thay khớp háng/gối',
        'avatar': 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-23',
        'name': 'BS. CKI. Hoàng Văn Hùng',
        'dept': 'Khoa Ngoại Tổng Quát & Chấn Thương',
        'title': 'Bác sĩ CKI • Chấn Thương Thể Thao',
        'experience': '11 năm kinh nghiệm Bác sĩ Thể thao',
        'avatar': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-24',
        'name': 'ThS. BS. Lê Quang Hưng',
        'dept': 'Khoa Ngoại Tổng Quát & Chấn Thương',
        'title': 'Thạc sĩ Bác sĩ • Ngoại Thần Kinh & Cột Sống',
        'experience': '13 năm kinh nghiệm Thoát vị đĩa đệm',
        'avatar': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-25',
        'name': 'BS. CKI. Võ Minh Quân',
        'dept': 'Khoa Ngoại Tổng Quát & Chấn Thương',
        'title': 'Bác sĩ CKI • Ngoại Tiết Niệu & Tán Sỏi',
        'experience': '9 năm kinh nghiệm Tán sỏi Laser',
        'avatar': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      },
    ],
    'Khoa Tai Mũi Họng': [
      {
        'id': 'doc-26',
        'name': 'BS. CKII. Lê Văn Tuấn',
        'dept': 'Khoa Tai Mũi Họng',
        'title': 'Trưởng Khoa TMH • Bác sĩ CKII',
        'experience': '14 năm kinh nghiệm Vi phẫu tai mũi họng',
        'avatar': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-27',
        'name': 'ThS. BS. Nguyễn Mai Phương',
        'dept': 'Khoa Tai Mũi Họng',
        'title': 'Thạc sĩ Bác sĩ • Nội Soi Ống Mềm Không Đau',
        'experience': '8 năm kinh nghiệm Nội soi TMH',
        'avatar': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-28',
        'name': 'BS. CKI. Đỗ Tuấn Kiệt',
        'dept': 'Khoa Tai Mũi Họng',
        'title': 'Bác sĩ CKI • Phẫu Thuật Coblator & Vi Mũi Xoang',
        'experience': '10 năm kinh nghiệm Phẫu thuật xoang FESS',
        'avatar': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-29',
        'name': 'ThS. BS. Phan Thùy Linh',
        'dept': 'Khoa Tai Mũi Họng',
        'title': 'Thạc sĩ Bác sĩ • Thính Học & Tiền Đình',
        'experience': '9 năm kinh nghiệm Đo thính lực & Ù tai',
        'avatar': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-30',
        'name': 'BS. CKI. Trương Quốc Việt',
        'dept': 'Khoa Tai Mũi Họng',
        'title': 'Bác sĩ CKI • Họng Thanh Quản & Giọng Nói',
        'experience': '11 năm kinh nghiệm Bệnh lý Dây thanh',
        'avatar': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
      },
    ],
    'Khoa Mắt Kỹ Thuật Cao': [
      {
        'id': 'doc-31',
        'name': 'BS. CKI. Trần Ngọc Mai',
        'dept': 'Khoa Mắt Kỹ Thuật Cao',
        'title': 'Trưởng Khoa Mắt • Phẫu Thuật Viên Phaco',
        'experience': '11 năm kinh nghiệm Bệnh viện Mắt',
        'avatar': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-32',
        'name': 'TS. BS. Nguyễn Thành Chung',
        'dept': 'Khoa Mắt Kỹ Thuật Cao',
        'title': 'Tiến sĩ Y khoa • Chuyên gia Khúc Xạ & Phaco',
        'experience': '19 năm kinh nghiệm Phẫu thuật Lasik/SMILE',
        'avatar': 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-33',
        'name': 'ThS. BS. Lê Hồng Vân',
        'dept': 'Khoa Mắt Kỹ Thuật Cao',
        'title': 'Thạc sĩ Bác sĩ • Kiểm Soát Cận Thị Tiến Triển',
        'experience': '8 năm kinh nghiệm Khúc xạ học đường',
        'avatar': 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-34',
        'name': 'BS. CKI. Vũ Đình Long',
        'dept': 'Khoa Mắt Kỹ Thuật Cao',
        'title': 'Bác sĩ CKI • Glôcôm & Đáy Mắt Đái Tháo Đường',
        'experience': '13 năm kinh nghiệm Bệnh viện Mắt TP.HCM',
        'avatar': 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-35',
        'name': 'ThS. BS. Phạm Bảo Châu',
        'dept': 'Khoa Mắt Kỹ Thuật Cao',
        'title': 'Thạc sĩ Bác sĩ • Tạo Hình Mí Mắt & Thẩm Mỹ Mắt',
        'experience': '10 năm kinh nghiệm Tạo hình Nhãn khoa',
        'avatar': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      },
    ],
    'Khoa Da Liễu & Thẩm Mỹ Da': [
      {
        'id': 'doc-36',
        'name': 'BS. CKII. Đặng Thu Thủy',
        'dept': 'Khoa Da Liễu & Thẩm Mỹ Da',
        'title': 'Trưởng Khoa Da Liễu • Bác sĩ Chuyên Khoa II',
        'experience': '18 năm kinh nghiệm Da liễu & Laser',
        'avatar': 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-37',
        'name': 'ThS. BS. Lê Minh Trí',
        'dept': 'Khoa Da Liễu & Thẩm Mỹ Da',
        'title': 'Thạc sĩ Bác sĩ • Trị Mụn & Sẹo Rỗ Chuẩn Y Khoa',
        'experience': '9 năm kinh nghiệm Thẩm mỹ nội khoa',
        'avatar': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-38',
        'name': 'BS. CKI. Nguyễn Phương Anh',
        'dept': 'Khoa Da Liễu & Thẩm Mỹ Da',
        'title': 'Bác sĩ CKI • Bệnh Tự Miễn & Dị Ứng Da',
        'experience': '10 năm kinh nghiệm BV Da Liễu',
        'avatar': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-39',
        'name': 'ThS. BS. Trần Quang Khải',
        'dept': 'Khoa Da Liễu & Thẩm Mỹ Da',
        'title': 'Thạc sĩ Bác sĩ • U Da & Tiểu Phẫu Thẩm Mỹ',
        'experience': '12 năm kinh nghiệm Phẫu thuật Da liễu',
        'avatar': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-40',
        'name': 'BS. CKI. Bùi Yến Nhi',
        'dept': 'Khoa Da Liễu & Thẩm Mỹ Da',
        'title': 'Bác sĩ CKI • Trẻ Hóa & Tiêm Vi Điểm Mesotherapy',
        'experience': '8 năm kinh nghiệm Thẩm mỹ da công nghệ cao',
        'avatar': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      },
    ],
    'Khoa Chẩn Đoán Hình Ảnh & Thăm Dò': [
      {
        'id': 'doc-41',
        'name': 'TS. BS. Nguyễn Hoàng Nam',
        'dept': 'Khoa Chẩn Đoán Hình Ảnh & Thăm Dò',
        'title': 'Tiến sĩ Y khoa • Trưởng Khoa CĐHA',
        'experience': '20 năm kinh nghiệm MRI & CT Scanner',
        'avatar': 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-42',
        'name': 'ThS. BS. Đinh Văn Phong',
        'dept': 'Khoa Chẩn Đoán Hình Ảnh & Thăm Dò',
        'title': 'Thạc sĩ Bác sĩ • Siêu Âm Doppler Mạch Máu',
        'experience': '12 năm kinh nghiệm Siêu âm màu 4D/5D',
        'avatar': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-43',
        'name': 'BS. CKI. Vũ Thị Thơm',
        'dept': 'Khoa Chẩn Đoán Hình Ảnh & Thăm Dò',
        'title': 'Bác sĩ CKI • Siêu Âm Tuyến Giáp & Nhũ Hoa (TIRADS/BIRADS)',
        'experience': '14 năm kinh nghiệm Tầm soát U tuyến vú',
        'avatar': 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-44',
        'name': 'ThS. BS. Lâm Quốc Huy',
        'dept': 'Khoa Chẩn Đoán Hình Ảnh & Thăm Dò',
        'title': 'Thạc sĩ Bác sĩ • Can Thiệp Hình Ảnh & Sinh Thiết FNA',
        'experience': '11 năm kinh nghiệm Can thiệp tối thiểu',
        'avatar': 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
      },
      {
        'id': 'doc-45',
        'name': 'BS. CKI. Lê Thị Diễm Hương',
        'dept': 'Khoa Chẩn Đoán Hình Ảnh & Thăm Dò',
        'title': 'Bác sĩ CKI • X-Quang Kỹ Thuật Số & Đo Loãng Xương DEXA',
        'experience': '9 năm kinh nghiệm Đo mật độ xương',
        'avatar': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
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

  Future<Map<String, dynamic>?> bookAppointment(Map<String, dynamic> appointmentData) async {
    _isLoading = true;
    notifyListeners();
    try {
      final res = await _apiService.post('/appointments', appointmentData);
      return res is Map<String, dynamic> ? res : null;
    } catch (e) {
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  List<Map<String, dynamic>> _myAppointments = [];
  List<Map<String, dynamic>> get myAppointments => _myAppointments;

  Future<void> fetchMyAppointments(String phoneNumber, {String? patientCode}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final res = await _apiService.get('/appointments');
      if (res is List) {
        final phoneClean = phoneNumber.replaceAll(RegExp(r'\s+'), '');
        _myAppointments = res
            .whereType<Map<String, dynamic>>()
            .where((a) {
              final aPhone = (a['patientPhone']?.toString() ?? '').replaceAll(RegExp(r'\s+'), '');
              final aCode = a['patientCode']?.toString() ?? '';
              return (phoneClean.isNotEmpty && aPhone.contains(phoneClean)) ||
                     (patientCode != null && patientCode.isNotEmpty && aCode == patientCode);
            })
            .toList();
      }
    } catch (_) {
      // Giữ danh sách hiện tại nếu có lỗi mạng
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> cancelAppointment(String appointmentId) async {
    try {
      await _apiService.put('/appointments/$appointmentId/status', {'status': 'Cancelled'});
      final idx = _myAppointments.indexWhere((a) => a['id']?.toString() == appointmentId);
      if (idx != -1) {
        _myAppointments[idx]['status'] = 'Cancelled';
        notifyListeners();
      }
      return true;
    } catch (_) {
      final idx = _myAppointments.indexWhere((a) => a['id']?.toString() == appointmentId);
      if (idx != -1) {
        _myAppointments[idx]['status'] = 'Cancelled';
        notifyListeners();
      }
      return true;
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
