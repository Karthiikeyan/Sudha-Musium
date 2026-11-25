import * as THREE from 'three'

const cache = new Map<string, THREE.CanvasTexture>()

export const photoUrl = (name: string) => '/images/' + encodeURIComponent(name)

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')
  return [c, ctx]
}

export function textureFromCanvas(c: HTMLCanvasElement, opts: { mip?: boolean } = {}): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  if (opts.mip !== false) {
    t.generateMipmaps = true
    t.minFilter = THREE.LinearMipmapLinearFilter
  } else {
    t.generateMipmaps = false
    t.minFilter = THREE.LinearFilter
  }
  t.magFilter = THREE.LinearFilter
  return t
}

export async function ensureFonts(): Promise<void> {
  try {
    if (typeof document === 'undefined' || !document.fonts) return
    await Promise.all([
      document.fonts.load('400 40px "Playfair Display"'),
      document.fonts.load('600 40px "Playfair Display"'),
      document.fonts.load('italic 400 40px "Playfair Display"'),
      document.fonts.load('400 20px "Inter Variable"'),
    ])
    await document.fonts.ready
  } catch {
    /* fonts are a nicety, never a blocker */
  }
}

/* ───────────────────────────── photos ───────────────────────────── */

const PLACEHOLDER_ASPECTS = [0.8, 1.25, 1, 0.75, 1.33, 0.9]
const PLACEHOLDER_GRADS: [string, string][] = [
  ['#f7c6d4', '#d9ccf2'],
  ['#fbe7a6', '#f7c6d4'],
  ['#d9ccf2', '#c9e7f2'],
  ['#fde2c8', '#f7c6d4'],
]

export function makePlaceholder(index: number): { texture: THREE.CanvasTexture; aspect: number } {
  const aspect = PLACEHOLDER_ASPECTS[index % PLACEHOLDER_ASPECTS.length]
  const w = aspect >= 1 ? 640 : Math.round(640 * aspect)
  const h = aspect >= 1 ? Math.round(640 / aspect) : 640
  const [c, ctx] = makeCanvas(w, h)
  const [a, b] = PLACEHOLDER_GRADS[index % PLACEHOLDER_GRADS.length]
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, a)
  g.addColorStop(1, b)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.beginPath()
  ctx.arc(w * 0.5, h * 0.42, Math.min(w, h) * 0.16, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(38,38,43,0.72)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `italic 400 ${Math.round(Math.min(w, h) * 0.075)}px "Playfair Display", Georgia, serif`
  ctx.fillText('Add a photo 📷', w / 2, h * 0.68)
  return { texture: textureFromCanvas(c), aspect }
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('failed to load ' + url))
    img.src = url
  })
}

/** Draws the image downscaled (stepwise, for quality) so its longest side is <= maxSide. */
export function downscale(img: HTMLImageElement, maxSide: number): { canvas: HTMLCanvasElement; aspect: number } {
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (!w || !h) throw new Error('empty image')
  const s = Math.min(1, maxSide / Math.max(w, h))
  const tw = Math.max(1, Math.round(w * s))
  const th = Math.max(1, Math.round(h * s))
  let src: CanvasImageSource = img
  let cw = w
  let ch = h
  while (cw / 2 > tw && ch / 2 > th) {
    const nw = Math.round(cw / 2)
    const nh = Math.round(ch / 2)
    const [c, ctx] = makeCanvas(nw, nh)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(src, 0, 0, nw, nh)
    src = c
    cw = nw
    ch = nh
  }
  const [out, octx] = makeCanvas(tw, th)
  octx.imageSmoothingQuality = 'high'
  octx.drawImage(src, 0, 0, tw, th)
  return { canvas: out, aspect: w / h }
}

/** Disposes every cached procedural texture (used on full teardown). */
export function disposeTextureCache() {
  cache.forEach((t) => t.dispose())
  cache.clear()
}

export function setAnisotropy(max: number) {
  const a = Math.min(4, max)
  cache.forEach((t, k) => {
    if (k.startsWith('floor') || k.startsWith('ceil')) {
      t.anisotropy = a
      t.needsUpdate = true
    }
  })
}

/* ───────────────────────── procedural textures ───────────────────────── */

function cached(key: string, make: () => THREE.CanvasTexture): THREE.CanvasTexture {
  let t = cache.get(key)
  if (!t) {
    t = make()
    cache.set(key, t)
  }
  return t
}

