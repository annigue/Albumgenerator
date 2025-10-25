import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { albumtitel, interpret } = await req.json();

    if (!albumtitel || !interpret) {
      return NextResponse.json({ error: "Albumtitel und Interpret erforderlich" }, { status: 400 });
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    // 🔑 Token abrufen
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;
    if (!token) throw new Error("Kein Spotify-Token erhalten");

    // 🎵 Spotify durchsuchen
    const query = encodeURIComponent(`${albumtitel} ${interpret}`);
    const res = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=album&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    const album = data.albums?.items?.[0];
    if (!album) {
      return NextResponse.json({ spotifyLink: null, message: "Kein Album gefunden" });
    }

    return NextResponse.json({
      spotifyLink: album.external_urls.spotify,
      coverUrl: album.images?.[0]?.url || null,
      albumName: album.name,
      artistName: album.artists?.[0]?.name,
    });
  } catch (err) {
    console.error("Spotify-Suche fehlgeschlagen:", err);
    return NextResponse.json({ error: "Fehler bei der Spotify-Suche" }, { status: 500 });
  }
}
