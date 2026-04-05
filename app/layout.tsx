import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Omnidraw',
  description: 'Canvas + 3D layer editor built with Next.js and Three.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
