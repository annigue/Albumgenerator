import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const SPOTIFY_CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID")!;
const SPOTIFY_CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET")!;

async function getSpotifyToken() {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`),
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  return data.access_token;
}

async function searchSpotifyAlbum(title: string, artist: string) {
  const token = await getSpotifyToken();

  const query = encodeURIComponent(`${title} ${artist}`);
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${query}&type=album&limit=1`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data = await res.json();
  const album = data.albums?.items?.[0];
  if (!album) return null;

  return {
    spotify_id: album.id,
    spotify_link: album.external_urls.spotify,
    cover_url: album.images?.[0]?.url || null,
  };
}

serve(async (req) => {
  try {
    const { record } = await req.json();

    const { albumtitel, interpret, id } = record;
    if (!albumtitel || !interpret || !id)
      return new Response("Missing fields", { status: 400 });

    const albumData = await searchSpotifyAlbum(albumtitel, interpret);
    if (!albumData)
      return new Response("Album not found", { status: 404 });

    await supabase
      .from("vorschlaege")
      .update(albumData)
      .eq("id", id);

    return new Response(JSON.stringify(albumData), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response("Internal Error", { status: 500 });
  }
});
