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
        className="rounded-xl disco-img w-64 h-48 object-cover"
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
        "https://script.google.com/macros/s/1J2wNwi1T86IEIVPhqHD0WV8v1uWZ90ohz07irUlEF50/exec",
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
      <div className="text-center text-brandTeal-400 font-medium mt-4 disco-glow">
        ✅ Danke für deine Bewertung!
      </div>
    );

  return (
    <form onSubmit={onSubmit} className="disco-card p-6 space-y-3 text-white">
      <h3 className="text-center font-semibold text-brandPink-400 disco-glow">
        💬 Album bewerten
      </h3>

      <select
        name="Name"
        value={form.Name}
        onChange={onChange}
        className="w-full p-2 rounded-lg text-black"
        required
      >
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
        className="w-full p-2 rounded-lg text-black"
        required
      />
      <input
        name="LiebstesLied"
        value={form.LiebstesLied}
        onChange={onChange}
        placeholder="Liebstes Lied"
        className="w-full p-2 rounded-lg text-black"
      />
      <textarea
        name="BesteTextzeile"
        value={form.BesteTextzeile}
        onChange={onChange}
        placeholder="Beste Textzeile"
        className="w-full p-2 rounded-lg text-black"
      />
      <input
        name="SchlechtestesLied"
        value={form.SchlechtestesLied}
        onChange={onChange}
        placeholder="Schlechtestes Lied"
        className="w-full p-2 rounded-lg text-black"
      />

      <select
        name="Bewertung"
        value={form.Bewertung}
        onChange={onChange}
        className="w-full p-2 rounded-lg text-black"
        required
      >
        <option value="">Gesamtbewertung wählen</option>
        <option value="Hit">Hit</option>
        <option value="Geht in Ordnung">Geht in Ordnung</option>
        <option value="Niete">Niete</option>
      </select>

      <button type="submit" disabled={sending} className="btn-disco w-full">
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

  const teilnehmer = ["Tobi", "Anne", "Moritz", "Max", "Kathi", "Lena"];

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch(
        "https://script.google.com/macros/s/DEIN_SCRIPT_ID/exec",
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
      <div className="text-center text-brandTeal-400 font-medium mt-4 disco-glow">
        ✅ Danke für deinen Vorschlag!
      </div>
    );

  return (
    <form onSubmit={onSubmit} className="disco-card p-6 mt-10 space-y-4 text-white">
      <h3 className="text-lg font-semibold text-center text-brandPink-400 disco-glow">
        💡 Neues Album vorschlagen
      </h3>

      <select
        name="Name"
        value={form.Name}
        onChange={onChange}
        className="w-full p-2 rounded-lg text-black"
        required
      >
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
        className="w-full p-2 rounded-lg text-black"
        required
      />
      <input
        name="Interpret"
        value={form.Interpret}
        onChange={onChange}
        placeholder="Interpret"
        className="w-full p-2 rounded-lg text-black"
        required
      />
      <textarea
        name="Begruendung"
        value={form.Begruendung}
        onChange={onChange}
        placeholder="Warum möchtest du das Album teilen?"
        className="w-full p-2 rounded-lg text-black"
      />
      <input
        name="SpotifyLink"
        value={form.SpotifyLink}
        onChange={onChange}
        placeholder="Spotify-Link (optional)"
        className="w-full p-2 rounded-lg text-black"
      />

      <button type="submit" disabled={sending} className="btn-disco w-full">
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

  const todayStr = new Date().toISOString().slice(0, 10);
  const albumOfTheDay = albums.find((a) => a.Datum === todayStr);
  const pastAlbums = albums
    .filter((a) => a.Datum < todayStr)
    .sort((a, b) => new Date(b.Datum) - new Date(a.Datum));
  const selectedAlbum = pastAlbums[currentIndex];

  useEffect(() => {
    if (!selectedAlbum?.SpotifyLink) return setCoverUrl(null);
    const m = selectedAlbum.SpotifyLink.match(/album\/([a-zA-Z0-9]+)/);
    const id = m ? m[1] : null;
    if (!id) return setCoverUrl(null);
    fetch(
      `https://open.spotify.com/oembed?url=https://open.spotify.com/album/${id}`
    )
      .then((r) => r.json())
      .then((d) => setCoverUrl(d.thumbnail_url))
      .catch(() => setCoverUrl(null));
  }, [selectedAlbum]);

  if (error)
    return <main className="p-8 text-center text-red-600">{error}</main>;
  if (albums.length === 0)
    return <main className="p-8 text-center text-gray-600">Lade Alben…</main>;

  return (
    <main className="min-h-screen p-6 text-white">
      {/* 🪩 Disco Hero Header */}
      <div className="relative mb-12 rounded-3xl overflow-hidden">
        <img
          src="/fidel-fernando-249DzAuJTqQ-unsplash.jpg"
          alt="Disco Background"
          className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm"
        />
        <div className="relative z-10 text-center py-16">
          <h1 className="font-disco text-4xl md:text-5xl disco-glow">
            🎶 Schnaggile – Album der Woche
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-10">
        {/* Heutiges Album */}
        {albumOfTheDay && (
          <div className="disco-card p-6 text-center">
            <h2 className="text-2xl font-disco disco-glow mb-4">
              🪩 Album des Tages
            </h2>
            <p className="font-semibold text-brandTeal-400 mb-1">
              {albumOfTheDay["Albumtitel"]}
            </p>
            <p className="text-sm italic mb-4">
              {albumOfTheDay["Interpret"]}
            </p>
            {/* Spotify Embed */}
            {(() => {
              const m = albumOfTheDay["SpotifyLink"]?.match(
                /album\/([a-zA-Z0-9]+)/
              );
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
                ></iframe>
              ) : (
                <p className="text-sm text-gray-300 italic">
                  Kein Spotify-Link eingereicht.
                </p>
              );
            })()}

            <div className="mt-6">
              <BewertungForm albumTitel={albumOfTheDay["Albumtitel"]} />
            </div>
          </div>
        )}

        {/* Vergangene Alben */}
        {selectedAlbum && (
          <div className="disco-card p-6">
            <h3 className="font-disco text-xl disco-glow text-center mb-6">
              📚 Bisherige Alben
            </h3>

            {coverUrl && (
              <img
                src={coverUrl}
                alt={`${selectedAlbum["Albumtitel"]} Cover`}
                className="w-48 h-48 disco-img mx-auto mb-3 object-cover"
              />
            )}

            <h4 className="text-lg text-center font-semibold">
              {selectedAlbum["Albumtitel"]}
            </h4>
            <p className="text-center text-sm mb-4">
              {selectedAlbum["Interpret"]}
            </p>

            {(() => {
              const list = selectedAlbum.reviews || [];
              if (list.length === 0) return null;
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
                  <p className="text-center font-medium mt-2">
                    🏆 Mehrheitlich bewertet als: {topVote} ({topCount} Stimmen)
                  </p>
                  <GiphyGif keyword={keyword} />
                </>
              );
            })()}

            <h5 className="font-semibold mt-6 mb-2">💬 Bewertungen</h5>
            {selectedAlbum.reviews?.length ? (
              <table className="min-w-full text-sm border-t border-white/30">
                <thead>
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
                    <tr key={i} className="border-t border-white/20">
                      <td className="py-2 px-2">{r["Name"]}</td>
                      <td className="py-2 px-2">{r["Liebstes Lied"]}</td>
                      <td className="py-2 px-2 italic">
                        {r["Beste Textzeile"]}
                      </td>
                      <td className="py-2 px-2">
                        {r["Schlechtestes Lied"]}
                      </td>
                      <td className="py-2 px-2">
                        {r["Gesamtbewertung"] || r["Bewertung"]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm italic text-gray-300">
                Noch keine Bewertungen vorhanden.
              </p>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
                disabled={currentIndex === 0}
                className="btn-disco disabled:opacity-40"
              >
                ◀ Vorheriges
              </button>
              <button
                onClick={() =>
                  setCurrentIndex((i) => Math.min(i + 1, pastAlbums.length - 1))
                }
                disabled={currentIndex === pastAlbums.length - 1}
                className="btn-disco disabled:opacity-40"
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
