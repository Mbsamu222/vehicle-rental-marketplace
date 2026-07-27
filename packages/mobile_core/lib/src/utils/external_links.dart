import 'package:url_launcher/url_launcher.dart';

/// Opens an admin-authored or partner-supplied URL in the device browser.
/// Returns false when the string isn't a launchable absolute URL so callers can
/// fall back rather than silently doing nothing.
Future<bool> launchExternalUrl(String url) async {
  final uri = Uri.tryParse(url);
  if (uri == null || !uri.hasScheme) return false;
  return launchUrl(uri, mode: LaunchMode.externalApplication);
}

Future<bool> launchPhone(String phone) => launchExternalUrl("tel:${phone.replaceAll(RegExp(r'\s+'), '')}");

Future<bool> launchEmail(String email, {String? subject}) => launchExternalUrl(
      subject == null ? "mailto:$email" : "mailto:$email?subject=${Uri.encodeComponent(subject)}",
    );
