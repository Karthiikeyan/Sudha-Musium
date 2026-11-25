import { content, formatBanner } from '../config/content'
import { starRooms } from '../journey/progress'
import { useStore } from '../state/store'

/** "Happy 23rd Birthday, Sudha!" during the celebration, then the closing card with a small recap. */
export function FinalBanner() {
  const phase = useStore((s) => s.phase)
  const progress = useStore((s) => s.progress)
  const rooms = useStore((s) => s.rooms)
  const plan = useStore((s) => s.plan)
  const wander = useStore((s) => s.wander)
  const replay = useStore((s) => s.replayJourney)
  const busy = useStore((s) => !!s.transition)
  if ((phase !== 'celebration' && phase !== 'finale') || busy) return null
  const total = starRooms(rooms).length
  const photos = plan?.all.filter((n) => progress.seenPhotos.includes(n)).length ?? 0
  const recap = content.closing.recap
    .replace('{stars}', String(progress.stars.length))
    .replace('{total}', String(total))
    .replace('{photos}', String(photos))
  return (
    <>
      <div className="banner-wrap">
        <h1 className="banner">{formatBanner()}</h1>
      </div>
      {phase === 'finale' && (
        <div className="closing-wrap">
          <div className="closing-card" role="dialog" aria-label={content.closing.title}>
            <h2>{content.closing.title}</h2>
            <div className="closing-sign">{content.closing.sign}</div>
            <p className="closing-recap">
              {recap}
              {progress.friendQuizDone && <span className="closing-champ"> · {content.arcade.champion}</span>}
            </p>
            <div className="closing-actions">
              <button className="pill-btn pink big" onClick={wander} autoFocus>
                {content.closing.wander}
              </button>
              <button className="pill-btn soft big" onClick={replay}>
                {content.closing.replay}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
