import { supabase } from "./supabaseClient";

export async function ensureParticipant() {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;

  const user = userRes?.user;
  if (!user) return null;

  // 1) Versuch: participant laden via user_id
  const { data: existing, error: selErr } = await supabase
    .from("participants")
    .select("user_id, display_name, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!selErr && existing) return existing;
  if (selErr) {
    console.error("participants select failed, fallback to server:", selErr);
  }

  // 2) Fallback: serverseitig anlegen (um RLS/Schema-Probleme zu umgehen)
  let dn = (user.user_metadata?.display_name || "").trim();
  if (!dn && typeof window !== "undefined") {
    dn = (localStorage.getItem("pending_display_name") || "").trim();
  }
  if (!dn && user.email) {
    dn = user.email.split("@")[0].trim();
  }

  const em =
    (typeof window !== "undefined" && localStorage.getItem("pending_email")) ||
    (user.email || "").trim() ||
    null;

  if (!dn) throw new Error("Kein display_name im user_metadata.");

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error("Keine gültige Session gefunden.");

  const res = await fetch("/api/ensure-participant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ display_name: dn, email: em || null }),
  });

  const out = await res.json().catch(() => ({}));
  if (res.ok && out?.data) return out.data;

  // Fallback: client-side upsert (RLS should allow own user_id)
  const { data: created, error: insErr } = await supabase
    .from("participants")
    .upsert(
      { user_id: user.id, display_name: dn, email: em || null },
      { onConflict: "user_id" }
    )
    .select("user_id, display_name, email")
    .single();

  if (insErr) {
    const msg = out?.error || insErr.message || `ensure-participant failed (HTTP ${res.status})`;
    throw new Error(msg);
  }

  return created ?? null;
}
