import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { content } from '../config/content'
import { followScript } from '../lib/actors'
import { clamp, damp, dampAngle, pick, resolveCircle } from '../lib/math'
import { world } from '../lib/world'
import { useStore } from '../state/store'
import { Avatar } from './Avatar'
import type { Layout } from './layout'

const RADIUS = 0.45
const GUIDE_SPEED = 4.7
const OFFSET_X = -1.55
const OFFSET_X_PORTRAIT = -1.0
const OFFSET_Z = 1.35

/** Karthik: follows Sudha at a polite distance, faces where he walks, chats now and then. */
export function Guide({ layout }: { layout: Layout }) {
  const boxes = useMemo(() => layout.staticBoxes, [layout])
  const boxesWithCake = useMemo(() => [...layout.staticBoxes, layout.cakeBox], [layout])
  const size = useThree((s) => s.size)
  const sizeRef = useRef(size)
  sizeRef.current = size
  const moving = useRef(false)
  const vel = useRef({ x: 0, z: 0 })
  const chatter = useRef(30)
  const lastLine = useRef('')

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const g = world.guide
    const p = world.player
    const script = world.scripts.guide
    if (script) {
      followScript(g, script, dt)
      vel.current.x = 0
      vel.current.z = 0
      moving.current = false
      return
    }
    const st = useStore.getState()
    if (st.phase !== 'explore') {
      g.speed = damp(g.speed, 0, 12, dt)
      g.pose = 'idle'
      g.y = damp(g.y, 0, 10, dt)
      return
    }

    // follow: stay at the back-left of Sudha
    const portrait = sizeRef.current.width / Math.max(1, sizeRef.current.height) < 0.8
    const tx = p.x + (portrait ? OFFSET_X_PORTRAIT : OFFSET_X)
    const tz = p.z + OFFSET_Z
    const dx = tx - g.x
    const dz = tz - g.z
    const d = Math.hypot(dx, dz)
    if (d > 15) {
      g.x = tx
      g.z = tz
    }
    if (!moving.current && d > 1.0) moving.current = true
    else if (moving.current && d < 0.35) moving.current = false

    let wx = 0
    let wz = 0
    if (moving.current && d > 1e-4) {
      const s = clamp((d - 0.3) * 3.2, 0.8, GUIDE_SPEED)
      wx = (dx / d) * s
      wz = (dz / d) * s
    }
    const v = vel.current
    const k = 1 - Math.exp(-9 * dt)
    v.x += (wx - v.x) * k
    v.z += (wz - v.z) * k
    g.x += v.x * dt
    g.z += v.z * dt
    resolveCircle(g, RADIUS, world.cakeSolid ? boxesWithCake : boxes, layout.bounds)

    const sp = Math.hypot(v.x, v.z)
    g.speed = clamp(sp / GUIDE_SPEED, 0, 1)
    g.pose = g.speed > 0.07 ? 'walk' : 'idle'
    if (sp > 0.5) g.yaw = dampAngle(g.yaw, Math.atan2(v.x, v.z), 12, dt)
    else g.yaw = dampAngle(g.yaw, Math.atan2(p.x - g.x, p.z - g.z), 5, dt)
    g.y = damp(g.y, 0, 10, dt)

    // little chat every ~25-40 s of walking around (never during overlays: this block only runs while exploring)
    if (p.speed > 0.1) chatter.current -= dt
    if (chatter.current <= 0) {
      chatter.current = 25 + Math.random() * 15
      if (!st.bubbles.karthik && !st.pending) {
        let line = pick(content.guideChatter)
        if (line === lastLine.current) line = pick(content.guideChatter)
        lastLine.current = line
        st.say('karthik', line)
      }
    }
  })

  return <Avatar variant="boy" who="karthik" name={content.senderName} actor={world.guide} />
}
