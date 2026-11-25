import * as THREE from 'three'
import type { RoomDef } from '../../journey/rooms'
import { useStore } from '../../state/store'
import { BlobShadow } from '../BlobShadow'
import { Door } from '../Door'
import { Floaters } from '../Floaters'
import { useCanvasTexture, useDisposable } from '../hooks'
import { Plant, StringLights } from '../props'
import { RoomShell } from '../RoomShell'
import { Star } from '../Star'
import { WallScreen } from '../WallScreen'

function Sofa({ x, z }: { x: number; z: number }) {
  const c = '#f2a9bf'
  const d = '#e48fa9'
  return (
    <group position={[x, 0, z]}>
      <BlobShadow w={4.2} d={1.8} opacity={0.5} />
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[3.3, 0.45, 0.95]} />
        <meshStandardMaterial color={c} roughness={0.9} />
      </mesh>
      {[-0.8, 0.8].map((cx) => (
        <mesh key={cx} position={[cx, 0.6, -0.04]}>
          <boxGeometry args={[1.5, 0.18, 0.8]} />
          <meshStandardMaterial color="#f7c6d4" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 0.85, 0.38]}>
        <boxGeometry args={[3.3, 0.8, 0.22]} />
        <meshStandardMaterial color={d} roughness={0.9} />
      </mesh>
      {[-1.72, 1.72].map((ax) => (
        <mesh key={ax} position={[ax, 0.55, 0]}>
          <boxGeometry args={[0.22, 0.65, 0.95]} />
          <meshStandardMaterial color={d} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[-1.1, 0.82, -0.1]} rotation={[0.2, 0.3, 0.1]}>
        <boxGeometry args={[0.5, 0.42, 0.14]} />
        <meshStandardMaterial color="#fbe7a6" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Beanbag({ x, z, color }: { x: number; z: number; color: string }) {
  return (
    <group position={[x, 0, z]}>
      <BlobShadow w={1.6} d={1.6} opacity={0.5} />
      <mesh position={[0, 0.32, 0]} scale={[1, 0.62, 1]}>
        <sphereGeometry args={[0.6, 18, 14]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
    </group>
  )
}

/** The arcade cabinet in the corner (optional Friendship Quiz). */
function Arcade({ room }: { room: RoomDef }) {
  const request = useStore((s) => s.requestInteraction)
  const inter = room.layout.interactables.find((i) => i.kind === 'arcade')
  const tex = useCanvasTexture(
    320,
    256,
    (ctx, W, H) => {
      const g = ctx.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, '#2b1650')
      g.addColorStop(1, '#120a24')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)
      ctx.textAlign = 'center'
      ctx.fillStyle = '#ffd34d'
      ctx.font = '800 34px "Inter Variable", sans-serif'
      ctx.fillText('FRIENDSHIP', W / 2, 92)
      ctx.fillStyle = '#ff8fab'
      ctx.fillText('QUIZ', W / 2, 134)
      ctx.fillStyle = '#9ef0ff'
      ctx.font = '600 18px "Inter Variable", sans-serif'
      ctx.fillText('PRESS START 🕹️', W / 2, 196)
    },
    [],
  )
  const screenMat = useDisposable(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex])
  return (
    <group
      position={[5.15, 0, -3.6]}
      rotation={[0, -Math.PI / 2, 0]}
      onClick={(e) => {
        e.stopPropagation()
        if (inter) request(inter)
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <BlobShadow w={1.6} d={1.6} opacity={0.55} />
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[0.95, 1.9, 0.85]} />
        <meshLambertMaterial color="#5b3fa0" />
      </mesh>
      <mesh position={[0, 1.42, 0.36]} rotation={[-0.15, 0, 0]} material={screenMat}>
        <planeGeometry args={[0.78, 0.62]} />
      </mesh>
      <mesh position={[0, 2.0, 0.3]}>
        <boxGeometry args={[0.95, 0.24, 0.3]} />
        <meshBasicMaterial color="#ff8fab" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.98, 0.5]}>
        <boxGeometry args={[0.95, 0.12, 0.35]} />
        <meshLambertMaterial color="#3e2a75" />
      </mesh>
      <mesh position={[-0.2, 1.1, 0.55]}>
        <cylinderGeometry args={[0.02, 0.02, 0.16, 8]} />
        <meshLambertMaterial color="#222" />
      </mesh>
      <mesh position={[-0.2, 1.2, 0.55]}>
        <sphereGeometry args={[0.05, 10, 8]} />
        <meshBasicMaterial color="#ff4d6d" />
      </mesh>
      {[0.08, 0.24].map((bx, i) => (
        <mesh key={bx} position={[bx, 1.05, 0.55]}>
          <cylinderGeometry args={[0.04, 0.04, 0.03, 12]} />
          <meshBasicMaterial color={i ? '#ffd34d' : '#4dd2ff'} />
        </mesh>
      ))}
    </group>
  )
}

/** Chapter · The Lounge: cosy, butter + blush, the big screen with its two questions, and an arcade. */
export function LoungeRoom({ room }: { room: RoomDef }) {
  const L = room.layout
  const pal = room.palette
  const screen = L.interactables.find((i) => i.kind === 'screen')
  const top = L.wallH - 0.35
  const hw = L.w / 2 - 0.1
  const hd = L.d / 2 - 0.1
  return (
    <>
      <color attach="background" args={[pal.bg]} />
      <hemisphereLight args={['#fff6e6', '#b58b62', 2.2]} />
      <directionalLight position={[4, 9, 6]} intensity={0.5} color="#ffe9c8" />
      <RoomShell layout={L} palette={pal} floor="wood" tile={2.4} />
      {/* rug */}
      <mesh position={[0.6, 0.012, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.6, 40]} />
        <meshLambertMaterial color="#f7c6d4" />
      </mesh>
      <mesh position={[0.6, 0.014, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.3, 2.45, 40]} />
        <meshLambertMaterial color="#fbe7a6" />
      </mesh>
      {/* tv console + screen */}
      <mesh position={[0.6, 0.35, -4.6]}>
        <boxGeometry args={[5.2, 0.7, 0.7]} />
        <meshLambertMaterial color="#b98a5e" />
      </mesh>
      <WallScreen x={0.6} z={-L.d / 2} y={2.45} w={4.8} interactable={screen} />
      <Sofa x={0.6} z={1.4} />
      <Beanbag x={-2.9} z={-0.6} color="#d9ccf2" />
      <Beanbag x={3.9} z={-0.3} color="#fbe7a6" />
      <Plant x={-5.3} z={-1.8} pot="#e8b07a" />
      <Plant x={5.2} z={4.0} pot="#d98d7a" scale={1.1} />
      <Arcade room={room} />
      <StringLights
        strands={[
          [
            [-hw, top, -hd],
            [hw, top, -hd],
          ],
          [
            [-hw, top, -hd],
            [-hw, top, hd],
          ],
          [
            [hw, top, -hd],
            [hw, top, hd],
          ],
        ]}
        perStrand={22}
        sag={0.4}
      />
      <Floaters layout={L} top={3.6} hearts={6} stars={6} />
      <Door room={room} />
      <Star room={room} />
    </>
  )
}
