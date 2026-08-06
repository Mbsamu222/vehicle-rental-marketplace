import { Star } from "lucide-react";
import { cn } from "../utils/cn";

export function StarRating({
  value,
  onChange,
  size = 16,
  readOnly = true,
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={cn(!readOnly && "cursor-pointer transition-transform hover:scale-110")}
        >
          <Star
            size={size}
            className={star <= Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-transparent text-primary-200 dark:text-primary-500"}
          />
        </button>
      ))}
    </div>
  );
}
