"use client";
import { useEffect, useState } from "react";

/* 🔹 Giphy-Komponente mit direkter Bildanzeige */
function GiphyGif({ keyword }) {
  const [gifUrl, setGifUrl] = useState(null);

  useEffect(() => {
    const apiKey = "dc6zaTOxFJmzC"; // öffentlicher Demo-Key
    fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(
        keyword
      )}&limit=10&rating=g`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.data && data.data.length > 0) {
          const randomGif =
            data.data[Math.floor(Math.random() * data.data.length)];
          console.log("🎞 Giphy geladen:", randomGif.url);
          setGifUrl(randomGif.images.fixed_height.url);
        } else {
          console.warn("⚠️ Kein Giphy-Ergebnis für:", keyword);
          setGifUrl(null);
        }
      })
      .catch((err) => {
        console.error("❌ Fehler beim Laden des GIFs:", err);
        setGifUrl(null);
      });
  }, [keyword]);

  if (!gifUrl) {
    // Fallback, wenn kein GIF geladen werden konnte
    const fallbackEmoji =
      keyword === "winner"
        ? "🏆"
        : keyword === "average"
        ? "😐"
        : "💩";
    return (
      <div className="flex justify-center mt-4 text-3xl">{fallbackEmoji}</div>
    );
  }

  return (
    <div className="flex justify-center mt-4">
      <img
        src={gifUrl}
        alt={`GIF zu ${keyword}`}
        className="rounded-xl shadow-md w-64 h-48 object-cover border border-pink-100"
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
        if (!albumRes.ok) throw new Error("Fehler beim Laden der Alben");
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
        if (!reviewRes.ok)
          throw new Error("Fehler beim Laden der Bewertungen");
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

  // 🔹 Datum & Auswahl
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

        {/* 📚 Vergangene Alben */}
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

              {/* 🎵 Titel + Spotify */}
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

              {/* 🏆 Mehrheitsergebnis + Giphy */}
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
