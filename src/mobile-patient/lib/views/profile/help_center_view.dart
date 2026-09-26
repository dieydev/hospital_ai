import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';

class HelpCenterView extends StatefulWidget {
  const HelpCenterView({super.key});

  @override
  State<HelpCenterView> createState() => _HelpCenterViewState();
}

class _HelpCenterViewState extends State<HelpCenterView> {
  final TextEditingController _feedbackController = TextEditingController();
  int _satisfactionRating = 0;
  String _selectedFeedbackCategory = 'Chất lượng khám chữa bệnh';

  final List<String> _feedbackCategories = [
    'Chất lượng khám chữa bệnh',
    'Thái độ nhân viên y tế',
    'Cơ sở vật chất',
    'Thủ tục hành chính',
    'Ứng dụng D-Medical',
    'Khác',
  ];

  @override
  void dispose() {
    _feedbackController.dispose();
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
                          Text('Hỗ trợ & Lắng nghe', style: GoogleFonts.sora(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
                          Text('D-Medical luôn sẵn sàng hỗ trợ bạn', style: GoogleFonts.inter(fontSize: 12, color: Colors.white.withValues(alpha: 0.8))),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Emergency Contact Card
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFEF4444), Color(0xFFDC2626)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [BoxShadow(color: const Color(0xFFEF4444).withValues(alpha: 0.3), blurRadius: 16, offset: const Offset(0, 6))],
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), shape: BoxShape.circle),
                          child: const Icon(Icons.emergency_rounded, color: Colors.white, size: 28),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Cấp cứu Bệnh viện', style: GoogleFonts.sora(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
                              Text('Hoạt động 24/7 - Không chờ đợi', style: GoogleFonts.inter(fontSize: 12, color: Colors.white.withValues(alpha: 0.85))),
                              const SizedBox(height: 4),
                              Text('(028) 3855 4269', style: GoogleFonts.sora(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
                          child: const Icon(Icons.phone_rounded, color: Color(0xFFEF4444), size: 24),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Customer Service Card
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFBAE6FD)),
                      boxShadow: [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.08), blurRadius: 16, offset: const Offset(0, 6))],
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: const Color(0xFFE0F2FE), borderRadius: BorderRadius.circular(16)),
                          child: const Icon(Icons.headset_mic_rounded, color: AppTheme.primary, size: 28),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Tổng đài CSKH', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                              Text('1900 7178', style: GoogleFonts.sora(fontSize: 22, fontWeight: FontWeight.w800, color: AppTheme.primary)),
                              Text('T2-CN: 06:00 - 22:00 (Phím 1: Đặt khám, Phím 2: Hỗ trợ)', style: GoogleFonts.inter(fontSize: 11.5, color: const Color(0xFF64748B))),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: const Color(0xFFE0F2FE), borderRadius: BorderRadius.circular(14)),
                          child: const Icon(Icons.phone_in_talk_rounded, color: AppTheme.primary, size: 24),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Contact Channels
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Kênh liên hệ khác', style: GoogleFonts.sora(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                        const SizedBox(height: 14),
                        _buildContactTile(Icons.email_rounded, const Color(0xFF0EA5E9), 'Email hỗ trợ', 'cskh@dmedical.vn', () {}),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        _buildContactTile(Icons.chat_rounded, const Color(0xFF10B981), 'Zalo OA', '@BenhVienDMedical', () {}),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        _buildContactTile(Icons.location_on_rounded, AppTheme.primary, 'Địa chỉ', '215 Hồng Bàng, P.11, Q.5, TP.HCM', () {}),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // FAQ Section
                  Text('Câu hỏi thường gặp (FAQ)', style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A))),
                  const SizedBox(height: 12),

                  _buildFaqItem(
                    'Làm thế nào để lấy số thứ tự trực tuyến?',
                    'Vào tab "Trang chủ", bấm "Đặt khám" và chọn chuyên khoa. Số thứ tự sẽ được cấp tự động sau khi đặt thành công. Bạn cũng có thể chọn ngày giờ cụ thể để đặt hẹn trước.',
                    Icons.queue_rounded,
                  ),
                  _buildFaqItem(
                    'Tôi có thể sử dụng Thẻ BHYT điện tử thay thẻ giấy không?',
                    'Có. Mã QR trên Thẻ BHYT điện tử trong ứng dụng hoàn toàn có giá trị pháp lý và được chấp nhận tại tất cả quầy tiếp nhận. Chỉ cần mở ứng dụng và hiển thị mã QR cho nhân viên quét.',
                    Icons.badge_rounded,
                  ),
                  _buildFaqItem(
                    'Làm sao để thanh toán viện phí qua app?',
                    'Sau khi khám xong, vào mục "Thanh toán viện phí" trong tab Chức năng. Hệ thống sẽ hiển thị hóa đơn chi tiết. Bạn có thể quét mã VietQR bằng bất kỳ ứng dụng Ngân hàng/Ví điện tử nào.',
                    Icons.payment_rounded,
                  ),
                  _buildFaqItem(
                    'Dữ liệu hồ sơ bệnh án của tôi có được bảo mật không?',
                    'Hoàn toàn bảo mật. Dữ liệu được mã hóa theo tiêu chuẩn Y tế Quốc tế và chỉ có bạn hoặc bác sĩ được ủy quyền mới có thể xem được. D-Medical tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.',
                    Icons.security_rounded,
                  ),
                  _buildFaqItem(
                    'Làm thế nào để đặt lịch tái khám?',
                    'Bác sĩ sẽ ghi lịch tái khám vào hồ sơ điện tử của bạn. Ứng dụng sẽ tự động nhắc nhở trước 1-3 ngày. Bạn cũng có thể chủ động đặt lịch qua mục "Đặt khám" và chọn đúng bác sĩ đã khám.',
                    Icons.event_repeat_rounded,
                  ),
                  const SizedBox(height: 24),

                  // Feedback Form
                  Text('Gửi phản hồi đến Bệnh viện', style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A))),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFBAE6FD)),
                      boxShadow: [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.07), blurRadius: 16, offset: const Offset(0, 6))],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Satisfaction Rating
                        Text('Mức độ hài lòng của bạn:', style: GoogleFonts.inter(fontSize: 13.5, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: List.generate(5, (i) {
                            return GestureDetector(
                              onTap: () => setState(() => _satisfactionRating = i + 1),
                              child: Column(
                                children: [
                                  Icon(
                                    Icons.star_rounded,
                                    size: 36,
                                    color: i < _satisfactionRating ? const Color(0xFFF59E0B) : const Color(0xFFE2E8F0),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    ['Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Rất tốt'][i],
                                    style: GoogleFonts.inter(
                                      fontSize: 10,
                                      color: i < _satisfactionRating ? const Color(0xFFF59E0B) : const Color(0xFF94A3B8),
                                      fontWeight: i < _satisfactionRating ? FontWeight.bold : FontWeight.normal,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }),
                        ),
                        const SizedBox(height: 16),

                        // Category Selector
                        Text('Danh mục phản hồi:', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          initialValue: _selectedFeedbackCategory,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFBAE6FD))),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.primary)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          ),
                          items: _feedbackCategories
                              .map((c) => DropdownMenuItem(value: c, child: Text(c, style: GoogleFonts.inter(fontSize: 13))))
                              .toList(),
                          onChanged: (v) => setState(() => _selectedFeedbackCategory = v!),
                        ),
                        const SizedBox(height: 12),

                        // Feedback Text
                        TextField(
                          controller: _feedbackController,
                          maxLines: 4,
                          style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF0F172A)),
                          decoration: InputDecoration(
                            hintText: 'Nhập nội dung phản hồi của bạn tại đây...',
                            hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.primary)),
                            contentPadding: const EdgeInsets.all(14),
                          ),
                        ),
                        const SizedBox(height: 16),

                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: _satisfactionRating == 0
                                ? null
                                : () {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('Cảm ơn! Phản hồi "${_selectedFeedbackCategory}" đã được ghi nhận.'),
                                        backgroundColor: const Color(0xFF10B981),
                                      ),
                                    );
                                    setState(() {
                                      _satisfactionRating = 0;
                                      _feedbackController.clear();
                                    });
                                  },
                            icon: const Icon(Icons.send_rounded),
                            label: const Text('Gửi phản hồi'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              disabledBackgroundColor: const Color(0xFFCBD5E1),
                            ),
                          ),
                        ),
                        if (_satisfactionRating == 0)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              '* Vui lòng chọn mức độ hài lòng trước khi gửi',
                              style: GoogleFonts.inter(fontSize: 11.5, color: const Color(0xFF94A3B8)),
                              textAlign: TextAlign.center,
                            ),
                          ),
                      ],
                    ),
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

  Widget _buildContactTile(IconData icon, Color color, String title, String value, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, color: color, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8))),
                    Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A))),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: Colors.grey[400], size: 18),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFaqItem(String question, String answer, IconData icon) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 3))],
      ),
      child: ExpansionTile(
        leading: Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(color: AppTheme.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: AppTheme.primary, size: 18),
        ),
        title: Text(
          question,
          style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13.5, color: AppTheme.primaryDark),
        ),
        iconColor: AppTheme.primary,
        collapsedIconColor: const Color(0xFF94A3B8),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        expandedCrossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF0F9FF),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              answer,
              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF475569), height: 1.55),
            ),
          ),
        ],
      ),
    );
  }
}
