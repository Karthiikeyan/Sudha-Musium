import { useEffect } from 'react'
import { content } from '../config/content'
import { isTouch } from '../lib/device'
import { useKeyboard } from '../lib/input'
import { useStore } from '../state/store'
import { ActionButton } from './ActionButton'
import { Joystick } from './Joystick'
import { PhotoCaption } from './PhotoCaption'

const PLAYING = new Set(['explore', 'viewing', 'sitting', 'screen', 'cake', 'celebration', 'letter'])

export function Hud() {
  useKeyboard()
  const phase = useStore((s) => s.phase)
  const photos = useStore((s) => s.photos)
  const seen = useStore((s) => s.seen)
  const musicOk = useStore((s) => s.musicOk)
  const muted = useStore((s) => s.muted)
  const toggleMute = useStore((s) => s.toggleMute)
  const hintVisible = useStore((s) => s.hintVisible)
  const dismissHint = useStore((s) => s.dismissHint)
  const finishIntro = useStore((s) => s.finishIntro)
  const exit = useStore((s) => s.exitInteraction)

  // the control hint fades on its own after a while
  useEffect(() => {
    if (!hintVisible) return
    const id = window.setTimeout(dismissHint, 12000)
    return () => window.clearTimeout(id)
  }, [hintVisible, dismissHint])

  const playing = PLAYING.has(phase)
  const seenCount = Object.keys(seen).length
  const hints = isTouch() ? content.hints.mobile : content.hints.desktop

  return (
    <>
      {playing && (
        <div className="hud-top">
          <div className="chip">{content.hudChip}</div>
          <div className="hud-right">
            {(phase === 'explore' || phase === 'viewing' || phase === 'sitting') && (
              <div className="chip memories" aria-label={`${content.memories} ${seenCount} of ${photos.length}`}>
                {content.memories} {seenCount}/{photos.length} ♡
              </div>
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

      {phase === 'explore' && hintVisible && (
        <div className="hint-card" role="note">
          <ul>
            {hints.map((h) => (
              <li key={h}>{h}</li>
            ))}
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

      <ActionButton />
      <PhotoCaption />
      <Joystick />
    </>
  )
}
