"use client";

import { Link } from "@vrm/ui";
import { MessageCircleQuestion, Mail, ArrowRight } from "lucide-react";
import { Button, Card, RevealOnScroll } from "@vrm/ui";
import { Seo } from "@/components/Seo";
import { PageHero } from "@/components/PageHero";

export function SupportPage() {
  return (
    <div>
      <Seo title="Support" description="Get help with your RentWheels booking or account." />

      <PageHero
        eyebrow="We're here to help"
        title="Support"
        description="We're here to help with bookings, payments, partner questions, and anything in between."
        size="sm"
      />

      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <RevealOnScroll>
            <Card hoverable className="h-full p-6">
              <div className="flex size-11 items-center justify-center rounded-xl bg-secondary-50 text-secondary dark:bg-secondary-500/15">
                <MessageCircleQuestion size={20} />
              </div>
              <p className="mt-4 font-heading text-base font-semibold">Browse the FAQ</p>
              <p className="mt-1.5 text-sm text-primary-400">
                Most common questions about bookings, payments, and partnerships are answered there.
              </p>
              <Link to="/faq" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline">
                View FAQ <ArrowRight size={14} />
              </Link>
            </Card>
          </RevealOnScroll>

          <RevealOnScroll delay={0.08}>
            <Card hoverable className="h-full p-6">
              <div className="flex size-11 items-center justify-center rounded-xl bg-secondary-50 text-secondary dark:bg-secondary-500/15">
                <Mail size={20} />
              </div>
              <p className="mt-4 font-heading text-base font-semibold">Contact our team</p>
              <p className="mt-1.5 text-sm text-primary-400">
                Send us a message and we'll respond by email — usually within one business day.
              </p>
              <Link to="/contact" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline">
                Go to Contact <ArrowRight size={14} />
              </Link>
            </Card>
          </RevealOnScroll>
        </div>

        <RevealOnScroll delay={0.16}>
          <Card className="mt-6 flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="font-heading text-base font-semibold">Already have a booking?</p>
              <p className="mt-1 text-sm text-primary-400">
                Log in to your account to raise a support ticket and track it alongside your bookings.
              </p>
            </div>
            <Link to="/account/support">
              <Button>
                Go to My Support Tickets <ArrowRight size={16} />
              </Button>
            </Link>
          </Card>
        </RevealOnScroll>
      </section>
    </div>
  );
}
