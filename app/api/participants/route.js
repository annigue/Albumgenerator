import { NextResponse } from "next/server";

export const runtime = "nodejs"; // wichtig, damit Resend/Node libs laufen

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));

    // optional: minimal validation
    // z.B. erwartet: { record: { display_name, email, user_id } }
    const record = body?.record ?? null;

    if (!record) {
      return NextResponse.json({ error: "No record in payload" }, { status: 400 });
    }

    // TODO: Hier dann Resend call rein (wenn du das schon drin hattest)
    // Beispiel nur als Platzhalter:
    // await sendEmailViaResend({ record });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
