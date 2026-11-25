export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Frame-rate independent smoothing (like THREE.MathUtils.damp). */
export const damp = (a: number, b: number, lambda: number, dt: number) => lerp(a, b, 1 - Math.exp(-lambda * dt))
export const smoothstep = (t: number) => {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}
export const wrapAngle = (a: number) => {
  let x = a
  while (x > Math.PI) x -= Math.PI * 2
  while (x < -Math.PI) x += Math.PI * 2
  return x
}
export const dampAngle = (a: number, b: number, lambda: number, dt: number) =>
  a + wrapAngle(b - a) * (1 - Math.exp(-lambda * dt))

export interface Box {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export const boxAround = (x: number, z: number, hx: number, hz: number): Box => ({
  minX: x - hx,
  maxX: x + hx,
  minZ: z - hz,
  maxZ: z + hz,
})

export interface P2 {
  x: number
  z: number
}

/** Pushes a circle (position `p`, radius `r`) out of boxes and keeps it inside `bounds`. Mutates `p`. */
export function resolveCircle(p: P2, r: number, boxes: readonly Box[], bounds: Box): void {
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i]
      const cx = clamp(p.x, b.minX, b.maxX)
      const cz = clamp(p.z, b.minZ, b.maxZ)
      let dx = p.x - cx
      let dz = p.z - cz
      const d2 = dx * dx + dz * dz
      if (d2 >= r * r) continue
      if (d2 > 1e-8) {
        const d = Math.sqrt(d2)
        dx /= d
        dz /= d
        p.x = cx + dx * r
        p.z = cz + dz * r
      } else {
        // centre is inside the box: push out through the nearest face
        const l = p.x - b.minX
        const rr = b.maxX - p.x
        const t = p.z - b.minZ
        const bt = b.maxZ - p.z
        const m = Math.min(l, rr, t, bt)
        if (m === l) p.x = b.minX - r
        else if (m === rr) p.x = b.maxX + r
        else if (m === t) p.z = b.minZ - r
        else p.z = b.maxZ + r
      }
    }
    p.x = clamp(p.x, bounds.minX + r, bounds.maxX - r)
    p.z = clamp(p.z, bounds.minZ + r, bounds.maxZ - r)
  }
}

/** Seeded pseudo random generator so decorations are stable between renders. */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const pick = <T,>(arr: readonly T[], rnd: () => number = Math.random): T => arr[Math.floor(rnd() * arr.length)]
