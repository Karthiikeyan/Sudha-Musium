import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { content } from '../../config/content'
import type { RoomDef } from '../../journey/rooms'
import { sfx } from '../../lib/audio'
import { radialTexture } from '../../lib/textures'
import { useStore } from '../../state/store'
import { BlobShadow } from '../BlobShadow'
import { Door } from '../Door'
import { useCanvasTexture, useDisposable } from '../hooks'
import { Plinth } from '../Plinth'
import { Lamp, Plant } from '../props'
import { RoomShell } from '../RoomShell'
import { Sign } from '../Sign'
import { Star } from '../Star'

const GOLD = '#c9a45c'

/** Wrapped gift on a plinth: wiggles until the first visit, then pops its lid with sparkles. */
function GiftBox({ x, z }: { x: number; z: number }) {
  const box = useRef<THREE.Group>(null)
  const lid = useRef<THREE.Group>(null)
  const sparkles = useRef<THREE.Group>(null)
  const t0 = useRef(-1)
  const sparkMat = useDisposable(
    () =>
      new THREE.SpriteMaterial({ map: radialTexture('glow'), color: '#ffe08a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    [],
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const st = useStore.getState()
    const isOpen = st.progress.giftOpened
    if (!isOpen && st.phase !== 'loading' && st.phase !== 'start' && t0.current < 0) {
      t0.current = t + 1.6 // pop a moment after she arrives
    }
    if (!isOpen && t0.current > 0 && t >= t0.current) {
      st.updateProgress({ giftOpened: true })
      sfx('sparkle')
      t0.current = t
    }
    if (box.current) box.current.rotation.z = isOpen ? 0 : Math.sin(t * 9) * 0.05 * (Math.sin(t * 1.3) > 0.4 ? 1 : 0)
    const k = isOpen ? Math.min(1, (t - Math.max(0, t0.current)) / 0.7) : 0
    const done = isOpen && t0.current < 0
    if (lid.current) {
      const kk = done ? 1 : k
      lid.current.position.set(0.35 * kk, 0.78 + kk * 0.25 - kk * kk * 0.6, 0.15 * kk)
      lid.current.rotation.z = -kk * 1.1
    }
    if (sparkles.current) {
      const ch = sparkles.current.children
      const live = isOpen && !done && k < 1
      sparkMat.opacity = live ? 1 - k : 0
      for (let i = 0; i < ch.length; i++) {
        const a = (i / ch.length) * Math.PI * 2
        ch[i].position.set(Math.cos(a) * k * 0.9, 0.9 + k * 1.3 + Math.sin(a * 2) * 0.2, Math.sin(a) * k * 0.9)
      }
    }
  })
  return (
    <group position={[x, 0, z]}>
      <Plinth x={0} z={0} w={1.2} d={1.2} h={0.9} />
      <group position={[0, 0.9, 0]}>
        <group ref={box}>
          <mesh position={[0, 0.32, 0]}>
            <boxGeometry args={[0.64, 0.64, 0.64]} />
            <meshStandardMaterial color="#f7a8bd" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <boxGeometry args={[0.66, 0.66, 0.12]} />
            <meshStandardMaterial color="#fbe7a6" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <boxGeometry args={[0.12, 0.66, 0.66]} />
            <meshStandardMaterial color="#fbe7a6" roughness={0.5} />
          </mesh>
        </group>
        <group ref={lid} position={[0, 0.78, 0]}>
          <mesh>
            <boxGeometry args={[0.72, 0.14, 0.72]} />
            <meshStandardMaterial color="#f48fac" roughness={0.6} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.1, 0.12, 0]} rotation={[0, 0, s * 0.6]}>
              <torusGeometry args={[0.1, 0.035, 8, 16]} />
              <meshStandardMaterial color="#fbe7a6" roughness={0.5} />
            </mesh>
          ))}
        </group>
        <group ref={sparkles}>
          {Array.from({ length: 10 }, (_, i) => (
            <sprite key={i} material={sparkMat} scale={[0.3, 0.3, 1]} />
          ))}
        </group>
      </group>
    </group>
  )
}

/** "Sudha's Museum" title that floats above the ticket desk once the gift has popped. */
function TitleSign() {
  const opened = useStore((s) => s.progress.giftOpened)
  const g = useRef<THREE.Group>(null)
  const k = useRef(opened ? 1 : 0)
  useFrame(({ clock }, delta) => {
    k.current = opened ? Math.min(1, k.current + Math.min(delta, 0.05) * 1.6) : 0
    if (g.current) {
      const e = 1 - Math.pow(1 - k.current, 3)
      g.current.scale.setScalar(Math.max(0.001, e))
      g.current.position.y = 3.05 + Math.sin(clock.elapsedTime * 1.4) * 0.06
    }
  })
  return (
    <group ref={g} position={[-3, 3.05, -1.3]}>
      <Sign
        lines={[{ text: content.museumTitle, font: '600 {px}px "Playfair Display", serif', color: '#f3dca0' }]}
        w={3.8}
        h={0.8}
        position={[0, 0, 0]}
        transparent
      />
    </group>
  )
}

