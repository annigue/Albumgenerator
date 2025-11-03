"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/* ──────────────────────────────────────────────────────────
   Supabase Client
   ────────────────────────────────────────────────────────── */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/* ──────────────────────────────────────────────────────────
   Spotify Helper
   ────────────────────────────────────────────────────────── */
function getSpotifyUrls({ spotify_id, spotify_link, title, artist }) {
  if (spotify_id && /^[A-Za-z0-9]{10,}$/.test(spotify_id)) {
    return {
      embedUrl: `https://open.spotify.com/embed/album/${spotify_id}`,
      openUrl: `https://open.spotify.com/album/${spotify_id}`,
    };
  }

  const match = spotify_link?.match?.(/album\/([A-Za-z0-9]{10,})/);
  if (match) {
    const id = match[1];
    return {
      embedUrl: `https://open.spotify.com/embed/album/${id}`,
      openUrl: `https://open.spotify.com/album/${id}`,
    };
  }

  const q = encodeURIComponent(`${title ?? ""} ${artist ?? ""}`.trim());
  return {
    embedUrl: `https://open.spotify.com/embed/search/${q}`,
    openUrl: `https://open.spotify.com/search/${q}`,
  };
}

/* ──────────────────────────────────────────────────────────
   Bewertungsformular
   ────────────────────────────────────────────────────────── */
function BewertungForm({ album }) {
  const [form, setForm] = useState({
    name: "",
    liebstes_lied: "",
    beste_textzeile: "",
    schlechtestes_lied: "",
    bewertung: "",
  });
  const [ok, setOk] = useState(false);
  const [sending, setSending] = useState(false);
  const teilnehmer = ["Anne", "Moritz", "Max", "Kathi", "Lena"];

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!album?.id) return;

    setSending(true);
    const payload = {
      album_id: album.id,
      albumtitel: album.title,
      name: form.name,
      liebstes_lied: form.liebstes_lied,
      beste_textzeile: form.beste_textzeile,
      schlechtestes_lied: form.schlechtestes_lied,
      bewertung: form.bewertung,
    };
    const { error } = await supabase.from("bewertungen").insert([payload]);
    setSending(false);

    if (error) {
      console.error(error);
      alert("Fehler beim Absenden 😢");
    } else setOk(true);
  };

  if (ok) return <div className="text-center text-green-600 mt-4">✅ Danke für deine Bewertung!</div>;

  return (
    <form onSubmit={onSubmit} className="border-2 border-retro-border bg-retro-bg p-6 space-y-3 text-center">
      <h3 className="text-retro-accent font-display text-2xl mb-2 tracking-wide">ALBUM BEWERTEN</h3>

      <select name="name" value={form.name} onChange={onChange} className="w-full border border-retro-border bg-transparent p-2 text-sm" required>
        <option value="">Teilnehmer wählen</option>
        {teilnehmer.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <input name="liebstes_lied" value={form.liebstes_lied} onChange={onChange} placeholder="Liebstes Lied" className="w-full border border-retro-border bg-transparent p-2 text-sm" />
      <textarea name="beste_textzeile" value={form.beste_textzeile} onChange={onChange} placeholder="Beste Textzeile" className="w-full border border-retro-border bg-transparent p-2 text-sm" />
      <input name="schlechtestes_lied" value={form.schlechtestes_lied} onChange={onChange} placeholder="Schlechtestes Lied" className="w-full border border-retro-border bg-transparent p-2 text-sm" />

      <select name="bewertung" value={form.bewertung} onChange={onChange} className="w-full border border-retro-border bg-transparent p-2 text-sm" required>
        <option value="">Gesamtbewertung wählen</option>
        <option value="Hit">Hit</option>
        <option value="Geht in Ordnung">Geht in Ordnung</option>
        <option value="Niete">Niete</option>
      </select>

      <button type="submit" disabled={sending} className="w-full bg-retro-accent text-white font-display text-xl py-2 hover:bg-black transition">
        {sending ? "WIRD GESENDET…" : "SUBMIT"}
      </button>
    </form>
  );
}

