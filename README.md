# Omnidraw

Omnidraw is a layered canvas and 3D editor built with Next.js, React, Zustand, Tailwind CSS, and Three.js. The product goal is to provide a single workspace for composing 2D canvas content and 3D assets inside one editor.

The current implementation is an early editor shell. It exposes canvas size controls, background color controls, and a reset action, then renders the canvas background into a 2D canvas element. The state model already includes canvas, layers, viewport, and active-layer metadata, so the app is set up for a much richer workflow even though most editing tools are not wired up yet.

## What It Does Today

- Lets you inspect and edit the current editor state.
- Changes canvas width and height from the UI.
- Toggles a transparent canvas background or sets a solid background color.
- Resets the store back to the default editor state.
- Renders the current canvas background to an HTML canvas.

## Product Goal

The intended direction is a unified design surface for:

- 2D image, text, shape, and drawing layers.
- 3D model layers with snapshot-based previews for the 2D canvas.
- Layer transforms, visibility, locking, ordering, and viewport navigation.
- A modular rendering engine split between 2D canvas and 3D scene handling.

## Tech Stack

- Next.js 16 with the App Router.
- React 19.
- Zustand for editor state management.
- Three.js for the 3D layer pipeline.
- Tailwind CSS 4 for styling.
- TypeScript in strict mode.

## Project Structure

- [app/page.tsx](app/page.tsx) contains the main editor page and state controls.
- [app/(core)/components/EditorCanvas.tsx](app/(core)/components/EditorCanvas.tsx) renders the canvas background.
- [app/(core)/store/editorStore.ts](app/(core)/store/editorStore.ts) holds the editor state and mutation actions.
- [app/(core)/engine/layers/types.ts](app/(core)/engine/layers/types.ts) defines the layer and editor state types.
- [app/(core)/engine/renderer/](app/(core)/engine/renderer/) is the planned 2D rendering engine.
- [app/(core)/engine/three/](app/(core)/engine/three/) is the planned Three.js rendering layer.

## Getting Started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## Available Scripts

- npm run dev starts the development server.
- npm run build creates a production build.
- npm run start runs the production server.
- npm run lint runs ESLint.

## Current Limitations

- Layer rendering is not implemented yet.
- There are no add, delete, select, or transform tools for layers.
- The viewport state exists, but zoom and pan controls are not wired up.
- Three.js is installed, but the 3D scene pipeline is still empty.
- No persistence, export, or import workflow exists yet.

## Notes For Development

The editor state is initialized on the client in [app/page.tsx](app/page.tsx), so avoid triggering Zustand state updates during render. The store already exposes reusable actions for canvas sizing, background updates, layer replacement, viewport changes, and state reset.
