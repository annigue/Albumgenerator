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
    return () => { cancelled = true; };
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
        className="rounded-xl shadow-md w-64 h-48 object-cover border border-pink-100"
      />
    </div>
  );
}

/* 🔹 Einfaches Bewertungsformular (Variante 2) */
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

  useEffect(() => {
    // Falls das Album im Parent wechselt, Formularfeld mitziehen
    setForm((f) => ({ ...f, Albumtitel: albumTitel || "" }));
  }, [albumTitel]);

  const onChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("https://script.google.com/macros/s/DEIN_SCRIPT_ID/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      } else {
        alert("Konnte nicht senden. Prüfe Apps Script Web-App URL & Berechtigungen.");
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
      <div className="text-center text-green-600 font-medium mt-4">
        ✅ Danke für deine Bewertung!
      </div>
    );

  return (
    <form onSubmit={onSubmit} className="bg-white p-5 rounded-xl shadow-inner border space-y-3">
      <h3 className="text-center font-semibold">💬 Album bewerten</h3>

      <input
        name="Name"
        value={form.Name}
        onChange={onChange}
        placeholder="Dein Name"
        className="w-full border rounded-lg p-2"
        required
      />
      <input
        name="Albumtitel"
        value={form.Albumtitel}
        onChange={onChange}
        placeholder="Albumtitel"
        className="w-full border rounded-lg p-2"
        required
      />
      <input
        name="LiebstesLied"
        value={form.LiebstesLied}
        onChange={onChange}
        placeholder="Liebstes Lied"
        className="w-full border rounded-lg p-2"
      />
      <textarea
        name="BesteTextzeile"
        value={form.BesteTextzeile}
        onChange={onChange}
        placeholder="Beste Textzeile"
        className="w-full border rounded-lg p-2"
      />
      <input
        name="SchlechtestesLied"
        value={form.SchlechtestesLied}
        onChange={onChange}
        placeholder="Schlechtestes Lied"
        className="w-full border rounded-lg p-2"
      />
      <select
        name="Bewertung"
        value={form.Bewertung}
        onChange={onChange}
        className="w-full border rounded-lg p-2"
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
        className="w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition"
      >
        {sending ? "Wird gesendet…" : "Bewertung abschicken"}
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

  // CSV → Array of objects
  const parseCsv = (text) => {
    const rows = text
      .trim()
      .split(/\r?\n/)
      .map((line) => line.split(/","|",|,"/).map((v) => v.replace(/^"+|"+$/g, "").trim()));
    const headers = rows.shift();
    return rows.map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i] || ""])));
  };

  // 🔹 Daten laden
  useEffect(() => {
    (async () => {
      try {
        // Alben
        const albumRes = await fetch(
          `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
            SHEET_NAME
          )}`
        );
        const albumsData = parseCsv(await albumRes.text());

        // Bewertungen
        const revRes = await fetch(
          `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
            SHEET_REVIEWS
          )}`
        );
        const reviewsData = parseCsv(await revRes.text());

        // Mergen
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

  // 🔹 Auswahl & Stichtage
  const todayStr = new Date().toISOString().slice(0, 10);
  const albumOfTheDay = albums.find((a) => a.Datum === todayStr);
  const pastAlbums = albums
    .filter((a) => a.Datum < todayStr)
    .sort((a, b) => new Date(b.Datum) - new Date(a.Datum));
  const selectedAlbum = pastAlbums[currentIndex];

  // 🔹 Cover vom ausgewählten vergangenen Album
  useEffect(() => {
    if (!selectedAlbum?.SpotifyLink) return setCoverUrl(null);
    const m = selectedAlbum.SpotifyLink.match(/album\/([a-zA-Z0-9]+)/);
    const id = m ? m[1] : null;
    if (!id) return setCoverUrl(null);
    fetch(`https://open.spotify.com/oembed?url=https://open.spotify.com/album/${id}`)
      .then((r) => r.json())
      .then((d) => setCoverUrl(d.thumbnail_url))
      .catch(() => setCoverUrl(null));
  }, [selectedAlbum]);

  // 🔹 Lade/Fehlerzustand
  if (error) return <main className="p-8 text-center text-red-600">{error}</main>;
  if (albums.length === 0)
    return <main className="p-8 text-center text-gray-600">Lade Alben…</main>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-6 text-gray-800">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">🎵 Schnaggile – Album des Tages</h1>

        {/* 🎧 Heutiges Album */}
        {albumOfTheDay ? (
          <div className="bg-white p-6 rounded-2xl shadow-md mb-10 text-center">
            <h2 className="text-xl font-semibold mb-2 flex justify-center items-center space-x-2">
              <span>{albumOfTheDay["Albumtitel"]}</span>
              {albumOfTheDay["SpotifyLink"] && (
                <a
                  href={albumOfTheDay["SpotifyLink"]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block opacity-80 hover:opacity-100 transition"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
                    alt="Spotify"
                    className="w-5 h-5"
                  />
                </a>
              )}
            </h2>
            <p className="text-gray-600 mb-4">{albumOfTheDay["Interpret"]}</p>

            {/* Spotify Embed */}
            {albumOfTheDay["SpotifyLink"] && (() => {
              const m = albumOfTheDay["SpotifyLink"].match(/album\/([a-zA-Z0-9]+)/);
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

            {albumOfTheDay["Dein Name"] && (
              <p className="mt-4 text-sm text-gray-500">
                Vorgeschlagen von {albumOfTheDay["Dein Name"]}
              </p>
            )}
            {albumOfTheDay["Warum möchtest du das Album teilen?"] && (
              <p className="mt-2 italic text-gray-600">
                „{albumOfTheDay["Warum möchtest du das Album teilen?"]}“
              </p>
            )}

            {/* Formular unter dem heutigen Album */}
            <div className="mt-6">
              <BewertungForm albumTitel={albumOfTheDay["Albumtitel"]} />
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 mb-8">Für heute ist noch kein Album eingetragen.</p>
        )}

        {/* 📚 Vergangene Alben */}
        <h3 className="text-lg font-semibold mb-4 text-center">📚 Bisherige Alben</h3>
        {selectedAlbum ? (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex flex-col items-center mb-4">
              {coverUrl && (
                <img
                  src={coverUrl}
                  alt={`${selectedAlbum["Albumtitel"]} Cover`}
                  className="w-48 h-48 rounded-xl shadow-md mb-3 object-cover"
                />
              )}

              {/* Titel + Spotify-Icon */}
              <h4 className="text-xl font-semibold flex items-center justify-center space-x-2 mb-1">
                <span>{selectedAlbum["Albumtitel"]}</span>
                {selectedAlbum["SpotifyLink"] && (
                  <a
                    href={selectedAlbum["SpotifyLink"]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-80 hover:opacity-100"
                  >
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
                      alt="Spotify"
                      className="w-5 h-5"
                    />
                  </a>
                )}
              </h4>
              <p className="text-center text-gray-500 mb-2">{selectedAlbum["Interpret"]}</p>

              {/* 🏆 Mehrheits-Ergebnis + GIF */}
              {(() => {
                const list = selectedAlbum.reviews || [];
                if (list.length === 0) return null;

                const counts = { Hit: 0, "Geht in Ordnung": 0, Niete: 0 };
                list.forEach((r) => {
                  const v = r["Gesamtbewertung"] || r["Bewertung"];
                  if (counts[v] !== undefined) counts[v]++;
                });
                const [topVote, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

                const colors = {
                  Hit: "text-green-600",
                  "Geht in Ordnung": "text-yellow-600",
                  Niete: "text-pink-600",
                };

                const keyword =
                  topVote === "Hit" ? "winner" : topVote === "Geht in Ordnung" ? "average" : "do not want";

                return (
                  <>
                    <p className={`text-sm font-medium ${colors[topVote]}`}>
                      🏆 Mehrheitlich bewertet als: {topVote} ({topCount} Stimmen)
                    </p>
                    <GiphyGif keyword={keyword} />
                  </>
                );
              })()}
            </div>

            {/* 💬 Bewertungs-Tabelle */}
            <h5 className="font-semibold mb-2">💬 Bewertungen</h5>
            {selectedAlbum.reviews?.length ? (
              <table className="min-w-full text-sm border-t">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-2 text-left">Teilnehmer</th>
                    <th className="py-2 px-2 text-left">Liebstes Lied</th>
                    <th className="py-2 px-2 text-left">Beste Textzeile</th>
                    <th className="py-2 px-2 text-left">Schlechtestes Lied</th>
                    <th className="py-2 px-2 text-left">Bewertung</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAlbum.reviews.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-2 px-2">{r["Name"]}</td>
                      <td className="py-2 px-2">{r["Liebstes Lied"]}</td>
                      <td className="py-2 px-2 italic">{r["Beste Textzeile"]}</td>
                      <td className="py-2 px-2">{r["Schlechtestes Lied"]}</td>
                      <td className="py-2 px-2">{r["Gesamtbewertung"] || r["Bewertung"]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500 italic">Noch keine Bewertungen vorhanden.</p>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
                disabled={currentIndex === 0}
                className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
              >
                ◀ Vorheriges
              </button>
              <button
                onClick={() => setCurrentIndex((i) => Math.min(i + 1, pastAlbums.length - 1))}
                disabled={currentIndex === pastAlbums.length - 1}
                className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
              >
                Nächstes ▶
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">Noch keine vergangenen Alben</p>
        )}
      </div>
    </main>
  );
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
  
    const onChange = (e) =>
      setForm({ ...form, [e.target.name]: e.target.value });
  
    const onSubmit = async (e) => {
      e.preventDefault();
      setSending(true);
      try {
        const res = await fetch("https://script.google.com/macros/s/DEIN_SCRIPT_ID/exec", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "vorschlag", ...form }),
        });
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
        <div className="text-center text-green-600 font-medium mt-4">
          ✅ Danke für deinen Vorschlag!
        </div>
      );
  
    return (
      <form
        onSubmit={onSubmit}
        className="bg-white p-6 rounded-xl shadow-md mt-10 space-y-4"
      >
        <h3 className="text-lg font-semibold text-center">
          💡 Neues Album vorschlagen
        </h3>
  
        <input
          name="Name"
          value={form.Name}
          onChange={onChange}
          placeholder="Dein Name"
          className="w-full border rounded-lg p-2"
          required
        />
        <input
          name="Albumtitel"
          value={form.Albumtitel}
          onChange={onChange}
          placeholder="Albumtitel"
          className="w-full border rounded-lg p-2"
          required
        />
        <input
          name="Interpret"
          value={form.Interpret}
          onChange={onChange}
          placeholder="Interpret"
          className="w-full border rounded-lg p-2"
          required
        />
        <textarea
          name="Begruendung"
          value={form.Begruendung}
          onChange={onChange}
          placeholder="Warum möchtest du das Album teilen?"
          className="w-full border rounded-lg p-2"
        />
        <input
          name="SpotifyLink"
          value={form.SpotifyLink}
          onChange={onChange}
          placeholder="Spotify-Link (optional)"
          className="w-full border rounded-lg p-2"
        />
  
        <button
          type="submit"
          disabled={sending}
          className="w-full bg-orange-400 text-white py-2 rounded-lg hover:bg-orange-500 transition"
        >
          {sending ? "Wird gesendet..." : "Albumvorschlag abschicken"}
        </button>
      </form>
    );
  }
  
}
