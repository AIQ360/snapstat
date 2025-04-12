"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { format } from "date-fns"
import { toPng } from "html-to-image"
import type { DateRange } from "react-day-picker"
import { Download, ZoomIn, ZoomOut, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { SocialShare } from "./social-share"
import { BackgroundSelector } from "./background-selector"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ScreenshotEditorProps {
  children: React.ReactNode
  websiteUrl: string
  dateRange?: DateRange
}

export function ScreenshotEditor({ children, websiteUrl, dateRange }: ScreenshotEditorProps) {
  // Background state
  const [backgroundType, setBackgroundType] = useState<"solid" | "gradient">("gradient")
  const [backgroundColor, setBackgroundColor] = useState("#1A1A2E")
  const [gradientColors, setGradientColors] = useState(["#4B79A1", "#283E51"])
  const [gradientDirection, setGradientDirection] = useState(135)
  const [selectedPreset, setSelectedPreset] = useState<string | null>("ocean")

  // Chart position and size state
  const [chartPosition, setChartPosition] = useState({ x: 50, y: 50 })
  const [chartScale, setChartScale] = useState(100)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [chartTitle, setChartTitle] = useState(websiteUrl || "Website Analytics")
  const [showLogo, setShowLogo] = useState(true)
  const editorRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Handle background gradient change
  const handleGradientChange = (colors: string[], direction: number) => {
    setGradientColors(colors)
    setGradientDirection(direction)
    setSelectedPreset(null)
  }

  // Handle solid color change
  const handleColorChange = (color: string) => {
    setBackgroundColor(color)
    setSelectedPreset(null)
  }

  // Handle preset selection
  const handlePresetSelect = (preset: string, type: "solid" | "gradient", value: any) => {
    setSelectedPreset(preset)
    setBackgroundType(type)
    if (type === "solid") {
      setBackgroundColor(value)
    } else {
      setGradientColors(value.colors)
      setGradientDirection(value.direction)
    }
  }

  // Handle chart dragging
  const startDrag = (e: React.MouseEvent) => {
    if (!contentRef.current) return
    setIsDragging(true)
    setDragStart({
      x: e.clientX - chartPosition.x,
      y: e.clientY - chartPosition.y,
    })
  }

  const onDrag = (e: React.MouseEvent) => {
    if (!isDragging || !editorRef.current) return

    const editorRect = editorRef.current.getBoundingClientRect()
    const newX = Math.max(0, Math.min(e.clientX - dragStart.x, editorRect.width - 20))
    const newY = Math.max(0, Math.min(e.clientY - dragStart.y, editorRect.height - 20))

    setChartPosition({ x: newX, y: newY })
  }

  const endDrag = () => {
    setIsDragging(false)
  }

  // Add event listeners for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && editorRef.current) {
        const editorRect = editorRef.current.getBoundingClientRect()
        const newX = Math.max(0, Math.min(e.clientX - dragStart.x, editorRect.width - 400))
        const newY = Math.max(0, Math.min(e.clientY - dragStart.y, editorRect.height - 300))

        setChartPosition({ x: newX, y: newY })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragStart])

  // Generate screenshot for download
  const generateScreenshot = async (): Promise<string> => {
    if (!editorRef.current) {
      throw new Error("Editor element not found")
    }

    setIsLoading(true)

    try {
      const dataUrl = await toPng(editorRef.current, {
        quality: 0.95,
        backgroundColor: null,
        canvasWidth: editorRef.current.offsetWidth * 2,
        canvasHeight: editorRef.current.offsetHeight * 2,
        pixelRatio: 2,
      })

      return dataUrl
    } catch (error) {
      console.error("Error capturing screenshot:", error)
      throw new Error("Failed to capture screenshot")
    } finally {
      setIsLoading(false)
    }
  }

  // Download screenshot
  const downloadScreenshot = async () => {
    try {
      const dataUrl = await generateScreenshot()

      // Create download link
      const link = document.createElement("a")
      link.download = `${websiteUrl.replace(/[^a-z0-9]/gi, "-")}-${format(new Date(), "yyyy-MM-dd")}.png`
      link.href = dataUrl
      link.click()

      toast.success("Screenshot downloaded successfully")
    } catch (error) {
      toast.error("Failed to download screenshot")
    }
  }

  // Handle social sharing
  const handleSocialShare = async (platform: string, message: string): Promise<string> => {
    try {
      // Generate the image
      const imageUrl = await generateScreenshot()

      // In a real app, you would upload this image to a server and get a public URL
      // For this demo, we'll just return the data URL
      return imageUrl
    } catch (error) {
      console.error("Error sharing:", error)
      throw new Error("Failed to share screenshot")
    }
  }

  // Generate background style
  const getBackgroundStyle = () => {
    if (backgroundType === "solid") {
      return { backgroundColor }
    } else {
      return {
        background: `linear-gradient(${gradientDirection}deg, ${gradientColors[0]}, ${gradientColors[1]})`,
      }
    }
  }

  // Get date range display text
  const getDateRangeText = () => {
    if (!dateRange?.from) return "All time"
    return `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to || new Date(), "MMM d, yyyy")}`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 h-full">
      {/* Sidebar */}
      <div className="bg-card rounded-lg border p-4 space-y-6">
        <Tabs defaultValue="background">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="background">Background</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="position">Position</TabsTrigger>
          </TabsList>

          {/* Background Tab */}
          <TabsContent value="background" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Background Type</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant={backgroundType === "solid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBackgroundType("solid")}
                >
                  Solid
                </Button>
                <Button
                  variant={backgroundType === "gradient" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBackgroundType("gradient")}
                >
                  Gradient
                </Button>
              </div>
            </div>

            {backgroundType === "solid" ? (
              <div className="space-y-2">
                <Label htmlFor="background-color">Background Color</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="background-color"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <span className="text-sm font-mono">{backgroundColor}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Gradient Colors</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={gradientColors[0]}
                      onChange={(e) => handleGradientChange([e.target.value, gradientColors[1]], gradientDirection)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="color"
                      value={gradientColors[1]}
                      onChange={(e) => handleGradientChange([gradientColors[0], e.target.value], gradientDirection)}
                      className="w-16 h-10 p-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Direction: {gradientDirection}°</Label>
                  </div>
                  <Slider
                    value={[gradientDirection]}
                    min={0}
                    max={360}
                    step={1}
                    onValueChange={(value) => handleGradientChange(gradientColors, value[0])}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 pt-4">
              <Label>Presets</Label>
              <BackgroundSelector onSelect={handlePresetSelect} selectedPreset={selectedPreset} />
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chart-title">Title</Label>
                <Input
                  id="chart-title"
                  value={chartTitle}
                  onChange={(e) => setChartTitle(e.target.value)}
                  placeholder="Enter title"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-logo" className="cursor-pointer">
                  Show SnapStats Logo
                </Label>
                <Switch id="show-logo" checked={showLogo} onCheckedChange={setShowLogo} />
              </div>
            </div>
          </TabsContent>

          {/* Position Tab */}
          <TabsContent value="position" className="space-y-4">
            <div className="space-y-2">
              <Label>Scale: {chartScale}%</Label>
              <div className="flex items-center gap-2">
                <ZoomOut className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[chartScale]}
                  min={50}
                  max={150}
                  step={1}
                  onValueChange={(value) => setChartScale(value[0])}
                />
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Position</Label>
              <div className="flex items-center gap-2">
                <div className="grid grid-cols-2 gap-2 w-full">
                  <div className="space-y-1">
                    <Label className="text-xs">X: {Math.round(chartPosition.x)}</Label>
                    <Slider
                      value={[chartPosition.x]}
                      min={0}
                      max={500}
                      step={1}
                      onValueChange={(value) => setChartPosition({ ...chartPosition, x: value[0] })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Y: {Math.round(chartPosition.y)}</Label>
                    <Slider
                      value={[chartPosition.y]}
                      min={0}
                      max={500}
                      step={1}
                      onValueChange={(value) => setChartPosition({ ...chartPosition, y: value[0] })}
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Tip: You can also drag the content directly on the canvas
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            <Button onClick={downloadScreenshot} className="flex items-center gap-2 w-full" disabled={isLoading}>
              <Download size={16} />
              {isLoading ? "Processing..." : "Download PNG"}
            </Button>
            <div className="flex gap-2 w-full">
              <SocialShare onShare={handleSocialShare} isLoading={isLoading} />
              <Button variant="outline" className="flex items-center gap-2 flex-1">
                <Save size={16} />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Canvas */}
      <div ref={editorRef} className="relative rounded-lg overflow-hidden h-[600px]" style={getBackgroundStyle()}>
        <div
          ref={contentRef}
          className={cn(
            "absolute rounded-xl overflow-hidden shadow-2xl cursor-move",
            isDragging ? "opacity-90" : "opacity-100",
          )}
          style={{
            left: `${chartPosition.x}px`,
            top: `${chartPosition.y}px`,
            transform: `scale(${chartScale / 100})`,
            transformOrigin: "top left",
            width: "700px",
            backgroundColor: "white",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            transition: isDragging ? "none" : "all 0.2s ease",
          }}
          onMouseDown={startDrag}
          onMouseMove={onDrag}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
        >
          <div className="p-6 bg-white text-black">
            <div className="mb-4">
              <h3 className="text-xl font-bold">{chartTitle}</h3>
              <p className="text-gray-500">{getDateRangeText()}</p>
            </div>

            {children}

            {showLogo && <div className="text-xs text-gray-400 text-center mt-4 pb-2">Generated with SnapStats</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
