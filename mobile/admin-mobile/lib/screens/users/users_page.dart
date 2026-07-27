import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

final _userTypeFilterProvider = StateProvider.autoDispose<String?>((ref) => null);
final _usersProvider = FutureProvider.autoDispose((ref) {
  final userType = ref.watch(_userTypeFilterProvider);
  return ref.watch(marketplaceApiProvider).admin.users(userType: userType, limit: 50);
});

const _filters = [(null, "All"), ("CUSTOMER", "Customers"), ("RENTAL_PARTNER", "Partners"), ("ADMIN", "Admins")];

class UsersPage extends ConsumerWidget {
  const UsersPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(_userTypeFilterProvider);
    final usersAsync = ref.watch(_usersProvider);
    final currentUser = ref.watch(authControllerProvider).user;

    return Scaffold(
      appBar: DashboardTopBar(
        title: "Users",
        userName: currentUser?.fullName,
        onLogout: () async {
          await ref.read(authControllerProvider.notifier).logout();
          if (context.mounted) context.go("/");
        },
      ),
      body: Column(
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: PageHeader(title: "Platform Users", subtitle: "Customers, partners, and admins on the marketplace."),
          ),
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              itemCount: _filters.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final (value, label) = _filters[i];
                return ChoiceChip(label: Text(label), selected: selected == value, onSelected: (_) => ref.read(_userTypeFilterProvider.notifier).state = value);
              },
            ),
          ),
          Expanded(
            child: usersAsync.when(
              data: (page) => page.items.isEmpty
                  ? const EmptyState(icon: Icons.people_outline, title: "No users found")
                  : RefreshIndicator(
                      onRefresh: () async => ref.invalidate(_usersProvider),
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: page.items.length,
                        itemBuilder: (context, i) {
                          final user = page.items[i];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: AppCard(
                              padding: EdgeInsets.zero,
                              onTap: () => context.push("/users/${user.id}"),
                              child: ListTile(
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                                leading: CircleAvatar(child: Text(user.firstName.isNotEmpty ? user.firstName[0].toUpperCase() : "?")),
                                title: Text(user.fullName.isEmpty ? user.email : user.fullName, style: const TextStyle(fontWeight: FontWeight.w700)),
                                subtitle: Text(user.email),
                                trailing: StatusBadge(
                                  label: switch (user.accountStatus) {
                                    AccountStatus.active => "Active",
                                    AccountStatus.suspended => "Suspended",
                                    AccountStatus.banned => "Banned",
                                    _ => "Pending",
                                  },
                                  tone: switch (user.accountStatus) {
                                    AccountStatus.active => BadgeTone.success,
                                    AccountStatus.suspended => BadgeTone.warning,
                                    AccountStatus.banned => BadgeTone.danger,
                                    _ => BadgeTone.neutral,
                                  },
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
              loading: () => const SectionLoading(),
              error: (e, _) => ErrorView(message: "$e", onRetry: () => ref.invalidate(_usersProvider)),
            ),
          ),
        ],
      ),
    );
  }
}
