import 'package:flutter/material.dart';
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
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Tin Tức & Sức Khỏe Y Tế'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        centerTitle: true,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: articles.length,
        itemBuilder: (context, index) {
          final item = articles[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            clipBehavior: Clip.antiAlias,
            elevation: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Stack(
                  children: [
                    Image.network(
                      item['image']!,
                      height: 160,
                      width: double.infinity,
                      fit: BoxFit.cover,
                    ),
                    Positioned(
                      top: 12,
                      left: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          item['tag']!,
                          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
                Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item['title']!,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF0F172A)),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        item['desc']!,
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade600, height: 1.4),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          const Icon(Icons.access_time, size: 14, color: Colors.grey),
                          const SizedBox(width: 4),
                          Text(item['date']!, style: const TextStyle(fontSize: 11, color: Colors.grey)),
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
