import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';

class HealthMonitorView extends StatefulWidget {
  const HealthMonitorView({super.key});

  @override
  State<HealthMonitorView> createState() => _HealthMonitorViewState();
}

class _HealthMonitorViewState extends State<HealthMonitorView> {
  final List<Map<String, dynamic>> _healthData = [
    {
      'title': 'Huyết áp',
      'unit': 'mmHg',
      'icon': Icons.favorite_rounded,
      'color': const Color(0xFFEF4444),
      'current': '120/80',
      'status': 'Bình thường',
      'statusColor': const Color(0xFF10B981),
      'history': [
        {'date': '26/09', 'value': '120/80'},
        {'date': '25/09', 'value': '125/82'},
        {'date': '24/09', 'value': '118/78'},
        {'date': '23/09', 'value': '130/85'},
        {'date': '22/09', 'value': '122/80'},
      ],
      'note': 'Duy trì 120/80: Bình thường. >130/90: Cần tái khám.',
    },
    {
      'title': 'Đường huyết',
      'unit': 'mmol/L',
      'icon': Icons.water_drop_rounded,
      'color': const Color(0xFFF59E0B),
      'current': '6.2',
      'status': 'Cần theo dõi',
      'statusColor': const Color(0xFFF59E0B),
      'history': [
        {'date': '26/09', 'value': '6.2'},
        {'date': '25/09', 'value': '6.8'},
        {'date': '24/09', 'value': '5.9'},
        {'date': '23/09', 'value': '7.1'},
        {'date': '22/09', 'value': '6.5'},
      ],
      'note': 'Đường huyết đói: 3.9-6.1 bình thường. >7.0 cần tái khám ngay.',
    },
    {
      'title': 'SpO2 (Nồng độ oxy)',
      'unit': '%',
      'icon': Icons.air_rounded,
      'color': const Color(0xFF0284C7),
      'current': '98',
      'status': 'Tốt',
      'statusColor': const Color(0xFF10B981),
      'history': [
        {'date': '26/09', 'value': '98'},
        {'date': '25/09', 'value': '97'},
        {'date': '24/09', 'value': '99'},
        {'date': '23/09', 'value': '98'},
        {'date': '22/09', 'value': '97'},
      ],
      'note': 'SpO2 >95%: Bình thường. <90%: Cần đến bệnh viện ngay lập tức.',
    },
    {
      'title': 'Nhịp tim',
      'unit': 'bpm',
      'icon': Icons.monitor_heart_rounded,
      'color': const Color(0xFFF43F5E),
      'current': '72',
      'status': 'Bình thường',
      'statusColor': const Color(0xFF10B981),
      'history': [
        {'date': '26/09', 'value': '72'},
        {'date': '25/09', 'value': '75'},
        {'date': '24/09', 'value': '68'},
        {'date': '23/09', 'value': '80'},
        {'date': '22/09', 'value': '74'},
      ],
      'note': 'Nhịp tim nghỉ bình thường: 60-100 bpm.',
    },
    {
      'title': 'Nhiệt độ cơ thể',
      'unit': '°C',
      'icon': Icons.thermostat_rounded,
      'color': const Color(0xFF8B5CF6),
      'current': '36.6',
      'status': 'Bình thường',
      'statusColor': const Color(0xFF10B981),
      'history': [
        {'date': '26/09', 'value': '36.6'},
        {'date': '25/09', 'value': '36.8'},
        {'date': '24/09', 'value': '36.5'},
        {'date': '23/09', 'value': '37.2'},
        {'date': '22/09', 'value': '36.7'},
      ],
      'note': 'Nhiệt độ bình thường: 36.1-37.2°C. >38°C: Sốt, cần theo dõi.',
    },
  ];

  final TextEditingController _noteController = TextEditingController();

