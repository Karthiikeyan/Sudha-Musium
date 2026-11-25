import * as THREE from 'three'
import { content } from '../../config/content'
import type { RoomDef } from '../../journey/rooms'
import { useStore } from '../../state/store'
import { BlobShadow } from '../BlobShadow'
import { Door } from '../Door'
import { useCanvasTexture, useDisposable } from '../hooks'
import { ENVELOPE_X } from '../layout'
import { Lamp } from '../props'
import { RoomShell } from '../RoomShell'
import { Sign } from '../Sign'
import { Star } from '../Star'

const DESK_Z = -1.4
const DESK_TOP = 1.0

/** Wall of pigeonholes with little envelopes (one canvas texture). */
function Pigeonholes({ w, h, position, rotationY }: { w: number; h: number; position: [number, number, number]; rotationY: number }) {
  const cols = Math.max(4, Math.round(w / 0.55))
  const rows = Math.max(3, Math.round(h / 0.5))
  const tex = useCanvasTexture(
    Math.round(w * 120),
    Math.round(h * 120),
    (ctx, W, H) => {
      ctx.fillStyle = '#5e3d22'
      ctx.fillRect(0, 0, W, H)
      const cw = W / cols
      const rh = H / rows
      const env = ['#fbf3e4', '#f7c6d4', '#d9ccf2', '#fbe7a6']
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cw + 5
          const y = r * rh + 5
          ctx.fillStyle = '#2e1d10'
          ctx.fillRect(x, y, cw - 10, rh - 10)
          if ((r * 7 + c * 3) % 4 !== 0) {
            ctx.fillStyle = env[(r + c) % env.length]
            const ew = (cw - 10) * 0.7
            const eh = (rh - 10) * 0.45
            ctx.fillRect(x + (cw - 10 - ew) / 2, y + (rh - 10) - eh - 4, ew, eh)
            ctx.strokeStyle = 'rgba(0,0,0,0.15)'
            ctx.beginPath()
            ctx.moveTo(x + (cw - 10 - ew) / 2, y + (rh - 10) - eh - 4)
            ctx.lineTo(x + (cw - 10) / 2, y + (rh - 10) - eh * 0.4 - 4)
            ctx.lineTo(x + (cw - 10 + ew) / 2, y + (rh - 10) - eh - 4)
            ctx.stroke()
          }
        }
      }
    },
    [cols, rows],
  )
  const mat = useDisposable(() => new THREE.MeshLambertMaterial({ map: tex }), [tex])
  return (
    <mesh position={position} rotation={[0, rotationY, 0]} material={mat}>
      <planeGeometry args={[w, h]} />
    </mesh>
  )
}

/** One envelope lying on the desk. */
function Envelope({ x, big, color, opened, onClick }: { x: number; big?: boolean; color: string; opened: boolean; onClick: () => void }) {
  const s = big ? 1.35 : 1
  return (
    <group
      position={[x, DESK_TOP + 0.02, DESK_Z + 0.12]}
      rotation={[0, (x * 0.13) % 0.2, 0]}
      scale={s}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <mesh>
        <boxGeometry args={[0.62, 0.025, 0.42]} />
        <meshLambertMaterial color={opened ? '#ece2cf' : color} />
      </mesh>
      {/* flap */}
      <mesh position={[0, 0.016, -0.08]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} scale={[1, 1, 1]}>
        <planeGeometry args={[0.3, 0.3]} />
        <meshLambertMaterial color={opened ? '#e1d4bb' : '#f3e6cc'} side={THREE.DoubleSide} />
      </mesh>
      {big && !opened && (
        <mesh position={[0, 0.03, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.07, 18]} />
          <meshBasicMaterial color="#a4243b" />
        </mesh>
      )}
    </group>
  )
}

