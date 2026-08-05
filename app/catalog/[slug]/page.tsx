import { supabase } from "@/lib/supabase";
import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrackDetail from "@/components/TrackDetail";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: track } = await supabase
    .from("tracks").select("*").eq("slug", slug).single();

  if (!track) return { title: "Track — LoyalFox Records" };

  return {
    title: `${track.name} — ${track.artist} | LoyalFox Records`,
    description: track.description ||
      `${track.name} by ${track.artist}. ${track.genre} · ${track.bpm} BPM · ${track.duration}. LoyalFox Records.`,
    openGraph: {
      title: `${track.name} — ${track.artist}`,
      description: track.description || `${track.genre} · ${track.bpm} BPM · LoyalFox Records`,
      images: track.image_url ? [{ url: track.image_url, width:1200, height:1200 }] : [],
      type: "music.song",
    },
    twitter: {
      card: "summary_large_image",
      title: `${track.name} — ${track.artist}`,
      description: track.description || `${track.genre} · ${track.bpm} BPM · LoyalFox Records`,
      images: track.image_url ? [track.image_url] : [],
    },
  };
}

export default async function TrackPage({ params }: Props) {
  const { slug } = await params;
  return (
    <main>
      <Navbar />
      <TrackDetail slug={slug} />
      <Footer />
    </main>
  );
}