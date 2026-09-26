import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'home/home_view.dart';
import 'notifications/notifications_view.dart';
import 'features/all_features_view.dart';
import 'profile/account_profile_view.dart';
import '../widgets/profile_guard.dart';

class MainLayoutView extends StatefulWidget {
  final int initialTab;
  const MainLayoutView({super.key, this.initialTab = 0});

  @override
  State<MainLayoutView> createState() => _MainLayoutViewState();
}

class _MainLayoutViewState extends State<MainLayoutView> {
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialTab;
  }

  void _changeTab(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> pages = [
      HomeView(onNavigateTab: _changeTab),
      const NotificationsView(),
      const AllFeaturesView(),
      const AccountProfileView(),
    ];

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            const ProfileWarningBanner(),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                switchInCurve: Curves.easeIn,
                switchOutCurve: Curves.easeOut,
                child: pages[_currentIndex],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: const Border(top: BorderSide(color: Color(0xFFE2E8F0), width: 1)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        child: NavigationBarTheme(
          data: NavigationBarThemeData(
            indicatorColor: const Color(0xFFE0F2FE), // Soft sky blue active pill
            labelTextStyle: WidgetStateProperty.resolveWith((states) {
              if (states.contains(WidgetState.selected)) {
                return GoogleFonts.inter(
                  fontWeight: FontWeight.bold,
                  fontSize: 11.5,
                  color: const Color(0xFF0284C7),
                );
              }
              return GoogleFonts.inter(
                fontWeight: FontWeight.w500,
                fontSize: 11.5,
                color: const Color(0xFF64748B),
              );
            }),
          ),
          child: NavigationBar(
            selectedIndex: _currentIndex,
            onDestinationSelected: _changeTab,
            backgroundColor: Colors.white,
            elevation: 0,
            height: 65,
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.home_outlined, color: Color(0xFF64748B), size: 24),
                selectedIcon: Icon(Icons.home_rounded, color: Color(0xFF0284C7), size: 26),
                label: 'Trang chủ',
              ),
              NavigationDestination(
                icon: Icon(Icons.notifications_none_rounded, color: Color(0xFF64748B), size: 24),
                selectedIcon: Icon(Icons.notifications_rounded, color: Color(0xFF0284C7), size: 26),
                label: 'Thông báo',
              ),
              NavigationDestination(
                icon: Icon(Icons.layers_outlined, color: Color(0xFF64748B), size: 24),
                selectedIcon: Icon(Icons.layers_rounded, color: Color(0xFF0284C7), size: 26),
                label: 'Chức năng',
              ),
              NavigationDestination(
                icon: Icon(Icons.person_outline_rounded, color: Color(0xFF64748B), size: 24),
                selectedIcon: Icon(Icons.person_rounded, color: Color(0xFF0284C7), size: 26),
                label: 'Cá nhân',
              ),
            ],
          ),
        ),
      ),
    );
  }
}

