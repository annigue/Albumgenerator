import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

function getHeader(req: Request, key: string) {
  return req.headers.get(key) || req.headers.get(key.toLowerCase()) || "";
}

export async function POST(req: Request) {
  try {
    const secret = getHeader(req, "x-webhook-secret");
    if (!process.env.SUPABASE_WEBHOOK_SECRET || secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();

    // Supabase Webhooks schicken typischerweise "record" (neuer Datensatz)
    const record = payload?.record ?? payload?.new ?? payload;

    const displayName = record?.display_name ?? record?.name ?? "(ohne Name)";
    const email = record?.email ?? "(keine Email)";
    const userId = record?.user_id ?? record?.id ?? "(kein user_id)";

    const to = process.env.NOTIFY_EMAIL;
    if (!to) {
      return NextResponse.json({ error: "NOTIFY_EMAIL missing" }, { status: 500 });
    }

    const subject = `Neuer Teilnehmer: ${displayName}`;
    const text = `Neuer Teilnehmer registriert:

Name: ${displayName}
Email: ${email}
user_id: ${userId}

Zeitpunkt: ${new Date().toISOString()}
`;

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? "Album der Woche <onboarding@resend.dev>",
      to,
      subject,
      text,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Email send failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
