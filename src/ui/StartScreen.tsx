import { useEffect, useState } from 'react'
import { content } from '../config/content'
import { startMusic, unlockAudio } from '../lib/audio'
import { useStore } from '../state/store'

export function StartScreen() {
  const phase = useStore((s) => s.phase)
  const saved = useStore((s) => s.savedProgress)
  const startNew = useStore((s) => s.startNew)
  const cont = useStore((s) => s.continueJourney)
  const [gone, setGone] = useState(false)
  const leaving = phase !== 'start'

  useEffect(() => {
    if (!leaving || phase === 'loading') return
    const id = window.setTimeout(() => setGone(true), 800)
    return () => window.clearTimeout(id)
  }, [leaving, phase])

  if (phase === 'loading' || gone) return null

  const begin = (fn: () => void) => {
    if (useStore.getState().phase !== 'start') return
    unlockAudio()
    startMusic()
    fn()
  }
  const hasSave = !!saved && saved.visited.length > 0

  return (
    <div className={'screen' + (leaving ? ' out' : '')} style={{ zIndex: 80 }}>
      <div className="screen-inner">
        <div className="eyebrow">A little gift</div>
        <h1 className="big-title">{content.museumTitle}</h1>
        <div className="from-to">
          From <em>{content.subtitleFrom}</em>
          <span className="bar">|</span>To <em>{content.subtitleTo}</em>
        </div>
        {hasSave ? (
          <>
            <button className="gift-btn" onClick={() => begin(cont)} autoFocus>
              {content.journey.continueJourney} ✨
            </button>
            <button className="link-btn" onClick={() => begin(startNew)}>
              {content.journey.startOver}
            </button>
          </>
        ) : (
          <button className="gift-btn" onClick={() => begin(startNew)} autoFocus>
            {content.startButton}
          </button>
        )}
        <div className="start-date">
          {content.birthday.day} {content.birthday.month} {content.birthday.year}
        </div>
      </div>
    </div>
  )
}
