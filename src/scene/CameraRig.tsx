import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getPhoto, photoAspect } from '../lib/photoCache'
import { clamp, damp, smoothstep } from '../lib/math'
import { world } from '../lib/world'
import { useStore } from '../state/store'
import { CINEMA_ROWS, fitFrame } from './layout'

const INTRO_SECONDS = 4.6

/**
 * "Dollhouse" third-person camera: fixed yaw looking north from above the (unrendered) south wall,
 * per-room presets, plus cinematic modes for photos, benches, the screen, the cinema and the cake.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const pos = useRef(new THREE.Vector3())
  const look = useRef(new THREE.Vector3())
  const tp = useMemo(() => new THREE.Vector3(), [])
  const tl = useMemo(() => new THREE.Vector3(), [])
  const init = useRef(false)
  const introT = useRef(0)
  const lastPhase = useRef('')
  const lastRoom = useRef('')

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const st = useStore.getState()
    const room = st.room()
    const layout = world.layout
    if (!room || !layout) return
    const p = world.player
    const aspect = size.width / Math.max(1, size.height)
    const portrait = aspect < 0.8
    const preset = room.camera
    const fov = portrait ? preset.fov + 9 : preset.fov
    if (Math.abs(camera.fov - fov) > 0.01 || camera.aspect !== aspect) {
      camera.fov = fov
      camera.aspect = aspect
      camera.updateProjectionMatrix()
    }
    const phase = st.phase
    if (phase !== lastPhase.current) {
      if (phase === 'intro') introT.current = 0
      lastPhase.current = phase
    }
    if (room.id !== lastRoom.current) {
      lastRoom.current = room.id
      init.current = false
    }
    const { w, d } = layout
    let lam = preset.damping
    let direct = false

    const followPose = (outP: THREE.Vector3, outL: THREE.Vector3) => {
      const back = preset.back * (portrait ? 1.18 : 1)
      const up = preset.height * (portrait ? 1.12 : 1)
      outP.set(clamp(p.x, -w / 2 + 1.2, w / 2 - 1.2), up, p.z + back)
      outL.set(p.x, 1.0, p.z - preset.lookAhead)
    }

    switch (phase) {
      case 'loading':
      case 'start': {
        followPose(tp, tl)
        tp.x += Math.sin(state.clock.elapsedTime * 0.25) * 1.0
        lam = 2
        break
      }
      case 'intro': {
        introT.current += dt
        const k = smoothstep(introT.current / INTRO_SECONDS)
        followPose(tp, tl)
        const sx = p.x
        const sy = 12
        const sz = p.z + 2
        tp.set(sx + (tp.x - sx) * k, sy + (tp.y - sy) * k, sz + (tp.z - sz) * k)
        const lz = p.z - 6
        tl.set(p.x + (tl.x - p.x) * k, 0.2 + (tl.y - 0.2) * k, lz + (tl.z - lz) * k)
        direct = true
        break
      }
      case 'viewing': {
        const f = layout.frames[st.viewIndex] ?? layout.frames[0]
        if (!f) {
          followPose(tp, tl)
          break
        }
        const asp = getPhoto(f.name)?.aspect ?? photoAspect(f.name) ?? 0.8
        const { w: fw, h: fh } = fitFrame(asp, f.maxW, f.maxH)
        const ow = fw + 0.3
        const oh = fh + 0.3
        const tanV = Math.tan((fov * Math.PI) / 360)
        const distV = (oh * 1.08) / 0.62 / (2 * tanV)
        const distH = (ow * 1.12) / (2 * tanV * aspect)
        const dist = clamp(Math.max(distV, distH, 3.2), 3.2, 7.5)
        const visH = 2 * dist * tanV
        const ly = f.y - visH * (portrait ? 0.2 : 0.14)
        // level camera (no pitch) so the frame stays rectangular
        tp.set(f.x + f.normal.x * dist, ly, f.z + f.normal.z * dist)
        tl.set(f.x, ly, f.z)
        lam = 6
        break
      }
      case 'sitting': {
        const b = layout.benches[st.benchIndex] ?? layout.benches[0]
        if (!b) {
          followPose(tp, tl)
          break
        }
        if (b.camSide > 0) {
          tp.set(b.x + b.forward.x * 5.4, 2.7, b.z + b.forward.z * 5.4)
          tl.set(b.x, 1.2, b.z)
        } else {
          tp.set(b.x - b.forward.x * 6.2, 3.4, b.z - b.forward.z * 6.2)
          tl.set(b.x + b.forward.x * 4, 2.0, b.z + b.forward.z * 4)
        }
        lam = 4
        break
      }
      case 'screen': {
        const s = layout.spots.screen
        tp.set(s?.x ?? 0, 3.0, -d / 2 + 8.2)
        tl.set(s?.x ?? 0, 2.4, -d / 2)
        lam = 4
        break
      }
      case 'cinema': {
        const z = CINEMA_ROWS[1]
        tp.set(0, portrait ? 4.2 : 3.7, z + (portrait ? 6.8 : 5.4))
        tl.set(0, 2.5, -d / 2)
        lam = 3.5
        break
      }
      case 'cake': {
        const c = layout.spots.cake ?? { x: 0, z: 0 }
        tp.set(c.x, 2.7, c.z + (portrait ? 6.2 : 4.8))
        tl.set(c.x, portrait ? 2.5 : 2.0, c.z)
        lam = 4
        break
      }
      case 'celebration':
      case 'finale': {
        const c = layout.spots.cake ?? { x: 0, z: 0 }
        tp.set(c.x + 0.3, 3.2, c.z + (portrait ? 11.5 : 9.5))
        tl.set(c.x + 0.3, 1.7, c.z + 3)
        lam = 3
        break
      }
      default:
        followPose(tp, tl)
    }
    tp.x = clamp(tp.x, -w / 2 - 2, w / 2 + 2)
    tp.z = clamp(tp.z, -d / 2 + 0.6, d / 2 + 12)

    if (!init.current || direct) {
      pos.current.copy(tp)
      look.current.copy(tl)
      init.current = true
    } else {
      const P = pos.current
      const Lk = look.current
      P.x = damp(P.x, tp.x, lam, dt)
      P.y = damp(P.y, tp.y, lam, dt)
      P.z = damp(P.z, tp.z, lam, dt)
      Lk.x = damp(Lk.x, tl.x, lam, dt)
      Lk.y = damp(Lk.y, tl.y, lam, dt)
      Lk.z = damp(Lk.z, tl.z, lam, dt)
    }
    camera.position.copy(pos.current)
    camera.lookAt(look.current)
  })
  return null
}
