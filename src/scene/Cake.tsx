import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { content } from '../config/content'
import { damp } from '../lib/math'
import { radialTexture, ribbonTexture, textSpriteTexture } from '../lib/textures'
import { useStore } from '../state/store'
import { BlobShadow } from './BlobShadow'
import { useDisposable } from './hooks'
import type { RoomLayout } from './layout'

const CANDLE_COLORS = ['#f7c6d4', '#d9ccf2', '#fbe7a6', '#c9e7f2', '#ffd1b3']
const PLINTH_H = 1.0
const BASE_Y = PLINTH_H + 0.03
const SMOKE_SECONDS = 1.7

const easeOutElastic = (t: number) => {
  if (t <= 0) return 0
  if (t >= 1) return 1
  return Math.pow(2, -10 * t) * Math.sin(((t * 10 - 0.75) * (2 * Math.PI)) / 3) + 1
}

/** Birthday cake on its own plinth. Pops in (with a bounce) once the quiz is finished; 5 flickering candles. */
export function Cake({ layout }: { layout: RoomLayout }) {
  const request = useStore((s) => s.requestInteraction)
  const inter = layout.interactables.find((i) => i.id === 'cake')
  const spot = layout.spots.cake ?? { x: 0, z: 0 }
  const x = spot.x
  const z = spot.z
  const stand = inter?.stand ?? { x, z: z + 2.5 }

  const group = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)
  const light = useRef<THREE.PointLight>(null)
  const flames = useRef<(THREE.Mesh | null)[]>([])
  const glows = useRef<(THREE.Sprite | null)[]>([])
  const smoke = useRef<(THREE.Sprite | null)[]>([])
  const label = useRef<THREE.Sprite>(null)
  const state = useRef({ pop: 0, flame: 1, smokeT: -1, wasOut: false })

  const candlePos = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2 + 0.3
        return new THREE.Vector3(Math.cos(a) * 0.2, BASE_Y + 0.34 + 0.28 + 0.12, Math.sin(a) * 0.2)
      }),
    [],
  )
  const cherryPos = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2
        return new THREE.Vector3(Math.cos(a) * 0.5, BASE_Y + 0.34 + 0.05, Math.sin(a) * 0.5)
      }),
    [],
  )
  const drips = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return { p: new THREE.Vector3(Math.cos(a) * 0.615, BASE_Y + 0.34 - 0.06 - (i % 3) * 0.04, Math.sin(a) * 0.615), s: 0.7 + (i % 3) * 0.3 }
      }),
    [],
  )

  const tex = useMemo(
    () => ({
      glow: radialTexture('glow'),
      smoke: radialTexture('shadow'),
      label: textSpriteTexture(String(content.turningAge)),
      ribbon: ribbonTexture('Happy Birthday'),
    }),
    [],
  )
  const ribbonMat = useDisposable(() => new THREE.MeshBasicMaterial({ map: tex.ribbon, toneMapped: false, side: THREE.DoubleSide }), [tex])
  const ringMat = useDisposable(
    () => new THREE.MeshBasicMaterial({ color: '#ff9fb4', transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    [],
  )

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = clock.elapsedTime
    const S = state.current
    const st = useStore.getState()
    const g = group.current
    if (!g) return
    S.pop = Math.min(1, S.pop + dt / 1.1)
    const sc = easeOutElastic(S.pop)
    g.visible = S.pop > 0
    g.scale.setScalar(Math.max(0.0001, sc))

    const out = st.candlesOut
    if (out && !S.wasOut) S.smokeT = 0
    S.wasOut = out
    S.flame = damp(S.flame, out ? 0 : 1, out ? 9 : 4, dt)

    for (let i = 0; i < 5; i++) {
      const f = flames.current[i]
      if (f) {
        const w = 1 + Math.sin(t * 17 + i * 1.7) * 0.16 + Math.sin(t * 29 + i) * 0.07
        f.scale.set(S.flame * (1 - (w - 1) * 0.5), S.flame * w, S.flame * (1 - (w - 1) * 0.5))
        f.rotation.z = Math.sin(t * 9 + i * 2) * 0.12
      }
      const gl = glows.current[i]
      if (gl) {
        gl.scale.setScalar(0.42 * S.flame * (1 + Math.sin(t * 13 + i) * 0.1))
        gl.material.opacity = 0.75 * S.flame
      }
    }
    if (light.current) light.current.intensity = S.flame * (3.2 + Math.sin(t * 15) * 0.4) * (S.pop > 0 ? 1 : 0)

    if (S.smokeT >= 0 && S.smokeT < SMOKE_SECONDS) {
      S.smokeT += dt
      const k = S.smokeT / SMOKE_SECONDS
      for (let i = 0; i < 5; i++) {
        const sp = smoke.current[i]
        if (!sp) continue
        sp.position.set(candlePos[i].x + Math.sin(t * 3 + i) * 0.04 * k * 4, candlePos[i].y + 0.1 + k * 0.9, candlePos[i].z)
        sp.scale.setScalar(0.12 + k * 0.5)
        sp.material.opacity = Math.max(0, (1 - k) * 0.55)
        sp.visible = true
      }
    } else if (S.smokeT >= SMOKE_SECONDS) {
      for (let i = 0; i < 5; i++) {
        const sp = smoke.current[i]
        if (sp) sp.visible = false
      }
    }
    if (label.current) label.current.position.y = BASE_Y + 1.35 + Math.sin(t * 1.8) * 0.05

    if (ring.current) {
      const showRing = !out && st.phase === 'explore'
      ring.current.visible = showRing
      if (showRing) {
        const p = 1 + Math.sin(t * 3.2) * 0.08
        ring.current.scale.set(p, p, 1)
        ringMat.opacity = 0.45 + Math.sin(t * 3.2) * 0.2
      }
    }
  })

  return (
    <>
      <mesh ref={ring} position={[stand.x, 0.03, stand.z]} rotation={[-Math.PI / 2, 0, 0]} material={ringMat} visible={false}>
        <ringGeometry args={[0.7, 0.92, 40]} />
      </mesh>
      <pointLight ref={light} position={[x, BASE_Y + 1.1, z + 0.3]} color="#ffcf8a" intensity={0} distance={9} decay={2} />
      <group
        ref={group}
        position={[x, 0, z]}
        visible={false}
        onClick={(e) => {
          e.stopPropagation()
          if (inter) request(inter)
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        {/* round table */}
        <BlobShadow w={2.6} d={2.6} opacity={0.55} />
        <mesh position={[0, PLINTH_H - 0.03, 0]}>
          <cylinderGeometry args={[0.95, 0.95, 0.06, 36]} />
          <meshStandardMaterial color="#f5efe6" roughness={0.6} />
        </mesh>
        <mesh position={[0, PLINTH_H - 0.07, 0]}>
          <cylinderGeometry args={[0.97, 0.97, 0.04, 36]} />
          <meshStandardMaterial color="#f7c6d4" roughness={0.6} />
        </mesh>
        <mesh position={[0, PLINTH_H / 2, 0]}>
          <cylinderGeometry args={[0.09, 0.12, PLINTH_H, 12]} />
          <meshStandardMaterial color="#c9a45c" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.45, 0.5, 0.06, 24]} />
          <meshStandardMaterial color="#c9a45c" roughness={0.5} />
        </mesh>

        {/* tiers */}
        <mesh position={[0, BASE_Y + 0.17, 0]}>
          <cylinderGeometry args={[0.62, 0.62, 0.34, 40]} />
          <meshStandardMaterial color="#f7c6d4" roughness={0.6} />
        </mesh>
        <mesh position={[0, BASE_Y + 0.34 + 0.14, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.28, 36]} />
          <meshStandardMaterial color="#fff6ef" roughness={0.55} />
        </mesh>
        {/* frosting */}
        <mesh position={[0, BASE_Y + 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.6, 0.05, 10, 40]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
        <mesh position={[0, BASE_Y + 0.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.4, 0.04, 10, 36]} />
          <meshStandardMaterial color="#f7c6d4" roughness={0.4} />
        </mesh>
        {drips.map((d, i) => (
          <mesh key={i} position={d.p} scale={[1, d.s, 1]}>
            <capsuleGeometry args={[0.035, 0.1, 4, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} />
          </mesh>
        ))}
        {/* cherries */}
        {cherryPos.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.065, 12, 10]} />
            <meshStandardMaterial color="#d6213d" roughness={0.25} />
          </mesh>
        ))}

        {/* candles */}
        {candlePos.map((p, i) => (
          <group key={i} position={p}>
            <mesh>
              <cylinderGeometry args={[0.028, 0.028, 0.24, 10]} />
              <meshStandardMaterial color={CANDLE_COLORS[i]} roughness={0.5} />
            </mesh>
            <mesh
              ref={(m) => {
                flames.current[i] = m
              }}
              position={[0, 0.19, 0]}
            >
              <coneGeometry args={[0.05, 0.15, 10]} />
              <meshBasicMaterial color="#ffb62e" toneMapped={false} />
            </mesh>
            <sprite
              ref={(s) => {
                glows.current[i] = s
              }}
              position={[0, 0.2, 0]}
            >
              <spriteMaterial map={tex.glow} color="#ffcc66" transparent opacity={0.75} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </sprite>
            <sprite
              ref={(s) => {
                smoke.current[i] = s
              }}
              visible={false}
            >
              <spriteMaterial map={tex.smoke} color="#9a9a9a" transparent opacity={0} depthWrite={false} toneMapped={false} />
            </sprite>
          </group>
        ))}

        {/* floating "23" */}
        <sprite ref={label} position={[0, BASE_Y + 1.35, 0]} scale={[0.95, 0.95, 1]}>
          <spriteMaterial map={tex.label} transparent depthWrite={false} toneMapped={false} />
        </sprite>

        {/* bunting ribbon between two little poles */}
        {[-1.45, 1.45].map((px) => (
          <group key={px} position={[px, 0, 0]}>
            <mesh position={[0, 1.6, 0]}>
              <cylinderGeometry args={[0.035, 0.045, 3.2, 8]} />
              <meshStandardMaterial color="#f5f2ec" roughness={0.6} />
            </mesh>
            <mesh position={[0, 3.25, 0]}>
              <sphereGeometry args={[0.08, 12, 10]} />
              <meshStandardMaterial color="#fbe7a6" roughness={0.4} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 2.85, 0]} material={ribbonMat}>
          <planeGeometry args={[2.9, 0.55]} />
        </mesh>
      </group>
    </>
  )
}
