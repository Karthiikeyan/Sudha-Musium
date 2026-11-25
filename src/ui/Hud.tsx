import { useEffect } from 'react'
import { content } from '../config/content'
import { hallSeen, starRooms } from '../journey/progress'
import { isTouch } from '../lib/device'
import { useKeyboard } from '../lib/input'
import { useStore } from '../state/store'
import { ActionButton } from './ActionButton'
import { JourneyMap } from './JourneyMap'
import { Joystick } from './Joystick'
import { PhotoCaption } from './PhotoCaption'

const PLAYING = new Set(['explore', 'viewing', 'sitting', 'screen', 'cake', 'ticket', 'cinema', 'arcade', 'note', 'letter', 'wishtree'])

export function Hud() {
  useKeyboard()
  const phase = useStore((s) => s.phase)
  const room = useStore((s) => s.room())
  const rooms = useStore((s) => s.rooms)
  const progress = useStore((s) => s.progress)
  const musicOk = useStore((s) => s.musicOk)
  const muted = useStore((s) => s.muted)
  const toggleMute = useStore((s) => s.toggleMute)
  const hintVisible = useStore((s) => s.hintVisible)
  const dismissHint = useStore((s) => s.dismissHint)
  const finishIntro = useStore((s) => s.finishIntro)
  const exit = useStore((s) => s.exitInteraction)
  const showHint = useStore((s) => s.showHint)
  const busy = useStore((s) => !!s.transition)

  useEffect(() => {
    if (!hintVisible) return
    const id = window.setTimeout(dismissHint, 12000)
    return () => window.clearTimeout(id)
  }, [hintVisible, dismissHint])

  const playing = PLAYING.has(phase) && !busy
  const totalStars = starRooms(rooms).length
  const hints = isTouch() ? content.hints.mobile : content.hints.desktop
  const hallTotal = room?.hall?.photos.length ?? 0
  const starMissing = !!room?.layout.star && !progress.stars.includes(room.id)

  return (
    <>
      {playing && (
        <div className="hud-top">
          <JourneyMap />
          <div className="hud-right">
            {room?.kind === 'hall' && (
              <div className="chip" aria-label={`${content.journey.memories} ${hallSeen(room, progress)} of ${hallTotal}`}>
                📷 {hallSeen(room, progress)}/{hallTotal}
              </div>
            )}
            {totalStars > 0 && (
              <div className="chip" aria-label={`Stars ${progress.stars.length} of ${totalStars}`}>
                ⭐ {progress.stars.length}/{totalStars}
              </div>
            )}
            {starMissing && phase === 'explore' && (
              <button className="chip icon-chip hint-chip" onClick={showHint} aria-label="Hint: where is the star?">
                💡
              </button>
            )}
            {musicOk && (
              <button className="chip icon-chip" onClick={toggleMute} aria-label={muted ? 'Unmute music' : 'Mute music'}>
                {muted ? '🔇' : '🔊'}
              </button>
            )}
          </div>
        </div>
      )}

      {phase === 'intro' && (
        <button className="skip-btn" onClick={finishIntro}>
          {content.hints.skipIntro} ›
        </button>
      )}

      {phase === 'explore' && hintVisible && !busy && (
        <div className="hint-card" role="note">
          <ul>
            {hints.map((h) => (
              <li key={h}>{h}</li>
            ))}
            <li>Find the hidden ⭐ in every room (💡 gives a hint)</li>
          </ul>
          <button className="pill-btn soft small" onClick={dismissHint}>
            {content.hints.gotIt}
          </button>
        </div>
      )}

      {phase === 'sitting' && (
        <div className="action-wrap">
          <button className="action-btn" onClick={exit}>
            {content.actions.standUp}
          </button>
        </div>
      )}

      {!busy && <ActionButton />}
      <PhotoCaption />
      {!busy && <Joystick />}
    </>
  )
}
