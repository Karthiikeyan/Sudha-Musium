// Music (optional file) + tiny synthesized sound effects. Everything is wrapped in try/catch: audio must never break the gift.
import { content } from '../config/content'
import { safeStorageGet, safeStorageSet } from './device'

type ACtor = typeof AudioContext
let ctx: AudioContext | null = null
let audio: HTMLAudioElement | null = null
let muted = safeStorageGet('museum-muted') === '1'
let wantPlaying = false
let fadeTimer: number | null = null
let visHandlerOn = false
let musicReady = false
let onReadyCb: (() => void) | null = null

const MUSIC_VOLUME = 0.45

export const isMuted = () => muted

function fadeTo(target: number, ms: number) {
  if (!audio) return
  if (fadeTimer !== null) window.clearInterval(fadeTimer)
  const a = audio
  const from = a.volume
  const t0 = performance.now()
  fadeTimer = window.setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / ms)
    try {
      a.volume = Math.max(0, Math.min(1, from + (target - from) * k))
    } catch {
      /* ignore */
    }
    if (k >= 1 && fadeTimer !== null) {
      window.clearInterval(fadeTimer)
      fadeTimer = null
    }
  }, 50)
}

function onVisibility() {
  if (!audio || !musicReady) return
  try {
    if (document.hidden) {
      audio.pause()
    } else if (wantPlaying && !muted) {
      void audio.play().catch(() => undefined)
    }
  } catch {
    /* ignore */
  }
}

/** Starts loading the optional music file. `onReady` fires only if a file really is playable (tries each candidate in turn). */
export function initMusic(onReady: () => void) {
  if (audio || typeof window === 'undefined') return
  onReadyCb = onReady
  const candidates = [content.musicFile, ...content.musicFallbacks]
  const attempt = (i: number) => {
    if (i >= candidates.length) {
      audio = null
      return
    }
    try {
      const a = new Audio()
      a.loop = true
      a.preload = 'auto'
      a.volume = 0
      a.addEventListener('canplay', () => {
        if (musicReady || audio !== a) return
        musicReady = true
        onReadyCb?.()
      })
      a.addEventListener('error', () => {
        if (audio !== a) return
        musicReady = false
        a.removeAttribute('src')
        audio = null
        attempt(i + 1)
      })
      audio = a
      a.src = candidates[i]
    } catch {
      audio = null
    }
  }
  attempt(0)
  if (!visHandlerOn) {
    document.addEventListener('visibilitychange', onVisibility)
    visHandlerOn = true
  }
}

export function disposeAudio() {
  try {
    if (fadeTimer !== null) window.clearInterval(fadeTimer)
    fadeTimer = null
    if (visHandlerOn) document.removeEventListener('visibilitychange', onVisibility)
    visHandlerOn = false
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
  } catch {
    /* ignore */
  }
  audio = null
  musicReady = false
  wantPlaying = false
}

function ensureCtx(): AudioContext | null {
  if (ctx) return ctx
  try {
    const AC: ACtor | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: ACtor }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  } catch {
    ctx = null
  }
  return ctx
}

/** Call from the first user tap (Start screen). */
export function unlockAudio() {
  try {
    const c = ensureCtx()
    if (c && c.state === 'suspended') void c.resume().catch(() => undefined)
  } catch {
    /* ignore */
  }
}

export function startMusic() {
  wantPlaying = true
  if (!audio || !musicReady || muted) return
  try {
    audio.volume = 0
    void audio.play().then(() => fadeTo(MUSIC_VOLUME, 1500)).catch(() => undefined)
  } catch {
    /* ignore */
  }
}

/** Lower the music while the movie plays (1 = normal). */
export function duckMusic(level: number) {
  if (!audio || !musicReady || muted) return
  fadeTo(MUSIC_VOLUME * Math.max(0, Math.min(1, level)), 700)
}

export function setMuted(m: boolean) {
  muted = m
  safeStorageSet('museum-muted', m ? '1' : '0')
  if (!audio || !musicReady) return
  try {
    if (m) {
      audio.pause()
    } else if (wantPlaying && !document.hidden) {
      audio.volume = 0
      void audio.play().then(() => fadeTo(MUSIC_VOLUME, 800)).catch(() => undefined)
    }
  } catch {
    /* ignore */
  }
}

function tone(c: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, gain: number, slideTo?: number) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, start)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur)
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(gain, start + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  o.connect(g)
  g.connect(c.destination)
  o.start(start)
  o.stop(start + dur + 0.05)
}

export type Sfx = 'pop' | 'sparkle' | 'tada' | 'blow' | 'chime' | 'page' | 'door'

export function sfx(kind: Sfx) {
  if (muted) return
  try {
    const c = ensureCtx()
    if (!c || c.state !== 'running') return
    const t = c.currentTime
    if (kind === 'pop') {
      tone(c, 520, t, 0.09, 'sine', 0.12, 900)
    } else if (kind === 'sparkle') {
      ;[1046, 1318, 1568, 2093].forEach((f, i) => tone(c, f, t + i * 0.05, 0.22, 'triangle', 0.07))
    } else if (kind === 'chime') {
      tone(c, 1318.5, t, 0.6, 'sine', 0.06)
      tone(c, 1975.5, t + 0.09, 0.7, 'sine', 0.04)
    } else if (kind === 'page') {
      tone(c, 900, t, 0.12, 'triangle', 0.03, 400)
      tone(c, 700, t + 0.08, 0.14, 'triangle', 0.025, 300)
    } else if (kind === 'door') {
      tone(c, 140, t, 0.25, 'sine', 0.12, 70)
      tone(c, 420, t + 0.05, 0.4, 'triangle', 0.02, 260)
    } else if (kind === 'blow') {
      tone(c, 220, t, 0.4, 'sawtooth', 0.02, 90)
    } else {
      const notes = [523.25, 659.25, 783.99, 1046.5]
      notes.forEach((f, i) => tone(c, f, t + i * 0.11, 0.5, 'triangle', 0.1))
      ;[523.25, 659.25, 783.99].forEach((f) => tone(c, f, t + 0.5, 1.1, 'sine', 0.08))
    }
  } catch {
    /* ignore */
  }
}
