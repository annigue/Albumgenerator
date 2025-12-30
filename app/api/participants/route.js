import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs"; // wichtig für Resend

type Payload = {
  event?: string;
  record?: {
    id?: string;
    user_id?: string;
    display_name?: string;
    email?: string | null;
    created_at?: string;
  };
};

export async function POST(req: Request) {
  try {
    // 1) Webhook-Secret prüfen
    const secret = req.headers.get("x-webhook-secret");
    if (!secret || secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 2) Body lesen
    const body = (await req.json()) as Payload;
    const r = body?.record;

    const displayName = (r?.display_name ?? "").toString().trim();
    const email = (r?.email ?? "").toString().trim();

    if (!displayName) {
      return NextResponse.json({ error: "missing display_name" }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: "RESEND_API_KEY missing" }, { status: 500 });
    }

    const resend = new Resend(resendKey);

    const to = process.env.NOTIFY_TO_EMAIL || ""; // deine Mailadresse
    if (!to) {
      return NextResponse.json(
        { error: "NOTIFY_TO_EMAIL missing" },
        { status: 500 }
      );
    }

    const from = process.env.RESEND_FROM || "Album der Woche <onboarding@resend.dev>";

    // 3) Mail senden
    const subject = `Neuer Teilnehmer: ${displayName}`;
    const html = `
      <div style="font-family: Inter, Arial, sans-serif; line-height: 1.5">
        <h2>Neuer Teilnehmer angemeldet</h2>
        <p><strong>Name:</strong> ${escapeHtml(displayName)}</p>
        <p><strong>Email:</strong> ${email ? escapeHtml(email) : "<em>(keine)</em>"}</p>
        <p><strong>User ID:</strong> ${escapeHtml(r?.user_id ?? "")}</p>
        <p><strong>Created:</strong> ${escapeHtml(r?.created_at ?? "")}</p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "email_failed", details: error }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    console.error("notify-participant error:", e);
    return NextResponse.json(
      { error: e?.message ?? "unknown_error" },
      { status: 500 }
    );
  }
}

// minimales Escaping
function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
