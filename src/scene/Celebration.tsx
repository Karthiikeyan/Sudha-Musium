import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { isTouch } from '../lib/device'
import { bigCelebration } from '../lib/fx'
import { mulberry32, smoothstep } from '../lib/math'
import { useStore } from '../state/store'
import { heartGeometry } from './Floaters'
import { useDisposable } from './hooks'
import type { P2 } from '../lib/math'

const PASTELS = ['#f7c6d4', '#d9ccf2', '#fbe7a6', '#c9e7f2', '#ffd1b3', '#ffffff', '#ff9fb4']

interface Balloon {
  x: number
  z: number
  delay: number
  vy: number
  top: number
  phase: number
  drift: number
}

function Balloons({ center, t0 }: { center: P2; t0: React.MutableRefObject<number> }) {
  const count = isTouch() ? 8 : 14
  const bodies = useRef<THREE.InstancedMesh>(null)
  const strings = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const items = useMemo<Balloon[]>(() => {
    const r = mulberry32(7)
    return Array.from({ length: count }, (_, i) => ({
      x: center.x + (r() * 2 - 1) * 8,
      z: center.z - 2.5 + r() * 3,
      delay: (i / count) * 2.4 + r() * 0.5,
      vy: 0.7 + r() * 0.6,
      top: 4.3 + r() * 1.3,
      phase: r() * Math.PI * 2,
      drift: 0.15 + r() * 0.25,
    }))
  }, [center.x, center.z, count])

  useLayoutEffect(() => {
    const m = bodies.current
    if (!m) return
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      c.set(PASTELS[i % PASTELS.length])
      m.setColorAt(i, c)
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [count])

  useFrame(({ clock }) => {
    const b = bodies.current
    const s = strings.current
    if (!b || !s) return
    const t = clock.elapsedTime - t0.current
    for (let i = 0; i < count; i++) {
      const it = items[i]
      const k = Math.max(0, t - it.delay)
      const y = Math.min(it.top, 0.5 + k * it.vy) + (k * it.vy > it.top ? Math.sin(t * 1.3 + it.phase) * 0.12 : 0)
      const px = it.x + Math.sin(t * it.drift + it.phase) * 0.6
      const grow = k > 0 ? smoothstep(k / 0.4) : 0
      dummy.position.set(px, y + 0.5, it.z)
      dummy.rotation.set(0, 0, Math.sin(t * 0.9 + it.phase) * 0.08)
      dummy.scale.set(grow, grow * 1.18, grow)
      dummy.updateMatrix()
      b.setMatrixAt(i, dummy.matrix)
      dummy.position.set(px, y - 0.18, it.z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(grow, grow, grow)
      dummy.updateMatrix()
      s.setMatrixAt(i, dummy.matrix)
    }
    b.instanceMatrix.needsUpdate = true
    s.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <instancedMesh ref={bodies} args={[undefined, undefined, count]} frustumCulled={false}>
        <sphereGeometry args={[0.42, 16, 14]} />
        <meshStandardMaterial roughness={0.35} metalness={0.05} />
      </instancedMesh>
      <instancedMesh ref={strings} args={[undefined, undefined, count]} frustumCulled={false}>
        <cylinderGeometry args={[0.008, 0.008, 1.3, 4]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </instancedMesh>
    </>
  )
}

interface Petal {
  x: number
  z: number
  y0: number
  vy: number
  phase: number
  sway: number
  spin: number
  s: number
}

function Falling({ center, t0, kind, count }: { center: P2; t0: React.MutableRefObject<number>; kind: 'petal' | 'heart'; count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const camera = useThree((s) => s.camera)
  const geo = useDisposable(() => {
    if (kind === 'heart') return heartGeometry(0.24)
    const g = new THREE.CircleGeometry(0.08, 10)
    g.scale(1, 1.7, 1)
    return g
  }, [kind])
  const items = useMemo<Petal[]>(() => {
    const r = mulberry32(kind === 'heart' ? 91 : 53)
    return Array.from({ length: count }, () => ({
      x: center.x + (r() * 2 - 1) * 9,
      z: center.z - 3 + r() * 9,
      y0: r() * 6,
      vy: 0.5 + r() * 0.7,
      phase: r() * Math.PI * 2,
      sway: 0.3 + r() * 0.6,
      spin: 1 + r() * 2,
      s: 0.7 + r() * 0.8,
    }))
  }, [center.x, center.z, count, kind])

  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      c.set(PASTELS[(i * 3) % PASTELS.length])
      m.setColorAt(i, c)
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [count])

  useFrame(({ clock }) => {
    const m = ref.current
    if (!m) return
    const t = clock.elapsedTime - t0.current
    // after ~8 s the shower thins out to a calm trickle
    const frac = t < 8 ? 1 : Math.max(0.3, 1 - (t - 8) * 0.25)
    const active = Math.floor(count * frac)
    for (let i = 0; i < count; i++) {
      const it = items[i]
      if (i >= active || t < 0) {
        dummy.scale.setScalar(0)
      } else {
        const fall = (it.y0 + t * it.vy) % 6.4
        dummy.position.set(it.x + Math.sin(t * it.sway + it.phase) * 0.7, 6.3 - fall, it.z)
        dummy.rotation.set(t * it.spin + it.phase, t * it.spin * 0.7, Math.sin(t + it.phase))
        // shrink away near the camera so a petal never fills the screen
        const dx = dummy.position.x - camera.position.x
        const dy = dummy.position.y - camera.position.y
        const dz = dummy.position.z - camera.position.z
        dummy.scale.setScalar(it.s * smoothstep((Math.sqrt(dx * dx + dy * dy + dz * dz) - 2.5) / 3))
      }
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[geo, undefined, count]} frustumCulled={false}>
      <meshBasicMaterial side={THREE.DoubleSide} transparent opacity={0.92} toneMapped={false} />
    </instancedMesh>
  )
}

/** Balloons + falling petals/hearts + DOM confetti. Mounted only while celebrating (or reading the letter). */
export function Celebration({ center }: { center: P2 }) {
  const phase = useStore((s) => s.phase)
  const on = phase === 'celebration' || phase === 'finale'
  const clock = useThree((s) => s.clock)
  const t0 = useRef(0)
  const started = useRef(false)
  // remember when the celebration began (set during render so the children see it on their very first frame)
  if (on && !started.current) {
    started.current = true
    t0.current = clock.elapsedTime
  }
  if (!on) started.current = false

  useEffect(() => {
    if (phase !== 'celebration') return
    const cancel = bigCelebration()
    return cancel
  }, [phase])

  if (!on) return null
  const touch = isTouch()
  return (
    <>
      <Balloons center={center} t0={t0} />
      <Falling center={center} t0={t0} kind="petal" count={touch ? 34 : 80} />
      <Falling center={center} t0={t0} kind="heart" count={touch ? 16 : 40} />
    </>
  )
}
