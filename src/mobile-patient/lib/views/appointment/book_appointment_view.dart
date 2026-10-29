import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/theme.dart';
import '../../providers/appointment_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/patient_provider.dart';
import '../booking/vnpay_payment_view.dart';
import '../profile/complete_profile_view.dart';
import 'my_appointments_view.dart';

class BookAppointmentView extends StatefulWidget {
  final bool isFollowUp;
  final String? initialDepartment;
  final String? initialDoctor;
  final String? previousRecordCode;
  final String? initialFollowUpNotes;

  const BookAppointmentView({
    super.key,
    this.isFollowUp = false,
    this.initialDepartment,
    this.initialDoctor,
    this.previousRecordCode,
    this.initialFollowUpNotes,
  });

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
  final TextEditingController _symptomsController = TextEditingController();
  final TextEditingController _previousRecordController = TextEditingController();
  final TextEditingController _followUpNotesController = TextEditingController();
  bool _isFollowUp = false;
  String? _lastCreatedAppointmentId;

  @override
  void initState() {
    super.initState();
    _isFollowUp = widget.isFollowUp;
    if (widget.previousRecordCode != null) {
      _previousRecordController.text = widget.previousRecordCode!;
    }
    if (widget.initialFollowUpNotes != null) {
      _followUpNotesController.text = widget.initialFollowUpNotes!;
    }
    if (widget.initialDepartment != null) {
      _selectedDepartment = widget.initialDepartment;
    }
    if (widget.initialDoctor != null) {
      _selectedDoctor = widget.initialDoctor;
    }

    // Nếu vào chế độ Tái Khám và đã có Chuyên Khoa / Bác Sĩ (từ EMR hoặc Lịch cũ),
    // chuyển thẳng sang Bước 2: Chọn Ngày & Giờ Tái Khám
    if (_isFollowUp && widget.initialDepartment != null) {
      _currentStep = 2;
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final appointmentProv = context.read<AppointmentProvider>();
      final dateStr = '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}';
      appointmentProv.fetchTimeSlotsWithCapacity(dateStr);

      final user = context.read<AuthProvider>().user;
      if (user != null) {
        context.read<PatientProvider>().fetchMedicalHistory(user.id);
        appointmentProv.fetchMyAppointments(user.soDienThoai ?? '', patientCode: user.maBenhNhan);
      }

      if (_selectedDepartment == null && appointmentProv.departments.isNotEmpty) {
        setState(() {
          _selectedDepartment = appointmentProv.departments.first;
        });
      }

      if (_selectedDepartment != null) {
        appointmentProv.fetchDoctors(_selectedDepartment!).then((_) {
          if (_selectedDoctor == null && appointmentProv.doctors.isNotEmpty) {
            setState(() {
              _selectedDoctor = appointmentProv.doctors.first['name'];
            });
          }
        });
      }
      if (appointmentProv.timeSlots.isNotEmpty && _selectedTimeSlot == null) {
        setState(() {
          _selectedTimeSlot = appointmentProv.timeSlots.first;
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

  void _selectPastRecordForFollowUp(ExaminationRecord record) {
    setState(() {
      _selectedDepartment = record.departmentName;
      _selectedDoctor = record.doctorName;
      _previousRecordController.text = record.examinationCode;
      _followUpNotesController.text = record.followUpAppointment.isNotEmpty
          ? record.followUpAppointment
          : 'Tái khám theo bệnh án ${record.examinationCode} (${record.icD10Name.isNotEmpty ? record.icD10Name : record.assessment})';
      _currentStep = 2; // Chuyển thẳng sang Chọn Ngày & Giờ khám
    });
    context.read<AppointmentProvider>().fetchDoctors(record.departmentName);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✓ Đã nạp đợt khám ${record.examinationCode}. Vui lòng chọn ngày & giờ tái khám!'),
        backgroundColor: const Color(0xFF7C3AED),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  void _selectPastAppointmentForFollowUp(Map<String, dynamic> apt) {
    final dept = apt['departmentName']?.toString() ?? '';
    final doc = apt['doctorName']?.toString() ?? '';
    final aptId = apt['id']?.toString() ?? '';
    final date = apt['appointmentDate']?.toString() ?? '';
    setState(() {
      if (dept.isNotEmpty) _selectedDepartment = dept;
      if (doc.isNotEmpty) _selectedDoctor = doc;
      _previousRecordController.text = aptId;
      _followUpNotesController.text = 'Tái khám theo lịch hẹn ngày $date ($dept)';
      _currentStep = 2; // Chuyển thẳng sang Chọn Ngày & Giờ khám
    });
    if (dept.isNotEmpty) {
      context.read<AppointmentProvider>().fetchDoctors(dept);
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✓ Đã nạp đợt khám $aptId. Vui lòng chọn ngày & giờ tái khám!'),
        backgroundColor: const Color(0xFF7C3AED),
        duration: const Duration(seconds: 3),
      ),
    );
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
                    decoration: const BoxDecoration(
                      color: Color(0xFFEFF6FF),
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
        title: Text(_isFollowUp ? 'Đặt Lịch Tái Khám' : 'Đặt Lịch Khám'),
        actions: [
          IconButton(
            tooltip: 'Lịch hẹn của tôi',
            icon: const Icon(Icons.history_rounded),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const MyAppointmentsView()),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Segmented Switch: Khám Mới vs Tái Khám
          Container(
            margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () {
                      if (_isFollowUp) {
                        setState(() {
                          _isFollowUp = false;
                        });
                      }
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 9),
                      decoration: BoxDecoration(
                        color: !_isFollowUp ? AppTheme.primary : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: !_isFollowUp
                            ? [
                                BoxShadow(
                                  color: AppTheme.primary.withValues(alpha: 0.25),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ]
                            : null,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.medical_services_outlined,
                              size: 16, color: !_isFollowUp ? Colors.white : AppTheme.textSecondary),
                          const SizedBox(width: 6),
                          Text(
                            'Khám Mới',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: !_isFollowUp ? FontWeight.bold : FontWeight.w600,
                              color: !_isFollowUp ? Colors.white : AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: InkWell(
                    onTap: () {
                      if (!_isFollowUp) {
                        setState(() {
                          _isFollowUp = true;
                        });
                      }
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 9),
                      decoration: BoxDecoration(
                        color: _isFollowUp ? const Color(0xFF7C3AED) : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: _isFollowUp
                            ? [
                                BoxShadow(
                                  color: const Color(0xFF7C3AED).withValues(alpha: 0.25),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ]
                            : null,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.event_repeat_rounded,
                              size: 16, color: _isFollowUp ? Colors.white : AppTheme.textSecondary),
                          const SizedBox(width: 6),
                          Text(
                            'Tái Khám Theo Hẹn',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: _isFollowUp ? FontWeight.bold : FontWeight.w600,
                              color: _isFollowUp ? Colors.white : AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Step Progress Tab Bar (Horizontal Stepper)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildStepperItem(0, _isFollowUp ? 'Đợt khám' : 'Khoa'),
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
        decoration: const BoxDecoration(
          color: AppTheme.surface,
          border: Border(top: BorderSide(color: AppTheme.borderSubtle)),
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
        if (_isFollowUp) {
          return _buildFollowUpStep0();
        }
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
            Text(_isFollowUp ? 'Chọn Bác Sĩ Tái Khám' : 'Chọn Bác Sĩ Khám', style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryDark)),
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
                        color: isSelected ? (_isFollowUp ? const Color(0xFFF5F3FF) : AppTheme.primary.withValues(alpha: 0.05)) : AppTheme.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSelected ? (_isFollowUp ? const Color(0xFF7C3AED) : AppTheme.primary) : AppTheme.borderSubtle,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        leading: Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isSelected ? (_isFollowUp ? const Color(0xFF7C3AED) : AppTheme.primary) : AppTheme.borderSubtle,
                              width: 2,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.06),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: ClipOval(
                            child: docAvatar.isNotEmpty
                                ? Image.network(
                                    docAvatar,
                                    fit: BoxFit.cover,
                                    width: 52,
                                    height: 52,
                                    errorBuilder: (_, __, ___) => Container(
                                      color: AppTheme.primary.withValues(alpha: 0.1),
                                      child: const Icon(Icons.person_rounded, size: 28, color: AppTheme.primary),
                                    ),
                                    loadingBuilder: (context, child, progress) {
                                      if (progress == null) return child;
                                      return Container(
                                        color: AppTheme.background,
                                        child: const Center(
                                          child: SizedBox(
                                            width: 16,
                                            height: 16,
                                            child: CircularProgressIndicator(strokeWidth: 2),
                                          ),
                                        ),
                                      );
                                    },
                                  )
                                : Container(
                                    color: AppTheme.primary.withValues(alpha: 0.1),
                                    child: const Icon(Icons.person_rounded, size: 28, color: AppTheme.primary),
                                  ),
                          ),
                        ),
                        title: Row(
                          children: [
                            Expanded(
                              child: Text(
                                docName, 
                                style: GoogleFonts.inter(
                                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.bold, 
                                  fontSize: 15, 
                                  color: isSelected ? (_isFollowUp ? const Color(0xFF6D28D9) : AppTheme.primaryDark) : AppTheme.textPrimary
                                )
                              ),
                            ),
                            if (_isFollowUp && isSelected)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEDE9FE),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text('Bác sĩ điều trị', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF7C3AED))),
                              ),
                          ],
                        ),
                        subtitle: Padding(
                          padding: const EdgeInsets.only(top: 4.0),
                          child: Text(
                            '$docTitle • $docDept', 
                            style: GoogleFonts.inter(fontSize: 12, color: isSelected ? (_isFollowUp ? const Color(0xFF7C3AED) : AppTheme.primary) : AppTheme.textSecondary)
                          ),
                        ),
                        trailing: Icon(
                          Icons.check_circle,
                          color: isSelected ? (_isFollowUp ? const Color(0xFF7C3AED) : AppTheme.primary) : Colors.transparent,
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
            Text(_isFollowUp ? 'Ngày & Giờ Tái Khám' : 'Ngày & Giờ Khám', style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryDark)),
            const SizedBox(height: 4),
            Text('Chọn thời gian thuận tiện nhất', style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textSecondary)),
            const SizedBox(height: 16),

            // Banner tóm tắt Chuyên khoa & Bác sĩ đã chọn
            if (_selectedDepartment != null)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: _isFollowUp ? const Color(0xFFF5F3FF) : const Color(0xFFF0F9FF),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: _isFollowUp ? const Color(0xFFDDD6FE) : const Color(0xFFBAE6FD)),
                ),
                child: Row(
                  children: [
                    Icon(
                      _isFollowUp ? Icons.event_repeat_rounded : Icons.medical_services_outlined,
                      size: 20,
                      color: _isFollowUp ? const Color(0xFF7C3AED) : AppTheme.primary,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _selectedDoctor ?? 'Bác sĩ chuyên khoa',
                            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                          ),
                          Text(
                            '$_selectedDepartment${_previousRecordController.text.isNotEmpty ? " • Mã HS: ${_previousRecordController.text}" : ""}',
                            style: GoogleFonts.inter(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w500,
                              color: _isFollowUp ? const Color(0xFF6D28D9) : const Color(0xFF0369A1),
                            ),
                          ),
                        ],
                      ),
                    ),
                    TextButton(
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      onPressed: () => setState(() => _currentStep = 0),
                      child: Text('Đổi', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primary)),
                    ),
                  ],
                ),
              ),

