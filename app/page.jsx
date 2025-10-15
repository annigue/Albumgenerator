"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const SHEET_ID = "1J2wNwi1T86IEIVPhqHD0WV8v1uWZ90ohz07irUlEF50";
  const SHEET_NAME = "Formularantworten 1"; // ggf. anpassen, falls dein Tab anders heißt
  const [albums, setAlbums] = useState([]);
  const [albumOfTheDay, setAlbumOfTheDay] = useState(null);

  // Daten aus Google Sheet laden (CSV)
  useEffect(() => {
    const fetchData = async () => {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
        SHEET_NAME
      )}`;
      const res = await fetch(url);
      const text = await res.text();
      const rows = text
        .trim()
        .split("\n")
        .map((r) => r.split(","));
      const headers = rows.shift();
      const data = rows.map((r) =>
        Object.fromEntries(headers.map((h, i) => [h.trim(), r[i]?.trim()]))
      );
      setAlbums(data);
    };
    fetchData();
  }, []);

  // Album des Tages bestimmen
  useEffect(() => {
    if (albums.length === 0) return;

    const today = new Date().toISOString().slice(0, 10);
    const seed = today.split("-").join("");
    const randomIndex = seededRandom(seed, albums.length);
    setAlbumOfTheDay(albums[randomIndex]);
  }, [albums]);

  // deterministischer Zufall basierend auf Datum
  const seededRandom = (seedString, max) => {
    let seed = 0;
    for (let i = 0; i < seedString.length; i++) {
      seed = (seed * 31 + seedString.charCodeAt(i)) % 233280;
    }
    return seed % max;
  };

  if (!albumOfTheDay) {
    return <main className="p-8 text-center text-gray-600">Lade Alben...</main>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-6 text-gray-800">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">🎵 Album des Tages</h1>

        <div className="bg-white p-6 rounded-2xl shadow-md mb-8 text-center">
          <h2 className="text-xl font-semibold mb-2">
            {albumOfTheDay["Titel des Albums"] || albumOfTheDay["Titel"]}
          </h2>
          <p className="text-gray-600 mb-4">
            {albumOfTheDay["Künstler/in oder Band"] || albumOfTheDay["Künstler"]}
          </p>
          {albumOfTheDay["Spotify-Link zum Album"] && (
            <a
              href={albumOfTheDay["Spotify-Link zum Album"]}
              target="_blank"
              className="inline-block bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition"
            >
              Auf Spotify öffnen
            </a>
          )}
          {albumOfTheDay["Dein Name (wer hat’s vorgeschlagen?)"] && (
            <p className="mt-4 text-sm text-gray-500">
              Vorgeschlagen von {albumOfTheDay["Dein Name (wer hat’s vorgeschlagen?)"]}
            </p>
          )}
        </div>

        <h3 className="text-lg font-semibold mb-2">📚 Alle Alben</h3>
        <ul className="space-y-2 text-sm">
          {albums.map((album, i) => (
            <li key={i} className="bg-white p-3 rounded-xl shadow-sm">
              <strong>{album["Titel des Albums"] || album["Titel"]}</strong> –{" "}
              {album["Künstler/in oder Band"] || album["Künstler"]}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
