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
  final _phoneOtpController = TextEditingController(text: '0987654321');
  final _otpCodeController = TextEditingController(text: '888888');

  int _loginMethodTab = 0; // 0: Mật khẩu, 1: Mã OTP SĐT
  bool _otpSent = false;
  bool _obscurePassword = true;
  bool _agreeTerms = true;
  bool _isLoading = false;
  String _selectedLang = 'VI';

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _phoneOtpController.dispose();
    _otpCodeController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_agreeTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chấp nhận Điều khoản & Bảo mật Y tế để tiếp tục!'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    await Future.delayed(const Duration(milliseconds: 900));

    if (!mounted) return;

    final username = _usernameController.text.trim();
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

  void _handleBiometricLogin() async {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Column(
          children: [
            Icon(Icons.fingerprint_rounded, size: 64, color: AppTheme.primaryColor),
            SizedBox(height: 12),
            Text('Xác thực Sinh Trắc Học', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        content: const Text(
          'Đang quét Vân tay / Face ID trên thiết bị di động của bạn để đăng nhập nhanh...',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
            onPressed: () {
              Navigator.pop(ctx);
              final bioPatient = PatientModel(
                id: 'P_BIO_2026',
                maBenhNhan: 'BN20260777',
                hoTen: 'Nguyễn Văn An (Fingerprint/FaceID)',
                gioiTinh: 'Nam',
                ngaySinh: '15/05/1990',
                soCCCD: '012345678901',
                maTheBHYT: 'DN4010123456789',
              );
              context.read<AuthProvider>().login('biometric_token_2026', bioPatient);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('⚡ Đăng nhập Vân tay / Face ID thành công!'), backgroundColor: AppTheme.primaryColor),
              );
            },
            child: const Text('Mô phỏng Chạm Vân tay', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _handleQrCodeScan() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.qr_code_scanner, color: AppTheme.primaryColor, size: 28),
            SizedBox(width: 10),
            Text('Quét mã QR Thẻ Y tế'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              height: 180,
              width: 180,
              decoration: BoxDecoration(
                color: Colors.black12,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.primaryColor, width: 2),
              ),
              child: const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.qr_code_2, size: 80, color: AppTheme.primaryColor),
                  SizedBox(height: 8),
                  Text('Đưa mã QR BHYT / CCCD vào khung', style: TextStyle(fontSize: 11, color: Colors.grey), textAlign: TextAlign.center),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Đóng')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
            onPressed: () {
              Navigator.pop(ctx);
              final qrPatient = PatientModel(
                id: 'P_QR_2026',
                maBenhNhan: 'BN20260999',
                hoTen: 'Nguyễn Văn An (Quét QR BHYT)',
                gioiTinh: 'Nam',
                ngaySinh: '15/05/1990',
                soCCCD: '012345678901',
                maTheBHYT: 'DN4010123456789',
              );
              context.read<AuthProvider>().login('qr_token_2026', qrPatient);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('📷 Nhận diện Thẻ BHYT thành công! Đã đăng nhập.'), backgroundColor: AppTheme.primaryColor),
              );
            },
            child: const Text('Giả lập Quét QR', style: TextStyle(color: Colors.white)),
          ),
        ],
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
                  // Top Bar: Language & Biometric Shortcut
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Language Switcher
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFBAE6FD)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.language, size: 16, color: AppTheme.primaryColor),
                            const SizedBox(width: 6),
                            DropdownButton<String>(
                              value: _selectedLang,
                              isDense: true,
                              underline: const SizedBox(),
                              items: const [
                                DropdownMenuItem(value: 'VI', child: Text('🇻🇳  Tiếng Việt', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold))),
                                DropdownMenuItem(value: 'EN', child: Text('🇬🇧  English', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold))),
                              ],
                              onChanged: (val) {
                                if (val != null) setState(() => _selectedLang = val);
                              },
                            ),
                          ],
                        ),
                      ),

                      // Biometric / QR Quick Buttons Header Bar
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.fingerprint, color: AppTheme.primaryColor, size: 26),
                            tooltip: 'Đăng nhập Vân tay / FaceID',
                            onPressed: _handleBiometricLogin,
                          ),
                          IconButton(
                            icon: const Icon(Icons.qr_code_scanner, color: AppTheme.primaryDark, size: 24),
                            tooltip: 'Quét thẻ BHYT đăng nhập',
                            onPressed: _handleQrCodeScan,
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // App Branding Header
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primaryColor.withOpacity(0.2),
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
                      color: AppTheme.primaryColor.withOpacity(0.1),
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

                  const SizedBox(height: 20),

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

                          const SizedBox(height: 16),

                          // Login Method Segmented Control (Tabs)
                          Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.all(4),
                            child: Row(
                              children: [
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () => setState(() => _loginMethodTab = 0),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(vertical: 10),
                                      decoration: BoxDecoration(
                                        color: _loginMethodTab == 0 ? Colors.white : Colors.transparent,
                                        borderRadius: BorderRadius.circular(8),
                                        boxShadow: _loginMethodTab == 0
                                            ? [const BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))]
                                            : [],
                                      ),
                                      child: Text(
                                        'Tài khoản & Mật khẩu',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: _loginMethodTab == 0 ? AppTheme.primaryColor : const Color(0xFF64748B),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () => setState(() => _loginMethodTab = 1),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(vertical: 10),
                                      decoration: BoxDecoration(
                                        color: _loginMethodTab == 1 ? Colors.white : Colors.transparent,
                                        borderRadius: BorderRadius.circular(8),
                                        boxShadow: _loginMethodTab == 1
                                            ? [const BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))]
                                            : [],
                                      ),
                                      child: Text(
                                        'Mã OTP Số điện thoại',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: _loginMethodTab == 1 ? AppTheme.primaryColor : const Color(0xFF64748B),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 20),

                          if (_loginMethodTab == 0) ...[
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
                                filled: true,
                                fillColor: const Color(0xFFF8FAFC),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(color: Color(0xFFBAE6FD)),
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
                              ),
                              validator: (val) => val == null || val.isEmpty ? 'Vui lòng nhập mật khẩu' : null,
                            ),
                          ] else ...[
                            // OTP Phone Input
                            const Text(
                              'Số điện thoại đăng ký KCB *',
                              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF334155)),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    controller: _phoneOtpController,
                                    keyboardType: TextInputType.phone,
                                    decoration: InputDecoration(
                                      hintText: '0987654321',
                                      prefixIcon: const Icon(Icons.phone_android, color: AppTheme.primaryColor),
                                      filled: true,
                                      fillColor: const Color(0xFFF8FAFC),
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: const BorderSide(color: Color(0xFFBAE6FD)),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.primaryColor,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
                                  ),
                                  onPressed: () {
                                    setState(() => _otpSent = true);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('📱 Đã gửi mã OTP (888888) tới SĐT của bạn!'), backgroundColor: Colors.green),
                                    );
                                  },
                                  child: Text(_otpSent ? 'Gửi lại' : 'Gửi OTP', style: const TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),

                            const SizedBox(height: 16),

                            // OTP Code Input
                            const Text(
                              'Nhập mã OTP 6 chữ số *',
                              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF334155)),
                            ),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _otpCodeController,
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(
                                hintText: 'Nhập mã 6 số (VD: 888888)',
                                prefixIcon: const Icon(Icons.security, color: AppTheme.primaryColor),
                                filled: true,
                                fillColor: const Color(0xFFF8FAFC),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(color: Color(0xFFBAE6FD)),
                                ),
                              ),
                            ),
                          ],

                          const SizedBox(height: 12),

                          // Remember Me & Terms Acceptance
                          Row(
                            children: [
                              SizedBox(
                                width: 20,
                                height: 20,
                                child: Checkbox(
                                  value: _agreeTerms,
                                  activeColor: AppTheme.primaryColor,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                                  onChanged: (val) => setState(() => _agreeTerms = val ?? false),
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Expanded(
                                child: Text(
                                  'Tôi đồng ý Điều khoản Sử dụng & Bảo mật Dữ liệu Y tế',
                                  style: TextStyle(fontSize: 11, color: Color(0xFF475569)),
                                ),
                              ),
                              GestureDetector(
                                onTap: _showForgotPasswordDialog,
                                child: const Text(
                                  'Quên?',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 20),

                          // Login Submit Button
                          SizedBox(
                            width: double.infinity,
                            height: 52,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryColor,
                                foregroundColor: Colors.white,
                                elevation: 4,
                                shadowColor: AppTheme.primaryColor.withOpacity(0.4),
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
                                          'ĐĂNG NHẬP HỆ THỐNG',
                                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                                        ),
                                        SizedBox(width: 8),
                                        Icon(Icons.arrow_forward_rounded, size: 20),
                                      ],
                                    ),
                            ),
                          ),

                          const SizedBox(height: 16),

                          // Biometrics & QR Quick Action Buttons Row
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  icon: const Icon(Icons.fingerprint, color: AppTheme.primaryColor, size: 20),
                                  label: const Text('Vân tay / FaceID', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF334155))),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    side: const BorderSide(color: Color(0xFFBAE6FD)),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  onPressed: _handleBiometricLogin,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: OutlinedButton.icon(
                                  icon: const Icon(Icons.qr_code_scanner, color: AppTheme.primaryDark, size: 18),
                                  label: const Text('Quét mã BHYT', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF334155))),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    side: const BorderSide(color: Color(0xFFBAE6FD)),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  onPressed: _handleQrCodeScan,
                                ),
                              ),
                            ],
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
                                    Expanded(
                                      child: Text(
                                        'Chọn nhanh tài khoản mẫu thử nghiệm:',
                                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                                      ),
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
