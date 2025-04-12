import { google } from "googleapis";
import { Credentials } from "google-auth-library";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Initialize the Google OAuth2 client
export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error("Missing required Google OAuth credentials:", {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRedirectUri: !!redirectUri,
    });
    throw new Error("Missing required Google OAuth credentials");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// Generate the Google OAuth URL
export function getGoogleAuthUrl() {
  const oauth2Client = getOAuth2Client();

  const scopes = ["https://www.googleapis.com/auth/analytics.readonly"];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });
}

// Exchange the code for tokens
export async function exchangeCodeForTokens(code: string) {
  console.log("Exchanging code for tokens...");
  const oauth2Client = getOAuth2Client();
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("Token exchange successful:", {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    });
    return tokens;
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    throw error;
  }
}

// Refresh access token if expired
export async function refreshAccessToken(refresh_token: string): Promise<string> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token });
  try {
    const response = await oauth2Client.refreshAccessToken();
    const credentials = response.credentials;
    if (!credentials.access_token) {
      throw new Error("No access token returned from refresh");
    }
    return credentials.access_token;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw new Error("Failed to refresh access token");
  }
}

// Store Google tokens in Supabase
export async function storeGoogleTokens(userId: string, tokens: Credentials, accountInfo: any = {}) {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("ga_accounts").upsert({
    user_id: userId,
    ga_account_id: accountInfo.accountId || "pending",
    ga_property_id: accountInfo.propertyId || "pending_selection",
    website_url: accountInfo.websiteUrl || "pending",
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
    data_consent: true, // Assume consent given during OAuth
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error storing Google tokens:", error);
    throw error;
  }

  return true;
}

// Get Google Analytics properties directly from authenticated account
export async function getGoogleAnalyticsAccounts(access_token: string, refresh_token?: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token });

  const analyticsAdmin = google.analyticsadmin({
    auth: oauth2Client,
    version: "v1beta",
  });

  try {
    const { data } = await analyticsAdmin.accountSummaries.list();
    // Transform the response to directly return property information
    const properties = (data.accountSummaries || []).flatMap((account: any) =>
      (account.propertySummaries || []).map((property: any) => ({
        propertyId: property.property.replace(/^properties\//, ''),
        displayName: property.displayName,
        websiteUrl: property.websiteUrl || '',
        accountId: account.account.replace(/^accounts\//, ''),
        accountName: account.displayName
      }))
    );
    return properties;
  } catch (error: any) {
    if (error.code === 401 && refresh_token) {
      console.log("Access token expired, refreshing...");
      const newAccessToken = await refreshAccessToken(refresh_token);
      oauth2Client.setCredentials({ access_token: newAccessToken });
      const { data } = await analyticsAdmin.accountSummaries.list();
      const properties = (data.accountSummaries || []).flatMap((account: any) =>
        (account.propertySummaries || []).map((property: any) => ({
          propertyId: property.property.replace(/^properties\//, ''),
          displayName: property.displayName,
          websiteUrl: property.websiteUrl || '',
          accountId: account.account.replace(/^accounts\//, ''),
          accountName: account.displayName
        }))
      );
      return properties;
    }
    console.error("Error fetching GA4 properties:", error);
    throw error;
  }
}

// Get Google Analytics property data streams
export async function getGoogleAnalyticsProperties(
  access_token: string,
  propertyId: string,
  refresh_token?: string
) {
  if (!/^\d+$/.test(propertyId)) {
    throw new Error(`Invalid property ID: ${propertyId}`);
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token });

  const analyticsAdmin = google.analyticsadmin({
    auth: oauth2Client,
    version: "v1beta",
  });

  try {
    const { data } = await analyticsAdmin.properties.dataStreams.list({
      parent: `properties/${propertyId}`,
    });
    return data.dataStreams || [];
  } catch (error: any) {
    if (error.code === 401 && refresh_token) {
      console.log("Access token expired, refreshing...");
      const newAccessToken = await refreshAccessToken(refresh_token);
      oauth2Client.setCredentials({ access_token: newAccessToken });
      const { data } = await analyticsAdmin.properties.dataStreams.list({
        parent: `properties/${propertyId}`,
      });
      return data.dataStreams || [];
    }
    console.error(`Error fetching data streams for property ${propertyId}:`, error);
    throw error;
  }
}

// Get Google Analytics property metadata
export async function getGoogleAnalyticsPropertyMetadata(
  access_token: string,
  propertyId: string,
  refresh_token?: string
) {
  if (!/^\d+$/.test(propertyId)) {
    throw new Error(`Invalid property ID: ${propertyId}`);
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token });

  const analyticsAdmin = google.analyticsadmin({
    auth: oauth2Client,
    version: "v1beta",
  });

  try {
    const { data } = await analyticsAdmin.properties.get({
      name: `properties/${propertyId}`,
    });
    return data;
  } catch (error: any) {
    if (error.code === 401 && refresh_token) {
      console.log("Access token expired, refreshing...");
      const newAccessToken = await refreshAccessToken(refresh_token);
      oauth2Client.setCredentials({ access_token: newAccessToken });
      const { data } = await analyticsAdmin.properties.get({
        name: `properties/${propertyId}`,
      });
      return data;
    }
    console.error(`Error fetching metadata for property ${propertyId}:`, error);
    throw error;
  }
}