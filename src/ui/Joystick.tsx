import { useEffect, useRef } from 'react'
import { isTouch } from '../lib/device'
import { world } from '../lib/world'
import { useStore } from '../state/store'

const R = 48 // knob travel radius in px

/** On-screen virtual joystick (touch devices only). Pointer events + touch-action:none. */
export function Joystick() {
  const phase = useStore((s) => s.phase)
  const baseRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const active = useRef<number | null>(null)
  const show = isTouch() && phase === 'explore'

  const reset = () => {
    active.current = null
    world.input.x = 0
    world.input.z = 0
    if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)'
  }

  useEffect(() => {
    if (!show) reset()
    return reset
  }, [show])

  if (!show) return null

  const update = (e: React.PointerEvent) => {
    const el = baseRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    let dx = e.clientX - (r.left + r.width / 2)
    let dy = e.clientY - (r.top + r.height / 2)
    const d = Math.hypot(dx, dy)
    if (d > R) {
      dx = (dx / d) * R
      dy = (dy / d) * R
    }
    if (knobRef.current) knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`
    const nx = dx / R
    const nz = dy / R
    const m = Math.hypot(nx, nz)
    if (m < 0.14) {
      world.input.x = 0
      world.input.z = 0
    } else {
      world.input.x = nx
      world.input.z = nz
    }
  }

  return (
    <div
      ref={baseRef}
      className="joystick"
      onPointerDown={(e) => {
        if (active.current !== null) return
        active.current = e.pointerId
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          /* ignore */
        }
        update(e)
      }}
      onPointerMove={(e) => {
        if (active.current === e.pointerId) update(e)
      }}
      onPointerUp={(e) => {
        if (active.current === e.pointerId) reset()
      }}
      onPointerCancel={(e) => {
        if (active.current === e.pointerId) reset()
      }}
      onLostPointerCapture={reset}
      aria-hidden="true"
    >
      <div ref={knobRef} className="joystick-knob" />
    </div>
  )
}
