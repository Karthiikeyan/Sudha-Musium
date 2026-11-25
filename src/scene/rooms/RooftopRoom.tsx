import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { RoomDef } from '../../journey/rooms'
import { sfx } from '../../lib/audio'
import { fireworksBurst } from '../../lib/fx'
import { isTouch, prefersReducedMotion } from '../../lib/device'
import { mulberry32 } from '../../lib/math'
import { radialTexture } from '../../lib/textures'
import { useStore } from '../../state/store'
import { Bench } from '../Bench'
import { BlobShadow } from '../BlobShadow'
import { Cake } from '../Cake'
import { Celebration } from '../Celebration'
import { useCanvasTexture, useDisposable } from '../hooks'
import { StringLights } from '../props'
import { RoomShell } from '../RoomShell'

/** Gradient sky dome + twinkling stars + moon. */
function NightSky() {
  const tex = useCanvasTexture(
    8,
    256,
    (ctx, W, H) => {
      const g = ctx.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, '#050817')
      g.addColorStop(0.45, '#0b1230')
      g.addColorStop(0.75, '#24305e')
      g.addColorStop(1, '#4a3a6a')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)
    },
    [],
  )
  const domeMat = useDisposable(() => new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false }), [tex])
  const starsA = useRef<THREE.PointsMaterial>(null)
  const starsB = useRef<THREE.PointsMaterial>(null)
  const [geoA, geoB] = useMemo(() => {
    const r = mulberry32(5)
    const make = (n: number) => {
      const arr = new Float32Array(n * 3)
      for (let i = 0; i < n; i++) {
        const th = r() * Math.PI * 2
        const ph = 0.15 + r() * 1.25
        const R = 70
        arr[i * 3] = Math.cos(th) * Math.sin(ph) * R
        arr[i * 3 + 1] = Math.cos(ph) * R
        arr[i * 3 + 2] = Math.sin(th) * Math.sin(ph) * R
      }
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
      return g
    }
    return [make(220), make(220)]
  }, [])
  useEffect(
    () => () => {
      geoA.dispose()
      geoB.dispose()
    },
    [geoA, geoB],
  )
  const moonMat = useDisposable(
    () => new THREE.SpriteMaterial({ map: radialTexture('glow'), color: '#fff3c9', transparent: true, opacity: 0.9, fog: false, depthWrite: false, toneMapped: false }),
    [],
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (starsA.current) starsA.current.opacity = 0.6 + Math.sin(t * 1.7) * 0.35
    if (starsB.current) starsB.current.opacity = 0.6 + Math.sin(t * 1.3 + 2) * 0.35
  })
  return (
    <>
      <mesh material={domeMat} renderOrder={-1}>
        <sphereGeometry args={[80, 24, 16]} />
      </mesh>
      <points geometry={geoA}>
        <pointsMaterial ref={starsA} color="#ffffff" size={0.5} sizeAttenuation transparent fog={false} depthWrite={false} />
      </points>
      <points geometry={geoB}>
        <pointsMaterial ref={starsB} color="#ffe9c0" size={0.38} sizeAttenuation transparent fog={false} depthWrite={false} />
      </points>
      <sprite material={moonMat} position={[-22, 26, -48]} scale={[12, 12, 1]} />
      <mesh position={[-22, 26, -48.5]}>
        <circleGeometry args={[2.2, 24]} />
        <meshBasicMaterial color="#fff6dc" fog={false} toneMapped={false} />
      </mesh>
    </>
  )
}

