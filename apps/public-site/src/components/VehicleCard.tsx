"use client";

import { Link } from "@vrm/ui";
import { Heart, Users, Fuel, Settings2, Star, ImageOff, MapPin, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useMonetizationStatus } from "@vrm/api-client";
import type { Vehicle } from "@vrm/api-client";
import { Card, cn } from "@vrm/ui";

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
  // react-query caches/dedupes this across every card on the page — cheap.
  const { data: monetizationStatus } = useMonetizationStatus();
  const showFeaturedBadge = vehicle.isFeatured && monetizationStatus?.BOOSTED_LISTINGS;

  return (
    <Card hoverable className="group flex flex-col justify-between overflow-hidden rounded-2xl border-border/80 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card dark:border-white/10">
      <div>
        <Link to={`/vehicles/${vehicle.id}`} className="block relative">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-primary-100/50 dark:bg-white/5">
            {primaryImage ? (
              <img
                src={primaryImage.url}
                alt={vehicle.model}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-1.5 text-primary-300">
                <ImageOff size={30} />
                <span className="text-xs">No image preview</span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 opacity-80" />

            {/* Category Tag */}
            <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
              <div className="flex items-center gap-1 rounded-full bg-surface/90 px-3 py-1 text-xs font-bold text-primary shadow-soft backdrop-blur-md dark:bg-dark-surface/90 dark:text-white">
                <ShieldCheck size={13} className="text-secondary dark:text-accent-300" />
                {vehicle.category?.name || "Vehicle"}
              </div>
              {showFeaturedBadge && (
                <div className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-white shadow-soft">
                  <Sparkles size={13} />
                  Featured
                </div>
              )}
            </div>

            {/* Wishlist Button */}
            {onToggleWishlist && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onToggleWishlist();
                }}
                aria-label="Save to wishlist"
                className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-full bg-surface/90 text-primary-500 shadow-soft backdrop-blur-md transition-transform hover:scale-110 active:scale-95 dark:bg-dark-surface/90 dark:text-white"
              >
                <Heart size={15} className={cn("transition-colors", isWishlisted ? "fill-danger text-danger" : "hover:text-danger")} />
              </button>
            )}

            {/* Rating Pill inside Image */}
            {Number(vehicle.averageRating) > 0 && (
              <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur-md">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                <span>{Number(vehicle.averageRating).toFixed(1)}</span>
              </div>
            )}
          </div>
        </Link>

        <div className="p-4 sm:p-5">
          <Link to={`/vehicles/${vehicle.id}`}>
            <div>
              <h3 className="font-heading text-base font-bold tracking-tight text-primary transition-colors group-hover:text-secondary dark:text-white dark:group-hover:text-accent-300">
                {vehicle.brand?.name} {vehicle.model}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-primary-400">
                <MapPin size={12} className="shrink-0 text-secondary" />
                {vehicle.city?.name || "Chennai"} • {vehicle.year}
              </p>
            </div>
          </Link>

          {/* Vehicle Specs Pills */}
          <div className="mt-3.5 grid grid-cols-3 gap-1.5 border-y border-border/60 py-2.5 text-center text-xs font-semibold text-primary-600 dark:border-white/10 dark:text-primary-300">
            <div className="flex items-center justify-center gap-1 rounded-lg bg-primary-50/70 py-1.5 dark:bg-white/5">
              <Users size={13} className="text-secondary dark:text-accent-300" />
              <span>{vehicle.seatingCapacity} Seats</span>
            </div>
            <div className="flex items-center justify-center gap-1 rounded-lg bg-primary-50/70 py-1.5 capitalize dark:bg-white/5">
              <Settings2 size={13} className="text-secondary dark:text-accent-300" />
              <span>{vehicle.transmission}</span>
            </div>
            <div className="flex items-center justify-center gap-1 rounded-lg bg-primary-50/70 py-1.5 capitalize dark:bg-white/5">
              <Fuel size={13} className="text-secondary dark:text-accent-300" />
              <span>{vehicle.fuelType}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing & CTA */}
      <div className="flex items-center justify-between border-t border-border/40 px-4 sm:px-5 py-3.5 dark:border-white/10">
        <div className="flex items-baseline gap-1">
          <span className="font-heading text-lg font-extrabold text-secondary dark:text-accent-300">₹{vehicle.pricePerDay}</span>
          <span className="text-xs font-semibold text-primary-400">/ day</span>
        </div>
        <Link
          to={`/vehicles/${vehicle.id}`}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-soft transition-all hover:bg-primary-800 hover:shadow-card dark:bg-white dark:text-primary dark:hover:bg-primary-50"
        >
          Book Now <ArrowRight size={13} />
        </Link>
      </div>
    </Card>
  );
}
