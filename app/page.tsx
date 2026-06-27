'use client'

import { useEffect, useState } from 'react'
import EditorCanvas from './(core)/components/EditorCanvas'
import Toolbar from './(core)/components/Toolbar'
import { pencilTool } from './(core)/components/tools/PencilTool'
import { selectTool } from './(core)/components/tools/SelectTool'
import type { EditorToolId } from './(core)/components/tools/types'
import { EditorState } from './(core)/engine/layers/types'
import { useEditorStore } from './(core)/store/editorStore'

const EDITOR_STATE: EditorState = {
  canvas: {
    width: 1600,
    height: 700,
    background: {
      color: null,
    },
  },
  layers: [],
  viewport: {
    zoom: 0,
    offsetX: 0,
    offsetY: 0,
  },
  activeLayerId: null,
}

export default function EditorPage() {
  const setEditorState = useEditorStore((state) => state.setEditorState)
  const [activeTool, setActiveTool] = useState<EditorToolId>('select')

  useEffect(() => {
    setEditorState(EDITOR_STATE)
  }, [setEditorState])

  return (
    <main className="min-h-screen w-full p-4">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em]">
            OmniDraw
          </p>
          <h1 className="text-2xl font-semibold">Canvas editor</h1>
          <p className="max-w-2xl text-sm">
            Pick a tool, draw a layer, then switch back to Select to move it around.
          </p>
        </header>

        <Toolbar
          tools={[selectTool, pencilTool]}
          activeTool={activeTool}
          onToolChange={setActiveTool}
        />

        <div className="">
          <div className="mx-auto w-fit overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900">
            <EditorCanvas
              activeTool={activeTool}
              className="block h-auto w-full touch-none select-none"
            />
          </div>
        </div>
      </div>
    </main>
  )
}
