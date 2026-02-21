"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

import LoginForm from "../components/LoginForm.jsx";
import MainApp from "../components/MainApp";

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  // Skip auth (dev/testing)
  // Loading
  if (loading) {
    return (
      <main className="bg-retro-bg text-retro-text min-h-screen">
        <div className="pattern-top" />
        <div className="content-bg">
          <div className="max-w-2xl mx-auto p-8">
            <div className="retro-card p-6 text-center">
              <p className="meta">Lade…</p>
            </div>
          </div>
        </div>
        <div className="pattern-bottom" />
      </main>
    );
  }

  // Nicht eingeloggt
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

  // Eingeloggt
  return <MainApp />;
}
