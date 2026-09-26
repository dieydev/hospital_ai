import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../profile/complete_profile_view.dart';

class HospitalPaymentView extends StatefulWidget {
  const HospitalPaymentView({super.key});

  @override
  State<HospitalPaymentView> createState() => _HospitalPaymentViewState();
}

class _HospitalPaymentViewState extends State<HospitalPaymentView> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final List<Map<String, dynamic>> _pendingBills = [
    {
      'billId': 'HD2026092601',
      'date': '26/09/2026',
      'department': 'Nội tổng quát',
      'doctor': 'BS. CKI. Nguyễn Văn An',
      'services': [
        {'name': 'Khám bệnh', 'price': 100000},
        {'name': 'Siêu âm tổng quát', 'price': 250000},
        {'name': 'Xét nghiệm máu cơ bản', 'price': 180000},
      ],
      'total': 530000,
      'insurance': 'BHYT',
      'insuranceCoverage': 0.8,
      'status': 'Chờ thanh toán',
    },
    {
      'billId': 'HD2026092301',
      'date': '23/09/2026',
      'department': 'Tim mạch',
      'doctor': 'BS. CKII. Trần Thị Bảo',
      'services': [
        {'name': 'Khám chuyên khoa tim mạch', 'price': 200000},
        {'name': 'Điện tim (ECG)', 'price': 120000},
      ],
      'total': 320000,
      'insurance': 'Không có BHYT',
      'insuranceCoverage': 0.0,
      'status': 'Chờ thanh toán',
    },
  ];

  final List<Map<String, dynamic>> _paidBills = [
    {
      'billId': 'HD2026091501',
      'date': '15/09/2026',
      'department': 'Nội tiết',
      'doctor': 'BS. Lê Văn Cường',
      'total': 450000,
      'paidAmount': 90000,
      'paidDate': '15/09/2026',
      'paymentMethod': 'VietQR - Vietcombank',
      'status': 'Đã thanh toán',
    },
    {
      'billId': 'HD2026090101',
      'date': '01/09/2026',
      'department': 'Cơ xương khớp',
      'doctor': 'BS. CKI. Phạm Thị Dung',
      'total': 680000,
      'paidAmount': 136000,
      'paidDate': '01/09/2026',
      'paymentMethod': 'MoMo',
      'status': 'Đã thanh toán',
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

  String _formatCurrency(int amount) {
    return '${amount.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')}đ';
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (!auth.isProfileComplete) {
      return Scaffold(
        backgroundColor: const Color(0xFFF4F8FA),
        appBar: AppBar(
          title: Text('Thanh Toán Viện Phí', style: GoogleFonts.sora(fontWeight: FontWeight.bold, color: Colors.white)),
          backgroundColor: AppTheme.primaryDark,
          elevation: 0,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFBAE6FD)),
                boxShadow: [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.1), blurRadius: 20, offset: const Offset(0, 8))],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.credit_card_rounded, size: 52, color: AppTheme.primary),
                  ),
                  const SizedBox(height: 20),
                  Text('Cần hoàn tất hồ sơ', style: GoogleFonts.sora(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                  const SizedBox(height: 10),
                  Text(
                    'Để tra cứu và thanh toán viện phí, bạn cần cập nhật CCCD và thông tin cá nhân đầy đủ.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(fontSize: 13.5, color: const Color(0xFF64748B), height: 1.5),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CompleteProfileView(isDismissible: true))),
                      icon: const Icon(Icons.person_add_alt_1_rounded),
                      label: const Text('Hoàn thiện hồ sơ ngay'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
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
                              Text('Thanh Toán Viện Phí', style: GoogleFonts.sora(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
                              Text('Mã BN: ${auth.user?.maBenhNhan ?? 'BN000000'}',
                                  style: GoogleFonts.inter(fontSize: 12, color: Colors.white.withValues(alpha: 0.8))),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.receipt_long_rounded, color: Colors.white, size: 14),
                              const SizedBox(width: 4),
                              Text(
                                '${_pendingBills.length} cần TT',
                                style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                            ],
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
                      Tab(text: 'Chờ thanh toán'),
                      Tab(text: 'Lịch sử'),
                    ],
                  ),
                ],
              ),
            ),
          ),

          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildPendingBills(),
                _buildPaidBills(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPendingBills() {
    if (_pendingBills.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle_outline_rounded, size: 64, color: Colors.grey[300]),
            const SizedBox(height: 12),
            Text('Không có hóa đơn chờ thanh toán', style: GoogleFonts.sora(fontSize: 16, color: const Color(0xFF94A3B8))),
          ],
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _pendingBills.length,
      itemBuilder: (ctx, i) => _buildPendingBillCard(_pendingBills[i]),
    );
  }

  Widget _buildPendingBillCard(Map<String, dynamic> bill) {
    final services = bill['services'] as List<Map<String, dynamic>>;
    final total = bill['total'] as int;
    final coverage = bill['insuranceCoverage'] as double;
    final patientPay = (total * (1 - coverage)).round();

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFBAE6FD), width: 1.5),
        boxShadow: [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.08), blurRadius: 16, offset: const Offset(0, 6))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
            decoration: const BoxDecoration(
              color: Color(0xFFF0F9FF),
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.receipt_rounded, color: AppTheme.primary, size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Hóa đơn #${bill['billId']}',
                          style: GoogleFonts.sora(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                      Text('Ngày khám: ${bill['date']}',
                          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text('Chờ TT',
                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFFD97706))),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Department & Doctor
                Row(
                  children: [
                    const Icon(Icons.local_hospital_rounded, color: Color(0xFF64748B), size: 14),
                    const SizedBox(width: 6),
                    Text('${bill['department']} • ${bill['doctor']}',
                        style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF475569))),
                  ],
                ),
                const SizedBox(height: 14),

                // Services breakdown
                ...services.map((s) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 3),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(s['name'] as String,
                          style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF334155))),
                      Text(_formatCurrency(s['price'] as int),
                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A))),
                    ],
                  ),
                )),

                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 10),
                  child: Divider(color: Color(0xFFE2E8F0)),
                ),

                // Total
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Tổng cộng:', style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF334155))),
                    Text(_formatCurrency(total), style: GoogleFonts.sora(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                  ],
                ),
                if (coverage > 0) ...[
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('BHYT chi trả (${(coverage * 100).round()}%):', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF10B981))),
                      Text('-${_formatCurrency((total * coverage).round())}', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF10B981))),
                    ],
                  ),
                ],
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0F9FF),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFBAE6FD)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Bệnh nhân thanh toán:', style: GoogleFonts.sora(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF0369A1))),
                      Text(_formatCurrency(patientPay), style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.primary)),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Payment Methods
                Row(
                  children: [
                    Expanded(
                      child: _buildPaymentButton(
                        'VietQR',
                        Icons.qr_code_rounded,
                        const Color(0xFF0284C7),
                        () => _showQRPayment(bill, patientPay),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildPaymentButton(
                        'VNPAY',
                        Icons.payment_rounded,
                        const Color(0xFF059669),
                        () => _showVNPayModal(bill, patientPay),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildPaymentButton(
                        'MoMo',
                        Icons.account_balance_wallet_rounded,
                        const Color(0xFFAE2070),
                        () => _showMomoModal(bill, patientPay),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentButton(String label, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 4),
            Text(label, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _buildPaidBills() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _paidBills.length,
      itemBuilder: (ctx, i) {
        final bill = _paidBills[i];
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
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 20),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Hóa đơn #${bill['billId']}',
                            style: GoogleFonts.sora(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                        Text('${bill['department']} • ${bill['date']}',
                            style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD1FAE5),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text('Đã TT',
                        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF059669))),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Đã thanh toán:', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF475569))),
                  Text(_formatCurrency(bill['paidAmount'] as int),
                      style: GoogleFonts.sora(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF10B981))),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(Icons.payment_rounded, size: 13, color: Colors.grey[400]),
                  const SizedBox(width: 4),
                  Text(bill['paymentMethod'] as String, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8))),
                  const Spacer(),
                  TextButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.download_rounded, size: 14),
                    label: const Text('Tải HĐ'),
                    style: TextButton.styleFrom(
                      foregroundColor: AppTheme.primary,
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      textStyle: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  void _showQRPayment(Map<String, dynamic> bill, int amount) {
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
          children: [
            Container(width: 44, height: 4, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 20),
            Text('Thanh toán VietQR', style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Text('Mở ứng dụng ngân hàng, chọn Quét mã QR', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B))),
            const SizedBox(height: 20),
            Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                color: const Color(0xFFF0F9FF),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFBAE6FD), width: 2),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.qr_code_rounded, size: 100, color: Color(0xFF0284C7)),
                  const SizedBox(height: 8),
                  Text('QR sẽ được tải từ server', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)), textAlign: TextAlign.center),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(14)),
              child: Column(
                children: [
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text('Tài khoản:', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B))),
                    Text('Bệnh viện D-Medical', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold)),
                  ]),
                  const SizedBox(height: 6),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text('Số tiền:', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B))),
                    Text(_formatCurrency(amount), style: GoogleFonts.sora(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primary)),
                  ]),
                  const SizedBox(height: 6),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text('Nội dung:', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B))),
                    Text('TT ${bill['billId']}', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                  ]),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Đang chờ xác nhận thanh toán...')),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: Text('Đã thanh toán xong', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showVNPayModal(Map<String, dynamic> bill, int amount) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Đang chuyển hướng đến cổng thanh toán VNPAY...')),
    );
  }

  void _showMomoModal(Map<String, dynamic> bill, int amount) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Đang mở ứng dụng MoMo...')),
    );
  }
}
