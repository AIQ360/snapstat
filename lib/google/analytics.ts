import { google, analyticsdata_v1beta } from "googleapis";
import { getOAuth2Client } from "./auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { format, subDays } from "date-fns";

// Define the schema for GA account data from Supabase
interface GaAccount {
  user_id: string;
  ga_property_id: string; // TEXT NOT NULL in schema
  access_token: string;
  refresh_token: string;
  token_expiry: string;
}

// Get Google Analytics data for a specific date range
export async function getGoogleAnalyticsData(userId: string, startDate: string, endDate: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error: gaError } = await supabase
    .from("ga_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (gaError || !data) {
    console.error("Error fetching GA account:", gaError);
    throw new Error("Google Analytics account not found");
  }

  const gaAccount: GaAccount = data; // Type assertion
  const propertyId: string = gaAccount.ga_property_id; // Explicitly typed as string

  if (new Date(gaAccount.token_expiry) < new Date()) {
    await refreshGoogleToken(userId, gaAccount.refresh_token);
    const { data: updatedAccount } = await supabase
      .from("ga_accounts")
      .select("access_token")
      .eq("user_id", userId)
      .single();
    gaAccount.access_token = updatedAccount?.access_token || gaAccount.access_token;
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: gaAccount.access_token,
  });

  const analyticsData = google.analyticsdata({
    version: "v1beta",
    auth: oauth2Client,
  });

  const response = await analyticsData.properties.runReport({
    property: `properties/${propertyId}` as const, // Force TypeScript to see it as string literal
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "activeUsers" },
        { name: "screenPageViews" },
        { name: "averageSessionDuration" },
        { name: "bounceRate" },
      ],
      dimensions: [{ name: "date" }],
    },
  }) as analyticsdata_v1beta.Schema$RunReportResponse;

  const referrersResponse = await analyticsData.properties.runReport({
    property: `properties/${propertyId}` as const, // Same here
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: "sessionSource" }],
      limit: 10,
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    },
  }) as analyticsdata_v1beta.Schema$RunReportResponse;

  const pagesResponse = await analyticsData.properties.runReport({
    property: `properties/${propertyId}` as const, // And here
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: "screenPageViews" }],
      dimensions: [{ name: "pagePath" }],
      limit: 10,
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    },
  }) as analyticsdata_v1beta.Schema$RunReportResponse;

  return {
    mainReport: response,
    referrers: referrersResponse,
    pages: pagesResponse,
  };
}

