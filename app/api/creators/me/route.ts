import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { supabase } from "@/lib/supabase";

const secret = new TextEncoder().encode(process.env.CREATORS_JWT_SECRET!);

export async function GET(req: NextRequest) {
  const token = req.cookies.get("creator_token")?.value;
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { payload } = await jwtVerify(token, secret);
    const id = payload.id as string;

    const { data: royalties } = await supabase
      .from("creator_royalties")
      .select("*")
      .eq("creator_id", id)
      .order("month", { ascending: false });

    const { data: tracks } = await supabase
      .from("creator_tracks")
      .select("*")
      .eq("creator_id", id)
      .order("month", { ascending: false });

    return NextResponse.json({
      name: payload.name,
      email: payload.email,
      royalties: royalties || [],
      tracks: tracks || [],
    });
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}