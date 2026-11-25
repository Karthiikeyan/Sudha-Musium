import * as THREE from 'three'
import { useCanvasTexture, useDisposable } from './hooks'

interface Props {
  lines: { text: string; font: string; color?: string }[]
  w: number
  h: number
  position: [number, number, number]
  rotationY?: number
  bg?: string
  border?: string
  /** canvas pixels per world unit */
  res?: number
  transparent?: boolean
}

/** A flat sign with text drawn into a canvas texture (Playfair / Inter from @fontsource, no CDN). */
export function Sign({ lines, w, h, position, rotationY = 0, bg, border, res = 220, transparent }: Props) {
  const cw = Math.round(w * res)
  const ch = Math.round(h * res)
  const key = lines.map((l) => l.text + l.font + (l.color ?? '')).join('|') + (bg ?? '') + (border ?? '')
  const tex = useCanvasTexture(
    cw,
    ch,
    (ctx, W, H) => {
      if (bg) {
        ctx.fillStyle = bg
        ctx.fillRect(0, 0, W, H)
      }
      if (border) {
        ctx.strokeStyle = border
        ctx.lineWidth = Math.max(4, H * 0.03)
        ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, W - ctx.lineWidth * 2, H - ctx.lineWidth * 2)
      }
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const n = lines.length
      lines.forEach((l, i) => {
        ctx.fillStyle = l.color ?? '#26262b'
        ctx.font = l.font.replace('{px}', String(Math.round(H / (n + 0.8)) * 0.8))
        ctx.fillText(l.text, W / 2, (H * (i + 1)) / (n + 1), W * 0.94)
      })
    },
    [key],
  )
  const mat = useDisposable(() => new THREE.MeshBasicMaterial({ map: tex, transparent: !!transparent, toneMapped: false }), [tex, transparent])
  return (
    <mesh position={position} rotation={[0, rotationY, 0]} material={mat}>
      <planeGeometry args={[w, h]} />
    </mesh>
  )
}
