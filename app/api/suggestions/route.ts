import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Wenn du KEIN Supabase-Types-File stabil hast, lass Database weg.
// import type { Database } from "@/types/supabase";

type Body = {
  // Frontend kann entweder "title/artist" schicken oder deine deutschen Feldnamen
  title?: string;
  artist?: string;

  albumtitel?: string;
  interpret?: string;

  suggested_by?: string;
  name?: string;

  note?: string;

  reason?: string;
  begruendung?: string;

  favorite_song?: string;
  liebstes_lied?: string;

  favorite_lyric?: string;
  liebste_textzeile?: string;

  worst_song?: string;
  schlechtestes_lied?: string;
};

function pickString(...vals: Array<unknown>): string | undefined {
  for (const v of vals) {
    if (typeof v === "string" && v.trim().length) return v.trim();
  }
  return undefined;
}

// Minimaler Spotify Search Helper (Client-Credentials Flow)
// Erwartet SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET in env (Vercel + lokal)
async function getSpotifyAlbumMeta(title: string, artist?: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify Client ID/Secret fehlen (SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET).");
  }

  // 1) token
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(tokenJson?.error_description || "Spotify token error");
  }

  const accessToken = tokenJson.access_token as string;

  // 2) search album
  const q = artist ? `album:${title} artist:${artist}` : `album:${title}`;
  const searchUrl = `https://api.spotify.com/v1/search?type=album&limit=1&q=${encodeURIComponent(q)}`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const searchJson = await searchRes.json();
  if (!searchRes.ok) {
    throw new Error(searchJson?.error?.message || "Spotify search error");
  }

  const album = searchJson?.albums?.items?.[0];
  if (!album?.id) {
    return { spotify_id: null, spotify_url: null, cover_url: null };
  }

  const cover = album.images?.[0]?.url ?? null;

  return {
    spotify_id: album.id as string,
    spotify_url: album.external_urls?.spotify ?? `https://open.spotify.com/album/${album.id}`,
    cover_url: cover,
  };
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON." }, { status: 400 });
  }

  const title = pickString(body.title, body.albumtitel);
  const artist = pickString(body.artist, body.interpret);
  const suggested_by = pickString(body.suggested_by, body.name);

  const reason = pickString(body.reason, body.begruendung) ?? null;
  const favorite_song = pickString(body.favorite_song, body.liebstes_lied) ?? null;
  const favorite_lyric = pickString(body.favorite_lyric, body.liebste_textzeile) ?? null;
  const worst_song = pickString(body.worst_song, body.schlechtestes_lied) ?? null;

  if (!title) {
    return NextResponse.json({ error: "title ist ein Pflichtfeld." }, { status: 400 });
  }

  // Spotify Daten automatisch holen
  let spotify_id: string | null = null;
  let spotify_url: string | null = null;
  let cover_url: string | null = null;

  try {
    const meta = await getSpotifyAlbumMeta(title, artist);
    spotify_id = meta.spotify_id;
    spotify_url = meta.spotify_url;
    cover_url = meta.cover_url;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Spotify Lookup fehlgeschlagen." }, { status: 400 });
  }

  if (!spotify_id) {
    return NextResponse.json(
      { error: "Kein Spotify-Album gefunden – bitte Titel/Interpret prüfen." },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Upsert verhindert duplicate key errors, wenn spotify_id unique ist
  const { data, error } = await supabase
    .from("suggestions")
    .upsert(
      {
        spotify_id,
        spotify_url,
        cover_url,
        title,
        artist: artist ?? null,
        suggested_by: suggested_by ?? null,
        note: body.note ?? null,
        reason,
        favorite_song,
        favorite_lyric,
        worst_song,
        is_active: true,
      },
      { onConflict: "spotify_id" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ status: "inserted", data });
}
