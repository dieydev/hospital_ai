import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../main_layout_view.dart';

class CompleteProfileView extends StatefulWidget {
  final bool isDismissible;
  const CompleteProfileView({super.key, this.isDismissible = false});

  @override
  State<CompleteProfileView> createState() => _CompleteProfileViewState();
}

class _CompleteProfileViewState extends State<CompleteProfileView> {
  final _formKey = GlobalKey<FormState>();

  final _fullNameController = TextEditingController();
  final _cccdController = TextEditingController();
  final _dobController = TextEditingController();
  final _addressController = TextEditingController();
  final _bhytController = TextEditingController();
  final _emergencyNameController = TextEditingController();
  final _emergencyPhoneController = TextEditingController();
  final _emergencyRelationController = TextEditingController();

  String _selectedGender = 'Nam';
  bool _isLoading = false;
  DateTime? _selectedDate;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    if (user != null) {
      if (user.hoTen.isNotEmpty && user.hoTen != 'Bệnh nhân mới') {
        _fullNameController.text = user.hoTen;
      }
      if (user.soCCCD.isNotEmpty) {
        _cccdController.text = user.soCCCD;
      }
      if (user.ngaySinh.isNotEmpty) {
        _dobController.text = user.ngaySinh;
      }
      if (user.diaChi != null && user.diaChi != 'Chưa cập nhật') {
        _addressController.text = user.diaChi!;
      }
      if (user.maTheBHYT != null) {
        _bhytController.text = user.maTheBHYT!;
      }
      if (user.gioiTinh.isNotEmpty) {
        _selectedGender = user.gioiTinh;
      }
    }
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _cccdController.dispose();
    _dobController.dispose();
    _addressController.dispose();
    _bhytController.dispose();
    _emergencyNameController.dispose();
    _emergencyPhoneController.dispose();
    _emergencyRelationController.dispose();
    super.dispose();
  }

  Future<void> _pickDateOfBirth() async {
    final now = DateTime.now();
    final initial = _selectedDate ?? DateTime(now.year - 25, 1, 1);
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(1920),
      lastDate: now,
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
      setState(() {
        _selectedDate = picked;
        _dobController.text = DateFormat('dd/MM/yyyy').format(picked);
      });
    }
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: const [
              Icon(Icons.warning_amber_rounded, color: Colors.white),
              SizedBox(width: 8),
              Expanded(
                child: Text('Vui lòng kiểm tra và điền đầy đủ các thông tin bắt buộc (*).'),
              ),
            ],
          ),
          backgroundColor: const Color(0xFFE11D48),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          margin: const EdgeInsets.all(16),
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final authProvider = context.read<AuthProvider>();
      await authProvider.completeProfile(
        fullName: _fullNameController.text.trim(),
        cccd: _cccdController.text.trim(),
        dateOfBirth: _dobController.text.trim(),
        gender: _selectedGender,
        address: _addressController.text.trim(),
        healthInsuranceNumber: _bhytController.text.trim().isEmpty ? null : _bhytController.text.trim().toUpperCase(),
        emergencyContactName: _emergencyNameController.text.trim().isEmpty ? null : _emergencyNameController.text.trim(),
        emergencyContactPhone: _emergencyPhoneController.text.trim().isEmpty ? null : _emergencyPhoneController.text.trim(),
        emergencyContactRelation: _emergencyRelationController.text.trim().isEmpty ? null : _emergencyRelationController.text.trim(),
      );

      if (!mounted) return;

      final updatedUser = authProvider.user;
      final patientCode = updatedUser?.maBenhNhan.isNotEmpty == true
          ? updatedUser!.maBenhNhan
          : 'Đã kích hoạt';

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: Colors.white, size: 22),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Hồ sơ đã được kích hoạt thành công! Mã BN: $patientCode',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          backgroundColor: AppTheme.accentMint,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          margin: const EdgeInsets.all(16),
          duration: const Duration(seconds: 4),
        ),
      );

      // Navigate straight to MainLayout
      Navigator.of(context).pushAndRemoveUntil(
        PageRouteBuilder(
          pageBuilder: (_, __, ___) => const MainLayoutView(),
          transitionDuration: const Duration(milliseconds: 500),
          transitionsBuilder: (_, anim, __, child) =>
              FadeTransition(opacity: anim, child: child),
        ),
        (route) => false,
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            e.toString().replaceAll('Exception: ', ''),
            style: GoogleFonts.inter(fontSize: 13),
          ),
          backgroundColor: const Color(0xFFDC2626),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          margin: const EdgeInsets.all(16),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final phone = user?.soDienThoai ?? 'Chưa xác định';

    return PopScope(
      canPop: widget.isDismissible,
      child: Scaffold(
        backgroundColor: const Color(0xFFF4F8FA),
        appBar: AppBar(
          backgroundColor: AppTheme.primaryDark,
          elevation: 0,
          leading: widget.isDismissible
              ? IconButton(
                  icon: const Icon(Icons.close_rounded, color: Colors.white),
                  onPressed: () => Navigator.of(context).pop(),
                )
              : null,
          automaticallyImplyLeading: false,
          title: Text(
            'Cập nhật Hồ sơ Bệnh nhân',
            style: GoogleFonts.sora(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          centerTitle: true,
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Notice Box
                  _buildMandatoryNoticeCard(),
                  const SizedBox(height: 20),

                  // Phone number verified badge
                  _buildVerifiedPhoneBanner(phone),
                  const SizedBox(height: 24),

                  // Section 1: Thông tin định danh cá nhân
                  _buildSectionTitle('1. Thông tin Định danh Cá nhân', Icons.badge_outlined),
                  const SizedBox(height: 12),
                  _buildCardWrapper([
                    // Họ và tên
                    _buildTextField(
                      controller: _fullNameController,
                      label: 'Họ và tên (như trên CCCD) *',
                      hint: 'NGUYỄN VĂN AN',
                      icon: Icons.person_outline_rounded,
                      textCapitalization: TextCapitalization.characters,
                      validator: (val) {
                        if (val == null || val.trim().isEmpty) {
                          return 'Vui lòng nhập họ và tên';
                        }
                        if (val.trim().length < 3) {
                          return 'Họ tên quá ngắn';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Số CCCD
                    _buildTextField(
                      controller: _cccdController,
                      label: 'Số CCCD / Mã định danh cá nhân *',
                      hint: 'Nhập đủ 12 chữ số',
                      icon: Icons.credit_card_rounded,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(12),
                      ],
                      validator: (val) {
                        if (val == null || val.trim().isEmpty) {
                          return 'Vui lòng nhập số CCCD';
                        }
                        if (val.trim().length != 12) {
                          return 'Số CCCD phải gồm đúng 12 chữ số';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Ngày sinh & Giới tính
                    Row(
                      children: [
                        Expanded(
                          flex: 3,
                          child: InkWell(
                            onTap: _pickDateOfBirth,
                            borderRadius: BorderRadius.circular(14),
                            child: IgnorePointer(
                              child: _buildTextField(
                                controller: _dobController,
                                label: 'Ngày sinh *',
                                hint: 'DD/MM/YYYY',
                                icon: Icons.calendar_month_rounded,
                                validator: (val) {
                                  if (val == null || val.trim().isEmpty) {
                                    return 'Chọn ngày sinh';
                                  }
                                  return null;
                                },
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          flex: 2,
                          child: _buildGenderPicker(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Địa chỉ thường trú
                    _buildTextField(
                      controller: _addressController,
                      label: 'Địa chỉ thường trú / Nơi ở hiện tại *',
                      hint: 'Số nhà, đường, phường/xã, quận/huyện, TP...',
                      icon: Icons.location_on_outlined,
                      maxLines: 2,
                      validator: (val) {
                        if (val == null || val.trim().isEmpty) {
                          return 'Vui lòng nhập địa chỉ liên hệ';
                        }
                        return null;
                      },
                    ),
                  ]),

                  const SizedBox(height: 24),

                  // Section 2: Bảo hiểm Y tế (BHYT)
                  _buildSectionTitle('2. Bảo hiểm Y tế (BHYT)', Icons.health_and_safety_outlined),
                  const SizedBox(height: 12),
                  _buildCardWrapper([
                    _buildTextField(
                      controller: _bhytController,
                      label: 'Mã số thẻ BHYT (nếu có)',
                      hint: 'Ví dụ: GD4797931865432',
                      icon: Icons.verified_user_outlined,
                      textCapitalization: TextCapitalization.characters,
                      inputFormatters: [LengthLimitingTextInputFormatter(15)],
                      helperText: 'Hưởng chế độ thông tuyến và miễn giảm viện phí tại bệnh viện',
                    ),
                  ]),

                  const SizedBox(height: 24),

                  // Section 3: Người thân liên hệ khẩn cấp
                  _buildSectionTitle('3. Người liên hệ khẩn cấp', Icons.contact_phone_outlined),
                  const SizedBox(height: 12),
                  _buildCardWrapper([
                    _buildTextField(
                      controller: _emergencyNameController,
                      label: 'Họ tên người thân',
                      hint: 'Ví dụ: Nguyễn Thị Mẹ',
                      icon: Icons.family_restroom_rounded,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _buildTextField(
                            controller: _emergencyPhoneController,
                            label: 'Số điện thoại',
                            hint: '0987654321',
                            icon: Icons.phone_android_rounded,
                            keyboardType: TextInputType.phone,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildTextField(
                            controller: _emergencyRelationController,
                            label: 'Mối quan hệ',
                            hint: 'Vợ, Cha, Mẹ, Con...',
                            icon: Icons.group_outlined,
                          ),
                        ),
                      ],
                    ),
                  ]),

                  const SizedBox(height: 32),

                  // Action Button
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleSubmit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        elevation: 4,
                        shadowColor: AppTheme.primary.withValues(alpha: 0.35),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: Colors.white,
                              ),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.check_circle_outline_rounded, size: 20),
                                const SizedBox(width: 10),
                                Text(
                                  'LƯU & KÍCH HOẠT HỒ SƠ',
                                  style: GoogleFonts.inter(
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),

                  const SizedBox(height: 16),
                  Center(
                    child: Text(
                      'Bệnh viện D-Medical cam kết bảo mật 100% dữ liệu hồ sơ theo Luật Khám Chữa Bệnh.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMandatoryNoticeCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF), // Blue 50
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFBAE6FD), width: 1.2), // Sky 200
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withValues(alpha: 0.08),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.admin_panel_settings_rounded,
              color: AppTheme.primaryDark,
              size: 26,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Yêu cầu hoàn tất thông tin (*)',
                  style: GoogleFonts.sora(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF0369A1), // Sky 700
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Để đặt lịch khám, lấy số thứ tự tự động và tra cứu bệnh án, quý khách vui lòng cập nhật đầy đủ thông tin cá nhân dưới đây.',
                  style: GoogleFonts.inter(
                    fontSize: 12.5,
                    color: const Color(0xFF334155), // Slate 700
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerifiedPhoneBanner(String phone) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFBAE6FD)),
      ),
      child: Row(
        children: [
          const Icon(Icons.phone_iphone_rounded, color: AppTheme.primary, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Số điện thoại đã xác thực OTP',
                  style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                ),
                Text(
                  phone,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF0F172A),
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFDCFCE7), // Green 100
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                const Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 14),
                const SizedBox(width: 4),
                Text(
                  'Đã xác thực',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF16A34A),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.primaryDark),
        const SizedBox(width: 8),
        Text(
          title,
          style: GoogleFonts.sora(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF0F172A),
          ),
        ),
      ],
    );
  }

  Widget _buildCardWrapper(List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
    TextCapitalization textCapitalization = TextCapitalization.none,
    List<TextInputFormatter>? inputFormatters,
    String? Function(String?)? validator,
    int maxLines = 1,
    String? helperText,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12.5,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF334155),
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          textCapitalization: textCapitalization,
          inputFormatters: inputFormatters,
          validator: validator,
          maxLines: maxLines,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: const Color(0xFF0F172A),
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.inter(
              fontSize: 13,
              color: const Color(0xFF94A3B8),
            ),
            helperText: helperText,
            helperStyle: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
            prefixIcon: Icon(icon, color: AppTheme.primary, size: 20),
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE11D48)),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildGenderPicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Giới tính *',
          style: GoogleFonts.inter(
            fontSize: 12.5,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF334155),
          ),
        ),
        const SizedBox(height: 6),
        Container(
          height: 48,
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: () => setState(() => _selectedGender = 'Nam'),
                  borderRadius: const BorderRadius.horizontal(left: Radius.circular(11)),
                  child: Container(
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: _selectedGender == 'Nam' ? AppTheme.primary : Colors.transparent,
                      borderRadius: const BorderRadius.horizontal(left: Radius.circular(11)),
                    ),
                    child: Text(
                      'Nam',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: _selectedGender == 'Nam' ? Colors.white : const Color(0xFF64748B),
                      ),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: InkWell(
                  onTap: () => setState(() => _selectedGender = 'Nữ'),
                  borderRadius: const BorderRadius.horizontal(right: Radius.circular(11)),
                  child: Container(
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: _selectedGender == 'Nữ' ? AppTheme.primary : Colors.transparent,
                      borderRadius: const BorderRadius.horizontal(right: Radius.circular(11)),
                    ),
                    child: Text(
                      'Nữ',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: _selectedGender == 'Nữ' ? Colors.white : const Color(0xFF64748B),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
