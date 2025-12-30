import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "../../../lib/supabaseClient"; // ✅ nutzt anon key + RLS

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const body = await req.json();
    const name = (body?.name ?? "").trim();
    const email = (body?.email ?? "").trim() || null;

    if (!name) {
      return NextResponse.json({ error: "Name ist Pflicht." }, { status: 400 });
    }

    // Teilnehmer speichern
    const { data, error } = await supabase
      .from("participants")
      .insert([{ name, email }])
      .select("*")
      .single();

    // Duplicate name -> freundliche Meldung
    if (error) {
      const msg = error.message || "";
      if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("unique")) {
        return NextResponse.json({ error: "Diesen Namen gibt es schon 🙂" }, { status: 409 });
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Mail an dich
    const notifyTo = process.env.NOTIFY_EMAIL;
    if (process.env.RESEND_API_KEY && notifyTo) {
      await resend.emails.send({
        from: "Albumgenerator <onboarding@resend.dev>",
        to: [notifyTo],
        subject: "Neuer Teilnehmer im Albumgenerator",
        html: `
          <div style="font-family:Inter,Arial,sans-serif">
            <h2>Neuer Teilnehmer</h2>
            <p><b>Name:</b> ${escapeHtml(name)}</p>
            <p><b>Email:</b> ${escapeHtml(email ?? "(keine)")}</p>
            <p><b>Zeit:</b> ${new Date().toISOString()}</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e?.message ?? "Unbekannter Fehler" }, { status: 500 });
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