/** Low-poly city skyline with lit windows (instanced boxes + one windows texture). */
function Skyline() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const tex = useCanvasTexture(
    128,
    256,
    (ctx, W, H) => {
      ctx.fillStyle = '#141a36'
      ctx.fillRect(0, 0, W, H)
      const r = mulberry32(17)
      for (let y = 10; y < H - 6; y += 18) {
        for (let x = 8; x < W - 8; x += 20) {
          const on = r() > 0.45
          ctx.fillStyle = on ? (r() > 0.7 ? '#ffd58a' : '#ffe9b8') : '#232a4e'
          ctx.fillRect(x, y, 10, 10)
        }
      }
    },
    [],
  )
  const mat = useDisposable(() => new THREE.MeshBasicMaterial({ map: tex, color: '#c9cfff', toneMapped: false }), [tex])
  const buildings = useMemo(() => {
    const r = mulberry32(23)
    const out: { x: number; z: number; w: number; h: number; d: number }[] = []
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI * 0.95 + (i / 25) * Math.PI * 0.9 - Math.PI * 0.03
      const dist = 30 + r() * 16
      out.push({ x: Math.cos(a) * dist, z: Math.sin(a) * dist - 2, w: 3 + r() * 4, h: 8 + r() * 14, d: 3 + r() * 3 })
    }
    return out
  }, [])
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const d = new THREE.Object3D()
    buildings.forEach((b, i) => {
      d.position.set(b.x, b.h / 2 - 9, b.z)
      d.scale.set(b.w, b.h, b.d)
      d.rotation.y = Math.atan2(b.x, b.z)
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  }, [buildings])
  return (
    <instancedMesh ref={ref} args={[undefined, mat, buildings.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  )
}

/** A few 3D firework bursts in the sky while celebrating. */
function Fireworks() {
  const phase = useStore((s) => s.phase)
  const on = (phase === 'celebration' || phase === 'finale') && !prefersReducedMotion()
  useEffect(() => {
    if (phase !== 'celebration') return
    return fireworksBurst()
  }, [phase])
  const ref = useRef<THREE.InstancedMesh>(null)
  const PER = isTouch() ? 24 : 40
  const BURSTS = 3
  const dirs = useMemo(() => {
    const r = mulberry32(31)
    return Array.from({ length: PER * BURSTS }, () => {
      const th = r() * Math.PI * 2
      const ph = Math.acos(2 * r() - 1)
      return new THREE.Vector3(Math.cos(th) * Math.sin(ph), Math.cos(ph), Math.sin(th) * Math.sin(ph))
    })
  }, [PER])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const t0 = useRef(-1)
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const c = new THREE.Color()
    const cols = ['#ffd58a', '#ff9fb4', '#b9a7ff', '#9ef0ff']
    for (let i = 0; i < PER * BURSTS; i++) {
      c.set(cols[Math.floor(i / PER) % cols.length])
      m.setColorAt(i, c)
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [PER])
  useFrame(({ clock }) => {
    const m = ref.current
    if (!m) return
    m.visible = on
    if (!on) {
      t0.current = -1
      return
    }
    if (t0.current < 0) t0.current = clock.elapsedTime
    const t = clock.elapsedTime - t0.current
    for (let b = 0; b < BURSTS; b++) {
      const cycle = 2.6
      const local = (t + b * 0.9) % cycle
      const k = local / cycle
      const n = Math.floor((t + b * 0.9) / cycle)
      const cx = ((b * 7 + n * 5) % 15) - 7
      const cy = 9 + ((n + b) % 3) * 1.6
      const cz = -16 - b * 2
      const radius = 4.5 * (1 - Math.pow(1 - k, 3))
      const s = Math.max(0, 1 - k) * 0.22
      for (let i = 0; i < PER; i++) {
        const d = dirs[b * PER + i]
        dummy.position.set(cx + d.x * radius, cy + d.y * radius - k * k * 1.5, cz + d.z * radius)
        dummy.scale.setScalar(s)
        dummy.updateMatrix()
        m.setMatrixAt(b * PER + i, dummy.matrix)
      }
    }
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, PER * BURSTS]} frustumCulled={false} visible={false}>
      <sphereGeometry args={[1, 6, 5]} />
      <meshBasicMaterial toneMapped={false} fog={false} />
    </instancedMesh>
  )
}

/** The wish tree: glowing paper-lantern tags; every wish she hangs adds one (purely visual, nothing is saved). */
function WishTree({ room }: { room: RoomDef }) {
  const request = useStore((s) => s.requestInteraction)
  const wishes = useStore((s) => s.wishes)
  const inter = room.layout.interactables.find((i) => i.kind === 'wishtree')
  const spot = room.layout.spots.tree ?? { x: 5.2, z: -3 }
  const lanternRef = useRef<THREE.InstancedMesh>(null)
  const MAX = 30
  const slots = useMemo(() => {
    const r = mulberry32(41)
    return Array.from({ length: MAX }, () => {
      const a = r() * Math.PI * 2
      const rad = 0.6 + r() * 0.75
      return new THREE.Vector3(Math.cos(a) * rad, 2.0 + r() * 1.3, Math.sin(a) * rad)
    })
  }, [])
  const count = Math.min(MAX, 8 + wishes.length)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const born = useRef<number[]>([])
  useFrame(({ clock }) => {
    const m = lanternRef.current
    if (!m) return
    const t = clock.elapsedTime
    for (let i = 0; i < MAX; i++) {
      if (i < count && born.current[i] === undefined) born.current[i] = i < 8 ? -10 : t
      const age = born.current[i] === undefined ? -1 : t - (born.current[i] as number)
      const grow = i >= count || age < 0 ? 0 : Math.min(1, age / 0.6)
      const p = slots[i]
      dummy.position.set(p.x, p.y + Math.sin(t * 1.5 + i) * 0.04, p.z)
      dummy.rotation.set(0, t * 0.3 + i, Math.sin(t * 1.2 + i) * 0.15)
      dummy.scale.set(grow, grow * 1.4, grow)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })
  useLayoutEffect(() => {
    const m = lanternRef.current
    if (!m) return
    const c = new THREE.Color()
    const cols = ['#ffd58a', '#ffb3c7', '#ffe9b8', '#d9ccf2']
    for (let i = 0; i < MAX; i++) {
      c.set(cols[i % cols.length])
      m.setColorAt(i, c)
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [])
  const blossoms = useMemo(
    () => [
      [0, 2.5, 0, 1.0],
      [0.7, 2.2, 0.3, 0.75],
      [-0.6, 2.25, -0.2, 0.8],
      [0.2, 3.1, -0.4, 0.7],
      [-0.3, 2.9, 0.5, 0.65],
    ],
    [],
  )
  return (
    <group
      position={[spot.x, 0, spot.z]}
      onClick={(e) => {
        e.stopPropagation()
        if (inter) request(inter)
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <BlobShadow w={2.6} d={2.6} opacity={0.6} />
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.14, 0.24, 1.8, 10]} />
        <meshLambertMaterial color="#6b4a32" />
      </mesh>
      {blossoms.map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[s, 14, 12]} />
          <meshLambertMaterial color={i % 2 ? '#e7a3c0' : '#c78fb6'} />
        </mesh>
      ))}
      <instancedMesh ref={lanternRef} args={[undefined, undefined, MAX]} frustumCulled={false}>
        <boxGeometry args={[0.13, 0.13, 0.13]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.7, 0.75, 0.06, 20]} />
        <meshLambertMaterial color="#565c78" />
      </mesh>
    </group>
  )
}

