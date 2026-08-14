import 'package:flutter/material.dart';

/// Mirrors packages/config/tailwind-preset.cjs so the mobile apps read as the
/// same brand as the three web apps.
class AppColors {
  AppColors._();

  static const primary900 = Color(0xFF111827);
  static const primary800 = Color(0xFF161E2E);
  static const primary700 = Color(0xFF1F2937);
  static const primary600 = Color(0xFF374151);
  static const primary500 = Color(0xFF4B5563);
  static const primary400 = Color(0xFF6B7280);
  static const primary300 = Color(0xFF9CA3AF);
  static const primary200 = Color(0xFFD1D5DB);
  static const primary100 = Color(0xFFE5E7EB);
  static const primary50 = Color(0xFFF3F4F6);

  static const secondary = Color(0xFF2563EB);
  static const secondaryHover = Color(0xFF1D4ED8);
  static const secondary100 = Color(0xFFDBEAFE);
  static const secondary50 = Color(0xFFEFF6FF);

  static const accent = Color(0xFF14B8A6);
  static const accent600 = Color(0xFF0D9488);
  static const accent100 = Color(0xFFCCFBF1);

  static const background = Color(0xFFF9FAFB);
  static const surface = Color(0xFFFFFFFF);
  static const border = Color(0xFFE5E7EB);
  static const success = Color(0xFF22C55E);
  static const warning = Color(0xFFF59E0B);
  static const danger = Color(0xFFEF4444);
  static const link = Color(0xFF2563EB);

  static const darkBackground = Color(0xFF0B0F19);
  static const darkSurface = Color(0xFF111827);
  static const darkBorder = Color(0xFF1F2937);

  // Badge/toast tone pairs — light bg + dark-on-light text, matching
  // packages/ui's Badge.tsx tone map (Tailwind green/amber/red-100/700).
  static const successBg = Color(0xFFDCFCE7);
  static const successText = Color(0xFF15803D);
  static const warningBg = Color(0xFFFEF3C7);
  static const warningText = Color(0xFFB45309);
  static const dangerBg = Color(0xFFFEE2E2);
  static const dangerText = Color(0xFFB91C1C);
  static const infoBg = secondary100;
  static const infoText = secondaryHover;
  static const neutralBg = primary100;
  static const neutralText = primary700;
  static const accentBg = accent100;
  static const accentText = accent600;

  // Dark-mode tone pairs — matching Badge.tsx's `dark:bg-*-500/15 dark:text-*-400`
  // classes (a subtle tinted fill instead of light mode's solid light chip).
  static const successBgDark = Color(0x2622C55E);
  static const successTextDark = Color(0xFF4ADE80);
  static const warningBgDark = Color(0x26F59E0B);
  static const warningTextDark = Color(0xFFFBBF24);
  static const dangerBgDark = Color(0x26EF4444);
  static const dangerTextDark = Color(0xFFF87171);
  static const infoBgDark = Color(0x262563EB);
  static const infoTextDark = Color(0xFF60A5FA);
  static const neutralBgDark = Color(0x1AFFFFFF);
  static const neutralTextDark = Color(0xFFE5E7EB);
  static const accentBgDark = Color(0x2614B8A6);
  static const accentTextDark = Color(0xFF2DD4BF);

  /// True when the ambient [ThemeData.brightness] is dark. Every shared
  /// widget below reads AppColors through the `*Of(context)` helpers so it
  /// switches automatically instead of always rendering the light palette
  /// (mobile starts on light/white, same as the web apps' default, and only
  /// switches to dark when the user taps the theme toggle).
  static bool isDark(BuildContext context) => Theme.of(context).brightness == Brightness.dark;

  static Color surfaceOf(BuildContext context) => isDark(context) ? darkSurface : surface;
  static Color borderOf(BuildContext context) => isDark(context) ? darkBorder : border;
  static Color textOf(BuildContext context) => isDark(context) ? Colors.white : primary900;
  static Color mutedTextOf(BuildContext context) => isDark(context) ? primary300 : primary400;

  /// A faint fill for "muted panel" backgrounds (e.g. spec chips, inline
  /// callouts) that reads as a light tint on light surfaces and a subtle
  /// white-on-dark tint on dark surfaces.
  static Color subtleFillOf(BuildContext context) =>
      isDark(context) ? Colors.white.withValues(alpha: 0.06) : primary50;
}
