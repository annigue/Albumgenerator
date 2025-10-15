// app/layout.jsx
import "./globals.css";

export const metadata = {
  title: "Album des Tages",
  description: "Täglich ein zufälliges Album aus unserer Liste 🎵",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
