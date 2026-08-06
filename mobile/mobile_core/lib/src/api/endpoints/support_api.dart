import '../../models/pagination.dart';
import '../../models/support.dart';
import '../api_client.dart';

class SupportApi {
  final ApiClient _client;
  SupportApi(this._client);

  Future<SupportTicket> create({required String subject, required String message}) => _client.post(
        "/support-tickets",
        body: {"subject": subject, "message": message},
        parse: (data) => SupportTicket.fromJson(asJsonMap(data)),
      );

  Future<Paginated<SupportTicket>> mine({int page = 1, int limit = 20}) => _client.getPaginated(
        "/support-tickets/mine",
        query: {"page": page, "limit": limit},
        parseItem: SupportTicket.fromJson,
      );

  Future<SupportTicket> byId(String id) =>
      _client.get("/support-tickets/$id", parse: (data) => SupportTicket.fromJson(asJsonMap(data)));

  Future<SupportTicketMessage> addMessage(String id, String message) => _client.post(
        "/support-tickets/$id/messages",
        body: {"message": message},
        parse: (data) => SupportTicketMessage.fromJson(asJsonMap(data)),
      );

  Future<Paginated<SupportTicket>> list({int page = 1, int limit = 20}) => _client.getPaginated(
        "/support-tickets",
        query: {"page": page, "limit": limit},
        parseItem: SupportTicket.fromJson,
      );

  Future<SupportTicket> updateStatus(String id, String status) => _client.patch(
        "/support-tickets/$id/status",
        body: {"status": status},
        parse: (data) => SupportTicket.fromJson(asJsonMap(data)),
      );
}
