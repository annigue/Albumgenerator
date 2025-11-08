"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/* ──────────────────────────────────────────────────────────
   Supabase Client
   ────────────────────────────────────────────────────────── */
   import { createClient } from "@supabase/supabase-js";

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
    // Normalisiere: falls spotify_id ein voller Link ist, extrahiere ID
    const idFromId = spotify_id?.match?.(/([A-Za-z0-9]{10,})$/)?.[1];
    const idFromLink = spotify_link?.match?.(/album\/([A-Za-z0-9]{10,})/)?.[1];
    const id = idFromId || idFromLink;
  
    if (id) {
      return {
        embedUrl: `https://open.spotify.com/embed/album/${id}`,
        openUrl: `https://open.spotify.com/album/${id}`,
      };
    }
  
    // Fallback: Suche
    const q = encodeURIComponent(`${title ?? ""} ${artist ?? ""}`.trim());
    return {
      embedUrl: `https://open.spotify.com/embed/search/${q}`,
      openUrl: `https://open.spotify.com/search/${q}`,
    };
  }
  
/* ──────────────────────────────────────────────────────────
   Fun GIF je nach Mehrheitsbewertung von giphy
   ────────────────────────────────────────────────────────── */
function GiphyGif({ verdict }) {
  const map = {
    Hit: "https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif",
    "Geht in Ordnung":
      "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
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
    if (!album || !album.id) {
      alert("Kein Album ausgewählt. Bitte versuche es erneut.");
      return;
    }

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
   Vorschlag-Formular (mit Spotify-ID über API)
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
        // 🔹 1. Spotify-ID automatisch abrufen
        const res = await fetch("/api/fetch_spotify_id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.albumtitel,
            artist: form.interpret,
          }),
        });
  
        const spotifyData = await res.json();
        if (!res.ok) throw new Error(spotifyData.error || "Spotify error");
  
        // 🔹 2. Daten in Supabase speichern
        const { error } = await supabase.from("vorschlaege").insert([
          {
            name: form.name,
            albumtitel: form.albumtitel,
            interpret: form.interpret,
            begruendung: form.begruendung,
            liebstes_lied: form.liebstes_lied,
            liebste_textzeile: form.liebste_textzeile,
            schlechtestes_lied: form.schlechtestes_lied,
            spotify_id: spotifyData.spotify_id,
            spotify_link: spotifyData.spotify_link,
            cover_url: spotifyData.cover_url,
          },
        ]);
  
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
          placeholder="Warum sollen wir dieses Album hören?"
          className="w-full border border-retro-border bg-transparent p-2 text-sm"
        />
  
        <input
          name="liebstes_lied"
          value={form.liebstes_lied}
          onChange={onChange}
          placeholder="Liebstes Lied"
          className="w-full border border-retro-border bg-transparent p-2 text-sm"
        />
  
        <textarea
          name="liebste_textzeile"
          value={form.liebste_textzeile}
          onChange={onChange}
          placeholder="Liebste Textzeile"
          className="w-full border border-retro-border bg-transparent p-2 text-sm"
        />
  
        <input
          name="schlechtestes_lied"
          value={form.schlechtestes_lied}
          onChange={onChange}
          placeholder="Schlechtestes Lied"
          className="w-full border border-retro-border bg-transparent p-2 text-sm"
        />
  
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
   Hauptseite
   ────────────────────────────────────────────────────────── */
export default function Home() {
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [pastAlbums, setPastAlbums] = useState([]);
  const [idx, setIdx] = useState(0);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: active, error: e1 } = await supabase
        .from("albums")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (e1) console.error(e1);
      setCurrentAlbum(active ?? null);

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

        {currentAlbum ? (
          <div className="border-2 border-retro-border p-6 mb-12 text-center">
            <h2 className="font-display text-3xl mb-2">{currentAlbum.title}</h2>
            <p className="text-sm mb-4">{currentAlbum.artist}</p>

            {(() => {
              const { embedUrl, openUrl } = getSpotifyUrls({
                spotify_id: currentAlbum.spotify_id,
                spotify_link: currentAlbum.spotify_link,
                title: currentAlbum.title,
                artist: currentAlbum.artist,
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
                  />
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
                      style={{ border: "none" }}
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

        {pastAlbums.length > 0 && (
          <div className="border-2 border-retro-border p-6 mb-12">
            <h3 className="font-display text-2xl text-retro-accent text-center mb-6">
              BISHERIGE ALBEN
            </h3>

            {pastAlbums[idx]?.cover_url && (
              <img
                src={pastAlbums[idx].cover_url}
                alt={`${pastAlbums[idx].title} Cover`}
                className="mx-auto mb-4 border-2 border-retro-border"
              />
            )}

            <h4 className="text-xl text-center font-semibold mb-1">
              {pastAlbums[idx].title}
              {(() => {
                const { openUrl } = getSpotifyUrls({
                  spotify_id: pastAlbums[idx].spotify_id,
                  spotify_link: pastAlbums[idx].spotify_link,
                  title: pastAlbums[idx].title,
                  artist: pastAlbums[idx].artist,
                });
                return (
                  <a
                    href={openUrl}
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
                );
              })()}
            </h4>

            <p className="text-sm text-center mb-4">
              {pastAlbums[idx].artist}
            </p>

            {majority && (
              <>
                <p className="text-center font-medium">
                  🏆 Mehrheitlich bewertet als: {majority.vote} ({majority.count}{" "}
                  Stimmen)
                </p>
                <GiphyGif verdict={majority.vote} />
              </>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setIdx((i) => Math.max(i - 1, 0))}
                disabled={idx === 0}
                className="px-4 py-2 bg-retro-accent text-white border-2 border-retro-border hover:bg-black transition disabled:opacity-50"
              >
                ◀ Vorheriges
              </button>
              <button
                onClick={() =>
                  setIdx((i) => Math.min(i + 1, pastAlbums.length - 1))
                }
                disabled={idx === pastAlbums.length - 1}
                className="px-4 py-2 bg-retro-accent text-white border-2 border-retro-border hover:bg-black transition disabled:opacity-50"
              >
                Nächstes ▶
              </button>
            </div>
          </div>
        )}

        <VorschlagForm />
      </div>
      <div className="pattern-bottom" />
    </main>
  );
}
