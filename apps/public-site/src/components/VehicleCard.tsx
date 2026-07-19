"use client";

import { Link } from "@vrm/ui";
import { Heart, Users, Fuel, Settings2, Star, ImageOff } from "lucide-react";
import type { Vehicle } from "@vrm/api-client";
import { Badge, Card, cn } from "@vrm/ui";

export function VehicleCard({
  vehicle,
  isWishlisted,
  onToggleWishlist,
}: {
  vehicle: Vehicle;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
}) {
  const primaryImage = vehicle.images?.find((i) => i.isPrimary) ?? vehicle.images?.[0];

  return (
    <Card hoverable className="overflow-hidden">
      <Link to={`/vehicles/${vehicle.id}`}>
        <div className="relative aspect-[4/3] w-full bg-primary-50 dark:bg-white/5">
          {primaryImage ? (
            <img src={primaryImage.url} alt={vehicle.model} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-primary-300">
              <ImageOff size={28} />
            </div>
          )}
          {onToggleWishlist && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleWishlist();
              }}
              className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-danger shadow-soft"
            >
              <Heart size={16} className={cn(isWishlisted && "fill-danger")} />
            </button>
          )}
          <Badge tone="neutral" className="absolute left-3 top-3 bg-white/90">
            {vehicle.category?.name}
          </Badge>
        </div>
      </Link>
      <div className="p-4">
        <Link to={`/vehicles/${vehicle.id}`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-heading text-base font-semibold">
                {vehicle.brand?.name} {vehicle.model}
              </p>
              <p className="text-xs text-primary-400">
                {vehicle.city?.name} • {vehicle.year}
              </p>
            </div>
            {Number(vehicle.averageRating) > 0 && (
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                <Star size={13} className="fill-amber-400 text-amber-400" />
                {Number(vehicle.averageRating).toFixed(1)}
              </div>
            )}
          </div>
        </Link>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-primary-400">
          <span className="flex items-center gap-1">
            <Users size={13} /> {vehicle.seatingCapacity} seats
          </span>
          <span className="flex items-center gap-1">
            <Settings2 size={13} /> {vehicle.transmission}
          </span>
          <span className="flex items-center gap-1">
            <Fuel size={13} /> {vehicle.fuelType}
          </span>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="font-heading text-lg font-bold text-secondary">₹{vehicle.pricePerDay}</p>
            <p className="text-xs text-primary-400">per day</p>
          </div>
          <Link to={`/vehicles/${vehicle.id}`} className="text-sm font-semibold text-link hover:underline">
            View details
          </Link>
        </div>
      </div>
    </Card>
  );
}
