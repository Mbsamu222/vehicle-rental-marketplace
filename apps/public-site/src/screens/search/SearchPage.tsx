"use client";

import { useMemo, useState } from "react";
import { SearchX, SlidersHorizontal, MapPin, Sparkles } from "lucide-react";
import {
  useAuth,
  useCities,
  useVehicleBrands,
  useVehicleCategories,
  useVehicleSearch,
  useWishlist,
  useToggleWishlist,
  type VehicleSearchParams,
} from "@vrm/api-client";
import { Select, Input, Card, EmptyState, SkeletonCard, Pagination } from "@vrm/ui";
import { VehicleCard } from "@/components/VehicleCard";
import { PageHero } from "@/components/PageHero";

export function SearchPage() {
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = useState<VehicleSearchParams>({ page: 1, limit: 12 });
  const { data: cities } = useCities();
  const { data: categories } = useVehicleCategories();
  const { data: brands } = useVehicleBrands();
  const { data: results, isLoading } = useVehicleSearch(filters);
  const { data: wishlist } = useWishlist(isAuthenticated);
  const toggleWishlist = useToggleWishlist();

  const wishlistIds = useMemo(() => new Set((wishlist ?? []).map((w) => w.vehicleId)), [wishlist]);

  const setFilter = (patch: Partial<VehicleSearchParams>) => setFilters((f) => ({ ...f, ...patch, page: 1 }));

  return (
    <div className="bg-background text-primary antialiased dark:bg-dark-background dark:text-white min-h-screen">
      <PageHero
        eyebrow="Marketplace Search"
        title="Find Your Perfect Ride"
        description="Filter by city, vehicle category, transmission type, or price per day across verified local rental hubs."
        size="sm"
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Search Filters Panel */}
        <Card className="mb-8 p-6 shadow-soft border border-border">
          <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3 dark:border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary dark:text-white">
              <SlidersHorizontal size={16} className="text-secondary" /> Filter Marketplace Fleet
            </div>
            {results?.meta?.totalItems !== undefined && (
              <span className="text-xs font-semibold text-primary-400">
                {String(results.meta.totalItems)} vehicles available
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
            <Select
              placeholder="Any city"
              options={(cities ?? []).map((c) => ({ value: c.id, label: c.name }))}
              value={filters.cityId ?? ""}
              onChange={(e) => setFilter({ cityId: e.target.value || undefined })}
            />
            <Select
              placeholder="Any category"
              options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
              value={filters.categoryId ?? ""}
              onChange={(e) => setFilter({ categoryId: e.target.value || undefined })}
            />
            <Select
              placeholder="Any brand"
              options={(brands ?? []).map((b) => ({ value: b.id, label: b.name }))}
              value={filters.brandId ?? ""}
              onChange={(e) => setFilter({ brandId: e.target.value || undefined })}
            />
            <Select
              placeholder="Transmission"
              options={[
                { value: "MANUAL", label: "Manual" },
                { value: "AUTOMATIC", label: "Automatic" },
              ]}
              value={filters.transmission ?? ""}
              onChange={(e) => setFilter({ transmission: (e.target.value || undefined) as VehicleSearchParams["transmission"] })}
            />
            <Input
              type="number"
              placeholder="Max price / day (₹)"
              value={filters.maxPrice ?? ""}
              onChange={(e) => setFilter({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
            />
            <Select
              placeholder="Sort by"
              options={[
                { value: "newest", label: "Newest" },
                { value: "price_asc", label: "Price: Low to High" },
                { value: "price_desc", label: "Price: High to Low" },
                { value: "rating", label: "Top Rated" },
              ]}
              value={filters.sortBy ?? ""}
              onChange={(e) => setFilter({ sortBy: (e.target.value || undefined) as VehicleSearchParams["sortBy"] })}
            />
          </div>
        </Card>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : !results?.data.length ? (
          <EmptyState icon={<SearchX size={32} />} title="No vehicles found" description="Try clearing or adjusting your search filters." />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {results.data.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  isWishlisted={wishlistIds.has(vehicle.id)}
                  onToggleWishlist={
                    isAuthenticated
                      ? () => toggleWishlist.mutate({ vehicleId: vehicle.id, inWishlist: wishlistIds.has(vehicle.id) })
                      : undefined
                  }
                />
              ))}
            </div>
            <div className="mt-12 flex justify-center">
              <Pagination page={results.meta.page} totalPages={results.meta.totalPages} onChange={(page) => setFilters((f) => ({ ...f, page }))} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
