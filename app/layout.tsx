import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/lib/LocaleContext";

export const metadata: Metadata = {
  title: {
    default: "LoyalFox Records — Sello de música electrónica independiente",
    template: "%s | LoyalFox Records",
  },
  description: "Sello independiente de música electrónica. House, deep house, ambient, techno. Fundado en España, 2025. Distribución global y condiciones justas para artistas.",
  keywords: ["música electrónica", "sello independiente", "house", "deep house", "techno", "ambient", "España", "electronic music label", "LoyalFox Records"],
  authors: [{ name:"LoyalFox Records" }],
  creator: "LoyalFox Records",
  metadataBase: new URL("https://www.loyalfoxrecords.com"),
  openGraph: {
    type: "website",
    locale: "es_ES",
    alternateLocale: ["en_US", "de_DE"],
    url: "https://www.loyalfoxrecords.com",
    siteName: "LoyalFox Records",
    title: "LoyalFox Records — Sello de música electrónica independiente",
    description: "Sello independiente de música electrónica. House, deep house, ambient, techno. Fundado en España, 2025.",
    images: [{
      url: "/og-image.jpg",
      width: 1200,
      height: 630,
      alt: "LoyalFox Records",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LoyalFox Records — Electronic Music Label",
    description: "Independent electronic music label. House, deep, ambient, techno. Founded in Spain, 2025.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index:true, follow:true, "max-image-preview":"large" },
  },
  icons: {
    icon: "/favicon.ico",
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
