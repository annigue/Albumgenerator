"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const SHEET_ID = "1J2wNwi1T86IEIVPhqHD0WV8v1uWZ90ohz07irUlEF50";
  const SHEET_NAME = "Album des Tages";
  const VOTE_API_URL = "https://script.google.com/macros/s/DEINE-API-URL/exec"; // <--- einfügen

  const [albums, setAlbums] = useState([]);
  const [error, setError] = useState(null);
  const [voting, setVoting] = useState(false);

  // 🔹 Sheet laden
  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
          SHEET_NAME
        )}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Fehler beim Laden des Sheets");
        const text = await res.text();

        const rows = text
          .trim()
          .split(/\r?\n/)
          .map((line) =>
            line
              .split(/","|",|,"/)
              .map((v) => v.replace(/^"+|"+$/g, "").trim())
          );

        const headers = rows.shift().map((h) => h.trim());
        const data = rows.map((row) =>
          Object.fromEntries(headers.map((h, i) => [h, row[i] || ""]))
        );

        setAlbums(data);
      } catch (err) {
        console.error(err);
        setError("Fehler beim Laden der Daten");
      }
    };

    fetchData();
  }, []);

  // 🔹 Datum
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const testDate = searchParams.get("date");
  const today = testDate ? new Date(testDate) : new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const albumOfTheDay = albums.find((a) => a.Datum === todayStr);
  const pastAlbums = albums
    .filter((a) => a.Datum < todayStr)
    .sort((a, b) => new Date(b.Datum) - new Date(a.Datum));

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
    return <main className="p-8 text-center text-gray-600">Lade Alben...</main>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-6 text-gray-800">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">
          🎵 Album des Tages
        </h1>

        {/* 🎧 Heutiges Album */}
        {albumOfTheDay ? (
          <div className="bg-white p-6 rounded-2xl shadow-md mb-8 text-center">
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

            {/* 🔘 Voting Buttons */}
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={() => handleVote("Hit")}
                disabled={voting}
                className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg"
              >
                🔥 Hit
              </button>
              <button
                onClick={() => handleVote("Geht in Ordnung")}
                disabled={voting}
                className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white px-4 py-2 rounded-lg"
              >
                🙂 Geht in Ordnung
              </button>
              <button
                onClick={() => handleVote("Niete")}
                disabled={voting}
                className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded-lg"
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

        {/* 📚 Vergangene Alben */}
        <h3 className="text-lg font-semibold mb-2">📚 Bisherige Alben</h3>
        {pastAlbums.length === 0 ? (
          <p className="text-sm text-gray-500">Noch keine vergangenen Alben</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {pastAlbums.map((album, i) => {
              const hit = album["Hit"] || 0;
              const okay = album["Geht in Ordnung"] || 0;
              const flop = album["Niete"] || 0;

              const match = album["SpotifyLink"]?.match(/album\/([a-zA-Z0-9]+)/);
              const albumId = match ? match[1] : null;
              const spotifyUrl = albumId
                ? `https://open.spotify.com/album/${albumId}`
                : album["SpotifyLink"];

              return (
                <li
                  key={i}
                  className="bg-white p-4 rounded-xl shadow-sm hover:bg-pink-50 transition"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <a
                        href={spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-pink-600 hover:underline"
                      >
                        {album["Albumtitel"]}
                      </a>
                      <span className="text-gray-600 sm:ml-2">
                        – {album["Interpret"]}
                      </span>
                    </div>

                    <span className="text-gray-400 text-xs ml-2 whitespace-nowrap">
                      {new Date(album.Datum).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>

                  {/* 🎯 Bewertungsergebnisse */}
                  <div className="mt-2 text-xs text-gray-600 flex space-x-4 justify-center sm:justify-start">
                    <span>🔥 {hit}</span>
                    <span>🙂 {okay}</span>
                    <span>💩 {flop}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