            // Gợi ý ngày tái khám nhanh theo chỉ định
            if (_isFollowUp) ...[
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF5F3FF),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFDDD6FE)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.flash_on_rounded, size: 16, color: Color(0xFF7C3AED)),
                        const SizedBox(width: 6),
                        Text(
                          'GỢI Ý LỊCH TÁI KHÁM THEO CHỈ ĐỊNH',
                          style: GoogleFonts.inter(fontSize: 11.5, fontWeight: FontWeight.bold, color: const Color(0xFF6D28D9)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildQuickDaysChip(3, '+3 ngày'),
                          const SizedBox(width: 6),
                          _buildQuickDaysChip(5, '+5 ngày'),
                          const SizedBox(width: 6),
                          _buildQuickDaysChip(7, '+7 ngày (1 tuần)'),
                          const SizedBox(width: 6),
                          _buildQuickDaysChip(14, '+14 ngày (2 tuần)'),
                          const SizedBox(width: 6),
                          _buildQuickDaysChip(30, '+1 tháng'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],

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
                        colorScheme: ColorScheme.light(
                          primary: _isFollowUp ? const Color(0xFF7C3AED) : AppTheme.primary,
                          onPrimary: Colors.white,
                          onSurface: AppTheme.textPrimary,
                        ),
                      ),
                      child: child!,
                    );
                  },
                );
                if (!mounted) return;
                if (picked != null) {
                  setState(() {
                    _selectedDate = picked;
                    _selectedTimeSlot = null;
                  });
                  final dateStr = '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
                  context.read<AppointmentProvider>().fetchTimeSlotsWithCapacity(dateStr);
                }
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: _isFollowUp ? const Color(0xFF7C3AED) : AppTheme.primary, width: 1.5),
                ),
                child: Row(
                  children: [
                    Icon(Icons.calendar_month_rounded, color: _isFollowUp ? const Color(0xFF7C3AED) : AppTheme.primary, size: 28),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Ngày khám', style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary)),
                          const SizedBox(height: 2),
                          Text(
                            'Thứ ${_getVietnameseDayOfWeek(_selectedDate.weekday)}, ${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                            style: GoogleFonts.sora(fontWeight: FontWeight.bold, fontSize: 14, color: _isFollowUp ? const Color(0xFF6D28D9) : AppTheme.primaryDark),
                          ),
                        ],
                      ),
                    ),
                    Icon(Icons.edit_calendar, size: 20, color: _isFollowUp ? const Color(0xFF7C3AED) : AppTheme.primary),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Khung giờ đặt khám:', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14, color: AppTheme.textPrimary)),
                Text('(Đã đồng bộ giới hạn)', style: GoogleFonts.inter(fontSize: 11.5, color: const Color(0xFF0284C7), fontWeight: FontWeight.w500)),
              ],
            ),
            const SizedBox(height: 16),

            // Time Slot Grid with Capacity & Lock Detection
            LayoutBuilder(
              builder: (context, constraints) {
                final provider = context.watch<AppointmentProvider>();
                final chipWidth = (constraints.maxWidth - 16) / 3;
                return Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: provider.timeSlots.map((slot) {
                    final isSelected = _selectedTimeSlot == slot;

                    // Tra cứu quota thực tế của khung giờ này từ Admin
                    final slotStartTime = slot.split(' - ')[0].trim();
                    final slotInfo = provider.slotQuotas.firstWhere(
                      (q) {
                        final qSlot = q['timeSlot']?.toString() ?? '';
                        return qSlot == slot || qSlot.startsWith(slotStartTime) || slotStartTime.startsWith(qSlot.split('-')[0].trim());
                      },
                      orElse: () => <String, dynamic>{},
                    );

                    final isLocked = slotInfo['isLocked'] == true;
                    final maxCapacity = (slotInfo['maxCapacity'] as num?)?.toInt() ?? 5;
                    final bookedCount = (slotInfo['bookedCount'] as num?)?.toInt() ?? 0;
                    final isFull = slotInfo['isFull'] == true || bookedCount >= maxCapacity;
                    final isBlocked = isLocked || isFull;
                    final remaining = maxCapacity - bookedCount;

                    return InkWell(
                      onTap: () {
                        if (isLocked) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('🔒 Khung giờ này đang bị tạm khóa bởi Bệnh viện. Quý khách vui lòng chọn giờ khác!'),
                              backgroundColor: Color(0xFFEF4444),
                              duration: Duration(seconds: 2),
                            ),
                          );
                          return;
                        }
                        if (isFull) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('⚠️ Khung giờ này đã đủ số lượng khám ($bookedCount/$maxCapacity). Vui lòng chọn giờ khác!'),
                              backgroundColor: const Color(0xFFD97706),
                              duration: const Duration(seconds: 2),
                            ),
                          );
                          return;
                        }
                        setState(() => _selectedTimeSlot = slot);
                      },
                      borderRadius: BorderRadius.circular(12),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: chipWidth,
                        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                        decoration: BoxDecoration(
                          color: isBlocked
                              ? const Color(0xFFF1F5F9)
                              : isSelected
                                  ? (_isFollowUp ? const Color(0xFF7C3AED) : AppTheme.primary)
                                  : AppTheme.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isBlocked
                                ? const Color(0xFFE2E8F0)
                                : isSelected
                                    ? (_isFollowUp ? const Color(0xFF7C3AED) : AppTheme.primary)
                                    : AppTheme.borderSubtle,
                            width: isSelected ? 2 : 1,
                          ),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              slot,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(
                                color: isBlocked
                                    ? const Color(0xFF94A3B8)
                                    : isSelected
                                        ? Colors.white
                                        : AppTheme.textPrimary,
                                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                fontSize: 12,
                                decoration: isBlocked ? TextDecoration.lineThrough : null,
                              ),
                            ),
                            const SizedBox(height: 4),
                            if (isLocked)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEE2E8),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  'ĐÃ KHÓA',
                                  style: GoogleFonts.inter(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFFEF4444),
                                  ),
                                ),
                              )
                            else if (isFull)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEF3C7),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  'HẾT CHỖ',
                                  style: GoogleFonts.inter(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFFD97706),
                                  ),
                                ),
                              )
                            else
                              Text(
                                'Còn $remaining chỗ',
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w500,
                                  color: isSelected ? Colors.white70 : (_isFollowUp ? const Color(0xFF7C3AED) : const Color(0xFF0284C7)),
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
                Icon(Icons.assignment_turned_in, color: _isFollowUp ? const Color(0xFF7C3AED) : AppTheme.primary, size: 24),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'XÁC NHẬN THÔNG TIN',
                    style: GoogleFonts.sora(
                      fontWeight: FontWeight.bold, 
                      fontSize: 16, 
                      color: _isFollowUp ? const Color(0xFF6D28D9) : AppTheme.primaryDark
                    ),
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
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: _isFollowUp ? const Color(0xFF7C3AED) : AppTheme.primary, width: 2),
                      ),
                      child: ClipOval(
                        child: avatarUrl.isNotEmpty
                            ? Image.network(
                                avatarUrl,
                                fit: BoxFit.cover,
                                width: 44,
                                height: 44,
                                errorBuilder: (_, __, ___) => Container(
                                  color: AppTheme.primary.withValues(alpha: 0.1),
                                  child: const Icon(Icons.person_rounded, size: 24, color: AppTheme.primary),
                                ),
                              )
                            : Container(
                                color: AppTheme.primary.withValues(alpha: 0.1),
                                child: const Icon(Icons.person_rounded, size: 24, color: AppTheme.primary),
                              ),
                      ),
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
            const SizedBox(height: 16),

            // Chọn Hình thức khám: Khám Mới vs Tái Khám
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: _isFollowUp ? const Color(0xFFF5F3FF) : const Color(0xFFF0F9FF),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: _isFollowUp ? const Color(0xFFDDD6FE) : const Color(0xFFBAE6FD),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        _isFollowUp ? Icons.history_rounded : Icons.medical_services_outlined,
                        size: 20,
                        color: _isFollowUp ? const Color(0xFF7C3AED) : const Color(0xFF0284C7),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Hình thức khám bệnh:',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: _isFollowUp ? const Color(0xFF6D28D9) : const Color(0xFF0369A1),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          onTap: () => setState(() => _isFollowUp = false),
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: !_isFollowUp ? const Color(0xFF0284C7) : Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: !_isFollowUp ? const Color(0xFF0284C7) : const Color(0xFFCBD5E1),
                              ),
                            ),
                            child: Center(
                              child: Text(
                                '🩺 Khám Mới',
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: !_isFollowUp ? Colors.white : const Color(0xFF475569),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: InkWell(
                          onTap: () => setState(() => _isFollowUp = true),
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: _isFollowUp ? const Color(0xFF7C3AED) : Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: _isFollowUp ? const Color(0xFF7C3AED) : const Color(0xFFCBD5E1),
                              ),
                            ),
                            child: Center(
                              child: Text(
                                '🔄 Tái Khám',
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: _isFollowUp ? Colors.white : const Color(0xFF475569),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (_isFollowUp) ...[
                    const SizedBox(height: 12),
                    TextField(
                      controller: _previousRecordController,
                      decoration: InputDecoration(
                        labelText: 'Mã Bệnh Án (EMR) / Đơn thuốc trước',
                        hintText: 'Ví dụ: EMR2026-0015',
                        prefixIcon: const Icon(Icons.folder_shared_outlined, color: Color(0xFF7C3AED), size: 20),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      style: GoogleFonts.inter(fontSize: 13),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _followUpNotesController,
                      decoration: InputDecoration(
                        labelText: 'Lời dặn hoặc chỉ định tái khám của Bác sĩ',
                        hintText: 'Ví dụ: Tái khám sau 7 ngày, kiểm tra lại vùng họng...',
                        prefixIcon: const Icon(Icons.note_alt_outlined, color: Color(0xFF7C3AED), size: 20),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      style: GoogleFonts.inter(fontSize: 13),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 16),
            // Symptoms / Reason input
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.edit_note_rounded, size: 20, color: AppTheme.textSecondary),
                    const SizedBox(width: 12),
                    Text('Triệu chứng / Lý do khám:', style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textSecondary)),
                  ],
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _symptomsController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText: _isFollowUp
                        ? 'Ví dụ: Tái khám theo lời dặn của Bác sĩ, triệu chứng ho đã giảm bớt...'
                        : 'Mô tả triệu chứng hoặc lý do khám (không bắt buộc)...',
                    hintStyle: GoogleFonts.inter(fontSize: 13, color: AppTheme.textSecondary.withValues(alpha: 0.6)),
                    filled: true,
                    fillColor: AppTheme.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppTheme.borderSubtle),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: _isFollowUp ? const Color(0xFF7C3AED) : AppTheme.primary, width: 1.5),
                    ),
                    contentPadding: const EdgeInsets.all(12),
                  ),
                  style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textPrimary),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: _isFollowUp ? const Color(0xFFF5F3FF) : const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: _isFollowUp ? const Color(0xFFDDD6FE) : const Color(0xFFFDE68A)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline, color: _isFollowUp ? const Color(0xFF7C3AED) : const Color(0xFFD97706), size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _isFollowUp
                          ? 'Quý khách vui lòng mang theo đơn thuốc hoặc kết quả khám cũ và đến trước 15 phút để làm thủ tục xác nhận tại quầy tiếp nhận.'
                          : 'Quý khách vui lòng đến trước 15 phút để làm thủ tục xác nhận tại quầy tiếp nhận.',
                      style: GoogleFonts.inter(fontSize: 12, color: _isFollowUp ? const Color(0xFF5B21B6) : const Color(0xFF92400E), height: 1.4),
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
    }
  }

  Widget _buildQuickDaysChip(int days, String label) {
    final targetDate = DateTime.now().add(Duration(days: days));
    final isSelected = _selectedDate.year == targetDate.year &&
        _selectedDate.month == targetDate.month &&
        _selectedDate.day == targetDate.day;

    return InkWell(
      onTap: () {
        setState(() {
          _selectedDate = targetDate;
          _selectedTimeSlot = null;
        });
        final dateStr = '${targetDate.year}-${targetDate.month.toString().padLeft(2, '0')}-${targetDate.day.toString().padLeft(2, '0')}';
        context.read<AppointmentProvider>().fetchTimeSlotsWithCapacity(dateStr);
      },
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF7C3AED) : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? const Color(0xFF7C3AED) : const Color(0xFFDDD6FE),
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11.5,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
            color: isSelected ? Colors.white : const Color(0xFF6D28D9),
          ),
        ),
      ),
    );
  }

  Widget _buildFollowUpStep0() {
    final patientProvider = context.watch<PatientProvider>();
    final appointmentProvider = context.watch<AppointmentProvider>();
    final exams = patientProvider.examinations;
    final pastAppointments = appointmentProvider.myAppointments;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Highlight Header
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFF5F3FF),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFDDD6FE)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: Color(0xFFEDE9FE),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.event_repeat_rounded, color: Color(0xFF7C3AED), size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Cổng Đặt Lịch Tái Khám Định Kỳ',
                      style: GoogleFonts.sora(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF6D28D9)),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Hệ thống tự động liên kết hồ sơ bệnh án điện tử (EMR) cũ, giúp bác sĩ nắm rõ chẩn đoán và kết quả xét nghiệm trước đó.',
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF5B21B6), height: 1.4),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),

        // Section: Đợt khám trước đó
        Row(
          children: [
            const Icon(Icons.history_edu_rounded, size: 18, color: Color(0xFF7C3AED)),
            const SizedBox(width: 6),
            Text(
              'Chọn đợt khám / Bệnh án cần tái khám:',
              style: GoogleFonts.inter(fontSize: 13.5, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          'Bấm "Tái khám đợt này" để hệ thống tự động điền Bác sĩ & Khoa khám',
          style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary),
        ),
        const SizedBox(height: 12),

        if (patientProvider.isLoading)
          const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator(color: Color(0xFF7C3AED))))
        else if (exams.isNotEmpty) ...[
          ...exams.map((exam) {
            final isSelected = _previousRecordController.text == exam.examinationCode;
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFFF5F3FF) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSelected ? const Color(0xFF7C3AED) : const Color(0xFFE2E8F0),
                  width: isSelected ? 2 : 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF0F172A).withValues(alpha: 0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEDE9FE),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          exam.examinationCode.isNotEmpty ? exam.examinationCode : 'EMR',
                          style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF7C3AED)),
                        ),
                      ),
                      const Spacer(),
                      const Icon(Icons.calendar_today_outlined, size: 13, color: AppTheme.textSecondary),
                      const SizedBox(width: 4),
                      Text(exam.formattedDate, style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.w500)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    exam.icD10Name.isNotEmpty ? exam.icD10Name : (exam.assessment.isNotEmpty ? exam.assessment : 'Khám ${exam.departmentName}'),
                    style: GoogleFonts.sora(fontSize: 13.5, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.person_pin_rounded, size: 15, color: Color(0xFF0284C7)),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${exam.doctorName} • ${exam.departmentName}',
                          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF0369A1), fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                  if (exam.followUpAppointment.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.alarm_on_rounded, size: 14, color: Color(0xFFD97706)),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              'Lời dặn: ${exam.followUpAppointment}',
                              style: GoogleFonts.inter(fontSize: 11.5, color: const Color(0xFF92400E), fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    height: 38,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF7C3AED),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        elevation: 0,
                      ),
                      onPressed: () => _selectPastRecordForFollowUp(exam),
                      icon: const Icon(Icons.check_circle_rounded, size: 16, color: Colors.white),
                      label: Text(
                        'TÁI KHÁM ĐỢT NÀY (1 CHẠM)',
                        style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ] else if (pastAppointments.isNotEmpty) ...[
          ...pastAppointments.take(3).map((apt) {
            final aptId = apt['id']?.toString() ?? '';
            final dept = apt['departmentName']?.toString() ?? '';
            final doc = apt['doctorName']?.toString() ?? '';
            final date = apt['appointmentDate']?.toString() ?? '';
            final isSelected = _previousRecordController.text == aptId;

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFFF5F3FF) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSelected ? const Color(0xFF7C3AED) : const Color(0xFFE2E8F0),
                  width: isSelected ? 2 : 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF0F172A).withValues(alpha: 0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEDE9FE),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          aptId,
                          style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF7C3AED)),
                        ),
                      ),
                      const Spacer(),
                      Text(date, style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.w500)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('$dept • $doc', style: GoogleFonts.sora(fontSize: 13.5, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    height: 38,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF7C3AED),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        elevation: 0,
                      ),
                      onPressed: () => _selectPastAppointmentForFollowUp(apt),
                      icon: const Icon(Icons.check_circle_rounded, size: 16, color: Colors.white),
                      label: Text('TÁI KHÁM THEO LỊCH NÀY', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                  ),
                ],
              ),
            );
          }),
        ] else ...[
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline, size: 20, color: Color(0xFF64748B)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Chưa tìm thấy lịch sử khám gần đây. Bạn có thể nhập mã bệnh án cũ hoặc chọn chuyên khoa bên dưới.',
                    style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF475569)),
                  ),
                ),
              ],
            ),
          ),
        ],

        const SizedBox(height: 16),
        // Nhập mã bệnh án thủ công
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Nhập Mã Bệnh Án / Toa thuốc cũ (nếu có):',
                style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _previousRecordController,
                decoration: InputDecoration(
                  hintText: 'Ví dụ: EMR2026-0015 hoặc số toa thuốc...',
                  prefixIcon: const Icon(Icons.badge_outlined, size: 20, color: Color(0xFF7C3AED)),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
                style: GoogleFonts.inter(fontSize: 13),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _followUpNotesController,
                decoration: InputDecoration(
                  hintText: 'Lời dặn tái khám của Bác sĩ (ví dụ: Tái khám sau 7 ngày)...',
                  prefixIcon: const Icon(Icons.note_alt_outlined, size: 20, color: Color(0xFF7C3AED)),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
                style: GoogleFonts.inter(fontSize: 13),
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),
        Text('Hoặc chọn chuyên khoa cần tái khám:', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
        const SizedBox(height: 12),

        ...context.watch<AppointmentProvider>().departments.map((dept) {
          final isSelected = _selectedDepartment == dept;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: InkWell(
              onTap: () => _onDepartmentChanged(dept),
              borderRadius: BorderRadius.circular(14),
              child: Container(
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFFF5F3FF) : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSelected ? const Color(0xFF7C3AED) : const Color(0xFFE2E8F0),
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                  leading: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFF7C3AED) : const Color(0xFFF1F5F9),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isSelected ? Icons.check_rounded : Icons.medical_services_outlined,
                      color: isSelected ? Colors.white : const Color(0xFF64748B),
                      size: 18,
                    ),
                  ),
                  title: Text(
                    dept,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                      color: isSelected ? const Color(0xFF6D28D9) : AppTheme.textPrimary,
                    ),
                  ),
                ),
              ),
            ),
          );
        }),
      ],
    );
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
      'symptomsReason': _symptomsController.text.trim().isNotEmpty
          ? _symptomsController.text.trim()
          : (_isFollowUp
              ? 'Tái khám định kỳ theo hẹn của Bác sĩ ${_previousRecordController.text.trim().isNotEmpty ? '[Mã EMR: ${_previousRecordController.text.trim()}]' : ''}'
              : 'Đặt lịch hẹn khám trực tuyến qua ứng dụng D-Medical'),
      'status': 'Pending',
      'sourceApp': 'Flutter Mobile App',
      'appointmentType': _isFollowUp ? 'FollowUp' : 'New',
      'previousRecordCode': _isFollowUp ? _previousRecordController.text.trim() : null,
      'followUpNotes': _isFollowUp ? _followUpNotesController.text.trim() : null,
    };

    final provider = context.read<AppointmentProvider>();
    String? vnpayUrl;
    String? createdId;

    try {
      // 1. Gửi đặt lịch hẹn
      final result = await provider.bookAppointment(appointmentData);
      createdId = result?['id']?.toString();
      _lastCreatedAppointmentId = createdId;

      // 2. Thử lấy link thanh toán VNPay (nếu dịch vụ thanh toán sẵn sàng)
      try {
        vnpayUrl = await provider.getVnPayUrl(150000, 'Thanh toan phi kham benh ${user.hoTen}');
      } catch (_) {
        // Nếu cổng VNPay chưa cấu hình hoặc bận, tiếp tục quy trình thanh toán tại quầy
      }
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context); // Luôn đóng loading dialog nếu lỗi
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi: ${e.toString().replaceAll("Exception: ", "")}'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (!mounted) return;
    Navigator.pop(context); // Luôn đóng loading dialog thành công!

    if (vnpayUrl != null && vnpayUrl.isNotEmpty) {
      // Navigate to VNPay WebView
      final isSuccess = await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => VnPayPaymentView(paymentUrl: vnpayUrl!),
        ),
      );

      if (!mounted) return;

      if (isSuccess == true) {
        _showFinalSuccessDialog('Thanh toán VNPay thành công. Hệ thống đã xác nhận lịch khám!');
      } else {
        _showFinalSuccessDialog('Đã ghi nhận đặt lịch thành công. Quý khách có thể thanh toán viện phí trực tiếp tại quầy tiếp nhận.');
      }
    } else {
      if (!mounted) return;
      _showFinalSuccessDialog('Đã ghi nhận đặt lịch thành công! Quý khách vui lòng thanh toán viện phí tại quầy tiếp nhận.');
    }
  }

  void _showFinalSuccessDialog(String paymentMessage) {
    final user = context.read<AuthProvider>().user;
    final aptId = _lastCreatedAppointmentId ?? 'LH${DateTime.now().millisecondsSinceEpoch.toString().substring(6)}';
    final dateStr = '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}';

    final Map<String, dynamic> qrPayload = {
      'type': 'D_MEDICAL_EXAM_PASS',
      'version': '2.0',
      'appointmentId': aptId,
      'patientCode': user?.maBenhNhan ?? 'BN',
      'patientName': user?.hoTen ?? 'Bệnh nhân',
      'phoneNumber': user?.soDienThoai ?? '',
      'identityCard': user?.soCCCD ?? '',
      'department': _selectedDepartment ?? '',
      'doctor': _selectedDoctor ?? '',
      'roomNumber': 'Phòng Khám Chuyên Khoa',
      'appointmentDate': dateStr,
      'appointmentTime': _selectedTimeSlot ?? '',
      'appointmentType': _isFollowUp ? 'FollowUp' : 'New',
      if (_previousRecordController.text.trim().isNotEmpty) 'previousRecordCode': _previousRecordController.text.trim(),
      if (_followUpNotesController.text.trim().isNotEmpty) 'followUpNotes': _followUpNotesController.text.trim(),
      if (_symptomsController.text.trim().isNotEmpty) 'symptoms': _symptomsController.text.trim(),
      'checkInNotice': 'Xuat trinh ma QR tai phong kham de vao kham (Khong can lay STT)',
    };
    final qrData = jsonEncode(qrPayload);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: Colors.white,
        contentPadding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
        title: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(
                color: Color(0xFFE0F2FE),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_rounded, color: AppTheme.primary, size: 36),
            ),
            const SizedBox(height: 12),
            Text(
              'ĐẶT LỊCH THÀNH CÔNG',
              style: GoogleFonts.sora(fontSize: 16.5, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
              textAlign: TextAlign.center,
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Mã phiếu hẹn: $aptId',
                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.primary),
              ),
              const SizedBox(height: 12),

              // QR Code Container (Thay thế STT)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFBAE6FD), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0284C7).withValues(alpha: 0.1),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: QrImageView(
                  data: qrData,
                  version: QrVersions.auto,
                  size: 150,
                  backgroundColor: Colors.white,
                  eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: AppTheme.primaryDark),
                  dataModuleStyle: const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: AppTheme.primary),
                ),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _isFollowUp ? const Color(0xFFF5F3FF) : const Color(0xFFE0F2FE),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: _isFollowUp ? const Color(0xFFDDD6FE) : const Color(0xFFBAE6FD)),
                ),
                child: Text(
                  _isFollowUp ? '🔄 PHIẾU HẸN TÁI KHÁM (ĐÃ BỎ STT)' : 'MÃ QR TIẾP NHẬN (ĐÃ BỎ STT)',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: _isFollowUp ? const Color(0xFF7C3AED) : AppTheme.primaryDark,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Text(
                paymentMessage,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF0F172A), fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(38),
                  side: const BorderSide(color: Color(0xFFBAE6FD)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                icon: const Icon(Icons.info_outline, size: 16, color: AppTheme.primary),
                label: Text(
                  'Xem thông tin khám trong Mã QR',
                  style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primary),
                ),
                onPressed: () => _showQrDataDetailsModal(context, qrPayload),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0F9FF),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFBAE6FD)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.qr_code_scanner_rounded, color: AppTheme.primary, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Khi đến bệnh viện, quý khách xuất trình mã QR này tại phòng khám để vào khám ngay (Hệ thống đã bỏ hoàn toàn số thứ tự STT giấy).',
                        style: GoogleFonts.inter(fontSize: 11.5, color: const Color(0xFF0369A1), height: 1.4),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppTheme.primary),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onPressed: () {
                    Navigator.pop(ctx);
                    setState(() {
                      _currentStep = 0;
                      _selectedDoctor = null;
                      _selectedTimeSlot = null;
                      _selectedDate = DateTime.now().add(const Duration(days: 1));
                      _symptomsController.clear();
                      _lastCreatedAppointmentId = null;
                    });
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const MyAppointmentsView()),
                    );
                  },
                  child: Text('Xem Lịch Của Tôi', style: GoogleFonts.inter(color: AppTheme.primary, fontWeight: FontWeight.bold, fontSize: 12)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    elevation: 0,
                  ),
                  onPressed: () {
                    Navigator.pop(ctx);
                    setState(() {
                      _currentStep = 0;
                      _selectedDoctor = null;
                      _selectedTimeSlot = null;
                      _selectedDate = DateTime.now().add(const Duration(days: 1));
                      _symptomsController.clear();
                      _lastCreatedAppointmentId = null;
                    });
                  },
                  child: Text('Về Trang Chủ', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                ),
              ),
            ],
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

  void _showQrDataDetailsModal(BuildContext context, Map<String, dynamic> data) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(color: const Color(0xFFCBD5E1), borderRadius: BorderRadius.circular(2)),
              ),
            ),
            Row(
              children: [
                const Icon(Icons.qr_code_2_rounded, color: AppTheme.primary, size: 24),
                const SizedBox(width: 8),
                Text(
                  'Dữ Liệu Khám Tích Hợp Trong Mã QR',
                  style: GoogleFonts.sora(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              'Mã QR đã mã hóa đầy đủ thông tin bệnh nhân & đợt khám. Bệnh viện đã bỏ số thứ tự STT giấy.',
              style: GoogleFonts.inter(fontSize: 11.5, color: const Color(0xFF64748B)),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF0F9FF),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFBAE6FD)),
              ),
              child: Column(
                children: [
                  _buildModalInspectionRow('Mã tiếp nhận', data['appointmentId'] ?? '--'),
                  _buildModalInspectionRow('Họ và tên', data['patientName'] ?? '--'),
                  _buildModalInspectionRow('Mã người bệnh', data['patientCode'] ?? '--'),
                  _buildModalInspectionRow('Số CCCD / ĐDCN', data['identityCard'] ?? '--'),
                  _buildModalInspectionRow('Chuyên khoa khám', data['department'] ?? '--'),
                  _buildModalInspectionRow('Phòng khám', data['roomNumber'] ?? '--'),
                  if (data['doctor'] != null) _buildModalInspectionRow('Bác sĩ', data['doctor']),
                  if (data['appointmentDate'] != null) _buildModalInspectionRow('Ngày hẹn', '${data['appointmentTime']} - ${data['appointmentDate']}'),
                  _buildModalInspectionRow('Loại khám', data['appointmentType'] == 'FollowUp' ? 'Tái khám định kỳ' : 'Khám mới'),
                  if (data['previousRecordCode'] != null) _buildModalInspectionRow('Hồ sơ EMR cũ', data['previousRecordCode']),
                  if (data['followUpNotes'] != null) _buildModalInspectionRow('Lời dặn tái khám', data['followUpNotes']),
                  if (data['symptoms'] != null) _buildModalInspectionRow('Lý do khám', data['symptoms']),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () => Navigator.pop(ctx),
                child: Text('Đã hiểu (Đóng)', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModalInspectionRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B), fontWeight: FontWeight.w500)),
          ),
          Expanded(
            child: Text(value, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF0F172A), fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
