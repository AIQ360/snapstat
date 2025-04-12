"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { format } from "date-fns"
import { toPng } from "html-to-image"
import type { DateRange } from "react-day-picker"
import { Download, Share2, ZoomIn, ZoomOut, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { DateRangePicker } from "./date-range-picker"
import { AnalyticsChart } from "./analytics-chart"
import { StatsCard } from "./stats-card"
import { BackgroundSelector } from "./background-selector"
import { SocialShare } from "./social-share"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ScreenshotViewProps {
  websiteUrl: string
  analyticsData: any[]
}

export function ScreenshotView({ websiteUrl, analyticsData }: ScreenshotViewProps) {
  // Date range state
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  })

  // Background state
  const [backgroundType, setBackgroundType] = useState<"solid" | "gradient">("gradient")
  const [backgroundColor, setBackgroundColor] = useState("#1A1A2E")
  const [gradientColors, setGradientColors] = useState(["#4B79A1", "#283E51"])
  const [gradientDirection, setGradientDirection] = useState(135)
  const [selectedPreset, setSelectedPreset] = useState<string | null>("ocean")

  // Content position and size state
  const [contentPosition, setContentPosition] = useState({ x: 50, y: 50 })
  const [contentScale, setContentScale] = useState(100)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [chartTitle, setChartTitle] = useState(websiteUrl || "Website Analytics")
  const [showLogo, setShowLogo] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)

  // Refs
  const editorRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const screenshotRef = useRef<HTMLDivElement>(null)

  // Filter data based on date range
  const filteredData = analyticsData.filter((item) => {
    const itemDate = new Date(item.date)
    return (!dateRange?.from || itemDate >= dateRange.from) && (!dateRange?.to || itemDate <= dateRange.to)
  })

  // Calculate stats
  const totalVisitors = filteredData.reduce((sum, item) => sum + item.visitors, 0)
  const totalPageViews = filteredData.reduce((sum, item) => sum + item.page_views, 0)
  const avgBounceRate =
    filteredData.length > 0 ? filteredData.reduce((sum, item) => sum + item.bounce_rate, 0) / filteredData.length : 0
  const avgSessionDuration =
    filteredData.length > 0
      ? filteredData.reduce((sum, item) => sum + item.avg_session_duration, 0) / filteredData.length
      : 0

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

  // Handle content dragging
  const startDrag = (e: React.MouseEvent) => {
    if (!contentRef.current || !isEditMode) return
    setIsDragging(true)
    setDragStart({
      x: e.clientX - contentPosition.x,
      y: e.clientY - contentPosition.y,
    })
  }

  const onDrag = (e: React.MouseEvent) => {
    if (!isDragging || !editorRef.current) return

    const editorRect = editorRef.current.getBoundingClientRect()
    const newX = Math.max(0, Math.min(e.clientX - dragStart.x, editorRect.width - 20))
    const newY = Math.max(0, Math.min(e.clientY - dragStart.y, editorRect.height - 20))

    setContentPosition({ x: newX, y: newY })
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

        setContentPosition({ x: newX, y: newY })
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
    const targetRef = isEditMode ? editorRef.current : screenshotRef.current

    if (!targetRef) {
      throw new Error("Screenshot element not found")
    }

    setIsLoading(true)

    try {
      const dataUrl = await toPng(targetRef, {
        quality: 0.95,
        backgroundColor: isEditMode ? null : "white",
        canvasWidth: targetRef.offsetWidth * 2,
        canvasHeight: targetRef.offsetHeight * 2,
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
  const handleDownloadScreenshot = async () => {
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

  // Handle basic share
  const handleBasicShare = async () => {
    if (!screenshotRef.current) return

    try {
      const dataUrl = await toPng(screenshotRef.current, {
        quality: 0.95,
        backgroundColor: "white",
      })

      const blob = await fetch(dataUrl).then((res) => res.blob())
      const file = new File([blob], `snapstats-${format(new Date(), "yyyy-MM-dd")}.png`, { type: "image/png" })

      if (navigator.share) {
        await navigator.share({
          title: "My Website Stats",
          text: `Check out my website stats for ${websiteUrl}`,
          files: [file],
        })
      } else {
        // Fallback for browsers that don't support the Web Share API
        handleDownloadScreenshot()
      }
    } catch (error) {
      console.error("Error sharing screenshot:", error)
      toast.error("Failed to share screenshot")
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

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode)
  }

  // Render screenshot content
  const renderScreenshotContent = () => (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center space-y-2 text-center">
        <h3 className="text-2xl font-bold">{chartTitle}</h3>
        <p className="text-sm text-muted-foreground">{getDateRangeText()}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Visitors" value={totalVisitors} />
        <StatsCard title="Page Views" value={totalPageViews} />
        <StatsCard title="Avg. Bounce Rate" value={`${avgBounceRate.toFixed(2)}%`} />
        <StatsCard
          title="Avg. Session Duration"
          value={`${Math.floor(avgSessionDuration / 60)}m ${Math.floor(avgSessionDuration % 60)}s`}
        />
      </div>

      <AnalyticsChart title="Visitors Over Time" data={filteredData} dataKey="visitors" chartType="area" />

      {showLogo && <div className="text-xs text-muted-foreground text-center mt-4">Generated with SnapStats</div>}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Screenshot View</h2>
        <div className="flex items-center gap-2">
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
          <Button variant={isEditMode ? "default" : "outline"} onClick={toggleEditMode}>
            {isEditMode ? "Exit Editor" : "Customize"}
          </Button>
        </div>
      </div>

      {isEditMode ? (
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
                  <Label>Scale: {contentScale}%</Label>
                  <div className="flex items-center gap-2">
                    <ZoomOut className="h-4 w-4 text-muted-foreground" />
                    <Slider
                      value={[contentScale]}
                      min={50}
                      max={150}
                      step={1}
                      onValueChange={(value) => setContentScale(value[0])}
                    />
                    <ZoomIn className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Position</Label>
                  <div className="flex items-center gap-2">
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <div className="space-y-1">
                        <Label className="text-xs">X: {Math.round(contentPosition.x)}</Label>
                        <Slider
                          value={[contentPosition.x]}
                          min={0}
                          max={500}
                          step={1}
                          onValueChange={(value) => setContentPosition({ ...contentPosition, x: value[0] })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Y: {Math.round(contentPosition.y)}</Label>
                        <Slider
                          value={[contentPosition.y]}
                          min={0}
                          max={500}
                          step={1}
                          onValueChange={(value) => setContentPosition({ ...contentPosition, y: value[0] })}
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
                <Button
                  onClick={handleDownloadScreenshot}
                  className="flex items-center gap-2 w-full"
                  disabled={isLoading}
                >
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
                "absolute rounded-xl overflow-hidden shadow-2xl",
                isDragging ? "opacity-90" : "opacity-100",
                isEditMode ? "cursor-move" : "",
              )}
              style={{
                left: `${contentPosition.x}px`,
                top: `${contentPosition.y}px`,
                transform: `scale(${contentScale / 100})`,
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
              <div className="p-6 bg-white text-black">{renderScreenshotContent()}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div ref={screenshotRef} className="space-y-4 rounded-lg border p-6">
            {renderScreenshotContent()}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleDownloadScreenshot}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button onClick={handleBasicShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
