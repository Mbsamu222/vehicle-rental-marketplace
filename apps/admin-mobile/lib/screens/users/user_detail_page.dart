import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

final _userProvider = FutureProvider.autoDispose.family<AppUser, String>(
  (ref, id) => ref.watch(marketplaceApiProvider).admin.userById(id),
);

class UserDetailPage extends ConsumerWidget {
  final String userId;
  const UserDetailPage({super.key, required this.userId});

  Future<void> _updateStatus(BuildContext context, WidgetRef ref, String status) async {
    try {
      await ref.read(marketplaceApiProvider).admin.updateUserStatus(userId, status);
      ref.invalidate(_userProvider(userId));
    } on ApiException catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(_userProvider(userId));
    return Scaffold(
      appBar: AppBar(title: const Text("User details")),
      body: userAsync.when(
        data: (user) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(user.fullName.isEmpty ? user.email : user.fullName, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 4),
            Text(user.userType.toJson().replaceAll("_", " "), style: const TextStyle(color: AppColors.primary400)),
            const SizedBox(height: 16),
            _InfoRow(label: "Email", value: user.email),
            if (user.phone != null) _InfoRow(label: "Phone", value: user.phone!),
            _InfoRow(label: "Joined", value: formatDate(user.createdAt)),
            _InfoRow(label: "Loyalty points", value: "${user.loyaltyPoints}"),
            if (user.referralCode != null) _InfoRow(label: "Referral code", value: user.referralCode!),
            const SizedBox(height: 24),
            Text("Account status", style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              children: [
                if (user.accountStatus != AccountStatus.active)
                  ElevatedButton(onPressed: () => _updateStatus(context, ref, "ACTIVE"), child: const Text("Activate")),
                if (user.accountStatus != AccountStatus.suspended)
                  OutlinedButton(onPressed: () => _updateStatus(context, ref, "SUSPENDED"), child: const Text("Suspend")),
                if (user.accountStatus != AccountStatus.banned)
                  OutlinedButton(onPressed: () => _updateStatus(context, ref, "BANNED"), child: const Text("Ban")),
              ],
            ),
          ],
        ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_userProvider(userId))),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(width: 120, child: Text(label, style: const TextStyle(color: AppColors.primary400))),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
