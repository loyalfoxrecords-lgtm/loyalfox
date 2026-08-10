import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error:"Missing slug" }, { status:400 });

  const { count } = await supabase
    .from("track_link_views")
    .select("*", { count:"exact", head:true })
    .eq("track_slug", slug);

  const { data: byPlatform } = await supabase
    .from("track_link_views")
    .select("platform")
    .eq("track_slug", slug)
    .not("platform", "is", null);

  const platformCounts: Record<string,number> = {};
  byPlatform?.forEach(r => {
    platformCounts[r.platform] = (platformCounts[r.platform]||0) + 1;
  });

  return NextResponse.json({
    views: count || 0,
    byPlatform: platformCounts,
  });
}
