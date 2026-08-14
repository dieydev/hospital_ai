import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../models/patient_model.dart';
import '../../providers/auth_provider.dart';
import 'register_view.dart';

class LoginView extends StatefulWidget {
  const LoginView({super.key});

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController(text: 'patient01');
  final _passwordController = TextEditingController(text: '123456');

  bool _obscurePassword = true;
  bool _rememberMe = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 900)); // Smooth loading feel

    if (!mounted) return;

    final username = _usernameController.text.trim();
    final password = _passwordController.text;
    debugPrint('Authenticating user: $username with password len ${password.length}');

    // Sample default patient model mapping
    final samplePatient = PatientModel(
      id: 'P2026001',
      maBenhNhan: 'BN20260810',
      hoTen: username == 'dr.duy' ? 'BS. CKII. Nguyễn Thanh Duy' : 'Nguyễn Văn An',
      gioiTinh: 'Nam',
      ngaySinh: '15/05/1990',
      soCCCD: '012345678901',
      maTheBHYT: 'DN4010123456789',
    );

    context.read<AuthProvider>().login('sample_jwt_token_${DateTime.now().millisecondsSinceEpoch}', samplePatient);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Đăng nhập thành công! Chào mừng ${samplePatient.hoTen}'),
        backgroundColor: AppTheme.primaryColor,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _handleGoogleLogin() async {
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 800));

    if (!mounted) return;

    final googlePatient = PatientModel(
      id: 'P_GOOGLE_2026',
      maBenhNhan: 'BN20260899',
      hoTen: 'Nguyễn Văn An (Google)',
      gioiTinh: 'Nam',
      ngaySinh: '15/05/1990',
      soCCCD: '012345678901',
      maTheBHYT: 'DN4010123456789',
    );

    context.read<AuthProvider>().login('google_oauth_token_${DateTime.now().millisecondsSinceEpoch}', googlePatient);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Đăng nhập thành công với tài khoản Google!'),
        backgroundColor: AppTheme.primaryColor,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _fillSampleAccount(String username, String password) {
    setState(() {
      _usernameController.text = username;
      _passwordController.text = password;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Đã tự động điền tài khoản mẫu: $username'),
        duration: const Duration(seconds: 1),
        backgroundColor: AppTheme.primaryDark,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showForgotPasswordDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.lock_reset, color: AppTheme.primaryColor),
            SizedBox(width: 8),
            Text('Quên Mật khẩu?'),
          ],
        ),
        content: const Text(
          'Vui lòng nhập Số điện thoại hoặc Mã bệnh nhân BHYT đăng ký tại quầy tiếp nhận để nhận mã xác thực OTP khôi phục mật khẩu.',
          style: TextStyle(fontSize: 14, color: Color(0xFF334155)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Đóng'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
            onPressed: () {
              Navigator.of(ctx).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Mã OTP khôi phục đã gửi tới SĐT đăng ký!'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            child: const Text('Gửi mã OTP', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFE0F2FE), // Sky 100
              Color(0xFFF0F9FF), // Sky 50
              Color(0xFFE2E8F0), // Slate 200
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // App Branding Header
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primaryColor.withValues(alpha: 0.2),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.local_hospital_rounded,
                      size: 54,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'HOSPITAL AI',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A), // Slate 900
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFBAE6FD)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.stars, size: 14, color: AppTheme.primaryColor),
                        SizedBox(width: 4),
                        Text(
                          'Cổng Bệnh nhân & Hồ sơ EMR Thông minh',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.primaryDark,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 28),

                  // Main Login Form Card
                  Container(
                    padding: const EdgeInsets.all(24.0),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: const [
                        BoxShadow(
                          color: Color.fromRGBO(2, 132, 199, 0.12),
                          blurRadius: 30,
                          offset: Offset(0, 10),
                        ),
                      ],
                      border: Border.all(color: const Color(0xFFBAE6FD)),
                    ),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Đăng nhập Hệ thống',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Nhập thông tin tài khoản để theo dõi lịch khám & đơn thuốc',
                            style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                          ),

                          const SizedBox(height: 24),

                          // Username / Phone Input
                          const Text(
                            'Tài khoản / Số điện thoại / Email *',
                            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF334155)),
                          ),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _usernameController,
                            decoration: InputDecoration(
                              hintText: 'Nhập SĐT hoặc tên tài khoản',
                              prefixIcon: const Icon(Icons.person_outline_rounded, color: AppTheme.primaryColor),
                              suffixIcon: _usernameController.text.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(Icons.clear, size: 18, color: Color(0xFF94A3B8)),
                                      onPressed: () => setState(() => _usernameController.clear()),
                                    )
                                  : null,
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: Color(0xFFBAE6FD)),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: Color(0xFFBAE6FD)),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: AppTheme.primaryColor, width: 2),
                              ),
                            ),
                            validator: (val) => val == null || val.trim().isEmpty ? 'Vui lòng nhập tài khoản' : null,
                          ),

                          const SizedBox(height: 16),

                          // Password Input
                          const Text(
                            'Mật khẩu *',
                            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF334155)),
                          ),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            decoration: InputDecoration(
                              hintText: 'Nhập mật khẩu',
                              prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppTheme.primaryColor),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                  color: const Color(0xFF64748B),
                                ),
                                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                              ),
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: Color(0xFFBAE6FD)),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: Color(0xFFBAE6FD)),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: AppTheme.primaryColor, width: 2),
                              ),
                            ),
                            validator: (val) => val == null || val.isEmpty ? 'Vui lòng nhập mật khẩu' : null,
                          ),

                          const SizedBox(height: 12),

                          // Remember Me & Forgot Password Row
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: Checkbox(
                                      value: _rememberMe,
                                      activeColor: AppTheme.primaryColor,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                                      onChanged: (val) => setState(() => _rememberMe = val ?? false),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  const Text(
                                    'Ghi nhớ phiên',
                                    style: TextStyle(fontSize: 13, color: Color(0xFF334155)),
                                  ),
                                ],
                              ),
                              GestureDetector(
                                onTap: _showForgotPasswordDialog,
                                child: const Text(
                                  'Quên mật khẩu?',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.primaryColor,
                                  ),
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 24),

                          // Login Submit Button
                          SizedBox(
                            width: double.infinity,
                            height: 52,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryColor,
                                foregroundColor: Colors.white,
                                elevation: 4,
                                shadowColor: AppTheme.primaryColor.withValues(alpha: 0.4),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                              onPressed: _isLoading ? null : _handleLogin,
                              child: _isLoading
                                  ? const SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                                    )
                                  : const Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          'ĐĂNG NHẬP',
                                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                                        ),
                                        SizedBox(width: 8),
                                        Icon(Icons.arrow_forward_rounded, size: 20),
                                      ],
                                    ),
                            ),
                          ),

                          const SizedBox(height: 16),

                          // Divider
                          const Row(
                            children: [
                              Expanded(child: Divider(color: Color(0xFFCBD5E1))),
                              Padding(
                                padding: EdgeInsets.symmetric(horizontal: 12),
                                child: Text('HOẶC', style: TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
                              ),
                              Expanded(child: Divider(color: Color(0xFFCBD5E1))),
                            ],
                          ),

                          const SizedBox(height: 16),

                          // Google Sign-In Button
                          SizedBox(
                            width: double.infinity,
                            height: 48,
                            child: OutlinedButton.icon(
                              icon: const Icon(Icons.g_mobiledata_rounded, color: Colors.redAccent, size: 28),
                              label: const Text(
                                'Đăng nhập nhanh với Google',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                              ),
                              style: OutlinedButton.styleFrom(
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                side: const BorderSide(color: Color(0xFFBAE6FD)),
                                backgroundColor: const Color(0xFFF8FAFC),
                              ),
                              onPressed: _isLoading ? null : _handleGoogleLogin,
                            ),
                          ),

                          const SizedBox(height: 20),

                          // Quick Sample Credentials Selector
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF0F9FF),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFBAE6FD)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Row(
                                  children: [
                                    Icon(Icons.touch_app_outlined, size: 16, color: AppTheme.primaryDark),
                                    SizedBox(width: 6),
                                    Text(
                                      'Chọn nhanh tài khoản mẫu thử nghiệm:',
                                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 6,
                                  children: [
                                    ActionChip(
                                      avatar: const Icon(Icons.person, size: 14, color: AppTheme.primaryColor),
                                      label: const Text('Bệnh nhân: patient01', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                                      backgroundColor: Colors.white,
                                      side: const BorderSide(color: Color(0xFFBAE6FD)),
                                      onPressed: () => _fillSampleAccount('patient01', '123456'),
                                    ),
                                    ActionChip(
                                      avatar: const Icon(Icons.medication_liquid, size: 14, color: Color(0xFF0EA5E9)),
                                      label: const Text('Bác sĩ: dr.duy', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                                      backgroundColor: Colors.white,
                                      side: const BorderSide(color: Color(0xFFBAE6FD)),
                                      onPressed: () => _fillSampleAccount('dr.duy', '123456'),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Register Redirection
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'Chưa có tài khoản Bệnh nhân? ',
                        style: TextStyle(color: Color(0xFF475569), fontSize: 14),
                      ),
                      GestureDetector(
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (ctx) => const RegisterView()),
                          );
                        },
                        child: const Text(
                          'Đăng ký ngay',
                          style: TextStyle(
                            color: AppTheme.primaryColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Security & Footer Notice
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.shield_outlined, size: 14, color: Color(0xFF64748B)),
                      SizedBox(width: 4),
                      Text(
                        'Dữ liệu Y tế mã hóa & bảo mật chuẩn HIPAA / ISO 27001',
                        style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
