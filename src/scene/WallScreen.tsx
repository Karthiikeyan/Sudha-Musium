import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { content } from '../config/content'
import { drawMascot } from '../lib/mascotShapes'
import { textureFromCanvas } from '../lib/textures'
import { useStore } from '../state/store'
import { BlobShadow } from './BlobShadow'
import type { Layout } from './layout'

const W = 1280
const H = 720

function paint(ctx: CanvasRenderingContext2D, done: boolean) {
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, '#fff8ea')
  g.addColorStop(1, '#f6e4c8')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  // confetti dots
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
    const lines = content.quiz.screenHello.replace(' 🎂', '').split(' ')
    ctx.fillText(lines[0] + ' ' + lines[1], 600, 280)
    ctx.fillText(lines.slice(2).join(' ') + ' 🎂', 600, 380)
    ctx.fillStyle = '#2a2530'
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

/** Big 16:9 wall screen at the north end. Shows the mascot and, once the quiz is finished, "Forever friends". */
export function WallScreen({ layout }: { layout: Layout }) {
  const { screen, platform } = layout
  const done = useStore((s) => s.friendsYes)
  const request = useStore((s) => s.requestInteraction)
  const inter = layout.interactables.find((i) => i.id === 'screen')

  const { canvas, tex } = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    const t = textureFromCanvas(c)
    t.anisotropy = 4
    return { canvas: c, tex: t }
  }, [])
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex])

  useEffect(() => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let alive = true
    const draw = () => {
      if (!alive) return
      paint(ctx, done)
      tex.needsUpdate = true
    }
    draw()
    // repaint once the web fonts are certainly ready
    if (document.fonts) void document.fonts.ready.then(draw)
    return () => {
      alive = false
    }
  }, [canvas, tex, done])

  useEffect(() => () => tex.dispose(), [tex])

  const sz = screen.z
  return (
    <group
      onClick={(e) => {
        e.stopPropagation()
        if (inter) request(inter)
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* low white platform */}
      <BlobShadow z={sz + platform.d + 0.4} w={platform.w + 1.6} d={2.8} opacity={0.45} />
      <mesh position={[platform.x, platform.h / 2, platform.z]}>
        <boxGeometry args={[platform.w, platform.h, platform.d]} />
        <meshLambertMaterial color="#f7f5f1" />
      </mesh>
      {/* thick black bezel */}
      <mesh position={[0, screen.y, sz + 0.22]}>
        <boxGeometry args={[screen.w + 0.5, screen.h + 0.5, 0.3]} />
        <meshLambertMaterial color="#0b0b0e" />
      </mesh>
      <mesh position={[0, screen.y, sz + 0.375]} material={mat}>
        <planeGeometry args={[screen.w, screen.h]} />
      </mesh>
      {/* tiny stand-by LED */}
      <mesh position={[screen.w / 2 + 0.1, screen.y - screen.h / 2 - 0.1, sz + 0.38]}>
        <circleGeometry args={[0.04, 8]} />
        <meshBasicMaterial color="#9be39b" />
      </mesh>
    </group>
  )
}
