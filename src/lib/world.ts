// Mutable, per-frame world state shared by the scene components (kept outside React/zustand on purpose,
// so nothing allocates or re-renders while walking around).
import type { Layout } from '../scene/layout'
import type { P2 } from './math'

export type Pose = 'idle' | 'walk' | 'sit' | 'wave' | 'dance' | 'hug' | 'cheer'

export interface Script {
  id: number
  waypoints: P2[]
  x: number
  z: number
  yaw: number
  y: number
  pose: Pose
  hugSide?: number
  teleport?: boolean
  speed?: number
}

export interface Actor {
  x: number
  z: number
  y: number
  yaw: number
  /** 0..1 walk intensity */
  speed: number
  pose: Pose
  /** which local side the hug partner is on (+1 / -1) */
  hugSide: number
  scriptId: number
  wp: number
  arrived: boolean
}

const makeActor = (x: number, z: number, yaw: number): Actor => ({
  x,
  z,
  y: 0,
  yaw,
  speed: 0,
  pose: 'idle',
  hugSide: 1,
  scriptId: -1,
  wp: 0,
  arrived: true,
})

export const world = {
  player: makeActor(3, 12.5, Math.PI),
  guide: makeActor(1.4, 10.9, Math.PI / 4),
  input: { x: 0, z: 0 },
  keys: { up: false, down: false, left: false, right: false },
  walkTarget: null as P2 | null,
  walkTargetAge: 0,
  scripts: { player: null as Script | null, guide: null as Script | null },
  layout: null as Layout | null,
  cakeSolid: false,
  /** seconds since the player last moved (for guide chatter) */
  time: 0,
}

let scriptCounter = 1
export const nextScriptId = () => scriptCounter++

export function resetActors(layout: Layout) {
  const p = world.player
  p.x = layout.start.x
  p.z = layout.start.z
  p.y = 0
  p.yaw = Math.PI
  p.pose = 'idle'
  p.speed = 0
  p.scriptId = -1
  p.arrived = true
  const g = world.guide
  g.x = layout.start.x - 1.6
  g.z = layout.start.z - 1.6
  g.y = 0
  g.yaw = Math.PI / 4
  g.pose = 'idle'
  g.speed = 0
  g.scriptId = -1
  g.arrived = true
  world.scripts.player = null
  world.scripts.guide = null
  world.walkTarget = null
}
