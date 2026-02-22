import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getBearerToken(req) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? "";
}

export async function POST(req) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json(
        { error: "Nicht eingeloggt (Bearer Token fehlt)." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Ungültiges JSON." }, { status: 400 });
    }

    const { album_week_id, rating, favorite_song, favorite_lyric, worst_song, comment } = body;

    if (!album_week_id || ![-1, 0, 1].includes(rating)) {
      return NextResponse.json(
        { error: "album_week_id und rating (-1/0/1) sind Pflichtfelder." },
        { status: 400 }
      );
    }

    // optional: Pflichtfelder erzwingen (Textzeile optional)
    if (!favorite_song || !worst_song) {
      return NextResponse.json(
        { error: "favorite_song und worst_song sind Pflichtfelder." },
        { status: 400 }
      );
    }

    // ✅ Supabase Client "as user"
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    // ✅ User serverseitig bestimmen
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: "Ungültiger Login/Token." }, { status: 401 });
    }
    const userId = authData.user.id;

    // ✅ Optional: sicherstellen, dass Teilnehmerprofil existiert
    const { data: me, error: meErr } = await supabase
      .from("participants")
      .select("user_id, display_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (meErr) {
      return NextResponse.json({ error: meErr.message }, { status: 400 });
    }
    if (!me) {
      return NextResponse.json(
        { error: "Kein Teilnehmerprofil gefunden. Bitte einmal (neu) anmelden." },
        { status: 403 }
      );
    }

    // ✅ Upsert Vote — user_id serverseitig
    const { data, error } = await supabase
      .from("votes")
      .upsert(
        {
          album_week_id,
          user_id: userId,
          rating,
          voter: me?.display_name ?? null,
          favorite_song: String(favorite_song).trim(),
          favorite_lyric: favorite_lyric ? String(favorite_lyric).trim() : null,
          worst_song: String(worst_song).trim(),
          comment: comment ?? null,
        },
        { onConflict: "album_week_id,user_id" }
      )
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ data }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e?.message ?? "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}
