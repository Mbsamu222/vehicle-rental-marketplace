import 'package:flutter/material.dart';

import '../models/enums.dart';
import '../theme/app_colors.dart';

const _happyPathSteps = [
  BookingStatus.pending,
  BookingStatus.approved,
  BookingStatus.vehicleReady,
  BookingStatus.pickedUp,
  BookingStatus.active,
  BookingStatus.returning,
  BookingStatus.completed,
];

/// Visual rental-tracking stepper — mirrors packages/ui's
/// `BookingStatusTimeline`. Cancelled/rejected bookings render as a single
/// terminal notice instead of a step list, matching the web behavior.
class BookingStatusTimeline extends StatelessWidget {
  final BookingStatus currentStatus;
  const BookingStatusTimeline({super.key, required this.currentStatus});

  @override
  Widget build(BuildContext context) {
    if (currentStatus.isTerminalNegative) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: AppColors.danger.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(16)),
        child: Row(
          children: [
            const Icon(Icons.cancel_outlined, color: AppColors.danger),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                currentStatus == BookingStatus.cancelled ? "This booking was cancelled." : "This booking was rejected.",
                style: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      );
    }

    final currentIndex = _happyPathSteps.indexOf(currentStatus);
    return Column(
      children: [
        for (var i = 0; i < _happyPathSteps.length; i++)
          _StepRow(
            step: _happyPathSteps[i],
            isLast: i == _happyPathSteps.length - 1,
            state: i < currentIndex
                ? _StepState.done
                : i == currentIndex
                    ? _StepState.current
                    : _StepState.upcoming,
          ),
      ],
    );
  }
}

enum _StepState { done, current, upcoming }

class _StepRow extends StatelessWidget {
  final BookingStatus step;
  final bool isLast;
  final _StepState state;
  const _StepRow({required this.step, required this.isLast, required this.state});

  @override
  Widget build(BuildContext context) {
    // Matches packages/ui's BookingStatusTimeline node spec exactly: 32px
    // circle, done=success+check, current=secondary with a 4px 20%-opacity
    // ring, pending=light primary-100 (no icon).
    final nodeColor = switch (state) {
      _StepState.done => AppColors.success,
      _StepState.current => AppColors.secondary,
      _StepState.upcoming => AppColors.primary100,
    };
    final connectorColor = state == _StepState.done ? AppColors.success : AppColors.primary100;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 32,
                height: 32,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: nodeColor,
                  shape: BoxShape.circle,
                  border: state == _StepState.current
                      ? Border.all(color: AppColors.secondary.withValues(alpha: 0.2), width: 4)
                      : null,
                ),
                child: state == _StepState.done
                    ? const Icon(Icons.check, color: Colors.white, size: 18)
                    : state == _StepState.current
                        ? const Icon(Icons.circle, color: Colors.white, size: 10)
                        : null,
              ),
              if (!isLast) Expanded(child: Container(width: 2, constraints: const BoxConstraints(minHeight: 28), color: connectorColor)),
            ],
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 22, top: 6),
              child: Text(
                step.label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: state == _StepState.upcoming ? AppColors.primary400 : AppColors.primary900,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
