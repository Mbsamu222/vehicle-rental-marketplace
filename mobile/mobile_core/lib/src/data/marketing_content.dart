import 'package:flutter/material.dart';

/// Port of apps/public-site/src/data/marketingContent.ts.
///
/// Same caveat as the web copy: there is no backend model for FAQs,
/// testimonials, job postings, or the stats band, so this content is
/// hand-written rather than fetched. Keeping it here (instead of inside
/// customer-mobile) means the copy stays identical across web and mobile and
/// only has to be corrected in one place.
class FaqItem {
  final String question;
  final String answer;
  const FaqItem({required this.question, required this.answer});
}

class Testimonial {
  final String name;
  final String role;
  final String quote;
  final double rating;
  const Testimonial({required this.name, required this.role, required this.quote, required this.rating});
}

class MarketingStat {
  final String label;
  final String value;
  const MarketingStat({required this.label, required this.value});
}

class HowItWorksStep {
  final String title;
  final String description;
  final IconData icon;
  const HowItWorksStep({required this.title, required this.description, required this.icon});
}

class WhyChooseUsItem {
  final String title;
  final String description;
  final IconData icon;
  const WhyChooseUsItem({required this.title, required this.description, required this.icon});
}

class AboutValue {
  final String title;
  final String description;
  final IconData icon;
  const AboutValue({required this.title, required this.description, required this.icon});
}

class ContactDetail {
  final String label;
  final String value;
  final IconData icon;

  /// `tel:` / `mailto:` target, or null for detail rows that aren't actionable
  /// (address, opening hours).
  final String? launchUrl;
  const ContactDetail({required this.label, required this.value, required this.icon, this.launchUrl});
}

class PartnerHub {
  final String name;
  final String city;
  final double rating;
  const PartnerHub({required this.name, required this.city, required this.rating});
}

class OpenPosition {
  final String title;
  final String department;
  final String location;
  final String type;
  const OpenPosition({required this.title, required this.department, required this.location, required this.type});
}

class MarketingContent {
  MarketingContent._();

  static const faqItems = <FaqItem>[
    FaqItem(
      question: "How do I book a vehicle on RentWheels?",
      answer:
          "Search for vehicles by city and category from our homepage, compare options from local rental partners, and complete your booking after creating a free customer account.",
    ),
    FaqItem(
      question: "Do I need a driving license to rent a vehicle?",
      answer:
          "Yes. You'll need to upload a valid driving license during checkout. Our team (and our partners) verify licenses before your booking is confirmed.",
    ),
    FaqItem(
      question: "Is there a security deposit?",
      answer:
          "Most vehicles require a refundable security deposit, shown upfront on the vehicle listing before you book. It's refunded after the vehicle is returned in good condition.",
    ),
    FaqItem(
      question: "Can I cancel or modify my booking?",
      answer:
          "Yes, you can cancel bookings from your dashboard subject to the rental partner's cancellation policy shown at checkout. Refund timelines vary by payment method.",
    ),
    FaqItem(
      question: "How do I become a rental partner?",
      answer:
          "Visit our Become a Partner page and sign up for a free partner account. You'll list your vehicles, upload your business documents for verification, and start receiving bookings.",
    ),
    FaqItem(
      question: "What payment methods are supported?",
      answer:
          "We support major cards, UPI, and net banking through our secure payment partners, plus a wallet balance for refunds and quick rebooking.",
    ),
  ];

  static const testimonials = <Testimonial>[
    Testimonial(
      name: "Aisha Verma",
      role: "Frequent traveler, Adyar",
      quote:
          "RentWheels made finding a reliable car for my weekend trips effortless. The booking process took minutes and the partner was fantastic.",
      rating: 5,
    ),
    Testimonial(
      name: "Rohit Malhotra",
      role: "Business commuter, OMR",
      quote:
          "I've tried a few rental apps and this is by far the smoothest — transparent pricing, no surprise fees, and great customer support.",
      rating: 5,
    ),
    Testimonial(
      name: "Sneha Iyer",
      role: "Student, T Nagar",
      quote:
          "Renting a scooter for the semester was so easy. I loved being able to compare partners side by side before booking.",
      rating: 4,
    ),
  ];

  static const stats = <MarketingStat>[
    MarketingStat(label: "Bookings completed", value: "1,000+"),
    MarketingStat(label: "Verified rental partners", value: "50+"),
    MarketingStat(label: "Neighborhoods covered", value: "20+"),
    MarketingStat(label: "Average rating", value: "4.7 / 5"),
  ];

