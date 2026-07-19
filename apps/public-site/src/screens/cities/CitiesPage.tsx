"use client";

import { Link } from "@vrm/ui";
import { MapPin, ImageOff } from "lucide-react";
import { useCities } from "@vrm/api-client";
import { Card, EmptyState, SkeletonCard, RevealOnScroll } from "@vrm/ui";
import { Seo } from "@/components/Seo";
import { PageHero } from "@/components/PageHero";

export function CitiesPage() {
  const { data: cities, isLoading } = useCities({ popular: true });

  return (
    <div>
      <Seo title="Where We Operate" description="RentWheels is live in Chennai, with more cities on the roadmap." />

      <PageHero
        eyebrow="Where we operate"
        title="Where We Operate"
        description="We're live in Chennai today — more cities are on the roadmap as we grow."
        size="sm"
      />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : !cities?.length ? (
          <EmptyState
            icon={<MapPin size={26} />}
            title="No popular cities marked yet"
            description="Check back soon — we're expanding to new cities regularly."
          />
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {cities.map((city, i) => (
              <RevealOnScroll key={city.id} delay={i * 0.05}>
                <Link to={`/search?cityId=${city.id}`} className="group block">
                  <Card hoverable className="overflow-hidden">
                    <div className="aspect-[4/3] w-full overflow-hidden bg-primary-50 dark:bg-white/5">
                      {city.imageUrl ? (
                        <img
                          src={city.imageUrl}
                          alt={city.name}
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-primary-300">
                          <ImageOff size={28} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 p-4">
                      <MapPin size={14} className="text-secondary" />
                      <p className="font-heading text-sm font-semibold">{city.name}</p>
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
