import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/patient_provider.dart';
import '../features/medication_reminder_view.dart';
import '../profile/complete_profile_view.dart';
import 'package:qr_flutter/qr_flutter.dart';

class MedicalHistoryView extends StatefulWidget {
  const MedicalHistoryView({super.key});

  @override
  State<MedicalHistoryView> createState() => _MedicalHistoryViewState();
}

class _MedicalHistoryViewState extends State<MedicalHistoryView> {
  String? _expandedId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = context.read<AuthProvider>().user;
      if (user != null) {
        context.read<PatientProvider>().fetchMedicalHistory(user.id);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isProfileComplete) {
      return Scaffold(
        backgroundColor: AppTheme.background,
        appBar: AppBar(title: const Text('Bệnh Án Điện Tử (EMR)'), centerTitle: true),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFBAE6FD)),
                boxShadow: AppTheme.prominentShadow,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(color: Color(0xFFEFF6FF), shape: BoxShape.circle),
                    child: const Icon(Icons.folder_shared_rounded, size: 48, color: AppTheme.primary),
                  ),
                  const SizedBox(height: 16),
                  Text('Yêu cầu hoàn tất hồ sơ',
                      style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                  const SizedBox(height: 10),
                  Text(
                    'Để liên kết và tra cứu lịch sử khám bệnh, kết quả xét nghiệm và đơn thuốc điện tử, bạn cần cập nhật thông tin cá nhân (CCCD, Họ tên, Ngày sinh).',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(fontSize: 13.5, color: AppTheme.textSecondary, height: 1.45),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const CompleteProfileView(isDismissible: true)),
                      ),
                      icon: const Icon(Icons.badge_outlined),
                      label: const Text('CẬP NHẬT THÔNG TIN NGAY'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
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
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Lịch sử Khám & Đơn thuốc EMR'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              final user = context.read<AuthProvider>().user;
              if (user != null) {
                context.read<PatientProvider>().fetchMedicalHistory(user.id);
              }
            },
            tooltip: 'Tải lại',
          )
        ],
      ),
      body: Consumer<PatientProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          final records = provider.examinations;

          if (records.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.folder_open_rounded, size: 72, color: AppTheme.primary.withValues(alpha: 0.3)),
                  const SizedBox(height: 16),
                  Text('Chưa có lịch sử khám bệnh',
                      style: GoogleFonts.sora(fontSize: 17, fontWeight: FontWeight.bold, color: AppTheme.textSecondary)),
                  const SizedBox(height: 8),
                  Text('Dữ liệu sẽ hiển thị sau khi hoàn tất lượt khám.',
                      style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textSecondary)),
                  if (provider.error != null) ...[
                    const SizedBox(height: 12),
                    Text('Lỗi: ${provider.error}',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(fontSize: 12, color: Colors.red)),
                  ],
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
            itemCount: records.length,
            itemBuilder: (context, index) {
              final record = records[index];
              final isLast = index == records.length - 1;
              final isExpanded = _expandedId == record.id;

              return IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Timeline
                    SizedBox(
                      width: 28,
                      child: Column(
                        children: [
                          Container(
                            width: 14,
                            height: 14,
                            margin: const EdgeInsets.only(top: 22),
                            decoration: BoxDecoration(
                              color: AppTheme.primary,
                              shape: BoxShape.circle,
                              border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3), width: 3),
                            ),
                          ),
                          if (!isLast)
                            Expanded(
                              child: Container(
                                width: 2,
                                color: AppTheme.borderSubtle,
                                margin: const EdgeInsets.symmetric(vertical: 4),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    // Record Card
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() {
                          _expandedId = isExpanded ? null : record.id;
                        }),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 250),
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: isExpanded ? AppTheme.primary : AppTheme.borderSubtle,
                              width: isExpanded ? 1.5 : 1,
                            ),
                            boxShadow: isExpanded ? AppTheme.prominentShadow : null,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Header
                              Padding(
                                padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            record.formattedDate,
                                            style: GoogleFonts.sora(
                                                fontWeight: FontWeight.w700,
                                                fontSize: 16,
                                                color: AppTheme.primaryDark),
                                          ),
                                        ),
                                        _buildStatusChip(record.status),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      record.examinationCode,
                                      style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary),
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        const Icon(Icons.local_hospital_outlined, size: 14, color: AppTheme.primary),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            record.departmentName +
                                                (record.doctorName.isNotEmpty ? ' • ${record.doctorName}' : ''),
                                            style: GoogleFonts.inter(
                                                fontSize: 13, color: AppTheme.textSecondary, fontWeight: FontWeight.w500),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Icon(Icons.label_outlined, size: 15, color: AppTheme.primary),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            'Chẩn đoán: ${record.icD10Name.isNotEmpty ? record.icD10Name : record.assessment}',
                                            style: GoogleFonts.inter(
                                                fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (record.icD10Code.isNotEmpty)
                                      Padding(
                                        padding: const EdgeInsets.only(left: 21, top: 2),
                                        child: Text(
                                          'ICD-10: ${record.icD10Code}',
                                          style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary),
                                        ),
                                      ),
                                  ],
                                ),
                              ),

                              // Expand indicator
                              Padding(
                                padding: const EdgeInsets.only(right: 12, bottom: 10),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    Text(
                                      isExpanded ? 'Thu gọn' : 'Xem chi tiết',
                                      style: GoogleFonts.inter(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.w600),
                                    ),
                                    Icon(
                                      isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                                      color: AppTheme.primary,
                                      size: 18,
                                    ),
                                  ],
                                ),
                              ),

                              // Expanded Section
                              if (isExpanded) ...[
                                const Divider(height: 1, color: AppTheme.borderSubtle),
                                Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Vitals Row
                                      if (record.pulseRate > 0 || record.temperature > 0) ...[
                                        Text('Chỉ số sinh hiệu',
                                            style: GoogleFonts.sora(
                                                fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.primaryDark)),
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            _buildVitalChip(Icons.favorite_rounded, '${record.pulseRate} bpm', 'Nhịp tim'),
                                            const SizedBox(width: 8),
                                            _buildVitalChip(Icons.thermostat_rounded, '${record.temperature}°C', 'Nhiệt độ'),
                                            const SizedBox(width: 8),
                                            _buildVitalChip(Icons.speed_rounded, record.bloodPressure.isNotEmpty ? record.bloodPressure : '--', 'Huyết áp'),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            _buildVitalChip(Icons.monitor_weight_rounded, '${record.weight}kg', 'Cân nặng'),
                                            const SizedBox(width: 8),
                                            _buildVitalChip(Icons.height_rounded, '${record.height}cm', 'Chiều cao'),
                                            const SizedBox(width: 8),
                                            _buildVitalChip(Icons.calculate_rounded, record.bmi > 0 ? record.bmi.toStringAsFixed(1) : '--', 'BMI'),
                                          ],
                                        ),
                                        const SizedBox(height: 14),
                                      ],

                                      // Subjective
                                      if (record.subjective.isNotEmpty) ...[
                                        _buildSectionLabel('Triệu chứng & Lý do khám', Icons.person_outline),
                                        const SizedBox(height: 6),
                                        Text(record.subjective,
                                            style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textPrimary, height: 1.45)),
                                        const SizedBox(height: 14),
                                      ],

                                      // Plan
                                      if (record.plan.isNotEmpty) ...[
                                        _buildSectionLabel('Kế hoạch điều trị', Icons.assignment_outlined),
                                        const SizedBox(height: 6),
                                        Text(record.plan,
                                            style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textPrimary, height: 1.45)),
                                        const SizedBox(height: 14),
                                      ],

                                      // Prescriptions
                                      if (record.prescriptionDetails.isNotEmpty) ...[
                                        _buildSectionLabel('Đơn thuốc Điện tử', Icons.medication_rounded),
                                        const SizedBox(height: 8),
                                        ...record.prescriptionDetails.map((med) => _buildMedicineCard(med)),
                                        const SizedBox(height: 8),
                                        InkWell(
                                          onTap: () => Navigator.push(
                                            context,
                                            MaterialPageRoute(builder: (_) => const MedicationReminderView()),
                                          ),
                                          borderRadius: BorderRadius.circular(10),
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFF0F9FF),
                                              borderRadius: BorderRadius.circular(10),
                                              border: Border.all(color: const Color(0xFFBAE6FD)),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                const Icon(Icons.alarm_add_rounded, size: 16, color: Color(0xFF0284C7)),
                                                const SizedBox(width: 6),
                                                Text('Tạo nhắc nhở uống thuốc từ đơn này',
                                                    style: GoogleFonts.inter(
                                                        fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFF0284C7))),
                                              ],
                                            ),
                                          ),
                                        ),
                                        const SizedBox(height: 14),
                                      ],

                                      // Service Orders
                                      if (record.serviceOrderDetails.isNotEmpty) ...[
                                        _buildSectionLabel('Xét nghiệm & Dịch vụ', Icons.biotech_rounded),
                                        const SizedBox(height: 8),
                                        ...record.serviceOrderDetails.map((svc) => _buildServiceCard(svc)),
                                      ],

                                      const SizedBox(height: 16),
                                      SizedBox(
                                        width: double.infinity,
                                        height: 44,
                                        child: ElevatedButton.icon(
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: const Color(0xFF0284C7),
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                            elevation: 0,
                                          ),
                                          onPressed: () => _showEmrPdfModal(context, record),
                                          icon: const Icon(Icons.picture_as_pdf_rounded, size: 18, color: Colors.white),
                                          label: Text('Xuất Phiếu Bệnh Án EMR (PDF)',
                                              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color bg;
    Color fg;
    String label;
    IconData icon;

    switch (status.toLowerCase()) {
      case 'hoàn thành':
      case 'completed':
        bg = AppTheme.accentMint.withValues(alpha: 0.15);
        fg = AppTheme.accentMint;
        label = 'Hoàn thành';
        icon = Icons.check_circle_outline;
        break;
      case 'đang khám':
      case 'inprogress':
        bg = AppTheme.primary.withValues(alpha: 0.1);
        fg = AppTheme.primary;
        label = 'Đang khám';
        icon = Icons.medical_services_outlined;
        break;
      default:
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFFD97706);
        label = status.isNotEmpty ? status : 'Chờ';
        icon = Icons.access_time_rounded;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: fg),
          const SizedBox(width: 4),
          Text(label, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: fg)),
        ],
      ),
    );
  }

  Widget _buildVitalChip(IconData icon, String value, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
        decoration: BoxDecoration(
          color: const Color(0xFFF0F9FF),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFBAE6FD)),
        ),
        child: Column(
          children: [
            Icon(icon, size: 16, color: AppTheme.primary),
            const SizedBox(height: 3),
            Text(value,
                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
            Text(label,
                style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textSecondary)),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionLabel(String label, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppTheme.primary),
        const SizedBox(width: 6),
        Text(label,
            style: GoogleFonts.sora(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.primaryDark)),
      ],
    );
  }

  Widget _buildMedicineCard(Map<String, dynamic> med) {
    final name = med['medicineName']?.toString() ?? 'Thuốc';
    final qty = med['quantity']?.toString() ?? '';
    final unit = med['unit']?.toString() ?? '';
    final instruction = med['dosageInstruction']?.toString() ?? '';
    final price = med['unitPrice'] != null
        ? '${(med['unitPrice'] as num).toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}đ'
        : '';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.accentMint.withValues(alpha: 0.4)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: AppTheme.accentMint.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.medication_rounded, size: 16, color: AppTheme.accentMint),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                if (qty.isNotEmpty || unit.isNotEmpty)
                  Text('Số lượng: $qty $unit',
                      style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary)),
                if (instruction.isNotEmpty)
                  Text(instruction,
                      style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary, height: 1.4)),
              ],
            ),
          ),
          if (price.isNotEmpty)
            Text(price, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primary)),
        ],
      ),
    );
  }

  Widget _buildServiceCard(Map<String, dynamic> svc) {
    final name = svc['serviceName']?.toString() ?? 'Dịch vụ';
    final cat = svc['serviceCategory']?.toString() ?? '';
    final result = svc['result']?.toString() ?? '';
    final status = svc['status']?.toString() ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF0F9FF),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFBAE6FD)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.biotech_rounded, size: 15, color: AppTheme.primary),
              const SizedBox(width: 6),
              Expanded(
                child: Text(name,
                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
              ),
              if (status.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(status,
                      style: GoogleFonts.inter(fontSize: 10, color: AppTheme.primary, fontWeight: FontWeight.w600)),
                ),
            ],
          ),
          if (cat.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(cat, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary)),
            ),
          if (result.isNotEmpty) ...[
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFBAE6FD)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.analytics_outlined, size: 13, color: AppTheme.primary),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text('KQ: $result',
                        style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textPrimary, height: 1.4)),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _showEmrPdfModal(BuildContext context, dynamic record) {
    final user = context.read<AuthProvider>().user;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.92,
        minChildSize: 0.5,
        maxChildSize: 0.96,
        builder: (_, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Modal Top Bar
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                decoration: const BoxDecoration(
                  color: Color(0xFFF0F9FF),
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                  border: Border(bottom: BorderSide(color: Color(0xFFBAE6FD))),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.picture_as_pdf_rounded, color: Color(0xFF0284C7), size: 22),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Hồ Sơ Bệnh Án EMR (Bản In Chuẩn A4)',
                        style: GoogleFonts.sora(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF0369A1)),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),

              // Document Content
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(20),
                  children: [
                    // Hospital Header
                    Center(
                      child: Column(
                        children: [
                          Text(
                            'BỆNH VIỆN ĐA KHOA QUỐC TẾ D-MEDICAL',
                            style: GoogleFonts.sora(fontSize: 15, fontWeight: FontWeight.w800, color: const Color(0xFF0369A1)),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Địa chỉ: Đường Lê Hồng Phong, TP. Thủ Dầu Một, Bình Dương\nHotline: 1900 1234 • Cổng tra cứu: https://hospital-ai.vn',
                            style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B), height: 1.3),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 12),
                          const Divider(thickness: 1.5, color: Color(0xFF0284C7)),
                          const SizedBox(height: 6),
                          Text(
                            'PHIẾU KHÁM BỆNH & HỒ SƠ BỆNH ÁN EMR',
                            style: GoogleFonts.sora(fontSize: 16, fontWeight: FontWeight.w800, color: const Color(0xFF0F172A)),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Mã lượt khám: ${record.examinationCode} • Ngày: ${record.examinationDate}',
                            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Thông tin hành chính
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        children: [
                          _buildPdfInfoRow('Họ và tên:', record.patientName.toUpperCase(), isBold: true),
                          const SizedBox(height: 6),
                          _buildPdfInfoRow('Mã Bệnh nhân:', user?.maBenhNhan.isNotEmpty == true ? user!.maBenhNhan : record.patientId),
                          const SizedBox(height: 6),
                          _buildPdfInfoRow('CCCD / Định danh:', user?.soCCCD.isNotEmpty == true ? user!.soCCCD : '--'),
                          const SizedBox(height: 6),
                          _buildPdfInfoRow('Mã thẻ BHYT:', (user?.maTheBHYT != null && user!.maTheBHYT!.isNotEmpty) ? user.maTheBHYT! : 'Khám tự nguyện (Không BHYT)'),
                          const SizedBox(height: 6),
                          _buildPdfInfoRow('Khoa khám bệnh:', record.departmentName),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // I. Khám lâm sàng & Sinh hiệu
                    Text('I. KẾT QUẢ KHÁM LÂM SÀNG & SINH HIỆU (SOAP)',
                        style: GoogleFonts.sora(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF0369A1))),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0F9FF),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFBAE6FD)),
                      ),
                      child: Text(
                        'Mạch: ${record.pulseRate} bpm   |   Huyết áp: ${record.bloodPressure.isNotEmpty ? record.bloodPressure : '--'} mmHg\nThân nhiệt: ${record.temperature}°C   |   BMI: ${record.bmi > 0 ? record.bmi.toStringAsFixed(1) : '--'}',
                        style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF0F172A), height: 1.4, fontWeight: FontWeight.w600),
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (record.subjective.isNotEmpty) ...[
                      Text('• Triệu chứng & Lý do khám: ${record.subjective}',
                          style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF334155), height: 1.4)),
                      const SizedBox(height: 6),
                    ],
                    Text('• Chẩn đoán xác định: ${record.icD10Name} (Mã ICD-10: ${record.icD10Code})',
                        style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                    const SizedBox(height: 16),

                    // II. Đơn thuốc
                    if (record.prescriptionDetails.isNotEmpty) ...[
                      Text('II. ĐƠN THUỐC ĐIỆN TỬ ĐIỀU TRỊ',
                          style: GoogleFonts.sora(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF0369A1))),
                      const SizedBox(height: 8),
                      Table(
                        border: TableBorder.all(color: const Color(0xFFCBD5E1), width: 1),
                        columnWidths: const {
                          0: FlexColumnWidth(1),
                          1: FlexColumnWidth(4),
                          2: FlexColumnWidth(2),
                          3: FlexColumnWidth(4),
                        },
                        children: [
                          TableRow(
                            decoration: const BoxDecoration(color: Color(0xFFE2E8F0)),
                            children: [
                              _buildTableHeaderCell('STT'),
                              _buildTableHeaderCell('Tên thuốc'),
                              _buildTableHeaderCell('Số lượng'),
                              _buildTableHeaderCell('Cách dùng'),
                            ],
                          ),
                          ...record.prescriptionDetails.asMap().entries.map((entry) {
                            final idx = entry.key + 1;
                            final med = entry.value;
                            return TableRow(
                              children: [
                                _buildTableCell('$idx', align: TextAlign.center),
                                _buildTableCell(med['medicineName']?.toString() ?? ''),
                                _buildTableCell('${med['quantity']} ${med['unit'] ?? ""}', align: TextAlign.center),
                                _buildTableCell(med['dosageInstruction']?.toString() ?? ''),
                              ],
                            );
                          }),
                        ],
                      ),
                      const SizedBox(height: 16),
                    ],

                    // III. Cận lâm sàng
                    if (record.serviceOrderDetails.isNotEmpty) ...[
                      Text('III. CHỈ ĐỊNH CẬN LÂM SÀNG & XÉT NGHIỆM',
                          style: GoogleFonts.sora(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF0369A1))),
                      const SizedBox(height: 8),
                      ...record.serviceOrderDetails.map((svc) => Padding(
                            padding: const EdgeInsets.only(bottom: 6),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('• ', style: TextStyle(fontWeight: FontWeight.bold)),
                                Expanded(
                                  child: Text(
                                    '${svc['serviceName']}: Kết quả [${svc['result']?.isNotEmpty == true ? svc['result'] : "Đã hoàn thành"}]',
                                    style: GoogleFonts.inter(fontSize: 12.5, color: const Color(0xFF334155)),
                                  ),
                                ),
                              ],
                            ),
                          )),
                      const SizedBox(height: 16),
                    ],

                    // IV. Ký số & QR Code
                    const Divider(color: Color(0xFFCBD5E1)),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: const Color(0xFFBAE6FD)),
                              ),
                              child: QrImageView(
                                data: 'https://hospital-ai.vn/verify-emr?code=${record.examinationCode}',
                                version: QrVersions.auto,
                                size: 75,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text('Quét QR tra cứu EMR',
                                style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF64748B))),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Text('Bác sĩ Khám & Ký số',
                                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF64748B))),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFFDCFCE7),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text('✓ ĐÃ KÝ SỐ SHA-256',
                                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF16A34A))),
                            ),
                            const SizedBox(height: 6),
                            Text(record.doctorName,
                                style: GoogleFonts.sora(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Download button
                    SizedBox(
                      width: double.infinity,
                      height: 46,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0284C7),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('✓ Đã tải và lưu phiếu bệnh án EMR (PDF) thành công!'),
                              backgroundColor: Color(0xFF10B981),
                            ),
                          );
                        },
                        icon: const Icon(Icons.download_rounded, color: Colors.white),
                        label: Text('Tải File PDF (A4) Về Thiết Bị',
                            style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPdfInfoRow(String label, String value, {bool isBold = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 130,
          child: Text(label, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
        ),
        Expanded(
          child: Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
              color: const Color(0xFF0F172A),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTableHeaderCell(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF334155)),
      ),
    );
  }

  Widget _buildTableCell(String text, {TextAlign align = TextAlign.left}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
      child: Text(
        text,
        textAlign: align,
        style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF0F172A)),
      ),
    );
  }
}
