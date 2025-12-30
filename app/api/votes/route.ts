import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type VotePayload = {
  album_week_id: string; // UUID
  rating: -1 | 0 | 1;
  favorite_song?: string | null;
  favorite_lyric?: string | null;
  worst_song?: string | null;
  comment?: string | null;
};

function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? "";
}

export async function POST(req: Request) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: "Nicht eingeloggt (Bearer Token fehlt)." }, { status: 401 });
    }

    const body = (await req.json()) as VotePayload;

    if (!body.album_week_id || ![-1, 0, 1].includes(body.rating)) {
      return NextResponse.json(
        { error: "album_week_id und rating (-1/0/1) sind Pflichtfelder." },
        { status: 400 }
      );
    }

    // ✅ Supabase Client "as user" (wichtig: KEIN service role key)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // ✅ User serverseitig bestimmen
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: "Ungültiger Login/Token." }, { status: 401 });
    }

    const userId = authData.user.id;

    // ✅ Upsert Vote — user_id wird serverseitig gesetzt, nicht aus dem Body
    const { data, error } = await supabase
      .from("votes")
      .upsert(
        {
          album_week_id: body.album_week_id,
          user_id: userId,
          rating: body.rating,
          favorite_song: body.favorite_song ?? null,
          favorite_lyric: body.favorite_lyric ?? null,
          worst_song: body.worst_song ?? null,
          comment: body.comment ?? null,
        },
        { onConflict: "album_week_id,user_id" }
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
