import { Bike, Zap, Car, Crown, Shield, Gauge } from "lucide-react";

export function getCategoryIcon(name: string, iconUrl?: string | null) {
  if (iconUrl) {
    return <img src={iconUrl} alt={name} className="size-7 object-contain" />;
  }
  const lower = name.toLowerCase();
  if (lower.includes("bike") || lower.includes("scooter") || lower.includes("motorcycle")) {
    return <Bike size={26} />;
  }
  if (lower.includes("electric") || lower.includes("ev")) {
    return <Zap size={26} />;
  }
  if (lower.includes("luxury") || lower.includes("premium")) {
    return <Crown size={26} />;
  }
  if (lower.includes("suv") || lower.includes("crossover") || lower.includes("4x4")) {
    return <Shield size={26} />;
  }
  if (lower.includes("sedan") || lower.includes("saloon")) {
    return <Gauge size={26} />;
  }
  if (lower.includes("hatchback") || lower.includes("compact")) {
    return <Car size={26} />;
  }
  return <Car size={26} />;
}

export function getCategoryColorStyle(_name?: string) {
  return "bg-secondary-50 text-secondary dark:bg-secondary-500/15 dark:text-accent-300";
}
