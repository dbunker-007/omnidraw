import { Trash2 } from 'lucide-react'
import type { ToolDefinition } from './types'

export const deleteTool: ToolDefinition = {
  id: 'delete',
  label: 'Delete',
  description: 'Delete the selected layer',
  icon: Trash2,
}
