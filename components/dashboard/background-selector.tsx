"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

// Expanded gradient presets with more cool options
const BACKGROUND_PRESETS = {
  gradients: [
    { id: "sunset", name: "Sunset", colors: ["#FF8C00", "#FF5733"], direction: 135 },
    { id: "ocean", name: "Ocean", colors: ["#4B79A1", "#283E51"], direction: 135 },
    { id: "purple-haze", name: "Purple Haze", colors: ["#8E2DE2", "#4A00E0"], direction: 135 },
    { id: "sunny", name: "Sunny", colors: ["#FFD700", "#FFA500"], direction: 135 },
    { id: "emerald", name: "Emerald", colors: ["#43C6AC", "#191654"], direction: 135 },
    { id: "cosmic", name: "Cosmic", colors: ["#FF00CC", "#333399"], direction: 135 },
    { id: "fire", name: "Fire", colors: ["#FF416C", "#FF4B2B"], direction: 135 },
    { id: "forest", name: "Forest", colors: ["#134E5E", "#71B280"], direction: 135 },
    { id: "cherry", name: "Cherry", colors: ["#EB3349", "#F45C43"], direction: 135 },
    { id: "moonlight", name: "Moonlight", colors: ["#0F2027", "#2C5364"], direction: 135 },
    { id: "candy", name: "Candy", colors: ["#FF61D2", "#FE9090"], direction: 135 },
    { id: "royal", name: "Royal", colors: ["#141E30", "#243B55"], direction: 135 },
    // New gradients
    { id: "midnight-city", name: "Midnight City", colors: ["#232526", "#414345"], direction: 135 },
    { id: "space", name: "Space", colors: ["#3A1C71", "#D76D77", "#FFAF7B"], direction: 135 },
    { id: "mojito", name: "Mojito", colors: ["#1D976C", "#93F9B9"], direction: 135 },
    { id: "instagram", name: "Instagram", colors: ["#833ab4", "#fd1d1d", "#fcb045"], direction: 45 },
    { id: "azure-pop", name: "Azure Pop", colors: ["#ef32d9", "#89fffd"], direction: 135 },
    { id: "midnight-bloom", name: "Midnight Bloom", colors: ["#2B5876", "#4E4376"], direction: 135 },
    { id: "juicy-orange", name: "Juicy Orange", colors: ["#FF8008", "#FFC837"], direction: 135 },
    { id: "northern-lights", name: "Northern Lights", colors: ["#4CA1AF", "#2C3E50"], direction: 135 },
    { id: "witching-hour", name: "Witching Hour", colors: ["#c31432", "#240b36"], direction: 135 },
    { id: "deep-blue", name: "Deep Blue", colors: ["#000046", "#1CB5E0"], direction: 135 },
    { id: "sunset-vibes", name: "Sunset Vibes", colors: ["#FC466B", "#3F5EFB"], direction: 135 },
    { id: "kyoto", name: "Kyoto", colors: ["#c21500", "#ffc500"], direction: 135 },
    { id: "peachy", name: "Peachy", colors: ["#FFE000", "#799F0C"], direction: 135 },
    { id: "lush", name: "Lush", colors: ["#56ab2f", "#a8e063"], direction: 135 },
    { id: "frost", name: "Frost", colors: ["#000428", "#004e92"], direction: 135 },
    { id: "mauve", name: "Mauve", colors: ["#42275a", "#734b6d"], direction: 135 },
    { id: "royal-blue", name: "Royal Blue", colors: ["#536976", "#292E49"], direction: 135 },
    { id: "wiretap", name: "Wiretap", colors: ["#8A2387", "#E94057", "#F27121"], direction: 135 },
    { id: "terminal", name: "Terminal", colors: ["#000000", "#0f9b0f"], direction: 135 },
    { id: "cosmic-fusion", name: "Cosmic Fusion", colors: ["#ff00cc", "#333399"], direction: 135 },
  ],
  solids: [
    { id: "dark-blue", name: "Dark Blue", color: "#1A1A2E" },
    { id: "black", name: "Black", color: "#000000" },
    { id: "dark-gray", name: "Dark Gray", color: "#121212" },
    { id: "navy", name: "Navy", color: "#0A192F" },
    { id: "charcoal", name: "Charcoal", color: "#2C3E50" },
    { id: "purple", name: "Purple", color: "#4A148C" },
    { id: "teal", name: "Teal", color: "#004D40" },
    { id: "red", name: "Red", color: "#B71C1C" },
    { id: "green", name: "Green", color: "#1B5E20" },
    // New solid colors
    { id: "midnight-blue", name: "Midnight Blue", color: "#191970" },
    { id: "dark-purple", name: "Dark Purple", color: "#301934" },
    { id: "dark-green", name: "Dark Green", color: "#006400" },
    { id: "dark-red", name: "Dark Red", color: "#8B0000" },
    { id: "dark-cyan", name: "Dark Cyan", color: "#008B8B" },
    { id: "dark-magenta", name: "Dark Magenta", color: "#8B008B" },
  ],
}

interface BackgroundSelectorProps {
  onSelect: (preset: string, type: "solid" | "gradient", value: any) => void
  selectedPreset: string | null | undefined
}

export function BackgroundSelector({ onSelect, selectedPreset }: BackgroundSelectorProps) {
  const [activeTab, setActiveTab] = useState<"gradients" | "solids">("gradients")

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <button
          className={cn(
            "px-3 py-1 text-xs rounded-md",
            activeTab === "gradients" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
          onClick={() => setActiveTab("gradients")}
        >
          Gradients
        </button>
        <button
          className={cn(
            "px-3 py-1 text-xs rounded-md",
            activeTab === "solids" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
          onClick={() => setActiveTab("solids")}
        >
          Solid Colors
        </button>
      </div>

      <div className="grid grid-cols-6 gap-1 max-h-[200px] overflow-y-auto pr-2">
        {activeTab === "gradients"
          ? BACKGROUND_PRESETS.gradients.map((preset) => (
              <button
                key={preset.id}
                className={cn(
                  "h-10 rounded-md overflow-hidden border-2",
                  selectedPreset === preset.id ? "border-primary" : "border-transparent",
                )}
                style={{
                  background: `linear-gradient(${preset.direction}deg, ${preset.colors[0]}, ${preset.colors[1]})`,
                }}
                onClick={() => onSelect(preset.id, "gradient", { colors: preset.colors, direction: preset.direction })}
                title={preset.name}
              />
            ))
          : BACKGROUND_PRESETS.solids.map((preset) => (
              <button
                key={preset.id}
                className={cn(
                  "h-10 rounded-md overflow-hidden border-2",
                  selectedPreset === preset.id ? "border-primary" : "border-transparent",
                )}
                style={{ backgroundColor: preset.color }}
                onClick={() => onSelect(preset.id, "solid", preset.color)}
                title={preset.name}
              />
            ))}
      </div>
    </div>
  )
}
