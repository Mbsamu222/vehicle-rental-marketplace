"use client";

import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";
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
import { Seo } from "@/components/Seo";
import { VehicleCard } from "@/components/VehicleCard";

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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Seo title="Search vehicles" description="Search across every rental partner on RentWheels." />
      <h1 className="mb-1 font-heading text-2xl font-bold">Find your vehicle</h1>
      <p className="mb-6 text-sm text-primary-400">Search across every rental partner on the platform.</p>

      <Card className="mb-6 p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
            placeholder="Max price / day"
            value={filters.maxPrice ?? ""}
            onChange={(e) => setFilter({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
          />
          <Select
            placeholder="Sort by"
            options={[
              { value: "newest", label: "Newest" },
              { value: "price_asc", label: "Price: low to high" },
              { value: "price_desc", label: "Price: high to low" },
              { value: "rating", label: "Top rated" },
            ]}
            value={filters.sortBy ?? ""}
            onChange={(e) => setFilter({ sortBy: (e.target.value || undefined) as VehicleSearchParams["sortBy"] })}
          />
        </div>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !results?.data.length ? (
        <EmptyState icon={<SearchX size={26} />} title="No vehicles found" description="Try adjusting your filters." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="mt-8">
            <Pagination page={results.meta.page} totalPages={results.meta.totalPages} onChange={(page) => setFilters((f) => ({ ...f, page }))} />
          </div>
        </>
      )}
    </div>
  );
}
