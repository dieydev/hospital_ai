import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/theme.dart';
import '../appointment/book_appointment_view.dart';
import '../appointment/medical_history_view.dart';
import 'queue_status_view.dart';

class HomeView extends StatelessWidget {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bệnh viện Đa khoa Hospital AI'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => auth.logout(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User Greeting Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primaryColor, Color(0xFF0958D9)],
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 28,
                    backgroundColor: Colors.white24,
                    child: Icon(Icons.person, size: 36, color: Colors.white),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Xin chào, ${user?.hoTen ?? 'Nguyễn Văn An'}!',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Mã BN: ${user?.maBenhNhan ?? 'BN20260001'} | BHYT: ${user?.maTheBHYT ?? 'DN40101234567'}',
                          style: const TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Quick Service Grid
            const Text(
              'Dịch vụ Y tế Bệnh nhân',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 3,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              children: [
                _buildQuickItem(
                  context,
                  icon: Icons.calendar_month,
                  color: Colors.blue,
                  label: 'Đặt lịch khám',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const BookAppointmentView()),
                    );
                  },
                ),
                _buildQuickItem(
                  context,
                  icon: Icons.confirmation_number,
                  color: Colors.purple,
                  label: 'Số Hàng chờ',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const QueueStatusView()),
                    );
                  },
                ),
                _buildQuickItem(
                  context,
                  icon: Icons.folder_shared,
                  color: Colors.green,
                  label: 'Hồ sơ EMR',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const MedicalHistoryView()),
                    );
                  },
                ),
                _buildQuickItem(
                  context,
                  icon: Icons.receipt_long,
                  color: Colors.orange,
                  label: 'Đơn thuốc',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const MedicalHistoryView()),
                    );
                  },
                ),
                _buildQuickItem(
                  context,
                  icon: Icons.qr_code,
                  color: Colors.teal,
                  label: 'Mã QR Thẻ',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const MedicalHistoryView()),
                    );
                  },
                ),
                _buildQuickItem(
                  context,
                  icon: Icons.local_hospital,
                  color: Colors.sky,
                  label: 'Xem Phòng khám',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const QueueStatusView()),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Upcoming Appointment Card
            const Text(
              'Lịch hẹn Khám sắp tới',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Chip(
                          label: Text('ĐÃ XÁC NHẬN', style: TextStyle(color: Colors.white, fontSize: 10)),
                          backgroundColor: AppTheme.secondaryColor,
                        ),
                        Text('STT Khám: #101', style: TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold, fontSize: 16)),
                      ],
                    ),
                    const Divider(),
                    const Row(
                      children: [
                        Icon(Icons.medical_information, color: AppTheme.primaryColor),
                        SizedBox(width: 8),
                        Text('Khoa Nội Tổng Hợp - Phòng 102'),
                      ],
                    ),
                    const SizedBox(height: 6),
                    const Row(
                      children: [
                        Icon(Icons.person_outline, color: Colors.grey),
                        SizedBox(width: 8),
                        Text('Bác sĩ: BS. CKII. Nguyễn Thanh Duy'),
                      ],
                    ),
                    const SizedBox(height: 6),
                    const Row(
                      children: [
                        Icon(Icons.access_time, color: Colors.grey),
                        SizedBox(width: 8),
                        Text('Thời gian: 09:00 - 09:30, Ngày 02/08/2026'),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickItem(BuildContext context, {required IconData icon, required Color color, required String label, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircleAvatar(
              backgroundColor: color.withOpacity(0.1),
              child: Icon(icon, color: color),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