/* ──────────────────────────────────────────────────────────
   Vorschlagformular
   ────────────────────────────────────────────────────────── */
function VorschlagForm() {
  const [form, setForm] = useState({
    name: "",
    albumtitel: "",
    interpret: "",
    begruendung: "",
    liebstes_lied: "",
    liebste_textzeile: "",
    schlechtestes_lied: "",
  });
  const [ok, setOk] = useState(false);
  const [sending, setSending] = useState(false);
  const teilnehmer = ["Anne", "Moritz", "Max", "Kathi", "Lena"];
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { error } = await supabase.from("vorschlaege").insert([form]);
      if (error) throw error;
      setOk(true);
    } catch (err) {
      console.error(err);
      alert("Fehler beim Vorschlagen 😢");
    } finally {
      setSending(false);
    }
  };

  if (ok) return <div className="text-center text-green-600 mt-4">✅ Danke für deinen Vorschlag!</div>;

  return (
    <form onSubmit={onSubmit} className="border-2 border-retro-border bg-retro-bg p-6 mt-10 space-y-3 text-center">
      <h3 className="text-retro-accent font-display text-2xl mb-2 tracking-wide">NEUES ALBUM VORSCHLAGEN</h3>
      <select name="name" value={form.name} onChange={onChange} className="w-full border border-retro-border bg-transparent p-2 text-sm" required>
        <option value="">Teilnehmer wählen</option>
        {teilnehmer.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <input name="albumtitel" value={form.albumtitel} onChange={onChange} placeholder="Albumtitel" className="w-full border border-retro-border bg-transparent p-2 text-sm" required />
      <input name="interpret" value={form.interpret} onChange={onChange} placeholder="Interpret" className="w-full border border-retro-border bg-transparent p-2 text-sm" required />
      <textarea name="begruendung" value={form.begruendung} onChange={onChange} placeholder="Warum sollen wir dieses Album hören?" className="w-full border border-retro-border bg-transparent p-2 text-sm" />
      <input name="liebstes_lied" value={form.liebstes_lied} onChange={onChange} placeholder="Liebstes Lied" className="w-full border border-retro-border bg-transparent p-2 text-sm" />
      <textarea name="liebste_textzeile" value={form.liebste_textzeile} onChange={onChange} placeholder="Liebste Textzeile" className="w-full border border-retro-border bg-transparent p-2 text-sm" />
      <input name="schlechtestes_lied" value={form.schlechtestes_lied} onChange={onChange} placeholder="Schlechtestes Lied" className="w-full border border-retro-border bg-transparent p-2 text-sm" />

      <button type="submit" disabled={sending} className="w-full bg-retro-accent text-white font-display text-xl py-2 hover:bg-black transition">
        {sending ? "WIRD GESENDET…" : "SUBMIT"}
      </button>
    </form>
  );
}

/* ──────────────────────────────────────────────────────────
   Durchschnittliche Bewertung mit GIF
   ────────────────────────────────────────────────────────── */
