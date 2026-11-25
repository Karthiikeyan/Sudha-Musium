import { useEffect, useMemo, type DependencyList } from 'react'
import type * as THREE from 'three'
import { textureFromCanvas } from '../lib/textures'

/** Creates a three.js object once (per deps) and disposes it when the component unmounts. */
export function useDisposable<T extends { dispose: () => void }>(factory: () => T, deps: DependencyList): T {
  const obj = useMemo(factory, deps)
  useEffect(() => () => obj.dispose(), [obj])
  return obj
}

/**
 * A canvas texture drawn with a 2D context; redrawn when deps change and again once web fonts are ready.
 * Disposed on unmount (so room textures never leak between rooms).
 */
export function useCanvasTexture(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  deps: DependencyList,
): THREE.CanvasTexture {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    return textureFromCanvas(c)
  }, [w, h])
  useEffect(() => {
    const c = tex.image as HTMLCanvasElement
    const ctx = c.getContext('2d')
    if (!ctx) return
    let alive = true
    const run = () => {
      if (!alive) return
      ctx.clearRect(0, 0, w, h)
      draw(ctx, w, h)
      tex.needsUpdate = true
    }
    run()
    try {
      if (document.fonts) void document.fonts.ready.then(run)
    } catch {
      /* ignore */
    }
    return () => {
      alive = false
    }
  }, [tex, ...deps])
  useEffect(() => () => tex.dispose(), [tex])
  return tex
}
