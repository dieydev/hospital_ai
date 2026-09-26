import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme.dart';
import 'providers/auth_provider.dart';
import 'providers/appointment_provider.dart';
import 'providers/queue_provider.dart';
import 'providers/patient_provider.dart';
import 'providers/settings_provider.dart';
import 'views/auth/login_view.dart';
import 'views/main_layout_view.dart';
import 'views/onboarding/onboarding_view.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => AppointmentProvider()..fetchDepartments()),
        ChangeNotifierProvider(create: (_) => QueueProvider()),
        ChangeNotifierProvider(create: (_) => PatientProvider()),
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
      ],
      child: const HospitalAiPatientApp(),
    ),
  );
}

class HospitalAiPatientApp extends StatelessWidget {
  const HospitalAiPatientApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'D-Medical',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: Consumer2<AuthProvider, SettingsProvider>(
        builder: (context, auth, settings, _) {
          if (auth.isAuthenticated) {
            return const MainLayoutView();
          }
          if (settings.isInitialized && !settings.hasSeenOnboarding) {
            return const OnboardingView();
          }
          return const LoginView();
        },
      ),
    );
  }
}
