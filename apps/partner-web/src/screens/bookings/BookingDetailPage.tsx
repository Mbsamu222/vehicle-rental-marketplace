"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Mail, Phone, MapPin } from "lucide-react";
import { useBooking, useUpdateBookingStatus } from "@vrm/api-client";
import type { BookingStatus } from "@vrm/api-client";
import { Badge, Button, Card, PageSpinner, PageTransition, BookingStatusTimeline, Modal, Textarea, useToast } from "@vrm/ui";

// Mirrors ALLOWED_TRANSITIONS in backend/src/modules/bookings/bookings.service.ts, restricted to
// the transitions the `RENTAL_PARTNER` role is permitted to drive via PATCH /bookings/:id/status.
// PENDING -> CONFIRMED/CANCELLED happens on the customer side (payment/cancel), not here.
const PARTNER_TRANSITIONS: Partial<
  Record<BookingStatus, { status: BookingStatus; label: string; danger?: boolean }[]>
> = {
  CONFIRMED: [
    { status: "APPROVED", label: "Approve booking" },
    { status: "REJECTED", label: "Reject booking", danger: true },
  ],
  APPROVED: [{ status: "VEHICLE_READY", label: "Mark vehicle ready" }],
  VEHICLE_READY: [{ status: "PICKED_UP", label: "Mark picked up" }],
  PICKED_UP: [{ status: "ACTIVE", label: "Start rental" }],
  ACTIVE: [{ status: "RETURNING", label: "Mark returning" }],
  RETURNING: [{ status: "COMPLETED", label: "Mark completed" }],
};

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading } = useBooking(id);
  const updateStatus = useUpdateBookingStatus();
  const toast = useToast();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [pendingTransition, setPendingTransition] = useState<BookingStatus | null>(null);

  if (isLoading || !booking) return <PageSpinner />;

  const transitions = PARTNER_TRANSITIONS[booking.status] ?? [];

  const runTransition = async (status: BookingStatus, note?: string) => {
    setPendingTransition(status);
    try {
      await updateStatus.mutateAsync({ id: booking.id, status, note });
      toast.success("Booking updated", `Status changed to ${status.replace(/_/g, " ").toLowerCase()}.`);
    } catch (err) {
      toast.error("Could not update booking", err instanceof Error ? err.message : undefined);
    } finally {
      setPendingTransition(null);
    }
  };

  const onTransitionClick = (status: BookingStatus) => {
    if (status === "REJECTED") {
      setRejectOpen(true);
      return;
    }
    runTransition(status);
  };

  const onConfirmReject = async () => {
    await runTransition("REJECTED", rejectNote || undefined);
    setRejectOpen(false);
    setRejectNote("");
  };

  return (
    <PageTransition>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">{booking.bookingNumber}</h1>
          <p className="text-sm text-primary-400">
            {booking.vehicle?.brand?.name} {booking.vehicle?.model}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {transitions.map((t) => (
            <Button
              key={t.status}
              variant={t.danger ? "danger" : "primary"}
              onClick={() => onTransitionClick(t.status)}
              isLoading={updateStatus.isPending && pendingTransition === t.status}
            >
              {t.label}
            </Button>
          ))}
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

          {booking.customer && (
            <Card className="p-5">
              <h3 className="mb-3 font-heading font-semibold">Customer</h3>
              <p className="font-medium">
                {booking.customer.firstName} {booking.customer.lastName}
              </p>
              <div className="mt-2 flex flex-col gap-1 text-sm text-primary-400">
                <span className="flex items-center gap-2">
                  <Mail size={14} /> {booking.customer.email}
                </span>
                {booking.customer.phone && (
                  <span className="flex items-center gap-2">
                    <Phone size={14} /> {booking.customer.phone}
                  </span>
                )}
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
            <div className="flex justify-between">
              <span className="text-primary-400">Security deposit</span>
              <span>₹{booking.securityDeposit}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-border pt-3 font-heading text-base font-bold dark:border-dark-border">
              <span>Total</span>
              <span>₹{booking.totalAmount}</span>
            </div>
          </div>
          {booking.payments?.[0] && (
            <Badge tone={booking.payments[0].status === "PAID" ? "success" : "warning"} className="mt-4">
              Payment {booking.payments[0].status}
            </Badge>
          )}
        </Card>
      </div>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject booking">
        <div className="flex flex-col gap-4">
          <Textarea
            label="Reason (optional)"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Let the customer know why you're rejecting this booking…"
          />
          <Button variant="danger" fullWidth onClick={onConfirmReject} isLoading={updateStatus.isPending}>
            Confirm rejection
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
}
