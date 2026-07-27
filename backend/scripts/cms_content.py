"""Starter content for the admin-editable CMS legal pages.

These are rendered verbatim by apps/public-site (screens/legal/CmsPage.tsx) and
by customer-mobile (screens/info/cms_page.dart). Both treat the body as plain
text with line breaks preserved, so structure here is expressed with numbered
headings and blank lines rather than markup.

IMPORTANT: this is a drafting starting point written to match how the platform
actually behaves (deposits, licence verification, wallet refunds, partner
payouts, Razorpay/Stripe). It is NOT legal advice and has not been reviewed by
a lawyer. Have counsel review and adapt it — particularly the governing-law,
liability, and data-transfer sections — before relying on it in production.
Once live, edit these through Admin → Content rather than re-running the seed.
"""

COMPANY = "RentWheels"
SUPPORT_EMAIL = "support@rentwheels.example"
GRIEVANCE_EMAIL = "grievance@rentwheels.example"
ADDRESS = "T Nagar, Chennai, Tamil Nadu, India"
LAST_UPDATED = "26 July 2026"

PRIVACY_POLICY = f"""Last updated: {LAST_UPDATED}

{COMPANY} ("we", "us", "our") operates a marketplace that connects customers who want to rent vehicles with independent local rental partners. This policy explains what personal data we collect, why we collect it, who we share it with, and the choices you have.

1. WHO WE ARE

{COMPANY} is the operator of this marketplace and the controller of the personal data described below. Our registered address is {ADDRESS}. You can reach us at {SUPPORT_EMAIL} for any privacy question.

Rental partners listed on the marketplace are independent businesses. When you book with a partner, that partner also processes some of your data as a controller in its own right for the purpose of fulfilling your rental.

2. DATA WE COLLECT

Account data. Your name, email address, phone number, and password credentials. Authentication is handled by Google Firebase Authentication; we never see or store your password in plain text.

Identity and eligibility data. Your driving licence details and the licence images you upload, including licence number and expiry date. We collect these because a valid licence is a legal precondition for renting a vehicle, and both our team and the rental partner verify them before a booking is confirmed.

Booking data. Pickup and return times and locations, the vehicle booked, the rental partner involved, booking status, and any additional drivers you declare.

Payment data. Payment amounts, status, provider reference identifiers, refunds, and your wallet balance and wallet transaction history. Card numbers, UPI IDs, and net-banking credentials are collected and stored by our payment providers (Razorpay and Stripe), not by us. We receive only a payment reference and a result.

Support data. The content of support tickets you open, messages you exchange with our team, and any attachments you include.

Usage and device data. IP address, device and browser type, app version, and interaction logs. We use these to keep the service secure, diagnose faults, and understand which features are used.

Location data. If you grant permission in the mobile app, approximate or precise device location, used to show vehicles near you. You can withdraw this permission at any time in your device settings without losing access to the rest of the service.

3. WHY WE USE YOUR DATA

- To create and administer your account.
- To verify your driving licence and eligibility to rent.
- To process bookings, take payments, issue refunds, and operate your wallet.
- To pass the details a rental partner needs in order to hand over a vehicle.
- To provide customer support and resolve disputes.
- To detect, investigate, and prevent fraud, misuse, and security incidents.
- To meet legal, tax, and regulatory obligations.
- To send service messages about your bookings. Marketing messages are sent only where you have opted in, and every marketing message includes an opt-out.

4. LEGAL BASES

Where data protection law requires a legal basis, we rely on: performance of our contract with you (bookings, payments, account administration); compliance with a legal obligation (tax, records, licence checks); your consent (location access, marketing); and our legitimate interests in operating, securing, and improving the marketplace, balanced against your rights.

5. WHO WE SHARE DATA WITH

Rental partners. When you book, we share your name, contact details, booking details, and licence verification status with the partner fulfilling that booking, so they can verify you at handover. We do not give partners your payment credentials.

Service providers. Firebase (authentication and push notifications), our database and hosting providers, and our payment providers Razorpay and Stripe. These providers act on our instructions and are bound to protect your data.

Legal and safety. Law enforcement, regulators, courts, or insurers where we are legally required to disclose, or where disclosure is necessary to establish, exercise, or defend legal claims, or to protect the safety of a person or a vehicle.

Business transfers. If the business is sold or reorganised, data may transfer to the acquirer under the protections described in this policy.

We do not sell your personal data.

6. HOW LONG WE KEEP IT

Account data is kept while your account is active. Booking, payment, and invoice records are kept for as long as tax and accounting law requires, typically eight years from the end of the relevant financial year. Driving licence images are kept only as long as needed to verify eligibility and to resolve disputes arising from a rental, and are deleted after that period. Support tickets are kept for three years from closure.

7. SECURITY

Data is transmitted over encrypted connections and stored on access-controlled infrastructure. Access to licence images and payment records is limited to staff who need it for verification, support, or fraud investigation, and that access is logged. No system is perfectly secure, so we also ask you to keep your account credentials confidential and to tell us promptly if you suspect misuse.

8. YOUR RIGHTS

Subject to local law, you may request access to the personal data we hold about you, correction of inaccurate data, deletion of data we no longer need, a copy of your data in a portable format, restriction of or objection to certain processing, and withdrawal of a consent you previously gave.

You can update most account and licence details directly in the app. For anything else, contact {SUPPORT_EMAIL} and we will respond within the period required by applicable law. If you are not satisfied with our response, you may complain to your local data protection authority.

9. CHILDREN

The service is not directed to anyone under 18, and a valid driving licence is required to rent. We do not knowingly collect data from children. If you believe a child has given us data, contact us and we will delete it.

10. CHANGES

We may update this policy. When we make a material change we will update the date at the top and, where the change significantly affects you, notify you in the app or by email.

11. CONTACT

Privacy questions: {SUPPORT_EMAIL}
Grievance officer: {GRIEVANCE_EMAIL}
Postal address: {ADDRESS}
"""


