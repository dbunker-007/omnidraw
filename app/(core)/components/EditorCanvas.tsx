'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { PointerEvent } from 'react'
import type { DrawingLayer, Layer } from '../engine/layers/types'
import { useEditorStore } from '../store/editorStore'
import {
  appendPointToPencilLayer,
  createPencilLayer,
  normalizePencilLayer,
  renderPencilLayer,
} from './tools/PencilTool'
import {
  getLayerBounds,
  hitTestLayer,
  moveLayer,
} from './tools/SelectTool'
import type { CanvasPoint, EditorToolId } from './tools/types'

type EditorCanvasProps = {
  className?: string
  activeTool: EditorToolId
}

type InteractionState =
  | {
      mode: 'idle'
    }
  | {
      mode: 'dragging'
      layerId: string
      lastPoint: CanvasPoint
    }
  | {
      mode: 'drawing'
      layerId: string
    }

function isDrawingLayer(layer: Layer): layer is DrawingLayer {
  return layer.type === 'drawing'
}

export default function EditorCanvas({
  className,
  activeTool,
}: EditorCanvasProps) {
  const width = useEditorStore((state) => state.editorState.canvas.width)
  const height = useEditorStore((state) => state.editorState.canvas.height)
  const backgroundColor = useEditorStore(
    (state) => state.editorState.canvas.background.color
  )
  const layers = useEditorStore((state) => state.editorState.layers)
  const activeLayerId = useEditorStore((state) => state.editorState.activeLayerId)
  const setActiveLayerId = useEditorStore((state) => state.setActiveLayerId)
  const addLayer = useEditorStore((state) => state.addLayer)
  const updateLayer = useEditorStore((state) => state.updateLayer)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const interactionRef = useRef<InteractionState>({ mode: 'idle' })

  const getCanvasPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current

    if (!canvas) {
      return { x: 0, y: 0 }
    }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    }
  }

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    context.clearRect(0, 0, canvas.width, canvas.height)

    if (backgroundColor !== null) {
      context.fillStyle = backgroundColor
      context.fillRect(0, 0, canvas.width, canvas.height)
    }

    const orderedLayers = [...layers].sort((left, right) => left.zIndex - right.zIndex)

    for (const layer of orderedLayers) {
      if (layer.type === 'drawing') {
        renderPencilLayer(context, layer)
      }
    }

    const selectedLayer = orderedLayers.find((layer) => layer.id === activeLayerId)

    if (selectedLayer) {
      const bounds = getLayerBounds(selectedLayer)

      context.save()
      context.strokeStyle = '#22d3ee'
      context.lineWidth = 2
      context.setLineDash([8, 6])
      context.strokeRect(bounds.x - 2, bounds.y - 2, bounds.width + 4, bounds.height + 4)
      context.restore()
    }
  }, [activeLayerId, backgroundColor, layers])

  useEffect(() => {
    renderCanvas()
  }, [renderCanvas, width, height])

  useEffect(() => {
    interactionRef.current = { mode: 'idle' }
  }, [activeTool])

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    canvas.setPointerCapture(event.pointerId)
    const point = getCanvasPoint(event)

    if (activeTool === 'pencil') {
      const nextZIndex = layers.reduce(
        (maxZIndex, layer) => Math.max(maxZIndex, layer.zIndex),
        -1
      ) + 1
      const layer = createPencilLayer(point, nextZIndex)
      addLayer(layer)
      setActiveLayerId(layer.id)
      interactionRef.current = {
        mode: 'drawing',
        layerId: layer.id,
      }
      return
    }

    const targetLayer = [...layers]
      .sort((left, right) => right.zIndex - left.zIndex)
      .find((layer) => hitTestLayer(point, layer))

    if (!targetLayer) {
      setActiveLayerId(null)
      interactionRef.current = { mode: 'idle' }
      return
    }

    setActiveLayerId(targetLayer.id)
    interactionRef.current = {
      mode: 'dragging',
      layerId: targetLayer.id,
      lastPoint: point,
    }
  }

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    const interaction = interactionRef.current

    if (interaction.mode === 'idle') {
      return
    }

    const point = getCanvasPoint(event)

    if (interaction.mode === 'drawing' && interaction.layerId) {
      updateLayer(interaction.layerId, (layer) => {
        if (!isDrawingLayer(layer)) {
          return layer
        }

        return appendPointToPencilLayer(layer, point)
      })
      return
    }

    if (interaction.mode === 'dragging') {
      const delta = {
        x: point.x - interaction.lastPoint.x,
        y: point.y - interaction.lastPoint.y,
      }

      updateLayer(interaction.layerId, (layer) => moveLayer(layer, delta))
      interactionRef.current = {
        ...interaction,
        lastPoint: point,
      }
    }
  }

  const finishInteraction = () => {
    const interaction = interactionRef.current

    if (interaction.mode === 'drawing') {
      updateLayer(interaction.layerId, (layer) => {
        if (!isDrawingLayer(layer)) {
          return layer
        }

        return normalizePencilLayer(layer)
      })
    }

    interactionRef.current = { mode: 'idle' }
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishInteraction}
      onPointerCancel={finishInteraction}
      className={className}
      aria-label="Editor canvas"
    />
  )
}
