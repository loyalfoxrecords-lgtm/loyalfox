import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SmartLink from "@/components/SmartLink";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const { data: track } = await supabase
    .from("tracks")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!track) return { title: "Track no encontrado" };

  return {
    title: `${track.name} - ${track.artist}`,
    description: `Escucha "${track.name}" de ${track.artist} en todas las plataformas.`,
    openGraph: {
      title: `${track.name} - ${track.artist}`,
      description: `Disponible en Spotify, Apple Music, Beatport y mas.`,
      images: track.image_url ? [{ url: track.image_url, width: 800, height: 800 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${track.name} - ${track.artist}`,
      images: track.image_url ? [track.image_url] : [],
    },
  };
}

export default async function SmartLinkPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { data: track } = await supabase
    .from("tracks")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!track) notFound();

  return <SmartLink track={track} />;
}
