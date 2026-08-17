import 'package:flutter/material.dart';
import '../../core/theme.dart';

class MedicalHistoryView extends StatelessWidget {
  const MedicalHistoryView({super.key});

  @override
  Widget build(BuildContext context) {
    final visits = [
      {
        'date': '02 Tháng 08, 2026',
        'clinic': 'Khoa Nội Tổng Hợp',
        'doctor': 'BS. CKII. Nguyễn Thanh Duy',
        'icd10': 'J02.9 - Viêm họng cấp tính',
        'status': 'Đã hoàn thành',
        'cost': '385.000 VNĐ',
        'medicines': [
          {'name': 'Paracetamol 500mg', 'qty': '15 viên', 'usage': 'Sáng 1v, Tối 1v sau ăn'},
          {'name': 'Augmentin 1g', 'qty': '10 viên', 'usage': 'Sáng 1v, Tối 1v sau ăn no'},
        ]
      },
      {
        'date': '14 Tháng 05, 2026',
        'clinic': 'Khoa Tiêu Hóa',
        'doctor': 'BS. CKI. Lê Văn Tuấn',
        'icd10': 'K29.7 - Viêm dạ dày - tá tràng cấp',
        'status': 'Đã hoàn thành',
        'cost': '1.250.000 VNĐ',
        'medicines': [
          {'name': 'Esomeprazole 40mg', 'qty': '14 viên', 'usage': 'Sáng 1v trước ăn 30p'},
          {'name': 'Phosphalugel', 'qty': '20 gói', 'usage': 'Uống khi đau 1 gói'},
        ]
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Lịch sử Khám & Đơn thuốc EMR'),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: visits.length,
        itemBuilder: (context, index) {
          final visit = visits[index];
          final medicines = visit['medicines'] as List<Map<String, String>>;

          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            elevation: 3,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    alignment: WrapAlignment.spaceBetween,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      Text(
                        visit['date'] as String,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.primaryDark),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.green.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.green.shade200),
                        ),
                        child: Text(
                          visit['status'] as String,
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.green.shade700),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${visit['clinic']} • ${visit['doctor']}',
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade700, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.label_outlined, size: 16, color: AppTheme.primaryColor),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Chẩn đoán: ${visit['icd10']}',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 20),

                  // Medicines Section
                  const Text(
                    'Đơn thuốc Điện tử:',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primaryColor),
                  ),
                  const SizedBox(height: 8),
                  ...medicines.map((m) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.medication_outlined, size: 16, color: Colors.teal),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${m['name']} (${m['qty']})',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                  ),
                                  Text(
                                    'HDSD: ${m['usage']}',
                                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      )),

                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(Icons.payments_outlined, size: 18, color: AppTheme.primaryColor),
                      const SizedBox(width: 8),
                      Text(
                        'Tổng chi phí viện phí: ${visit['cost']}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.primaryDark),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _showQrPaymentDialog(BuildContext context, String amount) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.qr_code_2, color: AppTheme.primaryColor, size: 28),
            SizedBox(width: 10),
            Text('Mã VietQR Thanh toán'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFBAE6FD)),
              ),
              child: Image.network(
                'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=VIETQR_HOSPITAL_AI_$amount',
                width: 180,
                height: 180,
                fit: BoxFit.contain,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Số tiền thanh toán: $amount',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.primaryDark),
            ),
            const SizedBox(height: 4),
            const Text(
              'Quét mã qua ứng dụng ngân hàng hoặc MoMo / VNPay',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, color: Colors.grey),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }
}
