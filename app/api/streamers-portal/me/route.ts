import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { supabase } from "@/lib/supabase";

const secret = new TextEncoder().encode(process.env.STREAMERS_JWT_SECRET!);

export async function GET(req: NextRequest) {
  const token = req.cookies.get("streamer_token")?.value;
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { payload } = await jwtVerify(token, secret);
    const id = payload.id as string;

    const { data: account } = await supabase
      .from("streamer_accounts").select("*").eq("id", id).single();

    const { data: payments } = await supabase
      .from("streamer_payments").select("*")
      .eq("streamer_id", id).order("month", { ascending: false });

    const { data: vods } = await supabase
      .from("streamer_vods").select("*")
      .eq("streamer_id", id).order("created_at", { ascending: false });

    return NextResponse.json({
      name:          payload.name,
      streamer_name: payload.streamer_name,
      rate_per_hour: account?.rate_per_hour || 0,
      platform:      account?.platform || "",
      channel_url:   account?.channel_url || "",
      overlay_token: account?.overlay_token || "",
      payments:      payments || [],
      vods:          vods || [],
    });
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}