"use client";

import { Link } from "@vrm/ui";
import { MessageCircleQuestion, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { Button, Card, RevealOnScroll } from "@vrm/ui";
import { PageHero } from "@/components/PageHero";

export function SupportPage() {
  return (
    <div className="bg-background text-primary antialiased dark:bg-dark-background dark:text-white min-h-screen">
      <PageHero
        eyebrow="Customer Support"
        title="We're Here to Help"
        description="We're available 24/7 to assist with your bookings, payments, rental partner inquiries, and account settings."
        size="sm"
      />

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <RevealOnScroll>
            <Card hoverable className="flex flex-col justify-between h-full p-8 shadow-soft border border-border transition-all duration-300 hover:-translate-y-1">
              <div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-secondary-50 text-secondary dark:bg-secondary-500/15 dark:text-accent-300">
                  <MessageCircleQuestion size={22} />
                </div>
                <h3 className="mt-5 font-heading text-lg font-bold text-primary dark:text-white">Browse Help & FAQ</h3>
                <p className="mt-2 text-xs leading-relaxed text-primary-400">
                  Find fast answers to common questions regarding driving requirements, deposit refunds, and cancellation rules.
                </p>
              </div>
              <Link to="/faq" className="mt-6 inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline dark:text-accent-300">
                Explore FAQ Articles <ArrowRight size={14} />
              </Link>
            </Card>
          </RevealOnScroll>

          <RevealOnScroll delay={0.08}>
            <Card hoverable className="flex flex-col justify-between h-full p-8 shadow-soft border border-border transition-all duration-300 hover:-translate-y-1">
              <div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-secondary-50 text-secondary dark:bg-secondary-500/15 dark:text-accent-300">
                  <Mail size={22} />
                </div>
                <h3 className="mt-5 font-heading text-lg font-bold text-primary dark:text-white">Contact Support Team</h3>
                <p className="mt-2 text-xs leading-relaxed text-primary-400">
                  Send us a direct message and our dedicated support team will respond by email within 24 hours.
                </p>
              </div>
              <Link to="/contact" className="mt-6 inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline dark:text-accent-300">
                Go to Contact Form <ArrowRight size={14} />
              </Link>
            </Card>
          </RevealOnScroll>
        </div>

        <RevealOnScroll delay={0.16}>
          <Card className="mt-8 flex flex-col items-center gap-6 p-8 text-center sm:flex-row sm:justify-between sm:text-left shadow-card border border-border">
            <div>
              <h3 className="font-heading text-lg font-bold text-primary dark:text-white">Already Have an Active Booking?</h3>
              <p className="mt-1 text-xs text-primary-400 leading-relaxed">
                Log in to your customer account to raise a support ticket and track live trip updates.
              </p>
            </div>
            <Link to="/account/support">
              <Button size="sm" className="gap-2 text-xs font-bold dark:bg-white dark:text-primary dark:hover:bg-primary-50">
                My Support Tickets <ArrowRight size={15} />
              </Button>
            </Link>
          </Card>
        </RevealOnScroll>
      </section>
    </div>
  );
}
