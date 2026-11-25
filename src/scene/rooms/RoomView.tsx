import type { RoomDef } from '../../journey/rooms'
import { Door } from '../Door'
import { RoomShell } from '../RoomShell'
import { Star } from '../Star'
import { CinemaRoom } from './CinemaRoom'
import { HallRoom } from './HallRoom'
import { LobbyRoom } from './LobbyRoom'
import { LoungeRoom } from './LoungeRoom'

/** Placeholder room used while a room kind is being built. */
function BasicRoom({ room }: { room: RoomDef }) {
  return (
    <>
      <color attach="background" args={[room.palette.bg]} />
      <hemisphereLight args={['#ffffff', '#cfc6bb', 2.2]} />
      <RoomShell layout={room.layout} palette={room.palette} floor="wood" />
      <Door room={room} />
      <Star room={room} />
    </>
  )
}

/** Only the current room is mounted; switching rooms unmounts (and disposes) the previous one. */
export function RoomView({ room }: { room: RoomDef }) {
  switch (room.kind) {
    case 'lobby':
      return <LobbyRoom room={room} />
    case 'cinema':
      return <CinemaRoom room={room} />
    case 'lounge':
      return <LoungeRoom room={room} />
    case 'hall':
      return <HallRoom room={room} />
    default:
      return <BasicRoom room={room} />
  }
}
