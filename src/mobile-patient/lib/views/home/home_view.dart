import 'package:flutter/material.dart';
import '../../core/theme.dart';
import '../appointment/book_appointment_view.dart';
import '../appointment/medical_history_view.dart';
import 'queue_status_view.dart';

class HomeView extends StatefulWidget {
  final Function(int)? onNavigateTab;
  const HomeView({super.key, this.onNavigateTab});

  @override
  State<HomeView> createState() => _HomeViewState();
}

class _HomeViewState extends State<HomeView> {
  int _bannerIndex = 0;

  final List<String> _banners = [
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: AppTheme.primaryColor,
        elevation: 0,
        title: const SizedBox.shrink(),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined, color: Colors.white, size: 28),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('🔔 Không có thông báo mới!'), duration: Duration(seconds: 1)),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  // Top Hospital Header Branding (Matching Reference Image)
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(
                      children: [
                        // Hospital Logo Emblem
                        Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: const Color(0xFFBAE6FD), width: 2),
                            color: const Color(0xFFF0F9FF),
                          ),
                          child: const Icon(Icons.local_hospital_rounded, color: AppTheme.primaryColor, size: 30),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Bệnh viện Đa Khoa Thủ Đức',
                                style: TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primaryDark,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Chuyên Nghiệp - Tận Tâm - Vươn Tầm Chất Lượng',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey.shade600,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Hospital Banner Image Carousel with Dot Indicators
                  Stack(
                    alignment: Alignment.bottomLeft,
                    children: [
                      SizedBox(
                        height: 200,
                        width: double.infinity,
                        child: PageView.builder(
                          itemCount: _banners.length,
                          onPageChanged: (index) => setState(() => _bannerIndex = index),
                          itemBuilder: (context, index) {
                            return Image.network(
                              _banners[index],
                              fit: BoxFit.cover,
                              width: double.infinity,
                            );
                          },
                        ),
                      ),
                      // Carousel Dots
                      Positioned(
                        bottom: 12,
                        left: 16,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black38,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            children: List.generate(_banners.length, (i) {
                              return Container(
                                margin: const EdgeInsets.symmetric(horizontal: 3),
                                width: _bannerIndex == i ? 16 : 6,
                                height: 6,
                                decoration: BoxDecoration(
                                  color: _bannerIndex == i ? Colors.white : Colors.white54,
                                  borderRadius: BorderRadius.circular(3),
                                ),
                              );
                            }),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Quick Utility Services Grid (Matching Reference Screenshot)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildQuickServiceItem(
                          icon: Icons.headset_mic_outlined,
                          label: 'Hỗ trợ\nđặt khám',
                          onTap: () {
                            if (widget.onNavigateTab != null) {
                              widget.onNavigateTab!(1);
                            } else {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => const BookAppointmentView()));
                            }
                          },
                        ),
                        _buildQuickServiceItem(
                          icon: Icons.history_edu_outlined,
                          label: 'Lịch sử\nthanh toán',
                          onTap: () {
                            if (widget.onNavigateTab != null) {
                              widget.onNavigateTab!(3);
                            } else {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => const MedicalHistoryView()));
                            }
                          },
                        ),
                        _buildQuickServiceItem(
                          icon: Icons.receipt_long_outlined,
                          label: 'Tra cứu\nhoá đơn',
                          onTap: () {
                            if (widget.onNavigateTab != null) {
                              widget.onNavigateTab!(3);
                            } else {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => const MedicalHistoryView()));
                            }
                          },
                        ),
                        _buildQuickServiceItem(
                          icon: Icons.folder_shared_outlined,
                          label: 'Hồ sơ\nsức khỏe',
                          onTap: () {
                            if (widget.onNavigateTab != null) {
                              widget.onNavigateTab!(3);
                            } else {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => const MedicalHistoryView()));
                            }
                          },
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),

          // Prominent "Đặt khám" Action Button Fixed Above Bottom Nav Bar (Matching Reference)
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onPressed: () {
                  if (widget.onNavigateTab != null) {
                    widget.onNavigateTab!(1);
                  } else {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const BookAppointmentView()),
                    );
                  }
                },
                child: const Text(
                  'Đặt khám',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickServiceItem({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF0F9FF),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFBAE6FD)),
            ),
            child: Icon(icon, color: AppTheme.primaryColor, size: 28),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Color(0xFF334155),
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}
