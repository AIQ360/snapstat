import { redirect } from "next/navigation"
import { format, subDays } from "date-fns"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { initializeUserCredits } from "@/lib/credits"
import {
  fetchAnalyticsForDateRange,
  fetchEventsForDateRange,
  fetchReferrersForDateRange,
  fetchTopPagesForDateRange,
} from "@/lib/google/analytics"
import { syncGoogleAnalyticsData } from "@/lib/google/sync"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScreenshotView } from "@/components/dashboard/screenshot-view"
import { AnalyticsChart } from "@/components/dashboard/analytics-chart"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ReferrersTable } from "@/components/dashboard/referrers-table"
import { TopPagesTable } from "@/components/dashboard/top-pages-table"
import { EventsTimeline } from "@/components/dashboard/events-timeline"
import { Users, BarChart2, Clock, MousePointerClick } from "lucide-react"

export default async function Dashboard() {
  const supabase = await createServerSupabaseClient()

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/sign-in")
  }

  // Initialize credits for new users
  await initializeUserCredits(session.user.id)

  // Check if user has connected Google Analytics
  const { data: gaAccount } = await supabase.from("ga_accounts").select("*").eq("user_id", session.user.id).single()

  if (!gaAccount) {
    redirect("/connect-ga")
  }

  // Get date range (last 30 days)
  const endDate = format(new Date(), "yyyy-MM-dd")
  const startDate = format(subDays(new Date(), 30), "yyyy-MM-dd")

  // Sync and fetch analytics data
  await syncGoogleAnalyticsData(session.user.id, startDate, endDate)
  const analyticsData = await fetchAnalyticsForDateRange(session.user.id, startDate, endDate)

  // Fetch events
  const events = await fetchEventsForDateRange(session.user.id, startDate, endDate)

  // Fetch referrers
  const referrers = await fetchReferrersForDateRange(session.user.id, startDate, endDate)

  // Fetch top pages
  const topPages = await fetchTopPagesForDateRange(session.user.id, startDate, endDate)

  // Calculate totals and averages
  const totalVisitors = analyticsData.reduce((sum, item) => sum + item.visitors, 0)
  const totalPageViews = analyticsData.reduce((sum, item) => sum + item.page_views, 0)
  const avgBounceRate =
    analyticsData.length > 0 ? analyticsData.reduce((sum, item) => sum + item.bounce_rate, 0) / analyticsData.length : 0
  const avgSessionDuration =
    analyticsData.length > 0
      ? analyticsData.reduce((sum, item) => sum + item.avg_session_duration, 0) / analyticsData.length
      : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Analytics for {gaAccount.website_url}</p>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="screenshot">Screenshot</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="Total Visitors" value={totalVisitors} icon={<Users className="h-4 w-4" />} />
            <StatsCard title="Page Views" value={totalPageViews} icon={<BarChart2 className="h-4 w-4" />} />
            <StatsCard
              title="Avg. Bounce Rate"
              value={`${avgBounceRate.toFixed(2)}%`}
              icon={<MousePointerClick className="h-4 w-4" />}
            />
            <StatsCard
              title="Avg. Session Duration"
              value={`${Math.floor(avgSessionDuration / 60)}m ${Math.floor(avgSessionDuration % 60)}s`}
              icon={<Clock className="h-4 w-4" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AnalyticsChart title="Visitors Over Time" data={analyticsData} dataKey="visitors" />
            <AnalyticsChart title="Page Views Over Time" data={analyticsData} dataKey="page_views" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ReferrersTable referrers={referrers} />
            <TopPagesTable pages={topPages} />
          </div>

          <EventsTimeline events={events} />
        </TabsContent>

        <TabsContent value="screenshot">
          <ScreenshotView websiteUrl={gaAccount.website_url} analyticsData={analyticsData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
