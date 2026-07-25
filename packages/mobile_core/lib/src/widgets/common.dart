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

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? message;
  final Widget? action;
  const EmptyState({super.key, required this.icon, required this.title, this.message, this.action});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 56, color: AppColors.mutedTextOf(context)),
            const SizedBox(height: 16),
            Text(title, style: Theme.of(context).textTheme.titleMedium, textAlign: TextAlign.center),
            if (message != null) ...[
              const SizedBox(height: 8),
              Text(message!, style: TextStyle(color: AppColors.mutedTextOf(context)), textAlign: TextAlign.center),
            ],
            if (action != null) ...[const SizedBox(height: 20), action!],
          ],
        ),
      ),
    );
  }
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
