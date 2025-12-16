// components/GiphyGif.jsx

export default function GiphyGif({ verdict }) {
    const map = {
      Hit: "https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif",
      "Geht in Ordnung": "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
      Niete: "https://media.giphy.com/media/3ohhwJ6DW9b0Nf3fUQ/giphy.gif",
    };
  
    const src = map[verdict] || map["Geht in Ordnung"];
  
    return (
      <div className="flex justify-center mt-4">
        <img
          src={src}
          alt={`GIF: ${verdict ?? "neutral"}`}
          className="w-64 h-48 object-cover border-2 border-retro-border"
        />
      </div>
    );
  }
  