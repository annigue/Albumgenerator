"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/* 🔹 Spotify Embed oder Suchlink automatisch erzeugen */
function getSpotifyEmbedOrSearchLink(album) {
  if (!album?.spotify_id) {
    const query = encodeURIComponent(`${album.title} ${album.artist}`);
    return {
      embedUrl: `https://open.spotify.com/embed/search/${query}`,
      openUrl: `https://open.spotify.com/search/${query}`,
    };
  }

  return {
    embedUrl: `https://open.spotify.com/embed/album/${album.spotify_id}`,
    openUrl: `https://open.spotify.com/album/${album.spotify_id}`,
  };
}

/* 🔸 Bewertung */
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

  useEffect(() => setForm((f) => ({ ...f, albumtitel: albumTitel || "" })), [albumTitel]);
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    const { error } = await supabase.from("bewertungen").insert([form]);
    setSending(false);
    if (error) alert("Fehler beim Absenden 😢");
    else setOk(true);
  };

  if (ok)
    return <div className="text-center text-green-600 mt-4">✅ Danke für deine Bewertung!</div>;

  return (
    <form onSubmit={onSubmit} className="border-2 border-retro-border bg-retro-bg p-6 space-y-3 text-center">
      <h3 className="text-retro-accent font-display text-2xl mb-2 tracking-wide">ALBUM BEWERTEN</h3>

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

/* 🔸 Vorschlag */
function VorschlagForm() {
  const [form, setForm] = useState({
    name: "",
    albumtitel: "",
    interpret: "",
    begruendung: "",
  });
  const [ok, setOk] = useState(false);
  const [sending, setSending] = useState(false);
  const teilnehmer = ["Anne", "Moritz", "Max", "Kathi", "Lena"];
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      const { error } = await supabase.from("albums").insert([
        {
          title: form.albumtitel,
          artist: form.interpret,
          submitted_by: form.name,
          reason: form.begruendung,
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

  if (ok) return <div className="text-center text-green-600 mt-4">✅ Danke für deinen Vorschlag!</div>;

  return (
    <form onSubmit={onSubmit} className="border-2 border-retro-border bg-retro-bg p-6 mt-10 space-y-3 text-center">
      <h3 className="text-retro-accent font-display text-2xl mb-2 tracking-wide">NEUES ALBUM VORSCHLAGEN</h3>

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
        placeholder="Warum teilen?"
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

/* 🔸 Hauptseite */
export default function Home() {
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [pastAlbums, setPastAlbums] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    (async () => {
      // 🔹 Aktuelles Album
      const { data: active } = await supabase
        .from("albums")
        .select("*")
        .eq("is_active", true)
        .single();

      // 🔹 Vergangene Alben
      const { data: past } = await supabase
        .from("albums")
        .select("*")
        .neq("is_active", true)
        .order("created_at", { ascending: false });

      setCurrentAlbum(active);
      setPastAlbums(past || []);
    })();
  }, []);

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
            <h2 className="font-display text-3xl mb-2">{currentAlbum.title}</h2>
            <p className="text-sm mb-4">{currentAlbum.artist}</p>

            {/* Player oder Spotify-Suche */}
            {(() => {
              const { embedUrl, openUrl } = getSpotifyEmbedOrSearchLink(currentAlbum);
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
              <BewertungForm albumTitel={currentAlbum.title} />
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 italic mb-8">
            Noch kein Album der Woche vorhanden.
          </p>
        )}

        {/* 📚 Vergangene Alben */}
        {pastAlbums.length > 0 && (
          <div className="border-2 border-retro-border p-6 mb-12">
            <h3 className="font-display text-2xl text-retro-accent text-center mb-6">
              BISHERIGE ALBEN
            </h3>

            <h4 className="text-xl text-center font-semibold mb-1">
              {pastAlbums[currentIndex].title}
              {pastAlbums[currentIndex].spotify_id && (
                <a
                  href={`https://open.spotify.com/album/${pastAlbums[currentIndex].spotify_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block ml-2 align-middle"
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

            <p className="text-sm text-center mb-4">{pastAlbums[currentIndex].artist}</p>

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

        <VorschlagForm />
      </div>
      <div className="pattern-bottom" />
    </main>
  );
}
