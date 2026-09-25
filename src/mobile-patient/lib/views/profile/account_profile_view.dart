import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/settings_provider.dart';
import 'bhyt_info_view.dart';
import 'help_center_view.dart';
import 'edit_profile_view.dart';

class AccountProfileView extends StatelessWidget {
  const AccountProfileView({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final settings = context.watch<SettingsProvider>();
    final user = auth.user;

    final String avatarUrl = (user?.avatarUrl != null && user!.avatarUrl!.isNotEmpty)
        ? user.avatarUrl!
        : 'https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.hoTen ?? "patient"}';

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SingleChildScrollView(
        child: Column(
          children: [
            // ── Gradient Header ──────────────────────────────────
            Stack(
              clipBehavior: Clip.none,
              alignment: Alignment.bottomCenter,
              children: [
                Container(
                  height: 200,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppTheme.primaryDeep, AppTheme.primaryDark, AppTheme.primary],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(36),
                      bottomRight: Radius.circular(36),
                    ),
                  ),
                  child: SafeArea(
                    bottom: false,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Hồ sơ Cá nhân', style: GoogleFonts.sora(
                                fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white,
                              )),
                              const SizedBox(height: 4),
                              Text('D-Medical Patient', style: GoogleFonts.inter(
                                fontSize: 12, color: Colors.white.withValues(alpha: 0.7),
                              )),
                            ],
                          ),
                          GestureDetector(
                            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EditProfileView())),
                            child: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                              ),
                              child: const Icon(Icons.edit_rounded, color: Colors.white, size: 20),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // Avatar card overlapping
                Positioned(
                  bottom: -52,
                  child: Column(
                    children: [
                      Container(
                        width: 88,
                        height: 88,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(26),
                          border: Border.all(color: Colors.white, width: 3),
                          boxShadow: [
                            BoxShadow(color: AppTheme.primaryDark.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 8)),
                          ],
                          image: DecorationImage(
                            image: NetworkImage(avatarUrl),
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 68),

            // Name + Code
            Text(
              user?.hoTen ?? 'Chưa cập nhật',
              style: GoogleFonts.sora(fontSize: 20, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                user?.maBenhNhan != null ? '🏥  ${user!.maBenhNhan}' : 'Chưa có mã bệnh nhân',
                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.primary),
              ),
            ),
            const SizedBox(height: 24),

            // ── Info Card ───────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: Column(
                  children: [
                    _buildInfoTile(Icons.phone_android_outlined, 'Số điện thoại',
                        user?.soDienThoai ?? 'Chưa cập nhật', AppTheme.primary),
                    _buildDivider(),
                    _buildInfoTile(Icons.email_outlined, 'Email',
                        (user?.email?.isNotEmpty ?? false) ? user!.email! : 'Chưa cập nhật', AppTheme.accentMint),
                    _buildDivider(),
                    _buildInfoTile(Icons.cake_outlined, 'Ngày sinh',
                        (user?.ngaySinh?.isNotEmpty ?? false) ? user!.ngaySinh! : 'Chưa cập nhật', AppTheme.primary),
                    _buildDivider(),
                    _buildInfoTile(Icons.wc_rounded, 'Giới tính',
                        user?.gioiTinh ?? 'Nam', AppTheme.accentMint),
                    _buildDivider(),
                    _buildInfoTile(Icons.location_on_outlined, 'Địa chỉ',
                        (user?.diaChi?.isNotEmpty ?? false) ? user!.diaChi! : 'Chưa cập nhật', AppTheme.primary),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // ── Feature Menu ────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(left: 4, bottom: 12),
                    child: Text('Tiện ích & Cài đặt', style: GoogleFonts.sora(
                      fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.textPrimary,
                    )),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppTheme.borderSubtle),
                    ),
                    child: Column(
                      children: [
                        _buildMenuItem(
                          icon: Icons.badge_outlined,
                          title: 'Thẻ BHYT & CCCD',
                          subtitle: user?.maTheBHYT ?? 'Chưa liên kết',
                          color: AppTheme.primary,
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BhytInfoView())),
                        ),
                        _buildDivider(indent: 64),
                        _buildMenuSwitchTile(
                          icon: Icons.fingerprint,
                          title: 'Bảo mật Sinh trắc học',
                          subtitle: settings.biometricsEnabled ? 'Đang bật' : 'Đang tắt',
                          color: AppTheme.accentMint,
                          value: settings.biometricsEnabled,
                          onChanged: (val) => settings.toggleBiometrics(val),
                        ),
                        _buildDivider(indent: 64),
                        _buildMenuSwitchTile(
                          icon: Icons.notifications_outlined,
                          title: 'Thông báo',
                          subtitle: settings.notificationsEnabled ? 'Bật thông báo' : 'Tắt thông báo',
                          color: AppTheme.primary,
                          value: settings.notificationsEnabled,
                          onChanged: (val) => settings.toggleNotifications(val),
                        ),
                        _buildDivider(indent: 64),
                        _buildMenuItem(
                          icon: Icons.language_rounded,
                          title: 'Ngôn ngữ',
                          subtitle: settings.language == 'VI' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English',
                          color: AppTheme.accentMint,
                          onTap: () => _showLanguageSheet(context, settings),
                        ),
                        _buildDivider(indent: 64),
                        _buildMenuItem(
                          icon: Icons.help_outline_rounded,
                          title: 'Trợ giúp & Điều khoản',
                          subtitle: 'Hỗ trợ 24/7',
                          color: AppTheme.primary,
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HelpCenterView())),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // ── Logout ─────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: GestureDetector(
                onTap: () => _showLogoutDialog(context, auth),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFFECACA)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.logout_rounded, color: Color(0xFFDC2626), size: 20),
                      const SizedBox(width: 10),
                      Text('Đăng xuất', style: GoogleFonts.inter(
                        fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFFDC2626),
                      )),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildDivider({double indent = 20}) {
    return Divider(height: 1, indent: indent, color: AppTheme.borderSubtle);
  }

  Widget _buildInfoTile(IconData icon, String label, String value, Color iconColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: iconColor),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary)),
                const SizedBox(height: 2),
                Text(value, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, size: 20, color: color),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
                  Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: AppTheme.textSecondary, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuSwitchTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 20, color: color),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
                Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary)),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: AppTheme.primary,
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, AuthProvider auth) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        backgroundColor: Colors.white,
        title: Row(children: [
          const Icon(Icons.logout_rounded, color: Color(0xFFDC2626), size: 24),
          const SizedBox(width: 10),
          Text('Đăng xuất?', style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
        ]),
        content: Text(
          'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản D-Medical không?',
          style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textSecondary, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Huỷ', style: GoogleFonts.inter(color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              auth.logout();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text('Đăng xuất', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showLanguageSheet(BuildContext context, SettingsProvider settings) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      backgroundColor: Colors.white,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Chọn Ngôn ngữ', style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryDark)),
            const SizedBox(height: 16),
            _langTile(ctx, settings, 'VI', '🇻🇳 Tiếng Việt'),
            const Divider(height: 1, color: AppTheme.borderSubtle),
            _langTile(ctx, settings, 'EN', '🇬🇧 English'),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _langTile(BuildContext ctx, SettingsProvider settings, String code, String label) {
    final isSelected = settings.language == code;
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(label, style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
      trailing: isSelected ? const Icon(Icons.check_circle, color: AppTheme.primary) : null,
      onTap: () {
        settings.setLanguage(code);
        Navigator.pop(ctx);
      },
    );
  }
}
