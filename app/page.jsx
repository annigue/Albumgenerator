"use client";
import { useEffect, useState } from "react";

/* 🔹 Giphy GIF Komponente */
function GiphyGif({ keyword }) {
  const [gifUrl, setGifUrl] = useState(null);
  const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;

  useEffect(() => {
    let cancelled = false;
    async function fetchGif() {
      try {
        if (!apiKey) throw new Error("GIPHY API key fehlt");
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
    return () => {
      cancelled = true;
    };
  }, [keyword, apiKey]);

  const fallback = {
    winner: "https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif",
    average: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
    "do not want": "https://media.giphy.com/media/3ohhwJ6DW9b0Nf3fUQ/giphy.gif",
  };

  const src = gifUrl || fallback[keyword] || fallback.average;
  return (
    <div className="flex justify-center mt-4">
      <img src={src} alt={`GIF: ${keyword}`} className="rounded-none border-2 border-retro-border shadow-sm w-64 h-48 object-cover" />
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
  const [ok, setOk] = useState(false);
  const [sending, setSending] = useState(false);
  const teilnehmer = ["Anne", "Moritz", "Max", "Kathi", "Lena"];

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("https://script.google.com/macros/s/1e9tqcouyZDF-UKyZ0Ijxaf4t9xiaqSJ2wGUyxNkwa68/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "bewertung", ...form }),
      });
      const result = await res.json().catch(() => ({}));
      if (result?.status === "success" || res.ok) {
        setOk(true);
        setForm({
          Name: "",
          Albumtitel: albumTitel || "",
          LiebstesLied: "",
          BesteTextzeile: "",
          SchlechtestesLied: "",
          Bewertung: "",
        });
      } else alert("Fehler beim Senden.");
    } catch (err) {
      console.error(err);
      alert("Fehler beim Absenden");
    } finally {
      setSending(false);
    }
  };

  if (ok)
    return <div className="text-center text-green-600 font-medium mt-4">✅ Danke für deine Bewertung!</div>;

  return (
    <form onSubmit={onSubmit}>
      <h3 className="text-retro-accent font-display text-2xl text-center mb-4">
        ALBUM BEWERTEN
      </h3>

      <div className="form-group">
        <label htmlFor="Name">Teilnehmer</label>
        <select name="Name" id="Name" value={form.Name} onChange={onChange} required>
          <option value="">Wählen...</option>
          {teilnehmer.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="Albumtitel">Albumtitel</label>
        <input name="Albumtitel" id="Albumtitel" value={form.Albumtitel} onChange={onChange} required />
      </div>

      <div className="form-group">
        <label htmlFor="LiebstesLied">Liebstes Lied</label>
        <input name="LiebstesLied" id="LiebstesLied" value={form.LiebstesLied} onChange={onChange} />
      </div>

      <div className="form-group">
        <label htmlFor="BesteTextzeile">Beste Textzeile</label>
        <textarea name="BesteTextzeile" id="BesteTextzeile" rows="2" value={form.BesteTextzeile} onChange={onChange} />
      </div>

      <div className="form-group">
        <label htmlFor="SchlechtestesLied">Schlechtestes Lied</label>
        <input name="SchlechtestesLied" id="SchlechtestesLied" value={form.SchlechtestesLied} onChange={onChange} />
      </div>

      <div className="form-group">
        <label htmlFor="Bewertung">Bewertung</label>
        <select name="Bewertung" id="Bewertung" value={form.Bewertung} onChange={onChange} required>
          <option value="">Wählen...</option>
          <option value="Hit">Hit</option>
          <option value="Geht in Ordnung">Geht in Ordnung</option>
          <option value="Niete">Niete</option>
        </select>
      </div>

      <button type="submit" disabled={sending}>
        {sending ? "WIRD GESENDET…" : "SUBMIT"}
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
  const [ok, setOk] = useState(false);
  const [sending, setSending] = useState(false);
  const teilnehmer = ["Anne", "Moritz", "Max", "Kathi", "Lena"];

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("https://script.google.com/macros/s/1yWK132EsYAtwzICd59QgljERW3dvorUtmwk-5m2aJ0E/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "vorschlag", ...form }),
      });
      const result = await res.json();
      if (result.status === "success") {
        setOk(true);
        setForm({ Name: "", Albumtitel: "", Interpret: "", Begruendung: "", SpotifyLink: "" });
      }
    } catch (err) {
      console.error(err);
      alert("Fehler beim Absenden");
    } finally {
      setSending(false);
    }
  };

  if (ok)
    return <div className="text-center text-green-600 font-medium mt-4">✅ Danke für deinen Vorschlag!</div>;

  return (
    <form onSubmit={onSubmit}>
      <h3 className="text-retro-accent font-display text-2xl text-center mb-4">
        NEUES ALBUM VORSCHLAGEN
      </h3>

      <div className="form-group">
        <label htmlFor="Name">Teilnehmer</label>
        <select name="Name" id="Name" value={form.Name} onChange={onChange} required>
          <option value="">Wählen...</option>
          {teilnehmer.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="Albumtitel">Albumtitel</label>
        <input name="Albumtitel" id="Albumtitel" value={form.Albumtitel} onChange={onChange} required />
      </div>

      <div className="form-group">
        <label htmlFor="Interpret">Interpret</label>
        <input name="Interpret" id="Interpret" value={form.Interpret} onChange={onChange} required />
      </div>

      <div className="form-group">
        <label htmlFor="Begruendung">Warum teilen?</label>
        <textarea name="Begruendung" id="Begruendung" rows="2" value={form.Begruendung} onChange={onChange} />
      </div>

      <div className="form-group">
        <label htmlFor="SpotifyLink">Spotify-Link (optional)</label>
        <input name="SpotifyLink" id="SpotifyLink" value={form.SpotifyLink} onChange={onChange} />
      </div>

      <button type="submit" disabled={sending}>
        {sending ? "WIRD GESENDET…" : "SUBMIT"}
      </button>
    </form>
  );
}

