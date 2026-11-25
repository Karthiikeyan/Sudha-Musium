import { useCallback, useEffect, useRef, useState } from 'react'
import { content } from '../config/content'
import { useStore } from '../state/store'

const HOLD_MS = 800
const CIRC = 2 * Math.PI * 54

/** Listens to the microphone and calls `onBlow` after ~0.4 s of sustained loud breath-like noise. Always releases the stream. */
function useMicBlow(enabled: boolean, onBlow: () => void, onFail: () => void) {
  const blowRef = useRef(onBlow)
  const failRef = useRef(onFail)
  blowRef.current = onBlow
  failRef.current = onFail
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let stream: MediaStream | null = null
    let ctx: AudioContext | null = null
    let raf = 0
    const stop = () => {
      cancelAnimationFrame(raf)
      try {
        stream?.getTracks().forEach((t) => t.stop())
      } catch {
        /* ignore */
      }
      stream = null
      try {
        if (ctx && ctx.state !== 'closed') void ctx.close()
      } catch {
        /* ignore */
      }
      ctx = null
    }
    const md = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined
    if (!md || !md.getUserMedia) {
      failRef.current()
      return
    }
    md.getUserMedia({ audio: true })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        const AC: typeof AudioContext | undefined =
          window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!AC) throw new Error('no audio context')
        ctx = new AC()
        const src = ctx.createMediaStreamSource(s)
        const an = ctx.createAnalyser()
        an.fftSize = 1024
        src.connect(an)
        const data = new Uint8Array(an.fftSize)
        let last = performance.now()
        let over = 0
        let base = 0
        let baseN = 0
        const t0 = last
        const loop = (now: number) => {
          if (cancelled) return
          const dt = (now - last) / 1000
          last = now
          an.getByteTimeDomainData(data)
          let sum = 0
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128
            sum += v * v
          }
          const rms = Math.sqrt(sum / data.length)
          if (now - t0 < 500) {
            // measure the room first, so a noisy room doesn't blow the candles out by itself
            base += rms
            baseN++
          } else {
            const threshold = Math.max(0.1, (base / Math.max(1, baseN)) * 3)
            over = rms > threshold ? over + dt : Math.max(0, over - dt * 2)
            if (over > 0.4) {
              blowRef.current()
              return
            }
          }
          raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
      })
      .catch(() => {
        if (!cancelled) failRef.current()
      })
    return () => {
      cancelled = true
      stop()
    }
  }, [enabled])
}

export function WishOverlay() {
  const phase = useStore((s) => s.phase)
  const out = useStore((s) => s.candlesOut)
  const blowOut = useStore((s) => s.blowOut)
  const startCelebration = useStore((s) => s.startCelebration)
  const exit = useStore((s) => s.exitInteraction)
  const [prog, setProg] = useState(0)
  const [mic, setMic] = useState(false)
  const [note, setNote] = useState('')
  const raf = useRef(0)
  const t0 = useRef(0)
  const holding = useRef(false)
  const open = phase === 'cake'

  const endHold = useCallback(() => {
    holding.current = false
    cancelAnimationFrame(raf.current)
    setProg(0)
  }, [])

  const beginHold = useCallback(() => {
    if (holding.current || useStore.getState().candlesOut) return
    holding.current = true
    t0.current = performance.now()
    const loop = (now: number) => {
      if (!holding.current) return
      const p = Math.min(1, (now - t0.current) / HOLD_MS)
      setProg(p)
      if (p >= 1) {
        holding.current = false
        blowOut()
        return
      }
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
  }, [blowOut])

  useEffect(() => {
    if (!open) {
      setMic(false)
      setNote('')
      endHold()
    }
    return () => cancelAnimationFrame(raf.current)
  }, [open, endHold])

  // once the candles are out, wait for the smoke and move on to the party
  useEffect(() => {
    if (!open || !out) return
    setMic(false)
    const id = window.setTimeout(startCelebration, 1700)
    return () => window.clearTimeout(id)
  }, [open, out, startCelebration])

  useMicBlow(open && mic && !out, blowOut, () => {
    setMic(false)
    setNote(content.finale.micFail)
  })

  if (!open) return null
  return (
    <div className="wish">
      <button className="wish-back" onClick={exit}>
        ‹ {content.actions.back}
      </button>
      <div className="wish-top">
        <div className="wish-prompt">{out ? '✨' : content.finale.wishPrompt}</div>
      </div>
      {!out && (
        <div className="wish-bottom">
          <button
            className="blow-btn"
            aria-label={content.finale.holdToBlow}
            onPointerDown={(e) => {
              e.preventDefault()
              beginHold()
            }}
            onPointerUp={endHold}
            onPointerLeave={endHold}
            onPointerCancel={endHold}
            onContextMenu={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
                e.preventDefault()
                beginHold()
              }
            }}
            onKeyUp={(e) => {
              if (e.key === ' ' || e.key === 'Enter') endHold()
            }}
          >
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="54" className="ring-bg" />
              <circle cx="60" cy="60" r="54" className="ring-fg" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - prog)} />
            </svg>
            <span>
              🌬️
              <small>{content.finale.holdToBlow}</small>
            </span>
          </button>
          <label className="mic-toggle">
            <input
              type="checkbox"
              checked={mic}
              onChange={(e) => {
                setNote('')
                setMic(e.target.checked)
              }}
            />
            {content.finale.useMic}
          </label>
          <div className="mic-note" aria-live="polite">
            {mic && !note ? content.finale.micOn : note}
          </div>
        </div>
      )}
    </div>
  )
}
