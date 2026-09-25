import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // New Design System Tokens
  static const Color primary = Color(0xFF0284C7); // Sky 600
  static const Color primaryDark = Color(0xFF0369A1); // Sky 700
  static const Color primaryDeep = Color(0xFF062A3D); // Gradient in topbar/CTA
  static const Color accentMint = Color(0xFF14B8A6); // LIVE, badge success
  static const Color background = Color(0xFFF4F8FA);
  static const Color surface = Colors.white;
  static const Color borderSubtle = Color(0xFFE3EDF1);
  
  static const Color textPrimary = Color(0xFF0B2431);
  static const Color textSecondary = Color(0xFF4A6373);

  // Keep old names for compatibility, point to new tokens where applicable
  static const Color primaryColor = primary;
  static const Color textMain = textPrimary;
  static const Color textSub = textSecondary;
  static const Color textMuted = textSecondary;

  // Standard Premium Medical Gradient
  static const LinearGradient premiumGradient = LinearGradient(
    colors: [
      Color(0xFFE0F2FE), // Sky 100
      Color(0xFFF0F9FF), // Sky 50
      Color(0xFFE2E8F0), // Slate 200
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Important CTA Shadow
  static List<BoxShadow> get prominentShadow => [
    BoxShadow(
      color: primary.withValues(alpha: 0.14),
      blurRadius: 34,
      offset: const Offset(0, 14),
    )
  ];

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      primaryColor: primary,
      scaffoldBackgroundColor: background,
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
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
