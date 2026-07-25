import 'package:flutter/material.dart';

/// Matches packages/config/tailwind-preset.cjs's `boxShadow` tokens exactly
/// (`shadow-soft` / `shadow-card` / `shadow-glass`) so cards read the same
/// depth on mobile as on web.
class AppShadows {
  AppShadows._();

  static const soft = [
    BoxShadow(color: Color(0x0F111827), blurRadius: 8, offset: Offset(0, 2)),
  ];

  static const card = [
    BoxShadow(color: Color(0x14111827), blurRadius: 20, spreadRadius: -2, offset: Offset(0, 4)),
  ];

  static const glass = [
    BoxShadow(color: Color(0x1A111827), blurRadius: 32, offset: Offset(0, 8)),
  ];
}
