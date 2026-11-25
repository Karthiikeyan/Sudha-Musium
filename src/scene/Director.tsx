import { useEffect, useRef } from 'react'
import { content } from '../config/content'
import { pick } from '../lib/math'
import { nextScriptId, world, type Script } from '../lib/world'
import { useStore, type Phase } from '../state/store'

const mk = (s: Partial<Script> & { x: number; z: number }): Script => ({
  id: nextScriptId(),
  waypoints: [],
  yaw: 0,
  y: 0,
  pose: 'idle',
  ...s,
})

/**
 * Invisible conductor: whenever the phase or room changes it gives the two avatars their "scripts"
 * (where to stand, what pose to strike) and schedules the guide's lines. All timers are cleaned up.
 */
export function Director() {
  const phase = useStore((s) => s.phase)
  const roomId = useStore((s) => s.roomId)
  const viewIndex = useStore((s) => s.viewIndex)
  const benchIndex = useStore((s) => s.benchIndex)
  const restartKey = useStore((s) => s.restartKey)
  const prev = useRef<Phase>('loading')
  const announced = useRef<Set<string>>(new Set())

  useEffect(() => {
    const st = useStore.getState()
    const room = st.room()
    const L = world.layout
    const timers: number[] = []
    const intervals: number[] = []
    const later = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms))
    }
    const before = prev.current
    prev.current = phase
    if (!room || !L) return
    const P = world.player
    const say = (t: string) => useStore.getState().say('karthik', t)

    switch (phase) {
      case 'loading':
      case 'start':
      case 'intro': {
        const s = L.spawn
        const gx = s.x - 1.6
        const gz = s.z - 1.6
        const teleport = phase !== 'intro'
        world.scripts.guide = mk({ x: gx, z: gz, yaw: Math.atan2(s.x - gx, s.z - gz), pose: 'wave', teleport })
        world.scripts.player = mk({ x: s.x, z: s.z, yaw: Math.atan2(gx - s.x, gz - s.z), pose: 'idle', teleport })
        if (phase === 'intro') {
          later(600, () => say(content.introBubbles[0]))
          later(1800, () => content.introBubbles.slice(1).forEach(say))
          later(5600, () => useStore.getState().finishIntro())
        }
        break
      }
      case 'explore': {
        if (before === 'sitting' && L.benches.length) {
          const b = L.benches[st.benchIndex] ?? L.benches[0]
          world.scripts.player = mk({ x: b.approach[0].x, z: b.approach[0].z, yaw: b.yaw })
          world.scripts.guide = mk({ x: b.approach[1].x, z: b.approach[1].z, yaw: b.yaw })
          later(1000, () => {
            world.scripts.player = null
            world.scripts.guide = null
          })
        } else if (before === 'cinema' && room.kind === 'cinema') {
          const sp = L.spots
          world.scripts.player = mk({ waypoints: [sp.gapP, sp.aisleP], x: sp.backP.x, z: sp.backP.z, yaw: Math.PI, speed: 3.6 })
          world.scripts.guide = mk({ waypoints: [sp.gapG, sp.aisleG], x: sp.backG.x, z: sp.backG.z, yaw: Math.PI, speed: 3.6 })
          later(3200, () => {
            world.scripts.player = null
            world.scripts.guide = null
          })
        } else {
          world.scripts.player = null
          world.scripts.guide = null
        }
        break
      }
      case 'viewing': {
        const f = L.frames[viewIndex] ?? L.frames[0]
        if (!f) break
        const far = Math.hypot(P.x - f.stand.x, P.z - f.stand.z) > 5
        world.scripts.player = mk({ x: f.stand.x, z: f.stand.z, yaw: f.standYaw, teleport: far })
        world.scripts.guide = mk({ x: f.guideStand.x, z: f.guideStand.z, yaw: f.standYaw, teleport: far })
        const key = room.id + ':' + f.name
        if (!announced.current.has(key)) {
          announced.current.add(key)
          const line = st.photoInfo(f.name).guideLine
          if (line) later(600, () => say(line))
        }
        break
      }
      case 'sitting': {
        const b = L.benches[benchIndex] ?? L.benches[0]
        if (!b) break
        world.scripts.player = mk({ waypoints: [b.ends[0], b.approach[0]], x: b.slots[0].x, z: b.slots[0].z, yaw: b.yaw, y: 0.08, pose: 'sit', speed: 3.6 })
        world.scripts.guide = mk({ waypoints: [b.ends[1], b.approach[1]], x: b.slots[1].x, z: b.slots[1].z, yaw: b.yaw, y: 0.08, pose: 'sit', speed: 3.6 })
        later(3000, () => say(pick(content.benchLines)))
        later(5200, () => useStore.getState().say('sudha', pick(content.sudhaLines)))
        break
      }
      case 'screen': {
        const s = L.spots.screen
        const g = L.spots.screenG
        if (s) world.scripts.player = mk({ x: s.x, z: s.z, yaw: Math.PI })
        if (g) world.scripts.guide = mk({ x: g.x, z: g.z, yaw: Math.PI })
        break
      }
      case 'cinema': {
        const sp = L.spots
        if (!sp.seatP) break
        world.scripts.player = mk({ waypoints: [sp.backP, sp.aisleP, sp.gapP], x: sp.seatP.x, z: sp.seatP.z, yaw: Math.PI, y: 0.08, pose: 'sit', speed: 3.8 })
        world.scripts.guide = mk({ waypoints: [sp.backG, sp.aisleG, sp.gapG], x: sp.seatG.x, z: sp.seatG.z, yaw: Math.PI, y: 0.08, pose: 'sit', speed: 3.8 })
        const id = window.setInterval(() => {
          const s2 = useStore.getState()
          if (s2.phase !== 'cinema') return
          if (world.player.arrived && world.guide.arrived && s2.cinemaStage === 'seating') {
            s2.setCinemaStage(s2.progress.cinemaDone ? 'ready' : 'ready')
            window.clearInterval(id)
          }
        }, 200)
        intervals.push(id)
        break
      }
      case 'cake': {
        const sp = L.spots
        if (sp.cakeP) world.scripts.player = mk({ x: sp.cakeP.x, z: sp.cakeP.z, yaw: Math.PI })
        if (sp.cakeG) world.scripts.guide = mk({ x: sp.cakeG.x, z: sp.cakeG.z, yaw: Math.PI })
        break
      }
      case 'celebration': {
        const c = L.spots.cake ?? { x: 0, z: 0 }
        const z = c.z + 3.2
        const portrait = window.innerWidth / Math.max(1, window.innerHeight) < 0.8
        world.scripts.player = mk({ x: c.x - (portrait ? 1.1 : 0.9), z, yaw: 0, pose: 'dance' })
        world.scripts.guide = mk({ x: c.x + (portrait ? 1.2 : 2.4), z, yaw: 0, pose: 'dance' })
        later(4000, () => {
          world.scripts.player = mk({ x: c.x - 0.45, z, yaw: 0, pose: 'hug', hugSide: 1 })
          world.scripts.guide = mk({ x: c.x + 0.45, z, yaw: 0, pose: 'hug', hugSide: -1 })
          say(content.finale.hugLine)
        })
        later(9000, () => useStore.getState().showFinale())
        break
      }
      case 'finale': {
        const c = L.spots.cake ?? { x: 0, z: 0 }
        const z = c.z + 3.2
        world.scripts.player = mk({ x: c.x - 0.45, z, yaw: 0, pose: 'idle' })
        world.scripts.guide = mk({ x: c.x + 0.45, z, yaw: 0, pose: 'wave' })
        break
      }
      default:
        // overlays (ticket, arcade, notes, letter, wish tree): avatars simply wait where they are
        break
    }
    return () => {
      timers.forEach((t) => window.clearTimeout(t))
      intervals.forEach((t) => window.clearInterval(t))
    }
  }, [phase, roomId, viewIndex, benchIndex, restartKey])

  return null
}