TERMS_CONDITIONS = f"""Last updated: {LAST_UPDATED}

These terms govern your use of the {COMPANY} marketplace, whether through our website or our mobile apps. By creating an account or making a booking, you agree to them. Please read them carefully.

1. WHAT {COMPANY.upper()} IS

{COMPANY} is a marketplace. We list vehicles offered by independent rental partners and handle search, booking, payment, and support around those listings. We are not a rental company and we do not own the vehicles. The rental contract for any booking is between you and the rental partner. We are responsible for operating the platform; the partner is responsible for the vehicle, its condition, its documentation, and the handover.

2. ELIGIBILITY

To book you must be at least 18 years old, hold a driving licence valid for the vehicle class you are booking and valid for the whole rental period, and be legally able to enter a contract. Upload your licence during checkout. Bookings are confirmed only after licence verification. Providing false or altered documents is grounds for immediate cancellation without refund and account suspension.

Some vehicles carry additional requirements set by the partner, such as a minimum licence age. These are shown on the listing before you book.

3. YOUR ACCOUNT

You are responsible for the accuracy of your account details and for keeping your credentials confidential. Do not share your account. Tell us immediately at {SUPPORT_EMAIL} if you suspect unauthorised use. We may suspend or close an account that is used fraudulently, that repeatedly breaches these terms, or where we are legally required to do so.

4. BOOKINGS

A booking becomes binding when it is confirmed in the app after payment and licence verification. The listing shows the full price before you book: the rental charge, any applicable taxes and fees, and the refundable security deposit.

You must collect and return the vehicle at the times and places stated in the booking, present the licence you uploaded at handover, and be the person named on the booking. Any additional driver must be declared and separately eligible.

5. PRICING, PAYMENTS, AND DEPOSITS

Prices are shown in Indian Rupees and include the components listed at checkout. Payments are processed by Razorpay or Stripe. We do not store your card, UPI, or net-banking credentials.

Most vehicles require a refundable security deposit, shown on the listing before you book. The deposit is released after the vehicle is returned in the condition it was collected in, subject to any lawful deductions for damage, fuel shortfall, traffic fines, late return, or cleaning beyond normal use. Deductions are itemised and explained.

Where a fee such as a service fee, extra-driver surcharge, young-driver surcharge, late-return fee, or cancellation fee applies, it is disclosed before you commit to the booking. Refunds may be issued to your original payment method or to your {COMPANY} wallet; wallet balance can be used for future bookings and, where required by law, withdrawn.

6. CANCELLATIONS AND CHANGES

You can cancel from your bookings screen. The refund you receive depends on the rental partner's cancellation policy, which is shown at checkout and generally depends on how close to pickup you cancel. Refund timelines vary by payment method and are typically five to ten business days.

A partner may cancel in genuinely exceptional circumstances, such as a vehicle becoming unroadworthy. In that case you receive a full refund of everything you paid for that booking, and we will help you find an alternative where possible.

7. USING THE VEHICLE

You agree to hold a valid licence throughout the rental; obey all traffic laws; not drive under the influence of alcohol or drugs; not use the vehicle for racing, towing, off-road driving, hire or reward, or any unlawful purpose; not sublet the vehicle or allow an undeclared driver to drive it; not exceed any mileage or geographic limit stated on the listing; and return the vehicle with the agreed fuel or charge level.

You are responsible for traffic fines, tolls, and penalties incurred during your rental period, including those that arrive after the rental ends.

8. DAMAGE, BREAKDOWN, AND ACCIDENTS

Inspect the vehicle at handover and record any existing damage with the partner before you drive away. Report any accident, theft, or breakdown to the partner and to the police where required, immediately. Do not authorise repairs without the partner's agreement. Insurance cover, excess amounts, and exclusions are set by the partner and shown in the listing's insurance details.

9. RENTAL PARTNERS

Partners must be document-verified before they can list. Partners are responsible for the accuracy of their listings, the roadworthiness and legal documentation of their vehicles, and their conduct at handover. Partner payouts, commission, subscription tiers, and any settlement fees are governed by the separate partner agreement.

10. REVIEWS AND CONTENT

You may post reviews of a rental you actually took. Content must be your own, truthful, and free of unlawful, abusive, or personal information about others. We may remove content that breaches these terms. You grant us a non-exclusive, royalty-free licence to display your review on the marketplace.

11. OUR LIABILITY

We provide the platform with reasonable care and skill, but we do not warrant that it will be uninterrupted or error-free. Because the rental contract is between you and the partner, we are not liable for the condition, safety, or availability of a vehicle, or for a partner's acts or omissions.

Nothing in these terms limits liability for death or personal injury caused by negligence, for fraud, or for any liability that cannot lawfully be excluded. Subject to that, our total liability arising from any booking is limited to the amount you paid to us for that booking.

12. SUSPENSION AND TERMINATION

You may close your account at any time; closure does not affect bookings already in progress or records we must retain by law. We may suspend or terminate access where you breach these terms, where we reasonably suspect fraud, or where we are required to by law.

13. CHANGES TO THESE TERMS

We may update these terms. Material changes will be notified in the app or by email before they take effect. The terms that apply to a booking are the ones in force when that booking was confirmed.

14. GOVERNING LAW AND DISPUTES

These terms are governed by the laws of India, and the courts at Chennai, Tamil Nadu have exclusive jurisdiction, without prejudice to any mandatory consumer protection right to bring proceedings where you live.

Please contact {SUPPORT_EMAIL} first — most issues are resolved through support without escalation.

15. CONTACT

Support: {SUPPORT_EMAIL}
Grievance officer: {GRIEVANCE_EMAIL}
Postal address: {ADDRESS}
"""


