import 'package:flutter/material.dart';

/// Port of apps/public-site/src/utils/categoryIcons.tsx. Category names are
/// admin-authored free text, so the icon is picked by keyword rather than by a
/// fixed enum — same keyword list and same fallback as the web.
IconData categoryIcon(String name) {
  final lower = name.toLowerCase();
  if (lower.contains("bike") || lower.contains("scooter") || lower.contains("motorcycle")) {
    return Icons.two_wheeler;
  }
  if (lower.contains("electric") || lower.contains("ev")) return Icons.bolt;
  if (lower.contains("luxury") || lower.contains("premium")) return Icons.workspace_premium;
  if (lower.contains("suv") || lower.contains("crossover") || lower.contains("4x4")) return Icons.shield_outlined;
  if (lower.contains("sedan") || lower.contains("saloon")) return Icons.speed;
  if (lower.contains("hatchback") || lower.contains("compact")) return Icons.directions_car_filled_outlined;
  return Icons.directions_car_filled_outlined;
}
