import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type VotePayload = {
  album_week_id: string; // UUID
  rating: -1 | 0 | 1;
  favorite_song?: string | null;
  favorite_lyric?: string | null;
  worst_song?: string | null;
  comment?: string | null;
};

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth) return null;
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VotePayload;

    if (!body.album_week_id || ![-1, 0, 1].includes(body.rating)) {
      return NextResponse.json(
        { error: "album_week_id und rating (-1/0/1) sind Pflichtfelder." },
        { status: 400 }
      );
    }

    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: "Not authenticated (missing token)." }, { status: 401 });
    }

    // Supabase-Client "as user" (RLS greift!)
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    // User aus Token validieren
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }

    const user = userData.user;

    // user_id wird SERVERSEITIG gesetzt -> niemand kann spoof-en
    const row = {
      album_week_id: body.album_week_id,
      user_id: user.id,
      rating: body.rating,
      favorite_song: body.favorite_song ?? null,
      favorite_lyric: body.favorite_lyric ?? null,
      worst_song: body.worst_song ?? null,
      comment: body.comment ?? null,
    };

    // Upsert: pro user nur 1 vote pro album_week
    const { data, error } = await supabase
      .from("votes")
      .upsert(row, { onConflict: "album_week_id,user_id" })
      .select("*")
      .single();

    if (error) {
      // RLS Fehler kommen hier zuverlässig an
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
