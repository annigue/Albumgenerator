import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export async function POST(req: Request) {
  const body = await req.json();

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
  );

  const { data, error } = await supabase
    .from("suggestions")
    .insert({
      spotify_id: body.spotify_id,
      spotify_url: body.spotify_url ?? null,
      cover_url: body.cover_url ?? null,
      title: body.title,
      artist: body.artist ?? null,
      suggested_by: body.suggested_by ?? null,
      note: body.note ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ data });
}