  /// Icons mirror `stepIcons` in HomePage.tsx (Search, KeyRound, CreditCard,
  /// Route, RotateCcw) using their closest Material equivalents.
  static const howItWorksSteps = <HowItWorksStep>[
    HowItWorksStep(
      title: "Search",
      description: "Pick your city, dates, and vehicle category to see what's available nearby.",
      icon: Icons.search,
    ),
    HowItWorksStep(
      title: "Book",
      description: "Compare vehicles from verified partners and confirm your booking in a few taps.",
      icon: Icons.vpn_key_outlined,
    ),
    HowItWorksStep(
      title: "Pay securely",
      description: "Pay online with cards, UPI, or net banking — no cash surprises.",
      icon: Icons.credit_card,
    ),
    HowItWorksStep(
      title: "Track your trip",
      description: "Get real-time status updates from pickup right through to drop-off.",
      icon: Icons.route_outlined,
    ),
    HowItWorksStep(
      title: "Return & review",
      description: "Return the vehicle, and share a review to help the next renter.",
      icon: Icons.restore,
    ),
  ];

  /// Icons mirror `whyIcons` in HomePage.tsx (UserCheck, Wallet, Sparkles, Headset).
  static const whyChooseUs = <WhyChooseUsItem>[
    WhyChooseUsItem(
      title: "Verified partners",
      description: "Every rental partner is document-verified before they can list a vehicle.",
      icon: Icons.how_to_reg_outlined,
    ),
    WhyChooseUsItem(
      title: "Transparent pricing",
      description: "See the full price — rental, deposit, and fees — before you book. No hidden charges.",
      icon: Icons.account_balance_wallet_outlined,
    ),
    WhyChooseUsItem(
      title: "Wide selection",
      description: "From city hatchbacks to bikes and SUVs, find the right vehicle for every trip.",
      icon: Icons.auto_awesome_outlined,
    ),
    WhyChooseUsItem(
      title: "24/7 support",
      description: "Our support team and in-app ticketing are there whenever you need help.",
      icon: Icons.headset_mic_outlined,
    ),
  ];

  /// AboutPage.tsx `values`.
  static const aboutValues = <AboutValue>[
    AboutValue(
      title: "Our Mission",
      description:
          "Make vehicle rental as simple as booking a ride — transparent pricing, verified partners, and a seamless experience from search to return.",
      icon: Icons.adjust_outlined,
    ),
    AboutValue(
      title: "Our Community",
      description:
          "We connect thousands of renters with hundreds of local rental businesses, helping small and mid-size fleets reach more customers.",
      icon: Icons.groups_outlined,
    ),
    AboutValue(
      title: "Our Reach",
      description:
          "Live in Chennai today, with a catalog spanning cars, bikes, and scooters — more cities on the roadmap.",
      icon: Icons.public,
    ),
    AboutValue(
      title: "Our Promise",
      description: "Every partner is document-verified, every price is upfront, and every booking is backed by 24/7 support.",
      icon: Icons.favorite_outline,
    ),
  ];

  /// AboutPage.tsx `storyParagraphs`.
  static const aboutStory = <String>[
    "RentWheels was founded by a team of engineers and operators who kept running into the same problem while traveling for work and leisure: finding a reliable local vehicle rental meant sifting through outdated listings, calling around for prices, and hoping the vehicle showed up as described.",
    "We built RentWheels to fix that — a single place where rental partners can list verified vehicles with real-time availability, and renters can search, compare, and book with confidence. Behind the scenes, every partner goes through a document verification process, every listing carries transparent pricing including deposits and fees, and every booking is tracked from pickup to return.",
    "We're expanding city by city and category by category, but our focus hasn't changed: make renting a vehicle simple, fair, and dependable — for renters and partners alike.",
  ];

