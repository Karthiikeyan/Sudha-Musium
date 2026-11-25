import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { clamp, damp, smoothstep } from '../lib/math'
import { world } from '../lib/world'
import { useStore } from '../state/store'
import { fitFrame, type Layout } from './layout'

const INTRO_SECONDS = 4.6

/** Third-person follow camera (fixed yaw, looking north) plus cinematic modes for photos, benches, screen and cake. */
export function CameraRig({ layout }: { layout: Layout }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const pos = useRef(new THREE.Vector3())
  const look = useRef(new THREE.Vector3())
  const tp = useMemo(() => new THREE.Vector3(), [])
  const tl = useMemo(() => new THREE.Vector3(), [])
  const init = useRef(false)
  const introT = useRef(0)
  const lastPhase = useRef('')

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const st = useStore.getState()
    const p = world.player
    const aspect = size.width / Math.max(1, size.height)
    const portrait = aspect < 0.8
    const fov = portrait ? 54 : 45
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
    if (camera.aspect !== aspect) {
      camera.aspect = aspect
      camera.updateProjectionMatrix()
    }
    const phase = st.phase
    if (phase !== lastPhase.current) {
      if (phase === 'intro') introT.current = 0
      lastPhase.current = phase
    }
    const { halfW, zS, zN } = layout
    let lam = 5
    let direct = false

    const followPose = (outP: THREE.Vector3, outL: THREE.Vector3) => {
      const back = portrait ? 9.2 : 8
      const up = portrait ? 5.8 : 5
      outP.set(clamp(p.x, -halfW + 1, halfW - 1), up, Math.min(p.z + back, zS - 0.8))
      outL.set(p.x, 1.0, p.z - 2.5)
    }

    switch (phase) {
      case 'loading':
      case 'start': {
        followPose(tp, tl)
        tp.x += Math.sin(state.clock.elapsedTime * 0.25) * 1.2
        lam = 2
        break
      }
      case 'intro': {
        introT.current += dt
        const k = smoothstep(introT.current / INTRO_SECONDS)
        followPose(tp, tl)
        const sx = p.x
        const sy = layout.ceiling + 3.5
        const sz = p.z + 3
        tp.set(sx + (tp.x - sx) * k, sy + (tp.y - sy) * k, sz + (tp.z - sz) * k)
        const lx = p.x
        const ly = 0.2
        const lz = p.z - 9
        tl.set(lx + (tl.x - lx) * k, ly + (tl.y - ly) * k, lz + (tl.z - lz) * k)
        direct = true
        break
      }
      case 'viewing': {
        const f = layout.frames[st.viewIndex] ?? layout.frames[0]
        const meta = st.photos[st.viewIndex]
        const { w, h } = fitFrame(meta?.aspect ?? 1, f.maxW, f.maxH)
        const ow = w + 0.3
        const oh = h + 0.3
        const tanV = Math.tan((fov * Math.PI) / 360)
        const distV = (oh * 1.08) / 0.62 / (2 * tanV)
        const distH = (ow * 1.12) / (2 * tanV * aspect)
        const dist = clamp(Math.max(distV, distH, 3.4), 3.4, 9)
        const visH = 2 * dist * tanV
        const ly = f.y - visH * (portrait ? 0.2 : 0.14)
        // level camera (no pitch) so the frame stays perfectly rectangular
        tp.set(f.x + f.normal.x * dist, ly, f.z + f.normal.z * dist)
        tl.set(f.x, ly, f.z)
        lam = 6
        break
      }
      case 'sitting': {
        const b = layout.benches[st.benchIndex] ?? layout.benches[0]
        const s = b.camSide
        if (s > 0) {
          tp.set(b.x + b.forward.x * 5.4, 2.7, b.z + b.forward.z * 5.4)
          tl.set(b.x, 1.2, b.z)
        } else {
          tp.set(b.x - b.forward.x * 6.6, 3.5, b.z - b.forward.z * 6.6)
          tl.set(b.x + b.forward.x * 4, 2.5, b.z + b.forward.z * 4)
        }
        lam = 4
        break
      }
      case 'screen': {
        tp.set(0, 3.3, layout.screen.z + 9.2)
        tl.set(0, 2.9, layout.screen.z)
        lam = 4
        break
      }
      case 'cake': {
        // look a bit above the cake so it sits low on screen, clear of the prompt card at the top
        tp.set(layout.cake.x, 2.7, layout.cake.z + (portrait ? 6.2 : 4.8))
        tl.set(layout.cake.x, portrait ? 2.5 : 2.0, layout.cake.z)
        lam = 4
        break
      }
      case 'celebration':
      case 'letter': {
        tp.set(layout.cake.x + 0.3, 3.1, layout.cake.z + (portrait ? 11.5 : 9.5))
        tl.set(layout.cake.x + 0.3, 1.5, layout.cake.z + 3)
        lam = 3
        break
      }
      default:
        followPose(tp, tl)
        lam = 5
    }
    // never leave the hall
    tp.x = clamp(tp.x, -halfW + 0.6, halfW - 0.6)
    tp.z = clamp(tp.z, zN + 0.6, zS - 0.6)

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
