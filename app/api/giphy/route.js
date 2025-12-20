import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GIPHY_API_KEY = process.env.GIPHY_API_KEY;

// kleines Hashing, damit wir pro Album stabil “zufällig” wählen können
function hashToInt(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const queryMap = {
  Hit: "this is amazing",
  "Geht in Ordnung": "indifferent",
  Niete: "no way",
};

export async function GET(req) {
  try {
    if (!GIPHY_API_KEY) {
      return NextResponse.json({ error: "Missing GIPHY_API_KEY" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const verdict = searchParams.get("verdict");
    const seed = searchParams.get("seed") || "default";

    const q = queryMap[verdict];
    if (!q) {
      return NextResponse.json({ error: "Invalid verdict" }, { status: 400 });
    }

    const limit = 25; // wie viele Ergebnisse wir holen
    const seedInt = hashToInt(`${verdict}|${seed}`);
    const offset = seedInt % 50; // innerhalb der ersten 50 Ergebnisse “springen”

    const url = new URL("https://api.giphy.com/v1/gifs/search");
    url.searchParams.set("api_key", GIPHY_API_KEY);
    url.searchParams.set("q", q);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("rating", "pg-13");
    url.searchParams.set("lang", "en");

    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: "Giphy request failed", details: data },
        { status: 500 }
      );
    }

    const items = data?.data || [];
    if (!items.length) {
      return NextResponse.json({ error: "No GIF found" }, { status: 404 });
    }

    // stabiler “random” Index innerhalb unserer results
    const idx = seedInt % items.length;
    const gif = items[idx];

    const gifUrl =
      gif?.images?.fixed_width?.url ||
      gif?.images?.downsized_medium?.url ||
      gif?.images?.original?.url ||
      null;

    return NextResponse.json({
      verdict,
      query: q,
      gifUrl,
      title: gif?.title || null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
