"use client";

import { useMemo, useState } from "react";
import { APIProvider, Map, Marker, InfoWindow } from "@vis.gl/react-google-maps";
import { SearchX, SlidersHorizontal, MapPin, Sparkles, LocateFixed } from "lucide-react";
import {
  useAuth,
  useCities,
  useVehicleBrands,
  useVehicleCategories,
  useVehicleSearch,
  useNearbyVehicles,
  useWishlist,
  useToggleWishlist,
  type Vehicle,
  type VehicleSearchParams,
} from "@vrm/api-client";
import { Select, Input, Card, EmptyState, SkeletonCard, Pagination, Tabs } from "@vrm/ui";
import { VehicleCard } from "@/components/VehicleCard";
import { PageHero } from "@/components/PageHero";

function NearbyVehiclesMap({ center, vehicles }: { center: { lat: number; lng: number }; vehicles: Vehicle[] }) {
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  return (
    <div className="h-[480px] w-full overflow-hidden rounded-2xl border border-border dark:border-dark-border">
      <APIProvider apiKey={apiKey}>
        <Map defaultCenter={center} defaultZoom={12} gestureHandling="greedy" disableDefaultUI zoomControl>
          <Marker position={center} title="Your location" />
          {vehicles
            .filter((v) => v.latitude != null && v.longitude != null)
            .map((v) => (
              <Marker
                key={v.id}
                position={{ lat: v.latitude as number, lng: v.longitude as number }}
                onClick={() => setSelected(v)}
              />
            ))}
          {selected && selected.latitude != null && selected.longitude != null && (
            <InfoWindow
              position={{ lat: selected.latitude, lng: selected.longitude }}
              onCloseClick={() => setSelected(null)}
            >
              <div className="w-48 p-1">
                <p className="text-sm font-semibold text-primary">{selected.model}</p>
                <p className="text-xs text-primary-400">₹{selected.pricePerDay} / day</p>
                <a href={`/vehicles/${selected.id}`} className="mt-1 block text-xs font-medium text-secondary">
                  View details
                </a>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}

export function SearchPage() {
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = useState<VehicleSearchParams>({ page: 1, limit: 12 });
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { data: cities } = useCities();
  const { data: categories } = useVehicleCategories();
  const { data: brands } = useVehicleBrands();
  const { data: results, isLoading } = useVehicleSearch(filters);
  const { data: nearbyResults, isLoading: isLoadingNearby } = useNearbyVehicles({
    latitude: userLocation?.lat,
    longitude: userLocation?.lng,
    radiusKm: 15,
    categoryId: filters.categoryId,
    brandId: filters.brandId,
    transmission: filters.transmission,
    maxPrice: filters.maxPrice,
  });
  const { data: wishlist } = useWishlist(isAuthenticated);
  const toggleWishlist = useToggleWishlist();

  const wishlistIds = useMemo(() => new Set((wishlist ?? []).map((w) => w.vehicleId)), [wishlist]);

  const setFilter = (patch: Partial<VehicleSearchParams>) => setFilters((f) => ({ ...f, ...patch, page: 1 }));

  const findNearMe = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Location isn't available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => setLocationError("Couldn't get your location — showing the list view instead."),
    );
  };

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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Tabs
              tabs={[
                { value: "list", label: "List view" },
                { value: "map", label: "Map view" },
              ]}
              value={viewMode}
              onChange={(v) => {
                setViewMode(v as "list" | "map");
                if (v === "map" && !userLocation) findNearMe();
              }}
            />
            {viewMode === "map" && (
              <button
                onClick={findNearMe}
                className="flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline"
              >
                <LocateFixed size={14} /> Use my current location
              </button>
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
        {viewMode === "map" ? (
          !userLocation ? (
            <EmptyState
              icon={<MapPin size={32} />}
              title={locationError ?? "Share your location to see nearby vehicles"}
              description="We use it only to find vehicles close to you — nothing is stored."
            />
          ) : isLoadingNearby ? (
            <div className="flex h-[480px] items-center justify-center">
              <SkeletonCard />
            </div>
          ) : !nearbyResults?.data.length ? (
            <EmptyState icon={<SearchX size={32} />} title="No vehicles nearby" description="Try widening your filters or check back later." />
          ) : (
            <NearbyVehiclesMap center={userLocation} vehicles={nearbyResults.data} />
          )
        ) : isLoading ? (
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
