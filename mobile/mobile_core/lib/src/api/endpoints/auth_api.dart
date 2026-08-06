import '../../models/user.dart';
import '../api_client.dart';

class AuthApi {
  final ApiClient _client;
  AuthApi(this._client);

  Future<AppUser> sync({
    String? firstName,
    String? lastName,
    String? phone,
    String userType = "CUSTOMER",
    String? referralCode,
  }) {
    return _client.post(
      "/auth/sync",
      body: {
        "firstName": ?firstName,
        "lastName": ?lastName,
        "phone": ?phone,
        "userType": userType,
        "referralCode": ?referralCode,
      },
      parse: (data) => AppUser.fromJson(asJsonMap(data)),
    );
  }

  Future<AppUser> me() => _client.get("/auth/me", parse: (data) => AppUser.fromJson(asJsonMap(data)));

  Future<bool> lookupByPhone(String phone) => _client.post(
        "/auth/lookup",
        body: {"phone": phone},
        parse: (data) => asJsonMap(data)["exists"] == true,
      );

  Future<void> discardUnlinked() => _client.post("/auth/discard-unlinked", parse: asVoid);
}
