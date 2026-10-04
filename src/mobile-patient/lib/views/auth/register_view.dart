import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../profile/complete_profile_view.dart';
import 'login_view.dart';

class RegisterView extends StatefulWidget {
  const RegisterView({super.key});

  @override
  State<RegisterView> createState() => _RegisterViewState();
}

class _RegisterViewState extends State<RegisterView> with SingleTickerProviderStateMixin {
  final _phoneController = TextEditingController();
  final List<TextEditingController> _otpControllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());

  // Password step controllers
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  int _step = 1; // 1: Nhập SĐT, 2: Nhập OTP, 3: Thiết lập Mật khẩu
  bool _isLoading = false;
  bool _agreeTerms = true;
  String? _demoOtp;

  Timer? _countdownTimer;
  int _secondsRemaining = 60;

  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
  super.initState();
  _fadeController = AnimationController(vsync: this, duration: const Duration(milliseconds: 400));
  _fadeAnimation = CurvedAnimation(parent: _fadeController, curve: Curves.easeOut);
  _fadeController.forward();
}

  @override
  void dispose() {
    _phoneController.dispose();
    for (var c in _otpControllers) {
      c.dispose();
    }
    for (var f in _otpFocusNodes) {
      f.dispose();
    }
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _countdownTimer?.cancel();
    _fadeController.dispose();
    super.dispose();
  }

  void _startTimer() {
    _countdownTimer?.cancel();
    setState(() => _secondsRemaining = 60);
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining > 0) {
        setState(() => _secondsRemaining--);
      } else {
        timer.cancel();
      }
    });
  }

  // ── BƯỚC 1: GỬI OTP ──────────────────────────────────────────────
  Future<void> _handleSendOtp() async {
    final phone = _phoneController.text.trim().replaceAll(' ', '');
    if (phone.isEmpty) {
      _showToast('Vui lòng nhập số điện thoại', isError: true);
      return;
    }
    if (!RegExp(r'^(0|\+84)[3|5|7|8|9][0-9]{8}$').hasMatch(phone)) {
      _showToast('Số điện thoại không đúng định dạng (10 chữ số)', isError: true);
      return;
    }
    if (!_agreeTerms) {
      _showToast('Vui lòng đồng ý với Điều khoản dịch vụ y tế', isError: true);
      return;
    }

    setState(() => _isLoading = true);
    try {
      final res = await context.read<AuthProvider>().sendOtp(phone);
      if (!mounted) return;

      setState(() {
        _step = 2;
        _demoOtp = res['otpCode']?.toString() ?? '123456';
      });
      _startTimer();
      _fadeController.reset();
      _fadeController.forward();

      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted && _otpFocusNodes[0].canRequestFocus) {
          _otpFocusNodes[0].requestFocus();
        }
      });

      _showToast(res['message'] ?? 'Đã gửi mã OTP đến số điện thoại');
    } catch (e) {
      if (!mounted) return;
      final errMsg = e.toString().replaceAll('Exception: ', '');

      // Nếu SĐT đã đăng ký -> Hỏi người dùng có muốn chuyển sang Đăng nhập không
      if (errMsg.contains('đã được đăng ký') || errMsg.contains('Vui lòng đăng nhập')) {
        _showSwitchToLoginDialog(phone, errMsg);
      } else {
        _showToast(errMsg, isError: true);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  /// Hiển thị dialog hỏi người dùng chuyển sang luồng Đăng nhập
  void _showSwitchToLoginDialog(String phone, String message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        contentPadding: const EdgeInsets.fromLTRB(24, 20, 24, 8),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: const Color(0xFFE0F2FE),
                borderRadius: BorderRadius.circular(32),
              ),
              child: const Icon(Icons.person_outline_rounded,
                  color: Color(0xFF0284c7), size: 32),
            ),
            const SizedBox(height: 16),
            const Text(
              'Số điện thoại đã có tài khoản',
              style: TextStyle(
                fontSize: 17, fontWeight: FontWeight.w700,
                color: Color(0xFF0f172a),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),
            Text(
              'SĐT $phone đã được đăng ký trong hệ thống D-Medical.\n\nBạn có muốn chuyển sang trang Đăng nhập không?',
              style: const TextStyle(fontSize: 13.5, color: Color(0xFF64748b), height: 1.5),
              textAlign: TextAlign.center,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Nhập SĐT khác',
                style: TextStyle(color: Color(0xFF64748b))),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              // Chuyển sang LoginView và truyền số điện thoại để tự điền
              Navigator.of(context).pushReplacement(
                PageRouteBuilder(
                  pageBuilder: (_, __, ___) => LoginView(prefillPhone: phone),
                  transitionDuration: const Duration(milliseconds: 400),
                  transitionsBuilder: (_, anim, __, child) =>
                      FadeTransition(opacity: anim, child: child),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0284c7),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Đăng nhập ngay'),
          ),
        ],
      ),
    );
  }

  // ── BƯỚC 2: XÁC THỰC OTP & CHUYỂN SANG TẠO MẬT KHẨU ──────────────
  Future<void> _handleVerifyOtp() async {
    final otp = _otpControllers.map((c) => c.text).join().trim();

    if (otp.length != 6) {
      _showToast('Vui lòng nhập đủ 6 chữ số mã OTP', isError: true);
      return;
    }

    // Kiểm tra OTP hợp lệ (Demo OTP hoặc 123456)
    if (_demoOtp != null && otp != _demoOtp && otp != '123456') {
      _showToast('Mã OTP không chính xác. Vui lòng nhập: $_demoOtp', isError: true);
      return;
    }

    setState(() {
      _step = 3; // Chuyển sang bước 3: Thiết lập mật khẩu
    });
    _fadeController.reset();
    _fadeController.forward();
    _showToast('Xác thực OTP thành công! Vui lòng thiết lập mật khẩu đăng nhập.');
  }

  // ── BƯỚC 3: THIẾT LẬP MẬT KHẨU & HOÀN TẤT ĐĂNG KÝ ───────────────
  Future<void> _handleSetPasswordAndRegister() async {
    final phone = _phoneController.text.trim().replaceAll(' ', '');
    final password = _passwordController.text.trim();
    final confirmPassword = _confirmPasswordController.text.trim();
    final otp = _otpControllers.map((c) => c.text).join().trim();

    if (password.isEmpty) {
      _showToast('Vui lòng nhập mật khẩu mới', isError: true);
      return;
    }
    if (password.length < 8) {
      _showToast('Mật khẩu phải dài tối thiểu 8 ký tự', isError: true);
      return;
    }
    final strongPasswordRegex = RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$');
    if (!strongPasswordRegex.hasMatch(password)) {
      _showToast('Mật khẩu cần gồm chữ hoa, thường, số và ký tự đặc biệt (ví dụ: MatKhau123@)', isError: true);
      return;
    }
    if (password != confirmPassword) {
      _showToast('Mật khẩu xác nhận không trùng khớp', isError: true);
      return;
    }

    setState(() => _isLoading = true);
    try {
      // Đăng ký tài khoản với SĐT và Mật khẩu
      await context.read<AuthProvider>().registerWithPassword(phone, password, otp.isNotEmpty ? otp : '123456');
      if (!mounted) return;

      _showToast('Đăng ký tài khoản thành công!');

      // Điều hướng sang màn hình Hoàn thiện hồ sơ bệnh nhân (CCCD, Ngày sinh, BHYT)
      Navigator.of(context).pushAndRemoveUntil(
        PageRouteBuilder(
          pageBuilder: (_, __, ___) => const CompleteProfileView(isDismissible: false),
          transitionDuration: const Duration(milliseconds: 500),
          transitionsBuilder: (_, anim, __, child) =>
              FadeTransition(opacity: anim, child: child),
        ),
        (route) => false,
      );
    } catch (e) {
      if (!mounted) return;
      _showToast(e.toString().replaceAll('Exception: ', ''), isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showToast(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              isError ? Icons.error_outline_rounded : Icons.check_circle_rounded,
              color: Colors.white,
              size: 20,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
        backgroundColor: isError ? const Color(0xFFDC2626) : AppTheme.accentMint,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F8FA),
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top bar: Back
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    InkWell(
                      onTap: () {
                        if (_step == 3) {
                          setState(() => _step = 2);
                        } else if (_step == 2) {
                          setState(() => _step = 1);
                        } else {
                          Navigator.of(context).pop();
                        }
                      },
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: const Icon(Icons.arrow_back_rounded, color: AppTheme.primaryDark, size: 20),
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.of(context).pushReplacement(
                          MaterialPageRoute(builder: (_) => const LoginView()),
                        );
                      },
                      child: Text(
                        'Đã có tài khoản? Đăng nhập',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Medical Logo & Header
                Center(
                  child: Column(
                    children: [
                      Container(
                        width: 72,
                        height: 72,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.primary.withValues(alpha: 0.15),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                          border: Border.all(color: const Color(0xFFBAE6FD), width: 1.5),
                        ),
                        child: Image.asset(
                          'assets/images/logo_icon.png',
                          fit: BoxFit.contain,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        _step == 1
                            ? 'Đăng ký Bệnh nhân'
                            : _step == 2
                                ? 'Xác thực OTP'
                                : 'Thiết lập Mật khẩu',
                        style: GoogleFonts.sora(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _step == 1
                            ? 'Bệnh viện Đa khoa Quốc tế D-Medical'
                            : _step == 2
                                ? 'Mã xác thực đã được gửi đến số điện thoại của bạn'
                                : 'Tạo mật khẩu để đăng nhập vào ứng dụng những lần sau',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // 3-Step Progress Indicator
                _buildStepProgressBar(),
                const SizedBox(height: 24),

                // Main Form Card
                Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFBAE6FD)),
                    boxShadow: const [
                      BoxShadow(
                        color: Color.fromRGBO(2, 132, 199, 0.08),
                        blurRadius: 24,
                        offset: Offset(0, 8),
                      ),
                    ],
                  ),
                  child: _step == 1
                      ? _buildStep1Phone()
                      : _step == 2
                          ? _buildStep2Otp()
                          : _buildStep3Password(),
                ),

                const SizedBox(height: 24),

                // Security & Privacy Badge
                Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.verified_user_rounded, color: AppTheme.accentMint, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        'Bảo mật dữ liệu y tế theo Nghị định 13/2023/NĐ-CP',
                        style: GoogleFonts.inter(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── Step Progress Bar ──────────────────────────────────────────────
  Widget _buildStepProgressBar() {
    return Row(
      children: [
        _buildStepIndicator(1, 'Số ĐT', _step >= 1),
        _buildStepLine(_step >= 2),
        _buildStepIndicator(2, 'Mã OTP', _step >= 2),
        _buildStepLine(_step >= 3),
        _buildStepIndicator(3, 'Mật khẩu', _step >= 3),
      ],
    );
  }

  Widget _buildStepIndicator(int stepNumber, String label, bool isActive) {
    return Column(
      children: [
        Container(
          width: 30,
          height: 30,
          decoration: BoxDecoration(
            color: isActive ? AppTheme.primary : const Color(0xFFE2E8F0),
            shape: BoxShape.circle,
            boxShadow: isActive
                ? [
                    BoxShadow(
                      color: AppTheme.primary.withValues(alpha: 0.35),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    )
                  ]
                : null,
          ),
          alignment: Alignment.center,
          child: Text(
            '$stepNumber',
            style: GoogleFonts.sora(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: isActive ? Colors.white : const Color(0xFF64748B),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
            color: isActive ? AppTheme.primaryDark : const Color(0xFF94A3B8),
          ),
        ),
      ],
    );
  }

  Widget _buildStepLine(bool isActive) {
    return Expanded(
      child: Container(
        height: 2.5,
        margin: const EdgeInsets.only(bottom: 16, left: 6, right: 6),
        decoration: BoxDecoration(
          color: isActive ? AppTheme.primary : const Color(0xFFE2E8F0),
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    );
  }

  // ── Step 1: Nhập Số điện thoại ────────────────────────────────────
  Widget _buildStep1Phone() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Số điện thoại',
          style: GoogleFonts.inter(
            fontSize: 13.5,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF334155),
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          style: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF0F172A),
          ),
          inputFormatters: [
            FilteringTextInputFormatter.digitsOnly,
            LengthLimitingTextInputFormatter(10),
          ],
          decoration: InputDecoration(
            hintText: 'Nhập số điện thoại (ví dụ: 0912345678)',
            hintStyle: GoogleFonts.inter(fontSize: 13.5, color: const Color(0xFF94A3B8)),
            prefixIcon: const Icon(Icons.phone_iphone_rounded, color: AppTheme.primary, size: 20),
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppTheme.primary, width: 1.8),
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Checkbox terms
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 24,
              height: 24,
              child: Checkbox(
                value: _agreeTerms,
                onChanged: (val) => setState(() => _agreeTerms = val ?? true),
                activeColor: AppTheme.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Tôi đồng ý nhận mã OTP và tuân thủ Điều khoản sử dụng & Quy định y tế của Bệnh viện D-Medical.',
                style: GoogleFonts.inter(
                  fontSize: 12.5,
                  color: const Color(0xFF475569),
                  height: 1.35,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 22),

        // Submit Button
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _handleSendOtp,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              elevation: 3,
              shadowColor: AppTheme.primary.withValues(alpha: 0.35),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2.2, color: Colors.white),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'NHẬN MÃ OTP',
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(Icons.arrow_forward_rounded, size: 18),
                    ],
                  ),
          ),
        ),
      ],
    );
  }

  // ── Step 2: Nhập Mã OTP ───────────────────────────────────────────
  Widget _buildStep2Otp() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Phone info bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: const Color(0xFFF0F9FF),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFBAE6FD)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    const Icon(Icons.send_to_mobile_rounded, color: AppTheme.primary, size: 18),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        _phoneController.text.trim(),
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF0369A1),
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              InkWell(
                onTap: () => setState(() => _step = 1),
                child: Text(
                  'Thay đổi SĐT',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.primary,
                    decoration: TextDecoration.underline,
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // 6 OTP Digit Boxes
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(6, (index) {
            return Expanded(
              child: Container(
                height: 52,
                margin: const EdgeInsets.symmetric(horizontal: 3),
                child: TextFormField(
                  controller: _otpControllers[index],
                  focusNode: _otpFocusNodes[index],
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.sora(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryDark,
                  ),
                  inputFormatters: [
                    LengthLimitingTextInputFormatter(1),
                    FilteringTextInputFormatter.digitsOnly,
                  ],
                  decoration: InputDecoration(
                    counterText: '',
                    contentPadding: EdgeInsets.zero,
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppTheme.primary, width: 2),
                    ),
                  ),
                  onChanged: (value) {
                    if (value.isNotEmpty && index < 5) {
                      _otpFocusNodes[index + 1].requestFocus();
                    } else if (value.isEmpty && index > 0) {
                      _otpFocusNodes[index - 1].requestFocus();
                    }
                    if (index == 5 && value.isNotEmpty) {
                      final fullCode = _otpControllers.map((c) => c.text).join();
                      if (fullCode.length == 6) {
                        _handleVerifyOtp();
                      }
                    }
                  },
                ),
              ),
            );
          }),
        ),

        const SizedBox(height: 16),

        // Demo OTP Helper
        if (_demoOtp != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF3C7),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFFDE68A)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.info_outline_rounded, color: Color(0xFFD97706), size: 16),
                const SizedBox(width: 6),
                Text(
                  'Mã OTP thử nghiệm: $_demoOtp',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFFB45309),
                  ),
                ),
                const SizedBox(width: 8),
                InkWell(
                  onTap: () {
                    for (int i = 0; i < 6 && i < _demoOtp!.length; i++) {
                      _otpControllers[i].text = _demoOtp![i];
                    }
                    _handleVerifyOtp();
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD97706),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      'Tự điền',
                      style: GoogleFonts.inter(fontSize: 11, color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),

        const SizedBox(height: 20),

        // Countdown & Resend
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              _secondsRemaining > 0 ? 'Gửi lại mã sau: ' : 'Chưa nhận được mã? ',
              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
            ),
            if (_secondsRemaining > 0)
              Text(
                '${_secondsRemaining}s',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primary,
                ),
              )
            else
              InkWell(
                onTap: _handleSendOtp,
                child: Text(
                  'Gửi lại ngay',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primary,
                    decoration: TextDecoration.underline,
                  ),
                ),
              ),
          ],
        ),

        const SizedBox(height: 22),

        // Verify Button
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _handleVerifyOtp,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              elevation: 3,
              shadowColor: AppTheme.primary.withValues(alpha: 0.35),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2.2, color: Colors.white),
                  )
                : Text(
                    'TIẾP TỤC ĐẶT MẬT KHẨU',
                    style: GoogleFonts.inter(
                      fontSize: 14.5,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
                  ),
          ),
        ),
      ],
    );
  }

  // ── Step 3: Thiết lập Mật khẩu ────────────────────────────────────
  Widget _buildStep3Password() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // SĐT đã xác thực
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          margin: const EdgeInsets.only(bottom: 18),
          decoration: BoxDecoration(
            color: const Color(0xFFECFDF5),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFA7F3D0)),
          ),
          child: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Số điện thoại đã xác thực thành công',
                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF047857), fontWeight: FontWeight.w500),
                    ),
                    Text(
                      _phoneController.text.trim(),
                      style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF065F46)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        // Mật khẩu mới
        Text(
          'Mật khẩu mới',
          style: GoogleFonts.inter(
            fontSize: 13.5,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF334155),
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: _passwordController,
          obscureText: _obscurePassword,
          style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A)),
          decoration: InputDecoration(
            hintText: 'Tối thiểu 8 ký tự (ví dụ: MatKhau123@)',
            hintStyle: GoogleFonts.inter(fontSize: 13.5, color: const Color(0xFF94A3B8)),
            prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppTheme.primary, size: 20),
            suffixIcon: IconButton(
              icon: Icon(
                _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                color: const Color(0xFF64748B),
                size: 20,
              ),
              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
            ),
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppTheme.primary, width: 1.8),
            ),
          ),
        ),

        const SizedBox(height: 16),

        // Xác nhận mật khẩu
        Text(
          'Xác nhận lại mật khẩu',
          style: GoogleFonts.inter(
            fontSize: 13.5,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF334155),
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: _confirmPasswordController,
          obscureText: _obscureConfirmPassword,
          style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A)),
          decoration: InputDecoration(
            hintText: 'Nhập lại mật khẩu trên',
            hintStyle: GoogleFonts.inter(fontSize: 13.5, color: const Color(0xFF94A3B8)),
            prefixIcon: const Icon(Icons.lock_reset_rounded, color: AppTheme.primary, size: 20),
            suffixIcon: IconButton(
              icon: Icon(
                _obscureConfirmPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                color: const Color(0xFF64748B),
                size: 20,
              ),
              onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
            ),
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppTheme.primary, width: 1.8),
            ),
          ),
        ),

        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFEFF6FF),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFFBFDBFE)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.info_outline_rounded, color: AppTheme.primary, size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Yêu cầu mật khẩu y tế: Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (ví dụ: MatKhau123@).',
                  style: GoogleFonts.inter(fontSize: 11.5, color: const Color(0xFF1E40AF), height: 1.35),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // Complete Registration Button
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _handleSetPasswordAndRegister,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              elevation: 3,
              shadowColor: AppTheme.primary.withValues(alpha: 0.35),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2.2, color: Colors.white),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.check_circle_rounded, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'HOÀN TẤT ĐĂNG KÝ',
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
      ],
    );
  }
}
