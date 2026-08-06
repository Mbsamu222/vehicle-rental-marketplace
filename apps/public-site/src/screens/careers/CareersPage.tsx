"use client";

import { Briefcase, MapPin, Clock, ArrowRight, Mail } from "lucide-react";
import { Badge, Button, Card, EmptyState, Eyebrow, GradientMesh, RevealOnScroll } from "@vrm/ui";
import { PageHero } from "@/components/PageHero";
import { openPositions } from "@/data/marketingContent";

export function CareersPage() {
  return (
    <div className="bg-background text-primary antialiased dark:bg-dark-background dark:text-white min-h-screen">
      <PageHero
        eyebrow="We're Hiring"
        title="Careers at RentWheels"
        description="We're a fast-moving team building the easiest way to rent a vehicle. If that sounds like your kind of problem to solve, we'd love to hear from you."
      />

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <RevealOnScroll className="text-center sm:text-left">
          <Eyebrow>Join Our Team</Eyebrow>
          <h2 className="mt-2 font-heading text-3xl font-bold text-primary dark:text-white">Open Positions</h2>
        </RevealOnScroll>

        {openPositions.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={<Briefcase size={28} />}
            title="No open positions right now"
            description="Check back soon, or send us your resume anyway."
          />
        ) : (
          <div className="mt-8 flex flex-col gap-4">
            {openPositions.map((role, i) => (
              <RevealOnScroll key={role.title} delay={i * 0.06}>
                <Card hoverable className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between shadow-soft border border-border transition-all duration-300 hover:-translate-y-0.5">
                  <div>
                    <h3 className="font-heading text-base font-bold text-primary dark:text-white">{role.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-3.5 text-xs text-primary-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Briefcase size={13} className="text-secondary" /> {role.department}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <MapPin size={13} className="text-secondary" /> {role.location}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock size={13} className="text-secondary" /> {role.type}
                      </span>
                    </div>
                  </div>
                  <a href="mailto:careers@rentwheels.example">
                    <Button size="sm" className="gap-1.5 text-xs font-bold dark:bg-white dark:text-primary dark:hover:bg-primary-50">
                      Apply Now <ArrowRight size={14} />
                    </Button>
                  </a>
                </Card>
              </RevealOnScroll>
            ))}
          </div>
        )}
      </section>

      <section className="relative overflow-hidden bg-primary py-16 text-center text-white dark:bg-dark-surface">
        <GradientMesh variant="dark" />
        <div className="relative mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
            <Mail size={22} className="text-white" />
          </div>
          <h3 className="font-heading text-xl font-bold">Don't See a Direct Fit?</h3>
          <p className="mt-2 text-sm text-white/75 leading-relaxed">
            Reach out anytime at{" "}
            <a href="mailto:careers@rentwheels.example" className="font-bold text-white underline">
              careers@rentwheels.example
            </a>{" "}
            — we're always happy to connect with talented people.
          </p>
        </div>
      </section>
    </div>
  );
}
