import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getBearerToken(req) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? "";
}

function pickString(...vals) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim().length) return v.trim();
  }
  return undefined;
}

// Spotify Client-Credentials Flow
async function getSpotifyAlbumMeta(title, artist) {
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

  const accessToken = tokenJson.access_token;

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
  if (!album?.id) return { spotify_id: null, spotify_url: null, cover_url: null };

  const cover = album.images?.[0]?.url ?? null;

  return {
    spotify_id: album.id,
    spotify_url: album.external_urls?.spotify ?? `https://open.spotify.com/album/${album.id}`,
    cover_url: cover,
  };
}

export async function POST(req) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json(
        { error: "Nicht eingeloggt (Bearer Token fehlt)." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Ungültiges JSON." }, { status: 400 });
    }

    // akzeptiere alte + neue Feldnamen (aber KEIN suggested_by mehr)
    const title = pickString(body.title, body.albumtitel);
    const artist = pickString(body.artist, body.interpret);

    const reason = pickString(body.reason, body.begruendung) ?? null;
    const favorite_song = pickString(body.favorite_song, body.liebstes_lied) ?? null;
    const favorite_lyric = pickString(body.favorite_lyric, body.liebste_textzeile) ?? null;
    const worst_song = pickString(body.worst_song, body.schlechtestes_lied) ?? null;

    if (!title || !artist || !reason || !favorite_song || !worst_song) {
      return NextResponse.json(
        { error: "Pflicht: title, artist, reason, favorite_song, worst_song (Textzeile optional)." },
        { status: 400 }
      );
    }

    // ✅ Supabase Client "as user"
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    // ✅ User serverseitig bestimmen
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: "Ungültiger Login/Token." }, { status: 401 });
    }
    const userId = authData.user.id;

    // ✅ participant holen (Name serverseitig)
    const { data: me, error: meErr } = await supabase
      .from("participants")
      .select("user_id, display_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (meErr) return NextResponse.json({ error: meErr.message }, { status: 400 });
    if (!me?.display_name) {
      return NextResponse.json(
        { error: "Kein Teilnehmerprofil gefunden. Bitte einmal (neu) anmelden." },
        { status: 403 }
      );
    }

    // Spotify Daten automatisch holen
    const meta = await getSpotifyAlbumMeta(title, artist);
    if (!meta.spotify_id) {
      return NextResponse.json(
        { error: "Kein Spotify-Album gefunden – bitte Titel/Interpret prüfen." },
        { status: 400 }
      );
    }

    // ✅ Upsert suggestion (user_id serverseitig)
    // Empfehlung: unique constraint auf (spotify_id, user_id) ODER "eine suggestion pro spotify_id" (deine Wahl)
    const { data, error } = await supabase
      .from("suggestions")
      .upsert(
        {
          spotify_id: meta.spotify_id,
          spotify_url: meta.spotify_url,
          cover_url: meta.cover_url,
          title: title.trim(),
          artist: artist.trim(),
          user_id: userId,
          suggested_by: me.display_name, // nur Anzeige, nicht "auth"
          note: body.note ?? null,
          reason,
          favorite_song,
          favorite_lyric,
          worst_song,
          is_active: true,
        },
        // WICHTIG: Das muss zu deinem DB-Constraint passen!
        // Wenn du "nur ein Vorschlag pro Album global" willst: onConflict: "spotify_id"
        // Wenn du "jeder darf das Album vorschlagen" willst: onConflict: "spotify_id,user_id"
        { onConflict: "spotify_id,user_id" }
      )
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ status: "inserted", data }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e?.message ?? "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}
