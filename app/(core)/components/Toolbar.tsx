'use client'

import type { EditorToolId, ToolDefinition } from './tools/types'

type ToolbarProps = {
  tools: ToolDefinition[]
  activeTool: EditorToolId
  onToolChange: (toolId: EditorToolId) => void
}

export default function Toolbar({
  tools,
  activeTool,
  onToolChange,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl">
      {tools.map((tool) => {
        const Icon = tool.icon
        const isActive = tool.id === activeTool

        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => onToolChange(tool.id)}
            className={[
              'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-black font-medium transition',
              isActive
                ? 'bg-blue-600 border border-blue-600 text-white'
                : 'bg-white border border-gray-300 hover:bg-gray-100',
            ].join(' ')}
            title={tool.description}
          >
            <Icon className="h-4 w-4" />
            <span>{tool.label}</span>
          </button>
        )
      })}
    </div>
  )
}
