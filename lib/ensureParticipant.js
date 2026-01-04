import { supabase } from "./supabaseClient";

/**
 * Stellt sicher, dass es für den eingeloggten User einen participants-Row gibt.
 * Wenn nicht, wird er aus user_metadata.display_name erstellt.
 */
export async function ensureParticipant() {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;

  const user = userRes?.user;
  if (!user) return null;

  // 1) Versuch: existing participant
  const { data: existing, error: selErr } = await supabase
    .from("participants")
    .select("user_id, display_name, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (selErr) throw selErr;
  if (existing?.display_name) return existing;

  // 2) Create from metadata
  const dn = (user.user_metadata?.display_name || "").trim();
  if (!dn) return null;

  const em = (user.email || "").trim() || null;

  const { data: created, error: upErr } = await supabase
    .from("participants")
    .upsert(
      { user_id: user.id, display_name: dn, email: em },
      { onConflict: "user_id" }
    )
    .select("user_id, display_name, email")
    .single();

  if (upErr) throw upErr;
  return created;
}
