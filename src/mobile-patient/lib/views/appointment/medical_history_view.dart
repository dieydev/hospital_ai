import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/patient_provider.dart';
import '../features/medication_reminder_view.dart';
import '../profile/complete_profile_view.dart';

class MedicalHistoryView extends StatefulWidget {
  const MedicalHistoryView({super.key});

  @override
  State<MedicalHistoryView> createState() => _MedicalHistoryViewState();
}

class _MedicalHistoryViewState extends State<MedicalHistoryView> {
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
        appBar: AppBar(
          title: const Text('Bệnh Án Điện Tử (EMR)'),
          centerTitle: true,
        ),
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
                    decoration: const BoxDecoration(
                      color: Color(0xFFEFF6FF),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.folder_shared_rounded, size: 48, color: AppTheme.primary),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Yêu cầu hoàn tất hồ sơ',
                    style: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                  ),
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
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const CompleteProfileView(isDismissible: true)),
                        );
                      },
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
      ),
      body: Consumer<PatientProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          final visits = provider.medicalHistory;
          if (visits.isEmpty) {
            return Center(
              child: Text(
                'Chưa có lịch sử khám bệnh.',
                style: GoogleFonts.inter(color: AppTheme.textSecondary),
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
            itemCount: visits.length,
            itemBuilder: (context, index) {
              final visit = visits[index];
              final isLast = index == visits.length - 1;

              return IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Vertical Timeline
                    SizedBox(
                      width: 24,
                      child: Column(
                        children: [
                          Container(
                            width: 12,
                            height: 12,
                            margin: const EdgeInsets.only(top: 24),
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
                    const SizedBox(width: 12),
                    // Summary Card
                    Expanded(
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: AppTheme.surface,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppTheme.borderSubtle),
                        ),
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  visit['date'] as String,
                                  style: GoogleFonts.sora(fontWeight: FontWeight.w700, fontSize: 16, color: AppTheme.primaryDark),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppTheme.accentMint.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    'Hoàn thành',
                                    style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.accentMint),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '${visit['department']} • ${visit['doctor']}',
                              style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textSecondary, fontWeight: FontWeight.w500),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(Icons.label_outlined, size: 16, color: AppTheme.primary),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'Chẩn đoán: ${visit['diagnosis']}',
                                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                                  ),
                                ),
                              ],
                            ),
                            const Divider(height: 24, color: AppTheme.borderSubtle),
                            Text(
                              'Đơn thuốc Điện tử:',
                              style: GoogleFonts.sora(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.textPrimary),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(Icons.medication_outlined, size: 16, color: AppTheme.accentMint),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    '${visit['prescription']}',
                                    style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.textSecondary),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            InkWell(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => const MedicationReminderView()),
                                );
                              },
                              borderRadius: BorderRadius.circular(10),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
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
                                    Text(
                                      'Tạo nhắc nhở uống thuốc từ đơn này',
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: const Color(0xFF0284C7),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
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
}
