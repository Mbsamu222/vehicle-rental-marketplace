import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

import 'firebase_options.dart';
import 'router.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  runApp(ProviderScope(
    overrides: [
      marketplaceApiProvider.overrideWithValue(MarketplaceApi(baseUrl: AppConfig.defaultApiBaseUrl)),
      allowedUserTypesProvider.overrideWithValue(const [UserType.rentalPartner]),
    ],
    child: const PartnerApp(),
  ));
}

class PartnerApp extends ConsumerWidget {
  const PartnerApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(partnerRouterProvider);
    final themeMode = ref.watch(themeModeProvider);
    return MaterialApp.router(
      title: "RentalMarketplace Partner",
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(accent: AppColors.accent),
      darkTheme: AppTheme.dark(accent: AppColors.accent),
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
