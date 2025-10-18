"use client";
import { useEffect, useState } from "react";

/* 🔹 Dynamische Giphy-Komponente mit Fallback */
function GiphyGif({ keyword }) {
  const [gifUrl, setGifUrl] = useState(null);

  // 👉 Deinen eigenen API-Key hier eintragen:
  const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;

  useEffect(() => {
    async function fetchGif() {
      try {
        const res = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(
            keyword
          )}&limit=25&rating=g`
        );
        const data = await res.json();

        if (data?.data?.length > 0) {
          const random = data.data[Math.floor(Math.random() * data.data.length)];
          setGifUrl(random.images.fixed_height.url);
        } else {
          console.warn("⚠️ Kein GIF für:", keyword);
          setGifUrl(null);
        }
      } catch (err) {
        console.error("❌ Fehler beim Laden des Giphy-GIFs:", err);
        setGifUrl(null);
      }
    }

    fetchGif();
  }, [keyword]);

  // 🔸 Falls kein GIF gefunden wurde → Fallback-GIFs
  const fallbackGifs = {
    winner: "https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif",
    average: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
    "do not want": "https://media.giphy.com/media/3ohhwJ6DW9b0Nf3fUQ/giphy.gif",
  };

  const finalGif = gifUrl || fallbackGifs[keyword] || fallbackGifs.average;

  return (
    <div className="flex justify-center mt-4">
      <img
        src={finalGif}
        alt={`GIF zu ${keyword}`}
        className="rounded-xl shadow-md w-64 h-48 object-cover border border-pink-100 animate-fadeIn"
      />
    </div>
  );
}



/* 🔸 Hauptkomponente */
export default function Home() {
  const SHEET_ID = "1J2wNwi1T86IEIVPhqHD0WV8v1uWZ90ohz07irUlEF50";
  const SHEET_NAME = "Album des Tages";
  const SHEET_REVIEWS = "Formularantworten Bewertungen";

  const [albums, setAlbums] = useState([]);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [coverUrl, setCoverUrl] = useState(null);

  // 🔹 Daten laden
  useEffect(() => {
    const fetchData = async () => {
      try {
        // --- 1️⃣ Alben laden ---
        const albumUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
          SHEET_NAME
        )}`;
        const albumRes = await fetch(albumUrl);
        const albumText = await albumRes.text();

        const albumRows = albumText
          .trim()
          .split(/\r?\n/)
          .map((line) =>
            line.split(/","|",|,"/).map((v) => v.replace(/^"+|"+$/g, "").trim())
          );
        const albumHeaders = albumRows.shift().map((h) => h.trim());
        const albumsData = albumRows.map((row) =>
          Object.fromEntries(albumHeaders.map((h, i) => [h, row[i] || ""]))
        );

        // --- 2️⃣ Bewertungen laden ---
        const reviewUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
          SHEET_REVIEWS
        )}`;
        const reviewRes = await fetch(reviewUrl);
        const reviewText = await reviewRes.text();

        const reviewRows = reviewText
          .trim()
          .split(/\r?\n/)
          .map((line) =>
            line.split(/","|",|,"/).map((v) => v.replace(/^"+|"+$/g, "").trim())
          );
        const reviewHeaders = reviewRows.shift().map((h) => h.trim());
        const reviewsData = reviewRows.map((row) =>
          Object.fromEntries(reviewHeaders.map((h, i) => [h, row[i] || ""]))
        );

        // --- 3️⃣ Bewertungen zu Alben zuordnen ---
        setAlbums(
          albumsData.map((album) => ({
            ...album,
            reviews: reviewsData.filter(
              (r) => r.Albumtitel === album.Albumtitel
            ),
          }))
        );
      } catch (err) {
        console.error(err);
        setError("Fehler beim Laden der Daten");
      }
    };

    fetchData();
  }, []);

  // 🔹 Datum
  const todayStr = new Date().toISOString().slice(0, 10);
  const albumOfTheDay = albums.find((a) => a.Datum === todayStr);
  const pastAlbums = albums
    .filter((a) => a.Datum < todayStr)
    .sort((a, b) => new Date(b.Datum) - new Date(a.Datum));
  const selectedAlbum = pastAlbums[currentIndex];

  // 🔹 Spotify-Cover laden
  useEffect(() => {
    if (!selectedAlbum?.SpotifyLink) return setCoverUrl(null);
    const match = selectedAlbum.SpotifyLink.match(/album\/([a-zA-Z0-9]+)/);
    const albumId = match ? match[1] : null;
    if (!albumId) return;

    fetch(
      `https://open.spotify.com/oembed?url=https://open.spotify.com/album/${albumId}`
    )
      .then((res) => res.json())
      .then((data) => setCoverUrl(data.thumbnail_url))
      .catch(() => setCoverUrl(null));
  }, [selectedAlbum]);

  // 🔹 Fehler / Ladezustände
  if (error)
    return <main className="p-8 text-center text-red-600">{error}</main>;
  if (albums.length === 0)
    return (
      <main className="p-8 text-center text-gray-600">Lade Alben...</main>
    );

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-6 text-gray-800">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">
          🎵 Schnaggile – Album des Tages
        </h1>

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
              const match = albumOfTheDay["SpotifyLink"].match(/album\/([a-zA-Z0-9]+)/);
              const albumId = match ? match[1] : null;
              return albumId ? (
                <iframe
                  style={{ borderRadius: "12px" }}
                  src={`https://open.spotify.com/embed/album/${albumId}`}
                  width="100%"
                  height="352"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                ></iframe>
              ) : null;
            })()}

            <p className="mt-4 text-sm text-gray-500">
              Vorgeschlagen von {albumOfTheDay["Dein Name"]}
            </p>

            {albumOfTheDay["Warum möchtest du das Album teilen?"] && (
              <p className="mt-3 italic text-gray-600">
                „{albumOfTheDay["Warum möchtest du das Album teilen?"]}“
              </p>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-500 mb-8">
            Für heute ist noch kein Album eingetragen.
          </p>
        )}

