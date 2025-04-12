import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getGoogleAnalyticsData, processAndStoreAnalyticsData } from "@/lib/google/analytics"
import { format, subDays } from "date-fns"

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  // Get the user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    // Get the request body
    const body = await request.json()
    const { days = 30 } = body

    // Calculate date range
    const endDate = format(new Date(), "yyyy-MM-dd")
    const startDate = format(subDays(new Date(), days), "yyyy-MM-dd")

    // Fetch the data from Google Analytics
    const data = await getGoogleAnalyticsData(user.id, startDate, endDate)

    // Process and store the data
    await processAndStoreAnalyticsData(user.id, data)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ 
      error: "Failed to fetch analytics data", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
