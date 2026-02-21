import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  let host = "";
  let urlOk = false;
  try {
    const u = new URL(url);
    host = u.host;
    urlOk = true;
  } catch {
    urlOk = false;
  }

  return NextResponse.json({
    hasUrl: Boolean(url),
    hasAnonKey: Boolean(anon),
    hasServiceRoleKey: Boolean(service),
    urlOk,
    urlLength: url.length,
    urlStartsWithHttps: url.startsWith("https://"),
    urlHost: host || null,
  });
}