function PastAlbumBewertung({ albumtitel }) {
  const [bewertung, setBewertung] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("bewertungen").select("bewertung").eq("albumtitel", albumtitel);
      if (!data?.length) return setBewertung("Keine Bewertungen");

      const hits = data.filter((d) => d.bewertung === "Hit").length;
      const okays = data.filter((d) => d.bewertung === "Geht in Ordnung").length;
      const fails = data.filter((d) => d.bewertung === "Niete").length;
      const score = (hits * 3 + okays * 2 + fails * 1) / data.length;
      if (score >= 2.5) setBewertung("Hit");
      else if (score >= 1.6) setBewertung("Geht in Ordnung");
      else setBewertung("Niete");
    })();
  }, [albumtitel]);

  const gifs = {
    Hit: "https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif",
    "Geht in Ordnung": "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
    Niete: "https://media.giphy.com/media/3ohhwJ6DW9b0Nf3fUQ/giphy.gif",
  };

  if (!bewertung || bewertung === "Keine Bewertungen") return null;

  return (
    <div className="mt-4 text-center">
      <p className="text-lg font-display text-retro-accent mb-2">Gesamtbewertung: {bewertung}</p>
      <img src={gifs[bewertung]} alt={bewertung} className="mx-auto w-64 h-48 object-cover border-2 border-retro-border" />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Hauptseite
   ────────────────────────────────────────────────────────── */
export default function Home() {
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [pastAlbums, setPastAlbums] = useState([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: active } = await supabase.from("albums").select("*").eq("is_active", true).maybeSingle();
      setCurrentAlbum(active ?? null);

      const { data: past } = await supabase.from("albums").select("*").eq("is_active", false).order("date", { ascending: false });
      setPastAlbums(past ?? []);
    })();
  }, []);

  return (
    <main className="bg-retro-bg text-retro-text min-h-screen">
      <div className="pattern-top" />
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-5xl font-display text-retro-accent text-center tracking-widest mb-8">ALBUM DER WOCHE</h1>

        {/* Aktuelles Album */}
        {currentAlbum ? (
          <div className="border-2 border-retro-border p-6 mb-12 text-center rounded-2xl bg-retro-bg shadow-retro">
            <h2 className="font-display text-3xl mb-2">{currentAlbum.albumtitel}</h2>
            <p className="text-sm mb-4">{currentAlbum.interpret}</p>

            {(() => {
              const { embedUrl, openUrl } = getSpotifyUrls({
                spotify_id: currentAlbum.spotify_id,
                spotify_link: currentAlbum.spotify_link,
                title: currentAlbum.albumtitel,
                artist: currentAlbum.interpret,
              });
              return (
                <>
                  <iframe src={embedUrl} width="100%" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" className="border-2 border-retro-border mb-2"></iframe>
                  <a href={openUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-retro-accent hover:underline">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg" className="w-5 h-5" alt="" />
                    Auf Spotify ansehen
                  </a>
                </>
              );
            })()}

            <div className="mt-6">
              <BewertungForm album={currentAlbum} />
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 italic mb-8">Noch kein aktuelles Album gesetzt.</p>
        )}

        {/* Vergangene Alben */}
        {pastAlbums.length > 0 && (
          <div className="border-2 border-retro-border p-6 mb-12 rounded-2xl bg-retro-bg shadow-lg">
            <h3 className="font-display text-3xl text-retro-accent text-center mb-8 tracking-widest">BISHERIGE ALBEN</h3>

            <div className="flex flex-col items-center">
              {pastAlbums[idx]?.cover_url ? (
                <img src={pastAlbums[idx].cover_url} alt={pastAlbums[idx].albumtitel} className="w-64 h-64 object-cover rounded-xl border-4 border-retro-border shadow-md mb-4" />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center border-4 border-dashed border-retro-border text-gray-400 mb-4">Kein Cover</div>
              )}

              <h4 className="text-2xl font-semibold mb-2 text-center font-display">
                {pastAlbums[idx].albumtitel}
                <a href={getSpotifyUrls(pastAlbums[idx]).openUrl} target="_blank" rel="noopener noreferrer" className="inline-block ml-2 align-middle">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg" alt="Spotify" className="w-5 h-5 inline-block" />
                </a>
              </h4>
              <p className="text-sm text-center mb-4">{pastAlbums[idx].interpret}</p>

              <PastAlbumBewertung albumtitel={pastAlbums[idx].albumtitel} />

              <div className="flex justify-between mt-6 w-full">
                <button onClick={() => setIdx((i) => Math.max(i - 1, 0))} disabled={idx === 0} className="px-4 py-2 bg-retro-accent text-white border-2 border-retro-border hover:bg-black transition disabled:opacity-50">◀ Vorheriges</button>
                <button onClick={() => setIdx((i) => Math.min(i + 1, pastAlbums.length - 1))} disabled={idx === pastAlbums.length - 1} className="px-4 py-2 bg-retro-accent text-white border-2 border-retro-border hover:bg-black transition disabled:opacity-50">Nächstes ▶</button>
              </div>
            </div>
          </div>
        )}

        <VorschlagForm />
      </div>
      <div className="pattern-bottom" />
    </main>
  );
}
