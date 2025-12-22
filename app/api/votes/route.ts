import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/types/supabase";

type VotePayload = {
  album_week_id: string;
  voter: string;
  rating: -1 | 0 | 1;

  comment?: string | null;

  // optionale Textfelder (kommen aus dem BewertungForm)
  favorite_song?: string | null;
  favorite_lyric?: string | null;
  worst_song?: string | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VotePayload;

    if (!body.album_week_id || !body.voter || ![-1, 0, 1].includes(body.rating)) {
      return NextResponse.json(
        { error: "album_week_id, voter und rating (-1/0/1) sind Pflichtfelder." },
        { status: 400 }
      );
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
    );

    const { data, error } = await supabase
      .from("votes")
      .upsert(
        {
          album_week_id: body.album_week_id,
          voter: body.voter,
          rating: body.rating,
          comment: body.comment ?? null,

          favorite_song: body.favorite_song ?? null,
          favorite_lyric: body.favorite_lyric ?? null,
          worst_song: body.worst_song ?? null,
        },
        {
          // WICHTIG: exakt Spaltennamen, kommagetrennt
          onConflict: "album_week_id,voter",
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
