"use client";

import { HeartOff } from "lucide-react";
import { useWishlist, useToggleWishlist } from "@vrm/api-client";
import { EmptyState, SkeletonCard } from "@vrm/ui";
import { VehicleCard } from "@/components/VehicleCard";

export function WishlistPage() {
  const { data: wishlist, isLoading } = useWishlist();
  const toggleWishlist = useToggleWishlist();

  return (
    <>
      <h1 className="mb-1 font-heading text-2xl font-bold">Wishlist</h1>
      <p className="mb-6 text-sm text-primary-400">Vehicles you've saved for later.</p>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !wishlist?.length ? (
        <EmptyState icon={<HeartOff size={26} />} title="Your wishlist is empty" description="Tap the heart icon on any vehicle to save it here." />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {wishlist.map((item) => (
            <VehicleCard
              key={item.vehicleId}
              vehicle={item.vehicle}
              isWishlisted
              onToggleWishlist={() => toggleWishlist.mutate({ vehicleId: item.vehicleId, inWishlist: true })}
            />
          ))}
        </div>
      )}
    </>
  );
}
