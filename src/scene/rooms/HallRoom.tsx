import type { RoomDef } from '../../journey/rooms'
import { useStore } from '../../state/store'
import { Bench } from '../Bench'
import { Door } from '../Door'
import { Floaters } from '../Floaters'
import { PhotoFrame } from '../PhotoFrame'
import { RoomShell } from '../RoomShell'
import { Sign } from '../Sign'
import { Star } from '../Star'

/** Memory Lane: a short white gallery. Frames stay dark until she walks close, so photos are discovered a few at a time. */
export function HallRoom({ room }: { room: RoomDef }) {
  const L = room.layout
  const pal = room.palette
  const seen = useStore((s) => s.progress.seenPhotos)
  const hall = room.hall
  return (
    <>
      <color attach="background" args={[pal.bg]} />
      <hemisphereLight args={['#ffffff', '#cfc6bb', 2.3]} />
      <directionalLight position={[4, 10, 7]} intensity={0.45} color="#fff6e8" />
      <RoomShell layout={L} palette={pal} floor="tile" tile={1.6} />
      <Sign
        lines={[
          { text: `${room.chapterLabel} · Memory Lane`, font: '400 {px}px "Inter Variable", sans-serif', color: '#9a7f5a' },
          { text: hall?.title ?? '', font: 'italic 400 {px}px "Playfair Display", serif', color: '#26262b' },
        ]}
        w={4.6}
        h={0.95}
        position={[0, 3.55, -L.d / 2 + 0.01]}
        transparent
      />
      {L.frames.map((f) => (
        <PhotoFrame
          key={f.name + f.index}
          placement={f}
          interactable={L.interactables.find((i) => i.id === 'photo-' + f.index)}
          startLit={seen.includes(f.name)}
        />
      ))}
      {L.benches.map((b) => (
        <Bench key={b.id} bench={b} interactable={L.interactables.find((i) => i.id === 'bench-' + b.id)} />
      ))}
      <Floaters layout={L} top={4.1} hearts={6} stars={10} />
      <Door room={room} />
      <Star room={room} />
    </>
  )
}
