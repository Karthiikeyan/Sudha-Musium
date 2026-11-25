// On-demand photo textures. Rooms say which photos they "want"; everything else is disposed,
// so only the current room (plus the next room, preloaded in the background) lives on the GPU.
import { useSyncExternalStore } from 'react'
import type * as THREE from 'three'
import { isTouch } from './device'
import { downscale, loadImage, makePlaceholder, photoUrl, textureFromCanvas } from './textures'

export interface PhotoEntry {
  tex: THREE.CanvasTexture
  aspect: number
  placeholder: boolean
}

const entries = new Map<string, PhotoEntry>()
const pending = new Map<string, Promise<PhotoEntry | null>>()
const owners = new Map<string, Set<string>>()
const aspects = new Map<string, number>()
const listeners = new Set<() => void>()
let version = 0
let maxSide = 1280
let anisotropy = 1
let order: string[] = []

export const isPlaceholderName = (n: string) => n.startsWith('placeholder-')

function bump() {
  version++
  listeners.forEach((l) => l())
}

export function configurePhotos(all: string[]) {
  order = all
  maxSide = isTouch() ? 1024 : 1280
}

export function setPhotoAnisotropy(a: number) {
  anisotropy = Math.max(1, Math.min(4, a))
  entries.forEach((e) => {
    e.tex.anisotropy = anisotropy
    e.tex.needsUpdate = true
  })
}

const isWanted = (name: string) => {
  for (const set of owners.values()) if (set.has(name)) return true
  return false
}

export const getPhoto = (name: string) => entries.get(name)
export const photoAspect = (name: string) => aspects.get(name)

export function loadPhoto(name: string): Promise<PhotoEntry | null> {
  const have = entries.get(name)
  if (have) return Promise.resolve(have)
  const p = pending.get(name)
  if (p) return p
  const job = (async (): Promise<PhotoEntry | null> => {
    let entry: PhotoEntry
    const idx = Math.max(0, order.indexOf(name))
    if (isPlaceholderName(name)) {
      const ph = makePlaceholder(idx)
      entry = { tex: ph.texture, aspect: ph.aspect, placeholder: true }
    } else {
      try {
        const img = await loadImage(photoUrl(name))
        const { canvas, aspect } = downscale(img, maxSide)
        entry = { tex: textureFromCanvas(canvas), aspect, placeholder: false }
      } catch {
        const ph = makePlaceholder(idx)
        entry = { tex: ph.texture, aspect: ph.aspect, placeholder: true }
      }
    }
    pending.delete(name)
    aspects.set(name, entry.aspect)
    if (!isWanted(name)) {
      entry.tex.dispose()
      bump()
      return null
    }
    entry.tex.anisotropy = anisotropy
    entries.set(name, entry)
    bump()
    return entry
  })()
  pending.set(name, job)
  return job
}

/** Declare the photos an owner (e.g. "room", "cinema") needs right now. Unwanted textures are disposed. */
export function want(owner: string, names: string[]) {
  owners.set(owner, new Set(names))
  let changed = false
  entries.forEach((e, n) => {
    if (!isWanted(n)) {
      e.tex.dispose()
      entries.delete(n)
      changed = true
    }
  })
  if (changed) bump()
  names.forEach((n) => void loadPhoto(n))
}

export function release(owner: string) {
  want(owner, [])
  owners.delete(owner)
}

/** Loads a list (3 at a time) and reports progress; used by the loading screen. */
export async function preload(owner: string, names: string[], onProgress: (done: number, total: number) => void, cancelled: () => boolean) {
  owners.set(owner, new Set(names))
  let done = 0
  let next = 0
  const total = names.length
  if (total === 0) {
    onProgress(1, 1)
    return
  }
  const worker = async () => {
    while (next < names.length && !cancelled()) {
      const n = names[next++]
      await loadPhoto(n)
      onProgress(++done, total)
    }
  }
  await Promise.allSettled([worker(), worker(), worker()])
}

export function disposeAllPhotos() {
  entries.forEach((e) => e.tex.dispose())
  entries.clear()
  owners.clear()
  bump()
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/** Re-renders the caller whenever a photo finished loading or was released. */
export function usePhotoVersion() {
  return useSyncExternalStore(subscribe, () => version, () => version)
}
