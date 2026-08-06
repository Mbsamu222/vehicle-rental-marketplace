"use client";

import { Link } from "@vrm/ui";
import { LayoutGrid, ArrowRight } from "lucide-react";
import { useVehicleCategories } from "@vrm/api-client";
import { Card, EmptyState, SkeletonCard, RevealOnScroll } from "@vrm/ui";
import { PageHero } from "@/components/PageHero";
import { getCategoryIcon, getCategoryColorStyle } from "@/utils/categoryIcons";

export function CategoriesPage() {
  const { data: categories, isLoading } = useVehicleCategories();

  return (
    <div className="bg-background text-primary antialiased dark:bg-dark-background dark:text-white min-h-screen">
      <PageHero
        eyebrow="Browse Fleet"
        title="Vehicle Categories"
        description="From compact hatchbacks and electric bikes to premium SUVs — find the right category for your next journey."
        size="sm"
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : !categories?.length ? (
          <EmptyState icon={<LayoutGrid size={28} />} title="No categories available yet" description="Check back soon for newly listed categories." />
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category, i) => {
              const colorStyle = getCategoryColorStyle(category.name);
              const icon = getCategoryIcon(category.name, category.iconUrl);
              return (
                <RevealOnScroll key={category.id} delay={i * 0.05}>
                  <Link to={`/search?categoryId=${category.id}`} className="group block">
                    <Card hoverable className="flex flex-col items-center gap-4 p-8 text-center shadow-soft transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-secondary/40 group-hover:shadow-card">
                      <div className={`flex size-16 items-center justify-center rounded-2xl ${colorStyle} transition-transform duration-300 group-hover:scale-110`}>
                        {icon}
                      </div>
                      <div>
                        <h3 className="font-heading text-base font-bold text-primary group-hover:text-secondary dark:text-white dark:group-hover:text-accent-300">
                          {category.name}
                        </h3>
                        <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary-400 transition-colors group-hover:text-secondary">
                          Browse Vehicles <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </Card>
                  </Link>
                </RevealOnScroll>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
