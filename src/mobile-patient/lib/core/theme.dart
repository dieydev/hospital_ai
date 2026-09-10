import 'package:flutter/material.dart';

class AppTheme {
  static const Color primaryColor = Color(0xFF0284C7); // Sky 600
  static const Color primaryDark = Color(0xFF0369A1);  // Sky 700
  static const Color secondaryColor = Color(0xFF0EA5E9);
  static const Color backgroundColor = Color(0xFFF0F9FF);
  static const Color cardColor = Colors.white;
  static const Color borderColor = Color(0xFFBAE6FD); // Sky 200
  
  static const Color textMain = Color(0xFF0F172A); // Slate 900
  static const Color textSub = Color(0xFF334155); // Slate 700
  static const Color textMuted = Color(0xFF64748B); // Slate 500

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

  // Standard Premium Box Shadow
  static List<BoxShadow> get premiumShadow => [
    BoxShadow(
      color: primaryColor.withOpacity(0.1),
      blurRadius: 30,
      offset: const Offset(0, 10),
    )
  ];

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: backgroundColor,
      appBarTheme: const AppBarTheme(
        backgroundColor: primaryDark,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
      ),
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        primary: primaryColor,
        secondary: secondaryColor,
      ),
      cardTheme: CardThemeData(
        color: cardColor,
        elevation: 0, // We use custom shadow instead
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: borderColor, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
