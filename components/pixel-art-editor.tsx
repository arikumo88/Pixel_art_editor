"use client"

import type React from "react"

import { useEffect, useRef, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pencil, Eraser, PaintBucket, Undo2, Redo2, Download, ZoomIn, ZoomOut, Pipette, Grid, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import ColorPicker from "./color-picker"

// Canvas size
const CANVAS_SIZE = 64
const DEFAULT_ZOOM = 8

// Update the Tool type to include the gradient tool
type Tool = "pencil" | "eraser" | "bucket" | "eyedropper" | "gradient"

export default function PixelArtEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [showGrid, setShowGrid] = useState(true)
  const [currentColor, setCurrentColor] = useState("#000000")
  const [currentTool, setCurrentTool] = useState<Tool>("pencil")
  const [isDrawing, setIsDrawing] = useState(false)
  // Add brushSize state and gradientStart state
  const [brushSize, setBrushSize] = useState(1)
  const [gradientStart, setGradientStart] = useState<{ x: number; y: number } | null>(null)
  const [gradientStartColor, setGradientStartColor] = useState<string>("transparent")

  // Add layers state
  const [layers, setLayers] = useState<
    {
      id: string
      name: string
      visible: boolean
      data: string[][]
      opacity: number
    }[]
  >([
    {
      id: "layer-1",
      name: "Layer 1",
      visible: true,
      data: Array(CANVAS_SIZE)
        .fill(null)
        .map(() => Array(CANVAS_SIZE).fill("transparent")),
      opacity: 1,
    },
  ])
  const [activeLayerIndex, setActiveLayerIndex] = useState(0)

  // Replace pixelData state with a computed value from layers
  const pixelData = useMemo(() => {
    // Create a blank canvas
    const result = Array(CANVAS_SIZE)
      .fill(null)
      .map(() => Array(CANVAS_SIZE).fill("transparent"))

    // Composite layers from bottom to top
    layers.forEach((layer) => {
      if (!layer.visible) return

      for (let y = 0; y < CANVAS_SIZE; y++) {
        for (let x = 0; x < CANVAS_SIZE; x++) {
          const color = layer.data[y][x]
          if (color !== "transparent") {
            // Simple alpha compositing
            if (layer.opacity < 1) {
              // For semi-transparent layers, we'd need more complex blending
              // This is a simplified version
              const rgbaColor = hexToRgba(color, layer.opacity)
              result[y][x] = rgbaColor
            } else {
              result[y][x] = color
            }
          }
        }
      }
    })

    return result
  }, [layers])

  // Add a helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = Number.parseInt(hex.slice(1, 3), 16)
    const g = Number.parseInt(hex.slice(3, 5), 16)
    const b = Number.parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // Update the history type to work with layers
  const [history, setHistory] = useState<
    {
      id: string
      name: string
      visible: boolean
      data: string[][]
      opacity: number
    }[][][]
  >([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    setCtx(context)

    // Set initial canvas size
    canvas.width = CANVAS_SIZE * zoom
    canvas.height = CANVAS_SIZE * zoom

    // Initial render
    renderCanvas(context)
  }, [])

  // Re-render when zoom, pixelData, or showGrid changes
  useEffect(() => {
    if (!ctx) return

    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = CANVAS_SIZE * zoom
    canvas.height = CANVAS_SIZE * zoom

    renderCanvas(ctx)
  }, [zoom, pixelData, showGrid, ctx])

  // Render the canvas
  const renderCanvas = (context: CanvasRenderingContext2D) => {
    // Clear canvas
    context.clearRect(0, 0, CANVAS_SIZE * zoom, CANVAS_SIZE * zoom)

    // Draw pixels
    for (let y = 0; y < CANVAS_SIZE; y++) {
      for (let x = 0; x < CANVAS_SIZE; x++) {
        const color = pixelData[y][x]
        if (color !== "transparent") {
          context.fillStyle = color
          context.fillRect(x * zoom, y * zoom, zoom, zoom)
        }
      }
    }

    // Draw grid
    if (showGrid && zoom >= 4) {
      context.strokeStyle = "#cccccc"
      context.lineWidth = 0.5

      for (let i = 0; i <= CANVAS_SIZE; i++) {
        // Vertical lines
        context.beginPath()
        context.moveTo(i * zoom, 0)
        context.lineTo(i * zoom, CANVAS_SIZE * zoom)
        context.stroke()

        // Horizontal lines
        context.beginPath()
        context.moveTo(0, i * zoom)
        context.lineTo(CANVAS_SIZE * zoom, i * zoom)
        context.stroke()
      }
    }
  }

  // Save current state to history
  const saveToHistory = () => {
    // Create a deep copy of the layers
    const layersCopy = layers.map((layer) => ({
      ...layer,
      data: layer.data.map((row) => [...row]),
    }))

    // If we're not at the end of the history, remove future states
    if (historyIndex < history.length - 1) {
      setHistory(history.slice(0, historyIndex + 1))
    }

    // Add new state to history
    setHistory([...history, layersCopy])
    setHistoryIndex(historyIndex + 1)
  }

  // Handle undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setLayers(JSON.parse(JSON.stringify(history[historyIndex - 1])))
    }
  }

  // Handle redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setLayers(JSON.parse(JSON.stringify(history[historyIndex])))
    }
  }

  // Get pixel coordinates from mouse event
  const getPixelCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: -1, y: -1 }

    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) / zoom)
    const y = Math.floor((e.clientY - rect.top) / zoom)

    return { x, y }
  }

  // Draw a pixel
  const drawPixel = (x: number, y: number) => {
    if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) return

    // Create a copy of the current layers
    const newLayers = [...layers]
    const activeLayer = { ...newLayers[activeLayerIndex] }
    const newLayerData = activeLayer.data.map((row) => [...row])

    // Draw with brush size
    for (let by = -Math.floor(brushSize / 2); by < Math.ceil(brushSize / 2); by++) {
      for (let bx = -Math.floor(brushSize / 2); bx < Math.ceil(brushSize / 2); bx++) {
        const px = x + bx
        const py = y + by

        if (px >= 0 && px < CANVAS_SIZE && py >= 0 && py < CANVAS_SIZE) {
          if (currentTool === "pencil") {
            newLayerData[py][px] = currentColor
          } else if (currentTool === "eraser") {
            newLayerData[py][px] = "transparent"
          } else if (currentTool === "eyedropper") {
            const color = layers[activeLayerIndex].data[py][px]
            if (color !== "transparent") {
              setCurrentColor(color)
            }
            setCurrentTool("pencil")
            return
          }
        }
      }
    }

    // Update the layer data
    activeLayer.data = newLayerData
    newLayers[activeLayerIndex] = activeLayer
    setLayers(newLayers)
  }

  // Fill bucket tool implementation
  const fillBucket = (x: number, y: number) => {
    if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) return

    const newLayers = [...layers]
    const activeLayer = { ...newLayers[activeLayerIndex] }
    const newLayerData = activeLayer.data.map((row) => [...row])

    const targetColor = activeLayer.data[y][x]
    if (targetColor === currentColor) return

    // Flood fill algorithm
    const fill = (x: number, y: number) => {
      if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) return
      if (newLayerData[y][x] !== targetColor) return

      newLayerData[y][x] = currentColor

      fill(x + 1, y)
      fill(x - 1, y)
      fill(x, y + 1)
      fill(x, y - 1)
    }

    fill(x, y)
    activeLayer.data = newLayerData
    newLayers[activeLayerIndex] = activeLayer
    setLayers(newLayers)
  }

  // Add a gradient function
  const createGradient = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    startColor: string,
    endColor: string,
  ) => {
    const newLayers = [...layers]
    const activeLayer = { ...newLayers[activeLayerIndex] }
    const newLayerData = activeLayer.data.map((row) => [...row])

    // Calculate the distance between start and end points
    const dx = endX - startX
    const dy = endY - startY
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Parse colors
    const startR = Number.parseInt(startColor.slice(1, 3), 16)
    const startG = Number.parseInt(startColor.slice(3, 5), 16)
    const startB = Number.parseInt(startColor.slice(5, 7), 16)

    const endR = Number.parseInt(endColor.slice(1, 3), 16)
    const endG = Number.parseInt(endColor.slice(3, 5), 16)
    const endB = Number.parseInt(endColor.slice(5, 7), 16)

    // Create a line between the two points using Bresenham's algorithm
    // and then expand outward to fill the area
    const plotLine = (x0: number, y0: number, x1: number, y1: number) => {
      const dx = Math.abs(x1 - x0)
      const dy = Math.abs(y1 - y0)
      const sx = x0 < x1 ? 1 : -1
      const sy = y0 < y1 ? 1 : -1
      let err = dx - dy

      while (true) {
        // Calculate gradient color at this point
        const t = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)) / distance

        const r = Math.round(startR + t * (endR - startR))
        const g = Math.round(startG + t * (endG - startG))
        const b = Math.round(startB + t * (endB - startB))

        const color = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`

        if (x0 >= 0 && x0 < CANVAS_SIZE && y0 >= 0 && y0 < CANVAS_SIZE) {
          newLayerData[y0][x0] = color
        }

        if (x0 === x1 && y0 === y1) break
        const e2 = 2 * err
        if (e2 > -dy) {
          err -= dy
          x0 += sx
        }
        if (e2 < dx) {
          err += dx
          y0 += sy
        }
      }
    }

    // For each pixel in the canvas, calculate its distance to the line
    // and interpolate the color based on that
    for (let y = 0; y < CANVAS_SIZE; y++) {
      for (let x = 0; x < CANVAS_SIZE; x++) {
        // Calculate the projection of this point onto the line
        const t = ((x - startX) * dx + (y - startY) * dy) / (dx * dx + dy * dy)

        // Clamp t to [0, 1]
        const tClamped = Math.max(0, Math.min(1, t))

        // Calculate the color at this point
        const r = Math.round(startR + tClamped * (endR - startR))
        const g = Math.round(startG + tClamped * (endG - startG))
        const b = Math.round(startB + tClamped * (endB - startB))

        const color = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`

        newLayerData[y][x] = color
      }
    }

    activeLayer.data = newLayerData
    newLayers[activeLayerIndex] = activeLayer
    setLayers(newLayers)
  }

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getPixelCoords(e)

    if (currentTool === "gradient") {
      if (!gradientStart) {
        // First click - set start point
        setGradientStart({ x, y })
        setGradientStartColor(currentColor)
      } else {
        // Second click - create gradient and reset
        saveToHistory()
        createGradient(gradientStart.x, gradientStart.y, x, y, gradientStartColor, currentColor)
        setGradientStart(null)
      }
      return
    }

    setIsDrawing(true)

    // Save current state before making changes
    saveToHistory()

    if (currentTool === "bucket") {
      fillBucket(x, y)
    } else {
      drawPixel(x, y)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    if (currentTool === "bucket" || currentTool === "eyedropper" || currentTool === "gradient") return

    const { x, y } = getPixelCoords(e)
    drawPixel(x, y)
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const handleMouseLeave = () => {
    setIsDrawing(false)
  }

  // Add layer management functions
  const addLayer = () => {
    saveToHistory()
    const newLayer = {
      id: `layer-${layers.length + 1}`,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      data: Array(CANVAS_SIZE)
        .fill(null)
        .map(() => Array(CANVAS_SIZE).fill("transparent")),
      opacity: 1,
    }
    setLayers([...layers, newLayer])
    setActiveLayerIndex(layers.length)
  }

  const removeLayer = (index: number) => {
    if (layers.length <= 1) return // Don't remove the last layer

    saveToHistory()
    const newLayers = [...layers]
    newLayers.splice(index, 1)
    setLayers(newLayers)

    // Adjust active layer index if needed
    if (activeLayerIndex >= newLayers.length) {
      setActiveLayerIndex(newLayers.length - 1)
    } else if (activeLayerIndex === index) {
      setActiveLayerIndex(Math.max(0, index - 1))
    }
  }

  const toggleLayerVisibility = (index: number) => {
    saveToHistory()
    const newLayers = [...layers]
    newLayers[index] = {
      ...newLayers[index],
      visible: !newLayers[index].visible,
    }
    setLayers(newLayers)
  }

  const setLayerOpacity = (index: number, opacity: number) => {
    const newLayers = [...layers]
    newLayers[index] = {
      ...newLayers[index],
      opacity,
    }
    setLayers(newLayers)
  }

  const moveLayer = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= layers.length || toIndex >= layers.length) return

    saveToHistory()
    const newLayers = [...layers]
    const [movedLayer] = newLayers.splice(fromIndex, 1)
    newLayers.splice(toIndex, 0, movedLayer)
    setLayers(newLayers)

    // Update active layer index
    if (activeLayerIndex === fromIndex) {
      setActiveLayerIndex(toIndex)
    }
  }

  // Export as PNG
  const exportAsPNG = () => {
    const canvas = document.createElement("canvas")
    canvas.width = CANVAS_SIZE
    canvas.height = CANVAS_SIZE
    const context = canvas.getContext("2d")

    if (!context) return

    // Draw pixels without zoom
    for (let y = 0; y < CANVAS_SIZE; y++) {
      for (let x = 0; x < CANVAS_SIZE; x++) {
        const color = pixelData[y][x]
        if (color !== "transparent") {
          context.fillStyle = color
          context.fillRect(x, y, 1, 1)
        }
      }
    }

    // Create download link
    const link = document.createElement("a")
    link.download = "pixel-art.png"
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  // Save as JSON
  const saveAsJSON = () => {
    const data = JSON.stringify({ layers })
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.download = "pixel-art.json"
    link.href = url
    link.click()

    URL.revokeObjectURL(url)
  }

  // Zoom controls
  const zoomIn = () => {
    if (zoom < 32) setZoom(zoom + 1)
  }

  const zoomOut = () => {
    if (zoom > 1) setZoom(zoom - 1)
  }

  // Update the return JSX to include brush size slider, gradient tool, and layers UI
  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Canvas */}
      <div className="flex-1 flex flex-col items-center">
        <div className="border border-gray-300 rounded-md overflow-auto bg-white shadow-md">
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            />
            {gradientStart && (
              <div
                className="absolute w-2 h-2 bg-red-500 border border-white rounded-full pointer-events-none"
                style={{
                  left: gradientStart.x * zoom,
                  top: gradientStart.y * zoom,
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}
          </div>
        </div>

        {/* Zoom and brush size controls */}
        <div className="flex flex-wrap items-center gap-2 mt-4 w-full">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={zoomOut} disabled={zoom <= 1}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <div className="w-24 flex items-center">
              <Slider value={[zoom]} min={1} max={32} step={1} onValueChange={(value) => setZoom(value[0])} />
            </div>
            <Button variant="outline" size="icon" onClick={zoomIn} disabled={zoom >= 32}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="text-sm ml-2">{zoom}x</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            className={cn(showGrid && "bg-gray-100")}
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm whitespace-nowrap">Brush Size:</span>
            <div className="w-24 flex items-center">
              <Slider value={[brushSize]} min={1} max={10} step={1} onValueChange={(value) => setBrushSize(value[0])} />
            </div>
            <span className="text-sm">{brushSize}px</span>
          </div>
        </div>
      </div>

      {/* Tools */}
      <div className="w-full lg:w-64 flex flex-col gap-4">
        <Tabs defaultValue="tools">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="layers">Layers</TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              <Button
                variant="outline"
                size="icon"
                className={cn(currentTool === "pencil" && "bg-gray-100")}
                onClick={() => setCurrentTool("pencil")}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(currentTool === "eraser" && "bg-gray-100")}
                onClick={() => setCurrentTool("eraser")}
              >
                <Eraser className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(currentTool === "bucket" && "bg-gray-100")}
                onClick={() => setCurrentTool("bucket")}
              >
                <PaintBucket className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(currentTool === "eyedropper" && "bg-gray-100")}
                onClick={() => setCurrentTool("eyedropper")}
              >
                <Pipette className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(currentTool === "gradient" && "bg-gray-100")}
                onClick={() => {
                  setCurrentTool("gradient")
                  setGradientStart(null)
                }}
                title="Gradient Tool (click two points)"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="6" width="20" height="12" rx="2" fill="url(#gradient)" />
                  <defs>
                    <linearGradient id="gradient" x1="2" y1="12" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#000000" />
                      <stop offset="1" stopColor="#FFFFFF" />
                    </linearGradient>
                  </defs>
                </svg>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={handleUndo} disabled={historyIndex <= 0}>
                <Undo2 className="h-4 w-4 mr-2" />
                Undo
              </Button>
              <Button variant="outline" size="sm" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
                <Redo2 className="h-4 w-4 mr-2" />
                Redo
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={exportAsPNG}>
                <Download className="h-4 w-4 mr-2" />
                Export PNG
              </Button>
              <Button variant="outline" size="sm" onClick={saveAsJSON}>
                <Save className="h-4 w-4 mr-2" />
                Save JSON
              </Button>
            </div>

            {currentTool === "gradient" && gradientStart && (
              <div className="p-2 border rounded-md bg-gray-50">
                <p className="text-xs text-gray-500 mb-2">
                  Gradient start point selected. Click on the canvas to set the end point.
                </p>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setGradientStart(null)}>
                  Cancel
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="colors">
            <ColorPicker color={currentColor} onChange={setCurrentColor} />

            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Current Color</h3>
              <div className="w-full h-8 rounded border border-gray-300" style={{ backgroundColor: currentColor }} />
            </div>
          </TabsContent>

          <TabsContent value="layers" className="space-y-4">
            <div className="flex justify-between">
              <h3 className="text-sm font-medium">Layers</h3>
              <Button variant="outline" size="sm" onClick={addLayer}>
                Add Layer
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {layers.map((layer, index) => (
                <div
                  key={layer.id}
                  className={cn(
                    "p-2 border rounded-md flex items-center gap-2",
                    activeLayerIndex === index && "border-black bg-gray-50",
                  )}
                  onClick={() => setActiveLayerIndex(index)}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleLayerVisibility(index)
                    }}
                  >
                    {layer.visible ? (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z"
                          fill="currentColor"
                        />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M12 7C14.76 7 17 9.24 17 12C17 12.65 16.87 13.26 16.64 13.83L19.56 16.75C21.07 15.49 22.26 13.86 23 12C21.27 7.61 17 4.5 12 4.5C10.6 4.5 9.26 4.75 8 5.2L10.17 7.37C10.74 7.13 11.35 7 12 7ZM2 4.27L4.28 6.55L4.74 7.01C3.08 8.3 1.78 10.02 1 12C2.73 16.39 7 19.5 12 19.5C13.55 19.5 15.03 19.2 16.38 18.66L16.8 19.08L19.73 22L21 20.73L3.27 3L2 4.27ZM7.53 9.8L9.08 11.35C9.03 11.56 9 11.78 9 12C9 13.66 10.34 15 12 15C12.22 15 12.44 14.97 12.65 14.92L14.2 16.47C13.53 16.8 12.79 17 12 17C9.24 17 7 14.76 7 12C7 11.21 7.2 10.47 7.53 9.8ZM11.84 9.02L14.99 12.17L15.01 12.01C15.01 10.35 13.67 9.01 12.01 9.01L11.84 9.02Z"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </Button>

                  <span className="text-sm flex-grow truncate">{layer.name}</span>

                  <div className="flex items-center gap-1">
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          moveLayer(index, index - 1)
                        }}
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 14l5-5 5 5H7z" fill="currentColor" />
                        </svg>
                      </Button>
                    )}

                    {index < layers.length - 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          moveLayer(index, index + 1)
                        }}
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 10l5 5 5-5H7z" fill="currentColor" />
                        </svg>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeLayer(index)
                      }}
                      disabled={layers.length <= 1}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                          fill="currentColor"
                        />
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {layers[activeLayerIndex] && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium">Layer Opacity</h4>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[layers[activeLayerIndex].opacity * 100]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value) => {
                      setLayerOpacity(activeLayerIndex, value[0] / 100)
                    }}
                  />
                  <span className="text-sm">{Math.round(layers[activeLayerIndex].opacity * 100)}%</span>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

