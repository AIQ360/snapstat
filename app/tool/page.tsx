import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getUserCredits } from "@/lib/credits"
import { ToolInterface } from "./tool-interface"

export default async function ToolPage() {
  const supabase = await createServerSupabaseClient()

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/sign-in")
  }

  // Get user credits
  const credits = await getUserCredits(session.user.id)

  // If no credits, redirect to dashboard
  if (credits <= 0) {
    redirect("/dashboard?error=no-credits")
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Tool</h1>
        <p className="mt-2 text-muted-foreground">Use our tool to generate content (costs 1 credit per use)</p>
      </div>

      <ToolInterface userId={session.user.id} />
    </div>
  )
}
