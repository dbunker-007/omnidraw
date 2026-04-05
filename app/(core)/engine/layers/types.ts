/* =========================
   2D Transform (Canvas Space)
========================= */
export type Transform2D = {
  x: number
  y: number

  width: number
  height: number

  rotation: number      // Z-axis only (degrees)

  scaleX: number
  scaleY: number

  opacity: number
}


/* =========================
   3D Transform (Internal Only)
========================= */
export type Transform3D = {
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
}


/* =========================
   Layer Types
========================= */
export type LayerType = 'image' | 'text' | 'shape' | 'drawing' | 'threed'


/* =========================
   Base Layer
========================= */
export type BaseLayer = {
  id: string
  type: LayerType

  transform: Transform2D

  visible: boolean
  locked: boolean
  zIndex: number

  meta?: {
    name?: string
    createdAt?: number
  }
}


/* =========================
   Image Layer
========================= */
export type ImageLayer = BaseLayer & {
  type: 'image'
  data: {
    src: string                 // original source (url / base64)
    image: HTMLImageElement     // runtime (required for rendering)
    naturalWidth: number
    naturalHeight: number
  }
}


/* =========================
   Text Layer
========================= */
export type TextLayer = BaseLayer & {
  type: 'text'
  data: {
    text: string

    fontSize: number
    fontFamily: string

    color: string
  }
}


/* =========================
   Shape Layer
========================= */
export type ShapeLayer = BaseLayer & {
  type: 'shape'
  data: {
    shape: 'rect' | 'circle'

    fill: string

    stroke?: string
    strokeWidth?: number
  }
}


/* =========================
   Drawing Layer (Brush)
========================= */

export type Stroke = {
  points: { x: number; y: number }[]
  color: string
  width: number
}

export type DrawingLayer = BaseLayer & {
  type: 'drawing'
  data: {
    strokes: Stroke[]
  }
}


/* =========================
   3D Layer
========================= */
export type ThreeDLayer = BaseLayer & {
  type: 'threed'
  data: {
    // model reference
    modelUrl: string

    // 3D scene state (editable)
    sceneState: {
      transform: Transform3D

      camera: {
        position: { x: number; y: number; z: number }
        fov: number
      }

      lighting?: any
    }

    // snapshot used by canvas
    snapshot: string                 // base64 image

    // runtime cache (DO NOT persist)
    image?: HTMLImageElement
    snapshotWidth: number
    snapshotHeight: number
  }
}


/* =========================
   Unified Layer Type
========================= */
export type Layer = ImageLayer | TextLayer | ShapeLayer | DrawingLayer | ThreeDLayer


/* =========================
   Editor State
========================= */
export type EditorState = {
  canvas: {
    width: number
    height: number
    background: {
      color: string | null
    }
  }

  layers: Layer[]

  viewport: {
    zoom: number
    offsetX: number
    offsetY: number
  }

  activeLayerId: string | null
}