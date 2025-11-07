import { NextResponse } from "next/server";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// 🔹 Access Token holen
async function getAccessToken() {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await response.json();
  return data.access_token;
}

// 🔹 Hauptfunktion: Album suchen
export async function POST(request) {
  const { title, artist } = await request.json();
  if (!title || !artist) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const token = await getAccessToken();

    const query = encodeURIComponent(`${title} ${artist}`);
    const url = `https://api.spotify.com/v1/search?q=${query}&type=album&limit=1`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (!data.albums?.items?.length)
      return NextResponse.json({ error: "No album found" }, { status: 404 });

    const album = data.albums.items[0];

    // 🔸 locale entfernen (intl-de usw.)
    const spotifyLink = album.external_urls.spotify.replace(
      /open\.spotify\.com\/intl-[a-z-]+\//,
      "open.spotify.com/"
    );

    return NextResponse.json({
      spotify_id: album.id,
      spotify_link: spotifyLink,
      cover_url: album.images?.[0]?.url || null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch from Spotify" }, { status: 500 });
  }
}
