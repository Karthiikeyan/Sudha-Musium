import { content } from '../config/content'
import { useStore } from '../state/store'

/** Caption card under the photo while the camera is pushed in, with Back / Previous / Next. */
export function PhotoCaption() {
  const phase = useStore((s) => s.phase)
  const index = useStore((s) => s.viewIndex)
  const room = useStore((s) => s.room())
  const photoInfo = useStore((s) => s.photoInfo)
  const exit = useStore((s) => s.exitInteraction)
  const step = useStore((s) => s.stepPhoto)
  if (phase !== 'viewing' || !room) return null
  const frames = room.layout.frames
  const f = frames[index]
  if (!f) return null
  const n = frames.length
  return (
    <div className="caption-wrap">
      <div key={f.name} className="caption-card" role="region" aria-live="polite">
        <div className="caption-top">
          <span className="caption-no">
            Memory {String(index + 1).padStart(2, '0')} <span>/ {String(n).padStart(2, '0')}</span>
          </span>
        </div>
        <p className="caption-text">{photoInfo(f.name).caption}</p>
        <div className="caption-actions">
          <button className="round-btn" onClick={() => step(-1)} aria-label={content.actions.prev} disabled={n < 2}>
            ‹
          </button>
          <button className="pill-btn pink" onClick={exit}>
            {content.actions.back}
          </button>
          <button className="round-btn" onClick={() => step(1)} aria-label={content.actions.next} disabled={n < 2}>
            ›
          </button>
        </div>
      </div>
    </div>
  )
}
