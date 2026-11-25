import * as THREE from 'three'
import { content } from '../config/content'
import { drawMascot } from '../lib/mascotShapes'
import { useStore } from '../state/store'
import { useCanvasTexture, useDisposable } from './hooks'
import type { Interactable } from './layout'

const W = 1280
const H = 720

function paint(ctx: CanvasRenderingContext2D, done: boolean) {
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, '#fff8ea')
  g.addColorStop(1, '#f6e4c8')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  const dots = ['#f7c6d4', '#d9ccf2', '#fbe7a6']
  for (let i = 0; i < 34; i++) {
    ctx.fillStyle = dots[i % 3]
    ctx.globalAlpha = 0.7
    ctx.beginPath()
    ctx.arc((i * 211) % W, (i * 137) % H, 6 + (i % 4) * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  drawMascot(ctx, 40, 110, 520, done ? 'happy' : 'idle')
  ctx.fillStyle = '#2a2530'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  if (done) {
    ctx.font = '600 92px "Playfair Display", Georgia, serif'
    ctx.fillText('Forever', 600, 300)
    ctx.fillText('friends', 600, 400)
    ctx.font = '70px "Playfair Display", Georgia, serif'
    ctx.fillText('🤝💖', 600, 500)
  } else {
    ctx.font = '600 80px "Playfair Display", Georgia, serif'
    const words = content.quiz.screenHello.replace(' 🎂', '').split(' ')
    ctx.fillText(words.slice(0, 2).join(' '), 600, 280)
    ctx.fillText(words.slice(2).join(' ') + ' 🎂', 600, 380)
    const px = 600
    const py = 470
    ctx.beginPath()
    ctx.roundRect(px, py, 300, 70, 35)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = '600 32px "Inter Variable", system-ui, sans-serif'
    ctx.textBaseline = 'middle'
    ctx.fillText('👆 ' + content.quiz.screenTap, px + 36, py + 37)
  }
}

interface Props {
  x: number
  /** z of the wall the screen hangs on */
  z: number
  y: number
  w: number
  interactable?: Interactable
}

/** 16:9 wall screen with the mascot; shows "Forever friends" once both questions are answered. */
export function WallScreen({ x, z, y, w, interactable }: Props) {
  const h = (w * 9) / 16
  const done = useStore((s) => s.progress.friendsYes)
  const request = useStore((s) => s.requestInteraction)
  const tex = useCanvasTexture(W, H, (ctx) => paint(ctx, done), [done])
  const mat = useDisposable(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex])
  return (
    <group
      onClick={(e) => {
        e.stopPropagation()
        if (interactable) request(interactable)
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <mesh position={[x, y, z + 0.12]}>
        <boxGeometry args={[w + 0.36, h + 0.36, 0.2]} />
        <meshLambertMaterial color="#0b0b0e" />
      </mesh>
      <mesh position={[x, y, z + 0.225]} material={mat}>
        <planeGeometry args={[w, h]} />
      </mesh>
      <mesh position={[x + w / 2 + 0.06, y - h / 2 - 0.06, z + 0.23]}>
        <circleGeometry args={[0.035, 8]} />
        <meshBasicMaterial color="#9be39b" />
      </mesh>
    </group>
  )
}
