import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// An [ElevatedButton] that shows a spinner and disables itself while
/// [onPressed]'s returned future is in flight — every submit/action button
/// in these apps uses this instead of hand-rolling a loading flag.
class LoadingButton extends StatefulWidget {
  final String label;
  final Future<void> Function()? onPressed;
  final bool outlined;
  const LoadingButton({super.key, required this.label, required this.onPressed, this.outlined = false});

  @override
  State<LoadingButton> createState() => _LoadingButtonState();
}

class _LoadingButtonState extends State<LoadingButton> {
  bool _busy = false;

  Future<void> _handle() async {
    final action = widget.onPressed;
    if (action == null || _busy) return;
    setState(() => _busy = true);
    try {
      await action();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final child = _busy
        ? const SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(strokeWidth: 2.2, valueColor: AlwaysStoppedAnimation(Colors.white)),
          )
        : Text(widget.label);

    if (widget.outlined) {
      return SizedBox(
        width: double.infinity,
        child: OutlinedButton(onPressed: widget.onPressed == null || _busy ? null : _handle, child: child),
      );
    }
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(onPressed: widget.onPressed == null || _busy ? null : _handle, child: child),
    );
  }
}

/// Mirrors packages/ui Feedback.tsx's EmptyState: a dashed-border rounded panel
/// with a circular tinted icon chip, a semibold title, and muted description.
/// The dashed border is the recognisable part of the web treatment, so it is
/// drawn here rather than replaced with a bare centred column.
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? message;
  final Widget? action;
  const EmptyState({super.key, required this.icon, required this.title, this.message, this.action});

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);

    return Center(
      child: CustomPaint(
        painter: _DashedBorderPainter(color: AppColors.borderOf(context), radius: 20),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 44),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 56,
                height: 56,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withValues(alpha: 0.05) : AppColors.primary50,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 26, color: AppColors.primary300),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textOf(context)),
              ),
              if (message != null) ...[
                const SizedBox(height: 4),
                Text(
                  message!,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, height: 1.5, color: AppColors.mutedTextOf(context)),
                ),
              ],
              if (action != null) ...[const SizedBox(height: 16), action!],
            ],
          ),
        ),
      ),
    );
  }
}

/// Flutter has no dashed `BorderSide`, so the web's `border-dashed` is painted
/// manually around a rounded rect.
class _DashedBorderPainter extends CustomPainter {
  final Color color;
  final double radius;
  const _DashedBorderPainter({required this.color, required this.radius});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;

    final path = Path()
      ..addRRect(RRect.fromRectAndRadius(Offset.zero & size, Radius.circular(radius)));

    const dash = 6.0;
    const gap = 4.0;
    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        canvas.drawPath(metric.extractPath(distance, distance + dash), paint);
        distance += dash + gap;
      }
    }
  }

  @override
  bool shouldRepaint(_DashedBorderPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.radius != radius;
}

class ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;
  const ErrorView({super.key, required this.message, this.onRetry});

  @override
  Widget build(BuildContext context) {
    return EmptyState(
      icon: Icons.error_outline,
      title: "Something went wrong",
      message: message,
      action: onRetry != null ? OutlinedButton(onPressed: onRetry, child: const Text("Retry")) : null,
    );
  }
}

class SectionLoading extends StatelessWidget {
  const SectionLoading({super.key});
  @override
  Widget build(BuildContext context) => const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()));
}

class StarRatingDisplay extends StatelessWidget {
  final double rating;
  final double size;
  const StarRatingDisplay({super.key, required this.rating, this.size = 16});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (i) {
        final filled = rating >= i + 1;
        final half = !filled && rating > i && rating < i + 1;
        return Icon(
          half ? Icons.star_half : (filled ? Icons.star : Icons.star_border),
          size: size,
          color: const Color(0xFFF59E0B),
        );
      }),
    );
  }
}
