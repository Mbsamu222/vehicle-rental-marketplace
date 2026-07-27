import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_core/mobile_core.dart';

final _vehicleProvider = FutureProvider.autoDispose.family<Vehicle, String>(
  (ref, id) => ref.watch(marketplaceApiProvider).vehicles.byId(id),
);
final _licensesProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).users.drivingLicenses());
final _walletProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).payments.wallet());

class BookingCheckoutPage extends ConsumerStatefulWidget {
  final String vehicleId;
  const BookingCheckoutPage({super.key, required this.vehicleId});

  @override
  ConsumerState<BookingCheckoutPage> createState() => _BookingCheckoutPageState();
}

class _BookingCheckoutPageState extends ConsumerState<BookingCheckoutPage> {
  DateTime? _pickup;
  DateTime? _return;
  String? _licenseId;
  final _pickupLocation = TextEditingController();
  final _returnLocation = TextEditingController();
  final _couponController = TextEditingController();
  String? _error;
  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      _initialized = true;
      final query = GoRouterState.of(context).uri.queryParameters;
      _pickup = DateTime.tryParse(query["pickup"] ?? "");
      _return = DateTime.tryParse(query["ret"] ?? "");
    }
  }

  @override
  void dispose() {
    _pickupLocation.dispose();
    _returnLocation.dispose();
    _couponController.dispose();
    super.dispose();
  }

  double _estimateTotal(Vehicle vehicle) {
    if (_pickup == null || _return == null) return 0;
    final hours = _return!.difference(_pickup!).inMinutes / 60.0;
    final fullDays = (hours / 24).floor();
    final remainingHours = (hours - fullDays * 24).ceil();
    final base = fullDays * vehicle.pricePerDay + remainingHours * vehicle.pricePerHour;
    final tax = base * 0.18;
    return base + tax + vehicle.securityDeposit;
  }

  Future<void> _confirmBooking(Vehicle vehicle) async {
    setState(() => _error = null);
    if (_pickup == null || _return == null) {
      setState(() => _error = "Pickup and return date/time are required");
      return;
    }
    if (_licenseId == null) {
      setState(() => _error = "Select a verified driving license");
      return;
    }
    if (_pickupLocation.text.trim().isEmpty || _returnLocation.text.trim().isEmpty) {
      setState(() => _error = "Enter pickup and return locations");
      return;
    }

    try {
      final api = ref.read(marketplaceApiProvider);
      final booking = await api.bookings.create(
        vehicleId: vehicle.id,
        drivingLicenseId: _licenseId!,
        pickupDatetime: _pickup!,
        returnDatetime: _return!,
        pickupLocation: _pickupLocation.text.trim(),
        returnLocation: _returnLocation.text.trim(),
        couponCode: _couponController.text.trim().isEmpty ? null : _couponController.text.trim().toUpperCase(),
      );
      await api.payments.createOrder(bookingId: booking.id, provider: "WALLET");
      if (!mounted) return;
      context.go("/bookings/${booking.id}");
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final vehicleAsync = ref.watch(_vehicleProvider(widget.vehicleId));
    final licensesAsync = ref.watch(_licensesProvider);
    final walletAsync = ref.watch(_walletProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Review & pay")),
      body: vehicleAsync.when(
        data: (vehicle) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AppCard(
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: SizedBox(
                        width: 76,
                        height: 76,
                        child: vehicle.primaryImageUrl != null
                            ? CachedNetworkImage(imageUrl: vehicle.primaryImageUrl!, fit: BoxFit.cover)
                            : Container(
                                color: AppColors.subtleFillOf(context),
                                child: Icon(Icons.directions_car, color: AppColors.mutedTextOf(context)),
                              ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(vehicle.model, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                          const SizedBox(height: 2),
                          Text("${vehicle.brand?.name ?? ''} · ${vehicle.year}", style: TextStyle(color: AppColors.mutedTextOf(context), fontSize: 12.5)),
                        ],
                      ),
                    ),
                    Text(formatCurrency(vehicle.pricePerDay), style: const TextStyle(fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              AppCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    const AppCardHeader(title: "Trip"),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Pickup: ${_pickup != null ? formatDateTime(_pickup!) : '—'}"),
                          const SizedBox(height: 4),
                          Text("Return: ${_return != null ? formatDateTime(_return!) : '—'}"),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              AppCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    const AppCardHeader(title: "Driving license"),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: licensesAsync.when(
                        data: (licenses) {
                          final verified = licenses.where((l) => l.status == DrivingLicenseStatus.verified).toList();
                          if (verified.isEmpty) {
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text("No verified driving license on file.", style: TextStyle(color: AppColors.danger)),
                                TextButton(
                                  onPressed: () => context.push("/account/licenses"),
                                  child: const Text("Add a driving license"),
                                ),
                              ],
                            );
                          }
                          return RadioGroup<String>(
                            groupValue: _licenseId,
                            onChanged: (v) => setState(() => _licenseId = v),
                            child: Column(
                              children: [
                                for (final license in verified)
                                  RadioListTile<String>(
                                    contentPadding: EdgeInsets.zero,
                                    value: license.id,
                                    title: Text(license.licenseNumber),
                                    subtitle: Text("Expires ${formatDate(license.expiryDate)}"),
                                  ),
                              ],
                            ),
                          );
                        },
                        loading: () => const SectionLoading(),
                        error: (e, _) => Text("$e"),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              AppCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    const AppCardHeader(title: "Locations"),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          TextField(controller: _pickupLocation, decoration: const InputDecoration(labelText: "Pickup location")),
                          const SizedBox(height: 12),
                          TextField(controller: _returnLocation, decoration: const InputDecoration(labelText: "Return location")),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              AppCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    const AppCardHeader(title: "Coupon", subtitle: "Optional"),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: TextField(
                        controller: _couponController,
                        textCapitalization: TextCapitalization.characters,
                        decoration: const InputDecoration(labelText: "Coupon code"),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("Estimated total (incl. 18% tax & deposit)", style: TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    Text(formatCurrency(_estimateTotal(vehicle)), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                    Text("Final amount is confirmed after booking is created.", style: TextStyle(fontSize: 12, color: AppColors.mutedTextOf(context))),
                    walletAsync.maybeWhen(
                      data: (wallet) => Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Row(
                          children: [
                            const Icon(Icons.account_balance_wallet_outlined, size: 18, color: AppColors.primary500),
                            const SizedBox(width: 8),
                            Text("Wallet balance: ${formatCurrency(wallet.balance, precise: true)}"),
                          ],
                        ),
                      ),
                      orElse: () => const SizedBox.shrink(),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              if (_error != null) ...[
                Text(_error!, style: const TextStyle(color: AppColors.danger)),
                const SizedBox(height: 12),
              ],
              LoadingButton(label: "Pay with wallet & confirm booking", onPressed: () => _confirmBooking(vehicle)),
              const SizedBox(height: 24),
            ],
          ),
        ),
        loading: () => const SectionLoading(),
        error: (e, _) => ErrorView(message: "$e"),
      ),
    );
  }
}
