import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { headers } from "next/headers";

const locales = ["en", "es"];

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // ✅ Get locale from middleware header
  const headersList = await headers();
  const localeHeader = headersList.get("x-next-intl-locale");

  const locale = locales.includes(localeHeader || "")
    ? localeHeader
    : "en";

  const next = requestUrl.searchParams.get("next");

  const safeNext =
    next && next.startsWith("/") ? next : `/${locale}`;

  return NextResponse.redirect(new URL(safeNext, request.url));
}