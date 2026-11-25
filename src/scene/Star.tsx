import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { RoomDef } from '../journey/rooms'
import { radialTexture } from '../lib/textures'
import { world } from '../lib/world'
import { useStore } from '../state/store'
import { useDisposable } from './hooks'

const HINT_AFTER_MS = 60000
const BEACON_MS = 5500

function starShape() {
  const s = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.2 : 0.085
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) s.moveTo(x, y)
    else s.lineTo(x, y)
  }
  s.closePath()
  return s
}

/** The room's hidden star: spins, bobs, sparkles. After 60 s (or on "Hint") it gets a trail and a beacon. */
export function Star({ room }: { room: RoomDef }) {
  const star = room.layout.star
  const collected = useStore((s) => s.progress.stars.includes(room.id))
  const g = useRef<THREE.Group>(null)
  const beam = useRef<THREE.Mesh>(null)
  const trail = useRef<THREE.Group>(null)
  const pop = useRef(collected ? 1 : 0)

  const geo = useDisposable(
    () => new THREE.ExtrudeGeometry(starShape(), { depth: 0.05, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 1 }),
    [],
  )
  const mat = useDisposable(() => new THREE.MeshBasicMaterial({ color: '#ffd34d', toneMapped: false, transparent: true }), [])
  const glowMat = useDisposable(
    () =>
      new THREE.SpriteMaterial({ map: radialTexture('glow'), color: '#ffe08a', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    [],
  )
  const beamMat = useDisposable(
    () => new THREE.MeshBasicMaterial({ color: '#ffe8a0', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }),
    [],
  )

  useFrame(({ clock }, delta) => {
    if (!star || !g.current) return
    const dt = Math.min(delta, 0.05)
    const t = clock.elapsedTime
    const st = useStore.getState()
    const done = st.progress.stars.includes(room.id)
    pop.current = done ? Math.min(1, pop.current + dt * 2.2) : 0
    const k = pop.current
    g.current.visible = k < 1
    g.current.position.set(star.x, star.y + Math.sin(t * 2.2) * 0.05 + k * 1.2, star.z)
    g.current.rotation.y = t * 1.8 + k * 8
    g.current.scale.setScalar(1 + k * 0.8)
    mat.opacity = 1 - k
    glowMat.opacity = (0.6 + Math.sin(t * 4) * 0.2) * (1 - k)

    const nowMs = performance.now()
    const longWait = nowMs - st.roomEnteredAt > HINT_AFTER_MS
    const beacon = st.hintAt > 0 && nowMs - st.hintAt < BEACON_MS
    if (beam.current) {
      beam.current.visible = !done && beacon
      beamMat.opacity = beacon ? 0.25 + Math.sin(t * 6) * 0.1 : 0
    }
    if (trail.current) {
      trail.current.visible = !done && (longWait || beacon)
      const ch = trail.current.children
      for (let i = 0; i < ch.length; i++) {
        const a = t * 1.6 + (i / ch.length) * Math.PI * 2
        ch[i].position.set(Math.cos(a) * 0.7, 0.15 + ((t * 0.6 + i * 0.25) % 1.2), Math.sin(a) * 0.7)
      }
    }
  })

  if (!star || (collected && pop.current >= 1)) return null
  return (
    <>
      <group
        ref={g}
        position={[star.x, star.y, star.z]}
        onClick={(e) => {
          e.stopPropagation()
          if (useStore.getState().phase !== 'explore') return
          world.walkTarget = { x: star.x, z: star.z }
          world.walkTargetAge = 0
        }}
      >
        <mesh geometry={geo} material={mat} position={[0, 0, -0.025]} />
        <sprite material={glowMat} scale={[0.9, 0.9, 1]} />
      </group>
      <mesh ref={beam} position={[star.x, 2.5, star.z]} material={beamMat} visible={false}>
        <cylinderGeometry args={[0.25, 0.4, 5, 16, 1, true]} />
      </mesh>
      <group ref={trail} position={[star.x, 0, star.z]} visible={false}>
        {Array.from({ length: 6 }, (_, i) => (
          <sprite key={i} material={glowMat} scale={[0.22, 0.22, 1]} />
        ))}
      </group>
    </>
  )
}
