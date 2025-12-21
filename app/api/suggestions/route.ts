// app/api/suggestions/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Minimal-Validation
    if (!body?.spotify_id || !body?.title) {
      return NextResponse.json(
        { error: "spotify_id und title sind Pflichtfelder." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server-Konfiguration fehlt (SUPABASE URL / SERVICE ROLE KEY)." },
        { status: 500 }
      );
    }

    // Service Role => RLS umgehen (nur im Server nutzen!)
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const payload = {
      spotify_id: String(body.spotify_id).trim(),
      spotify_url: body.spotify_url ?? body.spotify_link ?? null,
      cover_url: body.cover_url ?? null,
      title: String(body.title).trim(),
      artist: body.artist ?? null,
      suggested_by: body.suggested_by ?? null,
      note: body.note ?? null,

      // ✅ neue Felder:
      reason: body.reason ?? null,
      favorite_song: body.favorite_song ?? null,
      favorite_lyric: body.favorite_lyric ?? null,
      worst_song: body.worst_song ?? null,
    };

    const { data, error } = await supabase
      .from("suggestions")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      // Duplicate spotify_id -> 409 + existing row zurückgeben
      if (
        typeof error.message === "string" &&
        (error.message.includes("duplicate key value") ||
          error.message.includes("suggestions_spotify_id_uq"))
      ) {
        const { data: existing, error: fetchErr } = await supabase
          .from("suggestions")
          .select("*")
          .eq("spotify_id", payload.spotify_id)
          .maybeSingle();

        return NextResponse.json(
          {
            error: "Dieses Album wurde bereits vorgeschlagen.",
            existing: fetchErr ? null : existing,
          },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ status: "inserted", data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unbekannter Serverfehler" },
      { status: 500 }
    );
  }
}
