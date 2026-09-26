import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import 'complete_profile_view.dart';

class BhytInfoView extends StatelessWidget {
  const BhytInfoView({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Thẻ BHYT & CCCD Điện tử'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (!auth.isProfileComplete)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFBAE6FD)),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.info_outline, color: Color(0xFF0284C7)),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Hồ sơ của bạn chưa có đầy đủ thông tin CCCD hoặc BHYT.',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0369A1)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const CompleteProfileView(isDismissible: true)),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: const Text('Cập nhật CCCD & BHYT ngay', style: TextStyle(fontSize: 13)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            const Text(
              'Thẻ Bảo Hiểm Y Tế',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
            ),
            const SizedBox(height: 12),
            _buildHealthCard(context, user),
            
            const SizedBox(height: 24),
            
            const Text(
              'Căn Cước Công Dân',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
            ),
            const SizedBox(height: 12),
            _buildIdentityCard(context, user),
            
            const SizedBox(height: 32),
            const Center(
              child: Text(
                'Xuất trình mã QR hoặc Thẻ điện tử tại quầy Tiếp nhận\nđể làm thủ tục nhanh chóng.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: Colors.grey),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHealthCard(BuildContext context, user) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0284c7), Color(0xFF0369a1)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 10, offset: Offset(0, 5))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.local_hospital, color: Colors.white, size: 28),
                  SizedBox(width: 8),
                  Text('BẢO HIỂM Y TẾ', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(8)),
                child: const Text('Mức hưởng 80%', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Mã số thẻ BHYT', style: TextStyle(color: Colors.white70, fontSize: 12)),
                    const SizedBox(height: 4),
                    Text(user?.maTheBHYT ?? 'DN4010123456789', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 2)),
                    const SizedBox(height: 16),
                    const Text('Họ và tên', style: TextStyle(color: Colors.white70, fontSize: 12)),
                    const SizedBox(height: 4),
                    Text((user?.hoTen ?? 'Nguyễn Văn An').toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Ngày sinh', style: TextStyle(color: Colors.white70, fontSize: 12)),
                              Text(user?.ngaySinh ?? '01/01/1990', style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Giới tính', style: TextStyle(color: Colors.white70, fontSize: 12)),
                              Text(user?.gioiTinh ?? 'Nam', style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                child: QrImageView(
                  data: user?.maTheBHYT ?? 'DN4010123456789',
                  version: QrVersions.auto,
                  size: 90,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildIdentityCard(BuildContext context, user) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Image.network('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Emblem_of_Vietnam.svg/1200px-Emblem_of_Vietnam.svg.png', width: 30, height: 30, errorBuilder: (c,e,s) => const Icon(Icons.badge, color: AppTheme.primaryColor)),
                  const SizedBox(width: 8),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.red)),
                      Text('Độc lập - Tự do - Hạnh phúc', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Center(child: Text('CĂN CƯỚC CÔNG DÂN', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87))),
          const SizedBox(height: 20),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 70,
                height: 90,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFCBD5E1)),
                ),
                child: const Icon(Icons.person, size: 40, color: Color(0xFF94A3B8)),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Số / No.:', style: TextStyle(fontSize: 10, color: Colors.grey)),
                    Text(user?.soCCCD ?? '012345678912', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    const Text('Họ và tên / Full name:', style: TextStyle(fontSize: 10, color: Colors.grey)),
                    Text((user?.hoTen ?? 'Nguyễn Văn An').toUpperCase(), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Ngày sinh:', style: TextStyle(fontSize: 10, color: Colors.grey)),
                              Text(user?.ngaySinh ?? '01/01/1990', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Giới tính:', style: TextStyle(fontSize: 10, color: Colors.grey)),
                              Text(user?.gioiTinh ?? 'Nam', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
