import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Brand block shown above the title on every auth screen (login/register/
/// forgot/reset password), matching packages/ui's AuthLayout.tsx brand panel:
/// gradient logo mark + "Rent"+"Wheels" gradient wordmark + a short tagline.
/// Web puts this in a full-height split panel on desktop; on mobile it's a
/// compact header sitting above the form instead.
class AuthBrandHeader extends StatelessWidget {
  final String tagline;
  final IconData icon;

  const AuthBrandHeader({super.key, required this.tagline, this.icon = Icons.directions_car_rounded});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.secondary, AppColors.accent],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(14),
            boxShadow: [BoxShadow(color: AppColors.secondary.withValues(alpha: 0.35), blurRadius: 20, offset: const Offset(0, 6))],
          ),
          alignment: Alignment.center,
          child: Icon(icon, color: Colors.white, size: 24),
        ),
        const SizedBox(height: 14),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text("Rent", style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.textOf(context))),
            ShaderMask(
              shaderCallback: (bounds) =>
                  const LinearGradient(colors: [AppColors.secondary, AppColors.accent]).createShader(bounds),
              child: const Text("Wheels", style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          tagline,
          style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppColors.mutedTextOf(context), letterSpacing: 0.2),
        ),
      ],
    );
  }
}
