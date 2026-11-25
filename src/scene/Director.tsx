import { useEffect, useRef } from 'react'
import { content } from '../config/content'
import { pick } from '../lib/math'
import { nextScriptId, world, type Script } from '../lib/world'
import { useStore, type Phase } from '../state/store'
import type { Layout } from './layout'

const mk = (s: Partial<Script> & { x: number; z: number }): Script => ({
  id: nextScriptId(),
  waypoints: [],
  yaw: 0,
  y: 0,
  pose: 'idle',
  ...s,
})

/**
 * Invisible conductor: whenever the phase changes it gives the two avatars their "scripts"
 * (where to stand, what pose to strike) and schedules the guide's lines. All timers are cleaned up.
 */
export function Director({ layout }: { layout: Layout }) {
  const phase = useStore((s) => s.phase)
  const viewIndex = useStore((s) => s.viewIndex)
  const benchIndex = useStore((s) => s.benchIndex)
  const restartKey = useStore((s) => s.restartKey)
  const prev = useRef<Phase>('loading')
  const announced = useRef<Set<number>>(new Set())
  const lastRestart = useRef(restartKey)

  useEffect(() => {
    if (lastRestart.current !== restartKey) {
      lastRestart.current = restartKey
      announced.current.clear()
    }
    const st = useStore.getState()
    const timers: number[] = []
    const later = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms))
    }
    const P = world.player
    const G = world.guide
    const before = prev.current
    prev.current = phase
    const L = layout

    switch (phase) {
      case 'loading':
      case 'start':
      case 'intro': {
        const gx = L.start.x - 1.6
        const gz = L.start.z - 1.6
        const teleport = phase !== 'intro'
        world.scripts.guide = mk({ x: gx, z: gz, yaw: Math.atan2(L.start.x - gx, L.start.z - gz), pose: 'wave', teleport })
        world.scripts.player = mk({ x: L.start.x, z: L.start.z, yaw: Math.atan2(gx - L.start.x, gz - L.start.z), pose: 'idle', teleport })
        if (phase === 'intro') {
          st.clearBubbles()
          later(600, () => st.say('karthik', content.introBubbles[0]))
          later(1800, () => content.introBubbles.slice(1).forEach((t) => st.say('karthik', t)))
          later(5600, () => useStore.getState().finishIntro())
        }
        break
      }
      case 'explore': {
        if (before === 'sitting') {
          const b = L.benches[st.benchIndex] ?? L.benches[0]
          world.scripts.player = mk({ x: b.approach[0].x, z: b.approach[0].z, yaw: b.yaw, pose: 'idle' })
          world.scripts.guide = mk({ x: b.approach[1].x, z: b.approach[1].z, yaw: b.yaw, pose: 'idle' })
          later(1000, () => {
            if (useStore.getState().phase === 'explore') {
              world.scripts.player = null
              world.scripts.guide = null
            }
          })
        } else {
          world.scripts.player = null
          world.scripts.guide = null
        }
        break
      }
      case 'viewing': {
        const f = L.frames[viewIndex] ?? L.frames[0]
        const far = Math.hypot(P.x - f.stand.x, P.z - f.stand.z) > 6
        world.scripts.player = mk({ x: f.stand.x, z: f.stand.z, yaw: f.standYaw, pose: 'idle', teleport: far })
        world.scripts.guide = mk({ x: f.guideStand.x, z: f.guideStand.z, yaw: f.standYaw, pose: 'idle', teleport: far })
        if (!announced.current.has(viewIndex)) {
          announced.current.add(viewIndex)
          const line = st.photos[viewIndex]?.guideLine
          if (line) later(600, () => useStore.getState().say('karthik', line))
        }
        break
      }
      case 'sitting': {
        const b = L.benches[benchIndex] ?? L.benches[0]
        world.scripts.player = mk({
          waypoints: [b.ends[0], b.approach[0]],
          x: b.slots[0].x,
          z: b.slots[0].z,
          yaw: b.yaw,
          y: 0.08,
          pose: 'sit',
          speed: 3.6,
        })
        world.scripts.guide = mk({
          waypoints: [b.ends[1], b.approach[1]],
          x: b.slots[1].x,
          z: b.slots[1].z,
          yaw: b.yaw,
          y: 0.08,
          pose: 'sit',
          speed: 3.6,
        })
        later(3200, () => useStore.getState().say('karthik', pick(content.benchLines)))
        later(5200, () => useStore.getState().say('sudha', pick(content.sudhaLines)))
        break
      }
      case 'screen': {
        const s = L.screen.stand
        world.scripts.player = mk({ x: s.x, z: s.z, yaw: Math.PI, pose: 'idle' })
        world.scripts.guide = mk({ x: s.x + 2.3, z: s.z + 0.4, yaw: Math.PI, pose: 'idle' })
        break
      }
      case 'cake': {
        const c = L.cake
        world.scripts.player = mk({ x: c.x - 1.3, z: c.z + 2.4, yaw: Math.PI, pose: 'idle' })
        world.scripts.guide = mk({ x: c.x + 1.3, z: c.z + 2.4, yaw: Math.PI, pose: 'idle' })
        break
      }
      case 'celebration': {
        const c = L.cake
        const z = c.z + 3.2
        // narrow (portrait) screens see less sideways, so they dance a little closer together
        const portrait = window.innerWidth / Math.max(1, window.innerHeight) < 0.8
        world.scripts.player = mk({ x: c.x - (portrait ? 1.1 : 0.9), z, yaw: 0, pose: 'dance' })
        world.scripts.guide = mk({ x: c.x + (portrait ? 1.2 : 2.4), z, yaw: 0, pose: 'dance' })
        later(4000, () => {
          world.scripts.player = mk({ x: c.x - 0.45, z, yaw: 0, pose: 'hug', hugSide: 1 })
          world.scripts.guide = mk({ x: c.x + 0.45, z, yaw: 0, pose: 'hug', hugSide: -1 })
          useStore.getState().say('karthik', content.finale.hugLine)
        })
        later(9500, () => {
          world.scripts.player = mk({ x: c.x - 0.45, z, yaw: 0, pose: 'idle' })
          world.scripts.guide = mk({ x: c.x + 0.45, z, yaw: 0, pose: 'wave' })
        })
        break
      }
      case 'letter':
      default:
        break
    }
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [phase, viewIndex, benchIndex, restartKey, layout])

  return null
}
