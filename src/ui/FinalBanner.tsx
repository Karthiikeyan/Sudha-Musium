import { useEffect, useState } from 'react'
import { content, formatBanner } from '../config/content'
import { useStore } from '../state/store'

/** "Happy 23rd Birthday, Sudha!" with the two follow-up buttons that appear after the first burst. */
export function FinalBanner() {
  const phase = useStore((s) => s.phase)
  const openLetter = useStore((s) => s.openLetter)
  const keep = useStore((s) => s.keepExploring)
  const [showButtons, setShowButtons] = useState(false)
  const on = phase === 'celebration'

  useEffect(() => {
    if (!on) {
      setShowButtons(false)
      return
    }
    const id = window.setTimeout(() => setShowButtons(true), 5500)
    return () => window.clearTimeout(id)
  }, [on])

  if (!on) return null
  return (
    <>
      <div className="banner-wrap">
        <h1 className="banner">{formatBanner()}</h1>
      </div>
      {showButtons && (
        <div className="banner-actions">
          <button className="pill-btn pink big" onClick={openLetter}>
            {content.finale.readLetter}
          </button>
          <button className="pill-btn glass big" onClick={keep}>
            {content.finale.keepExploring}
          </button>
        </div>
      )}
    </>
  )
}
