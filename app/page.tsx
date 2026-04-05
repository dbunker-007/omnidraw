'use client'

import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Plus,
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  Box,
  Pencil,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sun,
  Move,
  Sliders,
  Camera,
} from 'lucide-react'
import {
  EditorState,
  Layer,
  Transform2D,
  ShapeLayer,
  TextLayer,
  ThreeDLayer,
} from './(core)/engine/layers/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

const defaultTransform = (): Transform2D => ({
  x: 100,
  y: 100,
  width: 200,
  height: 200,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  opacity: 1,
})

// ─── Reducer ────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_ACTIVE'; id: string | null }
  | { type: 'ADD_LAYER'; layer: Layer }
  | { type: 'DELETE_LAYER'; id: string }
  | { type: 'TOGGLE_VISIBLE'; id: string }
  | { type: 'TOGGLE_LOCKED'; id: string }
  | { type: 'UPDATE_TRANSFORM'; id: string; patch: Partial<Transform2D> }
  | { type: 'UPDATE_LAYER_DATA'; id: string; data: Record<string, unknown> }
  | { type: 'REORDER'; id: string; dir: 1 | -1 }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'SET_OFFSET'; x: number; y: number }
  | { type: 'SET_BG'; color: string }
  | { type: 'UPDATE_3D_SCENE'; id: string; sceneState: ThreeDLayer['data']['sceneState']; snapshot: string }

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'SET_ACTIVE':
      return { ...state, activeLayerId: action.id }

    case 'ADD_LAYER':
      return {
        ...state,
        layers: [...state.layers, action.layer],
        activeLayerId: action.layer.id,
      }

    case 'DELETE_LAYER':
      return {
        ...state,
        layers: state.layers.filter((l) => l.id !== action.id),
        activeLayerId: state.activeLayerId === action.id ? null : state.activeLayerId,
      }

    case 'TOGGLE_VISIBLE':
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.id ? { ...l, visible: !l.visible } : l
        ),
      }

    case 'TOGGLE_LOCKED':
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.id ? { ...l, locked: !l.locked } : l
        ),
      }

    case 'UPDATE_TRANSFORM':
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.id
            ? { ...l, transform: { ...l.transform, ...action.patch } }
            : l
        ),
      }

    case 'UPDATE_LAYER_DATA':
      return {
        ...state,
        layers: state.layers.map((l) => {
          if (l.id !== action.id) return l
          return {
            ...l,
            data: { ...l.data, ...action.data },
          } as Layer
        }),
      }

    case 'REORDER': {
      const idx = state.layers.findIndex((l) => l.id === action.id)
      if (idx === -1) return state
      const next = [...state.layers]
      const target = idx + action.dir
      if (target < 0 || target >= next.length) return state
      ;[next[idx], next[target]] = [next[target], next[idx]]
      // Update zIndex
      next.forEach((l, i) => (l.zIndex = i))
      return { ...state, layers: next }
    }

    case 'SET_ZOOM':
      return {
        ...state,
        viewport: { ...state.viewport, zoom: Math.max(0.1, Math.min(10, action.zoom)) },
      }

    case 'SET_OFFSET':
      return {
        ...state,
        viewport: { ...state.viewport, offsetX: action.x, offsetY: action.y },
      }

    case 'SET_BG':
      return {
        ...state,
        canvas: { ...state.canvas, background: { color: action.color } },
      }

    case 'UPDATE_3D_SCENE':
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.id && l.type === 'threed'
            ? {
                ...l,
                data: {
                  ...(l as ThreeDLayer).data,
                  sceneState: action.sceneState,
                  snapshot: action.snapshot,
                },
              }
            : l
        ),
      }

    default:
      return state
  }
}

// ─── Initial State ───────────────────────────────────────────────────────────

