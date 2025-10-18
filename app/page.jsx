"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const SHEET_ID = "1J2wNwi1T86IEIVPhqHD0WV8v1uWZ90ohz07irUlEF50";
  const SHEET_NAME = "Album des Tages";
  const SHEET_REVIEWS = "Bewertungen";
  const VOTE_API_URL = "/api/vote";

  const [albums, setAlbums] = useState([]);
  const [error, setError] = useState(null);
  const [voting, setVoting] = useState(false);
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

  // 🔹 Datum
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const testDate = searchParams.get("date");
  const today = testDate ? new Date(testDate) : new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const albumOfTheDay = albums.find((a) => a.Datum === todayStr);
  const pastAlbums = albums
    .filter((a) => a.Datum < todayStr)
    .sort((a, b) => new Date(b.Datum) - new Date(a.Datum));

  const selectedAlbum = pastAlbums[currentIndex];

  // 🔹 Spotify-Cover laden (Variante 3)
  useEffect(() => {
    if (!selectedAlbum?.SpotifyLink) {
      setCoverUrl(null);
      return;
    }

    const match = selectedAlbum.SpotifyLink.match(/album\/([a-zA-Z0-9]+)/);
    const albumId = match ? match[1] : null;
    if (!albumId) return;

    fetch(
      `https://open.spotify.com/oembed?url=https://open.spotify.com/album/${albumId}`
    )
      .then((res) => res.json())
      .then((data) => setCoverUrl(data.thumbnail_url))
      .catch((err) => {
        console.error("Fehler beim Laden des Covers:", err);
        setCoverUrl(null);
      });
  }, [selectedAlbum]);

  // 🔹 Voting
  const handleVote = async (type) => {
    if (!albumOfTheDay || voting) return;
    setVoting(true);

    try {
      await fetch(VOTE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: albumOfTheDay["Datum"], type }),
      });
      alert(`Danke für deine Bewertung: ${type}`);
    } catch (err) {
      console.error(err);
      alert("Fehler beim Senden der Bewertung.");
    } finally {
      setVoting(false);
    }
  };

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
            <h2 className="text-xl font-semibold mb-2">
              {albumOfTheDay["Albumtitel"]}
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
              ) : (
                <a
                  href={albumOfTheDay["SpotifyLink"]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition"
                >
                  Auf Spotify öffnen
                </a>
              );
            })()}

            <p className="mt-4 text-sm text-gray-500">
              Vorgeschlagen von {albumOfTheDay["Dein Name"]}
            </p>

            {albumOfTheDay["Warum möchtest du das Album teilen?"] && (
              <p className="mt-3 italic text-gray-600">
                „{albumOfTheDay["Warum möchtest du das Album teilen?"]}“
              </p>
            )}

            {/* 🔘 Voting Buttons */}
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={() => handleVote("Hit")}
                disabled={voting}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
              >
                🔥 Hit
              </button>
              <button
                onClick={() => handleVote("Geht in Ordnung")}
                disabled={voting}
                className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg"
              >
                🙂 Geht in Ordnung
              </button>
              <button
                onClick={() => handleVote("Niete")}
                disabled={voting}
                className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg"
              >
                💩 Niete
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 mb-8">
            Für heute ist noch kein Album eingetragen.
          </p>
        )}

        {/* 📚 Vergangene Alben mit Bewertungen */}
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
              <h4 className="text-xl font-semibold text-center">
                {selectedAlbum["Albumtitel"]}
              </h4>
              <p className="text-center text-gray-500">
                {selectedAlbum["Interpret"]}
              </p>
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
