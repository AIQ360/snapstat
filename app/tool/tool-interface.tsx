"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ToolInterfaceProps {
  userId: string
}

export function ToolInterface({ userId }: ToolInterfaceProps) {
  const [input, setInput] = useState("")
  const [result, setResult] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      // First check if user has credits
      const { data: credit, error: creditError } = await supabase
        .from("credits")
        .select("credits")
        .eq("user_id", userId)
        .single()

      if (creditError) throw new Error("Failed to check credits")

      if (!credit || credit.credits <= 0) {
        throw new Error("You have no credits remaining")
      }

      // Process the input (this is a mock implementation)
      // In a real app, you would call an API or perform some processing
      const processedResult = await mockProcessInput(input)
      setResult(processedResult)

      // Deduct a credit
      const { error: updateError } = await supabase
        .from("credits")
        .update({
          credits: credit.credits - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (updateError) throw new Error("Failed to update credits")

      // Refresh the page to update the credit count
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      if (err instanceof Error && err.message === "You have no credits remaining") {
        router.push("/dashboard?error=no-credits")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Mock function to simulate processing
  const mockProcessInput = async (text: string): Promise<string> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Simple processing logic (in a real app, this would be more complex)
    return `Processed result: ${text.toUpperCase()}\n\nThis is a sample result that would normally be generated by your actual tool logic.`
  }

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Generate Content</CardTitle>
          <CardDescription>Enter your prompt below to generate content (costs 1 credit)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Textarea
              placeholder="Enter your prompt here..."
              className="min-h-[100px]"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {result && (
            <div className="space-y-2">
              <h3 className="font-medium">Result:</h3>
              <div className="rounded-md bg-muted p-4">
                <pre className="whitespace-pre-wrap text-sm">{result}</pre>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Generate (1 Credit)"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
