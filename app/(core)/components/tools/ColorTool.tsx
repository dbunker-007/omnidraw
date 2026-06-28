import { Palette } from 'lucide-react'
import type { Layer } from '../../engine/layers/types'
import { setDrawingLayerColor, setPencilColor } from './PencilTool'
import type { ToolDefinition } from './types'

export const colorTool: ToolDefinition = {
  id: 'color',
  label: 'Color',
  description: 'Change layer color',
  icon: Palette,
}

export function getLayerColor(layer: Layer): string | null {
  if (layer.type === 'drawing') {
    return layer.data.strokes[0]?.color ?? null
  }

  if (layer.type === 'text') {
    return layer.data.color
  }

  if (layer.type === 'shape') {
    return layer.data.fill ?? layer.data.stroke ?? null
  }

  return null
}

export function applyLayerColor(layer: Layer, color: string): Layer {
  if (layer.type === 'drawing') {
    return setDrawingLayerColor(layer, color)
  }

  if (layer.type === 'text') {
    return {
      ...layer,
      data: {
        ...layer.data,
        color,
      },
    }
  }

  if (layer.type === 'shape') {
    return {
      ...layer,
      data: {
        ...layer.data,
        fill: color,
        stroke: layer.data.stroke ?? color,
      },
    }
  }

  return layer
}

export function applyGlobalColor(color: string) {
  setPencilColor(color)
}
