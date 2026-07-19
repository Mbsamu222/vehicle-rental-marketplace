"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Link, useNavigate } from "@vrm/ui";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2, Pencil, ShieldCheck, CalendarOff } from "lucide-react";
import { useVehicle, useDeleteVehicle, useAddVehicleImages, vehiclesApi } from "@vrm/api-client";
import { Badge, Button, Card, FileUpload, Input, PageSpinner, PageTransition, Textarea, useToast } from "@vrm/ui";

const APPROVAL_TONE: Record<string, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const { data: vehicle, isLoading } = useVehicle(id);
  const deleteVehicle = useDeleteVehicle();
  const addImages = useAddVehicleImages();

  const [newImages, setNewImages] = useState<string[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [isBlocking, setIsBlocking] = useState(false);

  if (isLoading || !vehicle) return <PageSpinner />;

  const onAddImages = async () => {
    if (!id || !newImages.length) return;
    try {
      await addImages.mutateAsync({ id, images: newImages.map((url) => ({ url })) });
      toast.success("Images added");
      setNewImages([]);
    } catch (err) {
      toast.error("Could not add images", err instanceof Error ? err.message : undefined);
    }
  };

  const onDeleteImage = async (imageId: string) => {
    if (!id) return;
    setDeletingImageId(imageId);
    try {
      await vehiclesApi.deleteImage(id, imageId);
      await qc.invalidateQueries({ queryKey: ["vehicles", id] });
      toast.success("Image removed");
    } catch (err) {
      toast.error("Could not remove image", err instanceof Error ? err.message : undefined);
    } finally {
      setDeletingImageId(null);
    }
  };

  const onDeleteVehicle = async () => {
    if (!id) return;
    if (!confirm("Deactivate this vehicle? It will no longer be bookable.")) return;
    try {
      await deleteVehicle.mutateAsync(id);
      toast.success("Vehicle deactivated");
      navigate("/vehicles");
    } catch (err) {
      toast.error("Could not deactivate vehicle", err instanceof Error ? err.message : undefined);
    }
  };

  const onBlockAvailability = async () => {
    if (!id || !blockStart || !blockEnd) return;
    setIsBlocking(true);
    try {
      await vehiclesApi.blockAvailability(id, {
        startDate: new Date(blockStart).toISOString(),
        endDate: new Date(blockEnd).toISOString(),
        reason: blockReason || undefined,
      });
      toast.success("Dates blocked for maintenance");
      setBlockStart("");
      setBlockEnd("");
      setBlockReason("");
    } catch (err) {
      toast.error("Could not block dates", err instanceof Error ? err.message : undefined);
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <PageTransition>
      <button
        onClick={() => navigate("/vehicles")}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-primary-400 hover:text-primary"
      >
        <ArrowLeft size={15} /> Back to vehicles
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold">
              {vehicle.brand?.name} {vehicle.model} ({vehicle.year})
            </h1>
            <Badge tone={APPROVAL_TONE[vehicle.approvalStatus]}>{vehicle.approvalStatus}</Badge>
          </div>
          <p className="mt-1 text-sm text-primary-400">
            {vehicle.registrationNumber} · {vehicle.city?.name}
          </p>
          {vehicle.rejectionReason && vehicle.approvalStatus === "REJECTED" && (
            <p className="mt-1 text-sm text-danger">Rejection reason: {vehicle.rejectionReason}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link to={`/vehicles/${vehicle.id}/edit`}>
            <Button variant="outline">
              <Pencil size={15} /> Edit
            </Button>
          </Link>
          <Button variant="danger" onClick={onDeleteVehicle} isLoading={deleteVehicle.isPending}>
            <Trash2 size={15} /> Deactivate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Card className="p-5">
            <h3 className="mb-4 font-heading font-semibold">Images</h3>
            {vehicle.images?.length ? (
              <div className="mb-4 flex flex-wrap gap-3">
                {vehicle.images.map((img) => (
                  <div
                    key={img.id}
                    className="group relative size-24 overflow-hidden rounded-lg border border-border dark:border-dark-border"
                  >
                    <img src={img.url} alt="" className="size-full object-cover" />
                    {img.isPrimary && (
                      <Badge tone="info" className="absolute left-1 top-1">
                        Primary
                      </Badge>
                    )}
                    <button
                      onClick={() => onDeleteImage(img.id)}
                      disabled={deletingImageId === img.id}
                      className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-4 text-sm text-primary-400">No images uploaded yet.</p>
            )}
            <FileUpload label="Add images" value={newImages} onChange={setNewImages} multiple />
            {newImages.length > 0 && (
              <Button size="sm" className="mt-3" onClick={onAddImages} isLoading={addImages.isPending}>
                Save images
              </Button>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-heading font-semibold">
              <ShieldCheck size={16} className="text-secondary" /> Insurance & policies
            </h3>
            <p className="text-sm text-primary-400">{vehicle.insuranceDetails || "No insurance details added."}</p>
            {vehicle.rentalPolicies && (
              <p className="mt-3 whitespace-pre-line text-sm text-primary-400">{vehicle.rentalPolicies}</p>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-heading font-semibold">
              <CalendarOff size={16} className="text-secondary" /> Block dates for maintenance
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input type="date" label="Start date" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} />
              <Input type="date" label="End date" value={blockEnd} min={blockStart} onChange={(e) => setBlockEnd(e.target.value)} />
            </div>
            <Textarea
              label="Reason (optional)"
              className="mt-3"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            />
            <Button className="mt-3" onClick={onBlockAvailability} isLoading={isBlocking} disabled={!blockStart || !blockEnd}>
              Block dates
            </Button>
          </Card>
        </div>

        <Card className="h-fit p-5">
          <h3 className="mb-4 font-heading font-semibold">Pricing</h3>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-primary-400">Per hour</span>
              <span>₹{vehicle.pricePerHour}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-400">Per day</span>
              <span>₹{vehicle.pricePerDay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-400">Security deposit</span>
              <span>₹{vehicle.securityDeposit}</span>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-primary-400">Seats</span>
              <span>{vehicle.seatingCapacity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-400">Transmission</span>
              <span>{vehicle.transmission}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-400">Fuel</span>
              <span>{vehicle.fuelType}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm dark:border-dark-border">
            <span className="text-primary-400">Rating</span>
            <span className="font-semibold">
              {Number(vehicle.averageRating).toFixed(1)} ({vehicle.totalReviews})
            </span>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