const initialState: EditorState = {
  canvas: { width: 800, height: 600, background: { color: '#ffffff' } },
  layers: [
    {
      id: uid(),
      type: 'shape',
      transform: { x: 50, y: 50, width: 300, height: 200, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
      visible: true,
      locked: false,
      zIndex: 0,
      meta: { name: 'Background Rect' },
      data: { shape: 'rect', fill: '#e8f4f8', stroke: '#94c7e0', strokeWidth: 2 },
    } as ShapeLayer,
    {
      id: uid(),
      type: 'text',
      transform: { x: 80, y: 80, width: 240, height: 60, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
      visible: true,
      locked: false,
      zIndex: 1,
      meta: { name: 'Heading' },
      data: { text: 'Hello, Editor!', fontSize: 36, fontFamily: 'serif', color: '#1a1a2e' },
    } as TextLayer,
  ],
  viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
  activeLayerId: null,
}

// ─── Layer Icon ───────────────────────────────────────────────────────────────

function LayerIcon({ type }: { type: Layer['type'] }) {
  const cls = 'w-3.5 h-3.5'
  if (type === 'image') return <ImageIcon className={cls} />
  if (type === 'text') return <Type className={cls} />
  if (type === 'shape') return <Square className={cls} />
  if (type === 'drawing') return <Pencil className={cls} />
  if (type === 'threed') return <Box className={cls} />
  return null
}

// ─── Transform Input ─────────────────────────────────────────────────────────

function PropRow({ label, value, onChange, step = 1, unit = '' }: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  unit?: string
}) {
  return (
    <div className="flex items-center gap-2 group">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 w-16 shrink-0 font-mono">
        {label}
      </span>
      <div className="flex items-center flex-1 bg-slate-900 border border-slate-700/50 rounded focus-within:border-cyan-500/60 transition-colors">
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="flex-1 bg-transparent text-xs text-slate-200 px-2 py-1.5 font-mono outline-none w-0"
        />
        {unit && (
          <span className="text-[10px] text-slate-500 pr-2 font-mono">{unit}</span>
        )}
      </div>
    </div>
  )
}

// ─── 3D Scene Panel ───────────────────────────────────────────────────────────

function ThreeDPanel({
  layer,
  onUpdate,
}: {
  layer: ThreeDLayer
  onUpdate: (sceneState: ThreeDLayer['data']['sceneState'], snapshot: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<import('./(core)/engine/three/SceneManager').SceneManager | null>(null)
  const [loading, setLoading] = useState(false)
  const [modelUrl, setModelUrl] = useState(layer.data.modelUrl || '')

  useEffect(() => {
    if (!canvasRef.current) return
    let sm: import('./(core)/engine/three/SceneManager').SceneManager

    import('./(core)/engine/three/SceneManager').then(({ SceneManager }) => {
      sm = new SceneManager(canvasRef.current!)
      sm.resize(380, 280)
      sceneRef.current = sm

      if (layer.data.sceneState?.camera) {
        sm.applyCamera(layer.data.sceneState.camera)
      }
      if (layer.data.modelUrl) {
        setLoading(true)
        sm.loadModel(layer.data.modelUrl)
          .then(() => {
            if (layer.data.sceneState?.transform) {
              sm.applyTransform(layer.data.sceneState.transform)
            }
          })
          .finally(() => setLoading(false))
      }
    })

    return () => sm?.dispose()
  }, [])

  const handleSnapshot = () => {
    const sm = sceneRef.current
    if (!sm) return
    const snapshot = sm.snapshot()
    const cam = sm.getCamera()
    const sceneState: ThreeDLayer['data']['sceneState'] = {
      transform: layer.data.sceneState?.transform ?? {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      camera: {
        position: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
        fov: cam.fov,
      },
    }
    onUpdate(sceneState, snapshot)
  }

  const handleLoad = () => {
    const sm = sceneRef.current
    if (!sm || !modelUrl) return
    setLoading(true)
    sm.loadModel(modelUrl).finally(() => setLoading(false))
  }

  const t = layer.data.sceneState?.transform ?? {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  }

  const updateT = (path: string, val: number) => {
    const [group, axis] = path.split('.')
    const next = {
      ...t,
      [group]: { ...(t as Record<string, Record<string, number>>)[group], [axis]: val },
    }
    sceneRef.current?.applyTransform(next)
    const cam = sceneRef.current?.getCamera()
    if (!cam) return
    onUpdate(
      {
        transform: next,
        camera: {
          position: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
          fov: cam.fov,
        },
      },
      layer.data.snapshot
    )
  }

  return (
    <div className="space-y-3">
      {/* Model URL Input */}
      <div>
        <label className="text-[10px] uppercase tracking-widest text-slate-500 block mb-1.5 font-mono">
          Model URL (glTF/GLB)
        </label>
        <div className="flex gap-1.5">
          <input
            value={modelUrl}
            onChange={(e) => setModelUrl(e.target.value)}
            placeholder="https://…/model.glb"
            className="flex-1 bg-slate-900 border border-slate-700/50 rounded px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500/60 transition-colors font-mono"
          />
          <button
            onClick={handleLoad}
            disabled={loading}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded text-xs font-medium text-white transition-colors"
          >
            {loading ? '…' : 'Load'}
          </button>
        </div>
      </div>

      {/* Three.js Viewport */}
      <div className="relative rounded-lg overflow-hidden border border-slate-700/50 bg-slate-950">
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ height: 260 }}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 text-xs text-cyan-400 font-mono">
            Loading model…
          </div>
        )}
        <div className="absolute bottom-2 right-2 text-[9px] text-slate-500 font-mono">
          Drag to orbit · Scroll to zoom
        </div>
      </div>

      {/* Capture Snapshot */}
      <button
        onClick={handleSnapshot}
        className="w-full flex items-center justify-center gap-2 py-2 bg-cyan-900/30 hover:bg-cyan-900/50 border border-cyan-700/30 rounded text-xs text-cyan-300 font-medium transition-colors"
      >
        <Camera className="w-3.5 h-3.5" />
        Capture to Canvas
      </button>

      {/* 3D Transform Controls */}
      <div className="space-y-2 pt-1">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono flex items-center gap-1.5">
          <Move className="w-3 h-3" /> Position
        </p>
        {(['x', 'y', 'z'] as const).map((ax) => (
          <PropRow key={`pos-${ax}`} label={ax.toUpperCase()} value={t.position[ax]} step={0.1}
            onChange={(v) => updateT(`position.${ax}`, v)} />
        ))}

        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono flex items-center gap-1.5 pt-1">
          <RotateCcw className="w-3 h-3" /> Rotation (°)
        </p>
        {(['x', 'y', 'z'] as const).map((ax) => (
          <PropRow key={`rot-${ax}`} label={ax.toUpperCase()} value={t.rotation[ax]} step={1}
            onChange={(v) => updateT(`rotation.${ax}`, v)} unit="°" />
        ))}

        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono flex items-center gap-1.5 pt-1">
          <Maximize2 className="w-3 h-3" /> Scale
        </p>
        {(['x', 'y', 'z'] as const).map((ax) => (
          <PropRow key={`sc-${ax}`} label={ax.toUpperCase()} value={t.scale[ax]} step={0.01}
            onChange={(v) => updateT(`scale.${ax}`, v)} />
        ))}
      </div>
    </div>
  )
}

