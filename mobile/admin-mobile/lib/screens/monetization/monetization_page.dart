import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

/// Port of apps/admin-web/src/screens/monetization/MonetizationPage.tsx.
///
/// The web console has five tabs. This screen carries the two that are
/// genuinely operational — Features (the on/off switches plus each feature's
/// JSON config) and Subscriptions — and shows the paid-placement inventory
/// (ad slots, affiliate partners) read-only. Creating and editing those rows
/// involves image URLs and billing amounts that belong on the desktop console;
/// the toggles here still gate whether any of it renders to customers.
final _featuresProvider =
    FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).admin.monetizationFeatures());
final _adSlotsProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).admin.manageAdSlots());
final _affiliatesProvider =
    FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).admin.manageAffiliatePartners());
final _plansProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).subscriptions.managePlans());

class MonetizationPage extends ConsumerWidget {
  const MonetizationPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: const Text("Monetization"),
          bottom: const TabBar(
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            tabs: [
              Tab(text: "Features"),
              Tab(text: "Ad slots"),
              Tab(text: "Affiliates"),
              Tab(text: "Subscriptions"),
            ],
          ),
        ),
        body: const TabBarView(
          children: [_FeaturesTab(), _AdSlotsTab(), _AffiliatesTab(), _PlansTab()],
        ),
      ),
    );
  }
}

class _FeaturesTab extends ConsumerWidget {
  const _FeaturesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final features = ref.watch(_featuresProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_featuresProvider),
      child: features.when(
        data: (list) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              "Every revenue mechanism is disabled by default. Each module checks its feature row before applying a fee, so nothing changes for customers or partners until you switch it on here.",
              style: TextStyle(fontSize: 12, height: 1.55, color: AppColors.mutedTextOf(context)),
            ),
            const SizedBox(height: 16),
            for (final feature in list) ...[
              _FeatureCard(feature: feature),
              const SizedBox(height: 10),
            ],
          ],
        ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_featuresProvider)),
      ),
    );
  }
}

class _FeatureCard extends ConsumerWidget {
  final MonetizationFeature feature;
  const _FeatureCard({required this.feature});

  Future<void> _toggle(BuildContext context, WidgetRef ref, bool enabled) async {
    try {
      await ref.read(marketplaceApiProvider).admin.updateMonetizationFeature(feature.key, isEnabled: enabled);
      ref.invalidate(_featuresProvider);
    } on ApiException catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<void> _editConfig(BuildContext context, WidgetRef ref) async {
    final controller = TextEditingController(
      text: feature.config.isEmpty ? "{}" : const JsonEncoder.withIndent("  ").convert(feature.config),
    );

    final bool saved;
    try {
      saved = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              title: Text("Configure — ${feature.info.label}"),
              content: TextField(
                controller: controller,
                maxLines: 10,
                decoration: const InputDecoration(labelText: "Config (JSON)", alignLabelWithHint: true),
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
                TextButton(onPressed: () => Navigator.pop(context, true), child: const Text("Save")),
              ],
            ),
          ) ??
          false;
      if (!saved || !context.mounted) return;

      // Reject invalid JSON here rather than sending it — the endpoint expects
      // an object and would 422 with a less useful message.
      final Map<String, dynamic> parsed;
      try {
        final decoded = jsonDecode(controller.text);
        if (decoded is! Map) throw const FormatException("Config must be a JSON object");
        parsed = Map<String, dynamic>.from(decoded);
      } on FormatException catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Invalid config: ${e.message}")));
        return;
      }

