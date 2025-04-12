import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const { response, supabase } = await updateSession(request)

  // Check auth status
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes
  const protectedPaths = ["/dashboard", "/profile", "/tool"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // Auth routes that logged in users shouldn't access
  const authRoutes = ["/sign-in", "/sign-up"]
  const isAuthRoute = authRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // Redirect logic
  if (isProtectedPath && !session) {
    const redirectUrl = new URL("/sign-in", request.url)
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
