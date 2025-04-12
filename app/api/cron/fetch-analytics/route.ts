import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getGoogleAnalyticsData, processAndStoreAnalyticsData } from "@/lib/google/analytics"
import { format, subDays } from "date-fns"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get("Authorization")
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    // Get all users with GA accounts
    const { data: gaAccounts, error: gaError } = await supabase.from("ga_accounts").select("user_id")

    if (gaError || !gaAccounts || gaAccounts.length === 0) {
      return NextResponse.json({ message: "No GA accounts found" })
    }

    // Calculate date range
    const endDate = format(new Date(), "yyyy-MM-dd")
    const startDate = format(subDays(new Date(), 2), "yyyy-MM-dd") // Fetch last 2 days to ensure we have the most recent data

    // Process each user
    const results = []
    for (const account of gaAccounts) {
      try {
        // Fetch the data from Google Analytics
        const data = await getGoogleAnalyticsData(account.user_id, startDate, endDate)

        // Process and store the data
        await processAndStoreAnalyticsData(account.user_id, data)

        results.push({ user_id: account.user_id, status: "success" })
      } catch (error) {
        console.error(`Error processing user ${account.user_id}:`, error)
        results.push({ 
          user_id: account.user_id, 
          status: "error", 
          message: error instanceof Error ? error.message : String(error) 
        })
      }
    }

    return NextResponse.json({
      message: "Analytics data fetched and processed",
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error("Error in cron job:", error)
    return NextResponse.json({ 
      error: "Failed to process analytics data", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
