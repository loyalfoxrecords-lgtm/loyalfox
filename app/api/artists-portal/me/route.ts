import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { supabase } from "@/lib/supabase";

const secret = new TextEncoder().encode(process.env.ARTISTS_JWT_SECRET!);

export async function GET(req: NextRequest) {
  const token = req.cookies.get("artist_token")?.value;
  if (!token) return NextResponse.json({ error:"No autorizado" }, { status:401 });
  try {
    const { payload } = await jwtVerify(token, secret);
    const artistId   = payload.id as string;
    const artistName = payload.artist_name as string;

    const [{ data: account }, { data: royalties }, { data: tracks }] = await Promise.all([
      supabase.from("artist_accounts")
        .select("id, name, artist_name, avatar_url, full_name, city, url_spotify_artist, url_soundcloud, url_apple_artist")
        .eq("id", artistId)
        .single(),
      supabase.from("artist_royalties")
        .select("*")
        .eq("artist_name", artistName)
        .order("month", { ascending:false }),
      supabase.from("artist_tracks_monthly")
        .select("*")
        .eq("artist_name", artistName)
        .order("streams", { ascending:false }),
    ]);

    return NextResponse.json({
      id:                 account?.id || artistId,
      name:               payload.name,
      artist_name:        artistName,
      avatar_url:         account?.avatar_url || "",
      full_name:          account?.full_name || "",
      city:               account?.city || "",
      url_spotify_artist: account?.url_spotify_artist || "",
      url_soundcloud:     account?.url_soundcloud || "",
      url_apple_artist:   account?.url_apple_artist || "",
      royalties:          royalties || [],
      tracks:             tracks || [],
    });
  } catch {
    return NextResponse.json({ error:"Token inválido" }, { status:401 });
  }
}
