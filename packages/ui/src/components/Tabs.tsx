import { cn } from "../utils/cn";

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1 overflow-x-auto border-b border-border dark:border-dark-border", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "relative flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors",
            value === tab.value ? "text-secondary" : "text-primary-400 hover:text-primary",
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-xs dark:bg-white/10">{tab.count}</span>
          )}
          {value === tab.value && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-secondary" />}
        </button>
      ))}
    </div>
  );
}
