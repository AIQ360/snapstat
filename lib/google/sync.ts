import { google, analyticsdata_v1beta } from "googleapis";
import { createServerSupabaseClient } from '../supabase/server';
import { format } from 'date-fns';
import { getOAuth2Client } from './auth';

interface DailyAnalytics {
  date: string;
  visitors: number;
  page_views: number;
  avg_session_duration: number;
  bounce_rate: number;
}

interface TopPage {
  page_path: string;
  page_views: number;
}

interface Referrer {
  source: string;
  visitors: number;
}

async function getGoogleAnalyticsClient(userId: string) {
  console.log('Getting Google Analytics client for user:', userId);
  const supabase = await createServerSupabaseClient();
  
  const { data: gaAccount, error } = await supabase
    .from('ga_accounts')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !gaAccount) {
    console.error('Error fetching GA account:', error);
    throw new Error('GA account not found');
  }

  console.log('Found GA account:', gaAccount.ga_property_id);
  
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: gaAccount.access_token,
    refresh_token: gaAccount.refresh_token,
    expiry_date: gaAccount.token_expiry ? new Date(gaAccount.token_expiry).getTime() : undefined
  });

  // Set up token refresh handler
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      console.log('Updating access token in database');
      await supabase.from('ga_accounts').update({
        access_token: tokens.access_token,
        token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        updated_at: new Date().toISOString()
      }).eq('user_id', userId);
    }
  });

  // Force token refresh if expired
  if (gaAccount.token_expiry && new Date(gaAccount.token_expiry) < new Date()) {
    console.log('Access token expired, forcing refresh...');
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      console.log('Token refresh successful');
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  const analyticsData = google.analyticsdata({
    version: 'v1beta',
    auth: oauth2Client,
  });


  return { client: analyticsData, propertyId: gaAccount.ga_property_id };
}

async function fetchDailyAnalytics(client: analyticsdata_v1beta.Analyticsdata, propertyId: string, startDate: string, endDate: string): Promise<DailyAnalytics[]> {
  console.log(`Fetching daily analytics from ${startDate} to ${endDate}`);
  
  const response = await client.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
    },
  });

  console.log('Received GA4 daily analytics response');

  return response.data.rows?.map(row => ({
    date: row.dimensionValues![0].value!,
    visitors: parseInt(row.metricValues![0].value!),
    page_views: parseInt(row.metricValues![1].value!),
    avg_session_duration: parseFloat(row.metricValues![2].value!),
    bounce_rate: parseFloat(row.metricValues![3].value!),
  })) || [];
}

async function fetchTopPages(client: analyticsdata_v1beta.Analyticsdata, propertyId: string, startDate: string, endDate: string): Promise<TopPage[]> {
  console.log('Fetching top pages data');
  
  const response = await client.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    },
  });

  console.log('Received GA4 top pages response');

  return response.data.rows?.map(row => ({
    page_path: row.dimensionValues![0].value!,
    page_views: parseInt(row.metricValues![0].value!),
  })) || [];
}

async function fetchReferrers(client: analyticsdata_v1beta.Analyticsdata, propertyId: string, startDate: string, endDate: string): Promise<Referrer[]> {
  console.log('Fetching referrers data');
  
  const response = await client.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionSource' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    },
  });

  console.log('Received GA4 referrers response');

  return response.data.rows?.map(row => ({
    source: row.dimensionValues![0].value!,
    visitors: parseInt(row.metricValues![0].value!),
  })) || [];
}

export async function syncGoogleAnalyticsData(userId: string, startDate: string, endDate: string) {
  console.log('Starting Google Analytics sync for user:', userId);
  const supabase = await createServerSupabaseClient();
  const { client, propertyId } = await getGoogleAnalyticsClient(userId);

  // Fetch all analytics data
  const [dailyAnalytics, topPages, referrers] = await Promise.all([
    fetchDailyAnalytics(client, propertyId, startDate, endDate),
    fetchTopPages(client, propertyId, startDate, endDate),
    fetchReferrers(client, propertyId, startDate, endDate),
  ]);

  console.log(`Syncing ${dailyAnalytics.length} days of analytics data`);

  // Store daily analytics and get their IDs
  for (const dayData of dailyAnalytics) {
    const { data: existingAnalytics, error: checkError } = await supabase
      .from('daily_analytics')
      .select('id')
      .eq('user_id', userId)
      .eq('date', dayData.date)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing analytics:', checkError);
      continue;
    }

    if (existingAnalytics) {
      console.log(`Updating analytics for date: ${dayData.date}`);
      const { error: updateError } = await supabase
        .from('daily_analytics')
        .update({
          visitors: dayData.visitors,
          page_views: dayData.page_views,
          avg_session_duration: dayData.avg_session_duration,
          bounce_rate: dayData.bounce_rate,
        })
        .eq('id', existingAnalytics.id);

      if (updateError) {
        console.error('Error updating analytics:', updateError);
        continue;
      }
    } else {
      console.log(`Inserting new analytics for date: ${dayData.date}`);
      const { data: newAnalytics, error: insertError } = await supabase
        .from('daily_analytics')
        .insert({
          user_id: userId,
          date: dayData.date,
          visitors: dayData.visitors,
          page_views: dayData.page_views,
          avg_session_duration: dayData.avg_session_duration,
          bounce_rate: dayData.bounce_rate,
        })
        .select('id')
        .single();

      if (insertError || !newAnalytics) {
        console.error('Error inserting analytics:', {
          error: insertError,
          date: dayData.date,
          userId: userId
        });
        continue;
      }

      // Store top pages for this day
      console.log(`Storing ${topPages.length} top pages`);
      const { error: topPagesError } = await supabase
        .from('top_pages')
        .insert(
          topPages.map(page => ({
            daily_analytics_id: newAnalytics.id,
            page_path: page.page_path,
            page_views: page.page_views,
          }))
        );

      if (topPagesError) {
        console.error('Error inserting top pages:', topPagesError);
      }

      // Store referrers for this day
      console.log(`Storing ${referrers.length} referrers`);
      const { error: referrersError } = await supabase
        .from('referrers')
        .insert(
          referrers.map(referrer => ({
            daily_analytics_id: newAnalytics.id,
            source: referrer.source,
            visitors: referrer.visitors,
          }))
        );

      if (referrersError) {
        console.error('Error inserting referrers:', referrersError);
      }
    }
  }

  console.log('Google Analytics sync completed successfully');
  return true;
}