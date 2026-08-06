import { Check, X } from "lucide-react";
import { BOOKING_STATUS_FLOW, type BookingStatus, type BookingStatusHistoryEntry } from "@vrm/api-client";
import { cn } from "../utils/cn";

const LABELS: Record<BookingStatus, string> = {
  PENDING: "Requested",
  CONFIRMED: "Confirmed",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  VEHICLE_READY: "Vehicle ready",
  PICKED_UP: "Picked up",
  ACTIVE: "Active rental",
  RETURNING: "Returning",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function BookingStatusTimeline({
  status,
  history,
}: {
  status: BookingStatus;
  history?: BookingStatusHistoryEntry[];
}) {
  if (status === "CANCELLED" || status === "REJECTED") {
    const entry = history?.find((h) => h.status === status);
    return (
      <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-danger text-white">
          <X size={16} />
        </div>
        <div>
          <p className="text-sm font-semibold text-danger">{LABELS[status]}</p>
          {entry?.note && <p className="text-xs text-primary-400">{entry.note}</p>}
        </div>
      </div>
    );
  }

  const currentIndex = BOOKING_STATUS_FLOW.indexOf(status);

  return (
    <div className="flex flex-col gap-0">
      {BOOKING_STATUS_FLOW.map((step, idx) => {
        const done = idx < currentIndex;
        const current = idx === currentIndex;
        const entry = history?.find((h) => h.status === step);
        const isLast = idx === BOOKING_STATUS_FLOW.length - 1;

        return (
          <div key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  done && "bg-success text-white",
                  current && "bg-secondary text-white ring-4 ring-secondary/20",
                  !done && !current && "bg-primary-100 text-primary-400 dark:bg-white/10",
                )}
              >
                {done ? <Check size={15} /> : idx + 1}
              </div>
              {!isLast && <div className={cn("w-0.5 flex-1 min-h-[28px]", done ? "bg-success" : "bg-primary-100 dark:bg-white/10")} />}
            </div>
            <div className={cn("pb-7", isLast && "pb-0")}>
              <p className={cn("text-sm font-semibold", current ? "text-secondary" : done ? "text-primary dark:text-white" : "text-primary-400")}>
                {LABELS[step]}
              </p>
              {entry && <p className="text-xs text-primary-400">{new Date(entry.createdAt).toLocaleString()}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
