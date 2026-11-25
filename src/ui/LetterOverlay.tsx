import { useEffect, useRef, useState } from 'react'
import { content } from '../config/content'
import { sfx } from '../lib/audio'
import { useStore } from '../state/store'

interface CardProps {
  onClose?: () => void
  onReplay?: () => void
  /** when true the card is a plain block (used in the crash fallback) */
  inline?: boolean
}

export function LetterCard({ onClose, onReplay, inline }: CardProps) {
  const { letter } = content
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!inline) closeRef.current?.focus({ preventScroll: true })
  }, [inline])
  return (
    <div className="letter-card" role={inline ? undefined : 'dialog'} aria-modal={inline ? undefined : true} aria-label={letter.heading}>
      <div className="letter-scroll">
        <h2>{letter.heading}</h2>
        {letter.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        <div className="letter-sign">{letter.signOff}</div>
      </div>
      {(onClose || onReplay) && (
        <div className="letter-actions">
          {onReplay && (
            <button className="pill-btn soft" onClick={onReplay}>
              {letter.replay}
            </button>
          )}
          {onClose && (
            <button ref={closeRef} className="pill-btn" onClick={onClose}>
              {letter.close}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** The big wax-sealed envelope in the Post Office: tap the seal, it cracks, the main letter unfolds. */
export function LetterOverlay() {
  const phase = useStore((s) => s.phase)
  const readMain = useStore((s) => s.readMainLetter)
  const setPhase = useStore((s) => s.setPhase)
  const [stage, setStage] = useState<'sealed' | 'breaking' | 'open'>('sealed')
  const open = phase === 'letter'

  useEffect(() => {
    if (!open) setStage('sealed')
  }, [open])

  useEffect(() => {
    if (stage !== 'breaking') return
    const id = window.setTimeout(() => setStage('open'), 900)
    return () => window.clearTimeout(id)
  }, [stage])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (stage === 'open') readMain()
      else setPhase('explore')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, stage, readMain, setPhase])

  if (!open) return null
  return (
    <div className="letter-backdrop">
      {stage === 'open' ? (
        <LetterCard onClose={readMain} />
      ) : (
        <div className={'envelope ' + stage}>
          <div className="env-flap" />
          <div className="env-body">
            <div className="env-to">To Sudha</div>
          </div>
          <button
            className="wax-seal"
            onClick={() => {
              if (stage !== 'sealed') return
              sfx('page')
              setStage('breaking')
            }}
            aria-label={content.sealed.tapToBreak}
            autoFocus
          >
            <span className="half l" />
            <span className="half r" />
            <span className="seal-text">{content.sealed.seal}</span>
          </button>
          <div className="env-hint">{content.sealed.tapToBreak}</div>
          <button className="pill-btn soft env-close" onClick={() => setPhase('explore')}>
            {content.notes.close}
          </button>
        </div>
      )}
    </div>
  )
}
