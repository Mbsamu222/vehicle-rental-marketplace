"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { MapPin, Phone, Mail } from "lucide-react";
import { useBooking, useCancelBooking, useCancellationPreview, useCreateReview } from "@vrm/api-client";
import { Badge, Button, Card, PageSpinner, BookingStatusTimeline, StarRating, Textarea, Modal, useToast } from "@vrm/ui";

const CANCELLABLE = ["PENDING", "CONFIRMED", "APPROVED", "VEHICLE_READY"];

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading } = useBooking(id);
  const cancelBooking = useCancelBooking();
  const createReview = useCreateReview();
  const toast = useToast();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [vehicleRating, setVehicleRating] = useState(5);
  const [partnerRating, setPartnerRating] = useState(5);
  const { register, handleSubmit, reset } = useForm<{ comment: string }>();
  const { data: cancellationPreview, isLoading: previewLoading } = useCancellationPreview(cancelModalOpen ? id : undefined);

  if (isLoading || !booking) return <PageSpinner />;

  const onCancel = async () => {
    try {
      await cancelBooking.mutateAsync({ id: booking.id });
      toast.success("Booking cancelled");
      setCancelModalOpen(false);
    } catch (err) {
      toast.error("Could not cancel", err instanceof Error ? err.message : undefined);
    }
  };

  const onSubmitReview = async (values: { comment: string }) => {
    try {
      await createReview.mutateAsync({
        bookingId: booking.id,
        vehicleRating,
        partnerRating,
        comment: values.comment || undefined,
      });
      toast.success("Thanks for your review!");
      setReviewOpen(false);
      reset();
    } catch (err) {
      toast.error("Could not submit review", err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">{booking.bookingNumber}</h1>
          <p className="text-sm text-primary-400">
            {booking.vehicle?.brand?.name} {booking.vehicle?.model}
          </p>
        </div>
        <div className="flex gap-2">
          {CANCELLABLE.includes(booking.status) && (
            <Button variant="outline" onClick={() => setCancelModalOpen(true)}>
              Cancel booking
            </Button>
          )}
          {booking.status === "COMPLETED" && !booking.review && (
            <Button onClick={() => setReviewOpen(true)}>Leave a review</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Card className="p-5">
            <h3 className="mb-4 font-heading font-semibold">Rental status</h3>
            <BookingStatusTimeline status={booking.status} history={booking.statusHistory} />
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-heading font-semibold">
              <MapPin size={16} className="text-secondary" /> Trip details
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-primary-400">Pickup</p>
                <p className="font-medium">{booking.pickupLocation}</p>
                <p className="text-primary-400">{new Date(booking.pickupDatetime).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-primary-400">Return</p>
                <p className="font-medium">{booking.returnLocation}</p>
                <p className="text-primary-400">{new Date(booking.returnDatetime).toLocaleString()}</p>
              </div>
            </div>
          </Card>

          {booking.rentalPartner && (
            <Card className="p-5">
              <h3 className="mb-3 font-heading font-semibold">Rental partner</h3>
              <p className="font-medium">{booking.rentalPartner.businessName}</p>
              <div className="mt-2 flex flex-col gap-1 text-sm text-primary-400">
                <span className="flex items-center gap-2">
                  <Mail size={14} /> {booking.rentalPartner.businessEmail}
                </span>
                <span className="flex items-center gap-2">
                  <Phone size={14} /> {booking.rentalPartner.businessPhone}
                </span>
              </div>
            </Card>
          )}
        </div>

        <Card className="h-fit p-5">
          <h3 className="mb-4 font-heading font-semibold">Payment summary</h3>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-primary-400">Base price</span>
              <span>₹{booking.basePrice}</span>
            </div>
            {Number(booking.discountAmount) > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-₹{booking.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-primary-400">Tax</span>
              <span>₹{booking.taxAmount}</span>
            </div>
            {Number(booking.serviceFeeAmount) > 0 && (
              <div className="flex justify-between">
                <span className="text-primary-400">Service fee</span>
                <span>₹{booking.serviceFeeAmount}</span>
              </div>
            )}
            {Number(booking.extraDriverFeeAmount) > 0 && (
              <div className="flex justify-between">
                <span className="text-primary-400">Extra driver fee ({booking.extraDriverCount})</span>
                <span>₹{booking.extraDriverFeeAmount}</span>
              </div>
            )}
            {Number(booking.youngDriverFeeAmount) > 0 && (
              <div className="flex justify-between">
                <span className="text-primary-400">Young driver fee</span>
                <span>₹{booking.youngDriverFeeAmount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-primary-400">Security deposit</span>
              <span>₹{booking.securityDeposit}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-border pt-3 font-heading text-base font-bold dark:border-dark-border">
              <span>Total</span>
              <span>₹{booking.totalAmount}</span>
            </div>
            {Number(booking.cancellationFeeAmount) > 0 && (
              <div className="mt-2 flex justify-between border-t border-border pt-3 text-danger dark:border-dark-border">
                <span>Cancellation fee (deducted from refund)</span>
                <span>₹{booking.cancellationFeeAmount}</span>
              </div>
            )}
            {Number(booking.lateReturnFeeAmount) > 0 && (
              <div className="mt-2 flex justify-between border-t border-border pt-3 text-danger dark:border-dark-border">
                <span>Late-return fee (outstanding, follow-up required)</span>
                <span>₹{booking.lateReturnFeeAmount}</span>
              </div>
            )}
          </div>
          {booking.payments?.[0] && (
            <Badge tone={booking.payments[0].status === "PAID" ? "success" : "warning"} className="mt-4">
              Payment {booking.payments[0].status}
            </Badge>
          )}
        </Card>
      </div>

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Rate your experience">
        <form onSubmit={handleSubmit(onSubmitReview)} className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-sm font-medium">Vehicle rating</p>
            <StarRating value={vehicleRating} onChange={setVehicleRating} readOnly={false} size={22} />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Rental partner rating</p>
            <StarRating value={partnerRating} onChange={setPartnerRating} readOnly={false} size={22} />
          </div>
          <Textarea label="Comment (optional)" {...register("comment")} />
          <Button type="submit" isLoading={createReview.isPending} fullWidth>
            Submit review
          </Button>
        </form>
      </Modal>

      <Modal open={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Cancel this booking?">
        <div className="flex flex-col gap-4">
          {previewLoading ? (
            <p className="text-sm text-primary-400">Checking cancellation policy…</p>
          ) : cancellationPreview ? (
            <div className="flex flex-col gap-2 rounded-xl border border-border p-4 text-sm dark:border-dark-border">
              {cancellationPreview.feeAmount > 0 && (
                <div className="flex justify-between text-danger">
                  <span>Cancellation fee</span>
                  <span>₹{cancellationPreview.feeAmount}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span>You'll be refunded</span>
                <span>₹{cancellationPreview.refundAmount}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-primary-400">This booking hasn't been paid for yet, so there's nothing to refund.</p>
          )}
          <Button variant="danger" onClick={onCancel} isLoading={cancelBooking.isPending} fullWidth>
            Confirm cancellation
          </Button>
        </div>
      </Modal>
    </>
  );
}
