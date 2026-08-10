import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { slug, platform } = await req.json();
  if (!slug) return NextResponse.json({ error:"Missing slug" }, { status:400 });

  const country = req.headers.get("x-vercel-ip-country") || null;

  await supabase.from("track_link_views").insert({
    track_slug: slug,
    platform: platform || null,
    country,
  });

  return NextResponse.json({ ok:true });
}
