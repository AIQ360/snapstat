import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function getUserCredits(userId: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from("credits").select("credits").eq("user_id", userId).single()

  if (error) {
    console.error("Error fetching credits:", error)
    return 0
  }

  return data?.credits || 0
}

export async function initializeUserCredits(userId: string) {
  const supabase = await createServerSupabaseClient()

  // Check if user already has credits
  const { data: existing } = await supabase.from("credits").select("*").eq("user_id", userId).single()

  if (!existing) {
    // Add 5 free credits for new users
    const { error } = await supabase.from("credits").insert({
      user_id: userId,
      credits: 5,
    })

    if (error) {
      console.error("Error initializing credits:", error)
      return false
    }

    return true
  }

  return false
}

export async function consumeCredit(userId: string) {
  const supabase = await createServerSupabaseClient()

  // Get current credits
  const { data: credit, error: fetchError } = await supabase
    .from("credits")
    .select("credits")
    .eq("user_id", userId)
    .single()

  if (fetchError || !credit) {
    console.error("Error fetching credits:", fetchError)
    return false
  }

  if (credit.credits <= 0) {
    return false
  }

  // Deduct 1 credit
  const { error: updateError } = await supabase
    .from("credits")
    .update({
      credits: credit.credits - 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)

  if (updateError) {
    console.error("Error updating credits:", updateError)
    return false
  }

  return true
}
