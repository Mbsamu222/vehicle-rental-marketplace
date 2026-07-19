"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useNavigate } from "@vrm/ui";
import { Heart, Users, Fuel, Settings2, ShieldCheck, FileText, MapPin } from "lucide-react";
import {
  useAuth,
  useVehicle,
  useVehicleAvailability,
  useVehicleReviews,
  useWishlist,
  useToggleWishlist,
} from "@vrm/api-client";
import { Badge, Button, Card, DateRangeFields, PageSpinner, StarRating, ImageGallery, Avatar, EmptyState } from "@vrm/ui";
import { Seo } from "@/components/Seo";

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: vehicle, isLoading } = useVehicle(id);
  const { data: reviews } = useVehicleReviews(id);
  const { data: wishlist } = useWishlist(isAuthenticated);
  const toggleWishlist = useToggleWishlist();

  const [pickup, setPickup] = useState("");
  const [returnAt, setReturnAt] = useState("");
  const { data: availability } = useVehicleAvailability(id, pickup || undefined, returnAt || undefined);

  const isWishlisted = useMemo(() => (wishlist ?? []).some((w) => w.vehicleId === id), [wishlist, id]);

  if (isLoading || !vehicle) return <PageSpinner />;

  const nowIso = new Date().toISOString().slice(0, 16);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Seo title={`${vehicle.brand?.name ?? ""} ${vehicle.model}`.trim()} description={`Rent the ${vehicle.model} from a verified RentWheels partner.`} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ImageGallery images={(vehicle.images ?? []).map((i) => i.url)} alt={vehicle.model} />

          <div className="mt-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold">
                {vehicle.brand?.name} {vehicle.model} ({vehicle.year})
              </h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-primary-400">
                <MapPin size={14} /> {vehicle.city?.name}
              </p>
            </div>
            {isAuthenticated && (
              <button
                onClick={() => toggleWishlist.mutate({ vehicleId: vehicle.id, inWishlist: isWishlisted })}
                className="flex size-10 items-center justify-center rounded-full border border-border text-danger dark:border-dark-border"
              >
                <Heart size={18} className={isWishlisted ? "fill-danger" : ""} />
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="info">{vehicle.category?.name}</Badge>
            <Badge tone="neutral" className="flex items-center gap-1">
              <Users size={12} /> {vehicle.seatingCapacity} seats
            </Badge>
            <Badge tone="neutral" className="flex items-center gap-1">
              <Settings2 size={12} /> {vehicle.transmission}
            </Badge>
            <Badge tone="neutral" className="flex items-center gap-1">
              <Fuel size={12} /> {vehicle.fuelType}
            </Badge>
          </div>

          {vehicle.insuranceDetails && (
            <Card className="mt-6 p-5">
              <h3 className="flex items-center gap-2 font-heading font-semibold">
                <ShieldCheck size={16} className="text-secondary" /> Insurance details
              </h3>
              <p className="mt-2 text-sm text-primary-400">{vehicle.insuranceDetails}</p>
            </Card>
          )}

          {vehicle.rentalPolicies && (
            <Card className="mt-4 p-5">
              <h3 className="flex items-center gap-2 font-heading font-semibold">
                <FileText size={16} className="text-secondary" /> Rental policies
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm text-primary-400">{vehicle.rentalPolicies}</p>
            </Card>
          )}

          <Card className="mt-4 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading font-semibold">Reviews ({reviews?.meta.total ?? 0})</h3>
              {Number(vehicle.averageRating) > 0 && (
                <div className="flex items-center gap-1.5">
                  <StarRating value={Number(vehicle.averageRating)} />
                  <span className="text-sm font-semibold">{Number(vehicle.averageRating).toFixed(1)}</span>
                </div>
              )}
            </div>
            {!reviews?.data.length ? (
              <EmptyState title="No reviews yet" description="Be the first to review this vehicle after your trip." />
            ) : (
              <div className="flex flex-col divide-y divide-border dark:divide-dark-border">
                {reviews.data.map((review) => (
                  <div key={review.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                    <Avatar name={`${review.customer?.firstName ?? ""} ${review.customer?.lastName ?? ""}`} size={36} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">
                          {review.customer?.firstName} {review.customer?.lastName}
                        </p>
                        <StarRating value={review.vehicleRating} size={13} />
                      </div>
                      {review.comment && <p className="mt-1 text-sm text-primary-400">{review.comment}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card className="sticky top-24 p-5">
            <div className="flex items-baseline justify-between">
              <p className="font-heading text-2xl font-bold text-secondary">₹{vehicle.pricePerDay}</p>
              <span className="text-sm text-primary-400">/ day</span>
            </div>
            <p className="mt-1 text-xs text-primary-400">₹{vehicle.pricePerHour} / hour · ₹{vehicle.securityDeposit} security deposit</p>

            <div className="mt-5">
              <DateRangeFields pickup={pickup} returnAt={returnAt} onPickupChange={setPickup} onReturnChange={setReturnAt} minDate={nowIso} />
            </div>

            {pickup && returnAt && (
              <p className={`mt-3 text-sm font-medium ${availability?.available === false ? "text-danger" : "text-success"}`}>
                {availability?.available === false ? "Not available for these dates" : "Available for these dates"}
              </p>
            )}

            <Button
              fullWidth
              className="mt-5"
              disabled={!pickup || !returnAt || availability?.available === false}
              onClick={() =>
                navigate(`/book/${vehicle.id}?pickup=${encodeURIComponent(pickup)}&return=${encodeURIComponent(returnAt)}`)
              }
            >
              Book now
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
