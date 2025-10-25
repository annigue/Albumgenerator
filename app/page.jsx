"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/* 🎬 Giphy-Komponente */
function GiphyGif({ keyword }) {
  const [gifUrl, setGifUrl] = useState(null);
  const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;

  useEffect(() => {
    let cancelled = false;
    async function fetchGif() {
      try {
        const res = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(keyword)}&limit=25&rating=g`
        );
        const data = await res.json();
        if (!cancelled && data?.data?.length > 0) {
          const rnd = data.data[Math.floor(Math.random() * data.data.length)];
          setGifUrl(rnd.images.fixed_height.url);
        }
      } catch {
        setGifUrl(null);
      }
    }
    fetchGif();
    return () => (cancelled = true);
  }, [keyword, apiKey]);

  const fallback = {
    winner: "https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif",
    average: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
    "do not want": "https://media.giphy.com/media/3ohhwJ6DW9b0Nf3fUQ/giphy.gif",
  };
  const src = gifUrl || fallback[keyword] || fallback.average;

  return (
    <div className="flex justify-center mt-4">
      <img src={src} alt={`GIF: ${keyword}`} className="w-64 h-48 border-2 border-retro-border object-cover" />
    </div>
  );
}

/* 💬 Bewertungsformular */
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

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    const { error } = await supabase.from("bewertungen").insert([form]);
    setSending(false);
    if (error) return alert("Fehler beim Speichern: " + error.message);
    setOk(true);
    setForm({
      name: "",
      albumtitel: albumTitel || "",
      liebstes_lied: "",
      beste_textzeile: "",
      schlechtestes_lied: "",
      bewertung: "",
    });
  };

  if (ok) return <p className="text-green-600 text-center">✅ Danke für deine Bewertung!</p>;

  return (
    <form onSubmit={onSubmit} className="border-2 border-retro-border bg-retro-bg p-6 space-y-3">
      <h3 className="text-retro-accent font-display text-2xl text-center mb-4">ALBUM BEWERTEN</h3>

      <select name="name" value={form.name} onChange={onChange} required className="w-full border border-retro-border bg-transparent p-2">
        <option value="">Teilnehmer wählen</option>
        {teilnehmer.map((n) => <option key={n}>{n}</option>)}
      </select>

      <input name="albumtitel" value={form.albumtitel} onChange={onChange} placeholder="Albumtitel" className="w-full border border-retro-border bg-transparent p-2" required />
      <input name="liebstes_lied" value={form.liebstes_lied} onChange={onChange} placeholder="Liebstes Lied" className="w-full border border-retro-border bg-transparent p-2" />
      <textarea name="beste_textzeile" value={form.beste_textzeile} onChange={onChange} placeholder="Beste Textzeile" className="w-full border border-retro-border bg-transparent p-2" />
      <input name="schlechtestes_lied" value={form.schlechtestes_lied} onChange={onChange} placeholder="Schlechtestes Lied" className="w-full border border-retro-border bg-transparent p-2" />

      <select name="bewertung" value={form.bewertung} onChange={onChange} required className="w-full border border-retro-border bg-transparent p-2">
        <option value="">Bewertung wählen</option>
        <option>Hit</option>
        <option>Geht in Ordnung</option>
        <option>Niete</option>
      </select>

      <button type="submit" disabled={sending} className="w-full bg-retro-accent text-white py-2 font-display text-lg hover:bg-black transition">
        {sending ? "WIRD GESENDET…" : "SUBMIT"}
      </button>
    </form>
  );
}

/* 💡 Vorschlagformular */
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
    if (error) return alert("Fehler beim Speichern: " + error.message);
    setOk(true);
    setForm({ name: "", albumtitel: "", interpret: "", begruendung: "", spotify_link: "" });
  };

  if (ok) return <p className="text-green-600 text-center">✅ Danke für deinen Vorschlag!</p>;

  return (
    <form onSubmit={onSubmit} className="border-2 border-retro-border bg-retro-bg p-6 space-y-3">
      <h3 className="text-retro-accent font-display text-2xl text-center mb-4">NEUES ALBUM VORSCHLAGEN</h3>

      <select name="name" value={form.name} onChange={onChange} required className="w-full border border-retro-border bg-transparent p-2">
        <option value="">Teilnehmer wählen</option>
        {teilnehmer.map((n) => <option key={n}>{n}</option>)}
      </select>

      <input name="albumtitel" value={form.albumtitel} onChange={onChange} placeholder="Albumtitel" className="w-full border border-retro-border bg-transparent p-2" required />
      <input name="interpret" value={form.interpret} onChange={onChange} placeholder="Interpret" className="w-full border border-retro-border bg-transparent p-2" required />
      <textarea name="begruendung" value={form.begruendung} onChange={onChange} placeholder="Warum möchtest du das Album teilen?" className="w-full border border-retro-border bg-transparent p-2" />
      <input name="spotify_link" value={form.spotify_link} onChange={onChange} placeholder="Spotify-Link (optional)" className="w-full border border-retro-border bg-transparent p-2" />

      <button type="submit" disabled={sending} className="w-full bg-retro-accent text-white py-2 font-display text-lg hover:bg-black transition">
        {sending ? "WIRD GESENDET…" : "SUBMIT"}
      </button>
    </form>
  );
}

/* 🧩 Hauptseite */
export default function Home() {
  const [alben, setAlben] = useState([]);
  const [bewertungen, setBewertungen] = useState([]);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const { data: vorschlaege } = await supabase
          .from("vorschlaege")
          .select("*")
          .order("created_at", { ascending: false });
        const { data: reviews } = await supabase.from("bewertungen").select("*");
        setAlben(vorschlaege || []);
        setBewertungen(reviews || []);
      } catch (err) {
        console.error(err);
        setError("Fehler beim Laden der Daten");
      }
    })();
  }, []);

  if (error) return <p className="text-center text-red-500">{error}</p>;

  const albumOfTheDay = alben?.[0];
  const pastAlbums = alben?.slice(1) || [];
  const selectedAlbum = pastAlbums[currentIndex];

  return (
    <main className="bg-retro-bg text-retro-text min-h-screen">
      <div className="pattern-top" />
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-5xl font-display text-retro-accent text-center tracking-widest mb-8">ALBUM DER WOCHE</h1>

        {/* Aktuelles Album */}
        {albumOfTheDay ? (
          <div className="border-2 border-retro-border p-6 mb-12">
            <h2 className="font-display text-2xl mb-2 text-center">{albumOfTheDay.albumtitel}</h2>
            <p className="text-center text-sm mb-4">{albumOfTheDay.interpret}</p>
            {albumOfTheDay.spotify_link && (
              <iframe
                src={`https://open.spotify.com/embed/album/${albumOfTheDay.spotify_link.match(/album\/([a-zA-Z0-9]+)/)?.[1]}`}
                width="100%"
                height="352"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              ></iframe>
            )}
            <div className="mt-6">
              <BewertungForm albumTitel={albumOfTheDay.albumtitel} />
            </div>
          </div>
        ) : (
          <p className="text-center italic text-gray-500 mb-10">Noch kein Album eingetragen.</p>
        )}

        {/* Bisherige Alben */}
        {selectedAlbum && (
          <div className="border-2 border-retro-border p-6 mb-12">
            <h3 className="font-display text-2xl text-retro-accent text-center mb-6">BISHERIGE ALBEN</h3>

            <h4 className="text-xl font-semibold text-center mb-2">{selectedAlbum.albumtitel}</h4>
            <p className="text-center text-sm mb-4">{selectedAlbum.interpret}</p>

            {(() => {
              const reviews = bewertungen.filter((r) => r.albumtitel === selectedAlbum.albumtitel);
              if (reviews.length === 0) return <p className="text-center text-gray-500 italic">Noch keine Bewertungen.</p>;

              const counts = { Hit: 0, "Geht in Ordnung": 0, Niete: 0 };
              reviews.forEach((r) => {
                if (counts[r.bewertung] !== undefined) counts[r.bewertung]++;
              });
              const [topVote, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
              const keyword = topVote === "Hit" ? "winner" : topVote === "Geht in Ordnung" ? "average" : "do not want";

              return (
                <>
                  <p className="text-center font-medium mb-4">🏆 Mehrheitlich bewertet als: {topVote} ({topCount} Stimmen)</p>
                  <GiphyGif keyword={keyword} />
                </>
              );
            })()}

            <div className="flex justify-between mt-6">
              <button onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))} disabled={currentIndex === 0}
                className="px-4 py-2 bg-retro-accent text-white border-2 border-retro-border hover:bg-black">◀ Vorheriges</button>
              <button onClick={() => setCurrentIndex((i) => Math.min(i + 1, pastAlbums.length - 1))}
                disabled={currentIndex === pastAlbums.length - 1}
                className="px-4 py-2 bg-retro-accent text-white border-2 border-retro-border hover:bg-black">Nächstes ▶</button>
            </div>
          </div>
        )}

        <div className="mt-12">
          <VorschlagForm />
        </div>
      </div>
      <div className="pattern-bottom" />
    </main>
  );
}
