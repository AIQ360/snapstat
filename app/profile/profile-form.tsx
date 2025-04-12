"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProfileFormProps {
  initialData: {
    id: string
    email: string
    fullName: string
    avatarUrl: string
  }
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [fullName, setFullName] = useState(initialData.fullName)
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatarUrl)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Update profile in database
      const { error } = await supabase.from("user_profiles").upsert({
        id: initialData.id,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      setSuccess(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return (
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || initialData.email.substring(0, 2).toUpperCase()
    )
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400">
              <Check className="h-4 w-4" />
              <AlertDescription>Profile updated successfully!</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col items-center space-y-2">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl} alt={fullName || initialData.email} />
              <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
            </Avatar>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              type="text"
              placeholder="https://example.com/avatar.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={initialData.email} disabled />
            <p className="text-xs text-muted-foreground">Your email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
