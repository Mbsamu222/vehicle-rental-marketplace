"use client";

import { Link } from "@vrm/ui";
import { Plus, Car as CarIcon } from "lucide-react";
import { useMyVehicles, useMyPartnerProfile } from "@vrm/api-client";
import { Badge, Button, Card, EmptyState, SkeletonCard, PageTransition } from "@vrm/ui";

const APPROVAL_TONE: Record<string, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export function MyVehiclesPage() {
  const { data: vehicles, isLoading } = useMyVehicles();
  const { data: partner } = useMyPartnerProfile();
  const isVerified = partner?.verificationStatus === "VERIFIED";

  return (
    <PageTransition>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">My vehicles</h1>
          <p className="text-sm text-primary-400">Manage your fleet listings.</p>
        </div>
        {isVerified ? (
          <Link to="/vehicles/new">
            <Button>
              <Plus size={16} /> Add vehicle
            </Button>
          </Link>
        ) : (
          <Button disabled title="Your business must be verified before you can list vehicles">
            <Plus size={16} /> Add vehicle
          </Button>
        )}
      </div>

      {!isVerified && (
        <Card className="mb-6 border-amber-300/40 bg-amber-50 p-4 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          Your account is <strong>{(partner?.verificationStatus ?? "PENDING").replace(/_/g, " ").toLowerCase()}</strong>. You can't
          list vehicles until an admin verifies your business — check your status on the{" "}
          <Link to="/business-profile" className="font-semibold underline">
            Business profile
          </Link>{" "}
          page.
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !vehicles?.length ? (
        <EmptyState
          icon={<CarIcon size={26} />}
          title="No vehicles yet"
          description="Add your first vehicle once your business is verified."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Link key={vehicle.id} to={`/vehicles/${vehicle.id}`}>
              <Card hoverable className="p-4">
                <div className="mb-3 h-36 overflow-hidden rounded-xl bg-primary-50 dark:bg-white/5">
                  {vehicle.images?.[0] && <img src={vehicle.images[0].url} alt="" className="size-full object-cover" />}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {vehicle.brand?.name} {vehicle.model}
                    </p>
                    <p className="text-xs text-primary-400">
                      {vehicle.registrationNumber} · {vehicle.year}
                    </p>
                  </div>
                  <Badge tone={APPROVAL_TONE[vehicle.approvalStatus]}>{vehicle.approvalStatus}</Badge>
                </div>
                <p className="mt-2 font-heading font-semibold text-secondary">₹{vehicle.pricePerDay}/day</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
