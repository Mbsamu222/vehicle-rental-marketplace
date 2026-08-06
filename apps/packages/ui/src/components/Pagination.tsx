import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <div className="flex items-center justify-center gap-1.5">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeft size={16} />
      </Button>
      {pages.map((p, idx) => (
        <span key={p} className="flex items-center gap-1.5">
          {idx > 0 && pages[idx - 1] !== p - 1 && <span className="px-1 text-primary-300">…</span>}
          <button
            onClick={() => onChange(p)}
            className={
              p === page
                ? "flex size-9 items-center justify-center rounded-lg bg-secondary text-sm font-semibold text-white"
                : "flex size-9 items-center justify-center rounded-lg text-sm font-medium text-primary hover:bg-primary-50 dark:text-white dark:hover:bg-white/10"
            }
          >
            {p}
          </button>
        </span>
      ))}
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page">
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}
