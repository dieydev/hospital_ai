import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../providers/settings_provider.dart';
import '../auth/login_view.dart';
import '../auth/register_view.dart';

class OnboardingView extends StatefulWidget {
  final bool isRevisit;
  const OnboardingView({super.key, this.isRevisit = false});

  @override
  State<OnboardingView> createState() => _OnboardingViewState();
}

class _OnboardingViewState extends State<OnboardingView> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  bool _showQuestionStep = false;
  int? _selectedPersona; // 0 = Bệnh nhân cũ (Đã từng khám), 1 = Bệnh nhân mới (Lần đầu)

  final List<Map<String, dynamic>> _slides = [
    {
      'title': 'Đặt Lịch Khám & Lấy Số 4.0\nKhông Chen Lấn Chờ Đợi',
      'highlight': 'Tiết kiệm 80% thời gian chờ',
      'description':
          'Chủ động lựa chọn Bác sĩ chuyên khoa, ngày giờ mong muốn và nhận số thứ tự điện tử ngay tại nhà. Nhận thông báo thông minh khi sắp đến lượt khám.',
      'icon': Icons.calendar_month_rounded,
      'badge': 'ĐẶT LỊCH THÔNG MINH',
      'accentColor': const Color(0xFF0284C7),
      'features': [
        'Lấy số thứ tự trực tuyến từ xa',
        'Chọn bác sĩ & chuyên khoa chính xác',
        'Theo dõi tiến độ hàng đợi theo thời gian thực',
      ],
    },
    {
      'title': 'Hồ Sơ Bệnh Án Điện Tử\nKết Quả Xét Nghiệm Tức Thì',
      'highlight': 'Bảo mật trọn đời theo chuẩn Bộ Y Tế',
      'description':
          'Tra cứu kết quả xét nghiệm máu, chẩn đoán hình ảnh X-Quang, CT, MRI và toa thuốc điện tử mọi lúc, mọi nơi ngay trên điện thoại thông minh.',
      'icon': Icons.medical_information_rounded,
      'badge': 'HỒ SƠ BỆNH ÁN EMR',
      'accentColor': const Color(0xFF0EA5E9),
      'features': [
        'Xem phim chụp & xét nghiệm chất lượng cao',
        'Đơn thuốc điện tử & lời dặn bác sĩ',
        'Lưu trữ hồ sơ bảo mật 100%',
      ],
    },
    {
      'title': 'Trợ Lý Y Tế AI D-Medical\nChăm Sóc Sức Khỏe 24/7',
      'highlight': 'Cố vấn y tế số thông minh',
      'description':
          'Hỏi đáp triệu chứng ban đầu, gợi ý chuyên khoa phù hợp, thanh toán tạm ứng viện phí và nhắc nhở lịch uống thuốc hoàn toàn tự động.',
      'icon': Icons.health_and_safety_rounded,
      'badge': 'TRÍ TUỆ NHÂN TẠO Y TẾ',
      'accentColor': const Color(0xFF10B981),
      'features': [
        'Tư vấn sơ bộ triệu chứng bằng AI',
        'Thanh toán viện phí VietQR & BHYT số',
        'Nhắc nhở lịch uống thuốc đúng giờ',
      ],
    },
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onNext() {
    if (_currentPage < _slides.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
      );
    } else {
      _goToQuestionStep();
    }
  }

  void _goToQuestionStep() {
    setState(() {
      _showQuestionStep = true;
    });
  }

  void _handlePersonaSelected(int persona) {
    setState(() {
      _selectedPersona = persona;
    });

    context.read<SettingsProvider>().completeOnboarding();

    if (persona == 0) {
      // Đã từng khám -> Chuyển sang Đăng nhập để đồng bộ EMR
      if (widget.isRevisit) {
        Navigator.pop(context);
      } else {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const LoginView()),
        );
      }
    } else {
      // Chưa từng khám -> Chuyển sang Đăng ký tài khoản & cấp mã BN mới
      if (widget.isRevisit) {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const RegisterView()),
        );
      } else {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const RegisterView()),
        );
      }
    }
  }

  void _skipDirectlyToLogin() {
    context.read<SettingsProvider>().completeOnboarding();
    if (widget.isRevisit) {
      Navigator.pop(context);
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginView()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F9FF),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFE0F2FE),
              Color(0xFFF0F9FF),
              Color(0xFFE2E8F0),
            ],
          ),
        ),
        child: SafeArea(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 350),
            child: _showQuestionStep
                ? _buildQuestionStepView()
                : _buildSlideWalkthroughView(),
          ),
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHẦN 1: WALKTHROUGH SLIDES GIỚI THIỆU TÍNH NĂNG CHUYÊN NGHIỆP
  // ─────────────────────────────────────────────────────────────────────────
  Widget _buildSlideWalkthroughView() {
    return Column(
      key: const ValueKey('walkthrough'),
      children: [
        // Top Bar: Logo D-Medical + Nút Bỏ qua
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Image.asset(
                'assets/images/logo.png',
                height: 38,
                fit: BoxFit.contain,
              ),
              TextButton(
                onPressed: _goToQuestionStep,
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  backgroundColor: Colors.white.withValues(alpha: 0.85),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                    side: const BorderSide(color: Color(0xFFBAE6FD)),
                  ),
                ),
                child: Text(
                  'Bỏ qua',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF0369A1),
                  ),
                ),
              ),
            ],
          ),
        ),

        // Slide Content
        Expanded(
          child: PageView.builder(
            controller: _pageController,
            onPageChanged: (index) => setState(() => _currentPage = index),
            itemCount: _slides.length,
            itemBuilder: (context, index) {
              final slide = _slides[index];
              return _buildSlideContent(slide);
            },
          ),
        ),

        // Bottom Controls: Indicator Dots + Button Tiếp tục / Bắt đầu ngay
        Container(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 20),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            boxShadow: [
              BoxShadow(
                color: Color(0x150284C7),
                blurRadius: 25,
                offset: Offset(0, -6),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Dots Indicator
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_slides.length, (index) {
                  final isActive = index == _currentPage;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    height: 6,
                    width: isActive ? 30 : 8,
                    decoration: BoxDecoration(
                      color: isActive ? const Color(0xFF0284C7) : const Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 18),

              // Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _onNext,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0284C7),
                    foregroundColor: Colors.white,
                    elevation: 4,
                    shadowColor: const Color(0xFF0284C7).withValues(alpha: 0.35),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _currentPage == _slides.length - 1 ? 'Bắt đầu ngay' : 'Tiếp tục',
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.2,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        _currentPage == _slides.length - 1
                            ? Icons.arrow_forward_rounded
                            : Icons.arrow_forward_ios_rounded,
                        size: 18,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSlideContent(Map<String, dynamic> slide) {
    final Color accentColor = slide['accentColor'] as Color;
    final List<String> features = slide['features'] as List<String>;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const SizedBox(height: 12),

          // Hero Icon Card
          Center(
            child: Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: 170,
                  height: 170,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: accentColor.withValues(alpha: 0.08),
                  ),
                ),
                Container(
                  width: 135,
                  height: 135,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: accentColor.withValues(alpha: 0.16),
                  ),
                ),
                Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: accentColor.withValues(alpha: 0.25),
                        blurRadius: 24,
                        offset: const Offset(0, 10),
                      ),
                    ],
                    border: Border.all(color: const Color(0xFFBAE6FD), width: 2),
                  ),
                  child: Icon(
                    slide['icon'] as IconData,
                    size: 48,
                    color: accentColor,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Category Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xFFE0F2FE),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFBAE6FD)),
            ),
            child: Text(
              slide['badge'] as String,
              style: GoogleFonts.inter(
                fontSize: 10.5,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF0369A1),
                letterSpacing: 1,
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Main Title
          Text(
            slide['title'] as String,
            textAlign: TextAlign.center,
            style: GoogleFonts.sora(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: const Color(0xFF0F172A),
              height: 1.25,
            ),
          ),
          const SizedBox(height: 8),

          // Subtitle / Description
          Text(
            slide['description'] as String,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 13,
              color: const Color(0xFF475569),
              height: 1.45,
            ),
          ),
          const SizedBox(height: 18),

          // Feature Highlights Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFBAE6FD)),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x100284C7),
                  blurRadius: 16,
                  offset: Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              children: features.map((feat) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          color: accentColor.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(Icons.check_rounded, size: 14, color: accentColor),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          feat,
                          style: GoogleFonts.inter(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF1E293B),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHẦN 2: BƯỚC KHẢO SÁT & PHÂN LUỒNG: "BẠN ĐÃ SỬ DỤNG / KHÁM LẦN NÀO CHƯA?"
  // ─────────────────────────────────────────────────────────────────────────
  Widget _buildQuestionStepView() {
    return Column(
      key: const ValueKey('question_step'),
      children: [
        // Header Bar: Nút quay lại slide + Logo D-Medical
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              IconButton(
                onPressed: () {
                  setState(() {
                    _showQuestionStep = false;
                  });
                },
                icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
                tooltip: 'Xem lại giới thiệu',
              ),
              const Spacer(),
              Image.asset(
                'assets/images/logo.png',
                height: 34,
                fit: BoxFit.contain,
              ),
              const Spacer(),
              const SizedBox(width: 48), // Cân bằng với icon back
            ],
          ),
        ),

        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Icon chào mừng
                Center(
                  child: Container(
                    width: 76,
                    height: 76,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFBAE6FD), width: 2),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x150284C7),
                          blurRadius: 20,
                          offset: Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Image.asset(
                      'assets/images/logo_icon.png',
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
                const SizedBox(height: 18),

                // Tiêu đề & Lời chào
                Center(
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE0F2FE),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFBAE6FD)),
                        ),
                        child: Text(
                          'BƯỚC ĐẦU LÀM QUEN',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF0369A1),
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Chào mừng đến với D-Medical',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.sora(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Bạn đã từng đến khám bệnh tại Bệnh viện D-Medical lần nào chưa?',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF334155),
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Lựa chọn đúng tình trạng giúp hệ thống đồng bộ chính xác hồ sơ bệnh án cũ hoặc cấp mã bệnh nhân điện tử mới cho bạn.',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 12.5,
                          color: const Color(0xFF64748B),
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // LỰA CHỌN 1: BỆNH NHÂN CŨ (ĐÃ TỪNG KHÁM)
                _buildPersonaCard(
                  personaIndex: 0,
                  icon: Icons.assignment_ind_rounded,
                  iconColor: const Color(0xFF0284C7),
                  badgeText: 'ĐỒNG BỘ BỆNH ÁN CŨ',
                  badgeBg: const Color(0xFFE0F2FE),
                  title: 'Tôi đã từng khám tại D-Medical',
                  description:
                      'Bạn đã có Mã số bệnh nhân, Sổ khám bệnh hoặc số điện thoại từng đăng ký tại các phòng khám của bệnh viện.',
                  actionText: 'Đăng nhập & Đồng bộ hồ sơ',
                  onTap: () => _handlePersonaSelected(0),
                ),
                const SizedBox(height: 16),

                // LỰA CHỌN 2: BỆNH NHÂN MỚI (LẦN ĐẦU TIÊN)
                _buildPersonaCard(
                  personaIndex: 1,
                  icon: Icons.person_add_alt_1_rounded,
                  iconColor: const Color(0xFF10B981),
                  badgeText: 'CẤP MÃ BN ĐIỆN TỬ MỚI',
                  badgeBg: const Color(0xFFD1FAE5),
                  title: 'Tôi là người bệnh mới (Chưa từng khám)',
                  description:
                      'Bạn chưa từng khám tại bệnh viện. Đăng ký tài khoản điện tử nhanh chóng để nhận mã BN và đặt khám ngay.',
                  actionText: 'Tạo tài khoản hồ sơ mới',
                  onTap: () => _handlePersonaSelected(1),
                ),
                const SizedBox(height: 24),

                // Link chuyển thẳng Đăng nhập
                Center(
                  child: InkWell(
                    onTap: _skipDirectlyToLogin,
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      child: RichText(
                        text: TextSpan(
                          text: 'Đã có tài khoản ứng dụng? ',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: const Color(0xFF64748B),
                          ),
                          children: [
                            TextSpan(
                              text: 'Đăng nhập ngay',
                              style: GoogleFonts.inter(
                                fontSize: 13.5,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF0284C7),
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
    );
  }

  Widget _buildPersonaCard({
    required int personaIndex,
    required IconData icon,
    required Color iconColor,
    required String badgeText,
    required Color badgeBg,
    required String title,
    required String description,
    required String actionText,
    required VoidCallback onTap,
  }) {
    final bool isSelected = _selectedPersona == personaIndex;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? iconColor : const Color(0xFFBAE6FD),
            width: isSelected ? 2 : 1.2,
          ),
          boxShadow: [
            BoxShadow(
              color: isSelected
                  ? iconColor.withValues(alpha: 0.18)
                  : const Color(0x100284C7),
              blurRadius: isSelected ? 20 : 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Icon avatar
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: iconColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(icon, color: iconColor, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: badgeBg,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          badgeText,
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: iconColor,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      // Title
                      Text(
                        title,
                        style: GoogleFonts.sora(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 16,
                  color: iconColor,
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Description
            Text(
              description,
              style: GoogleFonts.inter(
                fontSize: 12.5,
                color: const Color(0xFF475569),
                height: 1.45,
              ),
            ),
            const SizedBox(height: 12),
            // Action button inside card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: iconColor.withValues(alpha: 0.2)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    actionText,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: iconColor,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Icon(Icons.arrow_forward_rounded, size: 16, color: iconColor),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