  @override
  void dispose() {
    _noteController.dispose();
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
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                          padding: EdgeInsets.zero,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Theo Dõi Sức Khỏe Tại Nhà',
                            style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ),
                        IconButton(
                          onPressed: () => _showAddRecordModal(context),
                          icon: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.add_rounded, color: Colors.white, size: 20),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_today_rounded, color: Colors.white, size: 16),
                          const SizedBox(width: 8),
                          Text(
                            'Cập nhật gần nhất: Hôm nay, 07:30',
                            style: GoogleFonts.inter(fontSize: 13, color: Colors.white),
                          ),
                          const Spacer(),
                          Text(
                            'Xem báo cáo',
                            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 14),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Health Metrics Grid
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Summary cards in 2-column grid
                  GridView.builder(
                    physics: const NeverScrollableScrollPhysics(),
                    shrinkWrap: true,
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 1.1,
                    ),
                    itemCount: _healthData.length > 4 ? 4 : _healthData.length,
                    itemBuilder: (ctx, i) => _buildHealthCard(_healthData[i]),
                  ),

                  const SizedBox(height: 20),

                  // Detailed history section
                  Text(
                    'Lịch sử chỉ số chi tiết',
                    style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                  ),
                  const SizedBox(height: 14),

                  ..._healthData.map((metric) => _buildMetricHistoryCard(metric)),

                  const SizedBox(height: 20),

                  // Doctor notes section
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFBAE6FD)),
                      boxShadow: [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, 6))],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppTheme.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.medical_information_rounded, color: AppTheme.primary, size: 22),
                            ),
                            const SizedBox(width: 10),
                            Text('Lời dặn từ Bác sĩ', style: GoogleFonts.sora(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Text(
                            'Tiếp tục theo dõi huyết áp và đường huyết hằng ngày. Tái khám tháng sau nếu đường huyết vượt 7.0 mmol/L liên tục. Uống đủ nước, ăn ít tinh bột và luyện tập nhẹ 30 phút/ngày.\n\n— BS. CKI. Nguyễn Văn An, Nội tổng quát',
                            style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF334155), height: 1.55, fontStyle: FontStyle.italic),
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: () {},
                            icon: const Icon(Icons.video_call_rounded, size: 18),
                            label: const Text('Kết nối Bác sĩ gia đình'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppTheme.primary,
                              side: const BorderSide(color: Color(0xFFBAE6FD)),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHealthCard(Map<String, dynamic> metric) {
    return InkWell(
      onTap: () => _showMetricDetail(metric),
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: (metric['color'] as Color).withValues(alpha: 0.2)),
          boxShadow: [BoxShadow(color: (metric['color'] as Color).withValues(alpha: 0.1), blurRadius: 12, offset: const Offset(0, 4))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    color: (metric['color'] as Color).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(metric['icon'] as IconData, color: metric['color'] as Color, size: 18),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: (metric['statusColor'] as Color).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    metric['status'] as String,
                    style: GoogleFonts.inter(fontSize: 9.5, fontWeight: FontWeight.bold, color: metric['statusColor'] as Color),
                  ),
                ),
              ],
            ),
            const Spacer(),
            Text(
              metric['current'] as String,
              style: GoogleFonts.sora(fontSize: 22, fontWeight: FontWeight.w800, color: metric['color'] as Color),
            ),
            Text(metric['unit'] as String, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8))),
            const SizedBox(height: 4),
            Text(
              metric['title'] as String,
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricHistoryCard(Map<String, dynamic> metric) {
    final history = (metric['history'] as List<Map<String, String>>).reversed.take(5).toList();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(metric['icon'] as IconData, color: metric['color'] as Color, size: 18),
              const SizedBox(width: 8),
              Text(metric['title'] as String, style: GoogleFonts.sora(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
              const Spacer(),
              Text(
                '${metric['current']} ${metric['unit']}',
                style: GoogleFonts.sora(fontSize: 15, fontWeight: FontWeight.w700, color: metric['color'] as Color),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: history.map((h) => Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Text(h['value']!, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A))),
                ),
                const SizedBox(height: 4),
                Text(h['date']!, style: GoogleFonts.inter(fontSize: 10.5, color: const Color(0xFF94A3B8))),
              ],
            )).toList(),
          ),
          const SizedBox(height: 10),
          Text(metric['note'] as String,
              style: GoogleFonts.inter(fontSize: 11.5, color: const Color(0xFF64748B), height: 1.4, fontStyle: FontStyle.italic)),
        ],
      ),
    );
  }

  void _showMetricDetail(Map<String, dynamic> metric) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.6,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(child: Container(width: 44, height: 4, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 20),
            Row(
              children: [
                Icon(metric['icon'] as IconData, color: metric['color'] as Color, size: 24),
                const SizedBox(width: 10),
                Text(metric['title'] as String, style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.bold)),
                const Spacer(),
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(ctx);
                    _showAddRecordModal(context, preselected: metric['title'] as String);
                  },
                  icon: const Icon(Icons.add_rounded, size: 16),
                  label: const Text('Thêm'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: metric['color'] as Color,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text('Ghi chú Y tế:', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
            const SizedBox(height: 6),
            Text(metric['note'] as String, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B), height: 1.5)),
            const SizedBox(height: 20),
            Text('Lịch sử đo:', style: GoogleFonts.sora(fontSize: 15, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Expanded(
              child: ListView.builder(
                itemCount: (metric['history'] as List).length,
                itemBuilder: (ctx, i) {
                  final h = (metric['history'] as List<Map<String, String>>)[i];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: i == 0 ? (metric['color'] as Color).withValues(alpha: 0.08) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: i == 0 ? (metric['color'] as Color).withValues(alpha: 0.3) : const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(h['date']!, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B))),
                        Text(
                          '${h['value']!} ${metric['unit']}',
                          style: GoogleFonts.sora(fontSize: 14, fontWeight: FontWeight.bold, color: i == 0 ? (metric['color'] as Color) : const Color(0xFF0F172A)),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddRecordModal(BuildContext context, {String? preselected}) {
    String selectedMetric = preselected ?? _healthData.first['title'] as String;
    final valueController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: Container(
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
              Text('Thêm chỉ số mới', style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: selectedMetric,
                decoration: InputDecoration(
                  labelText: 'Loại chỉ số',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
                items: _healthData.map((m) => DropdownMenuItem(value: m['title'] as String, child: Text(m['title'] as String))).toList(),
                onChanged: (v) => selectedMetric = v!,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: valueController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Giá trị đo',
                  hintText: 'Nhập giá trị...',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Đã lưu chỉ số $selectedMetric: ${valueController.text}')),
                    );
                  },
                  icon: const Icon(Icons.save_rounded),
                  label: const Text('Lưu chỉ số'),
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
      ),
    );
  }
}
