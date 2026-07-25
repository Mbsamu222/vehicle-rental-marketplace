import 'enums.dart';
import 'user.dart';
import '../utils/json_helpers.dart';

class SupportTicketMessage {
  final String id;
  final String ticketId;
  final String authorId;
  final String message;
  final DateTime createdAt;
  final AppUser? author;

  SupportTicketMessage({
    required this.id,
    required this.ticketId,
    required this.authorId,
    required this.message,
    required this.createdAt,
    this.author,
  });

  factory SupportTicketMessage.fromJson(Map<String, dynamic> json) => SupportTicketMessage(
        id: asString(json["id"]),
        ticketId: asString(json["ticketId"]),
        authorId: asString(json["authorId"]),
        message: asString(json["message"]),
        createdAt: asDate(json["createdAt"]),
        author: asMapOrNull(json["author"]) != null ? AppUser.fromJson(asMapOrNull(json["author"])!) : null,
      );
}

class SupportTicket {
  final String id;
  final String userId;
  final String? rentalPartnerId;
  final String subject;
  final SupportTicketStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<SupportTicketMessage> messages;
  final AppUser? user;

  SupportTicket({
    required this.id,
    required this.userId,
    this.rentalPartnerId,
    required this.subject,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.messages = const [],
    this.user,
  });

  factory SupportTicket.fromJson(Map<String, dynamic> json) => SupportTicket(
        id: asString(json["id"]),
        userId: asString(json["userId"]),
        rentalPartnerId: asStringOrNull(json["rentalPartnerId"]),
        subject: asString(json["subject"]),
        status: SupportTicketStatus.fromJson(asStringOrNull(json["status"])),
        createdAt: asDate(json["createdAt"]),
        updatedAt: asDate(json["updatedAt"]),
        messages: asMapList(json["messages"]).map(SupportTicketMessage.fromJson).toList(),
        user: asMapOrNull(json["user"]) != null ? AppUser.fromJson(asMapOrNull(json["user"])!) : null,
      );
}
