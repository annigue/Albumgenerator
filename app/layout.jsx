import "./globals.css";

export const metadata = {
  title: "Album der Woche",
  description: "Unsere wöchentliche Album-Auswahl mit Bewertungen.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-retro-bg text-retro-text">
        <div className="pattern-top" />
        {children}
        <div className="pattern-bottom" />
      </body>
    </html>
  );
}