/** Chapter · The Post Office: warm wood, pigeonholes, three "Open when…" envelopes and the big sealed letter. */
export function PostOfficeRoom({ room }: { room: RoomDef }) {
  const L = room.layout
  const pal = room.palette
  const request = useStore((s) => s.requestInteraction)
  const opened = useStore((s) => s.progress.lettersOpened)
  const mainRead = useStore((s) => s.progress.mainLetterRead)
  const envColors = ['#d9ccf2', '#fbe7a6', '#f7c6d4']
  return (
    <>
      <color attach="background" args={[pal.bg]} />
      <hemisphereLight args={['#ffe9c6', '#4a3020', 1.8]} />
      <directionalLight position={[3, 9, 6]} intensity={0.45} color="#ffdcae" />
      <pointLight position={[-1.9, 1.9, DESK_Z]} intensity={4} distance={6} decay={2} color="#ffb85c" />
      <RoomShell layout={L} palette={pal} floor="wood" tile={1.8} />
      <Pigeonholes w={L.d - 1.6} h={2.4} position={[-L.w / 2 + 0.01, 1.75, 0.2]} rotationY={Math.PI / 2} />
      <Pigeonholes w={5.6} h={2.4} position={[-1.5, 1.75, -L.d / 2 + 0.01]} rotationY={0} />
      <Sign
        lines={[
          { text: 'POST OFFICE', font: '700 {px}px "Inter Variable", sans-serif', color: '#f6d9a8' },
          { text: 'est. 26 Nov 2026', font: 'italic 400 {px}px "Playfair Display", serif', color: '#e9c48f' },
        ]}
        w={2.6}
        h={0.7}
        position={[3.2, 3.45, -L.d / 2 + 0.02]}
        bg="#3d2716"
        border="#c9a45c"
      />

      {/* desk */}
      <BlobShadow z={DESK_Z} w={5.4} d={1.9} opacity={0.55} />
      <mesh position={[0, DESK_TOP / 2, DESK_Z]}>
        <boxGeometry args={[4.4, DESK_TOP, 0.95]} />
        <meshLambertMaterial color="#6b4527" />
      </mesh>
      <mesh position={[0, DESK_TOP + 0.005, DESK_Z]}>
        <boxGeometry args={[4.55, 0.04, 1.05]} />
        <meshLambertMaterial color="#8a5a34" />
      </mesh>
      <Lamp x={-1.9} y={DESK_TOP + 0.02} z={DESK_Z - 0.25} shade="#f0b45a" />
      {ENVELOPE_X.map((x, i) => {
        const big = i === 3
        const inter = L.interactables.find((it) => it.id === (big ? 'letter' : 'env-' + i))
        return (
          <Envelope
            key={i}
            x={x}
            big={big}
            color={big ? '#fbf3e4' : envColors[i]}
            opened={big ? mainRead : opened.includes(i)}
            onClick={() => inter && request(inter)}
          />
        )
      })}
      <Sign
        lines={[{ text: content.sealed.seal + ' 💌', font: 'italic 400 {px}px "Playfair Display", serif', color: '#6a4a2a' }]}
        w={1.0}
        h={0.24}
        position={[ENVELOPE_X[3], DESK_TOP - 0.25, DESK_Z + 0.48]}
        bg="#f3e2c0"
      />

      {/* stamp counter */}
      <group position={[4.3, 0, 0.5]}>
        <BlobShadow w={1.6} d={2.6} opacity={0.5} />
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.0, 1.0, 1.9]} />
          <meshLambertMaterial color="#6b4527" />
        </mesh>
        {[-0.5, 0, 0.5].map((z, i) => (
          <mesh key={z} position={[-0.1, 1.08, z]}>
            <boxGeometry args={[0.3, 0.16, 0.3]} />
            <meshLambertMaterial color={['#a4243b', '#2f5f9a', '#3f7a45'][i]} />
          </mesh>
        ))}
      </group>

      {/* mail trolley */}
      <group position={[-3, 0, 2.7]}>
        <BlobShadow w={1.8} d={1.2} opacity={0.5} />
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[1.2, 0.6, 0.75]} />
          <meshLambertMaterial color="#8f6b3f" />
        </mesh>
        {[
          [-0.3, 0.98, 0, '#f3e2c0'],
          [0.25, 0.95, 0.1, '#c98b6b'],
          [0, 1.25, -0.05, '#e9d3a8'],
        ].map(([x, y, z, c], i) => (
          <mesh key={i} position={[x as number, y as number, z as number]}>
            <boxGeometry args={[0.45, 0.28, 0.4]} />
            <meshLambertMaterial color={c as string} />
          </mesh>
        ))}
        {[-0.45, 0.45].map((x) => (
          <mesh key={x} position={[x, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.1, 0.03, 6, 14]} />
            <meshLambertMaterial color="#2b2b30" />
          </mesh>
        ))}
      </group>

      <Door room={room} />
      <Star room={room} />
    </>
  )
}
