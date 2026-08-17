import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';

class AccountProfileView extends StatelessWidget {
  const AccountProfileView({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Tài Khoản & Cá Nhân'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // User Avatar & Info Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFBAE6FD)),
                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundColor: const Color(0xFFE0F2FE),
                    backgroundImage: NetworkImage(user?.avatarUrl ?? 'https://api.dicebear.com/7.x/avataaars/svg?seed=PatientAn'),
                    child: user?.avatarUrl == null ? const Icon(Icons.person, size: 36, color: AppTheme.primaryColor) : null,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.hoTen ?? 'Nguyễn Văn An',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF0F172A)),
                        ),
                        const SizedBox(height: 4),
                        Text('SĐT: ${user?.soDienThoai ?? '0987654321'}', style: const TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                        Text('Mã BN: ${user?.maBenhNhan ?? 'BN20260001'}', style: const TextStyle(fontSize: 12, color: AppTheme.primaryColor, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Profile Options Menu
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  _buildMenuItem(Icons.badge_outlined, 'Thẻ BHYT / Căn cước công dân', 'DN40101234567', () {}),
                  const Divider(height: 1, indent: 56),
                  _buildMenuItem(Icons.fingerprint, 'Bảo mật Sinh trắc học (Vân tay / FaceID)', 'Đã kích hoạt', () {}),
                  const Divider(height: 1, indent: 56),
                  _buildMenuItem(Icons.notifications_outlined, 'Cài đặt Thông báo khám', 'Bật âm thanh', () {}),
                  const Divider(height: 1, indent: 56),
                  _buildMenuItem(Icons.language, 'Ngôn ngữ ứng dụng', '🇻🇳 Tiếng Việt', () {}),
                  const Divider(height: 1, indent: 56),
                  _buildMenuItem(Icons.help_outline, 'Trung tâm Trợ giúp & Điều khoản', '24/7', () {}),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Logout Button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: OutlinedButton.icon(
                icon: const Icon(Icons.logout, color: Colors.redAccent),
                label: const Text('ĐĂNG XUẤT TÀI KHOẢN', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.redAccent),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: () => auth.logout(),
              ),
            ),
          ],
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
}
