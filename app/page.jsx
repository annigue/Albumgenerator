"use client";
import { useEffect, useState } from "react";

/* 🔹 Dynamische Giphy-Komponente */
function GiphyGif({ keyword }) {
  const [gifUrl, setGifUrl] = useState(null);
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
        }
      } catch (err) {
        console.error("❌ Fehler beim Laden des Giphy-GIFs:", err);
      }
    }

    fetchGif();
  }, [keyword, apiKey]);

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
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        "https://script.google.com/macros/s/DEIN_SCRIPT_ID/exec",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const result = await res.json();
      if (result.status === "success") {
        setSuccess(true);
        setForm({
          Name: "",
          Albumtitel: albumTitel || "",
          LiebstesLied: "",
          BesteTextzeile: "",
          SchlechtestesLied: "",
          Bewertung: "",
        });
      }
    } catch (err) {
      console.error("Fehler beim Senden:", err);
    } finally {
      setLoading(false);
    }
  };

  if (success)
    return (
      <div className="text-center text-green-600 font-medium mt-4">
        ✅ Danke für deine Bewertung!
      </div>
    );

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow-md mt-8 space-y-4"
    >
      <h3 className="text-lg font-semibold text-center">💬 Album bewerten</h3>

      <input
        name="Name"
        value={form.Name}
        onChange={handleChange}
        placeholder="Dein Name"
        className="w-full border rounded-lg p-2"
        required
      />
      <input
        name="Albumtitel"
        value={form.Albumtitel}
        onChange={handleChange}
        placeholder="Albumtitel"
        className="w-full border rounded-lg p-2"
        required
      />
      <input
        name="LiebstesLied"
        value={form.LiebstesLied}
        onChange={handleChange}
        placeholder="Liebstes Lied"
        className="w-full border rounded-lg p-2"
      />
      <textarea
        name="BesteTextzeile"
        value={form.BesteTextzeile}
        onChange={handleChange}
        placeholder="Beste Textzeile"
        className="w-full border rounded-lg p-2"
      />
      <input
        name="SchlechtestesLied"
        value={form.SchlechtestesLied}
        onChange={handleChange}
        placeholder="Schlechtestes Lied"
        className="w-full border rounded-lg p-2"
      />
      <select
        name="Bewertung"
        value={form.Bewertung}
        onChange={handleChange}
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
        disabled={loading}
        className="w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition"
      >
        {loading ? "Wird gesendet..." : "Bewertung abschicken"}
      </button>
    </form>
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
        const albumUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;
        const albumRes = await fetch(albumUrl);
        const albumText = await albumRes.text();

        const albumRows = albumText
          .trim()
          .split(/\r?\n/)
          .map((line) =>
            line.split(/","|",|,"/).map((v) => v.replace(/^"+|"+$/g, "").trim())
          );
        const albumHeaders = albumRows.shift();
        const albumsData = albumRows.map((row) =>
          Object.fromEntries(albumHeaders.map((h, i) => [h, row[i] || ""]))
        );

        const reviewUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_REVIEWS}`;
        const reviewRes = await fetch(reviewUrl);
        const reviewText = await reviewRes.text();

        const reviewRows = reviewText
          .trim()
          .split(/\r?\n/)
          .map((line) =>
            line.split(/","|",|,"/).map((v) => v.replace(/^"+|"+$/g, "").trim())
          );
        const reviewHeaders = reviewRows.shift();
        const reviewsData = reviewRows.map((row) =>
          Object.fromEntries(reviewHeaders.map((h, i) => [h, row[i] || ""]))
        );

        setAlbums(
          albumsData.map((album) => ({
            ...album,
            reviews: reviewsData.filter(
              (r) => r.Albumtitel === album.Albumtitel
            ),
          }))
        );
      } catch (err) {
        setError("Fehler beim Laden der Daten");
      }
    };

    fetchData();
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);
  const albumOfTheDay = albums.find((a) => a.Datum === todayStr);
  const pastAlbums = albums
    .filter((a) => a.Datum < todayStr)
    .sort((a, b) => new Date(b.Datum) - new Date(a.Datum));
  const selectedAlbum = pastAlbums[currentIndex];

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-6 text-gray-800">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">
          🎵 Schnaggile – Album des Tages
        </h1>

        {/* 🎧 Heutiges Album */}
        {albumOfTheDay && (
          <div className="bg-white p-6 rounded-2xl shadow-md mb-10 text-center">
            <h2 className="text-xl font-semibold mb-2 flex justify-center items-center space-x-2">
              <span>{albumOfTheDay["Albumtitel"]}</span>
            </h2>
            <p className="text-gray-600 mb-4">{albumOfTheDay["Interpret"]}</p>

            <BewertungForm albumTitel={albumOfTheDay["Albumtitel"]} />
          </div>
        )}

        {/* 📚 Vergangene Alben */}
        <h3 className="text-lg font-semibold mb-4 text-center">
          📚 Bisherige Alben
        </h3>
        {selectedAlbum && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-center font-semibold mb-2">
              {selectedAlbum["Albumtitel"]}
            </p>
            <GiphyGif
              keyword={
                selectedAlbum.reviews.some((r) => r["Bewertung"] === "Hit")
                  ? "winner"
                  : selectedAlbum.reviews.some(
                      (r) => r["Bewertung"] === "Geht in Ordnung"
                    )
                  ? "average"
                  : "do not want"
              }
            />
          </div>
        )}
      </div>
    </main>
  );
}
