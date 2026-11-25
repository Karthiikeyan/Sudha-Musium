import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { content } from '../config/content'
import { doorStatus } from '../journey/progress'
import { followScript, WALK_SPEED } from '../lib/actors'
import { clamp, damp, dampAngle, resolveCircle } from '../lib/math'
import { world } from '../lib/world'
import { useStore } from '../state/store'
import { Avatar } from './Avatar'
import type { Interactable } from './layout'

const RADIUS = 0.45
const STAR_REACH = 1.25
const DWELL_SECONDS = 1.5

/** Sudha: keyboard / joystick / tap-to-walk movement with circle-vs-box collision that slides along walls. */
export function Player() {
  const vel = useRef({ x: 0, z: 0 })
  const stuck = useRef(0)
  const last = useRef({ x: 0, z: 0 })
  const dwell = useRef({ index: -1, t: 0 })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const a = world.player
    const layout = world.layout
    const script = world.scripts.player
    if (script) {
      followScript(a, script, dt)
      vel.current.x = 0
      vel.current.z = 0
      return
    }
    const st = useStore.getState()
    if (!layout || st.phase !== 'explore' || st.transition || st.doorOpening) {
      a.speed = damp(a.speed, 0, 12, dt)
      a.pose = 'idle'
      a.y = damp(a.y, 0, 10, dt)
      vel.current.x = 0
      vel.current.z = 0
      return
    }

    const k = world.keys
    let ix = (k.right ? 1 : 0) - (k.left ? 1 : 0) + world.input.x
    let iz = (k.down ? 1 : 0) - (k.up ? 1 : 0) + world.input.z
    const mag = Math.hypot(ix, iz)
    let dx = 0
    let dz = 0
    if (mag > 0.08) {
      if (world.walkTarget || st.pending) {
        world.walkTarget = null
        st.cancelPending()
      }
      if (mag > 1) {
        ix /= mag
        iz /= mag
      }
      dx = ix * WALK_SPEED
      dz = iz * WALK_SPEED
      stuck.current = 0
    } else if (world.walkTarget) {
      const tx = world.walkTarget.x - a.x
      const tz = world.walkTarget.z - a.z
      const d = Math.hypot(tx, tz)
      world.walkTargetAge += dt
      if (d < 0.22) {
        st.arrivedAtTarget()
        world.walkTarget = null
      } else {
        const s = WALK_SPEED * (d < 1 ? Math.max(0.45, d) : 1)
        dx = (tx / d) * s
        dz = (tz / d) * s
        // blocked (e.g. tapped behind furniture)? give up after a moment instead of getting trapped
        const moved = Math.hypot(a.x - last.current.x, a.z - last.current.z)
        stuck.current = moved < WALK_SPEED * dt * 0.25 ? stuck.current + dt : 0
        if (stuck.current > 0.7 || world.walkTargetAge > 9) {
          stuck.current = 0
          world.walkTarget = null
          if (st.pending) {
            const p = layout.interactables.find((i) => i.id === st.pending?.id)
            if (p && Math.hypot(p.stand.x - a.x, p.stand.z - a.z) < p.radius + 1.2) st.arrivedAtTarget()
            else st.cancelPending()
          }
        }
      }
    }
    last.current.x = a.x
    last.current.z = a.z

    const v = vel.current
    const kk = 1 - Math.exp(-11 * dt)
    v.x += (dx - v.x) * kk
    v.z += (dz - v.z) * kk
    a.x += v.x * dt
    a.z += v.z * dt
    resolveCircle(a, RADIUS, layout.boxes, layout.bounds)

    const sp = Math.hypot(v.x, v.z)
    const s01 = clamp(sp / WALK_SPEED, 0, 1)
    a.speed = s01
    a.pose = s01 > 0.07 ? 'walk' : 'idle'
    if (sp > 0.6) a.yaw = dampAngle(a.yaw, Math.atan2(v.x, v.z), 14, dt)
    a.y = damp(a.y, 0, 10, dt)

    const room = st.room()
    if (!room) return

    // hidden star: just walk close to it
    const star = layout.star
    if (star && !st.progress.stars.includes(room.id) && Math.hypot(star.x - a.x, star.z - a.z) < STAR_REACH) {
      st.collectStar(room.id)
    }

    // unlocked door: walking into it opens it
    const door = layout.door
    if (door && Math.hypot(door.stand.x - a.x, door.stand.z - a.z) < 0.75 && dz < 0) {
      if (doorStatus(room, st.rooms, st.progress).open) {
        st.openDoor()
        return
      }
    }

    // standing in front of a lit photo for a moment counts as "seen"
    if (room.kind === 'hall') {
      let found = -1
      for (let i = 0; i < layout.frames.length; i++) {
        const f = layout.frames[i]
        if (Math.hypot(f.stand.x - a.x, f.stand.z - a.z) < 1.4) {
          found = i
          break
        }
      }
      const D = dwell.current
      if (found !== D.index) {
        D.index = found
        D.t = 0
      } else if (found >= 0 && s01 < 0.3) {
        D.t += dt
        if (D.t > DWELL_SECONDS) {
          const name = layout.frames[found].name
          if (!st.progress.seenPhotos.includes(name)) st.markSeen(name)
          D.t = -999
        }
      }
    }

    // which interactable is she standing near?
    let best: Interactable | null = null
    let bestD = Infinity
    if (!st.pending) {
      const L = layout.interactables
      for (let i = 0; i < L.length; i++) {
        const it = L[i]
        if (it.kind === 'cake' && st.candlesOut) continue
        const d = Math.hypot(it.stand.x - a.x, it.stand.z - a.z)
        if (d < it.radius && d < bestD) {
          bestD = d
          best = it
        }
      }
    }
    st.setNearby(best)
  })

  return <Avatar variant="girl" who="sudha" name={content.recipientName} actor={world.player} />
}
