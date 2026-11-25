import { content } from '../config/content'
import { useStore } from '../state/store'

/** Caption card under the photo while the camera is pushed in, with Back / Previous / Next. */
export function PhotoCaption() {
  const phase = useStore((s) => s.phase)
  const index = useStore((s) => s.viewIndex)
  const photos = useStore((s) => s.photos)
  const exit = useStore((s) => s.exitInteraction)
  const step = useStore((s) => s.stepPhoto)
  if (phase !== 'viewing') return null
  const meta = photos[index]
  if (!meta) return null
  const n = photos.length
  return (
    <div className="caption-wrap">
      <div key={index} className="caption-card" role="region" aria-live="polite">
        <div className="caption-top">
          <span className="caption-no">
            Memory {String(index + 1).padStart(2, '0')} <span>/ {String(n).padStart(2, '0')}</span>
          </span>
        </div>
        <p className="caption-text">{meta.caption}</p>
        <div className="caption-actions">
          <button className="round-btn" onClick={() => step(-1)} aria-label={content.actions.prev}>
            ‹
          </button>
          <button className="pill-btn pink" onClick={exit}>
            {content.actions.back}
          </button>
          <button className="round-btn" onClick={() => step(1)} aria-label={content.actions.next}>
            ›
          </button>
        </div>
      </div>
    </div>
  )
}
