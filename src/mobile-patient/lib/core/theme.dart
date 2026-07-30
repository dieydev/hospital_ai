import 'package:flutter/material.dart';

class AppTheme {
  static const Color primary = Color(0xFF0077B6);
  static const Color secondary = Color(0xFF00B4D8);
  static const Color background = Color(0xFFF8F9FA);

  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primary,
      primary: primary,
      secondary: secondary,
      surface: background,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: primary,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: true,
    ),
  );
}
