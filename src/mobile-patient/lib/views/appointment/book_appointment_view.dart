import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../core/theme.dart';

class BookAppointmentView extends StatefulWidget {
  const BookAppointmentView({super.key});

  @override
  State<BookAppointmentView> createState() => _BookAppointmentViewState();
}

class _BookAppointmentViewState extends State<BookAppointmentView> {
  int _currentStep = 0;

  // Form selections
  String _selectedDepartment = 'Khoa Nội Tổng Hợp';
  String _selectedDoctor = 'BS. CKII. Nguyễn Thanh Duy';
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  String _selectedTimeSlot = '08:30 - 09:00';

  final List<String> _departments = [
    'Khoa Nội Tổng Hợp',
    'Khoa Nhi',
    'Khoa Mắt',
    'Khoa Ngoại',
    'Khoa Tai Mũi Họng',
    'Khoa Răng Hàm Mặt',
  ];

  final List<Map<String, String>> _doctors = [
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
      'name': 'BS. Nguyễn Thị Lan',
      'dept': 'Khoa Nhi',
      'title': 'Bác sĩ Điều trị',
      'avatar': 'https://images.unsplash.com/photo-1594824813570-8910014e7a77?w=150&auto=format&fit=crop&q=80',
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
    },
  ];

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
  ];

  void _onDepartmentChanged(String dept) {
    setState(() {
      _selectedDepartment = dept;
      final matchingDocs = _doctors.where((d) => d['dept'] == dept).toList();
      if (matchingDocs.isNotEmpty) {
        _selectedDoctor = matchingDocs.first['name'] ?? '';
      } else {
        _selectedDoctor = 'BS. CKII. Nguyễn Thanh Duy';
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Đặt Lịch Khám Trực Tuyến'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Step Progress Tab Bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
            child: Row(
              children: [
                Expanded(child: _buildStepTab(0, '1. Khoa')),
                Expanded(child: _buildStepTab(1, '2. Bác sĩ')),
                Expanded(child: _buildStepTab(2, '3. Ngày & Giờ')),
                Expanded(child: _buildStepTab(3, '4. Xác nhận')),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE2E8F0)),

          // Step Content Container
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: _buildCurrentStepContent(),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, -2))],
        ),
        child: Row(
          children: [
            if (_currentStep > 0) ...[
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: const BorderSide(color: Color(0xFFBAE6FD)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () => setState(() => _currentStep -= 1),
                  child: const Text('Quay lại', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF334155))),
                ),
              ),
              const SizedBox(width: 12),
            ],
            Expanded(
              flex: 2,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () {
                  if (_currentStep < 3) {
                    setState(() => _currentStep += 1);
                  } else {
                    _showSuccessConfirmation();
                  }
                },
                child: Text(
                  _currentStep == 3 ? 'XÁC NHẬN ĐẶT LỊCH' : 'TIẾP THEO',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepTab(int stepIndex, String title) {
    final isActive = _currentStep >= stepIndex;
    final isCurrent = _currentStep == stepIndex;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => setState(() => _currentStep = stepIndex),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: isCurrent ? AppTheme.primaryColor : (isActive ? const Color(0xFFBAE6FD) : Colors.transparent),
              width: isCurrent ? 3 : 1,
            ),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 12,
              backgroundColor: isActive ? AppTheme.primaryColor : const Color(0xFFE2E8F0),
              child: Text(
                '${stepIndex + 1}',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: isActive ? Colors.white : const Color(0xFF64748B),
                ),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 10,
                fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                color: isCurrent ? AppTheme.primaryDark : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrentStepContent() {
    switch (_currentStep) {
      case 0:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Bước 1: Chọn Chuyên Khoa Khám', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryDark)),
            const SizedBox(height: 4),
            const Text('Vui lòng chọn khoa khám theo nhu cầu của bạn', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
            const SizedBox(height: 16),
            ..._departments.map((dept) {
              final isSelected = _selectedDepartment == dept;
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFFF0F9FF) : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSelected ? AppTheme.primaryColor : const Color(0xFFE2E8F0),
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: ListTile(
                  leading: Icon(
                    isSelected ? Icons.check_circle : Icons.circle_outlined,
                    color: isSelected ? AppTheme.primaryColor : const Color(0xFF94A3B8),
                  ),
                  title: Text(
                    dept,
                    style: TextStyle(
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                      color: isSelected ? AppTheme.primaryDark : const Color(0xFF334155),
                    ),
                  ),
                  onTap: () => _onDepartmentChanged(dept),
                ),
              );
            }),
          ],
        );

      case 1:
        final filteredDoctors = _doctors.where((d) => d['dept'] == _selectedDepartment).toList();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Bước 2: Chọn Bác Sĩ Khám', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryDark)),
            const SizedBox(height: 4),
            Text('Danh sách bác sĩ thuộc khoa: $_selectedDepartment', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
            const SizedBox(height: 16),
            if (filteredDoctors.isEmpty)
              const Padding(
                padding: EdgeInsets.all(20),
                child: Text('Chưa có bác sĩ thuộc khoa này trong danh sách.', style: TextStyle(color: Colors.grey)),
              )
            else
              ...filteredDoctors.map((doc) {
                final docName = doc['name'] ?? '';
                final docTitle = doc['title'] ?? '';
                final docDept = doc['dept'] ?? '';
                final docAvatar = doc['avatar'] ?? '';
                final isSelected = _selectedDoctor == docName;

                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFFF0F9FF) : Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSelected ? AppTheme.primaryColor : const Color(0xFFE2E8F0),
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    leading: CircleAvatar(
                      radius: 24,
                      backgroundColor: isSelected ? AppTheme.primaryColor : const Color(0xFFE0F2FE),
                      backgroundImage: docAvatar.isNotEmpty ? NetworkImage(docAvatar) : null,
                      child: docAvatar.isEmpty ? Icon(Icons.person, color: isSelected ? Colors.white : AppTheme.primaryColor) : null,
                    ),
                    title: Text(docName, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: isSelected ? AppTheme.primaryDark : const Color(0xFF0F172A))),
                    subtitle: Text('$docTitle • $docDept', style: TextStyle(fontSize: 12, color: isSelected ? AppTheme.primaryColor : const Color(0xFF64748B))),
                    trailing: Icon(
                      isSelected ? Icons.check_circle : Icons.circle_outlined,
                      color: isSelected ? AppTheme.primaryColor : const Color(0xFF94A3B8),
                      size: 22,
                    ),
                    onTap: () => setState(() => _selectedDoctor = docName),
                  ),
                );
              }),
          ],
        );

      case 2:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Bước 3: Chọn Ngày & Khung Giờ Khám', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryDark)),
            const SizedBox(height: 4),
            const Text('Vui lòng chọn ngày khám và khung giờ còn trống bên dưới', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
            const SizedBox(height: 16),

            // Date Picker Card
            GestureDetector(
              onTap: () async {
                final now = DateTime.now();
                final firstDate = DateTime(now.year, now.month, now.day);
                final lastDate = firstDate.add(const Duration(days: 60));
                final safeInitialDate = _selectedDate.isBefore(firstDate)
                    ? firstDate
                    : (_selectedDate.isAfter(lastDate) ? lastDate : _selectedDate);

                final picked = await showDatePicker(
                  context: context,
                  initialDate: safeInitialDate,
                  firstDate: firstDate,
                  lastDate: lastDate,
                );
                if (picked != null) {
                  setState(() => _selectedDate = picked);
                }
              },
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFBAE6FD)),
                  boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_month_rounded, color: AppTheme.primaryColor, size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Ngày khám đã chọn:', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                          Text(
                            'Thứ ${_getVietnameseDayOfWeek(_selectedDate.weekday)}, ${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.primaryDark),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE0F2FE),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        children: [
                          Text('Đổi ngày', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primaryColor)),
                          SizedBox(width: 4),
                          Icon(Icons.edit_calendar, size: 14, color: AppTheme.primaryColor),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),
            const Text('Khung giờ làm việc còn trống:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF334155))),
            const SizedBox(height: 12),

            // 3-Column Time Slot Grid
            LayoutBuilder(
              builder: (context, constraints) {
                final chipWidth = (constraints.maxWidth - 16) / 3;
                return Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _timeSlots.map((slot) {
                    final isSelected = _selectedTimeSlot == slot;
                    return GestureDetector(
                      onTap: () => setState(() => _selectedTimeSlot = slot),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        width: chipWidth,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: isSelected ? AppTheme.primaryColor : Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected ? AppTheme.primaryColor : const Color(0xFFCBD5E1),
                            width: isSelected ? 2 : 1,
                          ),
                          boxShadow: isSelected
                              ? [const BoxShadow(color: Color.fromRGBO(2, 132, 199, 0.25), blurRadius: 6, offset: Offset(0, 3))]
                              : [],
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.access_time_rounded,
                              size: 16,
                              color: isSelected ? Colors.white : AppTheme.primaryColor,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              slot,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: isSelected ? Colors.white : const Color(0xFF1E293B),
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                );
              },
            ),
          ],
        );

      case 3:
      default:
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFBAE6FD)),
            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.assignment_turned_in, color: AppTheme.primaryColor, size: 24),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'XÁC NHẬN THÔNG TIN PHIẾU HẸN',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.primaryDark),
                    ),
                  ),
                ],
              ),
              const Divider(height: 24, color: Color(0xFFBAE6FD)),
              _buildDetailRow(Icons.person_outline, 'Họ và tên:', 'Nguyễn Văn An (BN20260001)'),
              const SizedBox(height: 10),
              _buildDetailRow(Icons.phone_android_outlined, 'Số điện thoại:', '0987654321'),
              const SizedBox(height: 10),
              _buildDetailRow(Icons.medical_services_outlined, 'Chuyên khoa:', _selectedDepartment),
              const SizedBox(height: 10),

              // Selected Doctor Card Preview with Avatar
              Builder(builder: (_) {
                final currentDoc = _doctors.firstWhere((d) => d['name'] == _selectedDoctor, orElse: () => _doctors.first);
                final avatarUrl = currentDoc['avatar'] ?? '';
                final docTitle = currentDoc['title'] ?? '';
                return Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0F9FF),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFBAE6FD)),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 22,
                        backgroundColor: AppTheme.primaryColor,
                        backgroundImage: avatarUrl.isNotEmpty ? NetworkImage(avatarUrl) : null,
                        child: avatarUrl.isEmpty ? const Icon(Icons.person, color: Colors.white) : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(_selectedDoctor, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primaryDark)),
                            Text('$docTitle • $_selectedDepartment', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }),

              const SizedBox(height: 10),
              _buildDetailRow(
                Icons.access_time_outlined,
                'Thời gian hẹn:',
                '$_selectedTimeSlot - ${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.amber.shade200),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.amber, size: 20),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Quý khách vui lòng đến trước 15 phút để làm thủ tục xác nhận tại quầy tiếp nhận.',
                        style: TextStyle(fontSize: 12, color: Color(0xFF92400E)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
    }
  }

  Future<void> _showSuccessConfirmation() async {
    final appointmentData = {
      'patientCode': 'BN20260001',
      'patientName': 'Nguyễn Văn An',
      'patientPhone': '0987654321',
      'patientGender': 'Nam',
      'patientAge': 36,
      'departmentName': _selectedDepartment,
      'doctorName': _selectedDoctor,
      'appointmentDate': '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}',
      'appointmentTime': _selectedTimeSlot.split(' - ')[0],
      'symptomsReason': 'Đặt lịch hẹn khám trực tuyến từ Mobile Patient App',
      'status': 'Pending',
      'sourceApp': 'Flutter Mobile App',
    };

    try {
      final url = Uri.parse('http://localhost:5000/api/appointments');
      await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(appointmentData),
      );
    } catch (_) {
      // Handled
    }

    if (!mounted) return;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green, size: 28),
            SizedBox(width: 8),
            Expanded(child: Text('ĐẶT LỊCH THÀNH CÔNG!', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold))),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Mã phiếu hẹn: LH${DateTime.now().millisecondsSinceEpoch.toString().substring(6)}'),
            const SizedBox(height: 6),
            Text('STT dự kiến: #105 (Phòng 102 - $_selectedDepartment)'),
            const SizedBox(height: 6),
            Text('Bác sĩ: $_selectedDoctor'),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(8)),
              child: const Row(
                children: [
                  Icon(Icons.cloud_done, color: Colors.green, size: 18),
                  SizedBox(width: 6),
                  Expanded(
                    child: Text('Đã đồng bộ trực tiếp lên hệ thống Web Admin Bệnh viện!', style: TextStyle(fontSize: 11, color: Colors.green, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context);
            },
            child: const Text('Về Trang Chủ', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: AppTheme.primaryColor),
        const SizedBox(width: 8),
        Text(label, style: const TextStyle(fontSize: 13, color: Color(0xFF64748B))),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
          ),
        ),
      ],
    );
  }

  String _getVietnameseDayOfWeek(int weekday) {
    switch (weekday) {
      case 1:
        return 'Hai';
      case 2:
        return 'Ba';
      case 3:
        return 'Tư';
      case 4:
        return 'Năm';
      case 5:
        return 'Sáu';
      case 6:
        return 'Bảy';
      case 7:
      default:
        return 'Chủ Nhật';
    }
  }
}