REFUND_POLICY = f"""Last updated: {LAST_UPDATED}

This policy explains when you get money back, how much, and how long it takes. It sits alongside the Terms & Conditions, and the rental partner's cancellation policy shown at checkout applies to each specific booking.

1. WHAT YOU PAY

A booking total can include the rental charge, applicable taxes and fees, and a refundable security deposit. The deposit is held against damage, fuel shortfall, fines, and late return; it is not part of the rental price and is refunded separately.

2. CANCELLATION BY YOU

Cancel from the bookings screen in the app. What you get back depends on the partner's cancellation policy for that booking and on how close to pickup you cancel. That policy, including any cancellation fee, is displayed before you pay and again on the booking itself.

The security deposit is always refunded in full when a booking is cancelled before pickup.

3. CANCELLATION BY THE PARTNER OR BY US

If a partner cancels, or we cancel because a vehicle cannot be provided as described, you receive a full refund of everything you paid for that booking, including any fees. Where we can, we will offer an alternative vehicle first.

4. NO-SHOWS AND LATE COLLECTION

If you do not collect the vehicle and do not cancel, the booking is treated as a no-show and the rental charge is generally not refundable. The security deposit is still returned. If you know you will be late, contact the partner through the app — most will hold the vehicle.

5. EARLY RETURN

Returning early does not automatically entitle you to a refund of unused days unless the partner's policy for that booking says so.

6. SECURITY DEPOSIT REFUNDS

The deposit is released after the vehicle is returned and inspected. Lawful deductions may be made for damage beyond normal wear, missing fuel or charge, traffic fines or tolls incurred during your rental, cleaning beyond normal use, or late return. Any deduction is itemised with an explanation. If you disagree, raise a support ticket and we will review the evidence from both sides.

7. HOW REFUNDS ARE PAID

Refunds are normally returned to the original payment method. Where that is not possible, or where you choose it, the amount is credited to your {COMPANY} wallet, which you can spend on future bookings.

Timelines after a refund is approved: wallet credit is immediate; cards and net banking typically take five to ten business days depending on your bank; UPI typically takes three to seven business days. We cannot control the bank's processing time.

8. DISPUTED CHARGES

If a charge or deduction looks wrong, open a support ticket within 30 days with photographs or documents where you have them. We will investigate with the partner and respond. Please raise it with us before initiating a chargeback so we have a chance to resolve it.

9. CONTACT

Refund questions: {SUPPORT_EMAIL}
Grievance officer: {GRIEVANCE_EMAIL}
Postal address: {ADDRESS}
"""


CMS_PAGES = [
    {"slug": "privacy-policy", "title": "Privacy Policy", "content": PRIVACY_POLICY},
    {"slug": "terms-conditions", "title": "Terms & Conditions", "content": TERMS_CONDITIONS},
    {"slug": "refund-policy", "title": "Refund Policy", "content": REFUND_POLICY},
]
