import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:customer_mobile/screens/info/cms_page.dart';

/// A verbatim slice of the seeded Privacy Policy (backend/scripts/cms_content.py)
/// covering every shape the renderer has to handle: an intro paragraph, numbered
/// ALL-CAPS section headings, a bullet list whose last item is a long sentence,
/// and a multi-line contact block whose line breaks are meaningful.
const _sample = '''Last updated: 26 July 2026

RentWheels ("we", "us", "our") operates a marketplace that connects customers who want to rent vehicles with independent local rental partners.

1. WHO WE ARE

RentWheels is the operator of this marketplace and the controller of the personal data described below.

3. WHY WE USE YOUR DATA

- To create and administer your account.
- To verify your driving licence and eligibility to rent.
- To send service messages about your bookings. Marketing messages are sent only where you have opted in, and every marketing message includes an opt-out.

5. PRICING, PAYMENTS, AND DEPOSITS

Prices are shown in Indian Rupees.

11. CONTACT

Privacy questions: support@rentwheels.example
Grievance officer: grievance@rentwheels.example
Postal address: T Nagar, Chennai, Tamil Nadu, India
''';

/// The subtree carries a per-brightness key. Without it the `const` Scaffold is
/// canonicalized to the same instance across pumps, so re-pumping with a
/// different theme would silently reuse the first tree and the assertion would
/// pass against stale colours.
Future<void> _pump(WidgetTester tester, {Brightness brightness = Brightness.light}) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: ThemeData(brightness: brightness),
      home: Scaffold(
        key: ValueKey(brightness),
        body: const SingleChildScrollView(child: CmsBody(content: _sample)),
      ),
    ),
  );
  // MaterialApp animates theme changes via AnimatedTheme, so a single frame
  // after a re-pump is still mid-lerp and would report the previous palette.
  await tester.pumpAndSettle();
}

/// Every SelectableText in the tree, paired with its resolved font weight.
List<(String, FontWeight?)> _spans(WidgetTester tester) => tester
    .widgetList<SelectableText>(find.byType(SelectableText))
    .map((w) => (w.data ?? "", w.style?.fontWeight))
    .toList();

void main() {
  testWidgets("promotes numbered ALL-CAPS lines to bold headings", (tester) async {
    await _pump(tester);
    final spans = _spans(tester);

    for (final heading in ["1. WHO WE ARE", "3. WHY WE USE YOUR DATA", "5. PRICING, PAYMENTS, AND DEPOSITS", "11. CONTACT"]) {
      final match = spans.where((s) => s.$1 == heading);
      expect(match, hasLength(1), reason: "expected exactly one span for '$heading'");
      expect(match.first.$2, FontWeight.w900, reason: "'$heading' should render bold");
    }
  });

  testWidgets("renders each bullet separately with the marker stripped", (tester) async {
    await _pump(tester);
    final spans = _spans(tester).map((s) => s.$1).toList();

    expect(spans, contains("To create and administer your account."));
    expect(spans, contains("To verify your driving licence and eligibility to rent."));
    // The long wrapped bullet must survive as one item, not merge into the list
    // above it or lose its leading text.
    expect(
      spans.singleWhere((s) => s.startsWith("To send service messages")),
      endsWith("includes an opt-out."),
    );
    // No rendered span should still carry the raw "- " marker.
    expect(spans.where((s) => s.startsWith("- ")), isEmpty);
  });

  testWidgets("keeps meaningful line breaks in the contact block", (tester) async {
    await _pump(tester);
    final contact = _spans(tester).map((s) => s.$1).singleWhere((s) => s.startsWith("Privacy questions:"));

    // All three lines stay in one block, each on its own line.
    expect(contact.split("\n"), hasLength(3));
    expect(contact, contains("Grievance officer: grievance@rentwheels.example"));
    expect(contact, endsWith("T Nagar, Chennai, Tamil Nadu, India"));
  });

  testWidgets("treats ordinary prose as body text, not headings", (tester) async {
    await _pump(tester);
    final intro = _spans(tester).singleWhere((s) => s.$1.startsWith("RentWheels (\"we\""));

    expect(intro.$2, isNot(FontWeight.w900), reason: "prose must not be styled as a heading");
    expect(
      _spans(tester).map((s) => s.$1),
      contains("Last updated: 26 July 2026"),
    );
  });

  testWidgets("adapts body colour to dark mode", (tester) async {
    await _pump(tester, brightness: Brightness.light);
    final lightColor = tester
        .widgetList<SelectableText>(find.byType(SelectableText))
        .firstWhere((w) => (w.data ?? "").startsWith("Prices are shown"))
        .style
        ?.color;

    await _pump(tester, brightness: Brightness.dark);
    final darkColor = tester
        .widgetList<SelectableText>(find.byType(SelectableText))
        .firstWhere((w) => (w.data ?? "").startsWith("Prices are shown"))
        .style
        ?.color;

    expect(lightColor, isNotNull);
    expect(darkColor, isNotNull);
    expect(darkColor, isNot(lightColor), reason: "body text must not reuse the light palette on dark");
  });
}
