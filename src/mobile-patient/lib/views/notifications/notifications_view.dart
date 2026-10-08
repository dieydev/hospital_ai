import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/appointment_provider.dart';
import '../../providers/queue_provider.dart';
import '../appointment/book_appointment_view.dart';
import '../appointment/medical_history_view.dart';
import '../appointment/my_appointments_view.dart';

class NotificationsView extends StatefulWidget {
  const NotificationsView({super.key});

  @override
  State<NotificationsView> createState() => _NotificationsViewState();
}

class _NotificationsViewState extends State<NotificationsView>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final Set<String> _readItems = {};

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = context.read<AuthProvider>().user;
      if (user != null) {
        context.read<AppointmentProvider>().fetchMyAppointments(
              user.soDienThoai,
              patientCode: user.maBenhNhan,
            );
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  final List<Map<String, dynamic>> _allNotifications = [
    {
      'title': 'Nhắc lịch khám sắp tới',
      'desc': 'Quý khách có lịch hẹn Nội tổng quát - BS. Nguyễn Văn A vào lúc 08:30 sáng mai (27/09/2026). Vui lòng có mặt trước 15 phút.',
      'time': '10 phút trước',
      'icon': Icons.calendar_month_rounded,
      'color': AppTheme.primary,
      'type': 'appointment',
      'priority': 'high',
    },
    {
      'title': 'Kết quả cận lâm sàng đã sẵn sàng',
      'desc': 'Kết quả xét nghiệm Sinh hóa máu toàn phần đã được BS. Trần Thị B ký duyệt điện tử. Nhấn để xem chi tiết.',
      'time': '2 giờ trước',
      'icon': Icons.biotech_rounded,
      'color': const Color(0xFF10B981),
      'type': 'medical',
      'priority': 'high',
    },
    {
      'title': 'Cập nhật hồ sơ bệnh nhân',
      'desc': 'Vui lòng hoàn tất thông tin cá nhân và số CCCD để được cấp mã BN tự động và sử dụng đầy đủ các dịch vụ.',
      'time': 'Hôm qua, 14:30',
      'icon': Icons.badge_outlined,
      'color': const Color(0xFFF59E0B),
      'type': 'system',
      'priority': 'medium',
    },
    {
      'title': 'Thanh toán viện phí thành công',
      'desc': 'Bạn đã thanh toán thành công viện phí 250.000đ cho lần khám ngày 24/09/2026. Hoá đơn điện tử đã được gửi về email.',
      'time': '2 ngày trước',
      'icon': Icons.check_circle_rounded,
      'color': const Color(0xFF10B981),
      'type': 'payment',
      'priority': 'low',
    },
    {
      'title': 'Thông báo từ Bệnh viện D-Medical',
      'desc': 'Bệnh viện D-Medical mở rộng khung giờ khám ngoài giờ thứ 7, Chủ Nhật từ 07:00 đến 20:00. Áp dụng từ 01/10/2026.',
      'time': '3 ngày trước',
      'icon': Icons.campaign_rounded,
      'color': const Color(0xFF6366F1),
      'type': 'hospital',
      'priority': 'low',
    },
    {
      'title': 'Nhắc uống thuốc',
      'desc': 'Nhắc nhở: Thuốc Paracetamol 500mg - 2 viên sau ăn sáng. Omeprazole 20mg - 1 viên trước ăn tối. Theo đơn BS. Lê Văn C.',
      'time': '4 ngày trước',
      'icon': Icons.medication_rounded,
      'color': const Color(0xFFEF4444),
      'type': 'medication',
      'priority': 'medium',
    },
  ];

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final aptProvider = context.watch<AppointmentProvider>();
    final queueProvider = context.watch<QueueProvider>();

    final List<Map<String, dynamic>> dynamicAppointmentNotifs = [];

    // 1. Thông báo số thứ tự hàng chờ trực tiếp
    if (queueProvider.currentTicket != null) {
      final ticket = queueProvider.currentTicket!;
      dynamicAppointmentNotifs.add({
        'title': 'Số thứ tự khám bệnh: #${ticket.ticketNumber}',
        'desc': 'Khoa: ${ticket.departmentName} - Phòng ${ticket.roomNumber}. Hiện có ${queueProvider.waitingAheadCount} người đang chờ trước bạn.',
        'time': 'Thời gian thực',
        'icon': Icons.queue_rounded,
        'color': const Color(0xFF0284C7),
        'type': 'appointment',
        'priority': 'high',
      });
    }

    // 2. Thông báo lịch hẹn thực tế của người bệnh
    for (final apt in aptProvider.myAppointments) {
      final status = apt['status']?.toString() ?? 'Pending';
      final statusText = status == 'Confirmed'
          ? 'Đã được bệnh viện duyệt & xác nhận'
          : status == 'Cancelled'
              ? 'Đã hủy lịch hẹn'
              : 'Đã tạo phiếu - Chờ tiếp nhận';
      final color = status == 'Confirmed'
          ? const Color(0xFF10B981)
          : status == 'Cancelled'
              ? const Color(0xFFEF4444)
              : const Color(0xFF0284C7);

      dynamicAppointmentNotifs.add({
        'title': 'Lịch khám: ${apt['departmentName'] ?? 'Chuyên khoa'}',
        'desc': 'Bác sĩ: ${apt['doctorName'] ?? 'Bác sĩ chuyên khoa'}. Thời gian: ${apt['appointmentTime'] ?? ''} ngày ${apt['appointmentDate'] ?? ''}. Trạng thái: $statusText.',
        'time': 'Phiếu hẹn trực tuyến',
        'icon': Icons.calendar_month_rounded,
        'color': color,
        'type': 'appointment',
        'priority': 'high',
      });
    }

    final allItems = [...dynamicAppointmentNotifs, ..._allNotifications];
    final appointments = allItems.where((n) => n['type'] == 'appointment' || n['type'] == 'medical').toList();
    final systemNotifications = allItems.where((n) => n['type'] == 'system' || n['type'] == 'hospital' || n['type'] == 'payment' || n['type'] == 'medication').toList();
    final unreadCount = allItems.where((e) => !_readItems.contains(e['title'] as String)).length;

    return Scaffold(
      backgroundColor: const Color(0xFFF4F8FA),
      body: Column(
        children: [
          // Custom App Bar
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
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Thông Báo',
                                style: GoogleFonts.sora(
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              if (unreadCount > 0)
                                Text(
                                  '$unreadCount thông báo chưa đọc',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: Colors.white.withValues(alpha: 0.8),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        // Mark all as read
                        TextButton.icon(
                          onPressed: () {
                            setState(() {
                              for (final item in allItems) {
                                _readItems.add(item['title'] as String);
                              }
                            });
                          },
                          icon: const Icon(Icons.done_all_rounded, color: Colors.white, size: 18),
                          label: Text(
                            'Đọc tất cả',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          style: TextButton.styleFrom(
                            backgroundColor: Colors.white.withValues(alpha: 0.15),
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
                    tabs: [
                      const Tab(text: 'Tất cả'),
                      Tab(
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text('Lịch hẹn'),
                            const SizedBox(width: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEF4444),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                '${appointments.length}',
                                style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Tab(text: 'Hệ thống'),
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
                _buildNotificationList(allItems, auth),
                _buildNotificationList(appointments, auth),
                _buildNotificationList(systemNotifications, auth),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationList(List<Map<String, dynamic>> items, AuthProvider auth) {
    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.notifications_none_rounded, size: 64, color: Colors.grey[300]),
            const SizedBox(height: 12),
            Text(
              'Không có thông báo',
              style: GoogleFonts.sora(fontSize: 16, color: const Color(0xFF94A3B8)),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        final title = item['title'] as String;
        final isUnread = !_readItems.contains(title);

        return Dismissible(
          key: Key('notif_${index}_$title'),
          direction: DismissDirection.endToStart,
          background: Container(
            alignment: Alignment.centerRight,
            padding: const EdgeInsets.only(right: 20),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFEF4444),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.delete_outline_rounded, color: Colors.white, size: 24),
          ),
          onDismissed: (_) {
            setState(() {
              _allNotifications.remove(item);
              _readItems.add(title);
            });
          },
          child: GestureDetector(
            onTap: () {
              setState(() => _readItems.add(title));
              _handleNotificationTap(context, item, auth);
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isUnread ? const Color(0xFFF0F9FF) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isUnread ? const Color(0xFFBAE6FD) : const Color(0xFFE2E8F0),
                  width: isUnread ? 1.4 : 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: isUnread
                        ? const Color(0xFF0284C7).withValues(alpha: 0.08)
                        : Colors.black.withValues(alpha: 0.02),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Icon Container
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: (item['color'] as Color).withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(item['icon'] as IconData, color: item['color'] as Color, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                item['title'] as String,
                                style: GoogleFonts.sora(
                                  fontSize: 13.5,
                                  fontWeight: isUnread ? FontWeight.bold : FontWeight.w600,
                                  color: const Color(0xFF0F172A),
                                ),
                              ),
                            ),
                            if (isUnread)
                              Container(
                                width: 8,
                                height: 8,
                                margin: const EdgeInsets.only(left: 6),
                                decoration: const BoxDecoration(
                                  color: AppTheme.primary,
                                  shape: BoxShape.circle,
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 5),
                        Text(
                          item['desc'] as String,
                          style: GoogleFonts.inter(
                            fontSize: 12.5,
                            color: const Color(0xFF475569),
                            height: 1.4,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Icon(Icons.access_time_rounded, size: 12, color: Colors.grey[400]),
                            const SizedBox(width: 4),
                            Text(
                              item['time'] as String,
                              style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                            ),
                            const Spacer(),
                            // Priority badge
                            if (item['priority'] == 'high')
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  'Quan trọng',
                                  style: GoogleFonts.inter(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFFEF4444),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _handleNotificationTap(BuildContext context, Map<String, dynamic> item, AuthProvider auth) {
    final type = item['type'] as String;
    if (type == 'appointment') {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const MyAppointmentsView()));
    } else if (type == 'medical') {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const MedicalHistoryView()));
    }
  }
}