// ─── Properties Panel ────────────────────────────────────────────────────────

function PropertiesPanel({
  layer,
  dispatch,
}: {
  layer: Layer
  dispatch: React.Dispatch<Action>
}) {
  const t = layer.transform

  const patchT = (patch: Partial<Transform2D>) =>
    dispatch({ type: 'UPDATE_TRANSFORM', id: layer.id, patch })

  const patchD = (data: Record<string, unknown>) =>
    dispatch({ type: 'UPDATE_LAYER_DATA', id: layer.id, data })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <LayerIcon type={layer.type} />
        <span className="text-xs font-semibold text-slate-200 truncate">
          {layer.meta?.name ?? layer.type}
        </span>
        <span className="ml-auto text-[10px] text-slate-500 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
          {layer.type}
        </span>
      </div>

      {/* 2D Transform */}
      <section>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-2 flex items-center gap-1.5">
          <Sliders className="w-3 h-3" /> Transform
        </p>
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <PropRow label="X" value={t.x} onChange={(v) => patchT({ x: v })} />
            <PropRow label="Y" value={t.y} onChange={(v) => patchT({ y: v })} />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <PropRow label="W" value={t.width} onChange={(v) => patchT({ width: v })} />
            <PropRow label="H" value={t.height} onChange={(v) => patchT({ height: v })} />
          </div>
          <PropRow label="Rotate" value={t.rotation} step={1} unit="°" onChange={(v) => patchT({ rotation: v })} />
          <PropRow label="Scale X" value={t.scaleX} step={0.01} onChange={(v) => patchT({ scaleX: v })} />
          <PropRow label="Scale Y" value={t.scaleY} step={0.01} onChange={(v) => patchT({ scaleY: v })} />
          <PropRow label="Opacity" value={t.opacity} step={0.01} onChange={(v) => patchT({ opacity: Math.max(0, Math.min(1, v)) })} />
        </div>
      </section>

      {/* Type-specific properties */}
      {layer.type === 'shape' && (
        <section>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-2">Appearance</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 w-16 font-mono">Shape</span>
              <select
                value={(layer as ShapeLayer).data.shape}
                onChange={(e) => patchD({ shape: e.target.value })}
                className="flex-1 bg-slate-900 border border-slate-700/50 rounded px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500/60"
              >
                <option value="rect">Rectangle</option>
                <option value="circle">Circle</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 w-16 font-mono">Fill</span>
              <input type="color" value={(layer as ShapeLayer).data.fill}
                onChange={(e) => patchD({ fill: e.target.value })}
                className="w-8 h-7 rounded cursor-pointer border-0 bg-transparent" />
              <span className="text-xs font-mono text-slate-400">{(layer as ShapeLayer).data.fill}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 w-16 font-mono">Stroke</span>
              <input type="color" value={(layer as ShapeLayer).data.stroke ?? '#000000'}
                onChange={(e) => patchD({ stroke: e.target.value })}
                className="w-8 h-7 rounded cursor-pointer border-0 bg-transparent" />
              <PropRow label="" value={(layer as ShapeLayer).data.strokeWidth ?? 0} step={0.5}
                onChange={(v) => patchD({ strokeWidth: v })} />
            </div>
          </div>
        </section>
      )}

      {layer.type === 'text' && (
        <section>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-2">Text</p>
          <div className="space-y-2">
            <textarea
              value={(layer as TextLayer).data.text}
              onChange={(e) => patchD({ text: e.target.value })}
              rows={3}
              className="w-full bg-slate-900 border border-slate-700/50 rounded px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500/60 resize-none font-mono"
            />
            <PropRow label="Size" value={(layer as TextLayer).data.fontSize} step={1}
              onChange={(v) => patchD({ fontSize: v })} />
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 w-16 font-mono">Color</span>
              <input type="color" value={(layer as TextLayer).data.color}
                onChange={(e) => patchD({ color: e.target.value })}
                className="w-8 h-7 rounded cursor-pointer border-0 bg-transparent" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 w-16 font-mono">Font</span>
              <select
                value={(layer as TextLayer).data.fontFamily}
                onChange={(e) => patchD({ fontFamily: e.target.value })}
                className="flex-1 bg-slate-900 border border-slate-700/50 rounded px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500/60"
              >
                {['serif', 'sans-serif', 'monospace', 'Georgia', 'Courier New', 'Impact'].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
        </section>
      )}

      {layer.type === 'threed' && (
        <section>
          <ThreeDPanel
            layer={layer as ThreeDLayer}
            onUpdate={(sceneState, snapshot) =>
              dispatch({ type: 'UPDATE_3D_SCENE', id: layer.id, sceneState, snapshot })
            }
          />
        </section>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EditorPage() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<import('./(core)/engine/renderer/CanvasRenderer').CanvasRenderer | null>(null)
  const rafRef = useRef<number | null>(null)

  // Init renderer
  useEffect(() => {
    if (!canvasRef.current) return
    import('./(core)/engine/renderer/CanvasRenderer').then(({ CanvasRenderer }) => {
      rendererRef.current = new CanvasRenderer(canvasRef.current!)
    })
  }, [])

  // Render loop
  useEffect(() => {
    const loop = () => {
      rendererRef.current?.render(state)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [state])

  const activeLayer = state.layers.find((l) => l.id === state.activeLayerId) ?? null

  // Add layer helpers
  const addShape = () => {
    const id = uid()
    dispatch({
      type: 'ADD_LAYER',
      layer: {
        id, type: 'shape', zIndex: state.layers.length,
        transform: defaultTransform(), visible: true, locked: false,
        meta: { name: `Shape ${state.layers.length + 1}` },
        data: { shape: 'rect', fill: `hsl(${Math.random() * 360},60%,60%)` },
      } as ShapeLayer,
    })
  }

  const addText = () => {
    const id = uid()
    dispatch({
      type: 'ADD_LAYER',
      layer: {
        id, type: 'text', zIndex: state.layers.length,
        transform: { ...defaultTransform(), width: 300, height: 60 },
        visible: true, locked: false,
        meta: { name: `Text ${state.layers.length + 1}` },
        data: { text: 'New text', fontSize: 32, fontFamily: 'serif', color: '#1a1a2e' },
      } as TextLayer,
    })
  }

  const addThreeD = () => {
    const id = uid()
    dispatch({
      type: 'ADD_LAYER',
      layer: {
        id, type: 'threed', zIndex: state.layers.length,
        transform: defaultTransform(),
        visible: true, locked: false,
        meta: { name: `3D ${state.layers.length + 1}` },
        data: {
          modelUrl: '',
          sceneState: {
            transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
            camera: { position: { x: 0, y: 1.5, z: 4 }, fov: 45 },
          },
          snapshot: '',
          snapshotWidth: 400,
          snapshotHeight: 300,
        },
      } as ThreeDLayer,
    })
  }

  // Viewport controls
  const zoom = state.viewport.zoom
  const setZoom = (z: number) => dispatch({ type: 'SET_ZOOM', zoom: z })

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d0d1a] text-slate-200 font-sans select-none">
      {/* ── Left: Layers Panel ─────────────────────────────────────── */}
      <aside className="w-56 flex flex-col border-r border-slate-800 bg-[#0f0f1e]">
        {/* Header */}
        <div className="px-3 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">Layers</span>
          </div>
        </div>

        {/* Add layer buttons */}
        <div className="px-2 pt-2 pb-1 grid grid-cols-3 gap-1">
          {[
            { icon: <Square className="w-3.5 h-3.5" />, label: 'Shape', onClick: addShape },
            { icon: <Type className="w-3.5 h-3.5" />, label: 'Text', onClick: addText },
            { icon: <Box className="w-3.5 h-3.5" />, label: '3D', onClick: addThreeD },
          ].map(({ icon, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex flex-col items-center gap-0.5 py-1.5 rounded bg-slate-800/60 hover:bg-cyan-900/40 hover:text-cyan-300 text-slate-400 text-[10px] transition-colors border border-slate-700/30 hover:border-cyan-700/40"
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Layer list */}
        <div className="flex-1 overflow-y-auto px-1 py-1 space-y-0.5">
          {[...state.layers].reverse().map((layer) => {
            const active = layer.id === state.activeLayerId
            return (
              <div
                key={layer.id}
                onClick={() => dispatch({ type: 'SET_ACTIVE', id: layer.id })}
                className={`
                  flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer transition-all
                  ${active
                    ? 'bg-cyan-900/30 border border-cyan-700/40 text-slate-100'
                    : 'hover:bg-slate-800/60 border border-transparent text-slate-400'}
                `}
              >
                <span className={`${active ? 'text-cyan-400' : 'text-slate-500'}`}>
                  <LayerIcon type={layer.type} />
                </span>
                <span className="flex-1 text-[11px] truncate">
                  {layer.meta?.name ?? layer.type}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'TOGGLE_VISIBLE', id: layer.id }) }}
                    className="p-0.5 hover:text-slate-200 text-slate-600 transition-colors"
                  >
                    {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'TOGGLE_LOCKED', id: layer.id }) }}
                    className="p-0.5 hover:text-slate-200 text-slate-600 transition-colors"
                  >
                    {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Layer actions */}
        {activeLayer && (
          <div className="border-t border-slate-800 px-2 py-2 flex items-center gap-1">
            <button
              onClick={() => dispatch({ type: 'REORDER', id: activeLayer.id, dir: 1 })}
              className="flex-1 flex items-center justify-center py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="Move up"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => dispatch({ type: 'REORDER', id: activeLayer.id, dir: -1 })}
              className="flex-1 flex items-center justify-center py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="Move down"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => dispatch({ type: 'DELETE_LAYER', id: activeLayer.id })}
              className="flex-1 flex items-center justify-center py-1 rounded bg-rose-900/30 hover:bg-rose-800/50 text-rose-400 transition-colors"
              title="Delete layer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </aside>

      {/* ── Center: Canvas ─────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <header className="h-10 border-b border-slate-800 flex items-center px-3 gap-3 bg-[#0f0f1e] shrink-0">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-cyan-400 mr-2">
            Atelier
          </span>
          <div className="h-4 w-px bg-slate-700" />

          {/* Canvas size info */}
          <span className="text-[11px] font-mono text-slate-500">
            {state.canvas.width} × {state.canvas.height}
          </span>

          <div className="h-4 w-px bg-slate-700" />

          {/* BG color */}
          <div className="flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="color"
              value={state.canvas.background.color ?? '#ffffff'}
              onChange={(e) => dispatch({ type: 'SET_BG', color: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
            />
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom(zoom - 0.1)} className="p-1 hover:text-cyan-300 text-slate-500 transition-colors">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-400 w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button onClick={() => setZoom(zoom + 0.1)} className="p-1 hover:text-cyan-300 text-slate-500 transition-colors">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => { dispatch({ type: 'SET_ZOOM', zoom: 1 }); dispatch({ type: 'SET_OFFSET', x: 0, y: 0 }) }}
              className="p-1 hover:text-cyan-300 text-slate-500 transition-colors" title="Reset view">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Canvas area */}
        <div className="flex-1 overflow-hidden relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ imageRendering: 'pixelated' }}
            onClick={(e) => {
              // Hit test: find topmost layer at click
              const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
              const cx = e.clientX - rect.left
              const cy = e.clientY - rect.top
              const W = rect.width
              const H = rect.height
              const { zoom, offsetX, offsetY } = state.viewport
              // Canvas space coords
              const canvX = (cx - W / 2 - offsetX) / zoom + state.canvas.width / 2
              const canvY = (cy - H / 2 - offsetY) / zoom + state.canvas.height / 2

              const hit = [...state.layers]
                .sort((a, b) => b.zIndex - a.zIndex)
                .find((l) => {
                  if (!l.visible) return false
                  const t = l.transform
                  return canvX >= t.x && canvX <= t.x + t.width && canvY >= t.y && canvY <= t.y + t.height
                })
              dispatch({ type: 'SET_ACTIVE', id: hit?.id ?? null })
            }}
            onWheel={(e) => {
              e.preventDefault()
              const delta = e.deltaY > 0 ? -0.08 : 0.08
              setZoom(zoom + delta)
            }}
          />

          {/* Active layer outline overlay hint */}
          {activeLayer && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{ mixBlendMode: 'screen' }}
            >
              {/* Could draw selection handles here in a future iteration */}
            </div>
          )}

          {/* Coordinates readout */}
          <div className="absolute bottom-3 left-3 text-[10px] font-mono text-slate-600 flex gap-3">
            <span>Zoom: {Math.round(zoom * 100)}%</span>
          </div>
        </div>
      </main>

      {/* ── Right: Properties Panel ────────────────────────────────── */}
      <aside className="w-72 border-l border-slate-800 bg-[#0f0f1e] flex flex-col">
        <div className="px-3 py-3 border-b border-slate-800">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">Properties</span>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {activeLayer ? (
            <PropertiesPanel layer={activeLayer} dispatch={dispatch} />
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-600 text-xs text-center gap-2">
              <Layers className="w-8 h-8 opacity-20" />
              <p>Select a layer to<br />edit its properties</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
