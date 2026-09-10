import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../providers/queue_provider.dart';
import '../appointment/book_appointment_view.dart';
import '../appointment/medical_history_view.dart';
import '../../widgets/animated_premium_card.dart';

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
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppTheme.premiumGradient,
        ),
        child: Column(
          children: [
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  // Top Hospital Header Branding (Animated on load)
                  TweenAnimationBuilder(
                    duration: const Duration(milliseconds: 600),
                    tween: Tween<double>(begin: 0, end: 1),
                    builder: (context, double value, child) {
                      return Opacity(
                        opacity: value,
                        child: Transform.translate(
                          offset: Offset(0, 20 * (1 - value)),
                          child: child,
                        ),
                      );
                    },
                    child: Container(
                      color: Colors.transparent, // Let gradient show through or keep white? Let's use semi-transparent white
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
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Bệnh viện Đa Khoa Thủ Đức',
                                  style: TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primaryDark,
                                  ),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'Chuyên Nghiệp - Tận Tâm - Vươn Tầm Chất Lượng',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: AppTheme.textMuted,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
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

                  const SizedBox(height: 16),
                  
                  // Live Queue Ticket Card
                  Consumer<QueueProvider>(
                    builder: (context, queue, child) {
                      if (!queue.hasActiveTicket) return const SizedBox.shrink();
                      
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF0ea5e9), Color(0xFF0284c7)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF0284c7).withOpacity(0.3),
                                blurRadius: 16,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(6),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.2),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: const Icon(Icons.confirmation_num_outlined, color: Colors.white, size: 20),
                                      ),
                                      const SizedBox(width: 10),
                                      const Text(
                                        'PHIẾU KHÁM CỦA BẠN',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF10b981),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: const Row(
                                      children: [
                                        Icon(Icons.sync, color: Colors.white, size: 12),
                                        SizedBox(width: 4),
                                        Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('Số Thứ Tự', style: TextStyle(color: Colors.white70, fontSize: 13)),
                                      Row(
                                        crossAxisAlignment: CrossAxisAlignment.baseline,
                                        textBaseline: TextBaseline.alphabetic,
                                        children: [
                                          const Text('#', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                                          Text('${queue.myNumber}', style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900)),
                                          const SizedBox(width: 12),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: Colors.white.withOpacity(0.15),
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(queue.room, style: const TextStyle(color: Colors.white, fontSize: 12)),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.info_outline, color: AppTheme.primaryColor, size: 20),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: RichText(
                                        text: TextSpan(
                                          style: const TextStyle(color: Colors.black87, fontSize: 13, fontFamily: 'Inter'),
                                          children: [
                                            const TextSpan(text: 'Trạng thái: '),
                                            TextSpan(text: '${queue.status}\n', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFf59e0b))),
                                            const TextSpan(text: 'Đang gọi STT: '),
                                            TextSpan(text: '#${queue.currentNumber}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryColor)),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
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
      ),
    );
  }

  Widget _buildQuickServiceItem({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return AnimatedPremiumCard(
      onTap: onTap,
      padding: EdgeInsets.zero,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: 76,
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.9), // Glassy effect
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF0F9FF),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFBAE6FD)),
              ),
              child: Icon(icon, color: AppTheme.primaryColor, size: 26),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: AppTheme.textSub,
                height: 1.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
