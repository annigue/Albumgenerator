"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient"; // falls dein Pfad anders ist: "@/lib/supabaseClient"

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState("Anmeldung wird abgeschlossen…");
  const [loading, setLoading] = useState(true);

  const [needsName, setNeedsName] = useState(false);
  const [displayName, setDisplayName] = useState("");

  // Wir merken uns User-Daten, falls wir Name nachfordern müssen
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");

  async function upsertParticipant({ uid, dn, em }) {
    const { error } = await supabase
      .from("participants")
      .upsert(
        {
          user_id: uid,
          display_name: dn,
          email: em,
        },
        { onConflict: "user_id" }
      );

    if (error) throw error;
  }

  async function finishAndRedirect() {
    setMsg("✅ Fertig! Du bist angemeldet. Du wirst gleich zurückgeleitet…");
    setTimeout(() => {
      window.location.href = "/";
    }, 600);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        // 1) WICHTIG: Wenn der Redirect einen ?code=… enthält, muss der in eine Session getauscht werden
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(
            window.location.href
          );
          if (exchangeErr) throw exchangeErr;
        }

        // 2) Session/User holen
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;

        const user = userData?.user;
        if (!user) {
          setMsg("Kein Login gefunden. Bitte fordere einen neuen Login-Link an.");
          setLoading(false);
          return;
        }

        setUserId(user.id);
        setUserEmail(user.email || "");

        // 3) display_name bevorzugt aus localStorage (gleiches Gerät)
        const dn =
          (typeof window !== "undefined" && localStorage.getItem("pending_display_name")) || "";
        const em =
          (typeof window !== "undefined" && localStorage.getItem("pending_email")) ||
          user.email ||
          "";

        // 4) Wenn wir keinen Namen haben (anderes Gerät), Name nachfordern statt abbrechen
        if (!dn) {
          setMsg("Fast fertig – bitte gib noch deinen Namen an.");
          setNeedsName(true);
          setDisplayName(""); // leer lassen, User soll eingeben
          setLoading(false);
          return;
        }

        // 5) Teilnehmer upserten
        await upsertParticipant({ uid: user.id, dn, em });

        // Cleanup
        if (typeof window !== "undefined") {
          localStorage.removeItem("pending_display_name");
          localStorage.removeItem("pending_email");
        }

        await finishAndRedirect();
      } catch (e) {
        console.error(e);
        setMsg(`Fehler beim Abschluss: ${e?.message ?? "Unbekannt"}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submitName = async (e) => {
    e.preventDefault();

    const dn = displayName.trim();
    if (!dn) {
      alert("Bitte einen Namen eingeben.");
      return;
    }
    if (!userId) {
      alert("Kein eingeloggter User gefunden. Bitte Login-Link erneut anfordern.");
      return;
    }

    try {
      setLoading(true);
      setMsg("Speichere deine Anmeldung…");

      await upsertParticipant({
        uid: userId,
        dn,
        em: userEmail || "",
      });

      // Cleanup: falls noch Reste da sind
      if (typeof window !== "undefined") {
        localStorage.removeItem("pending_display_name");
        localStorage.removeItem("pending_email");
      }

      await finishAndRedirect();
    } catch (e) {
      console.error(e);
      setMsg(`Fehler beim Speichern: ${e?.message ?? "Unbekannt"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-retro-bg text-retro-text min-h-screen">
      <div className="pattern-top" />
      <div className="content-bg">
        <div className="max-w-2xl mx-auto p-8">
          <div className="retro-card p-6 text-center">
            <h2 className="font-display text-3xl mb-2">Login</h2>

            {!needsName ? (
              <p className="meta">{msg}</p>
            ) : (
              <>
                <p className="meta mb-4">{msg}</p>

                <form onSubmit={submitName} className="form-card mx-auto max-w-md" noValidate>
                  <div className="form-group">
                    <label htmlFor="display_name">Name</label>
                    <input
                      id="display_name"
                      name="display_name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="z.B. Anne"
                      required
                      disabled={loading}
                    />
                  </div>

                  <button type="submit" disabled={loading}>
                    {loading ? "WIRD GESPEICHERT…" : "WEITER"}
                  </button>

                  <p className="text-xs opacity-70 mt-2">
                    Hinweis: Wenn du den Magic Link auf einem anderen Gerät geöffnet hast, kennen wir
                    deinen Namen noch nicht – daher diese Abfrage.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="pattern-bottom" />
    </main>
  );
}
