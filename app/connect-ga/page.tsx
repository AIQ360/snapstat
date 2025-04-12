import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout";

export default async function ConnectGoogleAnalytics({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createServerSupabaseClient();

  // Get user (secure server-side authentication)
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/sign-in");
  }

  // Check if user already has a GA account connected
  const { data: gaAccount } = await supabase
    .from("ga_accounts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (gaAccount) {
    redirect("/dashboard");
  }

  // Await searchParams to access error
  const { error } = await searchParams;

  return (
    <AuthenticatedLayout>
      <div className=" max-w-md px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Connect Google Analytics</CardTitle>
            <CardDescription>
              Connect your Google Analytics account to start visualizing your website stats
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-500 dark:bg-red-900/20 dark:text-red-400">
                {error === "no_code" && "Authorization code not received from Google."}
                {error === "no_token" && "Failed to get access token from Google."}
                {error === "no_email" && "Failed to get email from Google."}
                {error === "callback_error" && "An error occurred during the Google authentication process."}
                {error === "not_authenticated" && "You need to be signed in to connect Google Analytics."}
              </div>
            )}
            <p className="mb-6 text-sm text-muted-foreground">
              SnapStats needs access to your Google Analytics data to create beautiful visualizations. We only store
              aggregated statistics, never personal data.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <a href="/api/auth/google">Connect with Google Analytics</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}