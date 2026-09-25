import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../main_layout_view.dart';

class RegisterView extends StatefulWidget {
  const RegisterView({super.key});

  @override
  State<RegisterView> createState() => _RegisterViewState();
}

class _RegisterViewState extends State<RegisterView> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _cccdController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _agreeTerms = false;
  bool _isLoading = false;
  String _selectedGender = 'Nam';

  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _fadeAnimation = CurvedAnimation(parent: _fadeController, curve: Curves.easeOut);
    _fadeController.forward();
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    _cccdController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  void _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_agreeTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(children: [
            const Icon(Icons.info_outline, color: Colors.white, size: 18),
            const SizedBox(width: 8),
            const Expanded(child: Text('Vui lòng đồng ý với Điều khoản dịch vụ')),
          ]),
          backgroundColor: Colors.orange.shade700,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          margin: const EdgeInsets.all(16),
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      await context.read<AuthProvider>().register(
        username: _phoneController.text.trim(),
        password: _passwordController.text,
        fullName: _fullNameController.text.trim(),
        phoneNumber: _phoneController.text.trim(),
        cccd: _cccdController.text.trim(),
        gender: _selectedGender,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(children: [
            const Icon(Icons.check_circle_outline, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            const Expanded(child: Text('Đăng ký tài khoản bệnh nhân thành công!')),
          ]),
          backgroundColor: AppTheme.accentMint,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          margin: const EdgeInsets.all(16),
        ),
      );
      Navigator.of(context).pushAndRemoveUntil(
        PageRouteBuilder(
          pageBuilder: (_, __, ___) => const MainLayoutView(),
          transitionDuration: const Duration(milliseconds: 500),
          transitionsBuilder: (_, anim, __, child) => FadeTransition(opacity: anim, child: child),
        ),
        (route) => false,
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(children: [
            const Icon(Icons.error_outline, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text(e.toString().replaceAll('Exception: ', ''),
                style: GoogleFonts.inter(fontSize: 13))),
          ]),
          backgroundColor: const Color(0xFFDC2626),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          margin: const EdgeInsets.all(16),
          duration: const Duration(seconds: 5),
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle.light);
    return Scaffold(
      body: Stack(
        children: [
          // Full gradient background (same as Login)
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [AppTheme.primaryDeep, AppTheme.primaryDark, AppTheme.primary],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
          ),
          // Decorative circles
          Positioned(top: -50, right: -50,
              child: _circle(180, Colors.white.withValues(alpha: 0.04))),
          Positioned(bottom: -40, left: -40,
              child: _circle(160, AppTheme.accentMint.withValues(alpha: 0.1))),

          SafeArea(
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: Column(
                children: [
                  // ── Top bar on gradient ─────────────────────
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 14, 20, 10),
                    child: Row(
                      children: [
                        GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                            ),
                            child: const Icon(Icons.arrow_back_ios_new_rounded,
                                color: Colors.white, size: 18),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Tạo Tài Khoản', style: GoogleFonts.sora(
                                fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white,
                              )),
                              Text('Đăng ký hồ sơ bệnh nhân D-Medical',
                                  style: GoogleFonts.inter(
                                    fontSize: 12, color: Colors.white.withValues(alpha: 0.7),
                                  )),
                            ],
                          ),
                        ),
                        // White logo on dark background
                        Image.asset('assets/images/logo_white.png', height: 40, fit: BoxFit.contain),
                      ],
                    ),
                  ),

                  // ── Form Card ───────────────────────────────
                  Expanded(
                    child: Container(
                      margin: const EdgeInsets.only(top: 12, left: 16, right: 16),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(28),
                          topRight: Radius.circular(28),
                        ),
                      ),
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.fromLTRB(24, 28, 24, 32),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Section: Thông tin cá nhân
                              _buildSectionTitle('👤  Thông tin cá nhân'),
                              const SizedBox(height: 16),

                              _buildLabel('Họ và tên *'),
                              const SizedBox(height: 8),
                              _buildTextField(
                                controller: _fullNameController,
                                hint: 'Nguyễn Văn A',
                                prefixIcon: Icons.badge_outlined,
                                validator: (v) {
                                  if (v == null || v.trim().length < 2)
                                    return 'Vui lòng nhập họ tên hợp lệ';
                                  return null;
                                },
                              ),
                              const SizedBox(height: 16),

                              _buildLabel('Số điện thoại * (dùng làm tên đăng nhập)'),
                              const SizedBox(height: 8),
                              _buildTextField(
                                controller: _phoneController,
                                hint: '09xxxxxxxx',
                                prefixIcon: Icons.phone_outlined,
                                keyboardType: TextInputType.phone,
                                validator: (v) {
                                  if (v == null || v.trim().isEmpty)
                                    return 'Vui lòng nhập số điện thoại';
                                  if (!RegExp(r'^(0[3|5|7|8|9])+([0-9]{8})$').hasMatch(v.trim()))
                                    return 'Số điện thoại không hợp lệ (VD: 0901234567)';
                                  return null;
                                },
                              ),
                              const SizedBox(height: 16),

                              _buildLabel('Số CCCD / Định danh *'),
                              const SizedBox(height: 8),
                              _buildTextField(
                                controller: _cccdController,
                                hint: '0xxxxxxxxxx',
                                prefixIcon: Icons.credit_card_outlined,
                                keyboardType: TextInputType.number,
                                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                                validator: (v) {
                                  if (v == null || v.trim().isEmpty)
                                    return 'Vui lòng nhập số CCCD';
                                  if (v.trim().length != 12) return 'CCCD phải đủ 12 chữ số';
                                  return null;
                                },
                              ),
                              const SizedBox(height: 16),

                              _buildLabel('Giới tính *'),
                              const SizedBox(height: 10),
                              Row(
                                children: ['Nam', 'Nữ', 'Khác'].map((gender) {
                                  final isSelected = _selectedGender == gender;
                                  return Expanded(
                                    child: GestureDetector(
                                      onTap: () => setState(() => _selectedGender = gender),
                                      child: AnimatedContainer(
                                        duration: const Duration(milliseconds: 200),
                                        margin: EdgeInsets.only(right: gender != 'Khác' ? 10 : 0),
                                        padding: const EdgeInsets.symmetric(vertical: 12),
                                        decoration: BoxDecoration(
                                          color: isSelected ? AppTheme.primary : AppTheme.background,
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(
                                            color: isSelected ? AppTheme.primary : AppTheme.borderSubtle,
                                            width: isSelected ? 2 : 1,
                                          ),
                                        ),
                                        child: Text(gender,
                                          textAlign: TextAlign.center,
                                          style: GoogleFonts.inter(
                                            fontSize: 14, fontWeight: FontWeight.w600,
                                            color: isSelected ? Colors.white : AppTheme.textSecondary,
                                          ),
                                        ),
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                              const SizedBox(height: 28),

                              // Section: Mật khẩu
                              _buildSectionTitle('🔐  Đặt mật khẩu'),
                              const SizedBox(height: 16),

                              _buildLabel('Mật khẩu *'),
                              const SizedBox(height: 8),
                              _buildTextField(
                                controller: _passwordController,
                                hint: '8+ ký tự, chữ hoa, số, ký tự đặc biệt',
                                prefixIcon: Icons.lock_outline_rounded,
                                isPassword: true,
                                obscureText: _obscurePassword,
                                onToggleVisibility: () =>
                                    setState(() => _obscurePassword = !_obscurePassword),
                                validator: (v) {
                                  if (v == null || v.isEmpty) return 'Vui lòng nhập mật khẩu';
                                  if (!RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$')
                                      .hasMatch(v))
                                    return 'Cần: 8+ ký tự, chữ hoa, số và ký tự đặc biệt';
                                  return null;
                                },
                              ),
                              const SizedBox(height: 16),

                              _buildLabel('Xác nhận mật khẩu *'),
                              const SizedBox(height: 8),
                              _buildTextField(
                                controller: _confirmPasswordController,
                                hint: 'Nhập lại mật khẩu',
                                prefixIcon: Icons.lock_reset_outlined,
                                isPassword: true,
                                obscureText: _obscureConfirmPassword,
                                onToggleVisibility: () =>
                                    setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                                validator: (v) {
                                  if (v != _passwordController.text)
                                    return 'Mật khẩu xác nhận không khớp';
                                  return null;
                                },
                              ),
                              const SizedBox(height: 24),

                              // Terms checkbox
                              GestureDetector(
                                onTap: () => setState(() => _agreeTerms = !_agreeTerms),
                                child: Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: AppTheme.background,
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(color: AppTheme.borderSubtle),
                                  ),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      AnimatedContainer(
                                        duration: const Duration(milliseconds: 200),
                                        width: 22, height: 22,
                                        margin: const EdgeInsets.only(top: 1),
                                        decoration: BoxDecoration(
                                          color: _agreeTerms ? AppTheme.primary : Colors.transparent,
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(
                                            color: _agreeTerms ? AppTheme.primary : AppTheme.borderSubtle,
                                            width: 1.5,
                                          ),
                                        ),
                                        child: _agreeTerms
                                            ? const Icon(Icons.check, color: Colors.white, size: 14)
                                            : null,
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: RichText(
                                          text: TextSpan(
                                            style: GoogleFonts.inter(
                                                fontSize: 12, color: AppTheme.textSecondary, height: 1.5),
                                            children: [
                                              const TextSpan(text: 'Tôi đã đọc và đồng ý với '),
                                              TextSpan(text: 'Điều khoản dịch vụ',
                                                  style: GoogleFonts.inter(
                                                    fontSize: 12, fontWeight: FontWeight.w600,
                                                    color: AppTheme.primary)),
                                              const TextSpan(text: ' và '),
                                              TextSpan(text: 'Chính sách bảo mật Y tế',
                                                  style: GoogleFonts.inter(
                                                    fontSize: 12, fontWeight: FontWeight.w600,
                                                    color: AppTheme.primary)),
                                              const TextSpan(text: ' theo NĐ 13/2023/NĐ-CP.'),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(height: 28),

                              // Submit button
                              AnimatedOpacity(
                                duration: const Duration(milliseconds: 300),
                                opacity: _agreeTerms ? 1.0 : 0.5,
                                child: Container(
                                  width: double.infinity,
                                  height: 52,
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [AppTheme.primaryDark, AppTheme.primary, AppTheme.accentMint],
                                      begin: Alignment.centerLeft,
                                      end: Alignment.centerRight,
                                      stops: [0.0, 0.6, 1.0],
                                    ),
                                    borderRadius: BorderRadius.circular(16),
                                    boxShadow: _agreeTerms ? [
                                      BoxShadow(color: AppTheme.primary.withValues(alpha: 0.4),
                                          blurRadius: 16, offset: const Offset(0, 8)),
                                    ] : [],
                                  ),
                                  child: ElevatedButton(
                                    onPressed: (_isLoading || !_agreeTerms) ? null : _handleRegister,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.transparent,
                                      shadowColor: Colors.transparent,
                                      shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(16)),
                                    ),
                                    child: _isLoading
                                        ? const SizedBox(width: 22, height: 22,
                                            child: CircularProgressIndicator(
                                                color: Colors.white, strokeWidth: 2.5))
                                        : Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              const Icon(Icons.how_to_reg_outlined,
                                                  color: Colors.white, size: 20),
                                              const SizedBox(width: 8),
                                              Text('TẠO TÀI KHOẢN NGAY',
                                                  style: GoogleFonts.inter(
                                                    fontSize: 15, fontWeight: FontWeight.w700,
                                                    color: Colors.white)),
                                            ],
                                          ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 20),

                              Center(
                                child: GestureDetector(
                                  onTap: () => Navigator.pop(context),
                                  child: RichText(
                                    text: TextSpan(
                                      style: GoogleFonts.inter(fontSize: 13),
                                      children: [
                                        TextSpan(text: 'Đã có tài khoản? ',
                                            style: TextStyle(color: AppTheme.textSecondary)),
                                        TextSpan(text: 'Đăng nhập ngay',
                                            style: GoogleFonts.inter(
                                              fontSize: 13, fontWeight: FontWeight.w700,
                                              color: AppTheme.primary)),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
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

  Widget _circle(double size, Color color) =>
      Container(width: size, height: size,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle));

  Widget _buildSectionTitle(String title) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppTheme.primary.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.primary.withValues(alpha: 0.15)),
      ),
      child: Text(title, style: GoogleFonts.sora(
        fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.primaryDark,
      )),
    );
  }

  Widget _buildLabel(String text) => Text(text,
      style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.w600,
          color: AppTheme.textSecondary));

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData prefixIcon,
    bool isPassword = false,
    bool obscureText = false,
    VoidCallback? onToggleVisibility,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscureText,
      validator: validator,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      style: GoogleFonts.inter(fontSize: 15, color: AppTheme.textPrimary),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: GoogleFonts.inter(fontSize: 13.5, color: const Color(0xFFB0C4CE)),
        prefixIcon: Icon(prefixIcon, color: AppTheme.textSecondary, size: 20),
        suffixIcon: isPassword
            ? IconButton(
                icon: Icon(
                  obscureText ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                  color: AppTheme.textSecondary, size: 20),
                onPressed: onToggleVisibility)
            : null,
        filled: true,
        fillColor: AppTheme.background,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppTheme.borderSubtle)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppTheme.borderSubtle)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppTheme.primary, width: 1.8)),
        errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFFDC2626))),
        focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFFDC2626), width: 1.8)),
        errorStyle: GoogleFonts.inter(fontSize: 11, color: const Color(0xFFDC2626)),
      ),
    );
  }
}
