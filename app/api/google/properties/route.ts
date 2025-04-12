import { type NextRequest, NextResponse } from "next/server";
import { getGoogleAnalyticsAccounts } from "@/lib/google/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface RequestBody {
  accessToken: string;
  refreshToken?: string;
  accountId: string;
  userId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received request body:", body);
    const { accessToken, refreshToken, accountId, userId } = body;

    if (!accessToken) {
      return NextResponse.json({ error: "Access token is required" }, { status: 400 });
    }

    // Fetch properties directly from the accountSummaries endpoint
    const properties = await getGoogleAnalyticsAccounts(accessToken, refreshToken);
    
    // Filter properties by accountId if provided
    const filteredProperties = accountId
      ? properties.filter(prop => prop.accountId === accountId)
      : properties;

    return NextResponse.json({
      properties: filteredProperties.map((property: any) => ({
        id: `properties/${property.propertyId}`,
        displayName: property.displayName,
        websiteUrl: property.websiteUrl,
        parent: `accounts/${property.accountId}`,
        accountName: property.accountName
      })),
    });
  } catch (error: unknown) {
    console.error("Error fetching Google Analytics properties:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ 
      error: "Failed to fetch properties", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}