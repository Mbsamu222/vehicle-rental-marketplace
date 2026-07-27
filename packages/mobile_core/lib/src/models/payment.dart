import 'enums.dart';
import '../utils/json_helpers.dart';

class Payment {
  final String id;
  final String bookingId;
  final PaymentProvider provider;
  final String? providerRefId;
  final double amount;
  final PaymentStatus status;
  final DateTime? paidAt;
  final double refundedAmount;
  final DateTime createdAt;

  Payment({
    required this.id,
    required this.bookingId,
    required this.provider,
    this.providerRefId,
    required this.amount,
    required this.status,
    this.paidAt,
    required this.refundedAmount,
    required this.createdAt,
  });

  factory Payment.fromJson(Map<String, dynamic> json) => Payment(
        id: asString(json["id"]),
        bookingId: asString(json["bookingId"]),
        provider: PaymentProvider.fromJson(asStringOrNull(json["provider"])),
        providerRefId: asStringOrNull(json["providerRefId"]),
        amount: asDouble(json["amount"]),
        status: PaymentStatus.fromJson(asStringOrNull(json["status"])),
        paidAt: asDateOrNull(json["paidAt"]),
        refundedAmount: asDouble(json["refundedAmount"]),
        createdAt: asDate(json["createdAt"]),
      );
}

class WalletTransaction {
  final String id;
  final TransactionType type;
  final TransactionStatus status;
  final double amount;
  final String? reference;
  final DateTime createdAt;

  WalletTransaction({
    required this.id,
    required this.type,
    required this.status,
    required this.amount,
    this.reference,
    required this.createdAt,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) => WalletTransaction(
        id: asString(json["id"]),
        type: TransactionType.fromJson(asStringOrNull(json["type"])),
        status: TransactionStatus.fromJson(asStringOrNull(json["status"])),
        amount: asDouble(json["amount"]),
        reference: asStringOrNull(json["reference"]),
        createdAt: asDate(json["createdAt"]),
      );
}

class Wallet {
  final String id;
  final String userId;
  final double balance;
  final List<WalletTransaction> transactions;

  Wallet({required this.id, required this.userId, required this.balance, this.transactions = const []});

  factory Wallet.fromJson(Map<String, dynamic> json) => Wallet(
        id: asString(json["id"]),
        userId: asString(json["userId"]),
        balance: asDouble(json["balance"]),
        transactions: asMapList(json["transactions"]).map(WalletTransaction.fromJson).toList(),
      );
}

class AdminTransaction {
  final String id;
  final TransactionType type;
  final TransactionStatus status;
  final double amount;
  final String? paymentId;
  final String? rentalPartnerId;
  final String? walletId;
  final String? reference;

  /// Free-form payload the backend attaches per transaction type — for payouts
  /// it carries `bookingCount` (see backend/app/modules/payouts/service.py).
  /// Serialized as `metadata` (transaction_metadata is renamed on the wire).
  final Map<String, dynamic> metadata;
  final DateTime createdAt;

  AdminTransaction({
    required this.id,
    required this.type,
    required this.status,
    required this.amount,
    this.paymentId,
    this.rentalPartnerId,
    this.walletId,
    this.reference,
    this.metadata = const {},
    required this.createdAt,
  });

  int? get bookingCount {
    final value = metadata["bookingCount"];
    return value is num ? value.toInt() : null;
  }

  factory AdminTransaction.fromJson(Map<String, dynamic> json) => AdminTransaction(
        id: asString(json["id"]),
        type: TransactionType.fromJson(asStringOrNull(json["type"])),
        status: TransactionStatus.fromJson(asStringOrNull(json["status"])),
        amount: asDouble(json["amount"]),
        paymentId: asStringOrNull(json["paymentId"]),
        rentalPartnerId: asStringOrNull(json["rentalPartnerId"]),
        walletId: asStringOrNull(json["walletId"]),
        reference: asStringOrNull(json["reference"]),
        metadata: asMapOrNull(json["metadata"]) ?? const {},
        createdAt: asDate(json["createdAt"]),
      );
}
