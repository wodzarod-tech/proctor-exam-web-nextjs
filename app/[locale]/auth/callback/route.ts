import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { headers } from "next/headers";

const locales = ["en", "es"];

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/"; // Default to root
  
  console.log("requestUrl=",requestUrl);
  console.log("code=",code);
  console.log("next=",next);

  if (code) {
    const supabase = await createSupabaseServerClient();

    // This creates the session and sets the cookies
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) console.error("Exchange Error:", error);

    const { data: { session } } = await supabase.auth.getSession();
    console.log("Session established:", !!session);
  }

// Get locale from middleware header or default to 'en'
  const headersList = await headers();
  const localeHeader = headersList.get("x-next-intl-locale");
  const locale = locales.includes(localeHeader || "") ? localeHeader : "en";

  // LOGIC FIX:
  // 1. If 'next' already has a locale prefix (e.g. /es/dashboard), use it.
  // 2. If it doesn't (e.g. /dashboard), prepend the current locale.
  const hasLocale = locales.some(loc => next.startsWith(`/${loc}/`) || next === `/${loc}`);
  
  const finalPath = hasLocale 
    ? next 
    : `/${locale}${next.startsWith('/') ? next : `/${next}`}`;

  // Use the origin from the request to ensure an absolute URL
  return NextResponse.redirect(new URL(finalPath, request.url));
}