import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/lib/LocaleContext";

export const metadata: Metadata = {
  title: "LoyalFox Records — Electronic Music Label",
  description: "Sello de música electrónica independiente. House, deep, ambient, techno. Fundado en España, 2025.",
  keywords: ["música electrónica", "sello independiente", "house", "deep house", "techno", "ambient", "España"],
  openGraph: {
    title: "LoyalFox Records",
    description: "Sello de música electrónica independiente",
    type: "website",
    locale: "es_ES",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body suppressHydrationWarning>
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}