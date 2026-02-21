import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? "";
}

export async function POST(req: Request) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json(
        { error: "Nicht eingeloggt (Bearer Token fehlt)." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return NextResponse.json(
        { error: "Supabase env vars fehlen (URL/ANON/SERVICE_ROLE)." },
        { status: 500 }
      );
    }

    try {
      new URL(supabaseUrl);
    } catch {
      return NextResponse.json(
        { error: "Supabase URL ist ungültig (NEXT_PUBLIC_SUPABASE_URL)." },
        { status: 500 }
      );
    }

    // Auth-User aus Token lesen (mit anon client + Bearer)
    const authed = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: authData, error: authErr } = await authed.auth.getUser();
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: "Ungültiger Login/Token." }, { status: 401 });
    }

    const user = authData.user;
    const displayName =
      String(body?.display_name || user.user_metadata?.display_name || "").trim() ||
      (user.email ? user.email.split("@")[0] : "");

    if (!displayName) {
      return NextResponse.json({ error: "Kein display_name verfügbar." }, { status: 400 });
    }

    const email = String(body?.email || user.email || "").trim() || null;

    // Service-Role Upsert (bypasst RLS)
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await admin
      .from("participants")
      .upsert(
        { user_id: user.id, display_name: displayName, email },
        { onConflict: "user_id" }
      )
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}
