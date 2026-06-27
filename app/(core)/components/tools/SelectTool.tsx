import type { Layer } from '../../engine/layers/types'
import type { CanvasPoint, CanvasRect, ToolDefinition } from './types'
import { MousePointer2 } from 'lucide-react'

export const selectTool: ToolDefinition = {
  id: 'select',
  label: 'Select',
  description: 'Select and move layers',
  icon: MousePointer2,
}

export function getLayerBounds(layer: Layer): CanvasRect {
  if (layer.type === 'drawing') {
    const points = layer.data.strokes.flatMap((stroke) => stroke.points)

    if (points.length === 0) {
      return {
        x: layer.transform.x,
        y: layer.transform.y,
        width: layer.transform.width,
        height: layer.transform.height,
      }
    }

    const localBounds = points.reduce(
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

    return {
      x: layer.transform.x + localBounds.minX,
      y: layer.transform.y + localBounds.minY,
      width: Math.max(1, localBounds.maxX - localBounds.minX),
      height: Math.max(1, localBounds.maxY - localBounds.minY),
    }
  }

  return {
    x: layer.transform.x,
    y: layer.transform.y,
    width: layer.transform.width,
    height: layer.transform.height,
  }
}

export function hitTestLayer(point: CanvasPoint, layer: Layer): boolean {
  if (!layer.visible || layer.locked) {
    return false
  }

  const bounds = getLayerBounds(layer)
  const withinX = point.x >= bounds.x && point.x <= bounds.x + bounds.width
  const withinY = point.y >= bounds.y && point.y <= bounds.y + bounds.height

  return withinX && withinY
}

export function moveLayer(layer: Layer, delta: CanvasPoint): Layer {
  return {
    ...layer,
    transform: {
      ...layer.transform,
      x: layer.transform.x + delta.x,
      y: layer.transform.y + delta.y,
    },
  }
}
