import { useEffect } from 'react'
import { useStore } from '../state/store'

const OUT_MS = 450
const CARD_MS = 1250
const IN_MS = 450

/** Fade to black → chapter card → fade into the new room (≈2.15 s). Blocks input while it runs. */
export function RoomTransition() {
  const t = useStore((s) => s.transition)
  const stage = t?.stage
  const to = t?.to

  useEffect(() => {
    if (!stage) return
    const st = useStore.getState()
    let id = 0
    if (stage === 'out') id = window.setTimeout(() => useStore.getState().swapRoom(), OUT_MS)
    else if (stage === 'card') id = window.setTimeout(() => st.setTransitionStage('in'), CARD_MS)
    else id = window.setTimeout(() => useStore.getState().setTransitionStage(null), IN_MS)
    return () => window.clearTimeout(id)
  }, [stage, to])

  if (!t) return null
  return (
    <div className={'room-fade ' + t.stage} aria-live="polite" role="status">
      <div className="chapter-card">
        <div className="chapter-label">{t.label}</div>
        <div className="chapter-title">{t.title}</div>
        <div className="chapter-sub">{t.subtitle}</div>
      </div>
    </div>
  )
}
