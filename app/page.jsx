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
   Spotify-Helper: aus DB-Feldern eine gültige Embed-URL + Open-URL bauen
   - bevorzugt spotify_id
   - sonst Link parsen
   - sonst Such-Embed
   ────────────────────────────────────────────────────────── */
function getSpotifyUrls({ spotify_id, spotify_link, title, artist }) {
  // 1) Eigene ID aus Spalte
  if (spotify_id && /^[A-Za-z0-9]{10,}$/.test(spotify_id)) {
    return {
      embedUrl: `https://open.spotify.com/embed/album/${spotify_id}`,
      openUrl: `https://open.spotify.com/album/${spotify_id}`,
    };
  }

  // 2) Link parsen
  const match = spotify_link?.match?.(/album\/([A-Za-z0-9]{10,})/);
  if (match) {
    const id = match[1];
    return {
      embedUrl: `https://open.spotify.com/embed/album/${id}`,
      openUrl: `https://open.spotify.com/album/${id}`,
    };
  }

  // 3) Fallback: Suche (zeigt keine 404)
  const q = encodeURIComponent(`${title ?? ""} ${artist ?? ""}`.trim());
  return {
    embedUrl: `https://open.spotify.com/embed/search/${q}`,
    openUrl: `https://open.spotify.com/search/${q}`,
  };
}

/* ──────────────────────────────────────────────────────────
   Fun GIF je nach Mehrheitsbewertung
   ────────────────────────────────────────────────────────── */
