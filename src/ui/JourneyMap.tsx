import { useState } from 'react'
import { content } from '../config/content'
import { canTravel, isRoomComplete } from '../journey/progress'
import { useStore } from '../state/store'

/** Collapsible journey map: current room highlighted, locked rooms greyed, visited rooms fast-travel. */
export function JourneyMap() {
  const [open, setOpen] = useState(false)
  const rooms = useStore((s) => s.rooms)
  const roomId = useStore((s) => s.roomId)
  const progress = useStore((s) => s.progress)
  const phase = useStore((s) => s.phase)
  const busy = useStore((s) => !!s.transition || s.doorOpening)
  const travel = useStore((s) => s.travel)
  const canUse = phase === 'explore' && !busy

  return (
    <div className="map-wrap">
      <button className="chip map-chip" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="journey-map">
        🗺️ {content.journey.map}
      </button>
      {open && (
        <div id="journey-map" className="map-panel" role="dialog" aria-label={content.journey.mapTitle}>
          <div className="map-title">{content.journey.mapTitle}</div>
          <ol>
            {rooms.map((r) => {
              const visited = canTravel(r, progress)
              const current = r.id === roomId
              const done = isRoomComplete(r, progress)
              const missingStar = !!r.layout.star && visited && !progress.stars.includes(r.id)
              const cls = 'map-item' + (current ? ' current' : '') + (visited ? '' : ' locked')
              return (
                <li key={r.id}>
                  <button
                    className={cls}
                    disabled={!visited || current || !canUse}
                    onClick={() => {
                      setOpen(false)
                      travel(r.id)
                    }}
                  >
                    <span className="map-dot">{visited ? (done ? '✓' : r.order + 1) : '🔒'}</span>
                    <span className="map-name">{r.name}</span>
                    {missingStar && <span className="map-star" title="A star is still hiding here">⭐</span>}
                    {current && <span className="map-here">you are here</span>}
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}
