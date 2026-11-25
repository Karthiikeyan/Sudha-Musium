import * as THREE from 'three'
import type { Palette } from '../journey/rooms'
import { floorPattern, type FloorKind } from '../lib/textures'
import { useDisposable } from './hooks'
import type { RoomLayout } from './layout'

export const DOOR_W = 1.7
export const DOOR_H = 2.7
const T = 0.18 // wall thickness

interface Props {
  layout: RoomLayout
  palette: Palette
  floor: FloorKind
  /** tile size in world units */
  tile?: number
  /** wall height override (rooftop uses a low parapet) */
  wallH?: number
  /** also build a low wall on the south side (rooftop parapet) */
  south?: boolean
  wallColor?: string
}

/**
 * Floor + the three walls that don't face the camera (north, east, west), "dollhouse" style:
 * the south wall and the ceiling are never rendered, so nothing blocks the view.
 * The north wall leaves a gap for the door.
 */
export function RoomShell({ layout, palette, floor, tile = 2, wallH, south, wallColor }: Props) {
  const { w, d } = layout
  const H = wallH ?? layout.wallH
  const floorMat = useDisposable(() => {
    const t = floorPattern(floor, palette.floor)
    const m = new THREE.MeshLambertMaterial({ map: t })
    m.map?.repeat.set(w / tile, d / tile)
    return m
  }, [floor, palette.floor, w, d, tile])
  const wallMat = useDisposable(() => new THREE.MeshLambertMaterial({ color: wallColor ?? palette.wall }), [wallColor, palette.wall])
  const trimMat = useDisposable(() => new THREE.MeshLambertMaterial({ color: palette.trim }), [palette.trim])

  const door = layout.door
  const north: { x0: number; x1: number }[] = []
  if (door) {
    north.push({ x0: -w / 2 - T, x1: door.x - DOOR_W / 2 }, { x0: door.x + DOOR_W / 2, x1: w / 2 + T })
  } else north.push({ x0: -w / 2 - T, x1: w / 2 + T })

  const nz = -d / 2 - T / 2
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={floorMat}>
        <planeGeometry args={[w, d]} />
      </mesh>
      {/* north wall (with a door gap) */}
      {north.map((s, i) =>
        s.x1 - s.x0 > 0.01 ? (
          <mesh key={i} position={[(s.x0 + s.x1) / 2, H / 2, nz]} material={wallMat}>
            <boxGeometry args={[s.x1 - s.x0, H, T]} />
          </mesh>
        ) : null,
      )}
      {door && H > DOOR_H + 0.05 && (
        <mesh position={[door.x, (H + DOOR_H) / 2, nz]} material={wallMat}>
          <boxGeometry args={[DOOR_W, H - DOOR_H, T]} />
        </mesh>
      )}
      {/* side walls */}
      <mesh position={[-w / 2 - T / 2, H / 2, 0]} material={wallMat}>
        <boxGeometry args={[T, H, d]} />
      </mesh>
      <mesh position={[w / 2 + T / 2, H / 2, 0]} material={wallMat}>
        <boxGeometry args={[T, H, d]} />
      </mesh>
      {south && (
        <mesh position={[0, H / 2, d / 2 + T / 2]} material={wallMat}>
          <boxGeometry args={[w + T * 2, H, T]} />
        </mesh>
      )}
      {/* baseboards + top trim */}
      {H > 1.5 && (
        <>
          <mesh position={[-w / 2 + 0.03, 0.09, 0]} material={trimMat}>
            <boxGeometry args={[0.06, 0.18, d]} />
          </mesh>
          <mesh position={[w / 2 - 0.03, 0.09, 0]} material={trimMat}>
            <boxGeometry args={[0.06, 0.18, d]} />
          </mesh>
          <mesh position={[-w / 2 - T / 2, H + 0.03, 0]} material={trimMat}>
            <boxGeometry args={[T + 0.06, 0.06, d]} />
          </mesh>
          <mesh position={[w / 2 + T / 2, H + 0.03, 0]} material={trimMat}>
            <boxGeometry args={[T + 0.06, 0.06, d]} />
          </mesh>
          <mesh position={[0, H + 0.03, nz]} material={trimMat}>
            <boxGeometry args={[w + T * 2 + 0.06, 0.06, T + 0.06]} />
          </mesh>
        </>
      )}
    </group>
  )
}
