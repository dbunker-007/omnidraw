'use client'

import { useEffect, useState } from 'react'
import EditorCanvas from './(core)/components/EditorCanvas'
import Toolbar from './(core)/components/Toolbar'
import {
  applyLayerColor,
  getLayerColor,
} from './(core)/components/tools/ColorTool'
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
  const removeLayer = useEditorStore((state) => state.removeLayer)
  const updateLayer = useEditorStore((state) => state.updateLayer)
  const layers = useEditorStore((state) => state.editorState.layers)
  const activeLayerId = useEditorStore((state) => state.editorState.activeLayerId)
  const pencilColor = useEditorStore((state) => state.pencilColor)
  const setPencilColor = useEditorStore((state) => state.setPencilColor)
  const [activeTool, setActiveTool] = useState<EditorToolId>('select')

  useEffect(() => {
    setEditorState(EDITOR_STATE)
  }, [setEditorState])

  const activeLayer = layers.find((layer) => layer.id === activeLayerId) ?? null
  const colorValue = activeLayer
    ? getLayerColor(activeLayer) ?? pencilColor
    : pencilColor

  const handleDeleteLayer = () => {
    if (!activeLayerId) {
      return
    }

    removeLayer(activeLayerId)
  }

  const handleColorChange = (color: string) => {
    setPencilColor(color)

    if (!activeLayerId || !activeLayer) {
      return
    }

    updateLayer(activeLayerId, (layer) => applyLayerColor(layer, color))
  }

  return (
    <main className="min-h-screen w-full p-4">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em]">OmniDraw</p>
          <h1 className="text-2xl font-semibold">Canvas editor</h1>
          <p className="max-w-2xl text-sm">
            Pick a tool, draw a layer, then switch back to Select to move it around.
          </p>
        </header>

        <Toolbar
          tools={[selectTool, pencilTool]}
          activeTool={activeTool}
          onToolChange={setActiveTool}
          activeLayer={activeLayer}
          colorValue={colorValue}
          onDeleteLayer={handleDeleteLayer}
          onColorChange={handleColorChange}
        />

        <div className="">
          <div className="mx-auto w-fit overflow-hidden rounded-2xl border border-slate-700/80">
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
