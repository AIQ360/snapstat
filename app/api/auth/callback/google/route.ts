import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { exchangeCodeForTokens } from "@/lib/google/auth"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")

  if (!code) {
    console.error("No code provided in callback")
    return NextResponse.redirect(new URL("/connect-ga?error=no_code", request.url))
  }

  try {
    console.log("Starting Google OAuth callback process")
    // Exchange the code for tokens
    const tokens = await exchangeCodeForTokens(code)
    console.log("Token exchange completed", {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date
    })

    if (!tokens.access_token) {
      console.error("No access token received from token exchange")
      return NextResponse.redirect(new URL("/connect-ga?error=no_token", request.url))
    }



    // Check if user exists in Supabase
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL("/sign-in?error=not_authenticated", request.url))
    }

    // Store the tokens temporarily in the session
    const session = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    }

    // Redirect to the GA account selection page
    return NextResponse.redirect(
      new URL(`/connect-ga/select-account?session=${encodeURIComponent(JSON.stringify(session))}`, request.url),
    )
  } catch (error) {
    console.error("Error in Google callback:", error)
    return NextResponse.redirect(new URL("/connect-ga?error=callback_error", request.url))
  }
}
