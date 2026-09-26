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

  int _step = 1; // 1: Nhập SĐT, 2: Nhập OTP
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
    _fadeController = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
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

      // Focus ô đầu tiên
      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted && _otpFocusNodes[0].canRequestFocus) {
          _otpFocusNodes[0].requestFocus();
        }
      });

      _showToast(res['message'] ?? 'Đã gửi mã OTP đến số điện thoại');
    } catch (e) {
      if (!mounted) return;
      _showToast(e.toString().replaceAll('Exception: ', ''), isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleVerifyOtp() async {
    final phone = _phoneController.text.trim().replaceAll(' ', '');
    final otp = _otpControllers.map((c) => c.text).join().trim();

    if (otp.length != 6) {
      _showToast('Vui lòng nhập đủ 6 chữ số mã OTP', isError: true);
      return;
    }

    setState(() => _isLoading = true);
    try {
      await context.read<AuthProvider>().registerWithPhoneOtp(phone, otp);
      if (!mounted) return;

      _showToast('Xác thực số điện thoại thành công! Vui lòng hoàn thiện hồ sơ.');

      // BẮT BUỘC: Điều hướng ngay sang màn hình Hoàn thiện hồ sơ bệnh nhân
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
                // Top bar: Back to Login
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    InkWell(
                      onTap: () {
                        if (_step == 2) {
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
                const SizedBox(height: 28),

                // Medical Logo & Header
                Center(
                  child: Column(
                    children: [
                      Container(
                        width: 76,
                        height: 76,
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
                      const SizedBox(height: 16),
                      Text(
                        _step == 1 ? 'Đăng ký Bệnh nhân' : 'Xác thực OTP',
                        style: GoogleFonts.sora(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _step == 1
                            ? 'Chỉ cần nhập số điện thoại để nhận mã kích hoạt nhanh chóng'
                            : 'Nhập mã 6 chữ số gửi đến số ${_phoneController.text.trim()}',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 13.5,
                          color: const Color(0xFF64748B),
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 32),

                // Card container
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: const Color(0xFFBAE6FD), width: 1.2),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primary.withValues(alpha: 0.08),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: _step == 1 ? _buildStep1Phone() : _buildStep2Otp(),
                ),

                const SizedBox(height: 28),

                // Medical trust features
                _buildTrustIndicators(),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStep1Phone() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Số điện thoại di động',
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF334155),
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          inputFormatters: [
            FilteringTextInputFormatter.digitsOnly,
            LengthLimitingTextInputFormatter(10),
          ],
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.2,
            color: const Color(0xFF0F172A),
          ),
          decoration: InputDecoration(
            hintText: '0987654321',
            hintStyle: GoogleFonts.inter(
              fontSize: 15,
              letterSpacing: 1,
              color: const Color(0xFF94A3B8),
            ),
            prefixIcon: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.phone_iphone_rounded, color: AppTheme.primary, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    '+84',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF475569),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(height: 20, width: 1, color: const Color(0xFFCBD5E1)),
                ],
              ),
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
              borderSide: const BorderSide(color: AppTheme.primary, width: 1.6),
            ),
          ),
        ),
        const SizedBox(height: 18),

        // Terms check
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 24,
              width: 24,
              child: Checkbox(
                value: _agreeTerms,
                onChanged: (v) => setState(() => _agreeTerms = v ?? true),
                activeColor: AppTheme.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
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
        const SizedBox(height: 24),

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
              Row(
                children: [
                  const Icon(Icons.send_to_mobile_rounded, color: AppTheme.primary, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    _phoneController.text.trim(),
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF0369A1),
                    ),
                  ),
                ],
              ),
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

        const SizedBox(height: 24),

        // 6 OTP Digit Boxes
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(6, (index) {
            return SizedBox(
              width: 44,
              height: 52,
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
                    // Tự động kiểm tra nếu đã đủ 6 số
                    final fullCode = _otpControllers.map((c) => c.text).join();
                    if (fullCode.length == 6) {
                      _handleVerifyOtp();
                    }
                  }
                },
              ),
            );
          }),
        ),

        const SizedBox(height: 20),

        // Countdown & Resend
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (_secondsRemaining > 0)
              Text(
                'Gửi lại mã sau: ${_secondsRemaining}s',
                style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
              )
            else
              TextButton(
                onPressed: _isLoading ? null : _handleSendOtp,
                child: Text(
                  'Gửi lại mã OTP',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primary,
                  ),
                ),
              ),
          ],
        ),

        // Demo test OTP helper
        if (_demoOtp != null)
          Container(
            margin: const EdgeInsets.only(top: 8, bottom: 12),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF3C7),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFFCD34D)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.developer_mode_rounded, size: 16, color: Color(0xFFB45309)),
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
                  },
                  child: Text(
                    'Tự điền',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryDark,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
              ],
            ),
          ),

        const SizedBox(height: 12),

        // Submit Button
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
                    'XÁC THỰC & TIẾP TỤC',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildTrustIndicators() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              const Icon(Icons.health_and_safety_rounded, color: AppTheme.accentMint, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Hồ sơ bệnh án điện tử đồng bộ trực tiếp với CSDL Bệnh viện D-Medical',
                  style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF475569)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.lock_rounded, color: AppTheme.primary, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Bảo mật thông tin người bệnh theo tiêu chuẩn Y tế Quốc gia',
                  style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF475569)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
