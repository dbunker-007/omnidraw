import { create } from 'zustand'
import type { EditorState, Layer } from '../engine/layers/types'

const EDITOR_STATE: EditorState = {
  canvas: {
    width: 1,
    height: 1,
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

type EditorStore = {
  editorState: EditorState
  setEditorState: (
    updater: EditorState | ((prev: EditorState) => EditorState)
  ) => void
  setCanvasSize: (width: number, height: number) => void
  setBackgroundColor: (color: string | null) => void
  setLayers: (layers: Layer[]) => void
  setViewport: (viewport: EditorState['viewport']) => void
  patchViewport: (patch: Partial<EditorState['viewport']>) => void
  setActiveLayerId: (id: string | null) => void
  resetEditorState: (state: EditorState) => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  editorState: EDITOR_STATE,

  setEditorState: (updater) =>
    set((state) => ({
      editorState:
        typeof updater === 'function'
          ? (updater as (prev: EditorState) => EditorState)(state.editorState)
          : updater,
    })),

  setCanvasSize: (width, height) =>
    set((state) => ({
      editorState: {
        ...state.editorState,
        canvas: {
          ...state.editorState.canvas,
          width,
          height,
        },
      },
    })),

  setBackgroundColor: (color) =>
    set((state) => ({
      editorState: {
        ...state.editorState,
        canvas: {
          ...state.editorState.canvas,
          background: {
            color,
          },
        },
      },
    })),

  setLayers: (layers) =>
    set((state) => ({
      editorState: {
        ...state.editorState,
        layers,
      },
    })),

  setViewport: (viewport) =>
    set((state) => ({
      editorState: {
        ...state.editorState,
        viewport,
      },
    })),

  patchViewport: (patch) =>
    set((state) => ({
      editorState: {
        ...state.editorState,
        viewport: {
          ...state.editorState.viewport,
          ...patch,
        },
      },
    })),

  setActiveLayerId: (id) =>
    set((state) => ({
      editorState: {
        ...state.editorState,
        activeLayerId: id,
      },
    })),

  resetEditorState: (resetState) =>
    set({
      editorState: resetState,
    }),
}))
