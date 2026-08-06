import { buildMetadataWithOverrides } from "@/lib/seo";

export const generateMetadata = () =>
  buildMetadataWithOverrides({
  title: "Vehicle Categories — Cars, Bikes & SUVs",
  description:
    "Browse every self-drive category on RentWheels: hatchbacks, sedans, SUVs, bikes, scooters, and electric vehicles available to rent across Chennai.",
  path: "/categories",
  keywords: ["car categories", "types of rental vehicles", "suv rental chennai", "scooter rental chennai"],
});

export { CategoriesPage as default } from "@/screens/categories/CategoriesPage";
