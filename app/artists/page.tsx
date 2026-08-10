import type { Metadata } from "next";
import ArtistsPage from "@/components/ArtistsPage";

export const metadata: Metadata = {
  title: "Artistas",
  description: "Conoce a los artistas de LoyalFox Records. Productores de house, deep house, techno y música electrónica de vanguardia.",
  openGraph: {
    title: "Artistas | LoyalFox Records",
    description: "El roster de LoyalFox Records. Artistas de música electrónica.",
    url: "https://www.loyalfoxrecords.com/artists",
  },
};

export default function Page() {
  return <ArtistsPage />;
}
