import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';

class MedicalNewsView extends StatelessWidget {
  const MedicalNewsView({super.key});

  @override
  Widget build(BuildContext context) {
    final List<Map<String, String>> articles = [
      {
        'title': 'Bệnh viện ứng dụng Trí tuệ Nhân tạo AI trong chẩn đoán hình ảnh EMR',
        'desc': 'Hệ thống Hospital AI giúp tăng 98% độ chính xác trong tầm soát bệnh lý tim mạch & nội soi.',
        'date': '14 Tháng 8, 2026',
        'image': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80',
        'tag': 'Công nghệ Y tế',
      },
      {
        'title': 'Khuyến cáo sức khỏe mùa nắng nóng: Phòng tránh đột quỵ & kiệt sức',
        'desc': 'Các chuyên gia y tế hướng dẫn cách duy trì thể trạng tốt nhất cho người cao tuổi & trẻ nhỏ.',
        'date': '12 Tháng 8, 2026',
        'image': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&auto=format&fit=crop&q=80',
        'tag': 'Sức khỏe Cộng đồng',
      },
      {
        'title': 'Thông báo Lịch làm việc & Khám ngoài giờ thứ 7, Chủ Nhật',
        'desc': 'Bệnh viện mở rộng khung giờ tiếp nhận khám BHYT từ 07:00 đến 20:00 hằng ngày.',
        'date': '10 Tháng 8, 2026',
        'image': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&auto=format&fit=crop&q=80',
        'tag': 'Thông báo',
      },
    ];

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Tin Tức & Sức Khỏe Y Tế'),
      ),
      body: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 0.65,
        ),
        itemCount: articles.length,
        itemBuilder: (context, index) {
          final item = articles[index];
          return Container(
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.borderSubtle),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Stack(
                  children: [
                    Container(
                      height: 120, // Approx 4:3 ratio based on width
                      decoration: BoxDecoration(
                        borderRadius: const BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
                        image: DecorationImage(
                          image: NetworkImage(item['image']!),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    Positioned(
                      top: 12,
                      left: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryDeep.withValues(alpha: 0.85),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          item['tag']!,
                          style: GoogleFonts.inter(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item['title']!,
                        style: GoogleFonts.sora(fontWeight: FontWeight.w700, fontSize: 13, color: AppTheme.textPrimary, height: 1.3),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.access_time, size: 12, color: AppTheme.textSecondary),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              item['date']!,
                              style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textSecondary),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
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
        },
      ),
    );
  }
}
