import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { isTouch } from '../lib/device'
import { setAnisotropy } from '../lib/textures'
import { world } from '../lib/world'
import { useStore } from '../state/store'
import { Bench } from './Bench'
import { CameraRig } from './CameraRig'
import { Cake } from './Cake'
import { Celebration } from './Celebration'
import { Director } from './Director'
import { Guide } from './Guide'
import { Player } from './Player'
import { Floaters } from './Floaters'
import { buildLayoutKey } from './keys'
import type { Layout } from './layout'
import { Lights } from './Lights'
import { PhotoFrame } from './PhotoFrame'
import { Plinth } from './Plinth'
import { Room } from './Room'
import { WallScreen } from './WallScreen'

interface Props {
  onContextLost: () => void
  onContextRestored: () => void
}

/** WebGL context loss / restore handling (preventDefault lets the browser restore it). */
function ContextGuard({ onLost, onRestored }: { onLost: () => void; onRestored: () => void }) {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const el = gl.domElement
    const lost = (e: Event) => {
      e.preventDefault()
      onLost()
    }
    const restored = () => onRestored()
    el.addEventListener('webglcontextlost', lost)
    el.addEventListener('webglcontextrestored', restored)
    return () => {
      el.removeEventListener('webglcontextlost', lost)
      el.removeEventListener('webglcontextrestored', restored)
    }
  }, [gl, onLost, onRestored])
  return null
}

function AnisoSetter() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    setAnisotropy(gl.capabilities.getMaxAnisotropy())
  }, [gl])
  return null
}

/** Tiny fps watchdog: if the average stays under 40 fps for ~3 s, drop the pixel ratio to 1 (once). */
function PerfWatch() {
  const setDpr = useThree((s) => s.setDpr)
  const acc = useRef({ t: 0, frames: 0, low: 0, done: false, warm: 0 })
  useFrame((_, dt) => {
    const a = acc.current
    if (a.done) return
    a.warm += dt
    if (a.warm < 5) return
    a.t += dt
    a.frames++
    if (a.t >= 1) {
      const fps = a.frames / a.t
      a.low = fps < 40 ? a.low + 1 : 0
      a.t = 0
      a.frames = 0
      if (a.low >= 3) {
        a.done = true
        setDpr(1)
      }
    }
  })
  return null
}

function FloorClick({ layout }: { layout: Layout }) {
  const { halfW, zN, zS } = layout
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.002, (zN + zS) / 2]}
      onClick={(e) => {
        const st = useStore.getState()
        if (st.phase !== 'explore') return
        e.stopPropagation()
        world.walkTarget = { x: e.point.x, z: e.point.z }
        world.walkTargetAge = 0
        st.cancelPending()
      }}
    >
      <planeGeometry args={[halfW * 2, zS - zN]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  )
}

function Scene() {
  const layout = useStore((s) => s.layout)
  const photos = useStore((s) => s.photos)
  if (!layout) return null
  return (
    <group key={buildLayoutKey(layout)}>
      <Lights />
      <Room layout={layout} />
      {layout.frames.map((f) => (
        <PhotoFrame
          key={f.index}
          placement={f}
          aspect={photos[f.index]?.aspect ?? 1}
          interactable={layout.interactables.find((i) => i.id === 'photo-' + f.index)}
        />
      ))}
      {layout.benches.map((b) => (
        <Bench key={b.id} bench={b} layout={layout} />
      ))}
      <Plinth
        x={layout.plinth.x}
        z={layout.plinth.z}
        w={layout.plinth.w}
        d={layout.plinth.d}
        h={layout.plinth.h}
        plaque={{ small: 'For', big: 'Sudha' }}
      />
      <WallScreen layout={layout} />
      <Cake layout={layout} />
      <Celebration layout={layout} />
      <Floaters layout={layout} />
      <FloorClick layout={layout} />
      <Director layout={layout} />
      <Player layout={layout} />
      <Guide layout={layout} />
      <CameraRig layout={layout} />
    </group>
  )
}

export function Museum({ onContextLost, onContextRestored }: Props) {
  const touch = isTouch()
  return (
    <div className="canvas-wrap">
      <Canvas
        flat
        dpr={touch ? [1, 1.5] : [1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        camera={{ fov: 45, near: 0.1, far: 220, position: [3, 6, 20] }}
        onCreated={({ camera }) => camera.lookAt(3, 1, 10)}
      >
        <color attach="background" args={['#14141a']} />
        <fog attach="fog" args={['#ebe7e0', 45, 120]} />
        <ContextGuard onLost={onContextLost} onRestored={onContextRestored} />
        <AnisoSetter />
        <PerfWatch />
        <Scene />
      </Canvas>
    </div>
  )
}
