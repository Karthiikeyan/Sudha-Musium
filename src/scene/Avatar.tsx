import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { clamp } from '../lib/math'
import * as THREE from 'three'
import { content } from '../config/content'
import type { Actor } from '../lib/world'
import { useStore, type Who } from '../state/store'
import { BlobShadow } from './BlobShadow'

interface Props {
  variant: 'girl' | 'boy'
  who: Who
  name: string
  actor: Actor
}

interface Rig {
  apf: number
  apz: number
  anf: number
  anz: number
  lpf: number
  lnf: number
  by: number
  leanX: number
  leanZ: number
  hz: number
  hx: number
  yaw: number
}

const ZERO_RIG: Rig = { apf: 0, apz: 0.1, anf: 0, anz: -0.1, lpf: 0, lnf: 0, by: 0, leanX: 0, leanZ: 0, hz: 0, hx: 0, yaw: 0 }

const K_BLUSH = '#ff9fb4'

/**
 * Cute chibi avatar built from primitives. All animation is driven by the shared `actor` object
 * (position / yaw / pose / speed) inside useFrame, with smooth blending between poses and no per-frame allocations.
 */
export function Avatar({ variant, who, name, actor }: Props) {
  const girl = variant === 'girl'
  const pal = girl ? content.colors.sudha : content.colors.karthik
  const bubble = useStore((s) => s.bubbles[who])

  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const armP = useRef<THREE.Group>(null)
  const armN = useRef<THREE.Group>(null)
  const legP = useRef<THREE.Group>(null)
  const legN = useRef<THREE.Group>(null)
  const eyes = useRef<THREE.Group>(null)
  const tagWrap = useRef<HTMLDivElement>(null)
  const bubbleWrap = useRef<HTMLDivElement>(null)
  const lastScale = useRef(1)
  const cur = useRef<Rig>({ ...ZERO_RIG })
  const tg = useRef<Rig>({ ...ZERO_RIG })
  const phase = useRef(0)
  const yawWob = useRef(0)
  const blinkSeed = useMemo(() => (girl ? 0.7 : 2.1), [girl])

  const mats = useMemo(() => {
    const std = (c: string, rough = 0.7) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0 })
    return {
      skin: std(pal.skin, 0.6),
      hair: std(pal.hair, 0.55),
      top: std(pal.top),
      main: std(girl ? content.colors.sudha.cardigan : content.colors.karthik.vest),
      sleeve: std(girl ? content.colors.sudha.cardigan : content.colors.karthik.top),
      bottom: std(pal.bottom, 0.85),
      shoes: std(pal.shoes, 0.6),
      dark: new THREE.MeshStandardMaterial({ color: '#1b1416', roughness: 0.4 }),
      white: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      blush: new THREE.MeshBasicMaterial({ color: K_BLUSH, transparent: true, opacity: 0.75 }),
    }
  }, [pal, girl])

  const geo = useMemo(() => {
    const hairCap = new THREE.SphereGeometry(0.455, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.62)
    return {
      head: new THREE.SphereGeometry(0.42, 32, 24),
      hairCap,
      torso: new THREE.CapsuleGeometry(0.24, 0.26, 6, 16),
      limb: new THREE.CapsuleGeometry(0.075, 0.3, 4, 10),
      leg: new THREE.CapsuleGeometry(0.105, 0.28, 4, 10),
      ball: new THREE.SphereGeometry(1, 14, 10),
      smile: new THREE.TorusGeometry(0.06, 0.013, 6, 14, Math.PI),
      brow: new THREE.CapsuleGeometry(0.012, 0.08, 3, 6),
      waist: new THREE.CylinderGeometry(0.25, 0.25, 0.17, 18),
    }
  }, [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    const r = root.current
    if (!r) return
    const T = tg.current
    const C = cur.current
    const spd = actor.speed
    // defaults (idle)
    T.apf = 0.04
    T.anf = 0.04
    T.apz = 0.1 + Math.sin(t * 1.6) * 0.02
    T.anz = -0.1 - Math.sin(t * 1.6) * 0.02
    T.lpf = 0
    T.lnf = 0
    T.by = Math.sin(t * 1.8) * 0.012
    T.leanX = 0
    T.leanZ = 0
    T.hz = Math.sin(t * 0.8 + blinkSeed) * 0.05
    T.hx = Math.sin(t * 0.6) * 0.03
    T.yaw = 0

    switch (actor.pose) {
      case 'walk': {
        phase.current += dt * (7.5 + spd * 3)
        const s = Math.sin(phase.current)
        T.apf = -s * 0.95 * spd
        T.anf = s * 0.95 * spd
        T.lpf = s * 0.85 * spd
        T.lnf = -s * 0.85 * spd
        T.apz = 0.08
        T.anz = -0.08
        T.by = Math.abs(Math.sin(phase.current)) * 0.06 * spd
        T.leanX = 0.09 * spd
        T.hz = Math.sin(phase.current * 0.5) * 0.04
        break
      }
      case 'sit':
        T.lpf = 1.45
        T.lnf = 1.45
        T.apf = 0.55
        T.anf = 0.55
        T.apz = 0.16
        T.anz = -0.16
        T.by = 0
        T.hz = Math.sin(t * 0.9 + blinkSeed) * 0.07
        T.hx = Math.sin(t * 0.7) * 0.04
        break
      case 'wave': {
        const w = Math.sin(t * 9)
        T.apz = 2.55 + w * 0.32
        T.apf = 0
        T.hz = 0.1
        T.by = Math.abs(Math.sin(t * 2)) * 0.015
        break
      }
      case 'dance': {
        const s = Math.sin(t * 7)
        T.by = Math.abs(s) * 0.17
        T.apz = 1.9 + s * 0.55
        T.anz = -(1.9 - s * 0.55)
        T.lpf = s * 0.5
        T.lnf = -s * 0.5
        T.hz = Math.sin(t * 3.5) * 0.2
        T.yaw = Math.sin(t * 3.5) * 0.35
        T.leanZ = Math.sin(t * 3.5) * 0.08
        break
      }
      case 'cheer': {
        const s = Math.sin(t * 9)
        T.by = Math.abs(s) * 0.22
        T.apz = 2.7 + s * 0.15
        T.anz = -(2.7 - s * 0.15)
        T.hz = Math.sin(t * 4.5) * 0.12
        break
      }
      case 'hug': {
        // friendly side hug: the arm on the partner's side goes around, heads lean together, little bounce
        const side = actor.hugSide >= 0 ? 1 : -1
        const around = 1.45
        const bounce = Math.abs(Math.sin(t * 3.2)) * 0.05
        if (side > 0) {
          T.apz = around
          T.apf = 0.2
          T.anz = -0.15
        } else {
          T.anz = -around
          T.anf = 0.2
          T.apz = 0.15
        }
        T.hz = -side * 0.26
        T.leanZ = -side * 0.07
        T.by = bounce
        break
      }
      default:
        break
    }

    const k = 1 - Math.exp(-14 * dt)
    C.apf += (T.apf - C.apf) * k
    C.apz += (T.apz - C.apz) * k
    C.anf += (T.anf - C.anf) * k
    C.anz += (T.anz - C.anz) * k
    C.lpf += (T.lpf - C.lpf) * k
    C.lnf += (T.lnf - C.lnf) * k
    C.by += (T.by - C.by) * k
    C.leanX += (T.leanX - C.leanX) * k
    C.leanZ += (T.leanZ - C.leanZ) * k
    C.hz += (T.hz - C.hz) * k
    C.hx += (T.hx - C.hx) * k
    C.yaw += (T.yaw - C.yaw) * k

    // forward-positive swing angles -> rotation.x is negative for "forward" (limbs hang along -y)
    if (armP.current) {
      armP.current.rotation.x = -C.apf
      armP.current.rotation.z = C.apz
    }
    if (armN.current) {
      armN.current.rotation.x = -C.anf
      armN.current.rotation.z = C.anz
    }
    if (legP.current) legP.current.rotation.x = -C.lpf
    if (legN.current) legN.current.rotation.x = -C.lnf
    if (body.current) {
      body.current.position.y = C.by
      body.current.rotation.x = C.leanX
      body.current.rotation.z = C.leanZ
    }
    if (head.current) {
      head.current.rotation.z = C.hz
      head.current.rotation.x = C.hx
    }
    if (eyes.current) {
      const closed = (t + blinkSeed) % 3.8 < 0.12
      eyes.current.scale.y += ((closed ? 0.1 : 1) - eyes.current.scale.y) * Math.min(1, dt * 40)
    }
    r.position.set(actor.x, actor.y, actor.z)
    // keep the labels a comfortable size whether the camera is far away or right next to us
    const cp = state.camera.position
    const d = Math.hypot(cp.x - actor.x, cp.y - 1.8, cp.z - actor.z)
    const sc = Math.round(clamp(10 / Math.max(d, 0.5), 0.85, 1.2) * 100) / 100
    if (sc !== lastScale.current) {
      lastScale.current = sc
      if (tagWrap.current) tagWrap.current.style.transform = 'scale(' + sc + ')'
      if (bubbleWrap.current) bubbleWrap.current.style.transform = 'scale(' + sc + ')'
    }
    yawWob.current += (C.yaw - yawWob.current) * Math.min(1, dt * 10)
    r.rotation.y = actor.yaw + yawWob.current
  })

  const faceZ = 0.385
  return (
    <group ref={root} position={[actor.x, actor.y, actor.z]} scale={0.88}>
      <BlobShadow w={1.5} d={1.5} opacity={0.6} />
      <group ref={body}>
        {/* torso + clothes */}
        <mesh geometry={geo.torso} material={mats.main} position={[0, 0.86, 0]} />
        <mesh geometry={geo.waist} material={mats.bottom} position={[0, 0.56, 0]} />
        {girl ? (
          <mesh geometry={geo.ball} material={mats.top} position={[0, 0.98, 0.17]} scale={[0.17, 0.2, 0.1]} />
        ) : (
          <>
            <mesh geometry={geo.ball} material={mats.top} position={[0, 1.15, 0.12]} scale={[0.15, 0.1, 0.12]} />
            <mesh geometry={geo.ball} material={mats.top} position={[0, 0.9, 0.2]} scale={[0.08, 0.28, 0.07]} />
          </>
        )}

        {/* head */}
        <group ref={head} position={[0, 1.62, 0]}>
          <mesh geometry={geo.head} material={mats.skin} />
          {/* ears */}
          <mesh geometry={geo.ball} material={mats.skin} position={[0.42, -0.02, 0]} scale={0.07} />
          <mesh geometry={geo.ball} material={mats.skin} position={[-0.42, -0.02, 0]} scale={0.07} />
          {/* hair */}
          <mesh geometry={geo.hairCap} material={mats.hair} position={[0, 0.01, -0.03]} rotation={[-0.55, 0, 0]} />
          {girl ? (
            <>
              <mesh geometry={geo.ball} material={mats.hair} position={[0, -0.5, -0.27]} scale={[0.34, 0.78, 0.2]} />
              <mesh geometry={geo.ball} material={mats.hair} position={[0.4, -0.16, -0.02]} scale={[0.09, 0.4, 0.17]} />
              <mesh geometry={geo.ball} material={mats.hair} position={[-0.4, -0.16, -0.02]} scale={[0.09, 0.4, 0.17]} />
              <mesh geometry={geo.ball} material={mats.hair} position={[0, 0.28, 0.33]} scale={[0.34, 0.08, 0.1]} rotation={[0.35, 0, 0]} />
            </>
          ) : (
            <>
              <mesh geometry={geo.ball} material={mats.hair} position={[0.1, 0.3, 0.33]} scale={[0.26, 0.08, 0.1]} rotation={[0.3, 0, -0.18]} />
              <mesh geometry={geo.ball} material={mats.hair} position={[-0.14, 0.31, 0.32]} scale={[0.16, 0.07, 0.09]} rotation={[0.3, 0, 0.25]} />
            </>
          )}
          {/* face */}
          <group ref={eyes}>
            {[-1, 1].map((s) => (
              <group key={s} position={[s * 0.16, 0.02, 0.37]}>
                <mesh geometry={geo.ball} material={mats.dark} scale={[0.07, 0.095, 0.05]} />
                <mesh geometry={geo.ball} material={mats.white} position={[0.02, 0.03, 0.04]} scale={0.02} />
              </group>
            ))}
          </group>
          {[-1, 1].map((s) => (
            <mesh
              key={'b' + s}
              geometry={geo.brow}
              material={mats.hair}
              position={[s * 0.16, 0.14, faceZ - 0.01]}
              rotation={[0, 0, Math.PI / 2 + s * 0.12]}
            />
          ))}
          {[-1, 1].map((s) => (
            <mesh
              key={'c' + s}
              geometry={geo.ball}
              material={mats.blush}
              position={[s * 0.265, -0.085, 0.3]}
              rotation={[0, s * 0.8, 0]}
              scale={[0.075, 0.048, 0.02]}
            />
          ))}
          <mesh geometry={geo.smile} material={mats.dark} position={[0, -0.075, 0.397]} rotation={[0, 0, Math.PI]} />
        </group>

        {/* arms: +x side and -x side */}
        <group ref={armP} position={[0.31, 1.12, 0]}>
          <mesh geometry={geo.limb} material={mats.sleeve} position={[0, -0.2, 0]} />
          <mesh geometry={geo.ball} material={mats.skin} position={[0, -0.41, 0]} scale={0.085} />
        </group>
        <group ref={armN} position={[-0.31, 1.12, 0]}>
          <mesh geometry={geo.limb} material={mats.sleeve} position={[0, -0.2, 0]} />
          <mesh geometry={geo.ball} material={mats.skin} position={[0, -0.41, 0]} scale={0.085} />
        </group>

        {/* legs */}
        <group ref={legP} position={[0.13, 0.52, 0]}>
          <mesh geometry={geo.leg} material={mats.bottom} position={[0, -0.25, 0]} />
          <mesh geometry={geo.ball} material={mats.shoes} position={[0, -0.5, 0.05]} scale={[0.125, 0.08, 0.18]} />
        </group>
        <group ref={legN} position={[-0.13, 0.52, 0]}>
          <mesh geometry={geo.leg} material={mats.bottom} position={[0, -0.25, 0]} />
          <mesh geometry={geo.ball} material={mats.shoes} position={[0, -0.5, 0.05]} scale={[0.125, 0.08, 0.18]} />
        </group>
      </group>

      {/* name tag + chat bubble (the only two Html elements per avatar) */}
      <Html position={[0, 2.38, 0]} center zIndexRange={[20, 0]} pointerEvents="none" style={{ pointerEvents: 'none' }}>
        <div ref={tagWrap} style={{ transformOrigin: '50% 50%' }}>
          <div className="nametag">
            <i className={who} />
            {name}
          </div>
        </div>
      </Html>
      {bubble && (
        <Html position={[0, 2.95, 0]} center zIndexRange={[21, 0]} pointerEvents="none" style={{ pointerEvents: 'none' }}>
          <div ref={bubbleWrap} style={{ transformOrigin: '50% 100%', transform: 'scale(' + lastScale.current + ')' }}>
            <div key={bubble.id} className="bubble">
              {bubble.text}
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
