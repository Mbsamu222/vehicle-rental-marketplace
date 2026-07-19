"use client";

import { Briefcase, MapPin, Clock, ArrowRight } from "lucide-react";
import { Badge, Button, Card, EmptyState, Eyebrow, GradientMesh, RevealOnScroll } from "@vrm/ui";
import { Seo } from "@/components/Seo";
import { PageHero } from "@/components/PageHero";
import { openPositions } from "@/data/marketingContent";

export function CareersPage() {
  return (
    <div>
      <Seo title="Careers" description="Join the RentWheels team — open positions and what it's like to work here." />

      <PageHero
        eyebrow="We're hiring"
        title="Careers at RentWheels"
        description="We're a small, fast-moving team building the easiest way to rent a vehicle. If that sounds like your kind of problem to work on, we'd love to hear from you."
      />

      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <RevealOnScroll>
          <Eyebrow>Open roles</Eyebrow>
          <h2 className="mt-3 font-heading text-2xl font-bold">Open Positions</h2>
        </RevealOnScroll>
        {/* There is no backend model for job postings, so this is a static
            placeholder list rather than a fabricated API call. */}
        {openPositions.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={<Briefcase size={26} />}
            title="No open positions right now"
            description="Check back soon, or send us your resume anyway."
          />
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {openPositions.map((role, i) => (
              <RevealOnScroll key={role.title} delay={i * 0.06}>
                <Card hoverable className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-heading text-sm font-semibold">{role.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-primary-400">
                      <span className="flex items-center gap-1">
                        <Briefcase size={12} /> {role.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {role.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {role.type}
                      </span>
                    </div>
                  </div>
                  <a href="mailto:careers@rentwheels.example">
                    <Button variant="outline" size="sm">
                      Apply <ArrowRight size={14} />
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
          <Badge tone="info" className="mb-3 bg-white/10 text-white">
            Don't see a fit?
          </Badge>
          <p className="text-sm text-white/70">
            Reach out anytime at{" "}
            <a href="mailto:careers@rentwheels.example" className="font-semibold text-white hover:underline">
              careers@rentwheels.example
            </a>{" "}
            — we're always happy to hear from great people.
          </p>
        </div>
      </section>
    </div>
  );
}
