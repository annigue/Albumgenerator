import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/types/supabase";

// Wichtig: Service-Role Key => Node Runtime (nicht Edge)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VotePayload = {
  album_week_id: string; // UUID
  voter: string;
  rating: -1 | 0 | 1;
  favorite_song?: string | null;
  favorite_lyric?: string | null;
  worst_song?: string | null;
  comment?: string | null;
};

function isUuid(v: string) {
  // solide UUID v4/v1… Prüfung (Postgres akzeptiert alle UUIDs im Standardformat)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<VotePayload>;

    const album_week_id = String(body.album_week_id ?? "").trim();
    const voter = String(body.voter ?? "").trim();
    const rating = body.rating as VotePayload["rating"];

    if (!album_week_id || !voter || ![-1, 0, 1].includes(rating)) {
      return NextResponse.json(
        { error: "album_week_id, voter und rating (-1/0/1) sind Pflichtfelder." },
        { status: 400 }
      );
    }

    if (!isUuid(album_week_id)) {
      return NextResponse.json(
        { error: `album_week_id ist keine gültige UUID: "${album_week_id}"` },
        { status: 400 }
      );
    }

    // Nutze bevorzugt serverseitige Env Vars, fallback auf NEXT_PUBLIC_* wenn du sie so gesetzt hast
    const supabaseUrl =
      process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            "Server-Konfiguration fehlt: SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY.",
        },
        { status: 500 }
      );
    }

    const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from("votes")
      .upsert(
        {
          album_week_id,
          voter,
          rating,
          favorite_song: body.favorite_song?.trim?.() || null,
          favorite_lyric: body.favorite_lyric?.trim?.() || null,
          worst_song: body.worst_song?.trim?.() || null,
          comment: body.comment?.trim?.() || null,
        },
        {
          onConflict: "album_week_id,voter", // ✅ korrekt (muss UNIQUE/PK entsprechen)
        }
      )
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}
