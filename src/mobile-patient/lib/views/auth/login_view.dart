import 'dart:async';
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
  /// Số điện thoại được điền sẵn (khi redirect từ màn hình đăng ký)
  final String? prefillPhone;

  const LoginView({super.key, this.prefillPhone});

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
  bool _showBiometricButton = false;

  // ── Trạng thái Quên mật khẩu / OTP ──
  bool _isForgotPasswordMode = false;
  int _forgotStep = 1; // 1: Nhập SĐT, 2: Nhập OTP, 3: Đặt mật khẩu mới
  final _forgotPhoneController = TextEditingController();
  final List<TextEditingController> _otpControllers =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocusNodes =
      List.generate(6, (_) => FocusNode());
  final _newPasswordController = TextEditingController();
  final _confirmNewPasswordController = TextEditingController();
  bool _obscureNewPassword = true;
  bool _obscureConfirmNewPassword = true;
  String? _forgotDemoOtp;
  Timer? _countdownTimer;
  int _secondsRemaining = 60;

  late AnimationController _fadeController;
  late AnimationController _slideController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900));
    _slideController = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 800));
    _fadeAnimation =
        CurvedAnimation(parent: _fadeController, curve: Curves.easeOut);
    _slideAnimation = Tween<Offset>(
            begin: const Offset(0, 0.08), end: Offset.zero)
        .animate(
            CurvedAnimation(parent: _slideController, curve: Curves.easeOutCubic));
    _fadeController.forward();
    _slideController.forward();

    // Điền sẵn SĐT nếu được truyền vào từ màn hình đăng ký
    if (widget.prefillPhone != null && widget.prefillPhone!.isNotEmpty) {
      _usernameController.text = widget.prefillPhone!;
    }
    _loadSavedCredentials();
    _checkBiometricAvailability();
  }

  Future<void> _loadSavedCredentials() async {
    final savedUsername = await _storage.read(key: 'saved_username');
    final savedPassword = await _storage.read(key: 'saved_password');
    if (savedUsername != null &&
        savedPassword != null &&
        (widget.prefillPhone == null)) {
      setState(() {
        _usernameController.text = savedUsername;
        _passwordController.text = savedPassword;
        _rememberMe = true;
      });
    }
  }

  Future<void> _checkBiometricAvailability() async {
    await Future.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;
    final auth = context.read<AuthProvider>();
    final canAuto = await auth.canBiometricAutoLogin();
    if (mounted && canAuto) {
      setState(() => _showBiometricButton = true);
      // Auto-trigger biometric prompt nếu không có prefillPhone
      if (widget.prefillPhone == null) {
        _handleBiometricLogin();
      }
    }
  }

  void _startOtpTimer() {
    _countdownTimer?.cancel();
    setState(() => _secondsRemaining = 60);
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_secondsRemaining > 0) {
        setState(() => _secondsRemaining--);
      } else {
        t.cancel();
      }
    });
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _forgotPhoneController.dispose();
    for (var c in _otpControllers) c.dispose();
    for (var f in _otpFocusNodes) f.dispose();
    _newPasswordController.dispose();
    _confirmNewPasswordController.dispose();
    _countdownTimer?.cancel();
    _fadeController.dispose();
    _slideController.dispose();
    super.dispose();
  }

  // ── Đăng nhập bằng Mật khẩu ──────────────────────────────────────
  void _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      if (_rememberMe) {
        await _storage.write(
            key: 'saved_username', value: _usernameController.text.trim());
        await _storage.write(
            key: 'saved_password', value: _passwordController.text);
      } else {
        await _storage.delete(key: 'saved_username');
        await _storage.delete(key: 'saved_password');
      }
      if (!mounted) return;
      final auth = context.read<AuthProvider>();
      await auth.login(
        _usernameController.text.trim(),
        _passwordController.text,
      );
      if (!mounted) return;

      // Hỏi bật sinh trắc học sau khi đăng nhập thành công lần đầu
      if (auth.biometricsAvailable && !auth.biometricsEnabled) {
        _showBiometricEnrollDialog(auth);
      } else {
        _navigateAfterLogin(auth);
      }
    } catch (e) {
      if (!mounted) return;
      _showError(e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ── Đăng nhập bằng Sinh trắc học ─────────────────────────────────
  Future<void> _handleBiometricLogin() async {
    setState(() => _isLoading = true);
    try {
      final auth = context.read<AuthProvider>();
      final success = await auth.authenticateWithBiometrics();
      if (!mounted) return;
      if (success) {
        // Token đã lưu sẵn, mark authenticated
        _navigateAfterLogin(auth);
      } else {
        _showError('Xác thực sinh trắc học thất bại. Vui lòng đăng nhập bằng mật khẩu.');
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ── Điều hướng sau đăng nhập ──────────────────────────────────────
  void _navigateAfterLogin(AuthProvider auth) {
    if (!auth.isProfileComplete) {
      Navigator.of(context).pushReplacement(PageRouteBuilder(
        pageBuilder: (_, __, ___) => const CompleteProfileView(isDismissible: false),
        transitionDuration: const Duration(milliseconds: 500),
        transitionsBuilder: (_, anim, __, child) =>
            FadeTransition(opacity: anim, child: child),
      ));
    } else {
      Navigator.of(context).pushReplacement(PageRouteBuilder(
        pageBuilder: (_, __, ___) => const MainLayoutView(),
        transitionDuration: const Duration(milliseconds: 500),
        transitionsBuilder: (_, anim, __, child) =>
            FadeTransition(opacity: anim, child: child),
      ));
    }
  }

  // ── Popup đăng ký Sinh trắc học ───────────────────────────────────
  void _showBiometricEnrollDialog(AuthProvider auth) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        contentPadding: const EdgeInsets.fromLTRB(24, 24, 24, 8),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0369a1), Color(0xFF0284c7)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(36),
              ),
              child: const Icon(Icons.fingerprint_rounded,
                  color: Colors.white, size: 40),
            ),
            const SizedBox(height: 18),
            Text('Bật đăng nhập sinh trắc học?',
                style: GoogleFonts.sora(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0f172a)),
                textAlign: TextAlign.center),
            const SizedBox(height: 10),
            Text(
              'Cho phép D-Medical sử dụng Face ID / Vân tay để đăng nhập nhanh hơn ở các lần tiếp theo.',
              style: GoogleFonts.inter(
                  fontSize: 13.5,
                  color: const Color(0xFF64748b),
                  height: 1.5),
              textAlign: TextAlign.center,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              _navigateAfterLogin(auth);
            },
            child: Text('Để sau',
                style: GoogleFonts.inter(color: const Color(0xFF64748b))),
          ),
          ElevatedButton.icon(
            onPressed: () async {
              Navigator.of(ctx).pop();
              await auth.setBiometricsEnabled(true);
              if (mounted) _navigateAfterLogin(auth);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0284c7),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            icon: const Icon(Icons.fingerprint_rounded, size: 18),
            label: Text('Bật ngay',
                style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  // ── Luồng Quên Mật khẩu / OTP ────────────────────────────────────
  Future<void> _handleForgotSendOtp() async {
    final phone = _forgotPhoneController.text.trim().replaceAll(' ', '');
    if (!RegExp(r'^(0|\+84)[3|5|7|8|9][0-9]{8}$').hasMatch(phone)) {
      _showError('Số điện thoại không đúng định dạng (10 chữ số)');
      return;
    }
    setState(() => _isLoading = true);
    try {
      final res =
          await context.read<AuthProvider>().sendForgotPasswordOtp(phone);
      if (!mounted) return;
      setState(() {
        _forgotStep = 2;
        _forgotDemoOtp = res['otpCode']?.toString() ?? '123456';
      });
      _startOtpTimer();
      _showSuccess('Mã OTP đã được gửi. Kiểm tra Console/SMS để xem mã.');
    } catch (e) {
      if (!mounted) return;
      _showError(e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleForgotVerifyOtp() async {
    final otp = _otpControllers.map((c) => c.text).join().trim();
    if (otp.length != 6) {
      _showError('Vui lòng nhập đủ 6 chữ số mã OTP');
      return;
    }
    // Local check demo OTP
    if (_forgotDemoOtp != null && otp != _forgotDemoOtp && otp != '123456') {
      _showError('Mã OTP không chính xác. Mã demo: $_forgotDemoOtp');
      return;
    }
    setState(() {
      _forgotStep = 3;
      _countdownTimer?.cancel();
    });
    _showSuccess('Xác thực OTP thành công! Vui lòng đặt mật khẩu mới.');
  }

  Future<void> _handleForgotResetPassword() async {
    final phone = _forgotPhoneController.text.trim().replaceAll(' ', '');
    final otp = _otpControllers.map((c) => c.text).join().trim();
    final newPwd = _newPasswordController.text.trim();
    final confirmPwd = _confirmNewPasswordController.text.trim();

    if (newPwd.length < 8) {
      _showError('Mật khẩu phải dài tối thiểu 8 ký tự');
      return;
    }
    if (!RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$')
        .hasMatch(newPwd)) {
      _showError(
          'Mật khẩu cần chữ hoa, thường, số và ký tự đặc biệt (vd: MatKhau123@)');
      return;
    }
    if (newPwd != confirmPwd) {
      _showError('Mật khẩu xác nhận không trùng khớp');
      return;
    }

    setState(() => _isLoading = true);
    try {
      final auth = context.read<AuthProvider>();
      await auth.resetPasswordOtp(
        phoneNumber: phone,
        otpCode: otp.isNotEmpty ? otp : '123456',
        newPassword: newPwd,
      );
      if (!mounted) return;

      // Đặt lại xong -> tự đăng nhập -> đóng forgot mode
      setState(() => _isForgotPasswordMode = false);
      _showSuccess('Đặt lại mật khẩu thành công! Đang đăng nhập...');

      await Future.delayed(const Duration(milliseconds: 800));
      if (!mounted) return;

      if (auth.biometricsAvailable && !auth.biometricsEnabled) {
        _showBiometricEnrollDialog(auth);
      } else {
        _navigateAfterLogin(auth);
      }
    } catch (e) {
      if (!mounted) return;
      _showError(e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(children: [
        const Icon(Icons.error_outline, color: Colors.white, size: 20),
        const SizedBox(width: 10),
        Expanded(
            child: Text(msg, style: GoogleFonts.inter(fontSize: 13))),
      ]),
      backgroundColor: const Color(0xFFDC2626),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: const EdgeInsets.all(16),
    ));
  }

  void _showSuccess(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(children: [
        const Icon(Icons.check_circle_outline, color: Colors.white, size: 20),
        const SizedBox(width: 10),
        Expanded(
            child: Text(msg, style: GoogleFonts.inter(fontSize: 13))),
      ]),
      backgroundColor: const Color(0xFF0284c7),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: const EdgeInsets.all(16),
    ));
  }

  @override
  Widget build(BuildContext context) {
    SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle.light);
    return Scaffold(
      body: Stack(
        children: [
          // Background gradient
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
                            Image.asset('assets/images/logo_white.png',
                                height: 64, fit: BoxFit.contain),
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.25)),
                              ),
                              child: Text(
                                'CỔNG DỊCH VỤ Y TẾ SỐ DÀNH CHO BỆNH NHÂN',
                                style: GoogleFonts.inter(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white.withValues(alpha: 0.9),
                                    letterSpacing: 1.2),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 44),

                      // Main card
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 350),
                        switchInCurve: Curves.easeOut,
                        switchOutCurve: Curves.easeIn,
                        child: _isForgotPasswordMode
                            ? _buildForgotPasswordCard()
                            : _buildLoginCard(),
                      ),

                      const SizedBox(height: 32),
                      Center(
                        child: Text('🏥 D-Medical © 2026 · NĐ 13/2023/NĐ-CP',
                            style: GoogleFonts.inter(
                                fontSize: 11,
                                color: Colors.white.withValues(alpha: 0.45))),
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

  // ── Card Đăng nhập chính ──────────────────────────────────────────
  Widget _buildLoginCard() {
    return Container(
      key: const ValueKey('login'),
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
            // Nếu redirect từ Register: hiển thị banner "Khách cũ"
            if (widget.prefillPhone != null) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFE0F2FE),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF0284c7).withValues(alpha: 0.3)),
                ),
                child: Row(children: [
                  const Icon(Icons.info_outline_rounded,
                      color: Color(0xFF0284c7), size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'SĐT ${widget.prefillPhone} đã có tài khoản. Vui lòng nhập mật khẩu để đăng nhập.',
                      style: GoogleFonts.inter(
                          fontSize: 12.5,
                          color: const Color(0xFF0369a1),
                          height: 1.4),
                    ),
                  ),
                ]),
              ),
              const SizedBox(height: 20),
            ],

            Text('Đăng nhập',
                style: GoogleFonts.sora(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary)),
            const SizedBox(height: 4),
            Text('Chào mừng bạn trở lại 👋',
                style: GoogleFonts.inter(
                    fontSize: 13, color: AppTheme.textSecondary)),
            const SizedBox(height: 28),

            _buildLabel('Số điện thoại / Tên đăng nhập'),
            const SizedBox(height: 8),
            _buildTextField(
              controller: _usernameController,
              hint: 'Nhập số điện thoại hoặc tên đăng nhập',
              prefixIcon: Icons.person_outline_rounded,
              validator: (v) => (v == null || v.trim().isEmpty)
                  ? 'Vui lòng nhập tên đăng nhập'
                  : null,
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
              validator: (v) =>
                  (v == null || v.isEmpty) ? 'Vui lòng nhập mật khẩu' : null,
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
                    Text('Ghi nhớ',
                        style: GoogleFonts.inter(
                            fontSize: 13, color: AppTheme.textSecondary)),
                  ]),
                ),
                GestureDetector(
                  onTap: () {
                    setState(() {
                      _isForgotPasswordMode = true;
                      _forgotStep = 1;
                      // Pre-fill SĐT nếu đang nhập
                      if (_usernameController.text.trim().isNotEmpty) {
                        _forgotPhoneController.text =
                            _usernameController.text.trim();
                      }
                    });
                  },
                  child: Text('Quên mật khẩu?',
                      style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primary)),
                ),
              ],
            ),
            const SizedBox(height: 28),

            // Nút đăng nhập chính
            _buildGradientButton(
              onTap: _isLoading ? null : _handleLogin,
              label: 'ĐĂNG NHẬP',
              icon: Icons.login_rounded,
              isLoading: _isLoading,
            ),
            const SizedBox(height: 16),

            // Nút đăng nhập bằng SMS OTP
            SizedBox(
              width: double.infinity,
              height: 50,
              child: OutlinedButton.icon(
                onPressed: _isLoading
                    ? null
                    : () {
                        setState(() {
                          _isForgotPasswordMode = true;
                          _forgotStep = 1;
                          if (_usernameController.text.trim().isNotEmpty) {
                            _forgotPhoneController.text =
                                _usernameController.text.trim();
                          }
                        });
                      },
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppTheme.primary, width: 1.5),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
                icon: const Icon(Icons.sms_outlined,
                    color: AppTheme.primary, size: 20),
                label: Text('Đăng nhập bằng SMS OTP',
                    style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.primary)),
              ),
            ),
            const SizedBox(height: 16),

            // Nút Sinh trắc học (chỉ hiển thị khi có)
            if (_showBiometricButton) ...[
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: _isLoading ? null : _handleBiometricLogin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F172A),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  icon: const Icon(Icons.fingerprint_rounded, size: 22),
                  label: Text('Đăng nhập bằng Face ID / Vân tay',
                      style: GoogleFonts.inter(
                          fontSize: 13.5, fontWeight: FontWeight.w600)),
                ),
              ),
              const SizedBox(height: 16),
            ],

            Row(children: [
              const Expanded(child: Divider(color: Color(0xFFE8F0F4))),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text('hoặc',
                    style: GoogleFonts.inter(
                        fontSize: 12, color: AppTheme.textSecondary)),
              ),
              const Expanded(child: Divider(color: Color(0xFFE8F0F4))),
            ]),
            const SizedBox(height: 16),

            SizedBox(
              width: double.infinity,
              height: 50,
              child: OutlinedButton(
                onPressed: () => Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const RegisterView())),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(
                      color: AppTheme.borderSubtle, width: 1.5),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.person_add_outlined,
                        color: AppTheme.primary, size: 20),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text('Tạo tài khoản bệnh nhân mới',
                          style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.primary),
                          overflow: TextOverflow.ellipsis),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Card Quên Mật khẩu (3 bước) ──────────────────────────────────
  Widget _buildForgotPasswordCard() {
    return Container(
      key: const ValueKey('forgot'),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header với nút Back
          Row(children: [
            GestureDetector(
              onTap: () => setState(() {
                _isForgotPasswordMode = false;
                _forgotStep = 1;
                _countdownTimer?.cancel();
                for (var c in _otpControllers) c.clear();
                _newPasswordController.clear();
                _confirmNewPasswordController.clear();
              }),
              child: Container(
                width: 36, height: 36,
                decoration: BoxDecoration(
                  color: const Color(0xFFE0F2FE),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.arrow_back_ios_rounded,
                    color: Color(0xFF0284c7), size: 18),
              ),
            ),
            const SizedBox(width: 12),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(
                _forgotStep == 1
                    ? 'Quên mật khẩu'
                    : _forgotStep == 2
                        ? 'Nhập mã xác thực'
                        : 'Đặt mật khẩu mới',
                style: GoogleFonts.sora(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0f172a)),
              ),
              Text(
                'Bước $_forgotStep / 3',
                style: GoogleFonts.inter(
                    fontSize: 12, color: const Color(0xFF64748b)),
              ),
            ]),
          ]),
          const SizedBox(height: 8),

          // Progress indicator
          Row(
            children: List.generate(3, (i) => Expanded(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 3, vertical: 12),
                height: 4,
                decoration: BoxDecoration(
                  color: (i + 1) <= _forgotStep
                      ? const Color(0xFF0284c7)
                      : const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            )),
          ),

          // ── Bước 1: Nhập SĐT ──
          if (_forgotStep == 1) ...[
            Text('Nhập số điện thoại đã đăng ký',
                style: GoogleFonts.inter(
                    fontSize: 13.5, color: const Color(0xFF334155))),
            const SizedBox(height: 16),
            _buildLabel('Số điện thoại'),
            const SizedBox(height: 8),
            TextFormField(
              controller: _forgotPhoneController,
              keyboardType: TextInputType.phone,
              style: GoogleFonts.inter(
                  fontSize: 15, color: const Color(0xFF0f172a)),
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              decoration: _inputDecoration(
                  hint: '09xxxxxxxx',
                  prefixIcon: Icons.phone_outlined),
            ),
            const SizedBox(height: 24),
            _buildGradientButton(
              onTap: _isLoading ? null : _handleForgotSendOtp,
              label: 'GỬI MÃ OTP',
              icon: Icons.send_rounded,
              isLoading: _isLoading,
            ),
          ],

          // ── Bước 2: Nhập OTP ──
          if (_forgotStep == 2) ...[
            RichText(
              text: TextSpan(
                style: GoogleFonts.inter(
                    fontSize: 13.5, color: const Color(0xFF334155), height: 1.5),
                children: [
                  const TextSpan(text: 'Nhập mã OTP 6 chữ số đã gửi đến '),
                  TextSpan(
                    text: _forgotPhoneController.text,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, color: Color(0xFF0284c7)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            // Demo OTP hint
            if (_forgotDemoOtp != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFFED7AA)),
                ),
                child: Row(children: [
                  const Icon(Icons.lightbulb_outline_rounded,
                      color: Color(0xFFF97316), size: 16),
                  const SizedBox(width: 8),
                  Text('Demo OTP: $_forgotDemoOtp',
                      style: GoogleFonts.inter(
                          fontSize: 13,
                          color: const Color(0xFF9a3412),
                          fontWeight: FontWeight.w600)),
                ]),
              ),
            const SizedBox(height: 16),
            _buildOtpBoxes(),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _secondsRemaining > 0
                      ? 'Gửi lại sau $_secondsRemaining giây'
                      : '',
                  style: GoogleFonts.inter(
                      fontSize: 13, color: const Color(0xFF64748b)),
                ),
                if (_secondsRemaining == 0)
                  GestureDetector(
                    onTap: _handleForgotSendOtp,
                    child: Text('Gửi lại OTP',
                        style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF0284c7))),
                  ),
              ],
            ),
            const SizedBox(height: 24),
            _buildGradientButton(
              onTap: _isLoading ? null : _handleForgotVerifyOtp,
              label: 'XÁC NHẬN OTP',
              icon: Icons.verified_outlined,
              isLoading: _isLoading,
            ),
          ],

          // ── Bước 3: Đặt mật khẩu mới ──
          if (_forgotStep == 3) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF86EFAC)),
              ),
              child: Row(children: [
                const Icon(Icons.check_circle_rounded,
                    color: Color(0xFF16A34A), size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text('Xác thực thành công! Hãy đặt mật khẩu mới.',
                      style: GoogleFonts.inter(
                          fontSize: 13, color: const Color(0xFF15803D))),
                ),
              ]),
            ),
            const SizedBox(height: 20),
            _buildLabel('Mật khẩu mới'),
            const SizedBox(height: 8),
            TextFormField(
              controller: _newPasswordController,
              obscureText: _obscureNewPassword,
              style: GoogleFonts.inter(
                  fontSize: 15, color: const Color(0xFF0f172a)),
              decoration: _inputDecoration(
                hint: 'Tối thiểu 8 ký tự, chữ hoa, số, ký tự đặc biệt',
                prefixIcon: Icons.lock_outline_rounded,
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscureNewPassword
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined,
                    color: const Color(0xFF64748b), size: 20,
                  ),
                  onPressed: () => setState(
                      () => _obscureNewPassword = !_obscureNewPassword),
                ),
              ),
            ),
            const SizedBox(height: 14),
            _buildLabel('Xác nhận mật khẩu mới'),
            const SizedBox(height: 8),
            TextFormField(
              controller: _confirmNewPasswordController,
              obscureText: _obscureConfirmNewPassword,
              style: GoogleFonts.inter(
                  fontSize: 15, color: const Color(0xFF0f172a)),
              decoration: _inputDecoration(
                hint: 'Nhập lại mật khẩu mới',
                prefixIcon: Icons.lock_outline_rounded,
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscureConfirmNewPassword
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined,
                    color: const Color(0xFF64748b), size: 20,
                  ),
                  onPressed: () => setState(() =>
                      _obscureConfirmNewPassword = !_obscureConfirmNewPassword),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Yêu cầu: ≥8 ký tự · Chữ hoa · Chữ thường · Số · Ký tự đặc biệt (@\$!%*?&)',
              style: GoogleFonts.inter(
                  fontSize: 11.5,
                  color: const Color(0xFF94a3b8),
                  height: 1.5),
            ),
            const SizedBox(height: 24),
            _buildGradientButton(
              onTap: _isLoading ? null : _handleForgotResetPassword,
              label: 'ĐẶT LẠI MẬT KHẨU',
              icon: Icons.lock_reset_rounded,
              isLoading: _isLoading,
            ),
          ],
        ],
      ),
    );
  }

  // ── Ô nhập OTP ────────────────────────────────────────────────────
  Widget _buildOtpBoxes() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(6, (i) => Container(
        width: 46,
        height: 54,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        child: TextFormField(
          controller: _otpControllers[i],
          focusNode: _otpFocusNodes[i],
          keyboardType: TextInputType.number,
          textAlign: TextAlign.center,
          maxLength: 1,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          style: GoogleFonts.inter(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF0f172a)),
          decoration: InputDecoration(
            counterText: '',
            filled: true,
            fillColor: const Color(0xFFF0F9FF),
            contentPadding: EdgeInsets.zero,
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide:
                    const BorderSide(color: Color(0xFFBAE6FD))),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide:
                    const BorderSide(color: Color(0xFFBAE6FD))),
            focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(
                    color: Color(0xFF0284c7), width: 2)),
          ),
          onChanged: (v) {
            if (v.isNotEmpty && i < 5) {
              _otpFocusNodes[i + 1].requestFocus();
            } else if (v.isEmpty && i > 0) {
              _otpFocusNodes[i - 1].requestFocus();
            }
          },
        ),
      )),
    );
  }

  // ── Shared UI helpers ─────────────────────────────────────────────
  Widget _buildGradientButton({
    required VoidCallback? onTap,
    required String label,
    required IconData icon,
    bool isLoading = false,
  }) {
    return Container(
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
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ElevatedButton.icon(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16)),
        ),
        icon: isLoading
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                    color: Colors.white, strokeWidth: 2.5))
            : Icon(icon, color: Colors.white, size: 20),
        label: isLoading
            ? const SizedBox.shrink()
            : Text(label,
                style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Colors.white)),
      ),
    );
  }

  Widget _circle(double size, Color color) => Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle));

  Widget _buildLabel(String text) => Text(text,
      style: GoogleFonts.inter(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: AppTheme.textSecondary));

  InputDecoration _inputDecoration({
    required String hint,
    required IconData prefixIcon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      hintText: hint,
      hintStyle:
          GoogleFonts.inter(fontSize: 14, color: const Color(0xFFB0C4CE)),
      prefixIcon: Icon(prefixIcon, color: AppTheme.textSecondary, size: 20),
      suffixIcon: suffixIcon,
      filled: true,
      fillColor: AppTheme.background,
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide:
              const BorderSide(color: AppTheme.borderSubtle)),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide:
              const BorderSide(color: AppTheme.borderSubtle)),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide:
              const BorderSide(color: AppTheme.primary, width: 1.8)),
      errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide:
              const BorderSide(color: Color(0xFFDC2626))),
      focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide:
              const BorderSide(color: Color(0xFFDC2626), width: 1.8)),
    );
  }

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
      style:
          GoogleFonts.inter(fontSize: 15, color: AppTheme.textPrimary),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle:
            GoogleFonts.inter(fontSize: 14, color: const Color(0xFFB0C4CE)),
        prefixIcon:
            Icon(prefixIcon, color: AppTheme.textSecondary, size: 20),
        suffixIcon: isPassword
            ? IconButton(
                icon: Icon(
                    obscureText
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined,
                    color: AppTheme.textSecondary,
                    size: 20),
                onPressed: onToggleVisibility)
            : null,
        filled: true,
        fillColor: AppTheme.background,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide:
                const BorderSide(color: AppTheme.borderSubtle)),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide:
                const BorderSide(color: AppTheme.borderSubtle)),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide:
                const BorderSide(color: AppTheme.primary, width: 1.8)),
        errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide:
                const BorderSide(color: Color(0xFFDC2626))),
        focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide:
                const BorderSide(color: Color(0xFFDC2626), width: 1.8)),
      ),
    );
  }
}
