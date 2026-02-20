import { supabase } from "./supabaseClient";

export async function ensureParticipant() {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;

  const user = userRes?.user;
  if (!user) return null;

  // 1) Versuch: participant laden via user_id
  const { data: existing, error: selErr } = await supabase
    .from("participants")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (selErr) throw selErr;
  if (existing) return existing;

  // 2) Fallback: anlegen (falls Callback mal nicht gelaufen ist)
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

  const { data: created, error: insErr } = await supabase
    .from("participants")
    .insert({ user_id: user.id, display_name: dn, email: em || null })
    .select("*")
    .single();

  if (insErr) throw insErr;
  return created;
}
