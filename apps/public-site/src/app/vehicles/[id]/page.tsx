import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { PRIMARY_CITY, buildMetadataWithOverrides } from "@/lib/seo";
import { getVehicle, primaryImageUrl, vehicleTitle } from "@/lib/seoFetch";
import { breadcrumbSchema, vehicleSchema } from "@/lib/structuredData";
import { VehicleDetailPage } from "@/screens/vehicles/VehicleDetailPage";

type Props = { params: Promise<{ id: string }> };

/**
 * Vehicle listings are the highest-value indexable pages on the site, so title
 * and description are built from the real record rather than a generic template.
 * If the API is unreachable the page still renders — weak metadata beats a 500.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const vehicle = await getVehicle(id);

  if (!vehicle) {
    return buildMetadataWithOverrides({
      title: "Vehicle",
      path: `/vehicles/${id}`,
      // Don't invite indexing of a listing we couldn't load or that no longer
      // exists — Search Console would flag it as a soft 404.
      noIndex: true,
    });
  }

  const name = vehicleTitle(vehicle);
  const city = vehicle.city?.name ?? PRIMARY_CITY;
  const category = vehicle.category?.name;
  const perDay = Number(vehicle.pricePerDay);

  const specs = [
    category,
    vehicle.transmission ? vehicle.transmission.toLowerCase() : null,
    vehicle.fuelType ? vehicle.fuelType.toLowerCase() : null,
    vehicle.seatingCapacity ? `${vehicle.seatingCapacity} seats` : null,
  ]
    .filter(Boolean)
    .join(", ");

  // An admin-authored title/description on the listing itself wins over the
  // derived one; NULL means "derive from brand, model, city, and price".
  return buildMetadataWithOverrides({
    title: vehicle.seoTitle?.trim() || `Rent ${name} in ${city} — ₹${perDay}/day`,
    description:
      vehicle.seoDescription?.trim() ||
      `Book the ${name} for self-drive rental in ${city} from ₹${perDay} per day` +
        (specs ? ` — ${specs}.` : ".") +
        " Verified local partner, deposit and fees shown upfront, instant confirmation.",
    path: `/vehicles/${vehicle.id}`,
    image: primaryImageUrl(vehicle),
    keywords: [
      `rent ${name}`,
      `${name} on rent ${city}`,
      `self drive ${category ?? "car"} ${city}`,
      `${name} rental price`,
    ],
  });
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const vehicle = await getVehicle(id);
  const path = `/vehicles/${id}`;

  return (
    <>
      {vehicle && (
        <JsonLd
          data={[
            vehicleSchema(vehicle, path),
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Search", path: "/search" },
              { name: vehicleTitle(vehicle), path },
            ]),
          ]}
        />
      )}
      <VehicleDetailPage />
    </>
  );
}
