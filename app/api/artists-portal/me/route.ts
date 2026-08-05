import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { supabase } from "@/lib/supabase";

const secret = new TextEncoder().encode(process.env.ARTISTS_JWT_SECRET!);

export async function GET(req: NextRequest) {
  const token = req.cookies.get("artist_token")?.value;
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { payload } = await jwtVerify(token, secret);
    const artistName = payload.artist_name as string;

    const { data: royalties } = await supabase
      .from("artist_royalties")
      .select("*")
      .eq("artist_name", artistName)
      .order("month", { ascending: false });

    const { data: tracks } = await supabase
      .from("artist_tracks_monthly")
      .select("*")
      .eq("artist_name", artistName)
      .order("streams", { ascending: false });

    return NextResponse.json({
      name: payload.name,
      artist_name: artistName,
      royalties: royalties || [],
      tracks: tracks || [],
    });
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}