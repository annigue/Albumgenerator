import { NextResponse } from "next/server";

export const runtime = "nodejs"; // Wichtig für Vercel, damit Buffer funktioniert

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;

/* ────────────────────────────────────────────────
   Access Token von Spotify holen
   ──────────────────────────────────────────────── */
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

  if (!res.ok) {
    console.error("Spotify token fetch failed:", await res.text());
    throw new Error("Failed to get Spotify token");
  }

  const data = await res.json();
  return data.access_token;
}

/* ────────────────────────────────────────────────
   Hilfsfunktion: Spotify-Link normalisieren
   ──────────────────────────────────────────────── */
function normalizeSpotifyLink(url) {
  if (!url) return null;
  // entfernt Lokalisierungen wie /intl-de/, /intl-en/, /intl-fr/, usw.
  return url.replace(/open\.spotify\.com\/intl-[a-z-]+\//, "open.spotify.com/");
}

/* ────────────────────────────────────────────────
   POST: Titel + Artist → Spotify API → Albumdaten
   ──────────────────────────────────────────────── */
export async function POST(req) {
  try {
    const { title, artist } = await req.json();

    if (!title || !artist) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    const token = await getAccessToken();
    const query = encodeURIComponent(`${title} ${artist}`);

    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${query}&type=album&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    // Nur echte Alben mit passendem Artistnamen akzeptieren
    const album = data?.albums?.items?.find(
      (a) =>
        a.album_type === "album" &&
        a.artists?.[0]?.name?.toLowerCase()?.includes(artist.toLowerCase())
    );

    if (!album) {
      return NextResponse.json(
        { error: "No valid album found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      spotify_id: album.id,
      spotify_link: normalizeSpotifyLink(album.external_urls.spotify),
      cover_url: album.images?.[0]?.url ?? null,
      title,
      artist,
    });
  } catch (err) {
    console.error("Spotify fetch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
