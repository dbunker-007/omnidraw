import type { DrawingLayer, Stroke } from '../../engine/layers/types'
import type { CanvasPoint, ToolDefinition } from './types'
import { PenLine } from 'lucide-react'

const DEFAULT_PENCIL_COLOR = '#f8fafc'
const DEFAULT_PENCIL_WIDTH = 3

export const pencilTool: ToolDefinition = {
  id: 'pencil',
  label: 'Pencil',
  description: 'Draw a new stroke layer',
  icon: PenLine,
}

function createEmptyStroke(): Stroke {
  return {
    points: [{ x: 0, y: 0 }],
    color: DEFAULT_PENCIL_COLOR,
    width: DEFAULT_PENCIL_WIDTH,
  }
}

export function createPencilLayer(
  startPoint: CanvasPoint,
  zIndex: number
): DrawingLayer {
  return {
    id: crypto.randomUUID(),
    type: 'drawing',
    transform: {
      x: startPoint.x,
      y: startPoint.y,
      width: 1,
      height: 1,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
    },
    visible: true,
    locked: false,
    zIndex,
    meta: {
      name: 'Pencil stroke',
      createdAt: Date.now(),
    },
    data: {
      strokes: [createEmptyStroke()],
    },
  }
}

function getPencilBounds(layer: DrawingLayer) {
  const points = layer.data.strokes.flatMap((stroke) => stroke.points)

  if (points.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: 1,
      maxY: 1,
    }
  }

  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxX: Math.max(bounds.maxX, point.x),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    }
  )
}

export function appendPointToPencilLayer(
  layer: DrawingLayer,
  point: CanvasPoint
): DrawingLayer {
  const localPoint = {
    x: point.x - layer.transform.x,
    y: point.y - layer.transform.y,
  }

  const strokes = layer.data.strokes.map((stroke, index) =>
    index === layer.data.strokes.length - 1
      ? {
          ...stroke,
          points: [...stroke.points, localPoint],
        }
      : stroke
  )

  const updatedLayer: DrawingLayer = {
    ...layer,
    data: {
      ...layer.data,
      strokes,
    },
  }

  const bounds = getPencilBounds(updatedLayer)

  return {
    ...updatedLayer,
    transform: {
      ...layer.transform,
      width: Math.max(1, bounds.maxX - bounds.minX),
      height: Math.max(1, bounds.maxY - bounds.minY),
    },
  }
}

export function normalizePencilLayer(layer: DrawingLayer): DrawingLayer {
  const points = layer.data.strokes.flatMap((stroke) => stroke.points)

  if (points.length === 0) {
    return layer
  }

  const bounds = points.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxX: Math.max(acc.maxX, point.x),
      maxY: Math.max(acc.maxY, point.y),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    }
  )

  const normalizedStrokes = layer.data.strokes.map((stroke) => ({
    ...stroke,
    points: stroke.points.map((point) => ({
      x: point.x - bounds.minX,
      y: point.y - bounds.minY,
    })),
  }))

  return {
    ...layer,
    transform: {
      ...layer.transform,
      x: layer.transform.x + bounds.minX,
      y: layer.transform.y + bounds.minY,
      width: Math.max(1, bounds.maxX - bounds.minX),
      height: Math.max(1, bounds.maxY - bounds.minY),
    },
    data: {
      ...layer.data,
      strokes: normalizedStrokes,
    },
  }
}

export function renderPencilLayer(
  context: CanvasRenderingContext2D,
  layer: DrawingLayer
) {
  if (!layer.visible) {
    return
  }

  context.save()
  context.translate(layer.transform.x, layer.transform.y)
  context.globalAlpha = layer.transform.opacity
  context.lineCap = 'round'
  context.lineJoin = 'round'

  for (const stroke of layer.data.strokes) {
    if (stroke.points.length < 1) {
      continue
    }

    context.beginPath()
    context.lineWidth = stroke.width
    context.strokeStyle = stroke.color
    context.moveTo(stroke.points[0].x, stroke.points[0].y)

    for (const point of stroke.points.slice(1)) {
      context.lineTo(point.x, point.y)
    }

    context.stroke()
  }

  context.restore()
}
