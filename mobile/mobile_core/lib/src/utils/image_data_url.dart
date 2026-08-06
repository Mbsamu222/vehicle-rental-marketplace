import 'dart:convert';
import 'dart:typed_data';

/// The backend has no object-storage upload endpoint yet (see README's
/// "known, deliberate gaps") — every web app inlines picked files as `data:`
/// URLs client-side, which satisfies the API's plain-string URL fields and
/// works end-to-end in dev. Mobile does the same here rather than adding a
/// bespoke upload pipeline the backend can't receive.
String bytesToDataUrl(Uint8List bytes, {required String mimeType}) {
  return "data:$mimeType;base64,${base64Encode(bytes)}";
}

String mimeTypeForPath(String path) {
  final lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".pdf")) return "application/pdf";
  return "image/jpeg";
}
