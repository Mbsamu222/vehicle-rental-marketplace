// Static, well-crafted marketing copy. There is no backend model for FAQs,
// testimonials, careers listings, or stats, so this content is hand-written
// rather than fetched. See the FAQ page for the CMS-driven alternative note.

import type { FaqItem } from "@/components/FaqAccordion";

export const faqItems: FaqItem[] = [
  {
    question: "How do I book a vehicle on RentWheels?",
    answer:
      "Search for vehicles by city and category from our homepage, compare options from local rental partners, and complete your booking after creating a free customer account.",
  },
  {
    question: "Do I need a driving license to rent a vehicle?",
    answer:
      "Yes. You'll need to upload a valid driving license during checkout. Our team (and our partners) verify licenses before your booking is confirmed.",
  },
  {
    question: "Is there a security deposit?",
    answer:
      "Most vehicles require a refundable security deposit, shown upfront on the vehicle listing before you book. It's refunded after the vehicle is returned in good condition.",
  },
  {
    question: "Can I cancel or modify my booking?",
    answer:
      "Yes, you can cancel bookings from your dashboard subject to the rental partner's cancellation policy shown at checkout. Refund timelines vary by payment method.",
  },
  {
    question: "How do I become a rental partner?",
    answer:
      "Visit our Become a Partner page and sign up for a free partner account. You'll list your vehicles, upload your business documents for verification, and start receiving bookings.",
  },
  {
    question: "What payment methods are supported?",
    answer:
      "We support major cards, UPI, and net banking through our secure payment partners, plus a wallet balance for refunds and quick rebooking.",
  },
];

export const testimonials = [
  {
    name: "Aisha Verma",
    role: "Frequent traveler, Adyar",
    quote:
      "RentWheels made finding a reliable car for my weekend trips effortless. The booking process took minutes and the partner was fantastic.",
    rating: 5,
  },
  {
    name: "Rohit Malhotra",
    role: "Business commuter, OMR",
    quote:
      "I've tried a few rental apps and this is by far the smoothest — transparent pricing, no surprise fees, and great customer support.",
    rating: 5,
  },
  {
    name: "Sneha Iyer",
    role: "Student, T Nagar",
    quote:
      "Renting a scooter for the semester was so easy. I loved being able to compare partners side by side before booking.",
    rating: 4,
  },
];

export const stats = [
  { label: "Bookings completed", value: "1,000+" },
  { label: "Verified rental partners", value: "50+" },
  { label: "Neighborhoods covered", value: "20+" },
  { label: "Average rating", value: "4.7 / 5" },
];

export const howItWorksSteps = [
  { title: "Search", description: "Pick your city, dates, and vehicle category to see what's available nearby." },
  { title: "Book", description: "Compare vehicles from verified partners and confirm your booking in a few taps." },
  { title: "Pay securely", description: "Pay online with cards, UPI, or net banking — no cash surprises." },
  { title: "Track your trip", description: "Get real-time status updates from pickup right through to drop-off." },
  { title: "Return & review", description: "Return the vehicle, and share a review to help the next renter." },
];

export const whyChooseUs = [
  {
    title: "Verified partners",
    description: "Every rental partner is document-verified before they can list a vehicle.",
  },
  {
    title: "Transparent pricing",
    description: "See the full price — rental, deposit, and fees — before you book. No hidden charges.",
  },
  {
    title: "Wide selection",
    description: "From city hatchbacks to bikes and SUVs, find the right vehicle for every trip.",
  },
  {
    title: "24/7 support",
    description: "Our support team and in-app ticketing are there whenever you need help.",
  },
];

// There is no backend model for job postings — this is a static placeholder
// list, not a fabricated API call.
export const openPositions = [
  {
    title: "Frontend Engineer",
    department: "Engineering",
    location: "Chennai / Remote",
    type: "Full-time",
  },
  {
    title: "Partner Success Manager",
    department: "Operations",
    location: "Chennai",
    type: "Full-time",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "Customer Support Associate",
    department: "Support",
    location: "Chennai",
    type: "Full-time",
  },
];
