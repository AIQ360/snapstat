import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { ProfileForm } from "./profile-form"

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/sign-in")
  }

  // Get user profile
  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", session.user.id).single()

  return (
    <div className=" max-w-xl px-4 py-12 md:px-6 md:py-24">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Your Profile</h1>
          <p className="mt-2 text-muted-foreground">Update your account information</p>
        </div>

        <ProfileForm
          initialData={{
            id: session.user.id,
            email: session.user.email || "",
            fullName: profile?.full_name || "",
            avatarUrl: profile?.avatar_url || "",
          }}
        />
      </div>
    </div>
  )
}
