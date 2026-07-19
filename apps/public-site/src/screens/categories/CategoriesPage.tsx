"use client";

import { Link } from "@vrm/ui";
import { LayoutGrid, Sparkles } from "lucide-react";
import { useVehicleCategories } from "@vrm/api-client";
import { Card, EmptyState, SkeletonCard, RevealOnScroll } from "@vrm/ui";
import { Seo } from "@/components/Seo";
import { PageHero } from "@/components/PageHero";

export function CategoriesPage() {
  const { data: categories, isLoading } = useVehicleCategories();

  return (
    <div>
      <Seo title="Vehicle Categories" description="Browse all vehicle categories available to rent on RentWheels." />

      <PageHero
        eyebrow="Browse"
        title="Vehicle Categories"
        description="From compact hatchbacks to bikes and SUVs — find the right category for your trip."
        size="sm"
      />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : !categories?.length ? (
          <EmptyState icon={<LayoutGrid size={26} />} title="No categories available yet" />
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category, i) => (
              <RevealOnScroll key={category.id} delay={i * 0.05}>
                <Link to={`/search?categoryId=${category.id}`} className="group block">
                  <Card hoverable className="flex flex-col items-center gap-3 p-8 text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-secondary-50 to-accent-50 text-secondary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 dark:from-secondary-500/15 dark:to-accent-500/15">
                      {category.iconUrl ? (
                        <img src={category.iconUrl} alt="" className="size-8" />
                      ) : (
                        <Sparkles size={28} />
                      )}
                    </div>
                    <p className="font-heading text-sm font-semibold">{category.name}</p>
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