/* 🔹 Hauptseite */
export default function Home() {
  const SHEET_ID = "1J2wNwi1T86IEIVPhqHD0WV8v1uWZ90ohz07irUlEF50";
  const SHEET_NAME = "Album des Tages";
  const SHEET_REVIEWS = "Formularantworten Bewertungen";

  const [albums, setAlbums] = useState([]);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [coverUrl, setCoverUrl] = useState(null);

  // CSV-Parser
  const parseCsv = (text) => {
    const rows = text.trim().split(/\r?\n/).map((line) => line.split(/","|",|,"/).map((v) => v.replace(/^"+|"+$/g, "").trim()));
    const headers = rows.shift();
    return rows.map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i] || ""])));
  };

  // Daten laden
  useEffect(() => {
    (async () => {
      try {
        const albumRes = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`);
        const albumsData = parseCsv(await albumRes.text());
        const revRes = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_REVIEWS)}`);
        const reviewsData = parseCsv(await revRes.text());
        const merged = albumsData.map((a) => ({
          ...a,
          reviews: reviewsData.filter((r) => r.Albumtitel === a.Albumtitel),
        }));
        setAlbums(merged);
      } catch (e) {
        console.error(e);
        setError("Fehler beim Laden der Daten");
      }
    })();
  }, []);

  // Datum formatieren
  const today = new Date().toISOString().slice(0, 10);
  const formatDate = (d) => {
    if (!d) return "";
    const parsed = new Date(d);
    if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10);
    const parts = String(d).split(".");
    if (parts.length === 3) {
      const [tag, monat, jahr] = parts.map((p) => p.padStart(2, "0"));
      return `${jahr}-${monat}-${tag}`;
    }
    return "";
  };

  const albumOfTheDay = albums.find((a) => formatDate(a?.Datum) === today);
  const pastAlbums = albums.filter((a) => formatDate(a?.Datum) < today).sort((a, b) => new Date(formatDate(b.Datum)) - new Date(formatDate(a.Datum)));
  const selectedAlbum = pastAlbums[currentIndex];

  // Cover laden
  useEffect(() => {
    const link = selectedAlbum?.SpotifyLink || "";
    const id = link.match(/album\/([a-zA-Z0-9]+)/)?.[1];
    if (!id) return setCoverUrl(null);
    fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/album/${id}`)
      .then((r) => r.json())
      .then((d) => setCoverUrl(d.thumbnail_url))
      .catch(() => setCoverUrl(null));
  }, [selectedAlbum]);

  if (error) return <main className="p-8 text-center text-red-600">{error}</main>;
  if (albums.length === 0) return <main className="p-8 text-center text-gray-600">Lade Alben…</main>;

  return (
    <main className="bg-retro-bg text-retro-text min-h-screen">
      <div className="pattern-top" />
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-5xl font-display text-retro-accent text-center tracking-widest mb-8">
          ALBUM DER WOCHE
        </h1>

        {/* Heutiges Album */}
        {albumOfTheDay ? (
          <div className="border-2 border-retro-border p-6 mb-12">
            <h2 className="font-display text-2xl mb-2 text-center">
              {albumOfTheDay["Albumtitel"]}
            </h2>
            <p className="text-center text-sm mb-4">{albumOfTheDay["Interpret"]}</p>
            {albumOfTheDay["SpotifyLink"] && (
              <iframe
                style={{ border: "2px solid #000" }}
                src={`https://open.spotify.com/embed/album/${albumOfTheDay["SpotifyLink"].match(/album\/([a-zA-Z0-9]+)/)?.[1]}`}
                width="100%"
                height="352"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              ></iframe>
            )}
            <div className="mt-6">
              <BewertungForm albumTitel={albumOfTheDay["Albumtitel"]} />
            </div>
          </div>
        ) : (
          <p className="text-center italic text-gray-500 mb-10">Für heute ist noch kein Album eingetragen.</p>
        )}

        {/* Vergangene Alben */}
        {selectedAlbum && (
          <div className="border-2 border-retro-border p-6 mb-12">
            <h3 className="font-display text-2xl text-retro-accent text-center mb-6">
              BISHERIGE ALBEN
            </h3>
            {coverUrl && (
              <img src={coverUrl} alt={selectedAlbum["Albumtitel"]} className="mx-auto mb-4 border-2 border-retro-border" />
            )}
            <h4 className="text-xl font-semibold text-center mb-2">{selectedAlbum["Albumtitel"]}</h4>
            <p className="text-center text-sm mb-4">{selectedAlbum["Interpret"]}</p>

            {(() => {
              const list = selectedAlbum.reviews || [];
              if (list.length === 0) return null;
              const counts = { Hit: 0, "Geht in Ordnung": 0, Niete: 0 };
              list.forEach((r) => {
                const v = r["Gesamtbewertung"] || r["Bewertung"];
                if (counts[v] !== undefined) counts[v]++;
              });
              const [topVote, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
              const keyword =
                topVote === "Hit" ? "winner" : topVote === "Geht in Ordnung" ? "average" : "do not want";
              return (
                <>
                  <p className="text-center font-medium mb-4">
                    🏆 Mehrheitlich bewertet als: {topVote} ({topCount} Stimmen)
                  </p>
                  <GiphyGif keyword={keyword} />
                </>
              );
            })()}

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
                disabled={currentIndex === 0}
                className="px-4 py-2 bg-retro-accent text-white border-2 border-retro-border hover:bg-black"
              >
                ◀ Vorheriges
              </button>
              <button
                onClick={() => setCurrentIndex((i) => Math.min(i + 1, pastAlbums.length - 1))}
                disabled={currentIndex === pastAlbums.length - 1}
                className="px-4 py-2 bg-retro-accent text-white border-2 border-retro-border hover:bg-black"
              >
                Nächstes ▶
              </button>
            </div>
          </div>
        )}

        {/* Vorschlag-Formular */}
        <div className="mt-12">
          <VorschlagForm />
        </div>
      </div>
      <div className="pattern-bottom" />
    </main>
  );
}
