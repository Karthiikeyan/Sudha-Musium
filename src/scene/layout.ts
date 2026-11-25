// Pure layout maths for the hall: where frames, benches, the screen and the cake go.
// Coordinates: y up, hall long axis along z, the player starts in the south (+z) and walks north (-z).
// A yaw angle means "facing (sin yaw, cos yaw)".
import { boxAround, type Box, type P2 } from '../lib/math'

export type InteractKind = 'photo' | 'bench' | 'screen' | 'cake'

export interface Interactable {
  id: string
  kind: InteractKind
  index: number
  /** distance to this point decides when the action button shows up */
  stand: P2
  /** where the avatar walks when you tap the object */
  walkTo: P2
  radius: number
}

export interface FramePlacement {
  index: number
  wall: 'left' | 'right' | 'feature'
  x: number
  y: number
  z: number
  /** rotation.y so the frame faces into the room */
  yaw: number
  normal: P2
  tangent: P2
  stand: P2
  guideStand: P2
  standYaw: number
  maxW: number
  maxH: number
}

export interface BenchPlacement {
  id: number
  x: number
  z: number
  yaw: number
  forward: P2
  lateral: P2
  /** [Sudha, Karthik] */
  slots: [P2, P2]
  ends: [P2, P2]
  approach: [P2, P2]
  box: Box
  /** +1: camera in front of the bench, -1: camera behind it (looking where they look) */
  camSide: 1 | -1
}

export interface Layout {
  halfW: number
  zN: number
  zS: number
  ceiling: number
  frames: FramePlacement[]
  benches: BenchPlacement[]
  feature: { x: number; z: number; w: number; h: number; d: number }
  plinth: { x: number; z: number; w: number; d: number; h: number }
  screen: { x: number; z: number; w: number; h: number; y: number; stand: P2 }
  platform: { x: number; z: number; w: number; d: number; h: number }
  cake: { x: number; z: number; stand: P2 }
  start: P2
  bounds: Box
  staticBoxes: Box[]
  cakeBox: Box
  interactables: Interactable[]
  perSide: number
}

export function fitFrame(aspect: number, maxW: number, maxH: number): { w: number; h: number } {
  const a = aspect > 0 ? aspect : 1
  let w = maxW
  let h = w / a
  if (h > maxH) {
    h = maxH
    w = h * a
  }
  return { w, h }
}

function makeBench(id: number, x: number, z: number, yaw: number, camSide: 1 | -1): BenchPlacement {
  const f: P2 = { x: Math.sin(yaw), z: Math.cos(yaw) }
  const l: P2 = { x: Math.cos(yaw), z: -Math.sin(yaw) }
  const slot = (s: number): P2 => ({ x: x + l.x * 0.55 * s, z: z + l.z * 0.55 * s })
  const end = (s: number): P2 => ({ x: x + l.x * 2.1 * s, z: z + l.z * 2.1 * s })
  const s0 = slot(1)
  const s1 = slot(-1)
  const hx = Math.abs(l.x) * 1.5 + Math.abs(f.x) * 0.55
  const hz = Math.abs(l.z) * 1.5 + Math.abs(f.z) * 0.55
  return {
    id,
    x,
    z,
    yaw,
    forward: f,
    lateral: l,
    slots: [s0, s1],
    ends: [end(1), end(-1)],
    approach: [
      { x: s0.x - f.x * 1.2, z: s0.z - f.z * 1.2 },
      { x: s1.x - f.x * 1.2, z: s1.z - f.z * 1.2 },
    ],
    box: boxAround(x, z, hx, hz),
    camSide,
  }
}

