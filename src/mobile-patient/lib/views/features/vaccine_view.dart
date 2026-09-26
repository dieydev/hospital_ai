import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';

class VaccineView extends StatefulWidget {
  const VaccineView({super.key});

  @override
  State<VaccineView> createState() => _VaccineViewState();
}

class _VaccineViewState extends State<VaccineView> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedAgeGroup = 'Người lớn';

  final List<String> _ageGroups = ['Trẻ em', 'Người lớn', 'Người cao tuổi', 'Phụ nữ có thai'];

  final List<Map<String, dynamic>> _myVaccines = [
    {
      'name': 'Cúm mùa 2025-2026',
      'date': '15/10/2025',
      'nextDue': '15/10/2026',
      'status': 'Đã tiêm',
      'location': 'D-Medical - Khoa Tiêm chủng',
      'lotNumber': 'LOT2025C001',
      'daysLeft': 19,
    },
    {
      'name': 'COVID-19 Booster (mRNA)',
      'date': '08/03/2025',
      'nextDue': 'Theo khuyến cáo',
      'status': 'Đã tiêm',
      'location': 'D-Medical - Khoa Tiêm chủng',
      'lotNumber': 'LOT2025V002',
      'daysLeft': null,
    },
    {
      'name': 'Viêm gan B (liều 3)',
      'date': '22/01/2025',
      'nextDue': '22/01/2035',
      'status': 'Đã tiêm',
      'location': 'D-Medical - Khoa Tiêm chủng',
      'lotNumber': 'LOT2025B003',
      'daysLeft': null,
    },
    {
      'name': 'Cúm mùa 2026-2027',
      'date': '-',
      'nextDue': 'Tháng 10/2026',
      'status': 'Cần tiêm',
      'location': '-',
      'lotNumber': '-',
      'daysLeft': 19,
    },
  ];

  final List<Map<String, dynamic>> _vaccineSchedule = [
    {
      'category': 'Phòng bệnh Cúm',
      'vaccines': [
        {
          'name': 'Vắc xin Cúm tứ giá (Quadrivalent)',
          'brands': ['VAXIGRIP TETRA', 'INFLUVAC TETRA'],
          'for': 'Từ 6 tháng tuổi trở lên',
          'schedule': 'Mỗi năm 1 lần',
          'price': '350.000 - 500.000đ/liều',
          'available': true,
          'color': const Color(0xFF0284C7),
          'icon': Icons.sick_rounded,
        },
      ],
    },
    {
      'category': 'Phòng bệnh Viêm gan',
      'vaccines': [
        {
          'name': 'Vắc xin Viêm gan B (HBV)',
          'brands': ['EUVAX-B', 'HEBERBIOVAC-HB'],
          'for': 'Mọi lứa tuổi chưa có miễn dịch',
          'schedule': '3 liều: 0 - 1 - 6 tháng',
          'price': '150.000 - 200.000đ/liều',
          'available': true,
          'color': const Color(0xFF10B981),
          'icon': Icons.vaccines_rounded,
        },
        {
          'name': 'Vắc xin Viêm gan A (HAV)',
          'brands': ['HAVRIX 1440', 'AVAXIM 160U'],
          'for': 'Từ 1 tuổi trở lên',
          'schedule': '2 liều: 0 - 6 tháng',
          'price': '400.000đ/liều',
          'available': true,
          'color': const Color(0xFF14B8A6),
          'icon': Icons.vaccines_rounded,
        },
      ],
    },
    {
      'category': 'COVID-19',
      'vaccines': [
        {
          'name': 'COVID-19 Booster (mRNA bivalent)',
          'brands': ['Pfizer-BioNTech (2026)', 'Moderna (2026)'],
          'for': 'Người từ 12 tuổi trở lên',
          'schedule': 'Theo khuyến cáo hàng năm',
          'price': 'Liên hệ cơ sở y tế',
          'available': false,
          'color': const Color(0xFF8B5CF6),
          'icon': Icons.coronavirus_rounded,
        },
      ],
    },
    {
      'category': 'Ung thư cổ tử cung (HPV)',
      'vaccines': [
        {
          'name': 'Vắc xin HPV 9 chủng (Gardasil 9)',
          'brands': ['GARDASIL 9'],
          'for': 'Nữ 9-45 tuổi, Nam 9-26 tuổi',
          'schedule': '3 liều: 0 - 2 - 6 tháng',
          'price': '2.200.000đ/liều',
          'available': true,
          'color': const Color(0xFFF43F5E),
          'icon': Icons.health_and_safety_rounded,
        },
      ],
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

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
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                    child: Row(
                      children: [
                        IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                          padding: EdgeInsets.zero,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Tiêm Chủng & Vắc xin', style: GoogleFonts.sora(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
                              Text('Theo dõi lịch sử & đặt lịch tiêm', style: GoogleFonts.inter(fontSize: 12, color: Colors.white.withValues(alpha: 0.8))),
                            ],
                          ),
                        ),
                        TextButton.icon(
                          onPressed: () => _showBookingModal(context),
                          icon: const Icon(Icons.event_available_rounded, color: Colors.white, size: 16),
                          label: Text('Đặt lịch', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                          style: TextButton.styleFrom(
                            backgroundColor: Colors.white.withValues(alpha: 0.2),
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  TabBar(
                    controller: _tabController,
                    indicatorColor: Colors.white,
                    indicatorWeight: 3,
                    labelColor: Colors.white,
                    unselectedLabelColor: Colors.white.withValues(alpha: 0.6),
                    labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold),
                    unselectedLabelStyle: GoogleFonts.inter(fontSize: 13),
                    tabs: const [
                      Tab(text: 'Lịch sử của tôi'),
                      Tab(text: 'Danh mục vắc xin'),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Tab Content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildMyVaccineHistory(),
                _buildVaccineCatalog(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMyVaccineHistory() {
    final upcoming = _myVaccines.where((v) => v['status'] == 'Cần tiêm').toList();
    final done = _myVaccines.where((v) => v['status'] == 'Đã tiêm').toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Upcoming Alerts
          if (upcoming.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFFFFBEB), Color(0xFFFEF3C7)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFFCD34D)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.warning_amber_rounded, color: Color(0xFFD97706), size: 20),
                      const SizedBox(width: 8),
                      Text('Vắc xin sắp đến hạn', style: GoogleFonts.sora(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF92400E))),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ...upcoming.map((v) => Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFFCD34D)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF3C7),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.vaccines_rounded, color: Color(0xFFD97706), size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(v['name'] as String, style: GoogleFonts.sora(fontSize: 13.5, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                              Text('Dự kiến: ${v['nextDue']}', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          onPressed: () => _showBookingModal(context),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFD97706),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: Text('Đặt lịch', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  )),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],

          Text('Lịch sử tiêm chủng', style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A))),
          const SizedBox(height: 12),

          ...done.map((v) => Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 3))],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(v['name'] as String, style: GoogleFonts.sora(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                      const SizedBox(height: 3),
                      Row(children: [
                        const Icon(Icons.calendar_today_rounded, size: 12, color: Color(0xFF94A3B8)),
                        const SizedBox(width: 4),
                        Text('Tiêm: ${v['date']}', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                      ]),
                      const SizedBox(height: 2),
                      Row(children: [
                        const Icon(Icons.location_on_rounded, size: 12, color: Color(0xFF94A3B8)),
                        const SizedBox(width: 4),
                        Expanded(child: Text(v['location'] as String, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)), overflow: TextOverflow.ellipsis)),
                      ]),
                    ],
                  ),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildVaccineCatalog() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Age group filter
          SizedBox(
            height: 44,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _ageGroups.length,
              itemBuilder: (ctx, i) {
                final g = _ageGroups[i];
                final isActive = _selectedAgeGroup == g;
                return GestureDetector(
                  onTap: () => setState(() => _selectedAgeGroup = g),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: isActive ? AppTheme.primary : Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: isActive ? AppTheme.primary : const Color(0xFFE2E8F0)),
                    ),
                    child: Text(
                      g,
                      style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.w600, color: isActive ? Colors.white : const Color(0xFF64748B)),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 20),

          ..._vaccineSchedule.map((cat) => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(cat['category'] as String, style: GoogleFonts.sora(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
              const SizedBox(height: 10),
              ...(cat['vaccines'] as List<Map<String, dynamic>>).map((v) => _buildVaccineCard(v)),
              const SizedBox(height: 16),
            ],
          )),
        ],
      ),
    );
  }

  Widget _buildVaccineCard(Map<String, dynamic> vaccine) {
    final available = vaccine['available'] as bool;
    final color = vaccine['color'] as Color;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withValues(alpha: 0.2)),
        boxShadow: [BoxShadow(color: color.withValues(alpha: 0.06), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.07),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
                  child: Icon(vaccine['icon'] as IconData, color: color, size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(vaccine['name'] as String, style: GoogleFonts.sora(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: available ? const Color(0xFFD1FAE5) : const Color(0xFFFEE2E2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    available ? 'Còn vắc xin' : 'Liên hệ',
                    style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.bold, color: available ? const Color(0xFF059669) : const Color(0xFFDC2626)),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _infoRow(Icons.group_rounded, 'Đối tượng', vaccine['for'] as String),
                const SizedBox(height: 8),
                _infoRow(Icons.repeat_rounded, 'Lịch tiêm', vaccine['schedule'] as String),
                const SizedBox(height: 8),
                _infoRow(Icons.monetization_on_outlined, 'Giá tham khảo', vaccine['price'] as String),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  children: (vaccine['brands'] as List<String>).map((b) => Chip(
                    label: Text(b, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
                    backgroundColor: color.withValues(alpha: 0.1),
                    side: BorderSide(color: color.withValues(alpha: 0.2)),
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  )).toList(),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => _showBookingModal(context),
                    icon: const Icon(Icons.event_available_rounded, size: 16),
                    label: const Text('Đặt lịch tiêm'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: color,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 14, color: const Color(0xFF94A3B8)),
        const SizedBox(width: 6),
        Text('$label: ', style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
        Expanded(child: Text(value, style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF334155)))),
      ],
    );
  }

  void _showBookingModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(child: Container(width: 44, height: 4, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 20),
            Text('Đặt lịch tiêm chủng', style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Text('Khoa Tiêm chủng - Bệnh viện D-Medical', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B))),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF0F9FF),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFBAE6FD)),
              ),
              child: Column(
                children: [
                  _bookingInfoRow(Icons.phone_rounded, 'Tổng đài đặt lịch', '1900 7178 (Phím 3)'),
                  const SizedBox(height: 8),
                  _bookingInfoRow(Icons.location_on_rounded, 'Địa điểm', 'Tầng 1, Tòa nhà A, 215 Hồng Bàng, Q.5'),
                  const SizedBox(height: 8),
                  _bookingInfoRow(Icons.access_time_rounded, 'Giờ làm việc', 'T2-T7: 07:00 - 17:00 | CN: 07:00 - 12:00'),
                ],
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Đang chuyển đến đặt lịch tiêm chủng trực tuyến...')),
                  );
                },
                icon: const Icon(Icons.event_available_rounded),
                label: const Text('Đặt lịch trực tuyến ngay'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _bookingInfoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppTheme.primary),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
            Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A))),
          ],
        ),
      ],
    );
  }
}
