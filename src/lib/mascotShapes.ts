// An original cartoon cat mascot (nothing borrowed from any existing character), described once as SVG path data
// in a 200x200 box. The DOM overlay renders it as <svg>, the 3D wall screen draws the same paths with Path2D.

export interface Shape {
  d: string
  fill?: string
  stroke?: string
  lw?: number
  opacity?: number
}

const FUR = '#ffd7b0'
const BELLY = '#fff0dd'
const INK = '#5a3a2e'
const PINK = '#ffa9bd'

const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0 Z`

export const MASCOT_BACK: Shape[] = [
  { d: 'M 140 162 C 176 162 190 130 170 110 C 164 105 158 112 163 121 C 172 138 160 150 138 148 Z', fill: FUR, stroke: INK, lw: 4 },
  { d: 'M 62 150 C 56 118 144 118 138 150 C 142 188 58 188 62 150 Z', fill: FUR, stroke: INK, lw: 4 },
  { d: 'M 82 150 C 80 134 120 134 118 150 C 120 172 80 172 82 150 Z', fill: BELLY },
  { d: ellipse(70, 184, 14, 8), fill: FUR, stroke: INK, lw: 4 },
  { d: ellipse(130, 184, 14, 8), fill: FUR, stroke: INK, lw: 4 },
]

export const MASCOT_ARMS_DOWN: Shape[] = [
  { d: 'M 66 138 C 52 146 50 160 59 168', stroke: INK, lw: 13 },
  { d: 'M 66 138 C 52 146 50 160 59 168', stroke: FUR, lw: 8 },
  { d: 'M 134 138 C 148 146 150 160 141 168', stroke: INK, lw: 13 },
  { d: 'M 134 138 C 148 146 150 160 141 168', stroke: FUR, lw: 8 },
]

export const MASCOT_ARMS_UP: Shape[] = [
  { d: 'M 66 136 C 46 128 40 108 48 92', stroke: INK, lw: 13 },
  { d: 'M 66 136 C 46 128 40 108 48 92', stroke: FUR, lw: 8 },
  { d: 'M 134 136 C 154 128 160 108 152 92', stroke: INK, lw: 13 },
  { d: 'M 134 136 C 154 128 160 108 152 92', stroke: FUR, lw: 8 },
]

export const MASCOT_HEAD: Shape[] = [
  { d: 'M 52 66 L 46 20 L 94 48 Z', fill: FUR, stroke: INK, lw: 4 },
  { d: 'M 148 66 L 154 20 L 106 48 Z', fill: FUR, stroke: INK, lw: 4 },
  { d: 'M 57 55 L 54 33 L 78 47 Z', fill: PINK },
  { d: 'M 143 55 L 146 33 L 122 47 Z', fill: PINK },
  { d: 'M 46 92 C 42 44 158 44 154 92 C 152 130 48 130 46 92 Z', fill: FUR, stroke: INK, lw: 4 },
  // party hat
  { d: 'M 82 54 L 100 8 L 118 54 Z', fill: '#d9ccf2', stroke: INK, lw: 3.5 },
  { d: 'M 90 36 L 110 36', stroke: '#f7c6d4', lw: 5 },
  { d: 'M 86 46 L 114 46', stroke: '#fbe7a6', lw: 5 },
  { d: ellipse(100, 8, 7, 7), fill: '#fbe7a6', stroke: INK, lw: 3 },
]

export const MASCOT_EYES_OPEN: Shape[] = [
  { d: ellipse(78, 92, 6, 9), fill: INK },
  { d: ellipse(122, 92, 6, 9), fill: INK },
  { d: ellipse(80, 88, 2.4, 2.4), fill: '#fff' },
  { d: ellipse(124, 88, 2.4, 2.4), fill: '#fff' },
]

export const MASCOT_EYES_HAPPY: Shape[] = [
  { d: 'M 70 94 Q 78 82 86 94', stroke: INK, lw: 4.5 },
  { d: 'M 114 94 Q 122 82 130 94', stroke: INK, lw: 4.5 },
]

export const MASCOT_FACE: Shape[] = [
  { d: ellipse(63, 106, 9, 5.5), fill: PINK, opacity: 0.75 },
  { d: ellipse(137, 106, 9, 5.5), fill: PINK, opacity: 0.75 },
  { d: 'M 96 102 L 104 102 L 100 108 Z', fill: PINK, stroke: INK, lw: 2 },
  { d: 'M 100 108 Q 95 117 88 110 M 100 108 Q 105 117 112 110', stroke: INK, lw: 3 },
  { d: 'M 56 102 L 34 97 M 56 109 L 34 111 M 144 102 L 166 97 M 144 109 L 166 111', stroke: INK, lw: 2.5 },
]

export type MascotMood = 'idle' | 'happy'

/** Draws the mascot into a 2D canvas context. (x, y) is the top-left corner, `size` the width/height in px. */
export function drawMascot(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, mood: MascotMood) {
  const groups: Shape[][] = [
    MASCOT_BACK,
    mood === 'happy' ? MASCOT_ARMS_UP : MASCOT_ARMS_DOWN,
    MASCOT_HEAD,
    mood === 'happy' ? MASCOT_EYES_HAPPY : MASCOT_EYES_OPEN,
    MASCOT_FACE,
  ]
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(size / 200, size / 200)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const g of groups) {
    for (const s of g) {
      const p = new Path2D(s.d)
      ctx.globalAlpha = s.opacity ?? 1
      if (s.fill) {
        ctx.fillStyle = s.fill
        ctx.fill(p)
      }
      if (s.stroke) {
        ctx.strokeStyle = s.stroke
        ctx.lineWidth = s.lw ?? 3
        ctx.stroke(p)
      }
    }
  }
  ctx.globalAlpha = 1
  ctx.restore()
}
