import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Lớp điều khiển cuộn mượt mà chuẩn iOS Bouncing Physics cho toàn bộ App
class SmoothScrollBehavior extends MaterialScrollBehavior {
  const SmoothScrollBehavior();

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) {
    return const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics());
  }
}

class AppTheme {
  // Bảng màu Y tế Số Chuẩn Bắt buộc (Strict Medical AI Theme - AGENTS.md)
  static const Color primary = Color(0xFF0284C7); // Sky 600 - Nút bấm, Link, Active, Accent
  static const Color primaryDark = Color(0xFF0369A1); // Sky 700 - Tiêu đề, Header, Highlight
  static const Color primaryDeep = Color(0xFF0B2431); // Slate Deep
  static const Color accentMint = Color(0xFF14B8A6); // LIVE, Badge Success
  static const Color background = Color(0xFFF0F9FF); // Background Soft Light
  static const Color surface = Colors.white; // Card Background Pure White
  static const Color borderSubtle = Color(0xFFBAE6FD); // Sky 200 - Border Color
  
  static const Color textPrimary = Color(0xFF0F172A); // Slate 900 - Text Main / Headings
  static const Color textSecondary = Color(0xFF334155); // Slate 700 - Text Sub-label / Form Label
  static const Color textMuted = Color(0xFF64748B); // Slate 500 - Text Muted / Secondary
  static const Color textPlaceholder = Color(0xFF94A3B8); // Slate 400 - Text Placeholder / Disabled

  // Tương thích ngược với các module cũ
  static const Color primaryColor = primary;
  static const Color textMain = textPrimary;
  static const Color textSub = textSecondary;

  // Background Gradient chuẩn (Trang web & Banner)
  static const LinearGradient premiumGradient = LinearGradient(
    colors: [
      Color(0xFFE0F2FE), // Sky 100
      Color(0xFFF0F9FF), // Sky 50
      Color(0xFFE2E8F0), // Slate 200
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Card Box Shadow: 0 10px 30px rgba(2, 132, 199, 0.1)
  static List<BoxShadow> get prominentShadow => [
    const BoxShadow(
      color: Color.fromRGBO(2, 132, 199, 0.1),
      blurRadius: 30,
      offset: Offset(0, 10),
    )
  ];

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      primaryColor: primary,
      scaffoldBackgroundColor: background,
      splashFactory: InkSparkle.splashFactory,
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: CupertinoPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        },
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: primaryDark,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.sora(fontSize: 18, fontWeight: FontWeight.bold),
      ),
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        primary: primary,
        secondary: accentMint,
        surface: surface,
      ),
      textTheme: GoogleFonts.interTextTheme().copyWith(
        displayLarge: GoogleFonts.sora(color: textPrimary, fontWeight: FontWeight.w800),
        displayMedium: GoogleFonts.sora(color: textPrimary, fontWeight: FontWeight.w700),
        displaySmall: GoogleFonts.sora(color: textPrimary, fontWeight: FontWeight.w700),
        headlineLarge: GoogleFonts.sora(color: textPrimary, fontWeight: FontWeight.w700),
        headlineMedium: GoogleFonts.sora(color: textPrimary, fontWeight: FontWeight.w600),
        headlineSmall: GoogleFonts.sora(color: textPrimary, fontWeight: FontWeight.w600),
        titleLarge: GoogleFonts.sora(color: textPrimary, fontWeight: FontWeight.w600),
        titleMedium: GoogleFonts.sora(color: textPrimary, fontWeight: FontWeight.w600),
        titleSmall: GoogleFonts.sora(color: textPrimary, fontWeight: FontWeight.w600),
        bodyLarge: GoogleFonts.inter(color: textPrimary, fontWeight: FontWeight.w400),
        bodyMedium: GoogleFonts.inter(color: textPrimary, fontWeight: FontWeight.w400),
        bodySmall: GoogleFonts.inter(color: textSecondary, fontWeight: FontWeight.w400),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0, 
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: borderSubtle, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: borderSubtle),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: borderSubtle),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: primary, width: 1.8),
        ),
        hintStyle: GoogleFonts.inter(color: textPlaceholder, fontSize: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(48),
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
