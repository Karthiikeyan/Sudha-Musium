import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { content, type QuizQuestion } from '../config/content'
import { heartBurst, smallBurst } from '../lib/fx'
import { isTouch } from '../lib/device'
import { sfx } from '../lib/audio'
import { useStore } from '../state/store'
import { Mascot } from './Mascot'

function useTypewriter(text: string, active: boolean, ms = 38) {
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    if (!active) return
    let i = 0
    const id = window.setInterval(() => {
      i++
      setN(i)
      if (i >= text.length) window.clearInterval(id)
    }, ms)
    return () => window.clearInterval(id)
  }, [text, active, ms])
  return text.slice(0, n)
}

/** One "Yes grows, No shrinks" question. */
function Question({ q, done, onYes }: { q: QuizQuestion; done: boolean; onYes: () => void }) {
  const [noCount, setNoCount] = useState(0)
  const [hop, setHop] = useState({ x: 0, y: 0 })
  const lastBump = useRef(0)
  const touch = isTouch()

  const bump = useCallback(() => {
    const now = performance.now()
    if (now - lastBump.current < 260) return // hover + click on desktop would double count
    lastBump.current = now
    setNoCount((c) => c + 1)
    if (touch) setHop({ x: (Math.random() * 2 - 1) * 70, y: (Math.random() * 2 - 1) * 34 })
  }, [touch])

  const yesSize = Math.min(1.2 + noCount * 0.34, 3.6)
  const noScale = Math.max(0.4, 1 - noCount * 0.12)
  const gag = noCount > 0 ? q.gags[Math.min(noCount - 1, q.gags.length - 1)] : ''

  if (done) return null
  return (
    <>
      <div className="quiz-gag" aria-live="polite">
        {gag}
      </div>
      <div className="quiz-buttons">
        <button
          className="yes-btn"
          style={{ fontSize: yesSize + 'rem', width: noCount >= 6 ? '100%' : undefined, minHeight: 52 }}
          onClick={onYes}
          autoFocus
        >
          {q.yes}
        </button>
        <button
          className="no-btn"
          style={{ transform: `translate(${hop.x}px, ${hop.y}px) scale(${noScale})` }}
          onPointerEnter={(e) => {
            if (e.pointerType === 'mouse') bump()
          }}
          onPointerDown={(e) => {
            if (e.pointerType !== 'mouse') bump()
          }}
          onClick={bump}
        >
          {q.no}
        </button>
      </div>
    </>
  )
}

const RAIN = ['💖', '🩷', '💗', '✨', '🌸']

export function ScreenQuiz() {
  const phase = useStore((s) => s.phase)
  const step = useStore((s) => s.progress.quizStep)
  const treatYes = useStore((s) => s.progress.treatYes)
  const friendsYes = useStore((s) => s.progress.friendsYes)
  const setQuiz = useStore((s) => s.setQuiz)
  const close = useStore((s) => s.closeScreen)
  const open = phase === 'screen'
  const typed = useTypewriter(content.quiz.intro.typed, open && step === 0)
  const nextRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  useEffect(() => {
    if (open) nextRef.current?.focus({ preventScroll: true })
  }, [open, step, treatYes, friendsYes])

  const rain = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: ((i * 53) % 100) / 40,
        dur: 2.4 + ((i * 17) % 10) / 6,
        size: 16 + ((i * 7) % 14),
        ch: RAIN[i % RAIN.length],
      })),
    [],
  )

  if (!open) return null
  const happy = (step === 1 && treatYes) || (step === 2 && friendsYes)

  return (
    <div className="quiz-backdrop">
      <div className="quiz-card" role="dialog" aria-modal="true" aria-label="A little question">
        <button className="quiz-x" onClick={close} aria-label="Close">
          ×
        </button>
        {step === 2 && friendsYes && (
          <div className="rain" aria-hidden="true">
            {rain.map((r, i) => (
              <span key={i} style={{ left: r.left + '%', animationDelay: r.delay + 's', animationDuration: r.dur + 's', fontSize: r.size }}>
                {r.ch}
              </span>
            ))}
          </div>
        )}
        <div className="quiz-mascot">
          <Mascot mood={happy ? 'happy' : 'idle'} size={happy ? 150 : 136} />
        </div>

        {step === 0 && (
          <>
            <h2 className="quiz-q">{content.quiz.intro.title}</h2>
            <p className="quiz-sub typing">
              {typed}
              <span className="caret" />
            </p>
            <button ref={nextRef} className="quiz-next" onClick={() => setQuiz({ quizStep: 1 })}>
              {content.quiz.intro.next}
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="quiz-q">{treatYes ? content.quiz.treat.done : content.quiz.treat.question}</h2>
            <Question
              key="treat"
              q={content.quiz.treat}
              done={treatYes}
              onYes={() => {
                setQuiz({ treatYes: true })
                smallBurst()
                sfx('sparkle')
              }}
            />
            {treatYes && (
              <button ref={nextRef} className="quiz-next" onClick={() => setQuiz({ quizStep: 2 })}>
                {content.quiz.next}
              </button>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="quiz-q">{friendsYes ? content.quiz.friends.done : content.quiz.friends.question}</h2>
            <Question
              key="friends"
              q={content.quiz.friends}
              done={friendsYes}
              onYes={() => {
                setQuiz({ friendsYes: true })
                heartBurst()
                sfx('sparkle')
              }}
            />
            {friendsYes && (
              <button ref={nextRef} className="quiz-next" onClick={close}>
                {content.quiz.close}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
