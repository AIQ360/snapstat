"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Linkedin, Twitter, X, Link2 } from "lucide-react"
import { toast } from "sonner"

interface SocialShareProps {
  onShare: (platform: string, message: string) => Promise<string>
  isLoading: boolean
}

export function SocialShare({ onShare, isLoading }: SocialShareProps) {
  const [open, setOpen] = useState(false)
  const [platform, setPlatform] = useState<"twitter" | "linkedin">("twitter")
  const [message, setMessage] = useState("Check out my website analytics! #DataViz #Analytics")
  const [imageUrl, setImageUrl] = useState("")
  const [showCopied, setShowCopied] = useState(false)

  const handleShare = async () => {
    try {
      const url = await onShare(platform, message)
      setImageUrl(url)
    } catch (error) {
      console.error("Error sharing:", error)
      toast.error("Failed to generate shareable image")
    }
  }

  const shareToTwitter = () => {
    if (!imageUrl) return

    const text = encodeURIComponent(message)
    const url = encodeURIComponent(imageUrl)
    window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, "_blank")
    setOpen(false)
  }

  const shareToLinkedIn = () => {
    if (!imageUrl) return

    const text = encodeURIComponent(message)
    const url = encodeURIComponent(imageUrl)
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`, "_blank")
    setOpen(false)
  }

  const copyToClipboard = async () => {
    if (!imageUrl) return

    try {
      await navigator.clipboard.writeText(imageUrl)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
      toast.success("Image URL copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2" disabled={isLoading}>
          <Twitter className="h-4 w-4" />
          {isLoading ? "Processing..." : "Share to Social"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share to social media</DialogTitle>
          <DialogDescription>Share your analytics screenshot on social media</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={platform === "twitter" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setPlatform("twitter")}
            >
              <X className="h-4 w-4 mr-2" />X (Twitter)
            </Button>
            <Button
              type="button"
              variant={platform === "linkedin" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setPlatform("linkedin")}
            >
              <Linkedin className="h-4 w-4 mr-2" />
              LinkedIn
            </Button>
          </div>

          <div className="grid gap-2">
            <label htmlFor="message" className="text-sm font-medium">
              Message
            </label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your thoughts about this data..."
              className="resize-none"
            />
          </div>

          {imageUrl && (
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="link" className="text-sm font-medium">
                  Image URL
                </label>
                <Button variant="ghost" size="sm" className="gap-1 h-7 px-2" onClick={copyToClipboard}>
                  <Link2 className="h-3.5 w-3.5" />
                  {showCopied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <Input id="link" value={imageUrl} readOnly className="w-full" />
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between">
          <div className="flex gap-2">
            {!imageUrl ? (
              <Button onClick={handleShare} disabled={isLoading}>
                {isLoading ? "Processing..." : "Generate Image"}
              </Button>
            ) : (
              <>
                {platform === "twitter" ? (
                  <Button onClick={shareToTwitter}>
                    <X className="h-4 w-4 mr-2" />
                    Share to X
                  </Button>
                ) : (
                  <Button onClick={shareToLinkedIn}>
                    <Linkedin className="h-4 w-4 mr-2" />
                    Share to LinkedIn
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
