import { content } from '../config/content'
import { useStore } from '../state/store'

const LABEL = {
  photo: content.actions.photo,
  bench: content.actions.bench,
  screen: content.actions.screen,
  cake: content.actions.cake,
} as const

/** Pill button that appears bottom-centre when Sudha is close to something she can interact with. */
export function ActionButton() {
  const phase = useStore((s) => s.phase)
  const nearby = useStore((s) => s.nearby)
  const start = useStore((s) => s.startInteraction)
  if (phase !== 'explore' || !nearby) return null
  return (
    <div className="action-wrap">
      <button key={nearby.id} className="action-btn" onClick={() => start(nearby)}>
        {LABEL[nearby.kind]}
      </button>
    </div>
  )
}
