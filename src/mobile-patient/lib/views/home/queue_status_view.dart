import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../core/theme.dart';

class QueueStatusView extends StatefulWidget {
  const QueueStatusView({super.key});

  @override
  State<QueueStatusView> createState() => _QueueStatusViewState();
}

class _QueueStatusViewState extends State<QueueStatusView> {
  int myTicket = 103;
  int currentCallingTicket = 101;
  bool isAlertEnabled = true;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _fetchLiveQueue();
    _timer = Timer.periodic(const Duration(seconds: 3), (_) => _fetchLiveQueue());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _fetchLiveQueue() async {
    try {
      final res = await http.get(Uri.parse('http://localhost:5000/api/queue'));
      if (res.statusCode == 200) {
        final List data = jsonDecode(res.body);
        final calling = data.firstWhere((t) => t['status'] == 'Calling', orElse: () => null);
        if (calling != null) {
          setState(() {
            currentCallingTicket = calling['sequenceNumber'] ?? currentCallingTicket;
          });
        }
      }
    } catch (_) {
      // Offline fallback
    }
  }

  @override
  Widget build(BuildContext context) {
    int remainingCount = myTicket - currentCallingTicket;
    double progress = (currentCallingTicket % 100) / (myTicket % 100);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Theo dõi Hàng chờ Trực tiếp'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Đã cập nhật tiến trình hàng chờ mới nhất!')),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Status Header Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primaryColor, AppTheme.primaryDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primaryColor.withOpacity(0.3),
                    blurRadius: 15,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                children: [
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.local_hospital, color: Colors.white70, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'KHOA NỘI TỔNG HỢP - PHÒNG KHÁM 102',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'STT CỦA BẠN',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.8),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 1.2,
                    ),
                  ),
                  Text(
                    '#$myTicket',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 48,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'monospace',
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.timer_outlined, color: Colors.amber, size: 16),
                        const SizedBox(width: 6),
                        Text(
                          'Dự kiến phục vụ: 09:15 AM (Còn ~${remainingCount * 10} phút)',
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Realtime Progress Indicator Card
            Card(
              elevation: 3,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Tiến trình Hàng chờ Phòng khám',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                        ),
                        Row(
                          children: [
                            CircleAvatar(radius: 4, backgroundColor: Colors.green),
                            SizedBox(width: 6),
                            Text('Trực tuyến', style: TextStyle(fontSize: 11, color: Colors.green, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        Flexible(
                          child: _buildTicketStatusBox(
                            title: 'Đang phục vụ',
                            number: '#$currentCallingTicket',
                            color: Colors.green,
                            subtitle: 'Bệnh nhân An',
                          ),
                        ),
                        const Icon(Icons.arrow_forward_ios, color: Colors.grey, size: 14),
                        Flexible(
                          child: _buildTicketStatusBox(
                            title: 'Lượt chờ trước',
                            number: '$remainingCount lượt',
                            color: Colors.orange,
                            subtitle: 'Ước tính ${remainingCount * 10} phút',
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 18),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: LinearProgressIndicator(
                        value: progress,
                        minHeight: 10,
                        backgroundColor: const Color(0xFFE0F2FE),
                        valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Doctor & Clinic Info Card
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const CircleAvatar(
                        radius: 24,
                        backgroundColor: Color(0xFFE0F2FE),
                        child: Icon(Icons.medical_services_outlined, color: AppTheme.primaryColor),
                      ),
                      title: const Text(
                        'BS. CKII. Nguyễn Thanh Duy',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      subtitle: const Text('Phụ trách khám lâm sàng & Kê đơn EMR'),
                    ),
                    const Divider(height: 16),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      value: isAlertEnabled,
                      activeColor: AppTheme.primaryColor,
                      title: const Text('Nhắc nhở qua Thông báo Đẩy', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                      subtitle: const Text('Tự động rung & báo âm thanh khi còn 2 người nữa là tới lượt bạn', style: TextStyle(fontSize: 11)),
                      onChanged: (val) {
                        setState(() {
                          isAlertEnabled = val;
                        });
                      },
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

  Widget _buildTicketStatusBox({required String title, required String number, required Color color, required String subtitle}) {
    return Column(
      children: [
        Text(title, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
        const SizedBox(height: 4),
        Text(
          number,
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color),
        ),
        const SizedBox(height: 2),
        Text(subtitle, style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
      ],
    );
  }
}
