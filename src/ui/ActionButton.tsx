import { content } from '../config/content'
import { doorStatus } from '../journey/progress'
import { useStore } from '../state/store'

/** Pill button bottom-centre when Sudha is close to something she can interact with. */
export function ActionButton() {
  const phase = useStore((s) => s.phase)
  const nearby = useStore((s) => s.nearby)
  const start = useStore((s) => s.startInteraction)
  const label = useStore((s) => {
    const n = s.nearby
    if (!n) return ''
    switch (n.kind) {
      case 'photo':
        return content.actions.photo
      case 'bench':
        return content.actions.bench
      case 'screen':
        return s.progress.friendsYes ? content.quiz.screenDone : content.actions.screen
      case 'cake':
        return content.actions.cake
      case 'door': {
        const room = s.room()
        return room && doorStatus(room, s.rooms, s.progress).open ? content.journey.doorOpen : content.journey.doorLocked
      }
      case 'ticket':
        return s.progress.ticketTaken ? content.ticket.again : content.ticket.action
      case 'seats':
        return content.cinema.sit
      case 'arcade':
        return content.arcade.action
      case 'envelope':
        return content.openWhen[n.index]?.label ?? content.notes.open
      case 'letter':
        return content.sealed.action
      case 'wishtree':
        return content.wishTree.action
    }
  })
  if (phase !== 'explore' || !nearby || !label) return null
  return (
    <div className="action-wrap">
      <button key={nearby.id} className="action-btn" onClick={() => start(nearby)}>
        {label}
      </button>
    </div>
  )
}
