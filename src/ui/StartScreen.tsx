import { useEffect, useState } from 'react'
import { content } from '../config/content'
import { startMusic, unlockAudio } from '../lib/audio'
import { useStore } from '../state/store'

export function StartScreen() {
  const phase = useStore((s) => s.phase)
  const beginIntro = useStore((s) => s.beginIntro)
  const [gone, setGone] = useState(false)
  const leaving = phase !== 'start'

  useEffect(() => {
    if (!leaving || phase === 'loading') return
    const id = window.setTimeout(() => setGone(true), 800)
    return () => window.clearTimeout(id)
  }, [leaving, phase])

  if (phase === 'loading' || gone) return null

  const tap = () => {
    if (phase !== 'start') return
    unlockAudio()
    startMusic()
    beginIntro()
  }

  return (
    <div className={'screen' + (leaving ? ' out' : '')} style={{ zIndex: 80 }}>
      <div className="screen-inner">
        <div className="eyebrow">A little gift</div>
        <h1 className="big-title">{content.museumTitle}</h1>
        <div className="from-to">
          From <em>{content.subtitleFrom}</em>
          <span className="bar">|</span>To <em>{content.subtitleTo}</em>
        </div>
        <button className="gift-btn" onClick={tap} autoFocus>
          {content.startButton}
        </button>
        <div className="start-date">
          {content.birthday.day} {content.birthday.month} {content.birthday.year}
        </div>
      </div>
    </div>
  )
}
