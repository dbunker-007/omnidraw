import { MousePointer2 } from 'lucide-react'
import type { Layer } from '../../engine/layers/types'
import type { CanvasPoint, CanvasRect, ToolDefinition } from './types'

export const selectTool: ToolDefinition = {
  id: 'select',
  label: 'Select',
  description: 'Select, move, resize, and rotate layers',
  icon: MousePointer2,
}

export type SelectionHandleId =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
  | 'rotate'

export type SelectionHandle = {
  id: SelectionHandleId
  x: number
  y: number
}

const HANDLE_SIZE = 8
const ROTATE_HANDLE_OFFSET = 26

function toRadians(angle: number) {
  return (angle * Math.PI) / 180
}

function rotatePoint(point: CanvasPoint, center: CanvasPoint, angle: number) {
  const radians = toRadians(angle)
  const sine = Math.sin(radians)
  const cosine = Math.cos(radians)
  const translatedX = point.x - center.x
  const translatedY = point.y - center.y

  return {
    x: center.x + translatedX * cosine - translatedY * sine,
    y: center.y + translatedX * sine + translatedY * cosine,
  }
}

function unrotatePoint(point: CanvasPoint, center: CanvasPoint, angle: number) {
  return rotatePoint(point, center, -angle)
}

function getDrawingBounds(layer: Layer) {
  const points = layer.type === 'drawing'
    ? layer.data.strokes.flatMap((stroke) => stroke.points)
    : []

  if (points.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: layer.transform.width * layer.transform.scaleX,
      maxY: layer.transform.height * layer.transform.scaleY,
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

function getDisplayRect(layer: Layer): CanvasRect {
  const width = Math.max(1, layer.transform.width * layer.transform.scaleX)
  const height = Math.max(1, layer.transform.height * layer.transform.scaleY)

  return {
    x: layer.transform.x,
    y: layer.transform.y,
    width,
    height,
  }
}

export function getLayerCenter(layer: Layer): CanvasPoint {
  const rect = getDisplayRect(layer)

  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  }
}

export function getLayerBounds(layer: Layer): CanvasRect {
  if (layer.type === 'drawing') {
    const bounds = getDrawingBounds(layer)

    return {
      x: layer.transform.x + bounds.minX,
      y: layer.transform.y + bounds.minY,
      width: Math.max(1, bounds.maxX - bounds.minX),
      height: Math.max(1, bounds.maxY - bounds.minY),
    }
  }

  return getDisplayRect(layer)
}

export function getSelectionGeometry(layer: Layer) {
  const rect = getDisplayRect(layer)
  const center = getLayerCenter(layer)
  const topLeft = { x: rect.x, y: rect.y }
  const topRight = { x: rect.x + rect.width, y: rect.y }
  const bottomRight = { x: rect.x + rect.width, y: rect.y + rect.height }
  const bottomLeft = { x: rect.x, y: rect.y + rect.height }

  const corners = {
    nw: rotatePoint(topLeft, center, layer.transform.rotation),
    ne: rotatePoint(topRight, center, layer.transform.rotation),
    se: rotatePoint(bottomRight, center, layer.transform.rotation),
    sw: rotatePoint(bottomLeft, center, layer.transform.rotation),
  }

  const north = {
    x: (corners.nw.x + corners.ne.x) / 2,
    y: (corners.nw.y + corners.ne.y) / 2,
  }
  const east = {
    x: (corners.ne.x + corners.se.x) / 2,
    y: (corners.ne.y + corners.se.y) / 2,
  }
  const south = {
    x: (corners.sw.x + corners.se.x) / 2,
    y: (corners.sw.y + corners.se.y) / 2,
  }
  const west = {
    x: (corners.nw.x + corners.sw.x) / 2,
    y: (corners.nw.y + corners.sw.y) / 2,
  }

  const rotationVector = {
    x: north.x - center.x,
    y: north.y - center.y,
  }
  const rotationLength = Math.max(
    1,
    Math.sqrt(rotationVector.x ** 2 + rotationVector.y ** 2)
  )
  const rotationHandle = {
    id: 'rotate' as const,
    x: north.x + (rotationVector.x / rotationLength) * ROTATE_HANDLE_OFFSET,
    y: north.y + (rotationVector.y / rotationLength) * ROTATE_HANDLE_OFFSET,
  }

  return {
    rect,
    center,
    corners: {
      nw: { id: 'nw' as const, ...corners.nw },
      n: { id: 'n' as const, ...north },
      ne: { id: 'ne' as const, ...corners.ne },
      e: { id: 'e' as const, ...east },
      se: { id: 'se' as const, ...corners.se },
      s: { id: 's' as const, ...south },
      sw: { id: 'sw' as const, ...corners.sw },
      w: { id: 'w' as const, ...west },
    } satisfies Record<Exclude<SelectionHandleId, 'rotate'>, SelectionHandle>,
    rotationHandle,
  }
}

export function hitTestLayer(point: CanvasPoint, layer: Layer): boolean {
  if (!layer.visible || layer.locked) {
    return false
  }

  const geometry = getSelectionGeometry(layer)
  const localPoint = unrotatePoint(point, geometry.center, layer.transform.rotation)

  return (
    localPoint.x >= geometry.rect.x &&
    localPoint.x <= geometry.rect.x + geometry.rect.width &&
    localPoint.y >= geometry.rect.y &&
    localPoint.y <= geometry.rect.y + geometry.rect.height
  )
}

export function getHandleAtPoint(
  point: CanvasPoint,
  layer: Layer
): SelectionHandleId | null {
  const geometry = getSelectionGeometry(layer)
  const handles = [
    geometry.rotationHandle,
    geometry.corners.nw,
    geometry.corners.n,
    geometry.corners.ne,
    geometry.corners.e,
    geometry.corners.se,
    geometry.corners.s,
    geometry.corners.sw,
    geometry.corners.w,
  ]

  for (const handle of handles) {
    const isRotate = handle.id === 'rotate'
    const size = isRotate ? HANDLE_SIZE + 4 : HANDLE_SIZE
    const halfSize = size / 2

    if (
      point.x >= handle.x - halfSize &&
      point.x <= handle.x + halfSize &&
      point.y >= handle.y - halfSize &&
      point.y <= handle.y + halfSize
    ) {
      return handle.id
    }
  }

  return null
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

export function resizeLayer(
  layer: Layer,
  handleId: Exclude<SelectionHandleId, 'rotate'>,
  point: CanvasPoint
): Layer {
  const geometry = getSelectionGeometry(layer)
  const startRect = geometry.rect
  const center = geometry.center
  const localPoint = unrotatePoint(point, center, layer.transform.rotation)

  const startRight = startRect.x + startRect.width
  const startBottom = startRect.y + startRect.height

  let nextRect = { ...startRect }

  switch (handleId) {
    case 'nw': {
      const width = Math.max(1, startRight - localPoint.x)
      const height = Math.max(1, startBottom - localPoint.y)
      const size = Math.max(
        1,
        Math.max(width / startRect.width, height / startRect.height)
      )
      const scaledWidth = Math.max(1, startRect.width * size)
      const scaledHeight = Math.max(1, startRect.height * size)
      nextRect = {
        x: startRight - scaledWidth,
        y: startBottom - scaledHeight,
        width: scaledWidth,
        height: scaledHeight,
      }
      break
    }
    case 'ne': {
      const width = Math.max(1, localPoint.x - startRect.x)
      const height = Math.max(1, startBottom - localPoint.y)
      const size = Math.max(
        1,
        Math.max(width / startRect.width, height / startRect.height)
      )
      const scaledWidth = Math.max(1, startRect.width * size)
      const scaledHeight = Math.max(1, startRect.height * size)
      nextRect = {
        x: startRect.x,
        y: startBottom - scaledHeight,
        width: scaledWidth,
        height: scaledHeight,
      }
      break
    }
    case 'se': {
      const width = Math.max(1, localPoint.x - startRect.x)
      const height = Math.max(1, localPoint.y - startRect.y)
      const size = Math.max(
        1,
        Math.max(width / startRect.width, height / startRect.height)
      )
      const scaledWidth = Math.max(1, startRect.width * size)
      const scaledHeight = Math.max(1, startRect.height * size)
      nextRect = {
        x: startRect.x,
        y: startRect.y,
        width: scaledWidth,
        height: scaledHeight,
      }
      break
    }
    case 'sw': {
      const width = Math.max(1, startRight - localPoint.x)
      const height = Math.max(1, localPoint.y - startRect.y)
      const size = Math.max(
        1,
        Math.max(width / startRect.width, height / startRect.height)
      )
      const scaledWidth = Math.max(1, startRect.width * size)
      const scaledHeight = Math.max(1, startRect.height * size)
      nextRect = {
        x: startRight - scaledWidth,
        y: startRect.y,
        width: scaledWidth,
        height: scaledHeight,
      }
      break
    }
    case 'n': {
      const height = Math.max(1, startBottom - localPoint.y)
      const scaledHeight = Math.max(1, height)
      nextRect = {
        x: startRect.x,
        y: startBottom - scaledHeight,
        width: startRect.width,
        height: scaledHeight,
      }
      break
    }
    case 'e': {
      const width = Math.max(1, localPoint.x - startRect.x)
      nextRect = {
        x: startRect.x,
        y: startRect.y,
        width: Math.max(1, width),
        height: startRect.height,
      }
      break
    }
    case 's': {
      const height = Math.max(1, localPoint.y - startRect.y)
      nextRect = {
        x: startRect.x,
        y: startRect.y,
        width: startRect.width,
        height: Math.max(1, height),
      }
      break
    }
    case 'w': {
      const width = Math.max(1, startRight - localPoint.x)
      nextRect = {
        x: startRight - Math.max(1, width),
        y: startRect.y,
        width: Math.max(1, width),
        height: startRect.height,
      }
      break
    }
  }

  const scaleX = nextRect.width / Math.max(1, layer.transform.width)
  const scaleY = nextRect.height / Math.max(1, layer.transform.height)

  return {
    ...layer,
    transform: {
      ...layer.transform,
      x: nextRect.x,
      y: nextRect.y,
      scaleX,
      scaleY,
      rotation: layer.transform.rotation,
    },
  }
}

export function rotateLayer(
  layer: Layer,
  pointer: CanvasPoint,
  startPointer: CanvasPoint,
  startRotation: number,
  referenceCenter?: CanvasPoint
): Layer {
  const center = referenceCenter ?? getLayerCenter(layer)
  const startAngle = Math.atan2(startPointer.y - center.y, startPointer.x - center.x)
  const currentAngle = Math.atan2(pointer.y - center.y, pointer.x - center.x)
  const deltaDegrees = ((currentAngle - startAngle) * 180) / Math.PI

  return {
    ...layer,
    transform: {
      ...layer.transform,
      rotation: startRotation + deltaDegrees,
    },
  }
}
