import { NextResponse } from "next/server";

export async function POST(req) {
  const { albumtitel, interpret } = await req.json();

  if (!albumtitel || !interpret) {
    return NextResponse.json({ error: "Albumtitel und Interpret erforderlich" }, { status: 400 });
  }

  try {
    // 🔹 Token holen
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString("base64"),
      },
      body: "grant_type=client_credentials",
    });
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;

    // 🔹 Suche nach Album
    const q = encodeURIComponent(`${albumtitel} ${interpret}`);
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${q}&type=album&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const searchData = await searchRes.json();
    const album = searchData.albums?.items?.[0];

    if (!album) {
      return NextResponse.json({ spotify_id: null, spotify_link: null });
    }

    const spotify_id = album.id;
    const spotify_link = `https://open.spotify.com/album/${spotify_id}`;
    const cover = album.images?.[0]?.url || null;

    return NextResponse.json({ spotify_id, spotify_link, cover });
  } catch (err) {
    console.error("Spotify search error:", err);
    return NextResponse.json({ error: "Spotify-Suche fehlgeschlagen" }, { status: 500 });
  }
}
