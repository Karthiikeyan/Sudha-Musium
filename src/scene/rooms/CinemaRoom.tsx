import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { content } from '../../config/content'
import type { RoomDef } from '../../journey/rooms'
import { duckMusic } from '../../lib/audio'
import { pick } from '../../lib/math'
import { getPhoto, release, want } from '../../lib/photoCache'
import { useStore } from '../../state/store'
import { BlobShadow } from '../BlobShadow'
import { Door } from '../Door'
import { useCanvasTexture, useDisposable } from '../hooks'
import { CINEMA_ROWS } from '../layout'
import { RoomShell } from '../RoomShell'
import { Star } from '../Star'

const SCREEN_W = 7.2
const SCREEN_H = 4.05
const SCREEN_Y = 2.75
const FADE = 0.8
const TITLE_SECONDS = 3
const SLIDE_SECONDS = 3.5
const QUICK_SECONDS = 1.7

interface Slide {
  kind: 'title-start' | 'title-end' | 'photo'
  name?: string
  dur: number
}

function titleDraw(text: string, sub: string) {
  return (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const g = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * 0.7)
    g.addColorStop(0, '#2a1420')
    g.addColorStop(1, '#0a0608')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#ffd9e2'
    ctx.font = 'italic 400 96px "Playfair Display", serif'
    ctx.fillText(text, W / 2, H / 2 - 20, W * 0.9)
    ctx.fillStyle = '#c98a9a'
    ctx.font = '500 30px "Inter Variable", sans-serif'
    ctx.fillText(sub, W / 2, H / 2 + 70, W * 0.9)
  }
}

