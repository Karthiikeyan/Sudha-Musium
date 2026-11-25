import { useEffect } from 'react'
import { content } from '../config/content'
import { useStore } from '../state/store'

/** One of the three "Open when…" notes. Closing it counts it as read. */
export function NoteOverlay() {
  const phase = useStore((s) => s.phase)
  const index = useStore((s) => s.noteIndex)
  const readNote = useStore((s) => s.readNote)
  const exit = useStore((s) => s.exitInteraction)
  const open = phase === 'note'
  const note = content.openWhen[index]

  const close = () => {
    readNote(index)
    exit()
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useStore.getState().readNote(useStore.getState().noteIndex)
        useStore.getState().exitInteraction()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open || !note) return null
  return (
    <div className="letter-backdrop">
      <div className="letter-card note-card" role="dialog" aria-label={note.label}>
        <div className="letter-scroll">
          <div className="note-label">{note.label}</div>
          <h2>{note.title}</h2>
          <p className="note-body">{note.body}</p>
          <div className="letter-sign">{content.letter.signOff}</div>
        </div>
        <div className="letter-actions">
          <button className="pill-btn" onClick={close} autoFocus>
            {content.notes.close}
          </button>
        </div>
      </div>
    </div>
  )
}
