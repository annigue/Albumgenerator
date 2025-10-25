"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/* 🔹 Giphy GIF-Komponente */
function GiphyGif({ keyword }) {
  const [gifUrl, setGifUrl] = useState(null);
  const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;

  useEffect(() => {
    if (!apiKey) return;
    (async () => {
      try {
        const res = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(
            keyword
          )}&limit=25&rating=g`
        );
        const data = await res.json();
        if (data?.data?.length > 0) {
          const rnd = data.data[Math.floor(Math.random() * data.data.length)];
          setGifUrl(rnd.images.fixed_height.url);
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [keyword, apiKey]);

  const fallback = {
    winner: "https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif",
    average: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
    "do not want": "https://media.giphy.com/media/3ohhwJ6DW9b0Nf3fUQ/giphy.gif",
  };
  const src = gifUrl || fallback[keyword] || fallback.average;

  return (
    <div className="flex justify-center mt-4">
      <img
        src={src}
        alt={keyword}
        className="rounded-none border-2 border-retro-border w-64 h-48 object-cover"
      />
    </div>
  );
}

/* 🔸 Bewertungsformular */
function BewertungForm({ albumId, albumTitel }) {
  const teilnehmer = ["Anne", "Moritz", "Max", "Kathi", "Lena"];
  const [form, setForm] = useState({
    name: "",
    albumtitel: albumTitel || "",
    liebstes_lied: "",
    beste_textzeile: "",
    schlechtestes_lied: "",
    bewertung: "",
  });
  const [ok, setOk] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("bewertungen").insert([
      {
        name: form.name,
        albumtitel: form.albumtitel,
        album_id: albumId,
        liebstes_lied: form.liebstes_lied,
        beste_textzeile: form.beste_textzeile,
        schlechtestes_lied: form.schlechtestes_lied,
        bewertung: form.bewertung,
      },
    ]);
    if (error) {
      alert("Fehler beim Absenden 😢");
      console.error(error);
    } else {
      setOk(true);
    }
  };

  if (ok)
    return (
      <div className="text-center text-green-600 font-medium mt-4">
        ✅ Danke für deine Bewertung!
      </div>
    );

  return (
    <form
      onSubmit={onSubmit}
      className="border-2 border-retro-border bg-retro-bg p-6 text-center space-y-3"
    >
      <h3 className="text-retro-accent font-display text-2xl mb-2 tracking-wide">
        ALBUM BEWERTEN
      </h3>

      <select
        name="name"
        value={form.name}
        onChange={onChange}
        className="w-full border border-retro-border p-2 bg-transparent"
        required
      >
        <option value="">Teilnehmer wählen...</option>
        {teilnehmer.map((n) => (
          <option key={n}>{n}</option>
        ))}
      </select>

      <input
        name="liebstes_lied"
        value={form.liebstes_lied}
        onChange={onChange}
        placeholder="Liebstes Lied"
        className="w-full border border-retro-border p-2 bg-transparent"
      />

      <input
        name="beste_textzeile"
        value={form.beste_textzeile}
        onChange={onChange}
        placeholder="Beste Textzeile"
        className="w-full border border-retro-border p-2 bg-transparent"
      />

      <input
        name="schlechtestes_lied"
        value={form.schlechtestes_lied}
        onChange={onChange}
        placeholder="Schlechtestes Lied"
        className="w-full border border-retro-border p-2 bg-transparent"
      />

      <select
        name="bewertung"
        value={form.bewertung}
        onChange={onChange}
        className="w-full border border-retro-border p-2 bg-transparent"
        required
      >
        <option value="">Bewertung wählen...</option>
        <option>Hit</option>
        <option>Geht in Ordnung</option>
        <option>Niete</option>
      </select>

      <button
        type="submit"
        className="w-full bg-retro-accent text-white font-display text-xl py-2 hover:bg-black transition"
      >
        SUBMIT
      </button>
    </form>
  );
}

/* 🔸 Vorschlagformular */
function VorschlagForm() {
  const teilnehmer = ["Anne", "Moritz", "Max", "Kathi", "Lena"];
  const [form, setForm] = useState({
    name: "",
    title: "",
    artist: "",
    begruendung: "",
    spotify_link: "",
  });
  const [ok, setOk] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("albums").insert([
      {
        title: form.title,
        artist: form.artist,
        spotify_link: form.spotify_link,
        is_active: false,
      },
    ]);
    if (error) {
      alert("Fehler beim Vorschlagen 😢");
      console.error(error);
    } else {
      setOk(true);
    }
  };

  if (ok)
    return (
      <div className="text-center text-green-600 font-medium mt-4">
        ✅ Danke für deinen Vorschlag!
      </div>
    );

  return (
    <form
      onSubmit={onSubmit}
      className="border-2 border-retro-border bg-retro-bg p-6 text-center space-y-3"
    >
      <h3 className="text-retro-accent font-display text-2xl mb-2 tracking-wide">
        NEUES ALBUM VORSCHLAGEN
      </h3>

      <select
        name="name"
        value={form.name}
        onChange={onChange}
        className="w-full border border-retro-border p-2 bg-transparent"
        required
      >
        <option value="">Teilnehmer wählen...</option>
        {teilnehmer.map((n) => (
          <option key={n}>{n}</option>
        ))}
      </select>

      <input
        name="title"
        value={form.title}
        onChange={onChange}
        placeholder="Albumtitel"
        className="w-full border border-retro-border p-2 bg-transparent"
        required
      />

      <input
        name="artist"
        value={form.artist}
        onChange={onChange}
        placeholder="Interpret"
        className="w-full border border-retro-border p-2 bg-transparent"
        required
      />

      <textarea
        name="begruendung"
        value={form.begruendung}
        onChange={onChange}
        placeholder="Warum teilen?"
        className="w-full border border-retro-border p-2 bg-transparent"
        rows="2"
      />

      <input
        name="spotify_link"
        value={form.spotify_link}
        onChange={onChange}
        placeholder="Spotify-Link (optional)"
        className="w-full border border-retro-border p-2 bg-transparent"
      />

      <button
        type="submit"
        className="w-full bg-retro-accent text-white font-display text-xl py-2 hover:bg-black transition"
      >
        SUBMIT
      </button>
    </form>
  );
}

/* 🔹 Hauptseite */
export default function Home() {
  const [albums, setAlbums] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Daten laden
  useEffect(() => {
    (async () => {
      const { data: albumData } = await supabase
        .from("albums")
        .select("*")
        .order("date", { ascending: false });
      const { data: reviewData } = await supabase
        .from("bewertungen")
        .select("*");
      setAlbums(albumData || []);
      setReviews(reviewData || []);
      setLoading(false);
    })();
  }, []);

  if (loading)
    return (
      <main className="p-10 text-center text-gray-500">Lade Alben…</main>
    );

  const current = albums.find((a) => a.is_active);
  const past = albums.filter((a) => !a.is_active);

  return (
    <main className="bg-retro-bg text-retro-text min-h-screen">
      <div className="pattern-top" />
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-5xl font-display text-retro-accent text-center tracking-widest mb-8">
          ALBUM DER WOCHE
        </h1>

        {/* 🔸 Aktuelles Album */}
        {current ? (
          <div className="border-2 border-retro-border p-6 mb-12">
            <h2 className="font-display text-2xl mb-2 text-center">
              {current.title}
            </h2>
            <p className="text-center text-sm mb-4">{current.artist}</p>

            {current.spotify_link && (
              <iframe
                src={`https://open.spotify.com/embed/album/${
                  current.spotify_link.match(/album\/([a-zA-Z0-9]+)/)?.[1]
                }`}
                width="100%"
                height="352"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              ></iframe>
            )}

            <BewertungForm albumId={current.id} albumTitel={current.title} />
          </div>
        ) : (
          <p className="text-center text-gray-500 mb-10">
            Noch kein aktives Album 🎵
          </p>
        )}

        {/* 🔸 Vergangene Alben */}
        <h3 className="font-display text-2xl text-retro-accent text-center mb-6">
          BISHERIGE ALBEN
        </h3>

        {past.map((album) => {
          const albumReviews = reviews.filter(
            (r) => r.album_id === album.id
          );
          const counts = { Hit: 0, "Geht in Ordnung": 0, Niete: 0 };
          albumReviews.forEach((r) => {
            if (counts[r.bewertung] !== undefined) counts[r.bewertung]++;
          });
          const [topVote, topCount] = Object.entries(counts).sort(
            (a, b) => b[1] - a[1]
          )[0];
          const keyword =
            topVote === "Hit"
              ? "winner"
              : topVote === "Geht in Ordnung"
              ? "average"
              : "do not want";
          const id = album.spotify_link?.match(/album\/([a-zA-Z0-9]+)/)?.[1];

          return (
            <div
              key={album.id}
              className="border-2 border-retro-border p-4 mb-6"
            >
              {id && (
                <img
                  src={`https://i.scdn.co/image/${id}`}
                  alt={album.title}
                  className="mx-auto mb-4 border-2 border-retro-border"
                />
              )}
              <h4 className="text-xl font-semibold text-center mb-2 flex items-center justify-center gap-2">
                {album.title}
                {album.spotify_link && (
                  <a
                    href={album.spotify_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
                      alt="Spotify"
                      className="w-5 h-5 inline-block"
                    />
                  </a>
                )}
              </h4>
              <p className="text-center text-sm mb-4">{album.artist}</p>
              <p className="text-center font-medium">
                🏆 Mehrheitlich bewertet als: {topVote} ({topCount} Stimmen)
              </p>
              <GiphyGif keyword={keyword} />
            </div>
          );
        })}

        {/* 🔸 Neues Album vorschlagen */}
        <div className="mt-12">
          <VorschlagForm />
        </div>
      </div>
      <div className="pattern-bottom" />
    </main>
  );
}
