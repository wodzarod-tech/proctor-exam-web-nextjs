import { createServerClient, type CookieOptions } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server'

const locales = ['en', 'es'];
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'en'
});

export default async function middleware(request: NextRequest) {
  // 1. Let next-intl create the initial response
  let response = intlMiddleware(request);

  // 2. Initialize Supabase client to sync cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update request cookies for the current execution
          request.cookies.set({ name, value, ...options })
          // Update response cookies so the browser gets them
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
      },
    }
  )

  // 3. IMPORTANT: This refreshes the session and makes it available to getUser()
  await supabase.auth.getUser()

  return response;
}

export const config = {
  matcher: [
    // Add "auth" to the exclusion list (the ! section)
    "/((?!api|_next|_vercel|auth|.*\\..*).*)"
  ]
};