/** soft round blob, used for fake shadows (black) and light pools (white, additive) */
export function radialTexture(kind: 'shadow' | 'pool' | 'glow'): THREE.CanvasTexture {
  return cached('radial-' + kind, () => {
    const [c, ctx] = makeCanvas(128, 128)
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    if (kind === 'shadow') {
      g.addColorStop(0, 'rgba(0,0,0,0.5)')
      g.addColorStop(0.55, 'rgba(0,0,0,0.22)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
    } else if (kind === 'pool') {
      g.addColorStop(0, 'rgba(255,244,214,0.95)')
      g.addColorStop(0.45, 'rgba(255,240,205,0.4)')
      g.addColorStop(1, 'rgba(255,240,205,0)')
    } else {
      g.addColorStop(0, 'rgba(255,255,255,1)')
      g.addColorStop(0.3, 'rgba(255,255,255,0.55)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
    }
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    return textureFromCanvas(c, { mip: false })
  })
}

export function floorTexture(): THREE.CanvasTexture {
  return cached('floor', () => {
    const [c, ctx] = makeCanvas(512, 512)
    ctx.fillStyle = '#dcd7cf'
    ctx.fillRect(0, 0, 512, 512)
    const tones = ['#f4f1eb', '#f1eee7', '#f6f3ee', '#efebe3']
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) {
        ctx.fillStyle = tones[(x + y * 2) % tones.length]
        ctx.fillRect(x * 256 + 3, y * 256 + 3, 250, 250)
      }
    }
    const t = textureFromCanvas(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    return t
  })
}

export function ceilingTexture(): THREE.CanvasTexture {
  return cached('ceil', () => {
    const [c, ctx] = makeCanvas(256, 256)
    ctx.fillStyle = '#2b2b31'
    ctx.fillRect(0, 0, 256, 256)
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, 254, 254)
    ctx.beginPath()
    ctx.moveTo(128, 0)
    ctx.lineTo(128, 256)
    ctx.moveTo(0, 128)
    ctx.lineTo(256, 128)
    ctx.lineWidth = 1
    ctx.stroke()
    const t = textureFromCanvas(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    return t
  })
}

export function labelTexture(text: string): THREE.CanvasTexture {
  return cached('label-' + text, () => {
    const [c, ctx] = makeCanvas(256, 80)
    const g = ctx.createLinearGradient(0, 0, 0, 80)
    g.addColorStop(0, '#e6cf98')
    g.addColorStop(1, '#bfa064')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 80)
    ctx.strokeStyle = 'rgba(70,50,20,0.55)'
    ctx.lineWidth = 4
    ctx.strokeRect(2, 2, 252, 76)
    ctx.fillStyle = '#4a3714'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '600 34px "Playfair Display", Georgia, serif'
    ctx.fillText(text, 128, 42)
    return textureFromCanvas(c)
  })
}

export function plaqueTexture(small: string, big: string): THREE.CanvasTexture {
  return cached('plaque-' + small + big, () => {
    const [c, ctx] = makeCanvas(768, 384)
    ctx.fillStyle = '#fbf6ea'
    ctx.fillRect(0, 0, 768, 384)
    ctx.strokeStyle = '#c4a15a'
    ctx.lineWidth = 8
    ctx.strokeRect(18, 18, 732, 348)
    ctx.lineWidth = 2
    ctx.strokeRect(36, 36, 696, 312)
    ctx.fillStyle = '#7a6a4a'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '400 44px "Playfair Display", Georgia, serif'
    ctx.fillText(small.toUpperCase().split('').join(' '), 384, 118)
    ctx.fillStyle = '#26262b'
    ctx.font = 'italic 400 150px "Playfair Display", Georgia, serif'
    ctx.fillText(big, 384, 238)
    return textureFromCanvas(c)
  })
}

export function textSpriteTexture(text: string, color = '#ffffff'): THREE.CanvasTexture {
  return cached('sprite-' + text + color, () => {
    const [c, ctx] = makeCanvas(256, 256)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '600 150px "Playfair Display", Georgia, serif'
    ctx.lineWidth = 14
    ctx.strokeStyle = 'rgba(214,120,150,0.95)'
    ctx.strokeText(text, 128, 138)
    ctx.fillStyle = color
    ctx.fillText(text, 128, 138)
    return textureFromCanvas(c)
  })
}

export function ribbonTexture(text: string): THREE.CanvasTexture {
  return cached('ribbon-' + text, () => {
    const [c, ctx] = makeCanvas(1024, 192)
    const g = ctx.createLinearGradient(0, 0, 0, 192)
    g.addColorStop(0, '#f9d3de')
    g.addColorStop(1, '#f2a9bf')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 1024, 192)
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    for (let x = 12; x < 1024; x += 40) {
      ctx.beginPath()
      ctx.arc(x, 10, 5, 0, Math.PI * 2)
      ctx.arc(x, 182, 5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = 'italic 400 104px "Playfair Display", Georgia, serif'
    ctx.shadowColor = 'rgba(160,70,100,0.5)'
    ctx.shadowBlur = 6
    ctx.fillText(text, 512, 100)
    return textureFromCanvas(c)
  })
}

export type FloorKind = 'tile' | 'wood' | 'carpet' | 'deck' | 'marble'

/** Small tiling floor patterns (cached per kind + colour, so the number stays bounded). */
export function floorPattern(kind: FloorKind, color: string): THREE.CanvasTexture {
  return cached(`floor-${kind}-${color}`, () => {
    const [c, ctx] = makeCanvas(256, 256)
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 256, 256)
    if (kind === 'tile' || kind === 'marble') {
      ctx.strokeStyle = kind === 'tile' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)'
      ctx.lineWidth = 3
      ctx.strokeRect(1.5, 1.5, 125, 125)
      ctx.strokeRect(129.5, 1.5, 125, 125)
      ctx.strokeRect(1.5, 129.5, 125, 125)
      ctx.strokeRect(129.5, 129.5, 125, 125)
      if (kind === 'marble') {
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(10, 200)
        ctx.bezierCurveTo(80, 120, 140, 180, 250, 60)
        ctx.stroke()
      }
    } else if (kind === 'wood' || kind === 'deck') {
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)'
        ctx.fillRect(0, i * 32, 256, 32)
        ctx.fillStyle = 'rgba(0,0,0,0.18)'
        ctx.fillRect(0, i * 32, 256, 2)
        ctx.fillRect(((i * 97) % 200) + 20, i * 32, 2, 32)
      }
    } else {
      // carpet: soft speckle
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
        ctx.fillRect((i * 73) % 256, (i * 151) % 256, 2, 2)
      }
    }
    const t = textureFromCanvas(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    return t
  })
}
