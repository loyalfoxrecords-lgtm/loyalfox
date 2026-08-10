import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SmartLink from "@/components/SmartLink";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: track } = await supabase
    .from("tracks")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!track) return { title: "Track no encontrado" };

  return {
    title: `${track.name} — ${track.artist}`,
    description: `Escucha "${track.name}" de ${track.artist} en todas las plataformas. Disponible en Spotify, Apple Music, Beatport y más.`,
    openGraph: {
      title: `${track.name} — ${track.artist}`,
      description: `Disponible en todas las plataformas`,
      images: track.image_url ? [{ url: track.image_url, width:800, height:800 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${track.name} — ${track.artist}`,
      images: track.image_url ? [track.image_url] : [],
    },
  };
}

export default async function SmartLinkPage({ params }: { params: { slug: string } }) {
  const { data: track } = await supabase
    .from("tracks")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!track) notFound();

  return <SmartLink track={track} />;
}
