"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/* ── Spotify Utils + Player ─────────────────────────────────────────────── */

function parseSpotifyLink(input) {
  if (!input) return null;
  const raw = String(input).trim();

  // Falls nur eine 22-stellige ID übergeben wurde → als Album interpretieren
  const idOnly = raw.match(/^[A-Za-z0-9]{22}$/);
  if (idOnly) return { type: "album", id: idOnly[0], embedUrl: `https://open.spotify.com/embed/album/${idOnly[0]}` };

  // spotify:album:ID / spotify:track:ID …
  const uri = raw.match(/^spotify:(album|track|playlist|artist):([A-Za-z0-9]{22})$/i);
  if (uri) {
    const type = uri[1].toLowerCase();
    const id = uri[2];
    return { type, id, embedUrl: `https://open.spotify.com/embed/${type}/${id}` };
  }

  // Normale Links – erlaubt auch Lokalisierungs-Segmente (z.B. /intl-de/)
  // und ignoriert Query-Strings & Fragmente
  // Beispiele:
  // https://open.spotify.com/album/xxxxxxxxxxxxxxxxxxxxxx?si=...
  // https://open.spotify.com/intl-de/track/xxxxxxxxxxxxxxxxxxxxxx
  try {
    const u = new URL(raw);
    if (u.hostname.includes("open.spotify.com")) {
      const parts = u.pathname.split("/").filter(Boolean); // z.B. ["intl-de","album","ID"]
      let type = null;
      let id = null;

      // Ermittle Typ + ID (mit oder ohne intl-Segment)
      for (let i = 0; i < parts.length - 1; i++) {
        const segment = parts[i].toLowerCase();
        if (["album", "track", "playlist", "artist"].includes(segment)) {
          type = segment;
          const maybeId = parts[i + 1]?.match?.(/^[A-Za-z0-9]{22}$/)?.[0];
          if (maybeId) id = maybeId;
          break;
        }
      }

      if (type && id) {
        return { type, id, embedUrl: `https://open.spotify.com/embed/${type}/${id}` };
      }
    }
  } catch (_) {
    /* ignore invalid URL */
  }

  return null; // nichts erkannt
}

function SpotifyPlayer({ link, className = "" }) {
  const parsed = useMemo(() => parseSpotifyLink(link), [link]);

  if (!parsed) {
    // Fallback: Kein valider Embed – wir zeigen einen externen Link (ohne Rahmen)
    if (!link) return null;
    return (
      <div className={`mt-2 ${className}`}>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 underline underline-offset-4"
          style={{ border: "none" }}
        >
          Auf Spotify öffnen
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
            alt="Spotify"
            className="w-5 h-5"
            style={{ border: "none" }}
          />
        </a>
      </div>
    );
  }

  return (
    <iframe
      className={`w-full border-2 border-retro-border ${className}`}
      src={parsed.embedUrl}
      height={parsed.type === "track" ? 152 : 352}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
    />
  );
}

/* ── Giphy ─────────────────────────────────────────────────────────────── */

