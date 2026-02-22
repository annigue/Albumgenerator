"use client";

export default function DatenschutzPage() {
  return (
    <main className="bg-retro-bg text-retro-text min-h-screen">
      <div className="pattern-top" />
      <div className="content-bg">
        <div className="w-full px-8 relative z-10">
          <div className="poster">
            <header className="poster-header">
              <h1 className="poster-title">Datenschutz</h1>
            </header>
            <div className="poster-block">
              <p className="text-sm">
                Diese Seite verarbeitet personenbezogene Daten ausschließlich
                zur Nutzung der Anwendung (Login, Bewertungen, Vorschläge).
              </p>
              <p className="mt-4 text-sm">
                Verantwortliche Stelle: [Name / Firma]<br />
                Kontakt: [email@domain.de]
              </p>
              <p className="mt-4 text-sm">
                Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertrag/ Nutzung).
              </p>
              <p className="mt-4 text-sm">
                Weitere Angaben zu Speicherdauer, Betroffenenrechten und
                Drittanbietern ergänzen Sie hier.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="pattern-bottom" />
    </main>
  );
}
