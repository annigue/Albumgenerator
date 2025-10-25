"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

/* 🔹 Supabase Setup */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/* 🔹 Giphy GIF */
function GiphyGif({ keyword }) {
  const [gifUrl, setGifUrl] = useState(null);
  const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;

  useEffect(() => {
    if (!keyword) return;
    async function fetchGif() {
      try {
        const res = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(
            keyword
          )}&limit=20&rating=g`
        );
        const data = await res.json();
        if (data.data?.length > 0) {
          const random = data.data[Math.floor(Math.random() * data.data.length)];
          setGifUrl(random.images.fixed_height.url);
        }
      } catch (err) {
        console.error("GIF Fetch Error:", err);
      }
    }
    fetchGif();
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
        alt="Stimmungs-GIF"
        className="w-64 h-48 object-cover border-2 border-retro-border shadow-sm"
      />
    </div>
  );
}

/* 🔸 Bewertungsformular */
function BewertungForm({ albumTitel }) {
  const [form, setForm] = useState({
    Name: "",
    Albumtitel: albumTitel || "",
    LiebstesLied: "",
    BesteTextzeile: "",
    SchlechtestesLied: "",
    Bewertung: "",
  });
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);

  const teilnehmer = ["Anne", "Moritz", "Max", "Kathi", "Lena"];

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { error } = await supabase.from("bewertungen").insert([form]);
      if (error) throw error;
      setOk(true);
    } catch (err) {
      console.error(err);
      alert("Fehler beim Senden der Bewertung");
    } finally {
      setSending(false);
    }
  };

  if (ok)
    return (
      <div className="text-center text-green-600 font-semibold mt-4">
        ✅ Danke für deine Bewertung!
      </div>
    );

  return (
    <form
      onSubmit={onSubmit}
      className="border-2 border-retro-border bg-retro-bg p-6 shadow-sm space-y-3"
    >
      <h3 className="text-retro-accent font-display text-2xl mb-2 text-center">
        ALBUM BEWERTEN
      </h3>

      <select
        name="Name"
        value={form.Name}
        onChange={onChange}
        required
        className="w-full border border-retro-border p-2 bg-transparent"
      >
        <option value="">Teilnehmer wählen</option>
        {teilnehmer.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>

      <input
        name="Albumtitel"
        value={form.Albumtitel}
        onChange={onChange}
        placeholder="Albumtitel"
        required
        className="w-full border border-retro-border p-2 bg-transparent"
      />

      <input
        name="LiebstesLied"
        value={form.LiebstesLied}
        onChange={onChange}
        placeholder="Liebstes Lied"
        className="w-full border border-retro-border p-2 bg-transparent"
      />

      <textarea
        name="BesteTextzeile"
        value={form.BesteTextzeile}
        onChange={onChange}
        placeholder="Beste Textzeile"
        rows="2"
        className="w-full border border-retro-border p-2 bg-transparent"
      />

      <input
        name="SchlechtestesLied"
        value={form.SchlechtestesLied}
        onChange={onChange}
        placeholder="Schlechtestes Lied"
        className="w-full border border-retro-border p-2 bg-transparent"
      />

      <select
        name="Bewertung"
        value={form.Bewertung}
        onChange={onChange}
        required
        className="w-full border border-retro-border p-2 bg-transparent"
      >
        <option value="">Gesamtbewertung</option>
        <option value="Hit">Hit</option>
        <option value="Geht in Ordnung">Geht in Ordnung</option>
        <option value="Niete">Niete</option>
      </select>

      <button
        type="submit"
        disabled={sending}
        className="w-full bg-retro-accent text-white py-2 hover:bg-black transition"
      >
        {sending ? "Wird gesendet…" : "Absenden"}
      </button>
    </form>
  );
}

/* 🔸 Vorschlagformular */
function VorschlagForm() {
  const [form, setForm] = useState({
    Name: "",
    Albumtitel: "",
    Interpret: "",
    Begruendung: "",
    SpotifyLink: "",
  });
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);

  const teilnehmer = ["Anne", "Moritz", "Max", "Kathi", "Lena"];

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      let spotifyLink = form.SpotifyLink;

      // 🔎 Spotify automatisch suchen, wenn kein Link angegeben
      if (!spotifyLink && form.Albumtitel && form.Interpret) {
        const res = await fetch("/api/spotify-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            albumtitel: form.Albumtitel,
            interpret: form.Interpret,
          }),
        });
        const data = await res.json();
        spotifyLink = data.spotifyLink || "";
      }

      // 📦 Speichern in Supabase
      const { error } = await supabase.from("albums").insert([
        {
          name: form.Name,
          albumtitel: form.Albumtitel,
          interpret: form.Interpret,
          begruendung: form.Begruendung,
          spotify_link: spotifyLink || null,
        },
      ]);
      if (error) throw error;
      setOk(true);
    } catch (err) {
      console.error(err);
      alert("Fehler beim Speichern oder Spotify-Suche");
    } finally {
      setSending(false);
    }
  };

  if (ok)
    return (
      <div className="text-center text-green-600 font-semibold mt-4">
        ✅ Danke für deinen Vorschlag!
      </div>
    );

  return (
    <form
      onSubmit={onSubmit}
      className="border-2 border-retro-border bg-retro-bg p-6 shadow-sm space-y-3"
    >
      <h3 className="text-retro-accent font-display text-2xl text-center mb-2">
        NEUES ALBUM VORSCHLAGEN
      </h3>

      <select
        name="Name"
        value={form.Name}
        onChange={onChange}
        required
        className="w-full border border-retro-border p-2 bg-transparent"
      >
        <option value="">Teilnehmer wählen</option>
        {teilnehmer.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>

      <input
        name="Albumtitel"
        value={form.Albumtitel}
        onChange={onChange}
        placeholder="Albumtitel"
        required
        className="w-full border border-retro-border p-2 bg-transparent"
      />

      <input
        name="Interpret"
        value={form.Interpret}
        onChange={onChange}
        placeholder="Interpret"
        required
        className="w-full border border-retro-border p-2 bg-transparent"
      />

      <textarea
        name="Begruendung"
        value={form.Begruendung}
        onChange={onChange}
        placeholder="Warum teilen?"
        rows="2"
        className="w-full border border-retro-border p-2 bg-transparent"
      />

      <input
        name="SpotifyLink"
        value={form.SpotifyLink}
        onChange={onChange}
        placeholder="Spotify-Link (optional)"
        className="w-full border border-retro-border p-2 bg-transparent"
      />

      <button
        type="submit"
        disabled={sending}
        className="w-full bg-retro-accent text-white py-2 hover:bg-black transition"
      >
        {sending ? "Wird gesendet…" : "Absenden"}
      </button>
    </form>
  );
}

/* 🔹 Hauptseite */
export default function Home() {
  const [albums, setAlbums] = useState([]);
  const [bewertungen, setBewertungen] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: albumsData } = await supabase
        .from("albums")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: bewertungenData } = await supabase
        .from("bewertungen")
        .select("*");

      setAlbums(albumsData || []);
      setBewertungen(bewertungenData || []);
    })();
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const albumOfTheDay = albums.find(
    (a) => a.datum === today || a.is_today === true
  );
  const pastAlbums = albums.filter((a) => !a.is_today);

  const selectedAlbum = pastAlbums[currentIndex];
  const albumReviews = bewertungen.filter(
    (b) => b.Albumtitel === selectedAlbum?.albumtitel
  );

  return (
    <main className="bg-retro-bg text-retro-text min-h-screen">
      <div className="pattern-top" />
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-5xl font-display text-retro-accent text-center tracking-widest mb-8">
          ALBUM DER WOCHE
        </h1>

        {/* 🎵 Aktuelles Album */}
        {albumOfTheDay ? (
          <div className="border-2 border-retro-border p-6 mb-12">
            <h2 className="text-2xl font-display text-center mb-2">
              {albumOfTheDay.albumtitel}
            </h2>
            <p className="text-center mb-4">{albumOfTheDay.interpret}</p>

            {albumOfTheDay.spotify_link && (
              <iframe
                src={`https://open.spotify.com/embed/album/${albumOfTheDay.spotify_link.split("album/")[1]
                  }`}
                width="100%"
                height="352"
                style={{ borderRadius: "0" }}
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              ></iframe>
            )}

            <BewertungForm albumTitel={albumOfTheDay.albumtitel} />
          </div>
        ) : (
          <p className="text-center italic">Noch kein Album eingetragen.</p>
        )}

        {/* 🪩 Bisherige Alben */}
        {selectedAlbum && (
          <div className="border-2 border-retro-border p-6">
            {selectedAlbum.cover_url && (
              <img
                src={selectedAlbum.cover_url}
                alt="Albumcover"
                className="mx-auto mb-4 border-2 border-retro-border"
              />
            )}
            <h3 className="text-2xl font-display text-center mb-2">
              {selectedAlbum.albumtitel}
              {selectedAlbum.spotify_link && (
                <a
                  href={selectedAlbum.spotify_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-block align-middle"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
                    alt="Spotify"
                    className="w-5 h-5 inline-block"
                  />
                </a>
              )}
            </h3>
            <p className="text-center mb-4">{selectedAlbum.interpret}</p>

            {albumReviews.length > 0 && (
              <>
                <p className="text-center text-sm mb-2">
                  🏆 Mehrheitlich bewertet als:{" "}
                  {(() => {
                    const counts = albumReviews.reduce(
                      (acc, r) => ({
                        ...acc,
                        [r.Bewertung]: (acc[r.Bewertung] || 0) + 1,
                      }),
                      {}
                    );
                    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
                  })()}
                </p>
                <GiphyGif keyword="winner" />
              </>
            )}
          </div>
        )}

        {/* 📬 Vorschlag */}
        <div className="mt-12">
          <VorschlagForm />
        </div>
      </div>
      <div className="pattern-bottom" />
    </main>
  );
}
