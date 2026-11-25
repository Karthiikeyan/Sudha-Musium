// Pure layout maths for every room: walls, colliders, interactive spots, frames, benches, star and door.
// Coordinates: y up, each room is centred on the origin, north = -z (the far wall, where the door is),
// the camera looks from the south (+z). A yaw angle means "facing (sin yaw, cos yaw)".
import { boxAround, type Box, type P2 } from '../lib/math'

export type InteractKind =
  | 'photo'
  | 'bench'
  | 'screen'
  | 'cake'
  | 'door'
  | 'ticket'
  | 'seats'
  | 'arcade'
  | 'envelope'
  | 'letter'
  | 'wishtree'

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

export interface Spot extends P2 {
  yaw: number
}

export interface FramePlacement {
  index: number
  name: string
  wall: 'left' | 'right'
  x: number
  y: number
  z: number
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
  len: number
  forward: P2
  lateral: P2
  /** [Sudha, Karthik] */
  slots: [P2, P2]
  ends: [P2, P2]
  approach: [P2, P2]
  box: Box
  /** +1: camera in front of the bench, -1: camera behind it */
  camSide: 1 | -1
}

export interface RoomLayout {
  w: number
  d: number
  wallH: number
  bounds: Box
  boxes: Box[]
  spawn: Spot
  guideSpawn: Spot
  door: { x: number; z: number; stand: P2 } | null
  star: { x: number; y: number; z: number } | null
  frames: FramePlacement[]
  benches: BenchPlacement[]
  spots: Record<string, Spot>
  interactables: Interactable[]
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

export function makeBench(id: number, x: number, z: number, yaw: number, camSide: 1 | -1, len = 2.7): BenchPlacement {
  const f: P2 = { x: Math.sin(yaw), z: Math.cos(yaw) }
  const l: P2 = { x: Math.cos(yaw), z: -Math.sin(yaw) }
  const slotOff = len >= 2.5 ? 0.55 : 0.45
  const slot = (s: number): P2 => ({ x: x + l.x * slotOff * s, z: z + l.z * slotOff * s })
  const end = (s: number): P2 => ({ x: x + l.x * (len / 2 + 0.75) * s, z: z + l.z * (len / 2 + 0.75) * s })
  const s0 = slot(1)
  const s1 = slot(-1)
  const half = len / 2 + 0.15
  const hx = Math.abs(l.x) * half + Math.abs(f.x) * 0.5
  const hz = Math.abs(l.z) * half + Math.abs(f.z) * 0.5
  return {
    id,
    x,
    z,
    yaw,
    len,
    forward: f,
    lateral: l,
    slots: [s0, s1],
    ends: [end(1), end(-1)],
    approach: [
      { x: s0.x - f.x * 1.15, z: s0.z - f.z * 1.15 },
      { x: s1.x - f.x * 1.15, z: s1.z - f.z * 1.15 },
    ],
    box: boxAround(x, z, hx, hz),
    camSide,
  }
}

const benchInteractable = (b: BenchPlacement): Interactable => ({
  id: 'bench-' + b.id,
  kind: 'bench',
  index: b.id,
  stand: { x: b.x, z: b.z },
  walkTo: { x: b.x - b.forward.x * 1.5, z: b.z - b.forward.z * 1.5 },
  radius: 2.2,
})

function shell(w: number, d: number, wallH = 4.2) {
  return {
    w,
    d,
    wallH,
    bounds: { minX: -w / 2, maxX: w / 2, minZ: -d / 2, maxZ: d / 2 },
    spawn: { x: 0, z: d / 2 - 1.6, yaw: Math.PI } as Spot,
    guideSpawn: { x: -1.5, z: d / 2 - 0.8, yaw: Math.PI } as Spot,
  }
}

function makeDoor(x: number, d: number) {
  return { x, z: -d / 2, stand: { x, z: -d / 2 + 1.05 } }
}

const doorInteractable = (door: { stand: P2 }): Interactable => ({
  id: 'door',
  kind: 'door',
  index: 0,
  stand: door.stand,
  walkTo: door.stand,
  radius: 1.7,
})

/* ───────────────────────────────── lobby ───────────────────────────────── */
export function lobbyLayout(): RoomLayout {
  const s = shell(12, 10)
  const door = makeDoor(0, s.d)
  const ticket: Interactable = { id: 'ticket', kind: 'ticket', index: 0, stand: { x: -3, z: 0.05 }, walkTo: { x: -3, z: 0.1 }, radius: 1.9 }
  return {
    ...s,
    spawn: { x: 0, z: 3.3, yaw: Math.PI },
    guideSpawn: { x: -1.5, z: 3.9, yaw: Math.PI },
    boxes: [
      boxAround(-3, -1, 1.55, 0.5), // ticket desk
      boxAround(3, -1.2, 0.6, 0.6), // gift plinth
      boxAround(-3.0, -3.0, 1.6, 0.1), // rope barriers (leave a lane to the door)
      boxAround(3.0, -3.0, 1.6, 0.1),
      boxAround(5.0, 3.4, 0.45, 0.45), // plants
      boxAround(-5.0, 3.4, 0.45, 0.45),
    ],
    door,
    star: { x: 5.15, y: 0.42, z: 2.45 },
    frames: [],
    benches: [],
    spots: {
      desk: { x: -3, z: 0.05, yaw: Math.PI },
      deskGuide: { x: -1.5, z: 0.4, yaw: -Math.PI * 0.75 },
    },
    interactables: [ticket, doorInteractable(door)],
  }
}

/* ───────────────────────────── memory lane hall ───────────────────────────── */
export function hallLayout(photos: string[], hallNo: number): RoomLayout {
  const n = Math.max(1, photos.length)
  const perSide = Math.ceil(n / 2)
  const d = Math.max(16, Math.min(22, 6 + perSide * 3.4 + 3.5))
  const s = shell(8, d)
  const half = s.w / 2
  const frames: FramePlacement[] = photos.map((name, i) => {
    const wall: 'left' | 'right' = i % 2 === 0 ? 'left' : 'right'
    const row = Math.floor(i / 2)
    const z = d / 2 - 5.2 - row * 3.4 - (wall === 'right' ? 1.7 : 0)
    const x = wall === 'left' ? -half + 0.05 : half - 0.05
    const normal = { x: wall === 'left' ? 1 : -1, z: 0 }
    const tangent = { x: 0, z: 1 }
    return {
      index: i,
      name,
      wall,
      x,
      y: 2.15,
      z,
      yaw: Math.atan2(normal.x, normal.z),
      normal,
      tangent,
      stand: { x: x + normal.x * 2.0, z: z + 1.6 },
      guideStand: { x: x + normal.x * 2.0, z: z - 1.6 },
      standYaw: Math.atan2(-normal.x, -normal.z),
      maxW: 1.9,
      maxH: 1.9 + (i % 2) * 0.2,
    }
  })
  const firstZ = frames.length ? frames[0].z : 0
  const lastZ = frames.length ? frames[frames.length - 1].z : 0
  const benchZ = Math.round(((firstZ + lastZ) / 2) * 10) / 10
  const bench = makeBench(0, 0, benchZ, Math.PI, -1, 2.0)
  const door = makeDoor(0, d)
  const stars = [
    { x: 0, y: 0.26, z: benchZ }, // under the bench
    { x: 3.3, y: 0.42, z: -d / 2 + 0.7 }, // by the far door
    { x: -3.4, y: 0.42, z: d / 2 - 0.6 }, // right behind the entrance
  ]
  const interactables: Interactable[] = frames.map((f) => ({
    id: 'photo-' + f.index,
    kind: 'photo',
    index: f.index,
    stand: f.stand,
    walkTo: f.stand,
    radius: 1.9,
  }))
  interactables.push(benchInteractable(bench), doorInteractable(door))
  return {
    ...s,
    spawn: { x: 0, z: d / 2 - 1.4, yaw: Math.PI },
    guideSpawn: { x: -1.3, z: d / 2 - 0.6, yaw: Math.PI },
    boxes: [bench.box],
    door,
    star: stars[(hallNo - 1) % stars.length],
    frames,
    benches: [bench],
    spots: {},
    interactables,
  }
}

/* ───────────────────────────────── cinema ───────────────────────────────── */
export const CINEMA_ROWS = [-1.2, 0.9, 3.0]
export function cinemaLayout(): RoomLayout {
  const s = shell(14, 12)
  const door = makeDoor(5.9, s.d)
  const gap = (CINEMA_ROWS[1] + CINEMA_ROWS[2]) / 2
  return {
    ...s,
    spawn: { x: 0, z: 4.6, yaw: Math.PI },
    guideSpawn: { x: -1.4, z: 5.2, yaw: Math.PI },
    boxes: [
      ...CINEMA_ROWS.map((z) => boxAround(0, z, 4.6, 0.42)),
      boxAround(0, -5.5, 4.3, 0.5), // little stage under the screen
      boxAround(-6.1, 4.8, 0.5, 0.4), // popcorn stand
    ],
    door,
    star: { x: -3.6, y: 0.22, z: CINEMA_ROWS[2] + 0.25 },
    frames: [],
    benches: [],
    spots: {
      seatP: { x: -0.55, z: CINEMA_ROWS[1], yaw: Math.PI },
      seatG: { x: 0.55, z: CINEMA_ROWS[1], yaw: Math.PI },
      gapP: { x: -0.55, z: gap, yaw: Math.PI },
      gapG: { x: 0.55, z: gap, yaw: Math.PI },
      aisleP: { x: -5.6, z: gap, yaw: Math.PI },
      aisleG: { x: 5.6, z: gap, yaw: Math.PI },
      backP: { x: -5.6, z: 4.4, yaw: Math.PI },
      backG: { x: 5.6, z: 4.4, yaw: Math.PI },
    },
    interactables: [
      { id: 'seats', kind: 'seats', index: 0, stand: { x: 0, z: 4.4 }, walkTo: { x: 0, z: 4.4 }, radius: 2.4 },
      doorInteractable(door),
    ],
  }
}

/* ───────────────────────────────── lounge ───────────────────────────────── */
export function loungeLayout(): RoomLayout {
  const s = shell(12, 10)
  const door = makeDoor(-4.4, s.d)
  return {
    ...s,
    spawn: { x: 0, z: 3.4, yaw: Math.PI },
    guideSpawn: { x: -1.4, z: 4.0, yaw: Math.PI },
    boxes: [
      boxAround(0.6, -4.6, 2.6, 0.35), // tv console
      boxAround(0.6, 1.4, 1.75, 0.5), // sofa
      boxAround(-2.9, -0.6, 0.55, 0.55), // beanbags
      boxAround(3.9, -0.3, 0.55, 0.55),
      boxAround(-5.3, -1.8, 0.4, 0.4), // plant (star in its pot)
      boxAround(5.2, 4.0, 0.4, 0.4), // plant
      boxAround(5.15, -3.6, 0.5, 0.5), // arcade cabinet
    ],
    door,
    star: { x: -5.3, y: 0.66, z: -1.8 },
    frames: [],
    benches: [],
    spots: {
      screen: { x: 0.6, z: -1.6, yaw: Math.PI },
      screenG: { x: 2.4, z: -1.3, yaw: Math.PI },
      arcade: { x: 4.0, z: -3.6, yaw: Math.PI / 2 },
    },
    interactables: [
      { id: 'screen', kind: 'screen', index: 0, stand: { x: 0.6, z: -1.6 }, walkTo: { x: 0.6, z: -1.6 }, radius: 2.4 },
      { id: 'arcade', kind: 'arcade', index: 0, stand: { x: 4.0, z: -3.6 }, walkTo: { x: 4.0, z: -3.5 }, radius: 1.6 },
      doorInteractable(door),
    ],
  }
}

/* ─────────────────────────────── post office ─────────────────────────────── */
export const ENVELOPE_X = [-1.65, -0.55, 0.55, 1.65]
export function postOfficeLayout(): RoomLayout {
  const s = shell(10, 9)
  const door = makeDoor(3.2, s.d)
  const deskZ = -1.4
  const standZ = -0.25
  const env: Interactable[] = ENVELOPE_X.map((x, i) =>
    i < 3
      ? { id: 'env-' + i, kind: 'envelope', index: i, stand: { x, z: standZ }, walkTo: { x, z: standZ + 0.05 }, radius: 0.8 }
      : { id: 'letter', kind: 'letter', index: 0, stand: { x, z: standZ }, walkTo: { x, z: standZ + 0.05 }, radius: 0.85 },
  )
  return {
    ...s,
    spawn: { x: 0, z: 3.0, yaw: Math.PI },
    guideSpawn: { x: -1.4, z: 3.6, yaw: Math.PI },
    boxes: [
      boxAround(0, deskZ, 2.25, 0.5), // desk
      boxAround(-3.0, 2.7, 0.65, 0.42), // mail trolley
      boxAround(4.3, 0.5, 0.55, 1.0), // stamp counter
    ],
    door,
    star: { x: -4.8, y: 1.3, z: 1.6 },
    frames: [],
    benches: [],
    spots: {
      desk: { x: 0, z: standZ, yaw: Math.PI },
      deskGuide: { x: -2.6, z: 0.2, yaw: Math.PI * 0.8 },
    },
    interactables: [...env, doorInteractable(door)],
  }
}

/* ───────────────────────────────── rooftop ───────────────────────────────── */
export function rooftopLayout(): RoomLayout {
  const s = shell(16, 14, 1.0)
  const cake = { x: 0, z: -1.6 }
  const bench = makeBench(0, -5.2, 1.2, Math.PI, -1, 2.7)
  return {
    ...s,
    spawn: { x: -3.6, z: 4.6, yaw: Math.PI },
    guideSpawn: { x: -2.4, z: 5.4, yaw: Math.PI },
    boxes: [
      boxAround(cake.x, cake.z, 0.95, 0.95), // round table with the cake
      boxAround(5.2, -3.0, 0.7, 0.7), // wish tree
      boxAround(-6.4, 5.9, 1.1, 0.9), // stair kiosk (the door she came through)
      bench.box,
    ],
    door: null,
    star: null,
    frames: [],
    benches: [bench],
    spots: {
      cake: { x: cake.x, z: cake.z, yaw: 0 },
      cakeP: { x: cake.x - 1.3, z: cake.z + 2.4, yaw: Math.PI },
      cakeG: { x: cake.x + 1.3, z: cake.z + 2.4, yaw: Math.PI },
      tree: { x: 5.2, z: -3.0, yaw: 0 },
      kiosk: { x: -6.4, z: 5.9, yaw: 0 },
    },
    interactables: [
      { id: 'cake', kind: 'cake', index: 0, stand: { x: cake.x, z: cake.z + 2.5 }, walkTo: { x: cake.x, z: cake.z + 2.5 }, radius: 2.2 },
      { id: 'tree', kind: 'wishtree', index: 0, stand: { x: 5.2, z: -1.5 }, walkTo: { x: 5.2, z: -1.4 }, radius: 1.9 },
      benchInteractable(bench),
    ],
  }
}
