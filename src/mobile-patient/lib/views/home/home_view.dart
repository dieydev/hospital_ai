import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';
import '../../widgets/profile_guard.dart';
import '../appointment/book_appointment_view.dart';
import '../appointment/medical_history_view.dart';
import '../booking/hospital_payment_view.dart';
import '../features/health_monitor_view.dart';
import '../features/vaccine_view.dart';
import 'queue_status_view.dart';
import '../news/medical_news_view.dart';
import '../profile/help_center_view.dart';

class HomeView extends StatefulWidget {
  final Function(int)? onNavigateTab;
  const HomeView({super.key, this.onNavigateTab});

  @override
  State<HomeView> createState() => _HomeViewState();
}

class _HomeViewState extends State<HomeView> {
  final int _activeNewsIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F7FB),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color(0xFFD6EEFA), // Soft sky blue top
              Color(0xFFE8F4FA),
              Color(0xFFF4F9FC),
              Colors.white,
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            stops: [0.0, 0.25, 0.55, 1.0],
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 12),
                // 1. Top Branding Header (Hospital logo + Title + Subtitle)
                _buildHeader(),

                const SizedBox(height: 16),

                // 2. Main 12-Feature Card (Card "Chức năng")
                _buildPrimaryFunctionsCard(),

                const SizedBox(height: 20),

                // 3. Hospital Panorama Banner
                _buildHospitalBanner(),

                const SizedBox(height: 24),

                // 4. Section "Tin tức nổi bật"
                _buildFeaturedNewsSection(),

                const SizedBox(height: 24),

                // 5. Section "Chức năng khác"
                _buildOtherFunctionsSection(),

                const SizedBox(height: 36),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── 1. Top Header ──────────────────────────────────────────────
  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Hospital Logo & Status Badge Bar
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Image.asset(
                'assets/images/logo.png',
                height: 40,
                fit: BoxFit.contain,
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(0xFFE0F2FE),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFBAE6FD)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: const BoxDecoration(
                        color: Color(0xFF10B981),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Bệnh viện Số 4.0',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF0369A1),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Main app title & subtitle
          Text(
            'Chăm sóc Sức khỏe Thông minh',
            style: GoogleFonts.sora(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: const Color(0xFF0F172A),
              letterSpacing: -0.5,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 4),

          Text(
            'Hệ thống Y tế Quốc tế D-Medical',
            style: GoogleFonts.inter(
              fontSize: 13.5,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }

  // ── 2. Primary 12-Feature Card ("Chức năng") ───────────────────
  Widget _buildPrimaryFunctionsCard() {
    final List<Map<String, dynamic>> primaryFunctions = [
      {
        'title': 'Đặt khám',
        'iconWidget': _buildDualIcon(
          Icons.medical_services_outlined,
          badgeIcon: Icons.calendar_month_rounded,
          iconColor: const Color(0xFF0284C7),
          badgeColor: const Color(0xFF14B8A6),
        ),
        'onTap': () {
          ProfileGuard.check(context, onAllowed: () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => const BookAppointmentView()));
          });
        },
      },
      {
        'title': 'Theo dõi\nhàng chờ',
        'iconWidget': _buildDualIcon(
          Icons.queue_rounded,
          badgeIcon: Icons.live_tv_rounded,
          iconColor: const Color(0xFF0EA5E9),
          badgeColor: const Color(0xFFF97316),
        ),
        'onTap': () {
          ProfileGuard.check(context, onAllowed: () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => const QueueStatusView()));
          });
        },
      },
      {
        'title': 'Thanh toán\nviện phí',
        'iconWidget': _buildDualIcon(
          Icons.credit_card_rounded,
          badgeIcon: Icons.monetization_on_rounded,
          iconColor: const Color(0xFF38BDF8),
          badgeColor: const Color(0xFFF59E0B),
        ),
        'onTap': () {
          ProfileGuard.check(context, onAllowed: () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => const HospitalPaymentView()));
          });
        },
      },
      {
        'title': 'Hoá đơn',
        'iconWidget': _buildDualIcon(
          Icons.receipt_long_rounded,
          badgeIcon: Icons.arrow_downward_rounded,
          iconColor: const Color(0xFF10B981),
          badgeColor: const Color(0xFFEF4444),
        ),
        'onTap': () {
          ProfileGuard.check(context, onAllowed: () {
            _showServiceModal('Hoá đơn điện tử', 'Tra cứu và tải hóa đơn GTGT điện tử khám chữa bệnh của người bệnh theo mã BN.');
          });
        },
      },
      {
        'title': 'Hồ sơ sức\nkhoẻ',
        'iconWidget': _buildDualIcon(
          Icons.assignment_outlined,
          badgeIcon: Icons.favorite_rounded,
          iconColor: const Color(0xFF06B6D4),
          badgeColor: const Color(0xFFF43F5E),
        ),
        'onTap': () {
          ProfileGuard.check(context, onAllowed: () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => const MedicalHistoryView()));
          });
        },
      },
      {
        'title': 'Kết quả cận\nlâm sàng',
        'iconWidget': _buildDualIcon(
          Icons.biotech_rounded,
          badgeIcon: Icons.search_rounded,
          iconColor: const Color(0xFF8B5CF6),
          badgeColor: const Color(0xFF06B6D4),
        ),
        'onTap': () {
          ProfileGuard.check(context, onAllowed: () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => const MedicalHistoryView()));
          });
        },
      },
      {
        'title': 'Lịch hẹn nội\ntrú',
        'iconWidget': _buildDualIcon(
          Icons.hotel_rounded,
          badgeIcon: Icons.add_circle_rounded,
          iconColor: const Color(0xFF0284C7),
          badgeColor: const Color(0xFFEF4444),
        ),
        'onTap': () {
          ProfileGuard.check(context, onAllowed: () {
            _showServiceModal('Lịch hẹn điều trị nội trú', 'Thông tin khoa/phòng, giường bệnh và kế hoạch điều trị nội trú tại bệnh viện.');
          });
        },
      },
      {
        'title': 'Lắng nghe\nkhách hàng',
        'iconWidget': _buildDualIcon(
          Icons.support_agent_rounded,
          badgeIcon: Icons.chat_bubble_rounded,
          iconColor: const Color(0xFF0284C7),
          badgeColor: const Color(0xFFF97316),
        ),
        'onTap': () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const HelpCenterView()));
        },
      },
      {
        'title': 'Hướng dẫn\nsử dụng',
        'iconWidget': _buildDualIcon(
          Icons.menu_book_rounded,
          badgeIcon: Icons.search_rounded,
          iconColor: const Color(0xFF0EA5E9),
          badgeColor: const Color(0xFF64748B),
        ),
        'onTap': () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const HelpCenterView()));
        },
      },
      {
        'title': 'Theo dõi sức\nkhoẻ tại nhà',
        'iconWidget': _buildDualIcon(
          Icons.home_rounded,
          badgeIcon: Icons.monitor_heart_rounded,
          iconColor: const Color(0xFF14B8A6),
          badgeColor: const Color(0xFFF43F5E),
        ),
        'onTap': () {
          ProfileGuard.check(context, onAllowed: () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => const HealthMonitorView()));
          });
        },
      },
      {
        'title': 'Tiêm chủng',
        'iconWidget': _buildDualIcon(
          Icons.vaccines_rounded,
          badgeIcon: Icons.verified_user_rounded,
          iconColor: const Color(0xFF0284C7),
          badgeColor: const Color(0xFF10B981),
        ),
        'onTap': () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const VaccineView()));
        },
      },
      {
        'title': 'Hỏi - đáp\n(Chatbot)',
        'iconWidget': _buildDualIcon(
          Icons.smart_toy_outlined,
          badgeIcon: Icons.question_answer_rounded,
          iconColor: const Color(0xFF0284C7),
          badgeColor: const Color(0xFF38BDF8),
        ),
        'onTap': () {
          ProfileGuard.check(context, onAllowed: () {
            _showChatbotModal();
          });
        },
      },
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 18, 16, 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFBAE6FD).withValues(alpha: 0.6), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0284C7).withValues(alpha: 0.08),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          children: [
            // Top Bar: "Chức năng" + Tune Icon + Divider + Search Icon
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Chức năng',
                  style: GoogleFonts.sora(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF0369A1), // Sky 700
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0F9FF),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE0F2FE)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      InkWell(
                        onTap: () {},
                        borderRadius: BorderRadius.circular(12),
                        child: const Padding(
                          padding: EdgeInsets.all(4.0),
                          child: Icon(Icons.tune_rounded, color: AppTheme.primary, size: 20),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(height: 16, width: 1.2, color: const Color(0xFFCBD5E1)),
                      const SizedBox(width: 6),
                      InkWell(
                        onTap: () {},
                        borderRadius: BorderRadius.circular(12),
                        child: const Padding(
                          padding: EdgeInsets.all(4.0),
                          child: Icon(Icons.search_rounded, color: AppTheme.primary, size: 20),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),

            // 4x3 Grid (12 items)
            GridView.builder(
              padding: EdgeInsets.zero,
              physics: const NeverScrollableScrollPhysics(),
              shrinkWrap: true,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                mainAxisSpacing: 16,
                crossAxisSpacing: 10,
                childAspectRatio: 0.72,
              ),
              itemCount: primaryFunctions.length,
              itemBuilder: (context, index) {
                final item = primaryFunctions[index];
                return InkWell(
                  onTap: item['onTap'] as VoidCallback,
                  borderRadius: BorderRadius.circular(16),
                  child: Column(
                    children: [
                      // Rounded Square Icon Container
                      Container(
                        width: 58,
                        height: 58,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF0F172A).withValues(alpha: 0.04),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        alignment: Alignment.center,
                        child: item['iconWidget'] as Widget,
                      ),
                      const SizedBox(height: 8),

                      // Text label
                      Expanded(
                        child: Text(
                          item['title'] as String,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF0369A1), // Sky 700
                            height: 1.2,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  // ── 3. Hospital Panoramic Banner ───────────────────────────────
  Widget _buildHospitalBanner() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Container(
          height: 175,
          width: double.infinity,
          decoration: BoxDecoration(
            color: const Color(0xFF0369A1),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
                                                                                                                                         ],
          ),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Photo of hospital campus
              Image.network(
                'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=1000&auto=format&fit=crop&q=80',
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFF0284C7), Color(0xFF0369A1)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Center(
                      child: Icon(Icons.apartment_rounded, color: Colors.white.withValues(alpha: 0.5), size: 64),
                    ),
                  );
                },
              ),

              // Gradient Overlay for readability
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.black.withValues(alpha: 0.45),
                      Colors.transparent,
                      Colors.black.withValues(alpha: 0.35),
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
              ),

              // Watermark Header
              Positioned(
                top: 14,
                left: 16,
                right: 16,
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Image.asset(
                        'assets/images/logo_icon.png',
                        height: 18,
                        width: 18,
                        fit: BoxFit.contain,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'HỆ THỐNG Y TẾ QUỐC TẾ D-MEDICAL',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          letterSpacing: 0.5,
                          shadows: [
                            Shadow(color: Colors.black.withValues(alpha: 0.6), blurRadius: 4),
                          ],
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── 4. Section "Tin tức nổi bật" ───────────────────────────────
  Widget _buildFeaturedNewsSection() {
    final List<Map<String, String>> featuredNews = [
      {
        'title': 'Cùng tham gia cuộc thi tìm hiểu quy định pháp luật về phòng, chống tác hại của...',
        'image': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=300&auto=format&fit=crop&q=80',
      },
      {
        'title': 'Thông báo về việc tìm chủ sở hữu của tài sản là tiền mặt do người bệnh/thân...',
        'image': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=300&auto=format&fit=crop&q=80',
      },
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: "Tin tức nổi bật" + "Xem thêm"
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Tin tức nổi bật',
                style: GoogleFonts.sora(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF0F172A),
                ),
              ),
              InkWell(
                onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const MedicalNewsView()));
                },
                child: Text(
                  'Xem thêm',
                  style: GoogleFonts.inter(
                    fontSize: 13.5,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF0284C7),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // News cards list
          Column(
            children: featuredNews.map((news) {
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Row(
                    children: [
                      // Blue left accent vertical bar
                      Container(width: 4, height: 76, color: const Color(0xFF0284C7)),
                      const SizedBox(width: 10),

                      // Thumbnail
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Image.network(
                          news['image']!,
                          width: 90,
                          height: 62,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            width: 90,
                            height: 62,
                            color: const Color(0xFFE0F2FE),
                            child: const Icon(Icons.image_outlined, color: AppTheme.primary),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),

                      // Title
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Text(
                            news['title']!,
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF1E293B),
                              height: 1.35,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ),

                      // Chevron right
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 10.0),
                        child: Icon(Icons.chevron_right_rounded, color: Color(0xFF0284C7), size: 22),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 8),

          // Pagination Dots indicator
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(6, (index) {
              final isActive = index == _activeNewsIndex;
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: isActive ? 22 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: isActive ? const Color(0xFF0284C7) : const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(3),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  // ── 5. Section "Chức năng khác" ────────────────────────────────
  Widget _buildOtherFunctionsSection() {
    final List<Map<String, dynamic>> otherFunctions = [
      {
        'title': 'Hướng dẫn\nkhách hàng',
        'iconWidget': _buildSingleIcon(Icons.health_and_safety_rounded, color: const Color(0xFF0284C7)),
        'onTap': () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const HelpCenterView()));
        },
      },
      {
        'title': 'Dịch vụ nổi\nbật',
        'iconWidget': _buildSingleIcon(Icons.medical_services_rounded, color: const Color(0xFF0284C7)),
        'onTap': () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const BookAppointmentView()));
        },
      },
      {
        'title': 'Bảng giá dịch\nvụ kỹ thuật',
        'iconWidget': _buildSingleIcon(Icons.request_quote_outlined, color: const Color(0xFF0284C7)),
        'onTap': () {
          _showServiceModal('Bảng giá Dịch vụ Kỹ thuật', 'Bảng giá niêm yết công khai khám bệnh, cận lâm sàng, xét nghiệm, phẫu thuật theo quy định.');
        },
      },
      {
        'title': 'Thư viện sức\nkhoẻ',
        'iconWidget': _buildSingleIcon(Icons.volunteer_activism_rounded, color: const Color(0xFF0284C7)),
        'onTap': () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const MedicalNewsView()));
        },
      },
      {
        'title': 'Tin tức - Sự\nkiện',
        'iconWidget': _buildSingleIcon(Icons.newspaper_rounded, color: const Color(0xFF0284C7)),
        'onTap': () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const MedicalNewsView()));
        },
      },
      {
        'title': 'Liên hệ',
        'iconWidget': _buildSingleIcon(Icons.phone_in_talk_rounded, color: const Color(0xFF0284C7)),
        'onTap': () {
          _showContactModal();
        },
      },
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Chức năng khác',
            style: GoogleFonts.sora(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 14),

          GridView.builder(
            padding: EdgeInsets.zero,
            physics: const NeverScrollableScrollPhysics(),
            shrinkWrap: true,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              mainAxisSpacing: 16,
              crossAxisSpacing: 10,
              childAspectRatio: 0.76,
            ),
            itemCount: otherFunctions.length,
            itemBuilder: (context, index) {
              final item = otherFunctions[index];
              return InkWell(
                onTap: item['onTap'] as VoidCallback,
                borderRadius: BorderRadius.circular(16),
                child: Column(
                  children: [
                    Container(
                      width: 58,
                      height: 58,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFBAE6FD).withValues(alpha: 0.7)),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF0F172A).withValues(alpha: 0.03),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      alignment: Alignment.center,
                      child: item['iconWidget'] as Widget,
                    ),
                    const SizedBox(height: 8),
                    Expanded(
                      child: Text(
                        item['title'] as String,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF0369A1), // Sky 700
                          height: 1.2,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // ── Helper Widgets ─────────────────────────────────────────────
  Widget _buildDualIcon(
    IconData mainIcon, {
    required IconData badgeIcon,
    required Color iconColor,
    required Color badgeColor,
  }) {
    return SizedBox(
      width: 36,
      height: 36,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          Icon(mainIcon, color: iconColor, size: 28),
          Positioned(
            right: -4,
            bottom: -4,
            child: Container(
              padding: const EdgeInsets.all(2),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: Icon(badgeIcon, color: badgeColor, size: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSingleIcon(IconData icon, {required Color color}) {
    return Icon(icon, color: color, size: 28);
  }

  void _showServiceModal(String title, String description) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.info_outline_rounded, color: AppTheme.primary, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    title,
                    style: GoogleFonts.sora(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              description,
              style: GoogleFonts.inter(fontSize: 13.5, color: const Color(0xFF475569), height: 1.45),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('ĐÓNG'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showChatbotModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.smart_toy_rounded, color: AppTheme.primary, size: 24),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Trợ lý AI Bệnh viện', style: GoogleFonts.sora(fontSize: 16, fontWeight: FontWeight.bold)),
                    Text('Sẵn sàng giải đáp 24/7', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF10B981))),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Text(
                'Xin chào! Tôi là Trợ lý AI Bệnh viện D-Medical. Bạn có câu hỏi nào về quy trình khám bệnh, bảng giá hoặc triệu chứng cần tư vấn?',
                style: GoogleFonts.inter(fontSize: 13.5, color: const Color(0xFF334155), height: 1.4),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: 'Nhập câu hỏi của bạn...',
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: () {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Câu hỏi đã được gửi đến Trợ lý AI')),
                    );
                  },
                  icon: const Icon(Icons.send_rounded),
                  style: IconButton.styleFrom(backgroundColor: AppTheme.primary),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showContactModal() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Thông tin Liên hệ', style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 14),
            const ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.phone_rounded, color: AppTheme.primary),
              title: Text('Tổng đài Chăm sóc khách hàng'),
              subtitle: Text('1900 7178 (24/7)'),
            ),
            const ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.emergency_rounded, color: Color(0xFFEF4444)),
              title: Text('Cấp cứu Bệnh viện'),
              subtitle: Text('(028) 3855 4269'),
            ),
            const ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.location_on_rounded, color: AppTheme.primary),
              title: Text('Địa chỉ'),
              subtitle: Text('215 Hồng Bàng, Phường 11, Quận 5, TP. Hồ Chí Minh'),
            ),
          ],
        ),
      ),
    );
  }
}
