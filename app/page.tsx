'use client'

import { useEffect } from 'react'
import EditorCanvas from './(core)/components/EditorCanvas'
import { EditorState } from './(core)/engine/layers/types'
import { useEditorStore } from './(core)/store/editorStore'

const EDITOR_STATE: EditorState = {
  canvas: {
    width: 1200,
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
  const editorState = useEditorStore((state) => state.editorState)
  const setEditorState = useEditorStore((state) => state.setEditorState)
  const setCanvasSize = useEditorStore((state) => state.setCanvasSize)
  const setBackgroundColor = useEditorStore((state) => state.setBackgroundColor)
  const resetEditorState = useEditorStore((state) => state.resetEditorState)

  useEffect(() => {
    setEditorState(EDITOR_STATE)
  }, [setEditorState])

  const isTransparent = editorState.canvas.background.color === null


  return (
    <main className="min-h-screen w-full bg-slate-950 p-4">
      <div className="mx-auto w-full">
        <section className="w-full max-w-7xl rounded-lg border border-slate-800 bg-slate-900 p-3 lg:max-w-xs">
          <h2 className="text-sm font-semibold text-slate-100">Editor State</h2>

          <div className="mt-3 space-y-3 text-xs text-slate-300">
            <label className="block">
              <span className="mb-1 block text-slate-400">Canvas Width</span>
              <input
                type="number"
                min={1}
                value={editorState.canvas.width}
                onChange={(event) => {
                  const nextWidth = Math.max(1, Number(event.target.value) || 1)
                  setCanvasSize(nextWidth, editorState.canvas.height)
                }}
                className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-slate-400">Canvas Height</span>
              <input
                type="number"
                min={1}
                value={editorState.canvas.height}
                onChange={(event) => {
                  const nextHeight = Math.max(1, Number(event.target.value) || 1)
                  setCanvasSize(editorState.canvas.width, nextHeight)
                }}
                className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100"
              />
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isTransparent}
                onChange={(event) =>
                  setBackgroundColor(event.target.checked ? null : '#ffffff')
                }
              />
              <span>Transparent Background</span>
            </label>

            <label className="block">
              <span className="mb-1 block text-slate-400">Background Color</span>
              <input
                type="color"
                value={editorState.canvas.background.color ?? '#ffffff'}
                onChange={(event) => setBackgroundColor(event.target.value)}
                disabled={isTransparent}
                className="h-9 w-full rounded border border-slate-700 bg-slate-950 p-1 disabled:opacity-50"
              />
            </label>

            <button
              onClick={() => resetEditorState(EDITOR_STATE)}
              className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-slate-100 hover:bg-slate-700"
            >
              Reset Editor State
            </button>
          </div>
        </section>

        <div className="w-full overflow-auto">
          <div className="mx-auto w-fit border border-slate-800 rounded-lg overflow-hidden mt-6">
            <EditorCanvas className="block w-full h-auto" />
          </div>
        </div>
      </div>
    </main>
  )
}