/** The stair kiosk she came out of: its door swings shut behind her on arrival. */
function Kiosk({ room }: { room: RoomDef }) {
  const spot = room.layout.spots.kiosk ?? { x: -6.4, z: 5.9 }
  const door = useRef<THREE.Group>(null)
  const t = useRef(0)
  const closed = useRef(false)
  useFrame((_, delta) => {
    t.current += Math.min(delta, 0.05)
    const k = Math.min(1, Math.max(0, (t.current - 0.9) / 0.7))
    if (door.current) door.current.rotation.y = -1.4 * (1 - k * k)
    if (k >= 1 && !closed.current) {
      closed.current = true
      sfx('door')
    }
  })
  return (
    <group position={[spot.x, 0, spot.z]}>
      <BlobShadow w={3} d={2.6} opacity={0.6} />
      <mesh position={[0, 1.35, 0]}>
        <boxGeometry args={[2.2, 2.7, 1.8]} />
        <meshLambertMaterial color="#565c78" />
      </mesh>
      <mesh position={[0, 2.75, 0]}>
        <boxGeometry args={[2.4, 0.12, 2.0]} />
        <meshLambertMaterial color="#8a90ad" />
      </mesh>
      {/* warm doorway on the east face */}
      <mesh position={[1.11, 1.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.95, 2.0]} />
        <meshBasicMaterial color="#ffe2a8" toneMapped={false} />
      </mesh>
      <group ref={door} position={[1.13, 0, -0.48]}>
        <mesh position={[0, 1.05, 0.48]}>
          <boxGeometry args={[0.06, 2.0, 0.95]} />
          <meshLambertMaterial color="#3b3f58" />
        </mesh>
      </group>
    </group>
  )
}

/** Chapter · The Rooftop: night sky, fairy lights, the cake, the wish tree, fireworks. */
export function RooftopRoom({ room }: { room: RoomDef }) {
  const L = room.layout
  const pal = room.palette
  const cake = L.spots.cake ?? { x: 0, z: -1.6, yaw: 0 }
  const hw = L.w / 2
  const hd = L.d / 2
  const poles: [number, number][] = [
    [-hw + 0.3, -hd + 0.3],
    [hw - 0.3, -hd + 0.3],
    [hw - 0.3, hd - 0.3],
    [-hw + 0.3, hd - 0.3],
  ]
  const H = 3.2
  return (
    <>
      <color attach="background" args={[pal.bg]} />
      {pal.fog && <fog attach="fog" args={pal.fog} />}
      <hemisphereLight args={['#e4e6ff', '#4a4060', 2.3]} />
      <directionalLight position={[-6, 12, -8]} intensity={0.55} color="#c9d4ff" />
      <NightSky />
      <Skyline />
      <RoomShell layout={L} palette={pal} floor="deck" tile={2} wallH={1.0} south wallColor="#4a5070" />
      {poles.map(([x, z], i) => (
        <mesh key={i} position={[x, H / 2, z]}>
          <cylinderGeometry args={[0.05, 0.06, H, 8]} />
          <meshLambertMaterial color="#8a90ad" />
        </mesh>
      ))}
      <StringLights
        strands={[
          [
            [poles[0][0], H, poles[0][1]],
            [poles[1][0], H, poles[1][1]],
          ],
          [
            [poles[1][0], H, poles[1][1]],
            [poles[2][0], H, poles[2][1]],
          ],
          [
            [poles[3][0], H, poles[3][1]],
            [poles[0][0], H, poles[0][1]],
          ],
          [
            [poles[0][0], H, poles[0][1]],
            [poles[2][0], H, poles[2][1]],
          ],
          [
            [poles[1][0], H, poles[1][1]],
            [poles[3][0], H, poles[3][1]],
          ],
        ]}
        perStrand={26}
        sag={0.7}
        size={0.06}
      />
      <Cake layout={L} />
      {L.benches.map((b) => (
        <Bench key={b.id} bench={b} interactable={L.interactables.find((i) => i.id === 'bench-' + b.id)} seat="#b8936c" />
      ))}
      <WishTree room={room} />
      <Kiosk room={room} />
      <Fireworks />
      <Celebration center={cake} />
    </>
  )
}
