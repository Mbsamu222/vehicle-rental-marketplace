import { Input } from "./Input";

export function DateRangeFields({
  pickup,
  returnAt,
  onPickupChange,
  onReturnChange,
  minDate,
}: {
  pickup: string;
  returnAt: string;
  onPickupChange: (value: string) => void;
  onReturnChange: (value: string) => void;
  minDate?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Input
        type="datetime-local"
        label="Pickup date & time"
        value={pickup}
        min={minDate}
        onChange={(e) => onPickupChange(e.target.value)}
      />
      <Input
        type="datetime-local"
        label="Return date & time"
        value={returnAt}
        min={pickup || minDate}
        onChange={(e) => onReturnChange(e.target.value)}
      />
    </div>
  );
}
