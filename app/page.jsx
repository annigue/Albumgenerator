"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔹 Supabase Client initialisieren
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 🔸 Spotify Helper Functions
async function fetchSpotifyAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${clientId}:${clientSecret}`),
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token;
}

async function fetchSpotifyLink(albumtitel, interpret) {
  try {
    const token = await fetchSpotifyAccessToken();
    const q = encodeURIComponent(`${albumtitel} ${interpret}`);
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${q}&type=album&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    return data.albums?.items?.[0]?.external_urls?.spotify || null;
  } catch (e) {
    console.error("Spotify-Fetch-Error:", e);
    return null;
  }
}

// 🔸 Album-ID aus verschiedenen Spotify-Link-Formaten extrahieren
async function extractSpotifyAlbumId(link) {
  if (!link) return null;
  // spotify:album:xxxx
  const uriMatch = link.match(/spotify:album:([a-zA-Z0-9]+)/);
  if (uriMatch) return uriMatch[1];
  // open.spotify.com/album/xxxx
  const urlMatch = link.match(/album\/([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];
  // spotify.link Kurzlink → redirect folgen
  if (link.includes("spotify.link")) {
    try {
      const res = await fetch(link, { method: "HEAD", redirect: "follow" });
      return res.url.match(/album\/([a-zA-Z0-9]+)/)?.[1] || null;
    } catch {
      return null;
    }
  }
  return null;
}

// 🔸 Spotify Player Komponente
function SpotifyPlayer({ link }) {
  const [albumId, setAlbumId] = useState(null);

  useEffect(() => {
    (async () => {
      const id = await extractSpotifyAlbumId(link);
      setAlbumId(id);
    })();
  }, [link]);

  if (!albumId) return null;

  return (
    <iframe
      src={`https://open.spotify.com/embed/album/${albumId}`}
      width="100%"
      height="352"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      className="border-2 border-retro-border"
    ></iframe>
  );
}


/* 🔹 Giphy GIF */
function GiphyGif({ keyword }) {
  const [gifUrl, setGifUrl] = useState(null);
  const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;

  useEffect(() => {
    let cancel = false;
    async function fetchGif() {
      try {
        const res = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(
            keyword
          )}&limit=10&rating=g`
        );
        const data = await res.json();
        if (!cancel && data.data.length > 0) {
          const rnd = data.data[Math.floor(Math.random() * data.data.length)];
          setGifUrl(rnd.images.fixed_height.url);
        }
      } catch {
        setGifUrl(null);
      }
    }
    fetchGif();
    return () => (cancel = true);
  }, [keyword, apiKey]);

  const fallback = {
    winner: "https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif",
    average: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
    "do not want": "https://media.giphy.com/media/3ohhwJ6DW9b0Nf3fUQ/giphy.gif",
  };

  return (
    <div className="flex justify-center mt-4">
      <img
        src={gifUrl || fallback[keyword]}
        alt={keyword}
        className="w-64 h-48 object-cover border-2 border-retro-border"
      />
    </div>
  );
}

/* 🔸 Bewertungsformular */
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

/* 🔸 Vorschlagformular mit Spotify-Auto-Fetch */
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

    let spotify_link = form.spotify_link;
    if (!spotify_link) {
      spotify_link = await fetchSpotifyLink(form.albumtitel, form.interpret);
    }

    const { error } = await supabase
      .from("vorschlaege")
      .insert([{ ...form, spotify_link }]);
    setSending(false);
    if (error) alert("Fehler beim Absenden 😢");
    else setOk(true);
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
        placeholder="Spotify-Link (optional)"
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

/* 🔹 Hauptseite */
export default function Home() {
  const [albums, setAlbums] = useState([]);
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [pastAlbums, setPastAlbums] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [coverUrl, setCoverUrl] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("vorschlaege")
        .select("*")
        .order("created_at", { ascending: false });
      if (!data) return;
      setAlbums(data);
      setCurrentAlbum(data[0]);
      setPastAlbums(data.slice(1));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const link = pastAlbums[currentIndex]?.spotify_link;
      const id = await extractSpotifyAlbumId(link);
      if (!id) return setCoverUrl(null);
      fetch(
        `https://open.spotify.com/oembed?url=https://open.spotify.com/album/${id}`
      )
        .then((r) => r.json())
        .then((d) => setCoverUrl(d.thumbnail_url))
        .catch(() => setCoverUrl(null));
    })();
  }, [pastAlbums, currentIndex]);

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
    <h2 className="font-display text-3xl mb-2">
      {currentAlbum.albumtitel}
    </h2>
    <p className="text-sm mb-4">{currentAlbum.interpret}</p>

    {currentAlbum.spotify_link && (
      <SpotifyPlayer link={currentAlbum.spotify_link} />
    )}

    <div className="mt-6">
      <BewertungForm albumTitel={currentAlbum.albumtitel} />
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

            {coverUrl && (
              <img
                src={coverUrl}
                alt="Cover"
                className="mx-auto mb-4 border-2 border-retro-border"
              />
            )}

            <h4 className="text-xl text-center font-semibold mb-1">
              {pastAlbums[currentIndex].albumtitel}
              {pastAlbums[currentIndex].spotify_link && (
                <a
                  href={pastAlbums[currentIndex].spotify_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block ml-2 align-middle"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
                    alt="Spotify"
                    className="w-5 h-5 inline-block border-none"
                  />
                </a>
              )}
            </h4>

            <p className="text-sm text-center mb-4">
              {pastAlbums[currentIndex].interpret}
            </p>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
                disabled={currentIndex === 0}
                className="px-4 py-2 bg-retro-accent text-white border-2 border-retro-border hover:bg-black transition disabled:opacity-50"
              >
                ◀ Vorheriges
              </button>
              <button
                onClick={() =>
                  setCurrentIndex((i) =>
                    Math.min(i + 1, pastAlbums.length - 1)
                  )
                }
                disabled={currentIndex === pastAlbums.length - 1}
                className="px-4 py-2 bg-retro-accent text-white border-2 border-retro-border hover:bg-black transition disabled:opacity-50"
              >
                Nächstes ▶
              </button>
            </div>
          </div>
        )}

        {/* ✨ Vorschlag-Formular */}
        <VorschlagForm />
      </div>
      <div className="pattern-bottom" />
    </main>
  );
}
