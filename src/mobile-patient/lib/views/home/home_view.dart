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
                  
                  // Live Queue Ticket Card - GLASSMORPHISM OVERHAUL
                  Consumer<QueueProvider>(
                    builder: (context, queue, child) {
                      if (!queue.hasActiveTicket) return const SizedBox.shrink();
                      
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF0284c7), Color(0xFF0369a1)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(24), // Tăng bo góc
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF0284c7).withOpacity(0.4), // Glow mạnh hơn
                                blurRadius: 20,
                                spreadRadius: 2,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.25),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: const Icon(Icons.confirmation_num_rounded, color: Colors.white, size: 24),
                                      ),
                                      const SizedBox(width: 12),
                                      const Text(
                                        'PHIẾU KHÁM',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w900,
                                          fontSize: 18, // Chữ to hơn cho người lớn tuổi
                                          letterSpacing: 1.0,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF10b981),
                                      borderRadius: BorderRadius.circular(20),
                                      boxShadow: [
                                        BoxShadow(color: const Color(0xFF10b981).withOpacity(0.4), blurRadius: 8),
                                      ],
                                    ),
                                    child: const Row(
                                      children: [
                                        Icon(Icons.sensors, color: Colors.white, size: 16),
                                        SizedBox(width: 4),
                                        Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 24),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('Số Thứ Tự Của Bạn', style: TextStyle(color: Colors.white70, fontSize: 15, fontWeight: FontWeight.w500)),
                                      Row(
                                        crossAxisAlignment: CrossAxisAlignment.baseline,
                                        textBaseline: TextBaseline.alphabetic,
                                        children: [
                                          const Text('#', style: TextStyle(color: Colors.white70, fontSize: 32, fontWeight: FontWeight.bold)),
                                          Text('${queue.myNumber}', style: const TextStyle(color: Colors.white, fontSize: 56, fontWeight: FontWeight.w900, height: 1.1)),
                                        ],
                                      ),
                                    ],
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: Colors.white.withOpacity(0.3)),
                                    ),
                                    child: Column(
                                      children: [
                                        const Text('PHÒNG KHÁM', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold)),
                                        const SizedBox(height: 4),
                                        Text(queue.room, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 20),
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF0F9FF),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: const Icon(Icons.info_rounded, color: AppTheme.primaryColor, size: 24),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: RichText(
                                        text: TextSpan(
                                          style: const TextStyle(color: AppTheme.textMain, fontSize: 15, height: 1.4),
                                          children: [
                                            const TextSpan(text: 'Trạng thái: '),
                                            TextSpan(text: '${queue.status}\n', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFf59e0b), fontSize: 16)),
                                            const TextSpan(text: 'Đang gọi STT: '),
                                            TextSpan(text: '#${queue.currentNumber}', style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.primaryColor, fontSize: 20)),
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

                  // Quick Utility Services Grid
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildQuickServiceItem(
                          icon: Icons.calendar_month_rounded,
                          label: 'Lịch khám',
                          onTap: () {
                            if (widget.onNavigateTab != null) {
                              widget.onNavigateTab!(1);
                            } else {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => const BookAppointmentView()));
                            }
                          },
                        ),
                        _buildQuickServiceItem(
                          icon: Icons.history_rounded,
                          label: 'Thanh toán',
                          onTap: () {
                            if (widget.onNavigateTab != null) widget.onNavigateTab!(3);
                          },
                        ),
                        _buildQuickServiceItem(
                          icon: Icons.receipt_long_rounded,
                          label: 'Hóa đơn',
                          onTap: () {
                            if (widget.onNavigateTab != null) widget.onNavigateTab!(3);
                          },
                        ),
                        _buildQuickServiceItem(
                          icon: Icons.folder_shared_rounded,
                          label: 'Hồ sơ',
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

                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),

          // Prominent "Đặt khám" Action Button Fixed Above Bottom Nav Bar
          Container(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24), // Tăng padding dưới cho to
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                )
              ]
            ),
            child: SizedBox(
              width: double.infinity,
              height: 60, // Nút cao và to hơn
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  elevation: 4, // Tăng đổ bóng nút
                  shadowColor: AppTheme.primaryColor.withOpacity(0.5),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
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
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.add_circle_outline, size: 24),
                    SizedBox(width: 12),
                    Text(
                      'ĐẶT KHÁM NGAY',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ],
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
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: 80,
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 4),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.95), // Kính mờ
          boxShadow: [
            BoxShadow(
              color: AppTheme.primaryColor.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ]
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF0F9FF),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFBAE6FD), width: 1.5),
              ),
              child: Icon(icon, color: AppTheme.primaryColor, size: 28),
            ),
            const SizedBox(height: 10),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13, // Chữ to hơn
                fontWeight: FontWeight.w700,
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
