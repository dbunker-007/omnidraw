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
  getHandleAtPoint,
  getSelectionGeometry,
  hitTestLayer,
  moveLayer,
  rotateLayer,
  resizeLayer,
  type SelectionHandleId,
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
      mode: 'drawing'
      layerId: string
    }
  | {
      mode: 'moving'
      layerId: string
      lastPoint: CanvasPoint
    }
  | {
      mode: 'resizing'
      layerId: string
      handleId: Exclude<SelectionHandleId, 'rotate'>
      startLayer: Layer
    }
  | {
      mode: 'rotating'
      layerId: string
      startLayer: Layer
      startPointer: CanvasPoint
      startRotation: number
    }

function isDrawingLayer(layer: Layer): layer is DrawingLayer {
  return layer.type === 'drawing'
}

function getLayerById(layers: Layer[], layerId: string | null) {
  if (layerId === null) {
    return null
  }

  return layers.find((layer) => layer.id === layerId) ?? null
}

function drawHandle(
  context: CanvasRenderingContext2D,
  point: CanvasPoint,
  isRotationHandle = false
) {
  const size = isRotationHandle ? 8 : 7
  const halfSize = size / 2

  context.beginPath()
  if (isRotationHandle) {
    context.arc(point.x, point.y, 4, 0, Math.PI * 2)
    context.fill()
    context.stroke()
    return
  }

  context.rect(point.x - halfSize, point.y - halfSize, size, size)
  context.fill()
  context.stroke()
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
  const pencilColor = useEditorStore((state) => state.pencilColor)
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

    const selectedLayer = getLayerById(orderedLayers, activeLayerId)

    if (selectedLayer && activeTool === 'select') {
      const geometry = getSelectionGeometry(selectedLayer)

      context.save()
      context.strokeStyle = '#2563eb'
      context.fillStyle = '#ffffff'
      context.lineWidth = 1

      const { nw, ne, se, sw } = geometry.corners

      context.beginPath()
      context.moveTo(nw.x, nw.y)
      context.lineTo(ne.x, ne.y)
      context.lineTo(se.x, se.y)
      context.lineTo(sw.x, sw.y)
      context.closePath()
      context.stroke()

      context.beginPath()
      context.moveTo(geometry.corners.n.x, geometry.corners.n.y)
      context.lineTo(geometry.rotationHandle.x, geometry.rotationHandle.y)
      context.stroke()

      drawHandle(context, geometry.corners.nw)
      drawHandle(context, geometry.corners.n)
      drawHandle(context, geometry.corners.ne)
      drawHandle(context, geometry.corners.e)
      drawHandle(context, geometry.corners.se)
      drawHandle(context, geometry.corners.s)
      drawHandle(context, geometry.corners.sw)
      drawHandle(context, geometry.corners.w)
      drawHandle(context, geometry.rotationHandle, true)

      context.restore()
    }
  }, [activeLayerId, activeTool, backgroundColor, layers])

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
      const layer = createPencilLayer(point, nextZIndex, pencilColor)
      addLayer(layer)
      setActiveLayerId(layer.id)
      interactionRef.current = {
        mode: 'drawing',
        layerId: layer.id,
      }
      return
    }

    const selectedLayer = getLayerById(layers, activeLayerId)

    if (selectedLayer) {
      const handleId = getHandleAtPoint(point, selectedLayer)

      if (handleId === 'rotate') {
        interactionRef.current = {
          mode: 'rotating',
          layerId: selectedLayer.id,
          startLayer: selectedLayer,
          startPointer: point,
          startRotation: selectedLayer.transform.rotation,
        }
        return
      }

      if (handleId) {
        interactionRef.current = {
          mode: 'resizing',
          layerId: selectedLayer.id,
          handleId,
          startLayer: selectedLayer,
        }
        return
      }

      if (hitTestLayer(point, selectedLayer)) {
        interactionRef.current = {
          mode: 'moving',
          layerId: selectedLayer.id,
          lastPoint: point,
        }
        return
      }
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
      mode: 'moving',
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

    if (interaction.mode === 'drawing') {
      updateLayer(interaction.layerId, (layer) => {
        if (!isDrawingLayer(layer)) {
          return layer
        }

        return appendPointToPencilLayer(layer, point)
      })
      return
    }

    if (interaction.mode === 'moving') {
      const delta = {
        x: point.x - interaction.lastPoint.x,
        y: point.y - interaction.lastPoint.y,
      }

      updateLayer(interaction.layerId, (layer) => moveLayer(layer, delta))
      interactionRef.current = {
        ...interaction,
        lastPoint: point,
      }
      return
    }

    if (interaction.mode === 'resizing') {
      updateLayer(interaction.layerId, () =>
        resizeLayer(interaction.startLayer, interaction.handleId, point)
      )
      return
    }

    if (interaction.mode === 'rotating') {
      updateLayer(interaction.layerId, () =>
        rotateLayer(
          interaction.startLayer,
          point,
          interaction.startPointer,
          interaction.startRotation,
          {
            x:
              interaction.startLayer.transform.x +
              (interaction.startLayer.transform.width *
                interaction.startLayer.transform.scaleX) /
                2,
            y:
              interaction.startLayer.transform.y +
              (interaction.startLayer.transform.height *
                interaction.startLayer.transform.scaleY) /
                2,
          }
        )
      )
    }
  }

  const finishInteraction = (event: PointerEvent<HTMLCanvasElement>) => {
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

    const canvas = canvasRef.current

    if (canvas && canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId)
    }
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
