import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { doorStatus } from '../journey/progress'
import type { RoomDef } from '../journey/rooms'
import { radialTexture } from '../lib/textures'
import { useStore } from '../state/store'
import { useDisposable } from './hooks'
import { DOOR_H, DOOR_W } from './RoomShell'

/**
 * The room's forward door in the north wall. locked → dim frame + padlock; unlocked → soft glow and pulse;
 * open → the panel swings and warm light spills through (then the room transition starts).
 */
export function Door({ room }: { room: RoomDef }) {
  const door = room.layout.door
  const open = useStore((s) => (door ? doorStatus(room, s.rooms, s.progress).open : false))
  const opening = useStore((s) => s.doorOpening)
  const request = useStore((s) => s.requestInteraction)
  const panel = useRef<THREE.Group>(null)
  const glow = useRef<THREE.Mesh>(null)
  const ring = useRef<THREE.Mesh>(null)
  const swing = useRef(0)

  const glowMat = useDisposable(
    () =>
      new THREE.MeshBasicMaterial({
        map: radialTexture('glow'),
        color: room.palette.accent,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [room.palette.accent],
  )
  const ringMat = useDisposable(
    () => new THREE.MeshBasicMaterial({ color: room.palette.accent, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false }),
    [room.palette.accent],
  )
  const lightMat = useDisposable(() => new THREE.MeshBasicMaterial({ color: '#fff4dc', toneMapped: false }), [])

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = clock.elapsedTime
    swing.current += ((opening ? 1 : 0) - swing.current) * Math.min(1, dt * 7)
    if (panel.current) panel.current.rotation.y = -1.55 * swing.current
    const pulse = 0.5 + Math.sin(t * 3) * 0.5
    glowMat.opacity = open ? 0.35 + pulse * 0.35 : 0
    if (glow.current) glow.current.visible = open
    if (ring.current) {
      ring.current.visible = open && !opening
      const s = 1 + pulse * 0.12
      ring.current.scale.set(s, s, 1)
      ringMat.opacity = 0.25 + pulse * 0.35
    }
  })

  if (!door) return null
  const z = door.z
  const inter = room.layout.interactables.find((i) => i.kind === 'door')
  const frameColor = open ? room.palette.accent : '#55505a'
  return (
    <group
      onClick={(e) => {
        e.stopPropagation()
        if (inter) request(inter)
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* light behind the doorway (seen when the door swings open) */}
      <mesh position={[door.x, DOOR_H / 2, z - 0.35]} material={lightMat}>
        <planeGeometry args={[DOOR_W, DOOR_H]} />
      </mesh>
      {/* glow halo */}
      <mesh ref={glow} position={[door.x, DOOR_H / 2, z + 0.12]} material={glowMat} renderOrder={3}>
        <planeGeometry args={[DOOR_W * 2.6, DOOR_H * 1.6]} />
      </mesh>
      {/* frame */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[door.x + s * (DOOR_W / 2 + 0.06), DOOR_H / 2, z + 0.06]}>
          <boxGeometry args={[0.14, DOOR_H + 0.1, 0.24]} />
          <meshLambertMaterial color={frameColor} />
        </mesh>
      ))}
      <mesh position={[door.x, DOOR_H + 0.07, z + 0.06]}>
        <boxGeometry args={[DOOR_W + 0.26, 0.14, 0.24]} />
        <meshLambertMaterial color={frameColor} />
      </mesh>
      {/* the panel, hinged on its left edge */}
      <group ref={panel} position={[door.x - DOOR_W / 2, 0, z + 0.02]}>
        <mesh position={[DOOR_W / 2, DOOR_H / 2, 0]}>
          <boxGeometry args={[DOOR_W - 0.04, DOOR_H - 0.04, 0.08]} />
          <meshLambertMaterial color={open ? '#8a5a3c' : '#4a3a33'} />
        </mesh>
        {[0.75, 1.9].map((y) => (
          <mesh key={y} position={[DOOR_W / 2, y, 0.05]}>
            <boxGeometry args={[DOOR_W - 0.5, 0.7, 0.02]} />
            <meshLambertMaterial color={open ? '#9c6a48' : '#56443b'} />
          </mesh>
        ))}
        <mesh position={[DOOR_W - 0.22, 1.25, 0.08]}>
          <sphereGeometry args={[0.06, 10, 8]} />
          <meshBasicMaterial color="#e6c27a" />
        </mesh>
        {!open && (
          <group position={[DOOR_W / 2, 1.3, 0.12]}>
            <mesh>
              <boxGeometry args={[0.32, 0.26, 0.08]} />
              <meshBasicMaterial color="#c9a45c" />
            </mesh>
            <mesh position={[0, 0.17, 0]}>
              <torusGeometry args={[0.1, 0.025, 6, 14, Math.PI]} />
              <meshBasicMaterial color="#b9b9c4" />
            </mesh>
          </group>
        )}
      </group>
      {/* pulsing floor ring in front of an open door */}
      <mesh ref={ring} position={[door.stand.x, 0.025, door.stand.z]} rotation={[-Math.PI / 2, 0, 0]} material={ringMat}>
        <ringGeometry args={[0.55, 0.72, 36]} />
      </mesh>
    </group>
  )
}
