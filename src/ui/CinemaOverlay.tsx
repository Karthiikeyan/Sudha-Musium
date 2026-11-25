import { useEffect, useState } from 'react'
import { content } from '../config/content'
import { useStore } from '../state/store'

const SKIP_AFTER_MS = 10000

/** Cinema controls: Play once seated, subtitles while playing, Skip after 10 s, Stand up at the end. */
export function CinemaOverlay() {
  const phase = useStore((s) => s.phase)
  const stage = useStore((s) => s.cinemaStage)
  const caption = useStore((s) => s.cinemaCaption)
  const setStage = useStore((s) => s.setCinemaStage)
  const finish = useStore((s) => s.finishCinema)
  const exit = useStore((s) => s.exitInteraction)
  const [canSkip, setCanSkip] = useState(false)
  const open = phase === 'cinema'

  useEffect(() => {
    setCanSkip(false)
    if (!open || stage !== 'playing') return
    const id = window.setTimeout(() => setCanSkip(true), SKIP_AFTER_MS)
    return () => window.clearTimeout(id)
  }, [open, stage])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stage !== 'playing') exit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, stage, exit])

  if (!open) return null
  return (
    <>
      {stage === 'playing' && caption && (
        <div className="subtitles" aria-live="polite">
          <span>{caption}</span>
        </div>
      )}
      <div className="action-wrap cinema-actions">
        {stage === 'seating' && <div className="cinema-note">Finding your seats… 🍿</div>}
        {stage === 'ready' && (
          <>
            <button className="action-btn play-btn" onClick={() => setStage('playing')} autoFocus>
              {content.cinema.play}
            </button>
            <button className="pill-btn glass" onClick={exit}>
              {content.cinema.standUp}
            </button>
          </>
        )}
        {stage === 'playing' && canSkip && (
          <button className="pill-btn glass" onClick={finish}>
            {content.cinema.skip}
          </button>
        )}
        {stage === 'ended' && (
          <button className="action-btn" onClick={exit} autoFocus>
            {content.cinema.standUp}
          </button>
        )}
      </div>
    </>
  )
}
