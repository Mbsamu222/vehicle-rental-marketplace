"use client";

import { Link } from "@vrm/ui";
import { MapPin, ImageOff, ArrowRight } from "lucide-react";
import { useCities } from "@vrm/api-client";
import { Card, EmptyState, SkeletonCard, RevealOnScroll } from "@vrm/ui";
import { Seo } from "@/components/Seo";
import { PageHero } from "@/components/PageHero";

export function CitiesPage() {
  const { data: cities, isLoading } = useCities({ popular: true });

  return (
    <div className="bg-background text-primary antialiased dark:bg-dark-background dark:text-white min-h-screen">
      <Seo title="Where We Operate" description="RentWheels is live in Chennai, with more cities on the roadmap." />

      <PageHero
        eyebrow="Marketplace Hubs"
        title="Where We Operate"
        description="We're live in Chennai today — expanding rapidly to new cities across the region."
        size="sm"
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : !cities?.length ? (
          <EmptyState
            icon={<MapPin size={28} />}
            title="No popular cities marked yet"
            description="Check back soon — we're expanding to new cities regularly."
          />
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {cities.map((city, i) => (
              <RevealOnScroll key={city.id} delay={i * 0.05}>
                <Link to={`/search?cityId=${city.id}`} className="group block">
                  <Card hoverable className="overflow-hidden rounded-2xl shadow-soft transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-card">
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-primary-100/50 dark:bg-white/5">
                      {city.imageUrl ? (
                        <img
                          src={city.imageUrl}
                          alt={city.name}
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-primary-300">
                          <ImageOff size={28} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white">
                        <MapPin size={14} className="text-accent-300" />
                        <span className="font-heading text-sm font-bold">{city.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-surface dark:bg-dark-surface">
                      <span className="text-xs font-semibold text-primary-400">Explore Vehicles</span>
                      <ArrowRight size={14} className="text-secondary transition-transform group-hover:translate-x-1" />
                    </div>
                  </Card>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
