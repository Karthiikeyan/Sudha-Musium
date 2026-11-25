let touchCache: boolean | null = null
let reducedCache: boolean | null = null

/** True on phones / tablets (coarse primary pointer). Safe to call during SSR / odd environments. */
export function isTouch(): boolean {
  if (touchCache !== null) return touchCache
  let v = false
  try {
    if (typeof window !== 'undefined') {
      v = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
      if (!v && typeof navigator !== 'undefined') v = (navigator.maxTouchPoints || 0) > 0 && !window.matchMedia('(pointer: fine)').matches
    }
  } catch {
    v = false
  }
  touchCache = v
  return v
}

export function prefersReducedMotion(): boolean {
  if (reducedCache !== null) return reducedCache
  let v = false
  try {
    if (typeof window !== 'undefined' && window.matchMedia) v = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    v = false
  }
  reducedCache = v
  return v
}

export function safeStorageGet(key: string): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
  } catch {
    return null
  }
}

export function safeStorageSet(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}
