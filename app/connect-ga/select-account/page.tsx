"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { format, subDays } from "date-fns"

interface GoogleAccount {
  id: string
  name: string
}

interface GoogleProperty {
  id: string
  name: string
  websiteUrl: string
  parent: string
  displayName: string
}

interface GoogleView {
  id: string
  name: string
}

export default function SelectGoogleAccount() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionParam = searchParams.get("session")

  const [session, setSession] = useState<any>(null)
  const [accounts, setAccounts] = useState<GoogleAccount[]>([])
  const [properties, setProperties] = useState<GoogleProperty[]>([])
  const [views, setViews] = useState<GoogleView[]>([])

  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [selectedProperty, setSelectedProperty] = useState<string>("")
  const [selectedView, setSelectedView] = useState<string>("")

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<React.ReactNode | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (sessionParam) {
      try {
        const parsedSession = JSON.parse(decodeURIComponent(sessionParam))
        setSession(parsedSession)
        fetchProperties(parsedSession.access_token)
      } catch (e) {
        setError("Invalid session data")
        setLoading(false)
      }
    } else {
      setError("No session data provided")
      setLoading(false)
    }
  }, [sessionParam])

  const fetchProperties = async (accessToken: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/google/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch properties")
      }

      const data = await response.json()
      setProperties(data.properties)
      setLoading(false)
    } catch (e) {
      setError("Failed to fetch Google Analytics properties")
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedProperty || !session) {
      setError("Please select a property")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const selectedPropertyObj = properties.find((p) => p.id === selectedProperty)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      // Store the Google Analytics property info
      console.log("Saving GA property configuration...", {
        propertyId: selectedProperty.replace(/^properties\//, ""),
        accountId: selectedPropertyObj?.parent?.replace(/^accounts\//, "") || "",
        websiteUrl: selectedPropertyObj?.websiteUrl || ""
      })

      const { error } = await supabase.from("ga_accounts").upsert({
        user_id: user.id,
        ga_account_id: selectedPropertyObj?.parent?.replace(/^accounts\//, "") || "",
        ga_property_id: selectedProperty.replace(/^properties\//, ""),
        website_url: selectedPropertyObj?.websiteUrl || "",
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        token_expiry: new Date(session.expiry_date).toISOString(),
        data_consent: true,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error("Failed to save GA configuration:", error)
        throw error
      }

      console.log("GA property configuration saved successfully")

      // Fetch initial analytics data
      console.log("Starting initial analytics data fetch...")
      const response = await fetch("/api/analytics/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          days: 30,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Failed to fetch initial analytics data:", errorText)
        throw new Error(`Failed to fetch initial analytics data: ${errorText}`)
      }

      const analyticsResponse = await response.json()
      if (!analyticsResponse.success) {
        console.error("Analytics fetch was not successful:", analyticsResponse)
        throw new Error("Failed to initialize analytics data")
      }

      console.log("Initial analytics data fetch completed successfully")
      router.push("/dashboard")
    } catch (e) {
      setError("Failed to save Google Analytics configuration")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <div className="text-center text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <Card className="w-[600px]">
      <CardHeader>
        <CardTitle>Select Google Analytics Property</CardTitle>
        <CardDescription>
          Choose the Google Analytics 4 property you want to connect with your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="property">Property</Label>
            <Select
              value={selectedProperty}
              onValueChange={setSelectedProperty}
            >
              <SelectTrigger id="property">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem
                    key={property.id}
                    value={property.id}
                  >
                    {property.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/")}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedProperty || submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            "Connect"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
