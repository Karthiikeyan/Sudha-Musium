import { useEffect, useRef, useState } from 'react'
import { content } from '../config/content'
import { useStore } from '../state/store'

const MIN_MS = 2400

export function LoadingScreen() {
  const real = useStore((s) => s.progress)
  const phase = useStore((s) => s.phase)
  const setPhase = useStore((s) => s.setPhase)
  const [shown, setShown] = useState(0)
  const [out, setOut] = useState(false)
  const [gone, setGone] = useState(false)
  const realRef = useRef(real)
  realRef.current = real

  useEffect(() => {
    let raf = 0
    let finished = false
    const t0 = performance.now()
    let cur = 0
    const tick = (now: number) => {
      const timeCap = Math.min(1, (now - t0) / MIN_MS)
      const target = Math.min(realRef.current, timeCap)
      cur += (target - cur) * 0.12
      if (target - cur < 0.002) cur = target
      setShown(cur)
      if (!finished && cur >= 0.999 && realRef.current >= 1 && now - t0 >= MIN_MS) {
        finished = true
        setOut(true)
        window.setTimeout(() => setPhase('start'), 350)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [setPhase])

  useEffect(() => {
    if (!out) return
    const id = window.setTimeout(() => setGone(true), 800)
    return () => window.clearTimeout(id)
  }, [out])

  if (gone || (phase !== 'loading' && !out)) return null
  const pct = Math.round(shown * 100)
  return (
    <div className={'screen' + (out ? ' out' : '')} role="status" aria-live="polite" style={{ zIndex: 90 }}>
      <div className="screen-inner">
        <h1 className="big-title">{content.museumTitle}</h1>
        <div className="from-to">
          From <em>{content.subtitleFrom}</em>
          <span className="bar">|</span>To <em>{content.subtitleTo}</em>
        </div>
        <div className="progress" aria-hidden="true">
          <i style={{ width: pct + '%' }} />
        </div>
        <div className="progress-label">
          {content.loadingLabel}&nbsp;&nbsp;{pct}%
        </div>
      </div>
    </div>
  )
}
