import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Access Token holen
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

// Album suchen
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
    const { title, artist } = await request.json();

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return NextResponse.json(
        { error: "Missing Spotify credentials" },
        { status: 500 }
      );
    }

    if (!title || !artist) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const token = await getAccessToken();
    const found = await searchAlbum(token, title, artist);

    if (!found) {
      return NextResponse.json({ error: "No album found" }, { status: 404 });
    }

    return NextResponse.json(found);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch from Spotify" }, { status: 500 });
  }
}
