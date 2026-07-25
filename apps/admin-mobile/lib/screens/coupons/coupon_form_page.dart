import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/mobile_core.dart';

// No GET /coupons/{id} endpoint exists — the list is the source of truth,
// so editing re-fetches it and finds the matching row.
final _couponsProvider = FutureProvider.autoDispose((ref) => ref.watch(marketplaceApiProvider).coupons.list(limit: 100));

class CouponFormPage extends ConsumerStatefulWidget {
  final String? couponId;
  const CouponFormPage({super.key, this.couponId});

  @override
  ConsumerState<CouponFormPage> createState() => _CouponFormPageState();
}

class _CouponFormPageState extends ConsumerState<CouponFormPage> {
  final _code = TextEditingController();
  final _value = TextEditingController();
  final _maxDiscount = TextEditingController();
  final _minBookingValue = TextEditingController();
  final _usageLimit = TextEditingController();
  final _perUserLimit = TextEditingController(text: "1");
  String _type = "PERCENTAGE";
  DateTime _validFrom = DateTime.now();
  DateTime _validUntil = DateTime.now().add(const Duration(days: 30));
  String? _error;
  bool _prefilled = false;

  bool get _isEditing => widget.couponId != null;

  void _prefill(Coupon coupon) {
    if (_prefilled) return;
    _prefilled = true;
    _code.text = coupon.code;
    _value.text = "${coupon.value}";
    _maxDiscount.text = coupon.maxDiscount != null ? "${coupon.maxDiscount}" : "";
    _minBookingValue.text = coupon.minBookingValue != null ? "${coupon.minBookingValue}" : "";
    _usageLimit.text = coupon.usageLimit != null ? "${coupon.usageLimit}" : "";
    _perUserLimit.text = "${coupon.perUserLimit}";
    _type = coupon.type.toJson();
    _validFrom = coupon.validFrom;
    _validUntil = coupon.validUntil;
  }

  @override
  void dispose() {
    _code.dispose();
    _value.dispose();
    _maxDiscount.dispose();
    _minBookingValue.dispose();
    _usageLimit.dispose();
    _perUserLimit.dispose();
    super.dispose();
  }

  Future<void> _pickDate({required bool isFrom}) async {
    final date = await showDatePicker(
      context: context,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365 * 3)),
      initialDate: isFrom ? _validFrom : _validUntil,
    );
    if (date == null) return;
    setState(() {
      if (isFrom) {
        _validFrom = date;
      } else {
        _validUntil = date;
      }
    });
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (_code.text.trim().isEmpty || double.tryParse(_value.text.trim()) == null) {
      setState(() => _error = "Code and a valid value are required");
      return;
    }
    final payload = {
      "code": _code.text.trim(),
      "type": _type,
      "value": double.parse(_value.text.trim()),
      if (double.tryParse(_maxDiscount.text.trim()) != null) "maxDiscount": double.parse(_maxDiscount.text.trim()),
      if (double.tryParse(_minBookingValue.text.trim()) != null) "minBookingValue": double.parse(_minBookingValue.text.trim()),
      if (int.tryParse(_usageLimit.text.trim()) != null) "usageLimit": int.parse(_usageLimit.text.trim()),
      "perUserLimit": int.tryParse(_perUserLimit.text.trim()) ?? 1,
      "validFrom": _validFrom.toUtc().toIso8601String(),
      "validUntil": _validUntil.toUtc().toIso8601String(),
    };
    try {
      final api = ref.read(marketplaceApiProvider).coupons;
      if (_isEditing) {
        await api.update(widget.couponId!, payload);
      } else {
        await api.create(payload);
      }
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    }
  }

  Future<void> _delete() async {
    await ref.read(marketplaceApiProvider).coupons.delete(widget.couponId!);
    if (mounted) Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    Widget form() => SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_error != null) ...[Text(_error!, style: const TextStyle(color: AppColors.danger)), const SizedBox(height: 12)],
              TextField(controller: _code, textCapitalization: TextCapitalization.characters, decoration: const InputDecoration(labelText: "Coupon code")),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _type,
                decoration: const InputDecoration(labelText: "Type"),
                items: const [DropdownMenuItem(value: "PERCENTAGE", child: Text("Percentage")), DropdownMenuItem(value: "FLAT", child: Text("Flat amount"))],
                onChanged: (v) => setState(() => _type = v!),
              ),
              const SizedBox(height: 16),
              TextField(controller: _value, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: InputDecoration(labelText: _type == "PERCENTAGE" ? "Discount %" : "Discount amount")),
              const SizedBox(height: 16),
              TextField(controller: _maxDiscount, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: "Max discount (optional)")),
              const SizedBox(height: 16),
              TextField(controller: _minBookingValue, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: "Min booking value (optional)")),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: TextField(controller: _usageLimit, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: "Total usage limit (optional)"))),
                  const SizedBox(width: 12),
                  Expanded(child: TextField(controller: _perUserLimit, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: "Per-user limit"))),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => _pickDate(isFrom: true),
                      child: InputDecorator(decoration: const InputDecoration(labelText: "Valid from"), child: Text(formatDate(_validFrom))),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: InkWell(
                      onTap: () => _pickDate(isFrom: false),
                      child: InputDecorator(decoration: const InputDecoration(labelText: "Valid until"), child: Text(formatDate(_validUntil))),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              LoadingButton(label: _isEditing ? "Save changes" : "Create coupon", onPressed: _submit),
              if (_isEditing) ...[
                const SizedBox(height: 12),
                LoadingButton(label: "Delete coupon", outlined: true, onPressed: _delete),
              ],
            ],
          ),
        );

    return Scaffold(
      appBar: AppBar(title: Text(_isEditing ? "Edit coupon" : "New coupon")),
      body: _isEditing
          ? ref.watch(_couponsProvider).when(
                data: (page) {
                  final coupon = page.items.where((c) => c.id == widget.couponId).firstOrNull;
                  if (coupon == null) return const ErrorView(message: "Coupon not found");
                  _prefill(coupon);
                  return form();
                },
                loading: () => const SectionLoading(),
                error: (e, _) => ErrorView(message: "$e"),
              )
          : form(),
    );
  }
}
