import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { isTouch } from '../lib/device'
import { setPhotoAnisotropy } from '../lib/photoCache'
import { setAnisotropy } from '../lib/textures'
import { world } from '../lib/world'
import { useStore } from '../state/store'
import { CameraRig } from './CameraRig'
import { Director } from './Director'
import { Guide } from './Guide'
import { Player } from './Player'
import { RoomView } from './rooms/RoomView'

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
    world.glInfo = () => ({ textures: gl.info.memory.textures, geometries: gl.info.memory.geometries })
    return () => {
      el.removeEventListener('webglcontextlost', lost)
      el.removeEventListener('webglcontextrestored', restored)
      world.glInfo = null
    }
  }, [gl, onLost, onRestored])
  return null
}

function AnisoSetter() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const max = gl.capabilities.getMaxAnisotropy()
    setAnisotropy(max)
    setPhotoAnisotropy(max)
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

/** Invisible floor plane for tap/click-to-walk. */
function FloorClick({ w, d }: { w: number; d: number }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.002, 0]}
      onClick={(e) => {
        const st = useStore.getState()
        if (st.phase !== 'explore' || st.transition) return
        e.stopPropagation()
        world.walkTarget = { x: e.point.x, z: e.point.z }
        world.walkTargetAge = 0
        st.cancelPending()
      }}
    >
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  )
}

function Scene() {
  const room = useStore((s) => s.room())
  if (!room) return null
  return (
    <>
      <RoomView key={room.id} room={room} />
      <FloorClick key={'floor-' + room.id} w={room.layout.w} d={room.layout.d} />
      <Director />
      <Player />
      <Guide />
      <CameraRig />
    </>
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
        camera={{ fov: 45, near: 0.1, far: 240, position: [0, 6, 12] }}
      >
        <ContextGuard onLost={onContextLost} onRestored={onContextRestored} />
        <AnisoSetter />
        <PerfWatch />
        <Scene />
      </Canvas>
    </div>
  )
}