function GiphyGif({ verdict }) {
  const map = {
    Hit: "https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif",
    "Geht in Ordnung": "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
    Niete: "https://media.giphy.com/media/3ohhwJ6DW9b0Nf3fUQ/giphy.gif",
  };
  const src = map[verdict] || map["Geht in Ordnung"];
  return (
    <div className="flex justify-center mt-4">
      <img
        src={src}
        alt={`GIF: ${verdict ?? "neutral"}`}
        className="w-64 h-48 object-cover border-2 border-retro-border"
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Bewertungsformular (aktuelles Album)
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

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!album?.id) return;

    setSending(true);
    const payload = {
      album_id: album.id,
      albumtitel: album.title, // zur Sicherheit zusätzlich speichern
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
    } else {
      setOk(true);
    }
  };

  if (!album) return null;

  if (ok)
    return (
      <div className="text-center text-green-600 mt-4">
        ✅ Danke für deine Bewertung!
      </div>
    );

  return (
    <form
      onSubmit={onSubmit}
      className="border-2 border-retro-border bg-retro-bg p-6 space-y-3 text-center"
    >
      <h3 className="text-retro-accent font-display text-2xl mb-2 tracking-wide">
        ALBUM BEWERTEN
      </h3>

      <select
        name="name"
        value={form.name}
        onChange={onChange}
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
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

/* ──────────────────────────────────────────────────────────
   Vorschlag-Formular (optional – schreibt in albums)
   ────────────────────────────────────────────────────────── */
/* 🔸 Vorschlag-Formular (mit automatischer Spotify-ID über API) */
/* 🔸 Vorschlag */
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
      // 🔹 Eintrag in Supabase speichern
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

  if (ok)
    return (
      <div className="text-center text-green-600 mt-4">
        ✅ Danke für deinen Vorschlag!
      </div>
    );

  return (
    <form
      onSubmit={onSubmit}
      className="border-2 border-retro-border bg-retro-bg p-6 mt-10 space-y-3 text-center"
    >
      <h3 className="text-retro-accent font-display text-2xl mb-2 tracking-wide">
        NEUES ALBUM VORSCHLAGEN
      </h3>

      {/* Teilnehmerauswahl */}
      <select
        name="name"
        value={form.name}
        onChange={onChange}
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
        required
      >
        <option value="">Teilnehmer wählen</option>
        {teilnehmer.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {/* Albumtitel */}
      <input
        name="albumtitel"
        value={form.albumtitel}
        onChange={onChange}
        placeholder="Albumtitel"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
        required
      />

      {/* Interpret */}
      <input
        name="interpret"
        value={form.interpret}
        onChange={onChange}
        placeholder="Interpret"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
        required
      />

      {/* Begründung */}
      <textarea
        name="begruendung"
        value={form.begruendung}
        onChange={onChange}
        placeholder="Warum sollen wir dieses Album hören?"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
      />

      {/* Liebstes Lied */}
      <input
        name="liebstes_lied"
        value={form.liebstes_lied}
        onChange={onChange}
        placeholder="Liebstes Lied"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
      />

      {/* Liebste Textzeile */}
      <textarea
        name="liebste_textzeile"
        value={form.liebste_textzeile}
        onChange={onChange}
        placeholder="Liebste Textzeile"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
      />

      {/* Schlechtestes Lied */}
      <input
        name="schlechtestes_lied"
        value={form.schlechtestes_lied}
        onChange={onChange}
        placeholder="Schlechtestes Lied"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
      />

      {/* Submit */}
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

/* 🔹 Durchschnittliche Bewertung für ein Album */
/* 🔹 Durchschnittliche Bewertung für ein Album */
function PastAlbumBewertung({ albumtitel }) {
  const [bewertung, setBewertung] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("bewertungen")
        .select("bewertung")
        .eq("albumtitel", albumtitel);

      if (!data || data.length === 0)
        return setBewertung({ label: "Keine Bewertungen", gif: null, color: "text-gray-500" });

      const hits = data.filter((d) => d.bewertung === "Hit").length;
      const okays = data.filter((d) => d.bewertung === "Geht in Ordnung").length;
      const fails = data.filter((d) => d.bewertung === "Niete").length;
      const total = data.length;

      const score = (hits * 3 + okays * 2 + fails * 1) / total;
      let result = { label: "", gif: "", color: "" };

      if (score >= 2.5)
        result = {
          label: "Hit",
          gif: "https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif",
          color: "text-green-600",
        };
      else if (score >= 1.6)
        result = {
          label: "Geht in Ordnung",
          gif: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
          color: "text-yellow-600",
        };
      else
        result = {
          label: "Niete",
          gif: "https://media.giphy.com/media/3ohhwJ6DW9b0Nf3fUQ/giphy.gif",
          color: "text-red-600",
        };

      setBewertung(result);
    })();
  }, [albumtitel]);

  if (!bewertung) return null;

  return (
    <div className="flex flex-col items-center">
      <p className={`font-display text-xl mb-3 ${bewertung.color}`}>
        💿 Gesamtbewertung: <b>{bewertung.label}</b>
      </p>
      {bewertung.gif && (
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-3xl opacity-30 bg-retro-accent"></div>
          <img
            src={bewertung.gif}
            alt={bewertung.label}
            className="relative rounded-2xl border-2 border-retro-border w-64 h-48 object-cover shadow-lg"
          />
        </div>
      )}
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

  // Reviews des aktuell im "Bisherige Alben"-Karussell ausgewählten Albums
  const [reviews, setReviews] = useState([]);

  /* Daten laden: aktuelles + vergangene Alben */
  useEffect(() => {
    (async () => {
      // Aktuelles
      const { data: active, error: e1 } = await supabase
        .from("albums")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (e1) console.error(e1);
      setCurrentAlbum(active ?? null);

      // Vergangene
      const { data: past, error: e2 } = await supabase
        .from("albums")
        .select("*")
        .eq("is_active", false)
        .not("date", "is", null)
        .order("date", { ascending: false });

      if (e2) console.error(e2);
      setPastAlbums(past ?? []);
      setIdx(0);
    })();
  }, []);

  /* Reviews für das ausgewählte vergangene Album laden */
  useEffect(() => {
    (async () => {
      const album = pastAlbums[idx];
      if (!album?.id) {
        setReviews([]);
        return;
      }
      const { data, error } = await supabase
        .from("bewertungen")
        .select("*")
        .eq("album_id", album.id)
        .order("created_at", { ascending: true });

      if (error) console.error(error);
      setReviews(data ?? []);
    })();
  }, [pastAlbums, idx]);

  /* Mehrheitsvotum berechnen */
  const majority = useMemo(() => {
    if (!reviews?.length) return null;
    const counts = { Hit: 0, "Geht in Ordnung": 0, Niete: 0 };
    for (const r of reviews) {
      if (counts[r.bewertung] !== undefined) counts[r.bewertung]++;
    }
    const [winner] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return { vote: winner, count: counts[winner] };
  }, [reviews]);

  return (
    <main className="bg-retro-bg text-retro-text min-h-screen">
      <div className="pattern-top" />
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-5xl font-display text-retro-accent text-center tracking-widest mb-8">
          ALBUM DER WOCHE
        </h1>

{/* 🎧 Aktuelles Album */}
{currentAlbum ? (
  <div className="border-2 border-retro-border p-6 mb-12 text-center">
    <h2 className="font-display text-3xl mb-2">{currentAlbum.albumtitel}</h2>
    <p className="text-sm mb-4">{currentAlbum.interpret}</p>

    {/* 💬 Vorschlagsdetails */}
    {currentAlbum.begruendung && (
      <p className="italic text-sm mb-2">💬 {currentAlbum.begruendung}</p>
    )}
    {currentAlbum.liebstes_lied && (
      <p className="text-sm mb-1">❤️ <b>Liebstes Lied:</b> {currentAlbum.liebstes_lied}</p>
    )}
    {currentAlbum.liebste_textzeile && (
      <p className="text-sm mb-1">📝 <b>Liebste Textzeile:</b> “{currentAlbum.liebste_textzeile}”</p>
    )}
    {currentAlbum.schlechtestes_lied && (
      <p className="text-sm mb-4">💀 <b>Schlechtestes Lied:</b> {currentAlbum.schlechtestes_lied}</p>
    )}

    {/* Spotify Player */}
    {(() => {
      const { embedUrl, openUrl } = getSpotifyUrls({
        spotify_id: currentAlbum.spotify_id,
        spotify_link: currentAlbum.spotify_link,
        title: currentAlbum.albumtitel ?? currentAlbum.title,
        artist: currentAlbum.interpret ?? currentAlbum.artist,
      });
      return (
        <>
          <iframe
            src={embedUrl}
            width="100%"
            height="352"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="border-2 border-retro-border mb-2"
          ></iframe>
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-retro-accent hover:underline"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
              className="w-5 h-5"
              alt=""
            />
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
  <p className="text-center text-gray-500 italic mb-8">
    Noch kein aktuelles Album gesetzt.
  </p>
)}
--- Past Albums ---
{pastAlbums.length > 0 && (
  <div className="border-2 border-retro-border p-6 mb-12 rounded-2xl bg-retro-bg shadow-lg">
    <h3 className="font-display text-3xl text-retro-accent text-center mb-8 tracking-widest">
      BISHERIGE ALBEN
    </h3>

    <div className="flex flex-col items-center">
      {/* 🖼 Cover */}
      {pastAlbums[currentIndex].cover_url ? (
        <img
          src={pastAlbums[currentIndex].cover_url}
          alt={pastAlbums[currentIndex].albumtitel}
          className="w-64 h-64 object-cover rounded-xl border-4 border-retro-border shadow-md mb-4"
        />
      ) : (
        <div className="w-64 h-64 flex items-center justify-center border-4 border-dashed border-retro-border text-gray-400 mb-4">
          Kein Cover
        </div>
      )}

      {/* 🎵 Titel + Spotify-Link */}
      <h4 className="text-2xl font-semibold mb-2 text-center font-display">
        {pastAlbums[currentIndex].albumtitel}
        {(() => {
          const { openUrl } = getSpotifyEmbedOrSearchLink(
            pastAlbums[currentIndex].spotify_link,
{/* PastAlbumBewertung moved above */}


/* 🔹 Durchschnittliche Bewertung für ein Album */
function PastAlbumBewertung({ albumtitel }) {
  const [bewertung, setBewertung] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("bewertungen")
        .select("bewertung")
        .eq("albumtitel", albumtitel);

      if (!data || data.length === 0) return setBewertung("Keine Bewertungen");

      const hits = data.filter((d) => d.bewertung === "Hit").length;
      const okays = data.filter((d) => d.bewertung === "Geht in Ordnung").length;
      const fails = data.filter((d) => d.bewertung === "Niete").length;
      const total = data.length;

      const score = (hits * 3 + okays * 2 + fails * 1) / total;
      let summary;
      if (score >= 2.5) summary = "Hit";
      else if (score >= 1.6) summary = "Geht in Ordnung";
      else summary = "Niete";
      setBewertung(summary);
    })();
  }, [albumtitel]);

  const gifMap = {
    Hit: "https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif",
    "Geht in Ordnung":
      "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
    Niete: "https://media.giphy.com/media/3ohhwJ6DW9b0Nf3fUQ/giphy.gif",
  };

  return (
    <div className="mt-4">
      {bewertung && (
        <>
          <p className="text-lg font-display text-retro-accent mb-2">
            Gesamtbewertung: {bewertung}
          </p>
          <img
            src={gifMap[bewertung]}
            alt={bewertung}
            className="mx-auto w-64 h-48 object-cover border-2 border-retro-border"
          />
        </>
      )}
    </div>
  );
}


        {/* Vorschlagen */}
        <VorschlagForm />
      </div>
      <div className="pattern-bottom" />
    </main>
  );
}