/** The 3D movie screen: two crossfading planes with a slow Ken Burns drift. */
function CinemaScreen({ z }: { z: number }) {
  const plan = useStore((s) => s.plan)
  const stage = useStore((s) => s.cinemaStage)
  const slides = useMemo<Slide[]>(() => {
    const list: Slide[] = [{ kind: 'title-start', dur: TITLE_SECONDS }]
    ;(plan?.cinema ?? []).forEach((s) => list.push({ kind: 'photo', name: s.name, dur: s.quick ? QUICK_SECONDS : SLIDE_SECONDS }))
    list.push({ kind: 'title-end', dur: TITLE_SECONDS + 0.5 })
    return list
  }, [plan])
  const starts = useMemo(() => {
    let acc = 0
    return slides.map((s) => {
      const a = acc
      acc += s.dur
      return a
    })
  }, [slides])
  const total = starts[starts.length - 1] + slides[slides.length - 1].dur

  const startTex = useCanvasTexture(1280, 720, titleDraw(content.cinema.titleStart, 'starring Sudha · featuring Karthik'), [])
  const endTex = useCanvasTexture(1280, 720, titleDraw(content.cinema.titleEnd, 'thanks for watching 🍿'), [])
  const front = useDisposable(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, toneMapped: false, depthWrite: false }), [])
  const back = useDisposable(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, toneMapped: false, depthWrite: false }), [])
  const frontMesh = useRef<THREE.Mesh>(null)
  const backMesh = useRef<THREE.Mesh>(null)
  const S = useRef({ t: 0, idx: -1, fadeT: 0, ended: false })

  const texFor = (s: Slide | undefined): { tex: THREE.Texture | null; aspect: number } => {
    if (!s) return { tex: null, aspect: 16 / 9 }
    if (s.kind === 'title-start') return { tex: startTex, aspect: 16 / 9 }
    if (s.kind === 'title-end') return { tex: endTex, aspect: 16 / 9 }
    const e = s.name ? getPhoto(s.name) : undefined
    return { tex: e?.tex ?? null, aspect: e?.aspect ?? 0.8 }
  }
  const fit = (mesh: THREE.Mesh | null, aspect: number, kb: number, panX: number) => {
    if (!mesh) return
    const sa = SCREEN_W / SCREEN_H
    let w = SCREEN_W
    let h = SCREEN_H
    if (aspect > sa) h = SCREEN_W / aspect
    else w = SCREEN_H * aspect
    mesh.scale.set(w * kb, h * kb, 1)
    mesh.position.x = panX
  }

  // reset when (re)starting
  useEffect(() => {
    if (stage === 'playing') {
      S.current = { t: 0, idx: -1, fadeT: 0, ended: false }
      duckMusic(0.45)
    } else duckMusic(1)
    if (stage === 'ended' || stage === 'seating' || stage === 'ready') {
      S.current.idx = -1
    }
  }, [stage])
  useEffect(
    () => () => {
      duckMusic(1)
      release('cinema')
    },
    [],
  )

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const st = useStore.getState()
    const R = S.current
    const fm = frontMesh.current
    const bm = backMesh.current
    if (!fm || !bm) return
    if (st.cinemaStage !== 'playing') {
      // idle screen: show the opening title, or the end card once the movie was watched
      const s = st.cinemaStage === 'ended' || st.progress.cinemaDone ? slides[slides.length - 1] : slides[0]
      const { tex } = texFor(s)
      if (front.map !== tex) {
        front.map = tex
        front.needsUpdate = true
      }
      front.opacity = Math.min(1, front.opacity + dt * 2)
      back.opacity = 0
      fit(fm, 16 / 9, 1, 0)
      return
    }
    R.t += dt
    if (R.t >= total) {
      if (!R.ended) {
        R.ended = true
        st.finishCinema()
        st.say('karthik', content.cinema.afterLine)
      }
      return
    }
    let idx = 0
    while (idx + 1 < starts.length && starts[idx + 1] <= R.t) idx++
    if (idx !== R.idx) {
      // new slide: old front becomes the back plane, new texture fades in on top
      back.map = front.map
      back.opacity = front.opacity
      back.needsUpdate = true
      bm.scale.copy(fm.scale)
      bm.position.x = fm.position.x
      R.idx = idx
      R.fadeT = 0
      front.opacity = 0
      const cur = slides[idx]
      const upcoming = slides.slice(idx, idx + 3).filter((s) => s.kind === 'photo' && s.name).map((s) => s.name as string)
      want('cinema', upcoming)
      st.setCinemaCaption(cur.kind === 'photo' && cur.name ? st.photoInfo(cur.name).caption : '')
      if (cur.kind === 'photo' && idx % 4 === 2) st.say('karthik', pick(content.cinema.whispers))
    }
    const cur = slides[idx]
    const { tex, aspect } = texFor(cur)
    if (front.map !== tex) {
      front.map = tex
      front.needsUpdate = true
    }
    R.fadeT += dt
    front.opacity = tex ? Math.min(1, R.fadeT / FADE) : 0
    back.opacity = Math.max(0, 1 - R.fadeT / FADE) * (back.map ? 1 : 0)
    const local = (R.t - starts[idx]) / cur.dur
    const kb = cur.kind === 'photo' ? 0.95 + local * 0.06 : 1
    fit(fm, aspect, kb, cur.kind === 'photo' ? (idx % 2 ? 1 : -1) * (local - 0.5) * 0.12 : 0)
  })

  return (
    <group position={[0, SCREEN_Y, z]}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
        <meshBasicMaterial color="#050405" />
      </mesh>
      <mesh ref={backMesh} material={back} position={[0, 0, 0.005]} renderOrder={4}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <mesh ref={frontMesh} material={front} position={[0, 0, 0.01]} renderOrder={5}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </group>
  )
}

/** Rows of red seats (instanced), the two middle seats are highlighted pink. */
function Seats() {
  const cushions = useRef<THREE.InstancedMesh>(null)
  const backs = useRef<THREE.InstancedMesh>(null)
  const seats = useMemo(() => {
    const out: { x: number; z: number; hi: boolean }[] = []
    CINEMA_ROWS.forEach((z, r) => {
      for (let i = 0; i < 8; i++) {
        const x = -3.85 + i * 1.1
        out.push({ x, z, hi: r === 1 && (i === 3 || i === 4) })
      }
    })
    return out
  }, [])
  useLayoutEffect(() => {
    const c = cushions.current
    const b = backs.current
    if (!c || !b) return
    const d = new THREE.Object3D()
    const col = new THREE.Color()
    seats.forEach((s, i) => {
      d.position.set(s.x, 0.42, s.z)
      d.updateMatrix()
      c.setMatrixAt(i, d.matrix)
      d.position.set(s.x, 0.85, s.z + 0.36)
      d.updateMatrix()
      b.setMatrixAt(i, d.matrix)
      col.set(s.hi ? '#ff8fab' : '#8f2d45')
      c.setColorAt(i, col)
      b.setColorAt(i, col)
    })
    c.instanceMatrix.needsUpdate = true
    b.instanceMatrix.needsUpdate = true
    if (c.instanceColor) c.instanceColor.needsUpdate = true
    if (b.instanceColor) b.instanceColor.needsUpdate = true
  }, [seats])
  return (
    <>
      <instancedMesh ref={cushions} args={[undefined, undefined, seats.length]}>
        <boxGeometry args={[0.95, 0.3, 0.7]} />
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={backs} args={[undefined, undefined, seats.length]}>
        <boxGeometry args={[0.95, 0.9, 0.14]} />
        <meshLambertMaterial />
      </instancedMesh>
      {CINEMA_ROWS.map((z) => (
        <BlobShadow key={z} z={z + 0.1} w={10} d={1.4} opacity={0.5} />
      ))}
    </>
  )
}