      try {
        await ref.read(marketplaceApiProvider).admin.updateMonetizationFeature(feature.key, config: parsed);
        ref.invalidate(_featuresProvider);
      } on ApiException catch (e) {
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      controller.dispose();
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final info = feature.info;

    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      info.label,
                      style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800, color: AppColors.textOf(context)),
                    ),
                    if (info.description.isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(
                        info.description,
                        style: TextStyle(fontSize: 12, height: 1.5, color: AppColors.mutedTextOf(context)),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Switch(value: feature.isEnabled, onChanged: (v) => _toggle(context, ref, v)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              TextButton.icon(
                onPressed: () => _editConfig(context, ref),
                icon: const Icon(Icons.tune, size: 16),
                label: Text(feature.config.isEmpty ? "Add config" : "Edit config"),
                style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 32)),
              ),
              const Spacer(),
              if (feature.updatedAt != null)
                Text(
                  "Updated ${formatDate(feature.updatedAt!)}",
                  style: TextStyle(fontSize: 10.5, color: AppColors.mutedTextOf(context)),
                ),
            ],
          ),
          if (feature.config.isNotEmpty) ...[
            const SizedBox(height: 6),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.subtleFillOf(context),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                const JsonEncoder.withIndent("  ").convert(feature.config),
                style: TextStyle(fontSize: 11, fontFamily: "monospace", height: 1.5, color: AppColors.textOf(context)),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _AdSlotsTab extends ConsumerWidget {
  const _AdSlotsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final slots = ref.watch(_adSlotsProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_adSlotsProvider),
      child: slots.when(
        data: (list) => list.isEmpty
            ? const EmptyState(
                icon: Icons.campaign_outlined,
                title: "No ad slots configured",
                message: "Paid placements are created from the web admin console.",
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (context, i) {
                  final slot = list[i];
                  return AppCard(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                slot.title,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.textOf(context),
                                ),
                              ),
                              if (slot.sponsorName != null)
                                Text(
                                  slot.sponsorName!,
                                  style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context)),
                                ),
                              if (slot.subtitle != null)
                                Text(
                                  slot.subtitle!,
                                  style: TextStyle(fontSize: 11.5, color: AppColors.mutedTextOf(context)),
                                ),
                            ],
                          ),
                        ),
                        StatusBadge(
                          label: slot.isActive ? "Active" : "Inactive",
                          tone: slot.isActive ? BadgeTone.success : BadgeTone.neutral,
                        ),
                      ],
                    ),
                  );
                },
              ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_adSlotsProvider)),
      ),
    );
  }
}

class _AffiliatesTab extends ConsumerWidget {
  const _AffiliatesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final partners = ref.watch(_affiliatesProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_affiliatesProvider),
      child: partners.when(
        data: (list) => list.isEmpty
            ? const EmptyState(
                icon: Icons.handshake_outlined,
                title: "No affiliate partners",
                message: "Referral partners are created from the web admin console.",
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (context, i) {
                  final partner = list[i];
                  return AppCard(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                partner.name,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.textOf(context),
                                ),
                              ),
                              Text(
                                _categoryLabel(partner.category),
                                style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context)),
                              ),
                              if (partner.tagline != null)
                                Text(
                                  partner.tagline!,
                                  style: TextStyle(fontSize: 11.5, color: AppColors.mutedTextOf(context)),
                                ),
                            ],
                          ),
                        ),
                        StatusBadge(
                          label: partner.isActive ? "Active" : "Inactive",
                          tone: partner.isActive ? BadgeTone.success : BadgeTone.neutral,
                        ),
                      ],
                    ),
                  );
                },
              ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_affiliatesProvider)),
      ),
    );
  }

  static String _categoryLabel(AffiliateCategory category) => switch (category) {
        AffiliateCategory.insurance => "Insurance",
        AffiliateCategory.roadsideAssistance => "Roadside assistance",
        AffiliateCategory.fuel => "Fuel",
        AffiliateCategory.other => "Other",
      };
}

class _PlansTab extends ConsumerWidget {
  const _PlansTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plans = ref.watch(_plansProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(_plansProvider),
      child: plans.when(
        data: (list) => list.isEmpty
            ? const EmptyState(icon: Icons.workspace_premium_outlined, title: "No subscription plans")
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (context, i) {
                  final plan = list[i];
                  return AppCard(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                plan.name,
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.textOf(context),
                                ),
                              ),
                            ),
                            StatusBadge(
                              label: plan.isActive ? "Active" : "Inactive",
                              tone: plan.isActive ? BadgeTone.success : BadgeTone.neutral,
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          "${formatCurrency(plan.price, precise: true)} / ${plan.durationDays} days · ${plan.maxVehicles != null ? "up to ${plan.maxVehicles} vehicles" : "unlimited vehicles"}",
                          style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context)),
                        ),
                        if (plan.featureLabels.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: [
                              for (final label in plan.featureLabels)
                                StatusBadge(label: label, tone: BadgeTone.info),
                            ],
                          ),
                        ],
                      ],
                    ),
                  );
                },
              ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_plansProvider)),
      ),
    );
  }
}
