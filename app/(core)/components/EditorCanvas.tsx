'use client'

import { useEffect, useRef } from 'react'
import { useEditorStore } from '../store/editorStore'

type EditorCanvasProps = {
  className?: string
}

export default function EditorCanvas({
  className,
}: EditorCanvasProps) {
  const width = useEditorStore((state) => state.editorState.canvas.width)
  const height = useEditorStore((state) => state.editorState.canvas.height)
  const backgroundColor = useEditorStore(
    (state) => state.editorState.canvas.background.color
  )

  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    context.clearRect(0, 0, canvas.width, canvas.height)

    if (backgroundColor !== null) {
      context.fillStyle = backgroundColor
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
  }, [width, height, backgroundColor])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      aria-label="Editor canvas"
    />
  )
}
