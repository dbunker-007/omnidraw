import {
  EditorState,
  Layer,
  ImageLayer,
  TextLayer,
  ShapeLayer,
  DrawingLayer,
  ThreeDLayer,
} from '../layers/types'

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
  }

  render(state: EditorState) {
    const { ctx, canvas } = this
    const { viewport } = state

    canvas.width = canvas.clientWidth * window.devicePixelRatio
    canvas.height = canvas.clientHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const W = canvas.clientWidth
    const H = canvas.clientHeight

    // Clear
    ctx.clearRect(0, 0, W, H)

    // Checkerboard background
    this.drawCheckerboard(W, H)

    // Apply viewport
    ctx.save()
    const cx = W / 2 + viewport.offsetX
    const cy = H / 2 + viewport.offsetY
    ctx.translate(cx, cy)
    ctx.scale(viewport.zoom, viewport.zoom)
    ctx.translate(-state.canvas.width / 2, -state.canvas.height / 2)

    // Canvas background
    ctx.fillStyle = state.canvas.background.color ?? '#ffffff'
    ctx.fillRect(0, 0, state.canvas.width, state.canvas.height)

    // Shadow for canvas
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = 32
    ctx.fillRect(0, 0, state.canvas.width, state.canvas.height)
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0

    // Layers sorted by zIndex
    const sorted = [...state.layers].sort((a, b) => a.zIndex - b.zIndex)
    for (const layer of sorted) {
      if (!layer.visible) continue
      this.renderLayer(layer)
    }

    ctx.restore()
  }

  private drawCheckerboard(w: number, h: number) {
    const { ctx } = this
    const size = 16
    for (let x = 0; x < w; x += size) {
      for (let y = 0; y < h; y += size) {
        ctx.fillStyle = (Math.floor(x / size) + Math.floor(y / size)) % 2 === 0
          ? '#1a1a2e'
          : '#16213e'
        ctx.fillRect(x, y, size, size)
      }
    }
  }

  private renderLayer(layer: Layer) {
    const { ctx } = this
    const t = layer.transform

    ctx.save()
    ctx.globalAlpha = t.opacity

    // Transform
    const cx = t.x + t.width / 2
    const cy = t.y + t.height / 2
    ctx.translate(cx, cy)
    ctx.rotate((t.rotation * Math.PI) / 180)
    ctx.scale(t.scaleX, t.scaleY)
    ctx.translate(-t.width / 2, -t.height / 2)

    switch (layer.type) {
      case 'image':
        this.renderImage(layer as ImageLayer, t.width, t.height)
        break
      case 'text':
        this.renderText(layer as TextLayer, t.width, t.height)
        break
      case 'shape':
        this.renderShape(layer as ShapeLayer, t.width, t.height)
        break
      case 'drawing':
        this.renderDrawing(layer as DrawingLayer)
        break
      case 'threed':
        this.renderThreeD(layer as ThreeDLayer, t.width, t.height)
        break
    }

    ctx.restore()
  }

  private renderImage(layer: ImageLayer, w: number, h: number) {
    if (layer.data.image) {
      this.ctx.drawImage(layer.data.image, 0, 0, w, h)
    }
  }

  private renderText(layer: TextLayer, w: number, h: number) {
    const { ctx } = this
    const { data } = layer
    ctx.font = `${data.fontSize}px ${data.fontFamily}`
    ctx.fillStyle = data.color
    ctx.textBaseline = 'top'
    ctx.fillText(data.text, 0, 0, w)
  }

  private renderShape(layer: ShapeLayer, w: number, h: number) {
    const { ctx } = this
    const { data } = layer
    ctx.fillStyle = data.fill

    if (data.shape === 'rect') {
      ctx.fillRect(0, 0, w, h)
      if (data.stroke) {
        ctx.strokeStyle = data.stroke
        ctx.lineWidth = data.strokeWidth ?? 1
        ctx.strokeRect(0, 0, w, h)
      }
    } else if (data.shape === 'circle') {
      ctx.beginPath()
      ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      if (data.stroke) {
        ctx.strokeStyle = data.stroke
        ctx.lineWidth = data.strokeWidth ?? 1
        ctx.stroke()
      }
    }
  }

  private renderDrawing(layer: DrawingLayer) {
    const { ctx } = this
    for (const stroke of layer.data.strokes) {
      if (stroke.points.length < 2) continue
      ctx.beginPath()
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      ctx.stroke()
    }
  }

  private renderThreeD(layer: ThreeDLayer, w: number, h: number) {
    if (layer.data.image) {
      this.ctx.drawImage(layer.data.image, 0, 0, w, h)
    } else if (layer.data.snapshot) {
      const img = new Image()
      img.src = layer.data.snapshot
      this.ctx.drawImage(img, 0, 0, w, h)
    }
  }
}
