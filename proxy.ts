import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { DEMO } from "@/lib/demo"

// Proxy выполняется перед каждой страницей. Он:
// 1) обновляет сессию Supabase (токен живёт час, тут он продлевается);
// 2) не пускает гостей дальше /login.
export async function proxy(request: NextRequest) {
  if (DEMO) return NextResponse.next()

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data } = await supabase.auth.getClaims()
  const isLoggedIn = !!data?.claims
  const path = request.nextUrl.pathname
  const isPublic = path.startsWith("/login") || path.startsWith("/auth")

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  if (isLoggedIn && path.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return response
}

export const config = {
  // Не запускать для статики, картинок и файлов PWA (manifest, service worker, офлайн-страница):
  // они должны открываться и без входа
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|offline\\.html|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
