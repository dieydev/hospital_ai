import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../providers/appointment_provider.dart';
import '../../providers/auth_provider.dart';
import '../booking/vnpay_payment_view.dart';
import '../profile/complete_profile_view.dart';

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
    final auth = context.watch<AuthProvider>();
    if (!auth.isProfileComplete) {
      return Scaffold(
        backgroundColor: AppTheme.background,
        appBar: AppBar(
          title: const Text('Đặt Lịch Khám'),
          centerTitle: true,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFBAE6FD)),
                boxShadow: AppTheme.prominentShadow,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.person_add_alt_1_rounded, size: 48, color: AppTheme.primary),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Chưa hoàn tất hồ sơ',
                    style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Để đăng ký lịch khám và tiếp nhận bệnh án theo quy định của Bệnh viện D-Medical, quý khách vui lòng cập nhật đầy đủ thông tin cá nhân (Họ tên, CCCD, Ngày sinh, Địa chỉ).',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(fontSize: 13.5, color: AppTheme.textSecondary, height: 1.45),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const CompleteProfileView(isDismissible: true)),
                        );
                      },
                      icon: const Icon(Icons.edit_note_rounded),
                      label: const Text('CẬP NHẬT HỒ SƠ NGAY'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Đặt Lịch Khám'),
      ),
      body: Column(
        children: [
          // Step Progress Tab Bar (Horizontal Stepper)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildStepperItem(0, 'Khoa'),
                _buildStepperLine(0),
                _buildStepperItem(1, 'Bác sĩ'),
                _buildStepperLine(1),
                _buildStepperItem(2, 'Lịch'),
                _buildStepperLine(2),
                _buildStepperItem(3, 'Xác nhận'),
              ],
            ),
          ),
          
          // Step Content Container
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: _buildCurrentStepContent(),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          border: const Border(top: BorderSide(color: AppTheme.borderSubtle)),
        ),
        child: Row(
          children: [
            if (_currentStep > 0) ...[
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: const BorderSide(color: AppTheme.primary),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  onPressed: () => setState(() => _currentStep -= 1),
                  child: Text('Quay lại', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: AppTheme.primary)),
                ),
              ),
              const SizedBox(width: 12),
            ],
            Expanded(
              flex: 2,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0, // Removed default elevation
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
                  style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepperItem(int stepIndex, String title) {
    final isActive = _currentStep >= stepIndex;
    final isCurrent = _currentStep == stepIndex;

    return GestureDetector(
      onTap: () => setState(() => _currentStep = stepIndex),
      child: Column(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: isActive ? AppTheme.primary : AppTheme.background,
              shape: BoxShape.circle,
              border: Border.all(color: isActive ? AppTheme.primary : AppTheme.borderSubtle, width: 2),
            ),
            alignment: Alignment.center,
            child: Text(
              '${stepIndex + 1}',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: isActive ? Colors.white : AppTheme.textSecondary,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: isCurrent ? FontWeight.bold : FontWeight.w500,
              color: isCurrent ? AppTheme.primaryDark : AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepperLine(int stepIndex) {
    final isActive = _currentStep > stepIndex;
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
        alignment: Alignment.topCenter,
        color: isActive ? AppTheme.primary : AppTheme.borderSubtle,
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
            Text('Chọn Chuyên Khoa Khám', style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryDark)),
            const SizedBox(height: 4),
            Text('Vui lòng chọn khoa khám theo nhu cầu của bạn', style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textSecondary)),
            const SizedBox(height: 20),
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
                  child: InkWell(
                    onTap: () => _onDepartmentChanged(dept),
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      decoration: BoxDecoration(
                        color: isSelected ? AppTheme.primary.withValues(alpha: 0.05) : AppTheme.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSelected ? AppTheme.primary : AppTheme.borderSubtle,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        leading: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: isSelected ? AppTheme.primary : AppTheme.background,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            isSelected ? Icons.check_rounded : Icons.medical_services_outlined,
                            color: isSelected ? Colors.white : AppTheme.textSecondary,
                            size: 20,
                          ),
                        ),
                        title: Text(
                          dept,
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                            color: isSelected ? AppTheme.primaryDark : AppTheme.textPrimary,
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
            Text('Chọn Bác Sĩ Khám', style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryDark)),
            const SizedBox(height: 4),
            Text('Thuộc khoa: ${_selectedDepartment ?? ''}', style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textSecondary)),
            const SizedBox(height: 20),
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
                  child: InkWell(
                    onTap: () => setState(() => _selectedDoctor = docName),
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      decoration: BoxDecoration(
                        color: isSelected ? AppTheme.primary.withValues(alpha: 0.05) : AppTheme.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSelected ? AppTheme.primary : AppTheme.borderSubtle,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        leading: CircleAvatar(
                          radius: 26,
                          backgroundColor: isSelected ? AppTheme.primary : AppTheme.background,
                          backgroundImage: docAvatar.isNotEmpty ? NetworkImage(docAvatar) : null,
                          child: docAvatar.isEmpty ? Icon(Icons.person, size: 28, color: isSelected ? Colors.white : AppTheme.textSecondary) : null,
                        ),
                        title: Text(
                          docName, 
                          style: GoogleFonts.inter(
                            fontWeight: isSelected ? FontWeight.w800 : FontWeight.bold, 
                            fontSize: 15, 
                            color: isSelected ? AppTheme.primaryDark : AppTheme.textPrimary
                          )
                        ),
                        subtitle: Padding(
                          padding: const EdgeInsets.only(top: 4.0),
                          child: Text(
                            '$docTitle • $docDept', 
                            style: GoogleFonts.inter(fontSize: 12, color: isSelected ? AppTheme.primary : AppTheme.textSecondary)
                          ),
                        ),
                        trailing: Icon(
                          Icons.check_circle,
                          color: isSelected ? AppTheme.primary : Colors.transparent,
                          size: 24,
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
            Text('Ngày & Giờ Khám', style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryDark)),
            const SizedBox(height: 4),
            Text('Chọn thời gian thuận tiện nhất', style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textSecondary)),
            const SizedBox(height: 20),

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
                  builder: (context, child) {
                    return Theme(
                      data: Theme.of(context).copyWith(
                        colorScheme: const ColorScheme.light(
                          primary: AppTheme.primary,
                          onPrimary: Colors.white,
                          onSurface: AppTheme.textPrimary,
                        ),
                      ),
                      child: child!,
                    );
                  },
                );
                if (picked != null) {
                  setState(() => _selectedDate = picked);
                }
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.primary, width: 1.5),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_month_rounded, color: AppTheme.primary, size: 28),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Ngày khám', style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary)),
                          const SizedBox(height: 2),
                          Text(
                            'Thứ ${_getVietnameseDayOfWeek(_selectedDate.weekday)}, ${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                            style: GoogleFonts.sora(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.primaryDark),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.edit_calendar, size: 20, color: AppTheme.primary),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),
            Text('Khung giờ trống:', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14, color: AppTheme.textPrimary)),
            const SizedBox(height: 16),

            // Time Slot Grid
            LayoutBuilder(
              builder: (context, constraints) {
                final provider = context.watch<AppointmentProvider>();
                final chipWidth = (constraints.maxWidth - 16) / 3;
                return Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: provider.timeSlots.map((slot) {
                    final isSelected = _selectedTimeSlot == slot;
                    return InkWell(
                      onTap: () => setState(() => _selectedTimeSlot = slot),
                      borderRadius: BorderRadius.circular(12),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: chipWidth,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: isSelected ? AppTheme.primary : AppTheme.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected ? AppTheme.primary : AppTheme.borderSubtle,
                            width: 1,
                          ),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              slot,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(
                                color: isSelected ? Colors.white : AppTheme.textPrimary,
                                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                fontSize: 13,
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
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.assignment_turned_in, color: AppTheme.primary, size: 24),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'XÁC NHẬN THÔNG TIN',
                    style: GoogleFonts.sora(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.primaryDark),
                  ),
                ),
              ],
            ),
            const Padding(padding: EdgeInsets.symmetric(vertical: 16), child: Divider(color: AppTheme.borderSubtle, height: 1)),
            Builder(builder: (context) {
              final user = context.read<AuthProvider>().user;
              return Column(
                children: [
                  _buildDetailRow(Icons.person_outline, 'Bệnh nhân:', '${user?.hoTen ?? ''} (${user?.maBenhNhan ?? ''})'),
                  const SizedBox(height: 12),
                  _buildDetailRow(Icons.phone_android_outlined, 'Số điện thoại:', user?.soDienThoai ?? ''),
                ],
              );
            }),
            const SizedBox(height: 12),
            _buildDetailRow(Icons.medical_services_outlined, 'Chuyên khoa:', _selectedDepartment ?? ''),
            const SizedBox(height: 12),

            // Selected Doctor Card
            Builder(builder: (_) {
              final provider = context.read<AppointmentProvider>();
              final currentDoc = provider.doctors.firstWhere((d) => d['name'] == _selectedDoctor, orElse: () => provider.doctors.isNotEmpty ? provider.doctors.first : {});
              final avatarUrl = currentDoc['avatar'] ?? '';
              final docTitle = currentDoc['title'] ?? '';
              return Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.background,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: AppTheme.primary,
                      backgroundImage: avatarUrl.isNotEmpty ? NetworkImage(avatarUrl) : null,
                      child: avatarUrl.isEmpty ? const Icon(Icons.person, color: Colors.white, size: 20) : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_selectedDoctor ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.textPrimary)),
                          Text(docTitle, style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary)),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),

            const SizedBox(height: 16),
            _buildDetailRow(
              Icons.access_time_outlined,
              'Thời gian hẹn:',
              '${_selectedTimeSlot ?? ''} - ${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7), // Amber 100
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFDE68A)), // Amber 200
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.info_outline, color: Color(0xFFD97706), size: 20), // Amber 600
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Quý khách vui lòng đến trước 15 phút để làm thủ tục xác nhận tại quầy tiếp nhận.',
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF92400E), height: 1.4), // Amber 800
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
    }
  }

  Future<void> _showSuccessConfirmation() async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (c) => const Center(child: CircularProgressIndicator(color: AppTheme.primary)),
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
        const SnackBar(content: Text('Lỗi: Không thể kết nối tới máy chủ! Vui lòng thử lại.'), backgroundColor: Colors.red),
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
      _showFinalSuccessDialog('Đã ghi nhận lịch hẹn nhưng hệ thống thanh toán đang gián đoạn. Vui lòng thanh toán tại quầy.');
    }
  }

  void _showFinalSuccessDialog(String paymentMessage) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        backgroundColor: AppTheme.surface,
        title: Row(
          children: [
            const Icon(Icons.check_circle, color: AppTheme.accentMint, size: 28),
            const SizedBox(width: 8),
            Expanded(child: Text('ĐẶT LỊCH THÀNH CÔNG', style: GoogleFonts.sora(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textPrimary))),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Mã phiếu hẹn: LH${DateTime.now().millisecondsSinceEpoch.toString().substring(6)}', style: GoogleFonts.inter(color: AppTheme.textPrimary)),
            const SizedBox(height: 6),
            Text('STT dự kiến: #105 (Phòng 102 - $_selectedDepartment)', style: GoogleFonts.inter(color: AppTheme.textPrimary)),
            const SizedBox(height: 6),
            Text('Bác sĩ: $_selectedDoctor', style: GoogleFonts.inter(color: AppTheme.textPrimary)),
            const SizedBox(height: 12),
            Text(paymentMessage, style: GoogleFonts.inter(color: AppTheme.primary, fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: AppTheme.accentMint.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
              child: Row(
                children: [
                  const Icon(Icons.cloud_done, color: AppTheme.accentMint, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text('Đã đồng bộ trực tiếp lên hệ thống Bệnh viện D-Medical!', style: GoogleFonts.inter(fontSize: 11, color: AppTheme.accentMint, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              elevation: 0,
            ),
            onPressed: () {
              Navigator.pop(ctx);
              setState(() {
                _currentStep = 0;
                _selectedDoctor = null;
                _selectedTimeSlot = null;
                _selectedDate = DateTime.now().add(const Duration(days: 1));
              });
            },
            child: Text('Về Trang Chủ', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: AppTheme.textSecondary),
        const SizedBox(width: 12),
        Text(label, style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textSecondary)),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            value,
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }

  String _getVietnameseDayOfWeek(int weekday) {
    switch (weekday) {
      case 1: return 'Hai';
      case 2: return 'Ba';
      case 3: return 'Tư';
      case 4: return 'Năm';
      case 5: return 'Sáu';
      case 6: return 'Bảy';
      case 7: default: return 'Chủ Nhật';
    }
  }
}