function GiphyGif({ keyword }) {
  const [gifUrl, setGifUrl] = useState(null);
  const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;

  useEffect(() => {
    let cancel = false;
    async function run() {
      try {
        if (!apiKey) throw new Error("Missing GIPHY key");
        const res = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(
            keyword
          )}&limit=10&rating=g`
        );
        const data = await res.json();
        if (!cancel && data?.data?.length) {
          const rnd = data.data[Math.floor(Math.random() * data.data.length)];
          setGifUrl(rnd.images.fixed_height.url);
        }
      } catch {
        setGifUrl(null);
      }
    }
    run();
    return () => {
      cancel = true;
    };
  }, [keyword, apiKey]);

  const fallback = {
    winner: "https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif",
    average: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
    "do not want": "https://media.giphy.com/media/3ohhwJ6DW9b0Nf3fUQ/giphy.gif",
  };

  return (
    <div className="flex justify-center mt-4">
      <img
        src={gifUrl || fallback[keyword] || fallback.average}
        alt={keyword}
        className="w-64 h-48 object-cover border-2 border-retro-border"
      />
    </div>
  );
}

/* ── Formulare ─────────────────────────────────────────────────────────── */

function BewertungForm({ albumTitel }) {
  const [form, setForm] = useState({
    name: "",
    albumtitel: albumTitel || "",
    liebstes_lied: "",
    beste_textzeile: "",
    schlechtestes_lied: "",
    bewertung: "",
  });
  const [ok, setOk] = useState(false);
  const [sending, setSending] = useState(false);
  const teilnehmer = ["Anne", "Moritz", "Max", "Kathi", "Lena"];

  useEffect(() => {
    setForm((f) => ({ ...f, albumtitel: albumTitel || "" }));
  }, [albumTitel]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    const { error } = await supabase.from("bewertungen").insert([form]);
    setSending(false);
    if (error) alert("Fehler beim Absenden 😢");
    else setOk(true);
  };

  if (ok) return <div className="text-center text-green-600 mt-4">✅ Danke für deine Bewertung!</div>;

  return (
    <form onSubmit={onSubmit} className="border-2 border-retro-border bg-retro-bg p-6 space-y-3 text-center">
      <h3 className="text-retro-accent font-display text-2xl mb-2 tracking-wide">ALBUM BEWERTEN</h3>

      <select
        name="name"
        value={form.name}
        onChange={onChange}
        className="w-full border border-retro-border bg-transparent p-2 text-sm tracking-wider focus:outline-none"
        required
      >
        <option value="">Teilnehmer wählen</option>
        {teilnehmer.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <input
        name="albumtitel"
        value={form.albumtitel}
        onChange={onChange}
        placeholder="Albumtitel"
        className="w-full border border-retro-border bg-transparent p-2 text-sm tracking-wider focus:outline-none"
        required
      />

      <input
        name="liebstes_lied"
        value={form.liebstes_lied}
        onChange={onChange}
        placeholder="Liebstes Lied"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
      />

      <textarea
        name="beste_textzeile"
        value={form.beste_textzeile}
        onChange={onChange}
        placeholder="Beste Textzeile"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
      />

      <input
        name="schlechtestes_lied"
        value={form.schlechtestes_lied}
        onChange={onChange}
        placeholder="Schlechtestes Lied"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
      />

      <select
        name="bewertung"
        value={form.bewertung}
        onChange={onChange}
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
        required
      >
        <option value="">Gesamtbewertung wählen</option>
        <option value="Hit">Hit</option>
        <option value="Geht in Ordnung">Geht in Ordnung</option>
        <option value="Niete">Niete</option>
      </select>

      <button
        type="submit"
        disabled={sending}
        className="w-full bg-retro-accent text-white font-display text-xl py-2 hover:bg-black transition"
      >
        {sending ? "WIRD GESENDET…" : "SUBMIT"}
      </button>
    </form>
  );
}

function VorschlagForm() {
  const [form, setForm] = useState({
    name: "",
    albumtitel: "",
    interpret: "",
    begruendung: "",
    spotify_link: "",
  });
  const [ok, setOk] = useState(false);
  const [sending, setSending] = useState(false);
  const teilnehmer = ["Anne", "Moritz", "Max", "Kathi", "Lena"];

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    const { error } = await supabase.from("vorschlaege").insert([form]);
    setSending(false);
    if (error) alert("Fehler beim Vorschlagen 😢");
    else setOk(true);
  };

  if (ok) return <div className="text-center text-green-600 mt-4">✅ Danke für deinen Vorschlag!</div>;

  return (
    <form onSubmit={onSubmit} className="border-2 border-retro-border bg-retro-bg p-6 mt-10 space-y-3 text-center">
      <h3 className="text-retro-accent font-display text-2xl mb-2 tracking-wide">NEUES ALBUM VORSCHLAGEN</h3>

      <select
        name="name"
        value={form.name}
        onChange={onChange}
        className="w-full border border-retro-border bg-transparent p-2 text-sm tracking-wider"
        required
      >
        <option value="">Teilnehmer wählen</option>
        {teilnehmer.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <input
        name="albumtitel"
        value={form.albumtitel}
        onChange={onChange}
        placeholder="Albumtitel"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
        required
      />

      <input
        name="interpret"
        value={form.interpret}
        onChange={onChange}
        placeholder="Interpret"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
        required
      />

      <textarea
        name="begruendung"
        value={form.begruendung}
        onChange={onChange}
        placeholder="Warum teilen?"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
      />

      <input
        name="spotify_link"
        value={form.spotify_link}
        onChange={onChange}
        placeholder="Spotify-Link (optional – Album-Link oder ID)"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
      />

      <button type="submit" disabled={sending} className="w-full bg-retro-accent text-white font-display text-xl py-2 hover:bg-black transition">
        {sending ? "WIRD GESENDET…" : "SUBMIT"}
      </button>
    </form>
  );
}

/* ── Seite ─────────────────────────────────────────────────────────────── */

export default function Home() {
  const [vorschlaege, setVorschlaege] = useState([]);
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [pastAlbums, setPastAlbums] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Laden: neueste zuerst, erstes = aktuelles Album
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("vorschlaege")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }
      setVorschlaege(data || []);
      setCurrentAlbum(data?.[0] || null);
      setPastAlbums((data || []).slice(1));
    })();
  }, []);

  // Mehrheitsergebnis für ein Album
  function MajorityBadge({ albumtitel }) {
    const [votes, setVotes] = useState(null);

    useEffect(() => {
      let ignore = false;
      (async () => {
        const { data } = await supabase
          .from("bewertungen")
          .select("bewertung")
          .eq("albumtitel", albumtitel);

        if (ignore) return;
        const counts = { Hit: 0, "Geht in Ordnung": 0, Niete: 0 };
        (data || []).forEach((r) => {
          if (counts[r.bewertung] !== undefined) counts[r.bewertung]++;
        });

        const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        if (entries[0][1] === 0) setVotes(null);
        else setVotes({ top: entries[0][0], count: entries[0][1] });
      })();
      return () => (ignore = true);
    }, [albumtitel]);

    if (!votes) return null;

    const keyword = votes.top === "Hit" ? "winner" : votes.top === "Niete" ? "do not want" : "average";
    return (
      <>
        <p className="text-center font-medium mt-2">
          🏆 Mehrheitlich bewertet als: {votes.top} ({votes.count} Stimmen)
        </p>
        <GiphyGif keyword={keyword} />
      </>
    );
  }

  return (
    <main className="bg-retro-bg text-retro-text min-h-screen">
      <div className="pattern-top" />
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-5xl font-display text-retro-accent text-center tracking-widest mb-8">ALBUM DER WOCHE</h1>

        {/* 🎧 Aktuelles Album */}
        {currentAlbum ? (
          <div className="border-2 border-retro-border p-6 mb-12 text-center">
            <h2 className="font-display text-3xl mb-2">{currentAlbum.albumtitel}</h2>
            <p className="text-sm mb-4">{currentAlbum.interpret}</p>

            {/* Robustes Embed / Fallback-Link */}
            <SpotifyPlayer link={currentAlbum.spotify_link} className="mb-2" />

            <div className="mt-6">
              <BewertungForm albumTitel={currentAlbum.albumtitel} />
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 italic mb-8">Noch kein Album der Woche vorhanden.</p>
        )}

        {/* 📚 Vergangene Alben */}
        {pastAlbums.length > 0 && (
          <div className="border-2 border-retro-border p-6 mb-12">
            <h3 className="font-display text-2xl text-retro-accent text-center mb-6">BISHERIGE ALBEN</h3>

            {/* Cover aus oEmbed laden (falls möglich) */}
            <CoverFromSpotify link={pastAlbums[currentIndex]?.spotify_link} />

            <h4 className="text-xl text-center font-semibold mb-1">
              {pastAlbums[currentIndex].albumtitel}
              {pastAlbums[currentIndex].spotify_link && (
                <a
                  href={pastAlbums[currentIndex].spotify_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block ml-2 align-middle"
                  style={{ border: "none" }}
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
                    alt="Spotify"
                    className="w-5 h-5 inline-block"
                    style={{ border: "none" }}
                  />
                </a>
              )}
            </h4>
            <p className="text-sm text-center mb-4">{pastAlbums[currentIndex].interpret}</p>

            <MajorityBadge albumtitel={pastAlbums[currentIndex].albumtitel} />

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
                disabled={currentIndex === 0}
                className="px-4 py-2 bg-retro-accent text-white border-2 border-retro-border hover:bg-black transition disabled:opacity-50"
              >
                ◀ Vorheriges
              </button>
              <button
                onClick={() => setCurrentIndex((i) => Math.min(i + 1, pastAlbums.length - 1))}
                disabled={currentIndex === pastAlbums.length - 1}
                className="px-4 py-2 bg-retro-accent text-white border-2 border-retro-border hover:bg-black transition disabled:opacity-50"
              >
                Nächstes ▶
              </button>
            </div>
          </div>
        )}

        {/* ✨ Vorschlag */}
        <VorschlagForm />
      </div>
      <div className="pattern-bottom" />
    </main>
  );
}

/* Kleines Hilfs-Cover via oEmbed (wenn Link/ID bekannt) */
function CoverFromSpotify({ link }) {
  const [thumb, setThumb] = useState(null);

  useEffect(() => {
    setThumb(null);
    const parsed = parseSpotifyLink(link);
    if (!parsed) return;

    // oEmbed funktioniert für Album/Track/Playlist/Artist URLs
    const url = `https://open.spotify.com/${parsed.type}/${parsed.id}`;
    fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((d) => setThumb(d.thumbnail_url))
      .catch(() => setThumb(null));
  }, [link]);

  if (!thumb) return null;

  return <img src={thumb} alt="Cover" className="mx-auto mb-4 border-2 border-retro-border" />;
}
