import type { LucideIcon } from 'lucide-react'

export type EditorToolId = 'select' | 'pencil'

export type ToolDefinition = {
  id: EditorToolId
  label: string
  description: string
  icon: LucideIcon
}

export type CanvasPoint = {
  x: number
  y: number
}

export type CanvasRect = {
  x: number
  y: number
  width: number
  height: number
}
