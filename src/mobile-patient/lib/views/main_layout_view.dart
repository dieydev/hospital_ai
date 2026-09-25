import 'package:flutter/material.dart';
import '../core/theme.dart';
import 'home/home_view.dart';
import 'appointment/book_appointment_view.dart';
import 'appointment/medical_history_view.dart';
import 'news/medical_news_view.dart';
import 'profile/account_profile_view.dart';

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
      const BookAppointmentView(),
      const MedicalHistoryView(),
      const MedicalNewsView(),
      const AccountProfileView(),
    ];

    return Scaffold(
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        switchInCurve: Curves.easeIn,
        switchOutCurve: Curves.easeOut,
        child: pages[_currentIndex],
      ),
      bottomNavigationBar: NavigationBarTheme(
        data: NavigationBarThemeData(
          indicatorColor: AppTheme.primaryColor.withValues(alpha: 0.15),
          labelTextStyle: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppTheme.primaryColor);
            }
            return const TextStyle(fontWeight: FontWeight.normal, fontSize: 11, color: Color(0xFF94A3B8));
          }),
        ),
        child: NavigationBar(
          selectedIndex: _currentIndex,
          onDestinationSelected: _changeTab,
          backgroundColor: Colors.white,
          elevation: 8,
          shadowColor: Colors.black.withValues(alpha: 0.08),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.home_outlined, color: Color(0xFF94A3B8)),
              selectedIcon: Icon(Icons.home, color: AppTheme.primaryColor),
              label: 'Trang chủ',
            ),
            NavigationDestination(
              icon: Icon(Icons.calendar_month_outlined, color: Color(0xFF94A3B8)),
              selectedIcon: Icon(Icons.calendar_month, color: AppTheme.primaryColor),
              label: 'Lịch khám',
            ),
            NavigationDestination(
              icon: Icon(Icons.folder_outlined, color: Color(0xFF94A3B8)),
              selectedIcon: Icon(Icons.folder, color: AppTheme.primaryColor),
              label: 'Bệnh án',
            ),
            NavigationDestination(
              icon: Icon(Icons.article_outlined, color: Color(0xFF94A3B8)),
              selectedIcon: Icon(Icons.article, color: AppTheme.primaryColor),
              label: 'Tin tức',
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline, color: Color(0xFF94A3B8)),
              selectedIcon: Icon(Icons.person, color: AppTheme.primaryColor),
              label: 'Cá nhân',
            ),
          ],
        ),
      ),
    );
  }
}
