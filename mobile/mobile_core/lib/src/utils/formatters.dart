import 'package:intl/intl.dart';

final _currency = NumberFormat.currency(locale: "en_IN", symbol: "₹", decimalDigits: 0);
final _currencyPrecise = NumberFormat.currency(locale: "en_IN", symbol: "₹", decimalDigits: 2);
final _dateFormat = DateFormat("d MMM yyyy");
final _dateTimeFormat = DateFormat("d MMM yyyy, h:mm a");
final _timeFormat = DateFormat("h:mm a");

String formatCurrency(double amount, {bool precise = false}) =>
    (precise ? _currencyPrecise : _currency).format(amount);

String formatDate(DateTime date) => _dateFormat.format(date.toLocal());

String formatDateTime(DateTime date) => _dateTimeFormat.format(date.toLocal());

String formatTime(DateTime date) => _timeFormat.format(date.toLocal());

String formatDuration(DateTime start, DateTime end) {
  final diff = end.difference(start);
  if (diff.inDays >= 1) {
    final days = diff.inDays;
    final hours = diff.inHours % 24;
    return hours > 0 ? "$days d $hours h" : "$days d";
  }
  return "${diff.inHours} h ${diff.inMinutes % 60} m";
}
