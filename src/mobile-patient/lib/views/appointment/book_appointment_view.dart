import 'package:flutter/material.dart';
import '../../core/theme.dart';

class BookAppointmentView extends StatefulWidget {
  const BookAppointmentView({super.key});

  @override
  State<BookAppointmentView> createState() => _BookAppointmentViewState();
}

class _BookAppointmentViewState extends State<BookAppointmentView> {
  int _currentStep = 0;

  // Form selections
  String? _selectedDepartment = 'Khoa Nội Tổng Hợp';
  String? _selectedDoctor = 'BS. CKII. Nguyễn Thanh Duy';
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  String? _selectedTimeSlot = '08:30 - 09:00';

  final List<String> _departments = [
    'Khoa Nội Tổng Hợp',
    'Khoa Nhi',
    'Khoa Mắt',
    'Khoa Ngoại',
    'Khoa Tai Mũi Họng',
    'Khoa Răng Hàm Mặt',
  ];

  final List<Map<String, String>> _doctors = [
    {'name': 'BS. CKII. Nguyễn Thanh Duy', 'dept': 'Khoa Nội Tổng Hợp', 'title': 'Trưởng Khoa'},
    {'name': 'BS. CKI. Phạm Minh Đức', 'dept': 'Khoa Nhi', 'title': 'Bác sĩ Điều trị'},
    {'name': 'BS. Trần Ngọc Mai', 'dept': 'Khoa Mắt', 'title': 'Bác sĩ Điều trị'},
    {'name': 'BS. CKI. Lê Văn Tuấn', 'dept': 'Khoa Nội Tổng Hợp', 'title': 'Bác sĩ Điều trị'},
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Đặt Lịch Khám Trực Tuyến'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: Stepper(
        type: StepperType.vertical,
        currentStep: _currentStep,
        onStepContinue: () {
          if (_currentStep < 3) {
            setState(() => _currentStep += 1);
          } else {
            _showSuccessConfirmation();
          }
        },
        onStepCancel: () {
          if (_currentStep > 0) {
            setState(() => _currentStep -= 1);
          }
        },
        steps: [
          // Step 1: Select Specialty / Department
          Step(
            title: const Text('1. Chọn Chuyên Khoa khám', style: TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text(_selectedDepartment ?? 'Chưa chọn'),
            isActive: _currentStep >= 0,
            content: Column(
              children: _departments.map((dept) {
                return RadioListTile<String>(
                  title: Text(dept, style: const TextStyle(fontWeight: FontWeight.w500)),
                  value: dept,
                  groupValue: _selectedDepartment,
                  onChanged: (val) {
                    setState(() => _selectedDepartment = val);
                  },
                );
              }).toList(),
            ),
          ),

          // Step 2: Select Doctor
          Step(
            title: const Text('2. Chọn Bác Sĩ khám', style: TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text(_selectedDoctor ?? 'Bác sĩ ngẫu nhiên'),
            isActive: _currentStep >= 1,
            content: Column(
              children: _doctors
                  .where((d) => _selectedDepartment == null || d['dept'] == _selectedDepartment)
                  .map((doc) {
                return Card(
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  child: RadioListTile<String>(
                    secondary: const CircleAvatar(child: Icon(Icons.person)),
                    title: Text(doc['name']!, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('${doc['title']} • ${doc['dept']}'),
                    value: doc['name']!,
                    groupValue: _selectedDoctor,
                    onChanged: (val) {
                      setState(() => _selectedDoctor = val);
                    },
                  ),
                );
              }).toList(),
            ),
          ),

          // Step 3: Select Date & Time Slot
          Step(
            title: const Text('3. Chọn Ngày & Khung Giờ khám', style: TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text('${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year} - $_selectedTimeSlot'),
            isActive: _currentStep >= 2,
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ListTile(
                  leading: const Icon(Icons.calendar_today, color: AppTheme.primaryColor),
                  title: Text('Ngày khám: ${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}'),
                  trailing: TextButton(
                    onPressed: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _selectedDate,
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 30)),
                      );
                      if (picked != null) setState(() => _selectedDate = picked);
                    },
                    child: const Text('Đổi ngày'),
                  ),
                ),
                const SizedBox(height: 12),
                const Text('Khung giờ trống:', style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _timeSlots.map((slot) {
                    final isSelected = _selectedTimeSlot == slot;
                    return ChoiceChip(
                      label: Text(slot),
                      selected: isSelected,
                      selectedColor: AppTheme.primaryColor,
                      labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.black87),
                      onSelected: (selected) {
                        if (selected) setState(() => _selectedTimeSlot = slot);
                      },
                    );
                  }).toList(),
                ),
              ],
            ),
          ),

          // Step 4: Confirmation
          Step(
            title: const Text('4. Xác nhận Đặt Lịch', style: TextStyle(fontWeight: FontWeight.bold)),
            isActive: _currentStep >= 3,
            content: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF0F9FF),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFBAE6FD)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.assignment_turned_in, color: AppTheme.primaryColor, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'XÁC NHẬN PHIẾU HẸN KHÁM BỆNH',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.primaryDark),
                      ),
                    ],
                  ),
                  const Divider(height: 20, color: Color(0xFFBAE6FD)),
                  _buildDetailRow(Icons.person_outline, 'Họ và tên:', 'Nguyễn Văn An (BN20260001)'),
                  const SizedBox(height: 8),
                  _buildDetailRow(Icons.phone_android_outlined, 'Số điện thoại:', '0987654321'),
                  const SizedBox(height: 8),
                  _buildDetailRow(Icons.medical_services_outlined, 'Chuyên khoa:', $_selectedDepartment),
                  const SizedBox(height: 8),
                  _buildDetailRow(Icons.badge_outlined, 'Bác sĩ phụ trách:', $_selectedDoctor),
                  const SizedBox(height: 8),
                  _buildDetailRow(
                    Icons.access_time_outlined,
                    'Thời gian hẹn:',
                    '$_selectedTimeSlot - ${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.amber.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.amber.shade200),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.amber, size: 18),
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
            ),
          ),
        ],
      ),
    );
  }

  void _showSuccessConfirmation() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green, size: 28),
            SizedBox(width: 8),
            Text('ĐẶT LỊCH THÀNH CÔNG!'),
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
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context);
            },
            child: const Text('Về Trang Chủ'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String? value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppTheme.primaryColor),
        const SizedBox(width: 8),
        Text(label, style: const TextStyle(fontSize: 13, color: Color(0xFF64748B))),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            value ?? 'Chưa chọn',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
          ),
        ),
      ],
    );
  }
}
