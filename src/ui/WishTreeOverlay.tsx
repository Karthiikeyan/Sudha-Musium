import { useEffect, useState } from 'react'
import { content } from '../config/content'
import { useStore } from '../state/store'

/** Hang a wish on the tree. Purely visual: nothing is stored or sent anywhere. */
export function WishTreeOverlay() {
  const phase = useStore((s) => s.phase)
  const addWish = useStore((s) => s.addWish)
  const exit = useStore((s) => s.exitInteraction)
  const [text, setText] = useState('')
  const open = phase === 'wishtree'
  const W = content.wishTree

  useEffect(() => {
    if (!open) setText('')
  }, [open])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, exit])

  if (!open) return null
  const hang = () => {
    addWish(text)
    exit()
    useStore.getState().say('sudha', W.thanks)
  }
  return (
    <div className="overlay-backdrop">
      <form
        className="letter-card wish-card"
        role="dialog"
        aria-label={W.title}
        onSubmit={(e) => {
          e.preventDefault()
          hang()
        }}
      >
        <div className="letter-scroll">
          <h2>{W.title} 🏮</h2>
          <p>{W.prompt}</p>
          <input
            className="wish-input"
            value={text}
            maxLength={40}
            placeholder={W.placeholder}
            onChange={(e) => setText(e.target.value.slice(0, 40))}
            autoFocus
            aria-label={W.placeholder}
          />
          <div className="wish-count">{text.length}/40</div>
          <p className="wish-private">{W.private}</p>
        </div>
        <div className="letter-actions">
          <button type="button" className="pill-btn soft" onClick={exit}>
            {W.cancel}
          </button>
          <button type="submit" className="pill-btn pink">
            {W.hang}
          </button>
        </div>
      </form>
    </div>
  )
}
