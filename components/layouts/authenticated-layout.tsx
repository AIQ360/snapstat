import type React from "react"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getUserCredits } from "@/lib/credits"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/app-sidebar"

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export async function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
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

  // Get user profile
  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", session.user.id).single()

  const userName = profile?.full_name || session.user.email?.split("@")[0] || "User"

  return (
    <SidebarProvider>
      <AppSidebar
        credits={credits}
        userEmail={session.user.email || ""}
        userName={userName}
        avatarUrl={profile?.avatar_url}
      />
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold md:text-xl">SaaS Boilerplate</h1>
            </div>
          </div>
        </header>
        <main className="mx-auto flex-1 w-full max-w-7xl p-4 md:p-6">{children}</main>
      </div>
    </SidebarProvider>
  )
}