export function buildLayout(photoCount: number): Layout {
  const n = Math.max(1, photoCount)
  const halfW = 11
  const zS = 18
  const ceiling = 6.5
  const featureCount = Math.min(2, n)
  const rest = n - featureCount
  const leftCount = Math.ceil(rest / 2)
  const rightCount = Math.floor(rest / 2)
  const perSide = Math.max(leftCount, rightCount)
  const spacing = 3.0
  const firstZ = 11
  const lastZ = firstZ - spacing * Math.max(perSide - 1, 0)
  const zN = Math.min(lastZ - 15.5, -22)

  const feature = { x: 0, z: 6.5, w: 8, h: 4, d: 0.4 }
  const plinth = { x: 0, z: 10.2, w: 1.2, d: 1.2, h: 0.9 }

  const frames: FramePlacement[] = []
  const mkFrame = (index: number, wall: FramePlacement['wall'], x: number, y: number, z: number): FramePlacement => {
    let normal: P2
    let tangent: P2
    if (wall === 'left') {
      normal = { x: 1, z: 0 }
      tangent = { x: 0, z: 1 }
    } else if (wall === 'right') {
      normal = { x: -1, z: 0 }
      tangent = { x: 0, z: 1 }
    } else {
      normal = { x: 0, z: 1 }
      tangent = { x: 1, z: 0 }
    }
    const standDist = wall === 'feature' ? 2.2 : 2.2
    const stand = {
      x: x + normal.x * standDist + tangent.x * 1.9,
      z: z + normal.z * standDist + tangent.z * 1.9,
    }
    const guideStand = {
      x: x + normal.x * standDist - tangent.x * 1.9,
      z: z + normal.z * standDist - tangent.z * 1.9,
    }
    return {
      index,
      wall,
      x,
      y,
      z,
      yaw: Math.atan2(normal.x, normal.z),
      normal,
      tangent,
      stand,
      guideStand,
      standYaw: Math.atan2(-normal.x, -normal.z),
      maxW: wall === 'feature' ? 2.6 : 2.3,
      maxH: wall === 'feature' ? 2.4 : 2.0 + (index % 3) * 0.2,
    }
  }

  // photos 0..featureCount-1 go on the dark feature wall (south face), the rest alternate left / right
  const fz = feature.z + feature.d / 2 + 0.03
  if (featureCount >= 1) frames.push(mkFrame(0, 'feature', featureCount === 1 ? 0 : -1.9, 2.3, fz))
  if (featureCount >= 2) frames.push(mkFrame(1, 'feature', 1.9, 2.3, fz))
  let li = 0
  let ri = 0
  for (let i = featureCount; i < n; i++) {
    const side: 'left' | 'right' = (i - featureCount) % 2 === 0 ? 'left' : 'right'
    const row = side === 'left' ? li++ : ri++
    const z = firstZ - spacing * row
    const y = 2.6 + ((i % 3) - 1) * 0.12
    frames.push(mkFrame(i, side, side === 'left' ? -halfW + 0.05 : halfW - 0.05, y, z))
  }

  const midZ = (firstZ + lastZ) / 2
  const benches = [
    makeBench(0, -7.2, midZ, Math.PI / 2, 1),
    makeBench(1, 3.2, zN + 9.5, Math.PI, -1),
  ]

  const screen = { x: 0, z: zN, w: 7, h: 3.94, y: 3.1, stand: { x: 0, z: zN + 5.2 } }
  const platform = { x: 0, z: zN + 0.8, w: 8.6, d: 1.6, h: 0.3 }
  const cakeX = -5.5
  const cakeZ = zN + 6.5
  const cake = { x: cakeX, z: cakeZ, stand: { x: cakeX, z: cakeZ + 2.6 } }

  const staticBoxes: Box[] = [
    boxAround(feature.x, feature.z, feature.w / 2 + 0.1, feature.d / 2 + 0.1),
    boxAround(plinth.x, plinth.z, plinth.w / 2 + 0.05, plinth.d / 2 + 0.05),
    boxAround(platform.x, platform.z, platform.w / 2, platform.d / 2),
    ...benches.map((b) => b.box),
  ]
  const cakeBox = boxAround(cakeX, cakeZ, 0.95, 0.95)

  const interactables: Interactable[] = []
  frames.forEach((f) => {
    interactables.push({ id: 'photo-' + f.index, kind: 'photo', index: f.index, stand: f.stand, walkTo: f.stand, radius: 2.3 })
  })
  benches.forEach((b) => {
    interactables.push({
      id: 'bench-' + b.id,
      kind: 'bench',
      index: b.id,
      stand: { x: b.x, z: b.z },
      walkTo: { x: b.x + b.forward.x * 1.7, z: b.z + b.forward.z * 1.7 },
      radius: 2.6,
    })
  })
  interactables.push({ id: 'screen', kind: 'screen', index: 0, stand: screen.stand, walkTo: screen.stand, radius: 3.2 })
  interactables.push({ id: 'cake', kind: 'cake', index: 0, stand: cake.stand, walkTo: cake.stand, radius: 2.4 })

  return {
    halfW,
    zN,
    zS,
    ceiling,
    frames,
    benches,
    feature,
    plinth,
    screen,
    platform,
    cake,
    start: { x: 3, z: 12.5 },
    bounds: { minX: -halfW, maxX: halfW, minZ: zN, maxZ: zS },
    staticBoxes,
    cakeBox,
    interactables,
    perSide,
  }
}
