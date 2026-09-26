import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';
import '../../widgets/profile_guard.dart';
import '../appointment/book_appointment_view.dart';
import '../appointment/medical_history_view.dart';
import '../booking/hospital_payment_view.dart';
import '../features/health_monitor_view.dart';
import '../features/vaccine_view.dart';
import '../home/queue_status_view.dart' show QueueStatusView;
import '../news/medical_news_view.dart';
import '../profile/help_center_view.dart';

class AllFeaturesView extends StatelessWidget {
  const AllFeaturesView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F8FA),
      body: Column(
        children: [
          // Header
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF0369A1), Color(0xFF0284C7)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Danh mục Chức năng',
                      style: GoogleFonts.sora(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Tất cả dịch vụ D-Medical trong một nơi',
                      style: GoogleFonts.inter(fontSize: 13, color: Colors.white.withValues(alpha: 0.8)),
                    ),
                  ],
                ),
              ),
            ),
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildCategorySection(
                    context,
                    'Dịch vụ Khám chữa bệnh',
                    Icons.local_hospital_rounded,
                    const Color(0xFF0284C7),
                    [
                      {
                        'title': 'Đặt khám chuyên khoa',
                        'desc': 'Chọn bác sĩ, chuyên khoa và khung giờ hẹn trước',
                        'icon': Icons.calendar_month_rounded,
                        'color': AppTheme.primary,
                        'onTap': (BuildContext ctx) => ProfileGuard.check(ctx, onAllowed: () {
                          Navigator.push(ctx, MaterialPageRoute(builder: (_) => const BookAppointmentView()));
                        }),
                      },
                      {
                        'title': 'Hồ sơ bệnh án điện tử (EMR)',
                        'desc': 'Lịch sử chẩn đoán, toa thuốc và lời dặn bác sĩ',
                        'icon': Icons.assignment_outlined,
                        'color': const Color(0xFF0EA5E9),
                        'onTap': (BuildContext ctx) => ProfileGuard.check(ctx, onAllowed: () {
                          Navigator.push(ctx, MaterialPageRoute(builder: (_) => const MedicalHistoryView()));
                        }),
                      },
                      {
                        'title': 'Kết quả cận lâm sàng',
                        'desc': 'Xét nghiệm máu, X-Quang, CT, MRI trực tuyến',
                        'icon': Icons.biotech_rounded,
                        'color': const Color(0xFF8B5CF6),
                        'onTap': (BuildContext ctx) => ProfileGuard.check(ctx, onAllowed: () {
                          Navigator.push(ctx, MaterialPageRoute(builder: (_) => const MedicalHistoryView()));
                        }),
                      },
                      {
                        'title': 'Theo dõi hàng chờ',
                        'desc': 'Xem số thứ tự và ước tính thời gian chờ',
                        'icon': Icons.queue_rounded,
                        'color': const Color(0xFF06B6D4),
                        'onTap': (BuildContext ctx) => ProfileGuard.check(ctx, onAllowed: () {
                          Navigator.push(ctx, MaterialPageRoute(builder: (_) => const QueueStatusView()));
                        }),
                      },
                    ],
                  ),
                  const SizedBox(height: 20),
                  _buildCategorySection(
                    context,
                    'Viện phí & Thanh toán',
                    Icons.credit_card_rounded,
                    const Color(0xFF10B981),
                    [
                      {
                        'title': 'Thanh toán viện phí',
                        'desc': 'Hỗ trợ thẻ ATM, tín dụng, VNPAY, MoMo, VietQR',
                        'icon': Icons.credit_card_rounded,
                        'color': const Color(0xFF10B981),
                        'onTap': (BuildContext ctx) => ProfileGuard.check(ctx, onAllowed: () {
                          Navigator.push(ctx, MaterialPageRoute(builder: (_) => const HospitalPaymentView()));
                        }),
                      },
                      {
                        'title': 'Hoá đơn điện tử',
                        'desc': 'Tra cứu hoá đơn GTGT theo mã người bệnh',
                        'icon': Icons.receipt_long_rounded,
                        'color': const Color(0xFFF59E0B),
                        'onTap': (BuildContext ctx) => ProfileGuard.check(ctx, onAllowed: () {
                          Navigator.push(ctx, MaterialPageRoute(builder: (_) => const HospitalPaymentView()));
                        }),
                      },
                    ],
                  ),
                  const SizedBox(height: 20),
                  _buildCategorySection(
                    context,
                    'Chăm sóc Sức khỏe tại Nhà',
                    Icons.medical_services_rounded,
                    const Color(0xFF14B8A6),
                    [
                      {
                        'title': 'Theo dõi sức khỏe tại nhà',
                        'desc': 'Huyết áp, đường huyết, SpO2, nhịp tim hằng ngày',
                        'icon': Icons.monitor_heart_rounded,
                        'color': const Color(0xFF14B8A6),
                        'onTap': (BuildContext ctx) => ProfileGuard.check(ctx, onAllowed: () {
                          Navigator.push(ctx, MaterialPageRoute(builder: (_) => const HealthMonitorView()));
                        }),
                      },
                      {
                        'title': 'Lịch tiêm chủng & Vắc xin',
                        'desc': 'Tra cứu vắc xin và đặt lịch tiêm tại D-Medical',
                        'icon': Icons.vaccines_rounded,
                        'color': const Color(0xFF0284C7),
                        'onTap': (BuildContext ctx) {
                          Navigator.push(ctx, MaterialPageRoute(builder: (_) => const VaccineView()));
                        },
                      },
                      {
                        'title': 'Nhắc thuốc & Tái khám',
                        'desc': 'Nhắc lịch uống thuốc và lịch tái khám định kỳ',
                        'icon': Icons.medication_rounded,
                        'color': const Color(0xFFF43F5E),
                        'onTap': (BuildContext ctx) {
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            const SnackBar(content: Text('Tính năng Nhắc thuốc đang được phát triển...')),
                          );
                        },
                      },
                    ],
                  ),
                  const SizedBox(height: 20),
                  _buildCategorySection(
                    context,
                    'Thông tin & Hỗ trợ',
                    Icons.info_outline_rounded,
                    const Color(0xFF6366F1),
                    [
                      {
                        'title': 'Tin tức y khoa & Cảnh báo dịch bệnh',
                        'desc': 'Bài viết chuyên sâu từ các chuyên gia y tế D-Medical',
                        'icon': Icons.newspaper_rounded,
                        'color': const Color(0xFF06B6D4),
                        'onTap': (BuildContext ctx) => Navigator.push(ctx, MaterialPageRoute(builder: (_) => const MedicalNewsView())),
                      },
                      {
                        'title': 'Hỗ trợ & Lắng nghe khách hàng',
                        'desc': 'Góp ý chất lượng dịch vụ, tổng đài 24/7',
                        'icon': Icons.support_agent_rounded,
                        'color': const Color(0xFFF97316),
                        'onTap': (BuildContext ctx) => Navigator.push(ctx, MaterialPageRoute(builder: (_) => const HelpCenterView())),
                      },
                      {
                        'title': 'Bảng giá dịch vụ kỹ thuật',
                        'desc': 'Bảng giá niêm yết công khai các dịch vụ y tế',
                        'icon': Icons.request_quote_outlined,
                        'color': const Color(0xFF0369A1),
                        'onTap': (BuildContext ctx) {
                          _showPriceListModal(ctx);
                        },
                      },
                    ],
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategorySection(
    BuildContext context,
    String categoryTitle,
    IconData categoryIcon,
    Color categoryColor,
    List<Map<String, dynamic>> items,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: categoryColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(categoryIcon, color: categoryColor, size: 16),
            ),
            const SizedBox(width: 8),
            Text(
              categoryTitle,
              style: GoogleFonts.sora(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            children: List.generate(items.length, (index) {
              final item = items[index];
              final isLast = index == items.length - 1;

              return Column(
                children: [
                  Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => (item['onTap'] as Function(BuildContext))(context),
                      borderRadius: index == 0
                          ? const BorderRadius.vertical(top: Radius.circular(18))
                          : isLast
                              ? const BorderRadius.vertical(bottom: Radius.circular(18))
                              : BorderRadius.zero,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: (item['color'] as Color).withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Icon(item['icon'] as IconData, color: item['color'] as Color, size: 22),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item['title'] as String,
                                    style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    item['desc'] as String,
                                    style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8), size: 20),
                          ],
                        ),
                      ),
                    ),
                  ),
                  if (!isLast) const Divider(height: 1, indent: 64, color: Color(0xFFF1F5F9)),
                ],
              );
            }),
          ),
        ),
      ],
    );
  }

  void _showPriceListModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        minChildSize: 0.4,
        expand: false,
        builder: (_, controller) => SingleChildScrollView(
          controller: controller,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(child: Container(width: 44, height: 4, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 20),
              Text('Bảng giá Dịch vụ Y tế', style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              Text('Giá niêm yết công khai - Cập nhật 01/09/2026', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
              const SizedBox(height: 16),
              _buildPriceCategory('Khám bệnh', [
                {'service': 'Khám tổng quát', 'price': '100.000đ'},
                {'service': 'Khám chuyên khoa', 'price': '150.000 - 200.000đ'},
                {'service': 'Khám ngoài giờ', 'price': '+50.000đ'},
              ]),
              _buildPriceCategory('Xét nghiệm', [
                {'service': 'Xét nghiệm máu cơ bản', 'price': '180.000đ'},
                {'service': 'Sinh hóa máu toàn phần', 'price': '350.000đ'},
                {'service': 'Tổng phân tích nước tiểu', 'price': '80.000đ'},
              ]),
              _buildPriceCategory('Chẩn đoán hình ảnh', [
                {'service': 'X-Quang phổi', 'price': '120.000đ'},
                {'service': 'Siêu âm bụng tổng quát', 'price': '250.000đ'},
                {'service': 'CT Scan đầu', 'price': '1.200.000đ'},
                {'service': 'MRI não', 'price': '4.500.000đ'},
              ]),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPriceCategory(String title, List<Map<String, String>> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Text(title, style: GoogleFonts.sora(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.primaryDark)),
        ),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            children: List.generate(items.length, (i) {
              final item = items[i];
              final isLast = i == items.length - 1;
              return Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(item['service']!, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF334155))),
                        Text(item['price']!, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.primary)),
                      ],
                    ),
                  ),
                  if (!isLast) const Divider(height: 1, color: Color(0xFFE2E8F0)),
                ],
              );
            }),
          ),
        ),
      ],
    );
  }
}
