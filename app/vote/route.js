import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const body = await request.json();
    const { albumId, vote } = body;

    if (!albumId || !vote) {
      return NextResponse.json({ error: "Missing albumId or vote" }, { status: 400 });
    }

    const columnMap = {
      Hit: "Hit",
      "Geht in Ordnung": "Geht in Ordnung",
      Niete: "Niete",
    };
    const column = columnMap[vote];
    if (!column) {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });
    }

    const { error } = await supabase.rpc("increment_vote", {
      album_id_param: albumId,
      column_name_param: column,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
