import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/types/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Minimal-Validation
    if (!body?.spotify_id || !body?.title) {
      return NextResponse.json(
        { error: "Missing required fields: spotify_id, title" },
        { status: 400 }
      );
    }

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
      // Postgres unique violation
      if (error.code === "23505") {
        // optional: bestehenden Datensatz holen (damit UI anzeigen kann "ist schon drin")
        const { data: existing } = await supabase
          .from("suggestions")
          .select("*")
          .eq("spotify_id", body.spotify_id)
          .maybeSingle();

        return NextResponse.json(
          {
            status: "exists",
            message: "Dieses Album wurde bereits vorgeschlagen.",
            data: existing ?? null,
          },
          { status: 200 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ status: "inserted", data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown server error" },
      { status: 500 }
    );
  }
}
