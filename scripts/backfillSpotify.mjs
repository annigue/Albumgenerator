// scripts/backfillSpotify.mjs
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// optional flags
const DRY_RUN = process.argv.includes("--dry-run");
const ONLY_MISSING = process.argv.includes("--only-missing"); // update only where spotify_id is null

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env (do NOT expose service role key to the browser)"
  );
}
if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in .env");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

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
  if (!res.ok) throw new Error(`Spotify search error ${res.status}: ${JSON.stringify(data)}`);

  const item = data?.albums?.items?.[0];
  if (!item) return null;

  const spotify_link = (item.external_urls?.spotify || "").replace(
    /open\.spotify\.com\/intl-[a-z-]+\//,
    "open.spotify.com/"
  );

  return {
    spotify_id: item.id ?? null,
    spotify_link: spotify_link || null,
    cover_url: item.images?.[0]?.url ?? null,
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`Backfill Spotify for albums. dry-run=${DRY_RUN}, only-missing=${ONLY_MISSING}`);

  const token = await getAccessToken();

  const { data: albums, error } = await supabase
    .from("albums")
    .select("id,title,artist,spotify_id,spotify_link,cover_url,is_active,date")
    .order("id", { ascending: true });

  if (error) throw error;
  if (!albums?.length) {
    console.log("No albums found.");
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const a of albums) {
    const needs =
      ONLY_MISSING
        ? !a.spotify_id
        : (!a.spotify_id || !a.spotify_link || !a.cover_url);

    if (!needs) {
      skipped++;
      continue;
    }

    const found = await searchAlbum(token, a.title, a.artist);
    if (!found) {
      console.log(`❌ Not found on Spotify: [${a.id}] ${a.artist} — ${a.title}`);
      skipped++;
      continue;
    }

    console.log(`✅ Found: [${a.id}] ${a.artist} — ${a.title}`);
    console.log(`   spotify_id=${found.spotify_id}`);
    console.log(`   cover_url=${found.cover_url}`);

    if (!DRY_RUN) {
      const { error: upErr } = await supabase
        .from("albums")
        .update({
          spotify_id: found.spotify_id,
          spotify_link: found.spotify_link,
          cover_url: found.cover_url,
        })
        .eq("id", a.id);

      if (upErr) {
        console.log(`   ⚠️ Update failed for id=${a.id}: ${upErr.message}`);
      } else {
        updated++;
      }
    }

    // small delay to be polite with Spotify API
    await sleep(250);
  }

  console.log(`Done. updated=${updated}, skipped=${skipped}`);
  if (DRY_RUN) console.log("Dry-run mode: no updates were written.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
