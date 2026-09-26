import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../main_layout_view.dart';
import '../profile/complete_profile_view.dart';
import 'register_view.dart';

class LoginView extends StatefulWidget {
  const LoginView({super.key});

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _storage = const FlutterSecureStorage();

  bool _obscurePassword = true;
  bool _rememberMe = false;
  bool _isLoading = false;

  late AnimationController _fadeController;
  late AnimationController _slideController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _slideController = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));
    _fadeAnimation = CurvedAnimation(parent: _fadeController, curve: Curves.easeOut);
    _slideAnimation = Tween<Offset>(begin: const Offset(0, 0.08), end: Offset.zero)
        .animate(CurvedAnimation(parent: _slideController, curve: Curves.easeOutCubic));
    _fadeController.forward();
    _slideController.forward();
    _loadSavedCredentials();
  }

  Future<void> _loadSavedCredentials() async {
    final savedUsername = await _storage.read(key: 'saved_username');
    final savedPassword = await _storage.read(key: 'saved_password');
    if (savedUsername != null && savedPassword != null) {
      setState(() {
        _usernameController.text = savedUsername;
        _passwordController.text = savedPassword;
        _rememberMe = true;
      });
    }
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _fadeController.dispose();
    _slideController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      if (_rememberMe) {
        await _storage.write(key: 'saved_username', value: _usernameController.text.trim());
        await _storage.write(key: 'saved_password', value: _passwordController.text);
      } else {
        await _storage.delete(key: 'saved_username');
        await _storage.delete(key: 'saved_password');
      }
      final auth = context.read<AuthProvider>();
      await auth.login(
        _usernameController.text.trim(),
        _passwordController.text,
      );
      if (!mounted) return;

      if (!auth.isProfileComplete) {
        // Bắt buộc hoàn thiện hồ sơ nếu chưa đầy đủ
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (_, __, ___) => const CompleteProfileView(isDismissible: false),
            transitionDuration: const Duration(milliseconds: 500),
            transitionsBuilder: (_, anim, __, child) =>
                FadeTransition(opacity: anim, child: child),
          ),
        );
      } else {
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (_, __, ___) => const MainLayoutView(),
            transitionDuration: const Duration(milliseconds: 500),
            transitionsBuilder: (_, anim, __, child) =>
                FadeTransition(opacity: anim, child: child),
          ),
        );
      }
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
          // Full screen gradient background
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [AppTheme.primaryDeep, AppTheme.primaryDark, AppTheme.primary],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                stops: [0.0, 0.5, 1.0],
              ),
            ),
          ),

          // Decorative circles
          Positioned(top: -70, right: -70,
              child: _circle(240, Colors.white.withValues(alpha: 0.04))),
          Positioned(top: 80, left: -90,
              child: _circle(200, Colors.white.withValues(alpha: 0.03))),
          Positioned(bottom: -50, right: -30,
              child: _circle(180, AppTheme.accentMint.withValues(alpha: 0.12))),
          Positioned(bottom: 120, left: -60,
              child: _circle(140, Colors.white.withValues(alpha: 0.03))),

          // Content
          SafeArea(
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: SlideTransition(
                position: _slideAnimation,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 52),

                      // Logo + Brand
                      Center(
                        child: Column(
                          children: [
                            // White D-Medical logo on dark gradient
                            Image.asset(
                              'assets/images/logo_white.png',
                              height: 64,
                              fit: BoxFit.contain,
                            ),
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
                              ),
                              child: Text(
                                'CỔNG DỊCH VỤ Y TẾ SỐ DÀNH CHO BỆNH NHÂN',
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white.withValues(alpha: 0.9),
                                  letterSpacing: 1.2,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 44),

                      // Form card (white, floating)
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(28),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.18),
                              blurRadius: 40,
                              offset: const Offset(0, 20),
                            ),
                          ],
                        ),
                        padding: const EdgeInsets.all(28),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Đăng nhập', style: GoogleFonts.sora(
                                fontSize: 22, fontWeight: FontWeight.w700, color: AppTheme.textPrimary,
                              )),
                              const SizedBox(height: 4),
                              Text('Chào mừng bạn trở lại 👋', style: GoogleFonts.inter(
                                fontSize: 13, color: AppTheme.textSecondary,
                              )),
                              const SizedBox(height: 28),

                              _buildLabel('Tên đăng nhập / Số điện thoại'),
                              const SizedBox(height: 8),
                              _buildTextField(
                                controller: _usernameController,
                                hint: 'Nhập số điện thoại hoặc tên đăng nhập',
                                prefixIcon: Icons.person_outline_rounded,
                                validator: (v) => (v == null || v.trim().isEmpty)
                                    ? 'Vui lòng nhập tên đăng nhập' : null,
                              ),
                              const SizedBox(height: 20),

                              _buildLabel('Mật khẩu'),
                              const SizedBox(height: 8),
                              _buildTextField(
                                controller: _passwordController,
                                hint: 'Nhập mật khẩu của bạn',
                                prefixIcon: Icons.lock_outline_rounded,
                                isPassword: true,
                                obscureText: _obscurePassword,
                                onToggleVisibility: () =>
                                    setState(() => _obscurePassword = !_obscurePassword),
                                validator: (v) => (v == null || v.isEmpty)
                                    ? 'Vui lòng nhập mật khẩu' : null,
                              ),
                              const SizedBox(height: 16),

                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  GestureDetector(
                                    onTap: () => setState(() => _rememberMe = !_rememberMe),
                                    child: Row(children: [
                                      AnimatedContainer(
                                        duration: const Duration(milliseconds: 200),
                                        width: 20, height: 20,
                                        decoration: BoxDecoration(
                                          color: _rememberMe ? AppTheme.primary : Colors.transparent,
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(
                                            color: _rememberMe ? AppTheme.primary : AppTheme.borderSubtle,
                                            width: 1.5,
                                          ),
                                        ),
                                        child: _rememberMe
                                            ? const Icon(Icons.check, color: Colors.white, size: 13)
                                            : null,
                                      ),
                                      const SizedBox(width: 8),
                                      Text('Ghi nhớ', style: GoogleFonts.inter(
                                        fontSize: 13, color: AppTheme.textSecondary,
                                      )),
                                    ]),
                                  ),
                                  Text('Quên mật khẩu?', style: GoogleFonts.inter(
                                    fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.primary,
                                  )),
                                ],
                              ),
                              const SizedBox(height: 28),

                              // Gradient login button
                              Container(
                                width: double.infinity,
                                height: 52,
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [AppTheme.primaryDark, AppTheme.primary],
                                    begin: Alignment.centerLeft,
                                    end: Alignment.centerRight,
                                  ),
                                  borderRadius: BorderRadius.circular(16),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppTheme.primary.withValues(alpha: 0.4),
                                      blurRadius: 16, offset: const Offset(0, 8),
                                    ),
                                  ],
                                ),
                                child: ElevatedButton(
                                  onPressed: _isLoading ? null : _handleLogin,
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
                                      : Text('ĐĂNG NHẬP', style: GoogleFonts.inter(
                                          fontSize: 15, fontWeight: FontWeight.w700,
                                          color: Colors.white)),
                                ),
                              ),
                              const SizedBox(height: 24),

                              Row(children: [
                                const Expanded(child: Divider(color: Color(0xFFE8F0F4))),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                  child: Text('hoặc', style: GoogleFonts.inter(
                                      fontSize: 12, color: AppTheme.textSecondary)),
                                ),
                                const Expanded(child: Divider(color: Color(0xFFE8F0F4))),
                              ]),
                              const SizedBox(height: 20),

                              SizedBox(
                                width: double.infinity,
                                height: 50,
                                child: OutlinedButton(
                                  onPressed: () => Navigator.push(context,
                                      MaterialPageRoute(builder: (_) => const RegisterView())),
                                  style: OutlinedButton.styleFrom(
                                    side: const BorderSide(color: AppTheme.borderSubtle, width: 1.5),
                                    shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(16)),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(Icons.person_add_outlined,
                                          color: AppTheme.primary, size: 20),
                                      const SizedBox(width: 8),
                                      Text('Tạo tài khoản bệnh nhân mới',
                                          style: GoogleFonts.inter(
                                            fontSize: 14, fontWeight: FontWeight.w600,
                                            color: AppTheme.primary)),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),

                      Center(
                        child: Text(
                          '🏥 D-Medical © 2026 · NĐ 13/2023/NĐ-CP',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: Colors.white.withValues(alpha: 0.45),
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
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

  Widget _buildLabel(String text) => Text(text,
      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600,
          color: AppTheme.textSecondary));

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData prefixIcon,
    bool isPassword = false,
    bool obscureText = false,
    VoidCallback? onToggleVisibility,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscureText,
      validator: validator,
      style: GoogleFonts.inter(fontSize: 15, color: AppTheme.textPrimary),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: GoogleFonts.inter(fontSize: 14, color: const Color(0xFFB0C4CE)),
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
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
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
      ),
    );
  }
}
