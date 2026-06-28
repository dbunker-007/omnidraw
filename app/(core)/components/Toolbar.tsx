'use client'

import type { Layer } from '../engine/layers/types'
import { deleteTool } from './tools/DeleteTool'
import { colorTool, getLayerColor } from './tools/ColorTool'
import type { EditorToolId, ToolDefinition } from './tools/types'

type ToolbarProps = {
  tools: ToolDefinition[]
  activeTool: EditorToolId
  onToolChange: (toolId: EditorToolId) => void
  activeLayer: Layer | null
  colorValue: string
  onDeleteLayer: () => void
  onColorChange: (color: string) => void
}

export default function Toolbar({
  tools,
  activeTool,
  onToolChange,
  activeLayer,
  colorValue,
  onDeleteLayer,
  onColorChange,
}: ToolbarProps) {
  const canDelete = activeLayer !== null
  const selectedColor = activeLayer ? getLayerColor(activeLayer) ?? colorValue : colorValue
  const DeleteIcon = deleteTool.icon
  const ColorIcon = colorTool.icon

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-300 bg-white p-2">
      {tools.map((tool) => {
        const Icon = tool.icon
        const isActive = tool.id === activeTool

        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => onToolChange(tool.id)}
            className={[
              'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition',
              isActive
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50',
            ].join(' ')}
            title={tool.description}
          >
            <Icon className="h-4 w-4" />
            <span>{tool.label}</span>
          </button>
        )
      })}

      <div className="mx-1 h-8 w-px bg-slate-200" />

      <button
        type="button"
        onClick={onDeleteLayer}
        disabled={!canDelete}
        className={[
          'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition',
          canDelete
            ? 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
            : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400',
        ].join(' ')}
        title={deleteTool.description}
      >
        <DeleteIcon className="h-4 w-4" />
        <span>{deleteTool.label}</span>
      </button>

      <label
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
        title={colorTool.description}
      >
        <ColorIcon className="h-4 w-4" />
        <span>{colorTool.label}</span>
        <input
          type="color"
          value={selectedColor}
          onChange={(event) => onColorChange(event.target.value)}
          className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0"
          aria-label="Select color"
        />
      </label>
    </div>
  )
}