function Curtains({ z }: { z: number }) {
  const folds = [-1, 1].flatMap((side) =>
    Array.from({ length: 5 }, (_, i) => ({ x: side * (SCREEN_W / 2 + 0.25 + i * 0.22), s: side })),
  )
  return (
    <group>
      {folds.map((f, i) => (
        <mesh key={i} position={[f.x, 2.4, z + 0.25]}>
          <cylinderGeometry args={[0.14, 0.14, 4.8, 8]} />
          <meshLambertMaterial color={i % 2 ? '#7a1830' : '#8f2040'} />
        </mesh>
      ))}
      <mesh position={[0, 4.95, z + 0.3]}>
        <boxGeometry args={[SCREEN_W + 2.6, 0.6, 0.3]} />
        <meshLambertMaterial color="#7a1830" />
      </mesh>
    </group>
  )
}

function Popcorn({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <BlobShadow w={1.6} d={1.3} opacity={0.5} />
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.0, 1.0, 0.8]} />
        <meshLambertMaterial color="#c43a4a" />
      </mesh>
      {[-0.25, 0.25].map((bx) => (
        <group key={bx} position={[bx, 1.0, 0]}>
          <mesh position={[0, 0.17, 0]}>
            <cylinderGeometry args={[0.15, 0.11, 0.34, 12]} />
            <meshLambertMaterial color="#fff4f0" />
          </mesh>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} position={[Math.cos(i) * 0.08, 0.38 + (i % 2) * 0.04, Math.sin(i) * 0.08]}>
              <sphereGeometry args={[0.06, 6, 5]} />
              <meshLambertMaterial color={i % 3 ? '#fff6d6' : '#ffe08a'} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/** Chapter · The Movie of Us: dark theatre, sit together, press play. Lights come up when the movie ends. */
export function CinemaRoom({ room }: { room: RoomDef }) {
  const L = room.layout
  const pal = room.palette
  const request = useStore((s) => s.requestInteraction)
  const seatsInter = L.interactables.find((i) => i.kind === 'seats')
  const hemi = useRef<THREE.HemisphereLight>(null)
  useFrame((_, delta) => {
    const st = useStore.getState()
    const target = st.phase === 'cinema' && st.cinemaStage === 'playing' ? 0.35 : st.cinemaStage === 'ended' || st.progress.cinemaDone ? 1.9 : 1.2
    if (hemi.current) hemi.current.intensity += (target - hemi.current.intensity) * Math.min(1, Math.min(delta, 0.05) * 2)
  })
  const aisle = useMemo(() => {
    const out: [number, number][] = []
    for (let i = 0; i < 6; i++) {
      out.push([-4.85, -3.5 + i * 1.7], [4.85, -3.5 + i * 1.7])
    }
    return out
  }, [])
  const z = -L.d / 2
  return (
    <>
      <color attach="background" args={[pal.bg]} />
      <hemisphereLight ref={hemi} args={['#ffd6e0', '#2a1018', 1.2]} />
      <pointLight position={[0, 3, z + 3]} intensity={5} distance={10} decay={2} color="#ffd9e6" />
      <RoomShell layout={L} palette={pal} floor="carpet" tile={1.5} />
      <mesh position={[0, 0.25, -5.5]}>
        <boxGeometry args={[8.6, 0.5, 1.0]} />
        <meshLambertMaterial color="#3a1a24" />
      </mesh>
      <CinemaScreen z={z + 0.12} />
      <Curtains z={z} />
      <group
        onClick={(e) => {
          e.stopPropagation()
          if (seatsInter) request(seatsInter)
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <Seats />
      </group>
      {aisle.map(([x, az], i) => (
        <mesh key={i} position={[x, 0.03, az]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.08, 10]} />
          <meshBasicMaterial color="#ffd27a" toneMapped={false} />
        </mesh>
      ))}
      <Popcorn x={-6.1} z={4.8} />
      <Door room={room} />
      <Star room={room} />
    </>
  )
}
