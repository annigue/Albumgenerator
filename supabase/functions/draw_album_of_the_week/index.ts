// supabase/functions/draw_album_of_the_week/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // service key, nicht anon
  );

  // 1️⃣ Alle Vorschläge holen, die noch nicht gewählt wurden
  const { data: suggestions, error: err1 } = await supabase
    .from("vorschlaege")
    .select("*")
    .is("used", null);

  if (err1 || !suggestions?.length) {
    console.log("Keine neuen Vorschläge verfügbar.");
    return new Response("Keine Vorschläge gefunden", { status: 200 });
  }

  // 2️⃣ Zufälligen Vorschlag auswählen
  const chosen = suggestions[Math.floor(Math.random() * suggestions.length)];

  // 3️⃣ Alle bisherigen Alben deaktivieren
  await supabase.from("albums").update({ is_active: false }).eq("is_active", true);

  // 4️⃣ Neues Album eintragen
  const { error: err2 } = await supabase.from("albums").insert([
    {
      title: chosen.albumtitel,
      artist: chosen.interpret,
      spotify_id: chosen.spotify_id,
      spotify_link: chosen.spotify_link,
      cover_url: chosen.cover_url,
      date: new Date().toISOString(),
      is_active: true,
    },
  ]);

  if (err2) {
    console.error(err2);
    return new Response("Fehler beim Eintragen", { status: 500 });
  }

  // 5️⃣ Markiere Vorschlag als verwendet
  await supabase.from("vorschlaege").update({ used: true }).eq("id", chosen.id);

  console.log(`Neues Album der Woche: ${chosen.albumtitel}`);
  return new Response("OK", { status: 200 });
});
