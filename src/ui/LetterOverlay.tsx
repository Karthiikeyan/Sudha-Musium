import { useEffect, useRef } from 'react'
import { content } from '../config/content'
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

export function LetterOverlay() {
  const phase = useStore((s) => s.phase)
  const close = useStore((s) => s.keepExploring)
  const replay = useStore((s) => s.replay)
  useEffect(() => {
    if (phase !== 'letter') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, close])
  if (phase !== 'letter') return null
  return (
    <div className="letter-backdrop">
      <LetterCard onClose={close} onReplay={replay} />
    </div>
  )
}
