import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.loyalfoxrecords.com";

  const staticPages: MetadataRoute.Sitemap = [
    { url: base,                lastModified: new Date(), changeFrequency:"weekly",  priority: 1.0 },
    { url: `${base}/catalog`,   lastModified: new Date(), changeFrequency:"weekly",  priority: 0.9 },
    { url: `${base}/artists`,   lastModified: new Date(), changeFrequency:"monthly", priority: 0.8 },
    { url: `${base}/send-demo`, lastModified: new Date(), changeFrequency:"monthly", priority: 0.8 },
  ];

  const [{ data: tracks }, { data: artists }] = await Promise.all([
    supabase.from("tracks").select("slug, created_at").not("slug","is",null),
    supabase.from("artists").select("slug, created_at").not("slug","is",null),
  ]);

  const trackPages: MetadataRoute.Sitemap = (tracks || []).map(t => ({
    url: `${base}/catalog/${t.slug}`,
    lastModified: new Date(t.created_at),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const artistPages: MetadataRoute.Sitemap = (artists || []).map(a => ({
    url: `${base}/artists/${a.slug}`,
    lastModified: new Date(a.created_at),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...trackPages, ...artistPages];
}
