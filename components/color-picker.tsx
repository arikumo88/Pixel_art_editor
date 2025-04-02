"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Predefined color palette
const DEFAULT_COLORS = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#00FFFF",
  "#FF00FF",
  "#C0C0C0",
  "#808080",
  "#800000",
  "#808000",
  "#008000",
  "#800080",
  "#008080",
  "#000080",
  "#FF8080",
  "#FFFF80",
  "#80FF80",
  "#80FFFF",
  "#8080FF",
  "#FF80FF",
  "#A52A2A",
  "#FFA500",
]

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

export default function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [recentColors, setRecentColors] = useState<string[]>([])

  const handleColorChange = (newColor: string) => {
    onChange(newColor)

    // Add to recent colors if not already there
    if (!recentColors.includes(newColor)) {
      setRecentColors([newColor, ...recentColors.slice(0, 7)])
    }
  }

  return (
    <Tabs defaultValue="palette">
      <TabsList className="grid grid-cols-3">
        <TabsTrigger value="palette">Palette</TabsTrigger>
        <TabsTrigger value="recent">Recent</TabsTrigger>
        <TabsTrigger value="custom">Custom</TabsTrigger>
      </TabsList>

      <TabsContent value="palette">
        <div className="grid grid-cols-8 gap-1 mt-2">
          {DEFAULT_COLORS.map((colorValue, index) => (
            <button
              key={index}
              className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
              style={{ backgroundColor: colorValue }}
              onClick={() => handleColorChange(colorValue)}
              aria-label={`Color ${colorValue}`}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="recent">
        {recentColors.length > 0 ? (
          <div className="grid grid-cols-8 gap-1 mt-2">
            {recentColors.map((colorValue, index) => (
              <button
                key={index}
                className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                style={{ backgroundColor: colorValue }}
                onClick={() => handleColorChange(colorValue)}
                aria-label={`Recent color ${colorValue}`}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mt-2">No recent colors</p>
        )}
      </TabsContent>

      <TabsContent value="custom">
        <div className="space-y-2 mt-2">
          <div>
            <Label htmlFor="color-input">Hex Color</Label>
            <Input
              id="color-input"
              type="text"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className="font-mono"
            />
          </div>

          <div>
            <Label htmlFor="color-picker">Color Picker</Label>
            <Input
              id="color-picker"
              type="color"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className="h-10 p-1 w-full"
            />
          </div>

          <Button size="sm" onClick={() => handleColorChange(color)} className="w-full">
            Add to Recent
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  )
}

