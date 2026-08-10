import type { Metadata } from "next";
import CatalogPage from "@/components/CatalogPage";

export const metadata: Metadata = {
  title: "Catálogo completo",
  description: "Explora el catálogo completo de LoyalFox Records. House, deep house, techno, ambient y más géneros de música electrónica.",
  openGraph: {
    title: "Catálogo | LoyalFox Records",
    description: "Toda la música del sello. House, deep house, techno, ambient.",
    url: "https://www.loyalfoxrecords.com/catalog",
  },
};

export default function Page() {
  return <CatalogPage />;
}
