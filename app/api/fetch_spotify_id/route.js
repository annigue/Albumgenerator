// app/api/fetch_spotify_id/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ✅ nötig wegen Buffer

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;

/** 🔹 Spotify Access Token holen (Client Credentials Flow) */
async function getAccessToken() {
  const credentials = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error("Spotify token fetch failed");
  const data = await res.json();
  return data.access_token;
}

/** 🔹 POST-Handler: Albumtitel + Artist empfangen, Spotify abfragen */
export async function POST(req) {
  try {
    const { title, artist } = await req.json();
    if (!title || !artist)
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

    const token = await getAccessToken();

    const q = encodeURIComponent(`${title} ${artist}`);
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${q}&type=album&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await response.json();
    const album = data?.albums?.items?.[0];

    if (!album)
      return NextResponse.json({ error: "No album found" }, { status: 404 });

    return NextResponse.json({
      spotify_id: album.id,
      spotify_link: album.external_urls.spotify,
      cover_url: album.images?.[0]?.url ?? null,
      title,
      artist,
    });
  } catch (err) {
    console.error("Spotify fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
