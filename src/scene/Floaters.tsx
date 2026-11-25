import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mulberry32, smoothstep } from '../lib/math'
import type { Layout } from './layout'

const PASTELS = ['#f7c6d4', '#d9ccf2', '#fbe7a6', '#ffffff', '#c9e7f2']

export function heartGeometry(scale = 0.42) {
  const s = new THREE.Shape()
  s.moveTo(0.25, 0.25)
  s.bezierCurveTo(0.25, 0.25, 0.2, 0, 0, 0)
  s.bezierCurveTo(-0.3, 0, -0.3, 0.35, -0.3, 0.35)
  s.bezierCurveTo(-0.3, 0.55, -0.1, 0.77, 0.25, 0.95)
  s.bezierCurveTo(0.6, 0.77, 0.8, 0.55, 0.8, 0.35)
  s.bezierCurveTo(0.8, 0.35, 0.8, 0, 0.5, 0)
  s.bezierCurveTo(0.35, 0, 0.25, 0.25, 0.25, 0.25)
  const g = new THREE.ShapeGeometry(s, 8)
  g.translate(-0.25, -0.475, 0)
  g.scale(scale, scale, scale)
  return g
}

function starGeometry() {
  const s = new THREE.Shape()
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? 0.5 : 0.12
    const a = (i / 8) * Math.PI * 2 + Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) s.moveTo(x, y)
    else s.lineTo(x, y)
  }
  s.closePath()
  const g = new THREE.ShapeGeometry(s)
  g.scale(0.5, 0.5, 0.5)
  return g
}

interface Item {
  x: number
  y: number
  z: number
  phase: number
  speed: number
  spin: number
  scale: number
}

function Group({ layout, kind, count, seed }: { layout: Layout; kind: 'heart' | 'star'; count: number; seed: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const geo = useMemo(() => (kind === 'heart' ? heartGeometry() : starGeometry()), [kind])
  const items = useMemo<Item[]>(() => {
    const r = mulberry32(seed)
    return Array.from({ length: count }, () => ({
      x: (r() * 2 - 1) * (layout.halfW - 1.2),
      y: layout.ceiling - 0.7 - r() * 1.7,
      z: layout.zN + 1 + r() * (layout.zS - layout.zN - 2),
      phase: r() * Math.PI * 2,
      speed: 0.25 + r() * 0.35,
      spin: 0.3 + r() * 0.6,
      scale: 0.55 + r() * 0.7,
    }))
  }, [layout, count, seed])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const camera = useThree((st) => st.camera)

  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      c.set(PASTELS[i % PASTELS.length])
      m.setColorAt(i, c)
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [count])

  useFrame(({ clock }) => {
    const m = ref.current
    if (!m) return
    const t = clock.elapsedTime
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      dummy.position.set(it.x + Math.sin(t * it.speed + it.phase) * 0.5, it.y + Math.sin(t * it.speed * 1.7 + it.phase) * 0.22, it.z)
      dummy.rotation.set(0, t * it.spin + it.phase, Math.sin(t * it.speed + it.phase) * 0.25)
      // shrink away when the camera flies close, so nothing ever blocks the view
      const dx = it.x - camera.position.x
      const dy = it.y - camera.position.y
      const dz = it.z - camera.position.z
      const fade = smoothstep((Math.sqrt(dx * dx + dy * dy + dz * dz) - 3.5) / 4)
      dummy.scale.setScalar(it.scale * fade)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[geo, undefined, count]} frustumCulled={false}>
      <meshBasicMaterial transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  )
}

/** A few tiny hearts and sparkles drifting near the ceiling. Two instanced meshes, trivial cost. */
export function Floaters({ layout }: { layout: Layout }) {
  return (
    <>
      <Group layout={layout} kind="heart" count={16} seed={11} />
      <Group layout={layout} kind="star" count={26} seed={29} />
    </>
  )
}