  /// ContactPage.tsx `contactDetails`. These are placeholder contact points
  /// carried over from the web build — update both together when the real
  /// support desk details are live.
  static const contactDetails = <ContactDetail>[
    ContactDetail(
      label: "Email Support",
      value: "support@rentwheels.example",
      icon: Icons.mail_outline,
      launchUrl: "mailto:support@rentwheels.example",
    ),
    ContactDetail(
      label: "Customer Helpline",
      value: "+91 80-4567-8900",
      icon: Icons.phone_outlined,
      launchUrl: "tel:+918045678900",
    ),
    ContactDetail(
      label: "Headquarters",
      value: "T Nagar, Chennai, Tamil Nadu, India",
      icon: Icons.location_on_outlined,
    ),
    ContactDetail(
      label: "Working Hours",
      value: "Monday – Sunday, 24/7 Available",
      icon: Icons.schedule_outlined,
    ),
  ];

  /// `partnerChips` from HomePage.tsx. These are illustrative placeholder hub
  /// names, not real onboarded partners — there is no public endpoint that
  /// lists rental businesses, so nothing here is fetched. Replace this list
  /// (here and in HomePage.tsx) once real partners should be showcased.
  static const partnerHubs = <PartnerHub>[
    PartnerHub(name: "CityDrive Rentals", city: "T Nagar", rating: 4.8),
    PartnerHub(name: "SwiftWheels Co.", city: "Adyar", rating: 4.7),
    PartnerHub(name: "Metro Bike Hub", city: "Velachery", rating: 4.9),
    PartnerHub(name: "RoadReady Motors", city: "Anna Nagar", rating: 4.6),
    PartnerHub(name: "Coastal Cruisers", city: "OMR", rating: 4.8),
    PartnerHub(name: "Highway Heroes", city: "Tambaram", rating: 4.7),
  ];

  /// BecomePartnerPage.tsx `benefits`.
  static const partnerBenefits = <AboutValue>[
    AboutValue(
      title: "Higher Earnings",
      description:
          "List your fleet to a growing base of renters and fill idle vehicle time with high-converting bookings.",
      icon: Icons.trending_up,
    ),
    AboutValue(
      title: "Easy Fleet Management",
      description:
          "Manage listings, pricing, availability blocks, and vehicle documents from one partner dashboard.",
      icon: Icons.grid_view_outlined,
    ),
    AboutValue(
      title: "Wider Customer Reach",
      description: "Get discovered by renters searching across your city — zero marketing or setup spend required.",
      icon: Icons.groups_2_outlined,
    ),
    AboutValue(
      title: "Verified & Trusted",
      description: "Our partner verification badge builds instant renter trust and helps your listings convert faster.",
      icon: Icons.verified_user_outlined,
    ),
    AboutValue(
      title: "Fast Bank Payouts",
      description: "Track bookings and revenue in real time, with payouts directly to your linked bank account.",
      icon: Icons.schedule_outlined,
    ),
  ];

  /// BecomePartnerPage.tsx `steps`.
  static const partnerOnboardingSteps = <String, String>{
    "Create Your Account": "Sign up for a free partner account in under two minutes.",
    "Get Verified": "Upload your business documents for a quick verification review.",
    "List & Start Earning": "Add your vehicles, set your daily rates, and start receiving bookings.",
  };

  /// BecomePartnerPage.tsx `heroStats`.
  static const partnerHeroStats = <MarketingStat>[
    MarketingStat(label: "Active partners", value: "50+"),
    MarketingStat(label: "Neighborhoods", value: "20+"),
    MarketingStat(label: "Bookings completed", value: "1,000+"),
  ];

  /// The single partner quote on BecomePartnerPage.tsx. Placeholder copy, same
  /// as [partnerHubs].
  static const partnerTestimonial = Testimonial(
    name: "Karan Shah",
    role: "Owner, CityDrive Rentals — T Nagar, Chennai",
    quote:
        "Since listing our fleet on RentWheels, bookings during off-peak weekdays have picked up significantly. The dashboard makes it easy to manage pricing and availability without extra staff.",
    rating: 5,
  );

  /// Where careers applications go on the web build.
  static const careersEmail = "careers@rentwheels.example";

  /// There is no backend model for job postings — this is a static placeholder
  /// list, not a fabricated API call.
  static const openPositions = <OpenPosition>[
    OpenPosition(title: "Frontend Engineer", department: "Engineering", location: "Chennai / Remote", type: "Full-time"),
    OpenPosition(title: "Partner Success Manager", department: "Operations", location: "Chennai", type: "Full-time"),
    OpenPosition(title: "Product Designer", department: "Design", location: "Remote", type: "Full-time"),
    OpenPosition(title: "Customer Support Associate", department: "Support", location: "Chennai", type: "Full-time"),
  ];
}
