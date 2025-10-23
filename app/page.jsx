"use client";
import { useEffect, useState } from "react";

/* 🔹 Zufälliges Giphy-GIF mit Fallback */
function GiphyGif({ keyword }) {
  const [gifUrl, setGifUrl] = useState(null);
  const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;

  useEffect(() => {
    let cancelled = false;
    async function fetchGif() {
      try {
        if (!apiKey) throw new Error("GIPHY API key fehlt");
        const res = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(
            keyword
          )}&limit=25&rating=g`
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
      <img
        src={src}
        alt={`GIF: ${keyword}`}
        className="w-64 h-48 object-cover border-2 border-retro-border shadow-sm"
      />
    </div>
  );
}

/* 🔹 Bewertungsformular */
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

  useEffect(() => {
    setForm((f) => ({ ...f, Albumtitel: albumTitel || "" }));
  }, [albumTitel]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch(
        "https://script.google.com/macros/s/1e9tqcouyZDF-UKyZ0Ijxaf4t9xiaqSJ2wGUyxNkwa68/exec",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "bewertung", ...form }),
        }
      );
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
      } else {
        alert("Konnte nicht senden. Prüfe Apps Script URL & Berechtigungen.");
      }
    } catch (err) {
      console.error(err);
      alert("Fehler beim Senden.");
    } finally {
      setSending(false);
    }
  };

  if (ok)
    return (
      <div className="text-center text-green-700 font-medium mt-4">
        ✅ Danke für deine Bewertung!
      </div>
    );

  return (
    <form onSubmit={onSubmit} className="form-box">
      <h3 className="text-retro-accent font-display text-2xl mb-2 tracking-wide">
        💬 Album bewerten
      </h3>

      <select name="Name" value={form.Name} onChange={onChange} required>
        <option value="">Teilnehmer wählen</option>
        {teilnehmer.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      <input
        name="Albumtitel"
        value={form.Albumtitel}
        onChange={onChange}
        placeholder="Albumtitel"
        required
      />
      <input
        name="LiebstesLied"
        value={form.LiebstesLied}
        onChange={onChange}
        placeholder="Liebstes Lied"
      />
      <textarea
        name="BesteTextzeile"
        value={form.BesteTextzeile}
        onChange={onChange}
        placeholder="Beste Textzeile"
      />
      <input
        name="SchlechtestesLied"
        value={form.SchlechtestesLied}
        onChange={onChange}
        placeholder="Schlechtestes Lied"
      />

      <select
        name="Bewertung"
        value={form.Bewertung}
        onChange={onChange}
        required
      >
        <option value="">Gesamtbewertung wählen</option>
        <option value="Hit">Hit</option>
        <option value="Geht in Ordnung">Geht in Ordnung</option>
        <option value="Niete">Niete</option>
      </select>

      <button type="submit" disabled={sending}>
        {sending ? "Wird gesendet…" : "Bewertung abschicken"}
      </button>
    </form>
  );
}

/* 🔹 Neues Album vorschlagen */
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
      const res = await fetch(
        "https://script.google.com/macros/s/1yWK132EsYAtwzICd59QgljERW3dvorUtmwk-5m2aJ0E/exec",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "vorschlag", ...form }),
        }
      );
      const result = await res.json();
      if (result.status === "success") {
        setOk(true);
        setForm({
          Name: "",
          Albumtitel: "",
          Interpret: "",
          Begruendung: "",
          SpotifyLink: "",
        });
      }
    } catch (err) {
      console.error(err);
      alert("Fehler beim Absenden");
    } finally {
      setSending(false);
    }
  };

  if (ok)
    return (
      <div className="text-center text-green-700 font-medium mt-4">
        ✅ Danke für deinen Vorschlag!
      </div>
    );

  return (
    <form onSubmit={onSubmit} className="form-box">
      <h3 className="text-retro-accent font-display text-2xl mb-2 tracking-wide">
        💡 Neues Album vorschlagen
      </h3>

      <select name="Name" value={form.Name} onChange={onChange} required>
        <option value="">Teilnehmer wählen</option>
        {teilnehmer.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      <input
        name="Albumtitel"
        value={form.Albumtitel}
        onChange={onChange}
        placeholder="Albumtitel"
        required
      />
      <input
        name="Interpret"
        value={form.Interpret}
        onChange={onChange}
        placeholder="Interpret"
        required
      />
      <textarea
        name="Begruendung"
        value={form.Begruendung}
        onChange={onChange}
        placeholder="Warum möchtest du das Album teilen?"
      />
      <input
        name="SpotifyLink"
        value={form.SpotifyLink}
        onChange={onChange}
        placeholder="Spotify-Link (optional)"
      />

      <button type="submit" disabled={sending}>
        {sending ? "Wird gesendet..." : "Albumvorschlag abschicken"}
      </button>
    </form>
  );
}

/* 🔸 Hauptseite */
export default function Home() {
  const SHEET_ID = "1J2wNwi1T86IEIVPhqHD0WV8v1uWZ90ohz07irUlEF50";
  const SHEET_NAME = "Album des Tages";
  const SHEET_REVIEWS = "Formularantworten Bewertungen";

  const [albums, setAlbums] = useState([]);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [coverUrl, setCoverUrl] = useState(null);

  const parseCsv = (text) => {
    const rows = text
      .trim()
      .split(/\r?\n/)
      .map((line) =>
        line.split(/","|",|,"/).map((v) => v.replace(/^"+|"+$/g, "").trim())
      );
    const headers = rows.shift();
    return rows.map((row) =>
      Object.fromEntries(headers.map((h, i) => [h, row[i] || ""]))
    );
  };

  useEffect(() => {
    (async () => {
      try {
        const albumRes = await fetch(
          `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
            SHEET_NAME
          )}`
        );
        const albumsData = parseCsv(await albumRes.text());
        const revRes = await fetch(
          `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
            SHEET_REVIEWS
          )}`
        );
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

  const today = new Date();
  const isoToday = today.toISOString().slice(0, 10);
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

  const albumOfTheDay = albums.find((a) => formatDate(a?.Datum) === isoToday);
  const pastAlbums = albums
    .filter((a) => formatDate(a?.Datum) < isoToday)
    .sort((a, b) => new Date(formatDate(b.Datum)) - new Date(formatDate(a.Datum)));
  const selectedAlbum = pastAlbums[currentIndex];

  useEffect(() => {
    const link = selectedAlbum?.SpotifyLink || "";
    const m = link.match?.(/album\/([a-zA-Z0-9]+)/);
    const id = m ? m[1] : null;
    if (!id) return setCoverUrl(null);
    fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/album/${id}`)
      .then((r) => r.json())
      .then((d) => setCoverUrl(d.thumbnail_url))
      .catch(() => setCoverUrl(null));
  }, [selectedAlbum]);

  if (error)
    return <main className="p-8 text-center text-red-600">{error}</main>;
  if (albums.length === 0)
    return <main className="p-8 text-center text-gray-600">Lade Alben…</main>;

  return (
    <main className="min-h-screen bg-retro-bg text-retro-text p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-5xl font-display text-retro-accent text-center tracking-widest mb-6">
          ALBUM DER WOCHE
        </h1>

        {albumOfTheDay ? (
          <div className="form-box mb-10">
            <h2 className="text-xl font-display mb-2">
              {albumOfTheDay["Albumtitel"]}
            </h2>
            <p className="italic mb-4">{albumOfTheDay["Interpret"]}</p>
            {(() => {
              const m = albumOfTheDay["SpotifyLink"]?.match?.(/album\/([a-zA-Z0-9]+)/);
              const id = m ? m[1] : null;
              return id ? (
                <iframe
                  style={{ borderRadius: "12px" }}
                  src={`https://open.spotify.com/embed/album/${id}`}
                  width="100%"
                  height="352"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
              ) : null;
            })()}
            <div className="mt-6">
              <BewertungForm albumTitel={albumOfTheDay["Albumtitel"]} />
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 mb-8">
            Kein Album des Tages eingetragen.
          </p>
        )}

        {selectedAlbum && (
          <div className="form-box mb-10">
            <h3 className="text-2xl font-display mb-4">Bisherige Alben</h3>
            {coverUrl && (
              <img
                src={coverUrl}
                alt={`${selectedAlbum["Albumtitel"]} Cover`}
                className="w-48 h-48 border-2 border-retro-border mx-auto mb-3 object-cover"
              />
            )}
            <h4 className="text-lg font-semibold">{selectedAlbum["Albumtitel"]}</h4>
            <p className="italic mb-2">{selectedAlbum["Interpret"]}</p>

            {(() => {
              const list = selectedAlbum.reviews || [];
              if (!list.length) return null;
              const counts = { Hit: 0, "Geht in Ordnung": 0, Niete: 0 };
              list.forEach((r) => {
                const v = r["Gesamtbewertung"] || r["Bewertung"];
                if (counts[v] !== undefined) counts[v]++;
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
              return (
                <>
                  <p className="font-medium mt-2">
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
              >
                ◀ Vorheriges
              </button>
              <button
                onClick={() =>
                  setCurrentIndex((i) => Math.min(i + 1, pastAlbums.length - 1))
                }
                disabled={currentIndex === pastAlbums.length - 1}
              >
                Nächstes ▶
              </button>
            </div>
          </div>
        )}

        <VorschlagForm />
      </div>
    </main>
  );
}