<div className="bg-white p-6 rounded-2xl shadow-md mt-8">
  <h3 className="text-xl font-semibold text-center mb-4">
    💬 Neues Album bewerten
  </h3>
  <iframe
    src="https://docs.google.com/forms/d/e/DEIN_FORMULAR_ID/viewform?embedded=true"
    width="100%"
    height="900"
    frameBorder="0"
    marginHeight="0"
    marginWidth="0"
    className="rounded-xl shadow-inner"
  >
    Wird geladen…
  </iframe>
</div>


        {/* 📚 Vergangene Alben */}
        <h3 className="text-lg font-semibold mb-4 text-center">
          📚 Bisherige Alben
        </h3>

        {pastAlbums.length > 0 && selectedAlbum ? (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex flex-col items-center mb-4">
              {coverUrl && (
                <img
                  src={coverUrl}
                  alt={`${selectedAlbum["Albumtitel"]} Cover`}
                  className="w-48 h-48 rounded-xl shadow-md mb-3 object-cover"
                />
              )}

              <h4 className="text-xl font-semibold flex items-center justify-center space-x-2 mb-1">
                <span>{selectedAlbum["Albumtitel"]}</span>
                {selectedAlbum["SpotifyLink"] && (
                  <a
                    href={selectedAlbum["SpotifyLink"]}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
                      alt="Spotify"
                      className="w-5 h-5"
                    />
                  </a>
                )}
              </h4>
              <p className="text-center text-gray-500 mb-2">
                {selectedAlbum["Interpret"]}
              </p>

              {/* 🏆 Mehrheitsergebnis + GIF */}
              {(() => {
                if (!selectedAlbum.reviews || selectedAlbum.reviews.length === 0)
                  return null;

                const counts = { Hit: 0, "Geht in Ordnung": 0, Niete: 0 };
                selectedAlbum.reviews.forEach((r) => {
                  const v = r["Gesamtbewertung"] || r["Bewertung"];
                  if (counts[v] !== undefined) counts[v]++;
                });

                const [topVote, topCount] = Object.entries(counts).sort(
                  (a, b) => b[1] - a[1]
                )[0];

                const colors = {
                  Hit: "text-green-600",
                  "Geht in Ordnung": "text-yellow-600",
                  Niete: "text-pink-600",
                };

                return (
                  <div className="text-center">
                    <p className={`text-sm font-medium ${colors[topVote]}`}>
                      🏆 Mehrheitlich bewertet als: {topVote} ({topCount} Stimmen)
                    </p>
                    <GiphyGif
                      keyword={
                        topVote === "Hit"
                          ? "winner"
                          : topVote === "Geht in Ordnung"
                          ? "average"
                          : "do not want"
                      }
                    />
                  </div>
                );
              })()}
            </div>

            {/* 💬 Bewertungen */}
            <h5 className="font-semibold mb-2">💬 Bewertungen</h5>
            {selectedAlbum.reviews && selectedAlbum.reviews.length > 0 ? (
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
                      <td className="py-2 px-2">{r["Bewertung"]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500 italic">
                Noch keine Bewertungen vorhanden.
              </p>
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
                onClick={() =>
                  setCurrentIndex((i) =>
                    Math.min(i + 1, pastAlbums.length - 1)
                  )
                }
                disabled={currentIndex === pastAlbums.length - 1}
                className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
              >
                Nächstes ▶
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">
            Noch keine vergangenen Alben
          </p>
        )}
      </div>
    </main>
  );
}
