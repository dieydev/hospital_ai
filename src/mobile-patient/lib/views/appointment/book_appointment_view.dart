import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../providers/appointment_provider.dart';
import '../../providers/auth_provider.dart';
import '../booking/vnpay_payment_view.dart';

class BookAppointmentView extends StatefulWidget {
  const BookAppointmentView({super.key});

  @override
  State<BookAppointmentView> createState() => _BookAppointmentViewState();
}

class _BookAppointmentViewState extends State<BookAppointmentView> {
  int _currentStep = 0;

  // Form selections
  String? _selectedDepartment;
  String? _selectedDoctor;
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  String? _selectedTimeSlot;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<AppointmentProvider>();
      if (provider.departments.isNotEmpty) {
        setState(() {
          _selectedDepartment = provider.departments.first;
        });
        provider.fetchDoctors(_selectedDepartment!).then((_) {
          if (provider.doctors.isNotEmpty) {
            setState(() {
              _selectedDoctor = provider.doctors.first['name'];
            });
          }
        });
      }
      if (provider.timeSlots.isNotEmpty) {
        setState(() {
          _selectedTimeSlot = provider.timeSlots.first;
        });
      }
    });
  }

  void _onDepartmentChanged(String dept) {
    setState(() {
      _selectedDepartment = dept;
      _selectedDoctor = null;
    });
    final provider = context.read<AppointmentProvider>();
    provider.fetchDoctors(dept).then((_) {
      if (provider.doctors.isNotEmpty) {
        setState(() {
          _selectedDoctor = provider.doctors.first['name'];
        });
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
        final provider = context.watch<AppointmentProvider>();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Bước 1: Chọn Chuyên Khoa Khám', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryDark)),
            const SizedBox(height: 4),
            const Text('Vui lòng chọn khoa khám theo nhu cầu của bạn', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
            const SizedBox(height: 16),
            if (provider.isLoading && provider.departments.isEmpty)
              const Center(child: CircularProgressIndicator())
            else if (provider.errorMessage != null && provider.departments.isEmpty)
              Center(
                child: Column(
                  children: [
                    Text('Lỗi: ${provider.errorMessage}', style: const TextStyle(color: Colors.red)),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: () => context.read<AppointmentProvider>().fetchDepartments(),
                      child: const Text('Thử lại'),
                    ),
                  ],
                ),
              )
            else if (provider.departments.isEmpty)
              const Center(child: Text('Chưa có danh sách khoa.', style: TextStyle(color: Colors.grey)))
            else
              ...provider.departments.map((dept) {
                final isSelected = _selectedDepartment == dept;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => _onDepartmentChanged(dept),
                      borderRadius: BorderRadius.circular(16),
                      splashColor: AppTheme.primaryColor.withOpacity(0.1),
                      highlightColor: AppTheme.primaryColor.withOpacity(0.05),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFFE0F2FE) : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isSelected ? AppTheme.primaryColor : const Color(0xFFE2E8F0),
                            width: isSelected ? 2.5 : 1,
                          ),
                          boxShadow: isSelected
                              ? [BoxShadow(color: AppTheme.primaryColor.withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 4))]
                              : [const BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                          leading: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: isSelected ? AppTheme.primaryColor : const Color(0xFFF1F5F9),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              isSelected ? Icons.check_rounded : Icons.medical_services_outlined,
                              color: isSelected ? Colors.white : const Color(0xFF64748B),
                            ),
                          ),
                          title: Text(
                            dept,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                              color: isSelected ? AppTheme.primaryDark : const Color(0xFF334155),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }),
          ],
        );

      case 1:
        final provider = context.watch<AppointmentProvider>();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Bước 2: Chọn Bác Sĩ Khám', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryDark)),
            const SizedBox(height: 4),
            Text('Danh sách bác sĩ thuộc khoa: ${_selectedDepartment ?? ''}', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
            const SizedBox(height: 16),
            if (provider.isLoading && provider.doctors.isEmpty)
              const Center(child: CircularProgressIndicator())
            else if (provider.errorMessage != null && provider.doctors.isEmpty)
              Center(
                child: Column(
                  children: [
                    Text('Lỗi: ${provider.errorMessage}', style: const TextStyle(color: Colors.red)),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: () {
                        if (_selectedDepartment != null) {
                          context.read<AppointmentProvider>().fetchDoctors(_selectedDepartment!);
                        }
                      },
                      child: const Text('Thử lại'),
                    ),
                  ],
                ),
              )
            else if (provider.doctors.isEmpty)
              const Padding(
                padding: EdgeInsets.all(20),
                child: Text('Chưa có bác sĩ thuộc khoa này trong danh sách.', style: TextStyle(color: Colors.grey)),
              )
            else
              ...provider.doctors.map((doc) {
                final docName = doc['name'] ?? '';
                final docTitle = doc['title'] ?? '';
                final docDept = doc['dept'] ?? '';
                final docAvatar = doc['avatar'] ?? '';
                final isSelected = _selectedDoctor == docName;

                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => setState(() => _selectedDoctor = docName),
                      borderRadius: BorderRadius.circular(16),
                      splashColor: AppTheme.primaryColor.withOpacity(0.1),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFFE0F2FE) : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isSelected ? AppTheme.primaryColor : const Color(0xFFE2E8F0),
                            width: isSelected ? 2.5 : 1,
                          ),
                          boxShadow: isSelected
                              ? [BoxShadow(color: AppTheme.primaryColor.withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 4))]
                              : [const BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          leading: CircleAvatar(
                            radius: 28,
                            backgroundColor: isSelected ? AppTheme.primaryColor : const Color(0xFFE2E8F0),
                            backgroundImage: docAvatar.isNotEmpty ? NetworkImage(docAvatar) : null,
                            child: docAvatar.isEmpty ? Icon(Icons.person, size: 30, color: isSelected ? Colors.white : const Color(0xFF94A3B8)) : null,
                          ),
                          title: Text(
                            docName, 
                            style: TextStyle(
                              fontWeight: isSelected ? FontWeight.w800 : FontWeight.bold, 
                              fontSize: 15, 
                              color: isSelected ? AppTheme.primaryDark : const Color(0xFF0F172A)
                            )
                          ),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 4.0),
                            child: Text(
                              '$docTitle • $docDept', 
                              style: TextStyle(fontSize: 13, color: isSelected ? AppTheme.primaryColor : const Color(0xFF64748B))
                            ),
                          ),
                          trailing: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: isSelected ? AppTheme.primaryColor : Colors.transparent,
                              shape: BoxShape.circle,
                              border: Border.all(color: isSelected ? AppTheme.primaryColor : const Color(0xFFCBD5E1), width: 2),
                            ),
                            child: Icon(
                              Icons.check,
                              color: isSelected ? Colors.white : Colors.transparent,
                              size: 16,
                            ),
                          ),
                        ),
                      ),
                    ),
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
                final provider = context.watch<AppointmentProvider>();
                final chipWidth = (constraints.maxWidth - 16) / 3;
                return Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: provider.timeSlots.map((slot) {
                    final isSelected = _selectedTimeSlot == slot;
                    return Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () => setState(() => _selectedTimeSlot = slot),
                        borderRadius: BorderRadius.circular(14),
                        splashColor: AppTheme.primaryColor.withOpacity(0.2),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: chipWidth,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          decoration: BoxDecoration(
                            color: isSelected ? AppTheme.primaryColor : Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: isSelected ? AppTheme.primaryColor : const Color(0xFFCBD5E1),
                              width: isSelected ? 2 : 1,
                            ),
                            boxShadow: isSelected
                                ? [BoxShadow(color: AppTheme.primaryColor.withOpacity(0.4), blurRadius: 8, offset: const Offset(0, 4))]
                                : [const BoxShadow(color: Colors.black12, blurRadius: 2, offset: Offset(0, 1))],
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.access_time_rounded,
                                size: 20,
                                color: isSelected ? Colors.white : AppTheme.primaryColor,
                              ),
                              const SizedBox(height: 6),
                              Text(
                                slot,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: isSelected ? Colors.white : const Color(0xFF1E293B),
                                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
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
              _buildDetailRow(Icons.medical_services_outlined, 'Chuyên khoa:', _selectedDepartment ?? ''),
              const SizedBox(height: 10),

              // Selected Doctor Card Preview with Avatar
              Builder(builder: (_) {
                final provider = context.read<AppointmentProvider>();
                final currentDoc = provider.doctors.firstWhere((d) => d['name'] == _selectedDoctor, orElse: () => provider.doctors.isNotEmpty ? provider.doctors.first : {});
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
                            Text(_selectedDoctor ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primaryDark)),
                            Text('$docTitle • ${_selectedDepartment ?? ''}', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
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
                '${_selectedTimeSlot ?? ''} - ${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
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
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (c) => const Center(child: CircularProgressIndicator()),
    );

    final auth = context.read<AuthProvider>();
    final user = auth.user;

    if (user == null || _selectedDepartment == null || _selectedDoctor == null || _selectedTimeSlot == null) {
      Navigator.pop(context); // Close loading
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn đầy đủ thông tin!'), backgroundColor: Colors.red),
      );
      return;
    }

    final appointmentData = {
      'patientCode': user.maBenhNhan,
      'patientName': user.hoTen,
      'patientPhone': user.soDienThoai,
      'patientGender': user.gioiTinh,
      'departmentName': _selectedDepartment,
      'doctorName': _selectedDoctor,
      'appointmentDate': '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}',
      'appointmentTime': _selectedTimeSlot!.split(' - ')[0],
      'symptomsReason': 'Đặt lịch hẹn khám trực tuyến từ Mobile Patient App',
      'status': 'Pending',
      'sourceApp': 'Flutter Mobile App',
    };

    final provider = context.read<AppointmentProvider>();
    try {
      await provider.bookAppointment(appointmentData);
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context); // Close loading dialog
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lỗi: Không thể kết nối tới máy chủ Hệ thống Bệnh viện! Vui lòng thử lại.'), backgroundColor: Colors.red),
      );
      return;
    }

    // Call VNPay URL
    final vnpayUrl = await provider.getVnPayUrl(150000, 'Thanh toan phi kham benh ${user.hoTen}');
    if (!mounted) return;
    Navigator.pop(context); // Close loading dialog

    if (vnpayUrl != null) {
      // Navigate to VNPay WebView
      final isSuccess = await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => VnPayPaymentView(paymentUrl: vnpayUrl),
        ),
      );

      if (!mounted) return;

      if (isSuccess == true) {
        _showFinalSuccessDialog('Thanh toán VNPay thành công. Hệ thống đã xác nhận lịch khám!');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Thanh toán VNPay thất bại hoặc bị hủy.'), backgroundColor: Colors.red),
        );
      }
    } else {
      if (!mounted) return;
      // Fallback if VNPay API fails (e.g. backend down)
      _showFinalSuccessDialog('Đã ghi nhận lịch hẹn nhưng hệ thống thanh toán đang gián đoạn. Vui lòng thanh toán tại quầy.');
    }
  }

  void _showFinalSuccessDialog(String paymentMessage) {
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
            Text(paymentMessage, style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold, fontSize: 13)),
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
              Navigator.pop(ctx); // Đóng Dialog
              setState(() {
                _currentStep = 0;
                _selectedDoctor = null;
                _selectedTimeSlot = null;
                _selectedDate = DateTime.now().add(const Duration(days: 1));
              });
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
