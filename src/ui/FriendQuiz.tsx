import { useEffect, useRef, useState } from 'react'
import { content } from '../config/content'
import { sfx } from '../lib/audio'
import { smallBurst } from '../lib/fx'
import { useStore } from '../state/store'

/** Optional arcade quiz: three playful questions; every answer is right and the result is always 100%. */
export function FriendQuiz() {
  const phase = useStore((s) => s.phase)
  const exit = useStore((s) => s.exitInteraction)
  const update = useStore((s) => s.updateProgress)
  const [q, setQ] = useState(-1)
  const [picked, setPicked] = useState<number | null>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const open = phase === 'arcade'
  const A = content.arcade
  const done = q >= A.questions.length

  useEffect(() => {
    if (!open) {
      setQ(-1)
      setPicked(null)
    }
  }, [open])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, exit])
  useEffect(() => {
    if (done && open) {
      update({ friendQuizDone: true })
      smallBurst()
      sfx('tada')
    }
  }, [done, open, update])
  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true })
  }, [q, picked])

  if (!open) return null
  const cur = A.questions[q]
  return (
    <div className="overlay-backdrop">
      <div className="arcade-card" role="dialog" aria-label={A.title}>
        <div className="arcade-title">🕹️ {A.title}</div>
        {q < 0 && (
          <>
            <p className="arcade-text">{A.intro}</p>
            <button ref={nextRef} className="arcade-btn primary" onClick={() => setQ(0)}>
              {A.start}
            </button>
          </>
        )}
        {cur && (
          <>
            <div className="arcade-step">
              {q + 1} / {A.questions.length}
            </div>
            <p className="arcade-q">{cur.q}</p>
            <div className="arcade-options">
              {cur.options.map((o, i) => (
                <button
                  key={o.text}
                  className={'arcade-btn' + (picked === i ? ' picked' : '')}
                  disabled={picked !== null}
                  onClick={() => {
                    setPicked(i)
                    sfx('sparkle')
                  }}
                >
                  {o.text}
                </button>
              ))}
            </div>
            <div className="arcade-reply" aria-live="polite">
              {picked !== null ? cur.options[picked].reply : ''}
            </div>
            {picked !== null && (
              <button
                ref={nextRef}
                className="arcade-btn primary"
                onClick={() => {
                  setPicked(null)
                  setQ(q + 1)
                }}
              >
                {A.next}
              </button>
            )}
          </>
        )}
        {done && (
          <>
            <p className="arcade-result">{A.result}</p>
            <p className="arcade-text">{A.resultSub}</p>
            <button ref={nextRef} className="arcade-btn primary" onClick={exit}>
              {A.close}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
