import 'package:flutter/material.dart';
import '../../core/theme.dart';

class HelpCenterView extends StatelessWidget {
  const HelpCenterView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Trung tâm Trợ giúp'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Contact Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFBAE6FD)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE0F2FE),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.headset_mic, color: AppTheme.primaryColor, size: 32),
                  ),
                  const SizedBox(width: 16),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Tổng đài CSKH (24/7)', style: TextStyle(color: Color(0xFF64748B), fontSize: 13)),
                        SizedBox(height: 4),
                        Text('1900 1234', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.primaryDark)),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.phone, color: Colors.green),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Đang gọi 1900 1234...')),
                      );
                    },
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            const Text(
              'Câu hỏi thường gặp (FAQ)',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
            ),
            const SizedBox(height: 12),
            
            _buildFaqItem(
              'Làm thế nào để lấy số thứ tự trực tuyến?',
              'Bạn có thể vào tab "Trang chủ", bấm vào nút "Đặt khám" và chọn chuyên khoa. Số thứ tự sẽ được cấp tự động sau khi đặt thành công.',
            ),
            _buildFaqItem(
              'Tôi có thể sử dụng Thẻ BHYT điện tử thay thẻ giấy không?',
              'Có, mã QR trên Thẻ BHYT điện tử trong ứng dụng hoàn toàn có giá trị pháp lý và được chấp nhận tại tất cả quầy tiếp nhận.',
            ),
            _buildFaqItem(
              'Làm sao để thanh toán viện phí?',
              'Sau khi khám xong, hệ thống sẽ gửi hóa đơn điện tử vào mục "Lịch sử thanh toán". Bạn có thể mở lên và quét mã VietQR bằng bất kỳ ứng dụng Ngân hàng/Ví điện tử nào.',
            ),
            _buildFaqItem(
              'Dữ liệu hồ sơ bệnh án của tôi có được bảo mật không?',
              'Hoàn toàn bảo mật. Dữ liệu của bạn được mã hóa an toàn theo tiêu chuẩn Y tế Quốc tế (HIPAA) và chỉ có bạn (hoặc bác sĩ được ủy quyền) mới có thể xem được.',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFaqItem(String question, String answer) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 0,
      color: Colors.white,
      child: ExpansionTile(
        title: Text(
          question,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppTheme.primaryDark),
        ),
        iconColor: AppTheme.primaryColor,
        collapsedIconColor: Colors.grey,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
            child: Text(
              answer,
              style: const TextStyle(fontSize: 13, color: Color(0xFF475569), height: 1.5),
            ),
          ),
        ],
      ),
    );
  }
}
