import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

// WICHTIG: server-only, NIE als NEXT_PUBLIC!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

function assertEnv() {
  const missing = [];
  if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!SPOTIFY_CLIENT_ID) missing.push("SPOTIFY_CLIENT_ID");
  if (!SPOTIFY_CLIENT_SECRET) missing.push("SPOTIFY_CLIENT_SECRET");
  if (missing.length) throw new Error(`Missing env: ${missing.join(", ")}`);
}

async function getAccessToken() {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Spotify token error ${res.status}: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function searchAlbum(token, title, artist) {
  const q = encodeURIComponent(`album:${title} artist:${artist}`);
  const url = `https://api.spotify.com/v1/search?q=${q}&type=album&limit=1`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Spotify search error ${res.status}: ${JSON.stringify(data)}`);
  }

  const item = data?.albums?.items?.[0];
  if (!item) return null;

  const spotifyLink = (item.external_urls?.spotify || "").replace(
    /open\.spotify\.com\/intl-[a-z-]+\//,
    "open.spotify.com/"
  );

  return {
    spotify_id: item.id ?? null,
    spotify_link: spotifyLink || null,
    cover_url: item.images?.[0]?.url ?? null,
  };
}

export async function POST(request) {
  try {
    assertEnv();

    const body = await request.json().catch(() => ({}));
    const albumId = body?.albumId;

    if (!albumId) {
      return NextResponse.json({ error: "Missing albumId" }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Album laden
    const { data: album, error: e1 } = await supabase
      .from("albums")
      .select("id,title,artist,spotify_id,spotify_link,cover_url")
      .eq("id", albumId)
      .maybeSingle();

    if (e1) throw e1;
    if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404 });

    // Wenn schon komplett → nichts tun
    const complete = album.spotify_id && album.spotify_link && album.cover_url;
    if (complete) {
      return NextResponse.json({ ok: true, updated: false, album });
    }

    // Spotify suchen
    const token = await getAccessToken();
    const found = await searchAlbum(token, album.title, album.artist);

    if (!found) {
      return NextResponse.json(
        { error: "No album found on Spotify", albumId, title: album.title, artist: album.artist },
        { status: 404 }
      );
    }

    // Updaten
    const { error: e2 } = await supabase
      .from("albums")
      .update(found)
      .eq("id", albumId);

    if (e2) throw e2;

    return NextResponse.json({ ok: true, updated: true, albumId, ...found });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
  }
}