// Refresh Google token
async function refreshGoogleToken(userId: string, refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const response = await oauth2Client.refreshAccessToken();
  const tokens = response.credentials;

  const supabase = await createServerSupabaseClient();

  await supabase
    .from("ga_accounts")
    .update({
      access_token: tokens.access_token,
      token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return tokens;
}

// Process and store Google Analytics data
export async function processAndStoreAnalyticsData(userId: string, data: any) {
  const supabase = await createServerSupabaseClient();

  const dailyMetrics = data.mainReport.rows || [];

  for (const row of dailyMetrics) {
    const date = row.dimensionValues[0].value;
    const formattedDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;

    const visitors = Number.parseInt(row.metricValues[0].value);
    const pageViews = Number.parseInt(row.metricValues[1].value);
    const avgSessionDuration = Number.parseFloat(row.metricValues[2].value);
    const bounceRate = Number.parseFloat(row.metricValues[3].value);

    const { data: dailyAnalytics, error: dailyError } = await supabase
      .from("daily_analytics")
      .upsert({
        user_id: userId,
        date: formattedDate,
        visitors,
        page_views: pageViews,
        avg_session_duration: avgSessionDuration,
        bounce_rate: bounceRate,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dailyError) {
      console.error("Error storing daily analytics:", dailyError);
      continue;
    }

    if (data.referrers && data.referrers.rows) {
      const referrers = data.referrers.rows;

      for (const referrer of referrers) {
        const source = referrer.dimensionValues[0].value;
        const visitors = Number.parseInt(referrer.metricValues[0].value);

        await supabase.from("referrers").upsert({
          daily_analytics_id: dailyAnalytics.id,
          source,
          visitors,
          created_at: new Date().toISOString(),
        });
      }
    }

    if (data.pages && data.pages.rows) {
      const topPages = data.pages.rows;

      for (const page of topPages) {
        const pagePath = page.dimensionValues[0].value;
        const pageViews = Number.parseInt(page.metricValues[0].value);

        await supabase.from("top_pages").upsert({
          daily_analytics_id: dailyAnalytics.id,
          page_path: pagePath,
          page_views: pageViews,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  await detectAndStoreEvents(userId);

  return true;
}

// Detect and store events
async function detectAndStoreEvents(userId: string) {
  const supabase = await createServerSupabaseClient();

  const endDate = new Date();
  const startDate = subDays(endDate, 30);

  const { data: analytics, error } = await supabase
    .from("daily_analytics")
    .select("*")
    .eq("user_id", userId)
    .gte("date", format(startDate, "yyyy-MM-dd"))
    .lte("date", format(endDate, "yyyy-MM-dd"))
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching analytics for event detection:", error);
    return;
  }

  // Return early if no data found
  if (!analytics || analytics.length === 0) {
    console.log("No analytics data found for event detection, skipping");
    return;
  }

  for (let i = 1; i < analytics.length; i++) {
    const yesterday = analytics[i - 1];
    const today = analytics[i];

    if (yesterday.visitors > 0 && today.visitors > yesterday.visitors * 1.5) {
      await supabase.from("events").upsert({
        user_id: userId,
        date: today.date,
        event_type: "spike",
        title: "Traffic Spike",
        description: `Your traffic increased by ${Math.round(((today.visitors - yesterday.visitors) / yesterday.visitors) * 100)}% from yesterday`,
        value: today.visitors,
        created_at: new Date().toISOString(),
      });
    }
  }

  const milestones = [100, 500, 1000, 5000, 10000];
  for (const milestone of milestones) {
    for (let i = 1; i < analytics.length; i++) {
      const yesterday = analytics[i - 1];
      const today = analytics[i];

      if (yesterday.visitors < milestone && today.visitors >= milestone) {
        await supabase.from("events").upsert({
          user_id: userId,
          date: today.date,
          event_type: "milestone",
          title: `${milestone} Visitors Milestone`,
          description: `Congratulations! Your site reached ${milestone} visitors in a day`,
          value: today.visitors,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  for (let i = 1; i < analytics.length; i++) {
    const yesterday = analytics[i - 1];
    const today = analytics[i];

    if (yesterday.visitors > 10 && today.visitors < yesterday.visitors * 0.7) {
      await supabase.from("events").upsert({
        user_id: userId,
        date: today.date,
        event_type: "drop",
        title: "Traffic Drop",
        description: `Your traffic decreased by ${Math.round(((yesterday.visitors - today.visitors) / yesterday.visitors) * 100)}% from yesterday`,
        value: today.visitors,
        created_at: new Date().toISOString(),
      });
    }
  }

  let streakDays = 1;
  let streakStart = 0;

  for (let i = 1; i < analytics.length; i++) {
    if (analytics[i].visitors > analytics[i - 1].visitors) {
      streakDays++;
      if (streakDays === 2) streakStart = i - 1;
    } else {
      if (streakDays >= 5) {
        await supabase.from("events").upsert({
          user_id: userId,
          date: analytics[i - 1].date,
          event_type: "streak",
          title: `${streakDays} Day Growth Streak`,
          description: `Your site had ${streakDays} consecutive days of traffic growth`,
          value: streakDays,
          created_at: new Date().toISOString(),
        });
      }
      streakDays = 1;
    }
  }

  if (streakDays >= 5) {
    await supabase.from("events").upsert({
      user_id: userId,
      date: analytics[analytics.length - 1].date,
      event_type: "streak",
      title: `${streakDays} Day Growth Streak`,
      description: `Your site had ${streakDays} consecutive days of traffic growth`,
      value: streakDays,
      created_at: new Date().toISOString(),
    });
  }

  return true;
}

// Fetch analytics data for a specific date range
export async function fetchAnalyticsForDateRange(userId: string, startDate: string, endDate: string) {
  const supabase = await createServerSupabaseClient();

  const { data: analytics, error } = await supabase
    .from("daily_analytics")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching analytics:", error);
    throw error;
  }

  return analytics || [];
}

// Fetch events for a specific date range
export async function fetchEventsForDateRange(userId: string, startDate: string, endDate: string) {
  const supabase = await createServerSupabaseClient();

  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching events:", error);
    throw error;
  }

  return events || [];
}

// Fetch referrers for a specific date range
export async function fetchReferrersForDateRange(userId: string, startDate: string, endDate: string) {
  const supabase = await createServerSupabaseClient();

  const { data: analytics, error: analyticsError } = await supabase
    .from("daily_analytics")
    .select("id")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (analyticsError) {
    console.error("Error fetching analytics for referrers:", analyticsError);
    throw new Error(`Failed to fetch referrers data: ${analyticsError.message}`);
  }

  if (!analytics || analytics.length === 0) {
    return []; // Return empty array when no data is found
  }

  const analyticsIds = analytics.map((a) => a.id);

  const { data: referrers, error: referrersError } = await supabase
    .from("referrers")
    .select("*")
    .in("daily_analytics_id", analyticsIds);

  if (referrersError) {
    console.error("Error fetching referrers:", referrersError);
    return [];
  }

  const aggregatedReferrers: Record<string, number> = {};
  for (const referrer of referrers || []) {
    if (aggregatedReferrers[referrer.source]) {
      aggregatedReferrers[referrer.source] += referrer.visitors;
    } else {
      aggregatedReferrers[referrer.source] = referrer.visitors;
    }
  }

  const result = Object.entries(aggregatedReferrers)
    .map(([source, visitors]) => ({ source, visitors }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 10);

  return result;
}

// Fetch top pages for a specific date range
export async function fetchTopPagesForDateRange(userId: string, startDate: string, endDate: string) {
  const supabase = await createServerSupabaseClient();

  const { data: analytics, error: analyticsError } = await supabase
    .from("daily_analytics")
    .select("id")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (analyticsError) {
    console.error("Error fetching analytics for top pages:", analyticsError);
    throw new Error(`Failed to fetch top pages data: ${analyticsError.message}`);
  }

  // Return empty array if no data found
  if (!analytics || analytics.length === 0) {
    console.log("No analytics data found for top pages, returning empty array");
    return [];
  }

  const analyticsIds = analytics.map((a) => a.id);

  const { data: pages, error: pagesError } = await supabase
    .from("top_pages")
    .select("*")
    .in("daily_analytics_id", analyticsIds);

  if (pagesError) {
    console.error("Error fetching top pages:", pagesError);
    return [];
  }

  const aggregatedPages: Record<string, number> = {};
  for (const page of pages || []) {
    if (aggregatedPages[page.page_path]) {
      aggregatedPages[page.page_path] += page.page_views;
    } else {
      aggregatedPages[page.page_path] = page.page_views;
    }
  }

  const result = Object.entries(aggregatedPages)
    .map(([page_path, page_views]) => ({ page_path, page_views }))
    .sort((a, b) => b.page_views - a.page_views)
    .slice(0, 10);

  return result;
}