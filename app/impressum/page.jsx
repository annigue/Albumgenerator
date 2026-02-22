"use client";

export default function ImpressumPage() {
  return (
    <main className="bg-retro-bg text-retro-text min-h-screen">
      <div className="pattern-top" />
      <div className="content-bg">
        <div className="w-full px-8 relative z-10">
          <div className="poster">
            <header className="poster-header">
              <h1 className="poster-title">Impressum</h1>
            </header>
            <div className="poster-block">
              <p className="meta">Angaben gemäß § 5 TMG</p>
              <p className="mt-4 text-sm">
                [Name / Firma]<br />
                [Straße, Hausnummer]<br />
                [PLZ, Ort]<br />
                [Land]
              </p>
              <p className="mt-4 text-sm">
                E-Mail: [email@domain.de]<br />
                Telefon: [optional]
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="pattern-bottom" />
    </main>
  );
}
