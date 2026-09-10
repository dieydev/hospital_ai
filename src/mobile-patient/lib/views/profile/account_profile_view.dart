import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/settings_provider.dart';
import 'bhyt_info_view.dart';
import 'help_center_view.dart';

class AccountProfileView extends StatelessWidget {
  const AccountProfileView({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final settings = context.watch<SettingsProvider>();
    final user = auth.user;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text('Tài Khoản & Cá Nhân'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: AppTheme.primaryDark,
        centerTitle: true,
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppTheme.premiumGradient,
        ),
        child: SafeArea(
          child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // User Avatar & Info Card
            TweenAnimationBuilder(
              duration: const Duration(milliseconds: 500),
              tween: Tween<double>(begin: 0, end: 1),
              builder: (context, double value, child) {
                return Opacity(
                  opacity: value,
                  child: Transform.scale(scale: 0.95 + (0.05 * value), child: child),
                );
              },
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.borderColor),
                  boxShadow: AppTheme.premiumShadow,
                ),
                child: Row(
                  children: [
                    TweenAnimationBuilder(
                      duration: const Duration(seconds: 2),
                      tween: Tween<double>(begin: 0.95, end: 1.05),
                      builder: (context, double value, child) {
                        return Transform.scale(
                          scale: value,
                          child: child,
                        );
                      },
                      // Add a trick to make it pulse continuously by reversing it, but since it's simple we just scale once or we can skip continuous pulse for simplicity and just do a nice load. 
                      // Let's just do a nice entry animation for the avatar.
                      child: CircleAvatar(
                        radius: 32,
                        backgroundColor: const Color(0xFFE0F2FE),
                        backgroundImage: NetworkImage(user?.avatarUrl ?? 'https://api.dicebear.com/7.x/avataaars/svg?seed=PatientAn'),
                        child: user?.avatarUrl == null ? const Icon(Icons.person, size: 36, color: AppTheme.primaryColor) : null,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.hoTen ?? 'Nguyễn Văn An',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppTheme.textMain),
                          ),
                          const SizedBox(height: 4),
                          Text('SĐT: ${user?.soDienThoai ?? '0987654321'}', style: const TextStyle(fontSize: 13, color: AppTheme.textMuted)),
                          Text('Mã BN: ${user?.maBenhNhan ?? 'BN20260001'}', style: const TextStyle(fontSize: 12, color: AppTheme.primaryColor, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Profile Options Menu (Animated Slide-in)
            TweenAnimationBuilder(
              duration: const Duration(milliseconds: 700),
              tween: Tween<double>(begin: 0, end: 1),
              curve: Curves.easeOutCubic,
              builder: (context, double value, child) {
                return Opacity(
                  opacity: value,
                  child: Transform.translate(
                    offset: Offset(0, 40 * (1 - value)),
                    child: child,
                  ),
                );
              },
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.9), // Glassmorphism-lite
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.borderColor),
                  boxShadow: [
                    BoxShadow(color: AppTheme.primaryColor.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 5))
                  ],
                ),
                child: Column(
                  children: [
                    _buildMenuItem(Icons.badge_outlined, 'Thẻ BHYT / Căn cước công dân', user?.maTheBHYT ?? 'DN40101234567', () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const BhytInfoView()));
                    }),
                    const Divider(height: 1, indent: 56),
                    _buildMenuItem(
                      Icons.fingerprint, 
                      'Bảo mật Sinh trắc học', 
                      settings.biometricsEnabled ? 'Đã bật' : 'Đang tắt', 
                      () => _showBiometricSettings(context, settings)
                    ),
                    const Divider(height: 1, indent: 56),
                    _buildMenuItem(
                      Icons.notifications_outlined, 
                      'Cài đặt Thông báo', 
                      settings.notificationsEnabled ? 'Bật thông báo' : 'Tắt thông báo', 
                      () => _showNotificationSettings(context, settings)
                    ),
                    const Divider(height: 1, indent: 56),
                    _buildMenuItem(
                      Icons.language, 
                      'Ngôn ngữ ứng dụng', 
                      settings.language == 'VI' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English', 
                      () => _showLanguageSettings(context, settings)
                    ),
                    const Divider(height: 1, indent: 56),
                    _buildMenuItem(Icons.help_outline, 'Trung tâm Trợ giúp & Điều khoản', '24/7', () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const HelpCenterView()));
                    }),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Logout Button
            TweenAnimationBuilder(
              duration: const Duration(milliseconds: 900),
              tween: Tween<double>(begin: 0, end: 1),
              curve: Curves.easeOut,
              builder: (context, double value, child) {
                return Opacity(
                  opacity: value,
                  child: child,
                );
              },
              child: SizedBox(
                width: double.infinity,
                height: 50,
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.logout, color: Colors.redAccent),
                  label: const Text('ĐĂNG XUẤT TÀI KHOẢN', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                  style: OutlinedButton.styleFrom(
                    backgroundColor: Colors.white.withOpacity(0.8),
                    side: const BorderSide(color: Colors.redAccent),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: () => auth.logout(),
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

  Widget _buildMenuItem(IconData icon, String title, String subtitle, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.primaryColor),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
      trailing: const Icon(Icons.chevron_right, color: Colors.grey, size: 20),
      onTap: onTap,
    );
  }

  void _showBiometricSettings(BuildContext context, SettingsProvider settings) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setState) {
            return Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Bảo mật Sinh trắc học', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryDark)),
                  const SizedBox(height: 16),
                  const Text('Cho phép sử dụng Vân tay hoặc FaceID để đăng nhập nhanh chóng thay cho mật khẩu.', style: TextStyle(color: Colors.grey, fontSize: 13)),
                  const SizedBox(height: 16),
                  SwitchListTile(
                    title: const Text('Kích hoạt Sinh trắc học', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    activeColor: AppTheme.primaryColor,
                    value: settings.biometricsEnabled,
                    onChanged: (val) {
                      settings.toggleBiometrics(val);
                      setState(() {});
                      Navigator.pop(ctx);
                    },
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showNotificationSettings(BuildContext context, SettingsProvider settings) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setState) {
            return Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Cài đặt Thông báo', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryDark)),
                  const SizedBox(height: 16),
                  const Text('Nhận thông báo nhắc lịch khám, kết quả siêu âm và đơn thuốc mới.', style: TextStyle(color: Colors.grey, fontSize: 13)),
                  const SizedBox(height: 16),
                  SwitchListTile(
                    title: const Text('Bật nhận Thông báo', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    activeColor: AppTheme.primaryColor,
                    value: settings.notificationsEnabled,
                    onChanged: (val) {
                      settings.toggleNotifications(val);
                      setState(() {});
                      Navigator.pop(ctx);
                    },
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showLanguageSettings(BuildContext context, SettingsProvider settings) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Ngôn ngữ ứng dụng', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryDark)),
              const SizedBox(height: 16),
              ListTile(
                title: const Text('🇻🇳 Tiếng Việt'),
                trailing: settings.language == 'VI' ? const Icon(Icons.check, color: AppTheme.primaryColor) : null,
                onTap: () {
                  settings.setLanguage('VI');
                  Navigator.pop(ctx);
                },
              ),
              ListTile(
                title: const Text('🇬🇧 English'),
                trailing: settings.language == 'EN' ? const Icon(Icons.check, color: AppTheme.primaryColor) : null,
                onTap: () {
                  settings.setLanguage('EN');
                  Navigator.pop(ctx);
                },
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }
}
