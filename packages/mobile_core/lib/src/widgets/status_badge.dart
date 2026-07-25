import 'package:flutter/material.dart';

import '../models/enums.dart';
import '../theme/app_colors.dart';

enum BadgeTone { neutral, success, warning, danger, info, accent }

/// Pill badge matching packages/ui's Badge.tsx exactly: light tone background,
/// dark-on-light tone text, `rounded-full px-2.5 py-1 text-xs font-semibold`.
class StatusBadge extends StatelessWidget {
  final String label;
  final BadgeTone tone;
  final Color? _colorOverride;
  const StatusBadge({super.key, required this.label, required this.tone}) : _colorOverride = null;

  /// Escape hatch for a one-off color that doesn't map to a tone.
  const StatusBadge.color({super.key, required this.label, required Color color})
      : tone = BadgeTone.neutral,
        _colorOverride = color;

  /// Mirrors the web app's exact BookingStatus → tone map (see
  /// packages/ui's BookingStatusBadge): PENDING=warning,
  /// CONFIRMED/APPROVED/VEHICLE_READY=info, REJECTED=danger,
  /// PICKED_UP/ACTIVE=accent, RETURNING=warning, COMPLETED=success,
  /// CANCELLED=neutral.
  factory StatusBadge.booking(BookingStatus status) => StatusBadge(
        label: status.label,
        tone: switch (status) {
          BookingStatus.pending || BookingStatus.returning => BadgeTone.warning,
          BookingStatus.confirmed || BookingStatus.approved || BookingStatus.vehicleReady => BadgeTone.info,
          BookingStatus.rejected => BadgeTone.danger,
          BookingStatus.pickedUp || BookingStatus.active => BadgeTone.accent,
          BookingStatus.completed => BadgeTone.success,
          _ => BadgeTone.neutral,
        },
      );

  factory StatusBadge.document(DocumentStatus status) => StatusBadge(
        label: switch (status) {
          DocumentStatus.approved => "Approved",
          DocumentStatus.rejected => "Rejected",
          _ => "Pending",
        },
        tone: switch (status) {
          DocumentStatus.approved => BadgeTone.success,
          DocumentStatus.rejected => BadgeTone.danger,
          _ => BadgeTone.warning,
        },
      );

  factory StatusBadge.verification(PartnerVerificationStatus status) => StatusBadge(
        label: switch (status) {
          PartnerVerificationStatus.verified => "Verified",
          PartnerVerificationStatus.rejected => "Rejected",
          PartnerVerificationStatus.underReview => "Under review",
          _ => "Pending",
        },
        tone: switch (status) {
          PartnerVerificationStatus.verified => BadgeTone.success,
          PartnerVerificationStatus.rejected => BadgeTone.danger,
          PartnerVerificationStatus.underReview => BadgeTone.info,
          _ => BadgeTone.warning,
        },
      );

  factory StatusBadge.approval(VehicleApprovalStatus status) => StatusBadge(
        label: switch (status) {
          VehicleApprovalStatus.approved => "Approved",
          VehicleApprovalStatus.rejected => "Rejected",
          _ => "Pending",
        },
        tone: switch (status) {
          VehicleApprovalStatus.approved => BadgeTone.success,
          VehicleApprovalStatus.rejected => BadgeTone.danger,
          _ => BadgeTone.warning,
        },
      );

  factory StatusBadge.support(SupportTicketStatus status) => StatusBadge(
        label: status.label,
        tone: switch (status) {
          SupportTicketStatus.resolved => BadgeTone.success,
          SupportTicketStatus.closed => BadgeTone.neutral,
          SupportTicketStatus.inProgress => BadgeTone.info,
          _ => BadgeTone.warning,
        },
      );

  (Color, Color) _colors(BuildContext context) {
    if (_colorOverride != null) return (_colorOverride.withValues(alpha: 0.16), _colorOverride);
    final dark = AppColors.isDark(context);
    return switch (tone) {
      BadgeTone.success => dark ? (AppColors.successBgDark, AppColors.successTextDark) : (AppColors.successBg, AppColors.successText),
      BadgeTone.warning => dark ? (AppColors.warningBgDark, AppColors.warningTextDark) : (AppColors.warningBg, AppColors.warningText),
      BadgeTone.danger => dark ? (AppColors.dangerBgDark, AppColors.dangerTextDark) : (AppColors.dangerBg, AppColors.dangerText),
      BadgeTone.info => dark ? (AppColors.infoBgDark, AppColors.infoTextDark) : (AppColors.infoBg, AppColors.infoText),
      BadgeTone.accent => dark ? (AppColors.accentBgDark, AppColors.accentTextDark) : (AppColors.accentBg, AppColors.accentText),
      BadgeTone.neutral => dark ? (AppColors.neutralBgDark, AppColors.neutralTextDark) : (AppColors.neutralBg, AppColors.neutralText),
    };
  }

  @override
  Widget build(BuildContext context) {
    final (bg, text) = _colors(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Text(label, style: TextStyle(color: text, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}
