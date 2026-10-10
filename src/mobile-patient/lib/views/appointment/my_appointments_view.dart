import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/theme.dart';
import '../../providers/appointment_provider.dart';
import '../../providers/auth_provider.dart';
import 'book_appointment_view.dart';

class MyAppointmentsView extends StatefulWidget {
  const MyAppointmentsView({super.key});

  @override
  State<MyAppointmentsView> createState() => _MyAppointmentsViewState();
}

class _MyAppointmentsViewState extends State<MyAppointmentsView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadAppointments();
    });
  }

  void _loadAppointments() {
    final user = context.read<AuthProvider>().user;
    if (user != null) {
      context.read<AppointmentProvider>().fetchMyAppointments(
            user.soDienThoai ?? '',
            patientCode: user.maBenhNhan,
          );
    }
  }

  void _showCancelDialog(BuildContext parentContext, String appointmentId, String doctorName) {
    final messenger = ScaffoldMessenger.of(parentContext);
    showDialog(
      context: parentContext,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: Color(0xFFEF4444), size: 24),
            const SizedBox(width: 8),
            Text('Hủy lịch hẹn khám', style: GoogleFonts.sora(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text(
          'Bạn có chắc chắn muốn hủy lịch hẹn khám với $doctorName không? Thao tác này không thể hoàn tác.',
          style: GoogleFonts.inter(fontSize: 13.5, color: const Color(0xFF334155)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Giữ lại', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: const Color(0xFF64748B))),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              final provider = parentContext.read<AppointmentProvider>();
              final success = await provider.cancelAppointment(appointmentId);
              messenger.showSnackBar(
                SnackBar(
                  content: Text(success ? 'Đã hủy lịch hẹn thành công!' : 'Hủy lịch hẹn không thành công.'),
                  backgroundColor: success ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                ),
              );
            },
            child: Text('Xác nhận hủy', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appointmentProvider = context.watch<AppointmentProvider>();
    final appointments = appointmentProvider.myAppointments;
    final isLoading = appointmentProvider.isLoading;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text('Lịch Hẹn Khám Của Tôi', style: GoogleFonts.sora(fontSize: 17, fontWeight: FontWeight.bold)),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadAppointments,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.primary,
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const BookAppointmentView()),
          ).then((_) => _loadAppointments());
        },
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: Text('Đặt khám mới', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
      ),
      body: RefreshIndicator(
        onRefresh: () async => _loadAppointments(),
        child: isLoading
            ? const Center(child: CircularProgressIndicator())
            : appointments.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                    itemCount: appointments.length,
                    itemBuilder: (context, index) {
                      final item = appointments[index];
                      return _buildAppointmentCard(context, item);
                    },
                  ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: Color(0xFFE0F2FE),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.calendar_today_rounded, size: 56, color: Color(0xFF0284C7)),
            ),
            const SizedBox(height: 20),
            Text(
              'Chưa có lịch hẹn khám',
              style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 8),
            Text(
              'Bạn chưa có lịch hẹn khám bệnh trực tuyến nào tại Bệnh viện D-Medical. Hãy đăng ký đặt khám để được phục vụ tốt nhất!',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 13.5, color: const Color(0xFF64748B), height: 1.4),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const BookAppointmentView()),
                ).then((_) => _loadAppointments());
              },
              icon: const Icon(Icons.add_circle_outline_rounded, color: Colors.white),
              label: Text('ĐẶT LỊCH KHÁM NGAY', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppointmentCard(BuildContext context, Map<String, dynamic> item) {
    final id = item['id']?.toString() ?? '';
    final doctor = item['doctorName']?.toString() ?? 'Bác sĩ chuyên khoa';
    final dept = item['departmentName']?.toString() ?? 'Khoa Khám Bệnh';
    final date = item['appointmentDate']?.toString() ?? '';
    final time = item['appointmentTime']?.toString() ?? '';
    final symptoms = item['symptomsReason']?.toString() ?? '';
    final status = item['status']?.toString() ?? 'Pending';

    final isCancelable = status.toLowerCase() != 'cancelled' &&
        status.toLowerCase() != 'completed' &&
        status.toLowerCase() != 'đã hủy';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFBAE6FD)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0284C7).withValues(alpha: 0.08),
            blurRadius: 15,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: Color(0xFFF0F9FF),
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Row(
              children: [
                const Icon(Icons.assignment_outlined, size: 18, color: Color(0xFF0284C7)),
                const SizedBox(width: 8),
                Text(
                  id.isNotEmpty ? 'Phiếu hẹn: $id' : 'Phiếu hẹn khám',
                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF0369A1)),
                ),
                const Spacer(),
                _buildStatusTag(status),
              ],
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE0F2FE),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.person_outline_rounded, color: Color(0xFF0284C7), size: 24),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(doctor, style: GoogleFonts.sora(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                          const SizedBox(height: 2),
                          Text(dept, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF0284C7), fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                const Divider(height: 1, color: Color(0xFFF1F5F9)),
                const SizedBox(height: 12),

                // Info Rows
                _buildInfoRow(Icons.event_rounded, 'Ngày khám:', date.isNotEmpty ? date : 'Chưa xếp ngày'),
                const SizedBox(height: 8),
                _buildInfoRow(Icons.access_time_rounded, 'Khung giờ:', time.isNotEmpty ? time : 'Theo lịch hẹn'),
                if (symptoms.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  _buildInfoRow(Icons.medical_information_outlined, 'Lý do khám:', symptoms),
                ],

                const SizedBox(height: 14),

                // Button: Mã QR Check-in Tiếp Nhận (Thay thế STT)
                SizedBox(
                  width: double.infinity,
                  height: 42,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0284C7),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    onPressed: () => _showQrCodeBottomSheet(context, item),
                    icon: const Icon(Icons.qr_code_2_rounded, size: 20, color: Colors.white),
                    label: Text(
                      'MÃ QR CHECK-IN TIẾP NHẬN',
                      style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                ),

                if (isCancelable) ...[
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    height: 38,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFFFECACA)),
                        backgroundColor: const Color(0xFFFEF2F2),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () => _showCancelDialog(context, id, doctor),
                      icon: const Icon(Icons.cancel_outlined, size: 16, color: Color(0xFFEF4444)),
                      label: Text('Hủy lịch hẹn này', style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.w700, color: const Color(0xFFEF4444))),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showQrCodeBottomSheet(BuildContext parentContext, Map<String, dynamic> item) {
    final user = parentContext.read<AuthProvider>().user;
    final id = item['id']?.toString() ?? '';
    final doctor = item['doctorName']?.toString() ?? 'Bác sĩ chuyên khoa';
    final dept = item['departmentName']?.toString() ?? 'Khoa Khám Bệnh';
    final date = item['appointmentDate']?.toString() ?? '';
    final time = item['appointmentTime']?.toString() ?? '';
    final qrData = item['qrCode']?.toString().isNotEmpty == true
        ? item['qrCode'].toString()
        : 'MEDQR|$id|${user?.maBenhNhan ?? ''}|$date|$time';

    showModalBottomSheet(
      context: parentContext,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              width: 44,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            Text(
              'PHIẾU KHÁM ĐIỆN TỬ',
              style: GoogleFonts.sora(fontSize: 17, fontWeight: FontWeight.bold, color: const Color(0xFF0369A1)),
            ),
            const SizedBox(height: 4),
            Text(
              'Mã tiếp nhận: $id',
              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B), fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 16),

            // QR Code Box
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFBAE6FD), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF0284C7).withValues(alpha: 0.1),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: QrImageView(
                data: qrData,
                version: QrVersions.auto,
                size: 180,
                backgroundColor: Colors.white,
                eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: Color(0xFF0369A1)),
                dataModuleStyle: const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: Color(0xFF0284C7)),
              ),
            ),
            const SizedBox(height: 16),

            // Info rows
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF0F9FF),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFBAE6FD)),
              ),
              child: Column(
                children: [
                  _buildDetailRowModal('Bệnh nhân:', user?.hoTen ?? ''),
                  const SizedBox(height: 8),
                  _buildDetailRowModal('Chuyên khoa:', dept),
                  const SizedBox(height: 8),
                  _buildDetailRowModal('Bác sĩ:', doctor),
                  const SizedBox(height: 8),
                  _buildDetailRowModal('Thời gian:', '$time - $date'),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // QR Check-in Notice
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, color: Color(0xFFD97706), size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Quý khách chỉ cần xuất trình mã QR này tại quầy tiếp nhận để vào khám (Không cần bốc số thứ tự STT giấy).',
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF92400E), height: 1.35),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0284C7),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: () => Navigator.pop(ctx),
                child: Text('ĐÓNG', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRowModal(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF64748B))),
        Text(value, style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
      ],
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: const Color(0xFF64748B)),
        const SizedBox(width: 8),
        Text(label, style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF64748B))),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            value,
            style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A)),
          ),
        ),
      ],
    );
  }

  Widget _buildStatusTag(String status) {
    Color bg;
    Color fg;
    String label;

    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'đã tiếp nhận':
        bg = const Color(0xFFDCFCE7);
        fg = const Color(0xFF16A34A);
        label = 'Đã duyệt';
        break;
      case 'completed':
      case 'hoàn tất':
        bg = const Color(0xFFE0E7FF);
        fg = const Color(0xFF4F46E5);
        label = 'Đã khám';
        break;
      case 'cancelled':
      case 'đã hủy':
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFFDC2626);
        label = 'Đã hủy';
        break;
      default:
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFFD97706);
        label = 'Chờ tiếp nhận';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(fontSize: 11.5, fontWeight: FontWeight.bold, color: fg),
      ),
    );
  }
}