/** Framed "floor plan of the museum" on the west wall (drawn into a canvas). */
function FloorPlan({ x, z }: { x: number; z: number }) {
  const rooms = useStore((s) => s.rooms)
  const key = rooms.map((r) => r.name).join('|')
  const tex = useCanvasTexture(
    600,
    420,
    (ctx, W, H) => {
      ctx.fillStyle = '#f6efe0'
      ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = '#3a3530'
      ctx.lineWidth = 3
      ctx.fillStyle = '#3a3530'
      ctx.font = 'italic 30px "Playfair Display", serif'
      ctx.textAlign = 'center'
      ctx.fillText('Floor plan', W / 2, 44)
      const n = rooms.length
      const cols = Math.min(4, n)
      const rows = Math.ceil(n / cols)
      const bw = (W - 60) / cols
      const bh = (H - 90) / rows
      rooms.forEach((r, i) => {
        const cx = 30 + (i % cols) * bw
        const cy = 64 + Math.floor(i / cols) * bh
        ctx.strokeRect(cx + 6, cy + 6, bw - 12, bh - 12)
        ctx.font = '600 17px "Inter Variable", sans-serif'
        ctx.fillText(r.name, cx + bw / 2, cy + bh / 2, bw - 20)
        ctx.font = '14px "Inter Variable", sans-serif'
        ctx.fillText(String(i + 1), cx + bw / 2, cy + bh / 2 + 22)
      })
    },
    [key],
  )
  const mat = useDisposable(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex])
  return (
    <group position={[x, 2.1, z]} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[2.3, 1.7, 0.06]} />
        <meshLambertMaterial color={GOLD} />
      </mesh>
      <mesh material={mat} position={[0, 0, 0.005]}>
        <planeGeometry args={[2.1, 1.5]} />
      </mesh>
    </group>
  )
}

function RopeBarrier({ x0, x1, z }: { x0: number; x1: number; z: number }) {
  const n = 3
  const posts = Array.from({ length: n }, (_, i) => x0 + ((x1 - x0) * i) / (n - 1))
  return (
    <group>
      {posts.map((x) => (
        <group key={x} position={[x, 0, z]}>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.16, 0.18, 0.06, 14]} />
            <meshLambertMaterial color={GOLD} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 1.0, 10]} />
            <meshLambertMaterial color={GOLD} />
          </mesh>
          <mesh position={[0, 1.02, 0]}>
            <sphereGeometry args={[0.07, 10, 8]} />
            <meshLambertMaterial color={GOLD} />
          </mesh>
        </group>
      ))}
      {posts.slice(0, -1).map((x, i) => {
        const nx = posts[i + 1]
        return (
          <mesh key={'r' + i} position={[(x + nx) / 2, 0.85, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.035, nx - x, 8]} />
            <meshLambertMaterial color="#a4243b" />
          </mesh>
        )
      })}
    </group>
  )
}

/** Chapter 1 · The Ticket Gate: dark charcoal, warm gold, a ticket desk and a gift. */
export function LobbyRoom({ room }: { room: RoomDef }) {
  const L = room.layout
  const pal = room.palette
  const request = useStore((s) => s.requestInteraction)
  const ticket = L.interactables.find((i) => i.kind === 'ticket')
  return (
    <>
      <color attach="background" args={[pal.bg]} />
      <hemisphereLight args={['#fff3dc', '#3a3026', 1.9]} />
      <directionalLight position={[3, 9, 6]} intensity={0.55} color="#ffe6bd" />
      <pointLight position={[-3, 2.6, -0.6]} intensity={6} distance={7} decay={2} color="#ffcf8a" />
      <RoomShell layout={L} palette={pal} floor="marble" tile={2} />
      <Sign
        lines={[
          { text: content.museumTitle.toUpperCase(), font: '600 {px}px "Playfair Display", serif', color: '#e8c27a' },
          { text: 'GATE 23 · ADMIT ONE', font: '500 {px}px "Inter Variable", sans-serif', color: '#bfa271' },
        ]}
        w={4.2}
        h={0.85}
        position={[0, 3.55, -L.d / 2 + 0.01]}
        transparent
      />

      {/* ticket desk */}
      <group
        position={[-3, 0, -1]}
        onClick={(e) => {
          e.stopPropagation()
          if (ticket) request(ticket)
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <BlobShadow w={3.8} d={1.8} opacity={0.55} />
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[3, 1, 0.9]} />
          <meshLambertMaterial color="#3b2f2a" />
        </mesh>
        <mesh position={[0, 1.03, 0]}>
          <boxGeometry args={[3.1, 0.06, 1.0]} />
          <meshLambertMaterial color={GOLD} />
        </mesh>
        <mesh position={[0, 0.5, 0.46]}>
          <boxGeometry args={[2.8, 0.04, 0.02]} />
          <meshLambertMaterial color={GOLD} />
        </mesh>
        <Lamp x={-1.1} y={1.06} z={-0.1} />
        {/* the little stack of tickets */}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0.4 + i * 0.02, 1.08 + i * 0.012, 0.1]} rotation={[0, 0.2 * i, 0]}>
            <boxGeometry args={[0.45, 0.01, 0.2]} />
            <meshBasicMaterial color={i % 2 ? '#f7c6d4' : '#fbe7a6'} />
          </mesh>
        ))}
      </group>
      <Sign
        lines={[{ text: 'Tickets 🎟️', font: 'italic 400 {px}px "Playfair Display", serif', color: '#f3dca0' }]}
        w={1.6}
        h={0.45}
        position={[-3, 1.55, -1.47]}
        bg="#2a2420"
        border={GOLD}
      />
      <TitleSign />

      <GiftBox x={3} z={-1.2} />
      <RopeBarrier x0={-4.6} x1={-1.4} z={-3} />
      <RopeBarrier x0={1.4} x1={4.6} z={-3} />
      <FloorPlan x={-L.w / 2 + 0.02} z={0.6} />
      <Plant x={5} z={3.4} />
      <Plant x={-5} z={3.4} leaf="#6aa565" />
      <Door room={room} />
      <Star room={room} />
    </>
  )
}
