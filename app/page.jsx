"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

import LoginForm from "../components/LoginForm";
import MainApp from "../components/MainApp";

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // 1️⃣ Initiale Session prüfen
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // 2️⃣ Auf Login / Logout reagieren
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="meta">Lade…</p>
      </main>
    );
  }

  // ❌ Nicht eingeloggt → Login anzeigen
  if (!session) {
    return (
      <main className="bg-retro-bg text-retro-text min-h-screen">
        <div className="pattern-top" />
        <div className="content-bg">
          <div className="max-w-2xl mx-auto p-8">
            <LoginForm />
          </div>
        </div>
        <div className="pattern-bottom" />
      </main>
    );
  }

  // ✅ Eingeloggt → Haupt-App
  return <MainApp />;
}
