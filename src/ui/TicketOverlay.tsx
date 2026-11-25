import { useEffect } from 'react'
import { content } from '../config/content'
import { useStore } from '../state/store'

/** The paper museum ticket (perforated edge, CSS barcode). Closing it marks the ticket as taken. */
export function TicketOverlay() {
  const phase = useStore((s) => s.phase)
  const exit = useStore((s) => s.exitInteraction)
  const open = phase === 'ticket'
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, exit])
  if (!open) return null
  const t = content.ticket
  const date = `${content.birthday.day} ${content.birthday.month.slice(0, 3).toUpperCase()} ${content.birthday.year}`
  return (
    <div className="overlay-backdrop">
      <div className="ticket" role="dialog" aria-label="Your museum ticket">
        <div className="ticket-main">
          <div className="ticket-admit">{t.admit}</div>
          <div className="ticket-museum">{t.museum}</div>
          <div className="ticket-name">{content.recipientName.toUpperCase()}</div>
          <div className="ticket-row">
            <span>{date}</span>
            <span>{t.gate}</span>
          </div>
          <div className="ticket-seat">{t.seat}</div>
          <div className="ticket-note">{t.note}</div>
        </div>
        <div className="ticket-stub">
          <div className="barcode" aria-hidden="true" />
          <div className="stub-no">No. 0023</div>
        </div>
      </div>
      <button className="pill-btn pink big ticket-close" onClick={exit} autoFocus>
        {t.close}
      </button>
    </div>
  )
}
