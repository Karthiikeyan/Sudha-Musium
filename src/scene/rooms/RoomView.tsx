import type { RoomDef } from '../../journey/rooms'
import { CinemaRoom } from './CinemaRoom'
import { HallRoom } from './HallRoom'
import { LobbyRoom } from './LobbyRoom'
import { LoungeRoom } from './LoungeRoom'
import { PostOfficeRoom } from './PostOfficeRoom'
import { RooftopRoom } from './RooftopRoom'

/** Only the current room is mounted; switching rooms unmounts (and disposes) the previous one. */
export function RoomView({ room }: { room: RoomDef }) {
  switch (room.kind) {
    case 'lobby':
      return <LobbyRoom room={room} />
    case 'cinema':
      return <CinemaRoom room={room} />
    case 'lounge':
      return <LoungeRoom room={room} />
    case 'post-office':
      return <PostOfficeRoom room={room} />
    case 'rooftop':
      return <RooftopRoom room={room} />
    case 'hall':
      return <HallRoom room={room} />
  }
}
