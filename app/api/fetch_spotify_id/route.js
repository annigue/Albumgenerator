import { NextResponse } from "next/server";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

/* ──────────────────────────────────────────────────────────
   Access Token holen (Client Credentials)
   ────────────────────────────────────────────────────────── */
async function getAccessToken() {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET");
  }

  const auth = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    // optional: Next 15 kann fetch cachen; hier lieber aus
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.access_token) {
    const detail = data?.error_description || data?.error || "token_error";
    throw new Error(`Spotify token failed: ${detail}`);
  }

  return data.access_token;
}

/* ──────────────────────────────────────────────────────────
   POST: Album suchen
   Body: { title, artist }
   ────────────────────────────────────────────────────────── */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = (body?.title ?? "").trim();
  const artist = (body?.artist ?? "").trim();

  if (!title || !artist) {
    return NextResponse.json(
      { error: "Missing parameters: title and artist are required" },
      { status: 400 }
    );
  }

  try {
    const token = await getAccessToken();

    const query = encodeURIComponent(`${title} ${artist}`);
    const url = `https://api.spotify.com/v1/search?q=${query}&type=album&limit=1`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.error?.message || "Spotify search failed";
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    const album = data?.albums?.items?.[0];
    if (!album) {
      return NextResponse.json({ error: "No album found" }, { status: 404 });
    }

    // locale entfernen (intl-de usw.)
    const spotifyLink = (album.external_urls?.spotify || "").replace(
      /open\.spotify\.com\/intl-[a-z-]+\//,
      "open.spotify.com/"
    );

    return NextResponse.json({
      spotify_id: album.id ?? null,
      spotify_link: spotifyLink || null,
      cover_url: album.images?.[0]?.url || null,
    });
  } catch (err) {
    console.error("fetch_spotify_id error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch from Spotify" },
      { status: 500 }
    );
  }
}
