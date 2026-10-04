import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/theme.dart';
import '../../models/patient_model.dart';
import '../../models/queue_ticket_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/queue_provider.dart';

class QueueStatusView extends StatefulWidget {
  const QueueStatusView({super.key});

  @override
  State<QueueStatusView> createState() => _QueueStatusViewState();
}

class _QueueStatusViewState extends State<QueueStatusView> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool isAlertEnabled = true;
  final TextEditingController _searchTicketCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startLiveTracking();
    });
  }

  void _startLiveTracking() {
    final auth = context.read<AuthProvider>();
    final user = auth.user;
    context.read<QueueProvider>().startRealtimePolling(
          patientId: user?.id,
          cccd: user?.soCCCD,
          patientCode: user?.maBenhNhan,
          patientName: user?.hoTen,
        );
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchTicketCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final queue = context.watch<QueueProvider>();
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF0F9FF),
      appBar: AppBar(
        backgroundColor: AppTheme.primaryDark,
        elevation: 0,
        centerTitle: true,
        title: Text(
          'Theo dõi Hàng chờ Trực tiếp',
          style: GoogleFonts.sora(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        actions: [
          IconButton(
            tooltip: 'Làm mới ngay',
            icon: queue.isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.refresh_rounded, color: Colors.white),
            onPressed: () {
              queue.fetchQueue(
                patientId: auth.user?.id,
                cccd: auth.user?.soCCCD,
                patientCode: auth.user?.maBenhNhan,
                patientName: auth.user?.hoTen,
              );
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Đang cập nhật dữ liệu hàng chờ mới nhất...'),
                  duration: Duration(seconds: 1),
                ),
              );
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          labelStyle: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13.5),
          unselectedLabelStyle: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 13.5),
          tabs: const [
            Tab(
              icon: Icon(Icons.confirmation_number_outlined, size: 20),
              text: 'Phiếu của tôi',
            ),
            Tab(
              icon: Icon(Icons.dashboard_outlined, size: 20),
              text: 'Bảng các phòng khám',
            ),
          ],
        ),
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color(0xFFE0F2FE),
              Color(0xFFF0F9FF),
              Color(0xFFE2E8F0),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: TabBarView(
          controller: _tabController,
          children: [
            // TAB 1: PHIẾU CỦA TÔI
            RefreshIndicator(
              onRefresh: () async {
                await queue.fetchQueue(
                  patientId: auth.user?.id,
                  cccd: auth.user?.soCCCD,
                  patientCode: auth.user?.maBenhNhan,
                  patientName: auth.user?.hoTen,
                );
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Live Banner Indicator (Không bị lỗi overflow)
                    _buildLiveConnectionBar(queue),
                    const SizedBox(height: 14),

                    // Cảnh báo khi ĐẾN LƯỢT KHÁM (Calling)
                    if (queue.hasActiveTicket && queue.isMyTurn) ...[
                      _buildCallingAlertBanner(queue.myTicket!),
                      const SizedBox(height: 14),
                    ],

                    // Trường hợp 1: ĐÃ CÓ PHIẾU KHÁM
                    if (queue.hasActiveTicket) ...[
                      _buildActiveTicketHeroCard(queue.myTicket!, queue),
                      const SizedBox(height: 16),
                      _buildQueueProgressMetricsCard(queue),
                      const SizedBox(height: 16),
                      _buildRoomAndDoctorCard(queue.myTicket!),
                      const SizedBox(height: 16),
                      _buildTicketActionButtons(queue.myTicket!, queue),
                    ]
                    // Trường hợp 2: CHƯA CÓ PHIẾU KHÁM HÔM NAY
                    else ...[
                      _buildEmptyTicketCard(queue, auth),
                    ],

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),

            // TAB 2: BẢNG HÀNG CHỜ CÁC KHOA / PHÒNG KHÁM
            RefreshIndicator(
              onRefresh: () async {
                await queue.fetchQueue(silent: false);
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildLiveDepartmentBoardHeader(queue),
                    const SizedBox(height: 14),
                    ...queue.departmentSummaries.map((dept) => _buildDepartmentQueueItem(dept, queue, auth)),
                    const SizedBox(height: 30),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── 1. Live Connection Bar (Tránh tràn pixel) ──────────────────────
  Widget _buildLiveConnectionBar(QueueProvider queue) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFBAE6FD)),
        boxShadow: const [
          BoxShadow(
            color: Color.fromRGBO(2, 132, 199, 0.08),
            blurRadius: 10,
            offset: Offset(0, 3),
          )
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Color(0xFF10B981),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 7),
                Flexible(
                  child: Text(
                    'Trực tuyến • Tự động 3s',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF0369A1),
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            'Hôm nay, ${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}',
            style: GoogleFonts.inter(fontSize: 11.5, color: const Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }

  // ── 2. Calling Alert Banner (Khi gọi loa) ──────────────────────────
  Widget _buildCallingAlertBanner(QueueTicketModel ticket) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF10B981), Color(0xFF059669)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF10B981).withValues(alpha: 0.35),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.campaign_rounded, color: Colors.white, size: 28),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'ĐẾN LƯỢT KHÁM CỦA BẠN!',
                  style: GoogleFonts.sora(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Loa đang mời số #${ticket.sequenceNumber} - ${ticket.patientName} vào ${ticket.departmentName} (${ticket.location}). Xin vui lòng bước vào phòng khám ngay!',
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: Colors.white,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  // ── 3. Active Ticket Hero Card ──────────────────────────────────────
  Widget _buildActiveTicketHeroCard(QueueTicketModel ticket, QueueProvider queue) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.primaryColor, AppTheme.primaryDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color.fromRGBO(2, 132, 199, 0.25),
            blurRadius: 20,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          // Room Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.local_hospital_rounded, color: Colors.white, size: 16),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          '${ticket.departmentName.toUpperCase()} • ${ticket.location.toUpperCase()}',
                          style: GoogleFonts.sora(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                            letterSpacing: 0.5,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              InkWell(
                onTap: () {
                  queue.clearManualTracking();
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'Đổi số khác',
                    style: GoogleFonts.inter(fontSize: 10.5, color: Colors.white, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          Text(
            'SỐ THỨ TỰ CỦA BẠN',
            style: GoogleFonts.inter(
              color: Colors.white.withValues(alpha: 0.85),
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 4),

          // Big Sequence Number
          Text(
            '#${ticket.sequenceNumber}',
            style: GoogleFonts.sora(
              color: Colors.white,
              fontSize: 54,
              fontWeight: FontWeight.w900,
              letterSpacing: 1,
            ),
          ),

          // Priority Tag if Emergency
          if (ticket.isEmergency) ...[
            Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.red.shade600,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '🚨 ĐỐI TƯỢNG ƯU TIÊN',
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 11,
                ),
              ),
            ),
          ],

          // Patient Name & Code
          Text(
            '${ticket.patientName} (${ticket.patientCode.isNotEmpty ? ticket.patientCode : "CCCD: ${ticket.identityCardNumber}"})',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              color: Colors.white.withValues(alpha: 0.95),
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 14),

          // Status & Estimated Time Pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.22),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  ticket.isCalling
                      ? Icons.campaign_rounded
                      : ticket.isProcessing
                          ? Icons.health_and_safety_rounded
                          : Icons.access_time_rounded,
                  color: ticket.isCalling ? const Color(0xFF6EE7B7) : Colors.amberAccent,
                  size: 18,
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    ticket.isCalling
                        ? 'Đang phát loa mời vào phòng!'
                        : ticket.isProcessing
                            ? 'Đang tiến hành khám trong phòng'
                            : queue.remainingAhead == 0
                                ? 'Chuẩn bị tới lượt bạn tiếp theo!'
                                : 'Ước tính còn: ~${queue.estimatedWaitMinutes} phút (${queue.remainingAhead} lượt trước)',
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontSize: 12.5,
                      fontWeight: FontWeight.bold,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── 4. Progress Metrics Card ───────────────────────────────────────
  Widget _buildQueueProgressMetricsCard(QueueProvider queue) {
    final ticket = queue.myTicket!;
    final callingNum = queue.currentCallingNumber;

    double progress = 0.0;
    if (callingNum != null && ticket.sequenceNumber > 0) {
      if (ticket.sequenceNumber <= callingNum) {
        progress = 1.0;
      } else {
        final diff = ticket.sequenceNumber - callingNum;
        progress = (1.0 - (diff / 10.0)).clamp(0.1, 0.95);
      }
    }

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFBAE6FD)),
        boxShadow: const [
          BoxShadow(
            color: Color.fromRGBO(2, 132, 199, 0.1),
            blurRadius: 18,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'Tiến trình Hàng chờ',
                  style: GoogleFonts.sora(
                    fontSize: 14.5,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryDark,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: ticket.statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  ticket.statusDisplay,
                  style: GoogleFonts.inter(
                    fontSize: 11.5,
                    fontWeight: FontWeight.bold,
                    color: ticket.statusColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: _buildMetricTile(
                  title: 'Đang phục vụ',
                  value: callingNum != null ? '#$callingNum' : 'Chưa gọi',
                  color: const Color(0xFF10B981),
                  subtitle: callingNum != null && callingNum == ticket.sequenceNumber
                      ? 'Chính là bạn'
                      : 'Đang trong phòng',
                ),
              ),
              Container(
                height: 48,
                width: 1,
                color: const Color(0xFFE2E8F0),
                margin: const EdgeInsets.symmetric(horizontal: 8),
              ),
              Expanded(
                child: _buildMetricTile(
                  title: 'Lượt chờ trước bạn',
                  value: '${queue.remainingAhead} người',
                  color: queue.remainingAhead == 0 ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                  subtitle: queue.remainingAhead == 0
                      ? 'Tới lượt ngay sau số này'
                      : 'Ước tính ~${queue.estimatedWaitMinutes} phút',
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Progress indicator bar
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: const Color(0xFFE0F2FE),
              valueColor: AlwaysStoppedAnimation<Color>(
                ticket.isCalling ? const Color(0xFF10B981) : AppTheme.primaryColor,
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Stages Indicator (Tối ưu responsive không tràn màn hình)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStepItem('Cấp số', isDone: true),
              _buildStepItem('Đang chờ', isDone: true),
              _buildStepItem('Vào khám', isDone: ticket.isCalling || ticket.isProcessing || ticket.isFinished),
              _buildStepItem('Hoàn tất', isDone: ticket.isFinished),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricTile({
    required String title,
    required String value,
    required Color color,
    required String subtitle,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          title,
          style: GoogleFonts.inter(fontSize: 11.5, color: const Color(0xFF64748B), fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: GoogleFonts.sora(fontSize: 22, fontWeight: FontWeight.w900, color: color),
        ),
        const SizedBox(height: 2),
        Text(
          subtitle,
          style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
        ),
      ],
    );
  }

  Widget _buildStepItem(String title, {required bool isDone}) {
    return Row(
      children: [
        Icon(
          isDone ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
          size: 13,
          color: isDone ? const Color(0xFF10B981) : const Color(0xFF94A3B8),
        ),
        const SizedBox(width: 3),
        Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 10.5,
            fontWeight: isDone ? FontWeight.bold : FontWeight.w500,
            color: isDone ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
          ),
        ),
      ],
    );
  }

  // ── 5. Room & Clinic Info Card ─────────────────────────────────────
  Widget _buildRoomAndDoctorCard(QueueTicketModel ticket) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFBAE6FD)),
        boxShadow: const [
          BoxShadow(
            color: Color.fromRGBO(2, 132, 199, 0.06),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: const BoxDecoration(
                  color: Color(0xFFE0F2FE),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.medical_services_rounded, color: AppTheme.primaryColor, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      ticket.departmentName,
                      style: GoogleFonts.sora(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Địa điểm: ${ticket.location}',
                      style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF0284C7), fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const Divider(height: 22, color: Color(0xFFE2E8F0)),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            value: isAlertEnabled,
            activeThumbColor: AppTheme.primary,
            title: Text(
              'Nhắc nhở chuông & thông báo',
              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A)),
            ),
            subtitle: Text(
              'Tự động rung và báo chuông khi còn 2 lượt hoặc khi được gọi loa',
              style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
            ),
            onChanged: (val) {
              setState(() {
                isAlertEnabled = val;
              });
            },
          ),
        ],
      ),
    );
  }

  // ── 6. Ticket Action Buttons ───────────────────────────────────────
  Widget _buildTicketActionButtons(QueueTicketModel ticket, QueueProvider queue) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 13),
              side: const BorderSide(color: Color(0xFFBAE6FD)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              backgroundColor: Colors.white,
            ),
            icon: const Icon(Icons.qr_code_2_rounded, color: AppTheme.primaryColor),
            label: Text(
              'Mã QR Phiếu',
              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
            ),
            onPressed: () => _showTicketQrDialog(ticket),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 13),
              side: const BorderSide(color: Color(0xFFFECACA)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              backgroundColor: Colors.white,
            ),
            icon: const Icon(Icons.cancel_outlined, color: Color(0xFFEF4444)),
            label: Text(
              'Huỷ lượt khám',
              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFFEF4444)),
            ),
            onPressed: () => _confirmCancelTicket(queue),
          ),
        ),
      ],
    );
  }

  // ── 7. Empty State Card & Ticket Selector ───────────────────────────
  Widget _buildEmptyTicketCard(QueueProvider queue, AuthProvider auth) {
    return Column(
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFBAE6FD)),
            boxShadow: const [
              BoxShadow(
                color: Color.fromRGBO(2, 132, 199, 0.08),
                blurRadius: 18,
                offset: Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(18),
                decoration: const BoxDecoration(
                  color: Color(0xFFF0F9FF),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.confirmation_number_outlined, size: 44, color: AppTheme.primaryColor),
              ),
              const SizedBox(height: 14),
              Text(
                'Hôm nay bạn chưa có số thứ tự',
                style: GoogleFonts.sora(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
              ),
              const SizedBox(height: 6),
              Text(
                'Bạn có thể lấy số thứ tự khám trực tuyến ngay trên ứng dụng mà không cần phải xếp hàng tại quầy tiếp đón bệnh viện.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B), height: 1.45),
              ),
              const SizedBox(height: 18),

              // Big Issue Ticket Button
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 4,
                ),
                icon: const Icon(Icons.add_circle_outline_rounded),
                label: Text(
                  'Lấy số thứ tự khám trực tuyến',
                  style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                onPressed: () => _showIssueTicketModal(queue, auth),
              ),
              const SizedBox(height: 12),

              // Quick Search Input to track by ticket number / CCCD
              Container(
                margin: const EdgeInsets.only(top: 8),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.search_rounded, size: 18, color: Color(0xFF64748B)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _searchTicketCtrl,
                        decoration: InputDecoration(
                          hintText: 'Nhập số phiếu (ví dụ: 101) hoặc CCCD...',
                          hintStyle: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                          border: InputBorder.none,
                          isDense: true,
                        ),
                        style: GoogleFonts.inter(fontSize: 12.5),
                        onSubmitted: (val) {
                          _handleSearchTicket(val, queue);
                        },
                      ),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0369A1),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        minimumSize: Size.zero,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      onPressed: () {
                        _handleSearchTicket(_searchTicketCtrl.text, queue);
                      },
                      child: Text('Tìm', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        // Danh sách phiếu khám trong ngày (nếu có trên hệ thống)
        if (queue.allTickets.isNotEmpty) ...[
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFBAE6FD)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Phiếu khám trong ngày trên hệ thống',
                      style: GoogleFonts.sora(fontSize: 13.5, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                    ),
                    Text(
                      '${queue.allTickets.length} phiếu',
                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF0284C7)),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ...queue.allTickets.map((t) => Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0F9FF),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFBAE6FD)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryColor,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              '#${t.sequenceNumber}',
                              style: GoogleFonts.sora(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  t.patientName,
                                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                                ),
                                Text(
                                  '${t.departmentName} • ${t.statusDisplay}',
                                  style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                                ),
                              ],
                            ),
                          ),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF0284C7),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              minimumSize: Size.zero,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            onPressed: () {
                              queue.trackTicket(t);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  backgroundColor: const Color(0xFF10B981),
                                  content: Text('Đang theo dõi phiếu #${t.sequenceNumber} của ${t.patientName}!'),
                                ),
                              );
                            },
                            child: Text('Theo dõi', style: GoogleFonts.inter(fontSize: 11.5, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    )),
              ],
            ),
          ),
        ],
      ],
    );
  }

  void _handleSearchTicket(String query, QueueProvider queue) {
    if (query.trim().isEmpty) return;
    final success = queue.trackByNumberOrQuery(query);
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFF10B981),
          content: Text('Đã tìm thấy và theo dõi phiếu #${queue.myTicket?.sequenceNumber}!'),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Colors.orange,
          content: Text('Không tìm thấy phiếu phù hợp trong ngày hôm nay.'),
        ),
      );
    }
  }

  // ── 8. Department Board (Tab 2) ────────────────────────────────────
  Widget _buildLiveDepartmentBoardHeader(QueueProvider queue) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFBAE6FD)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'Bảng Hàng chờ Bệnh viện',
                  style: GoogleFonts.sora(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '${queue.departmentSummaries.length} phòng',
                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF059669)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Theo dõi số thứ tự đang được phục vụ tại từng phòng khám theo thời gian thực.',
            style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }

  Widget _buildDepartmentQueueItem(
    DepartmentQueueSummary dept,
    QueueProvider queue,
    AuthProvider auth,
  ) {
    final isServing = dept.currentCallingNumber != null;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFBAE6FD)),
        boxShadow: const [
          BoxShadow(
            color: Color.fromRGBO(2, 132, 199, 0.05),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          // STT Calling Box
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: isServing ? const Color(0xFFF0FDF4) : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isServing ? const Color(0xFF86EFAC) : const Color(0xFFE2E8F0),
                width: 1.5,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Đang gọi',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: isServing ? const Color(0xFF15803D) : const Color(0xFF94A3B8),
                  ),
                ),
                Text(
                  isServing ? '#${dept.currentCallingNumber}' : '---',
                  style: GoogleFonts.sora(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: isServing ? const Color(0xFF15803D) : const Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 14),

          // Department details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  dept.departmentName,
                  style: GoogleFonts.sora(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 14, color: Color(0xFF64748B)),
                    const SizedBox(width: 4),
                    Text(
                      dept.location,
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'Đang chờ: ${dept.totalWaiting} người',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFFB45309),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Tổng hôm nay: ${dept.totalServingToday}',
                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Fast Take Ticket Button
          if (!queue.hasActiveTicket)
            IconButton(
              icon: const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AppTheme.primaryColor),
              onPressed: () {
                _confirmIssueForDepartment(dept, queue, auth);
              },
            ),
        ],
      ),
    );
  }

  // ── 9. Dialogs & Actions ───────────────────────────────────────────

  /// Modal Lấy số thứ tự trực tuyến
  void _showIssueTicketModal(QueueProvider queue, AuthProvider auth) {
    String? selectedDeptId = queue.departments.isNotEmpty ? queue.departments.first['id'] : null;
    String selectedPriority = 'Normal';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (modalCtx, setModalState) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(modalCtx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Lấy Số Thứ Tự Khám Trực Tuyến',
                style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
              ),
              Text(
                'Chọn chuyên khoa phòng khám cần khám để lấy phiếu STT',
                style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF64748B)),
              ),
              const SizedBox(height: 18),

              // Department Select
              Text(
                'Chuyên khoa / Phòng khám',
                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF334155)),
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFBAE6FD)),
                  color: const Color(0xFFF0F9FF),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    isExpanded: true,
                    value: selectedDeptId,
                    hint: const Text('Chọn chuyên khoa khám'),
                    items: queue.departments.map((d) {
                      return DropdownMenuItem<String>(
                        value: d['id'].toString(),
                        child: Text(
                          '${d['departmentName']} (${d['location']})',
                          style: GoogleFonts.inter(fontSize: 13.5, fontWeight: FontWeight.w600),
                        ),
                      );
                    }).toList(),
                    onChanged: (val) {
                      setModalState(() {
                        selectedDeptId = val;
                      });
                    },
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Priority Select
              Text(
                'Đối tượng khám',
                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF334155)),
              ),
              const SizedBox(height: 6),
              Wrap(
                spacing: 8,
                children: [
                  ChoiceChip(
                    label: const Text('Khám thông thường'),
                    selected: selectedPriority == 'Normal',
                    onSelected: (val) {
                      setModalState(() => selectedPriority = 'Normal');
                    },
                  ),
                  ChoiceChip(
                    label: const Text('🚨 Cấp cứu / Ưu tiên'),
                    selected: selectedPriority == 'Emergency',
                    onSelected: (val) {
                      setModalState(() => selectedPriority = 'Emergency');
                    },
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Confirm Button
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: () async {
                  if (selectedDeptId == null) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Vui lòng chọn phòng khám cần đăng ký!')),
                    );
                    return;
                  }

                  Navigator.pop(ctx);
                  try {
                    final currentPatient = auth.user ??
                        PatientModel(
                          id: '',
                          maBenhNhan: '',
                          hoTen: 'Bệnh nhân mới',
                          gioiTinh: 'Nam',
                          ngaySinh: '1995-01-01',
                          soCCCD: '038090${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
                        );
                    final ticket = await queue.issueOnlineTicket(
                      departmentId: selectedDeptId!,
                      patient: currentPatient,
                      priority: selectedPriority,
                    );
                    _tabController.animateTo(0);
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          backgroundColor: const Color(0xFF10B981),
                          content: Text('Cấp số thành công: Phiếu #${ticket.sequenceNumber}!'),
                        ),
                      );
                    }
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          backgroundColor: Colors.red,
                          content: Text('Lỗi cấp số: $e'),
                        ),
                      );
                    }
                  }
                },
                child: Text(
                  'Xác nhận Lấy số ngay',
                  style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _confirmIssueForDepartment(
    DepartmentQueueSummary dept,
    QueueProvider queue,
    AuthProvider auth,
  ) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Text('Xác nhận lấy số khám', style: GoogleFonts.sora(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Text(
          'Bạn muốn lấy số thứ tự trực tuyến tại:\n${dept.departmentName} (${dept.location})?',
          style: GoogleFonts.inter(fontSize: 13.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                final currentPatient = auth.user ??
                    PatientModel(
                      id: '',
                      maBenhNhan: '',
                      hoTen: 'Bệnh nhân mới',
                      gioiTinh: 'Nam',
                      ngaySinh: '1995-01-01',
                      soCCCD: '038090${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
                    );
                final ticket = await queue.issueOnlineTicket(
                  departmentId: dept.departmentId,
                  patient: currentPatient,
                );
                _tabController.animateTo(0);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      backgroundColor: const Color(0xFF10B981),
                      content: Text('Đã cấp số #${ticket.sequenceNumber} thành công!'),
                    ),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(backgroundColor: Colors.red, content: Text('Lỗi: $e')),
                  );
                }
              }
            },
            child: const Text('Lấy số ngay', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  /// Hiển thị mã QR phiếu khám
  void _showTicketQrDialog(QueueTicketModel ticket) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'MÃ QR PHIẾU KHÁM',
                style: GoogleFonts.sora(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
              ),
              const SizedBox(height: 6),
              Text(
                'Xuất trình mã QR tại cửa phòng khám để nhân viên quét xác thực',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 11.5, color: const Color(0xFF64748B)),
              ),
              const SizedBox(height: 16),
              QrImageView(
                data: 'https://dmedical.hospital.vn/queue/${ticket.id}',
                version: QrVersions.auto,
                size: 180,
                backgroundColor: Colors.white,
              ),
              const SizedBox(height: 12),
              Text(
                'STT: #${ticket.sequenceNumber}',
                style: GoogleFonts.sora(fontSize: 26, fontWeight: FontWeight.w900, color: AppTheme.primaryColor),
              ),
              Text(
                '${ticket.patientName} • ${ticket.departmentName}',
                style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  minimumSize: const Size.fromHeight(42),
                ),
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Đóng', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Xác nhận huỷ vé
  void _confirmCancelTicket(QueueProvider queue) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Text('Xác nhận huỷ số thứ tự?', style: GoogleFonts.sora(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Text(
          'Sau khi huỷ, số thứ tự hiện tại của bạn sẽ bị xoá khỏi hàng chờ của phòng khám.',
          style: GoogleFonts.inter(fontSize: 13.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Quay lại'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
            onPressed: () async {
              Navigator.pop(ctx);
              await queue.cancelMyTicket();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Đã huỷ số thứ tự khám.')),
                );
              }
            },
            child: const Text('Xác nhận huỷ', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
