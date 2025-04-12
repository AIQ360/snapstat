import { type NextRequest, NextResponse } from "next/server"
import { getGoogleAuthUrl } from "@/lib/google/auth"

export async function GET(request: NextRequest) {
  const authUrl = getGoogleAuthUrl()
  return NextResponse.redirect(authUrl)
}
