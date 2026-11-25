import {
  MASCOT_ARMS_DOWN,
  MASCOT_ARMS_UP,
  MASCOT_BACK,
  MASCOT_EYES_HAPPY,
  MASCOT_EYES_OPEN,
  MASCOT_FACE,
  MASCOT_HEAD,
  type MascotMood,
  type Shape,
} from '../lib/mascotShapes'

function Paths({ shapes }: { shapes: Shape[] }) {
  return (
    <>
      {shapes.map((s, i) => (
        <path
          key={i}
          d={s.d}
          fill={s.fill ?? 'none'}
          stroke={s.stroke}
          strokeWidth={s.lw}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={s.opacity}
        />
      ))}
    </>
  )
}

/** The original cat mascot. Blinks, bobs, and throws its arms up when it's happy. */
export function Mascot({ mood = 'idle', size = 150 }: { mood?: MascotMood; size?: number }) {
  return (
    <svg className={'mascot' + (mood === 'happy' ? ' happy' : '')} width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="A cute cartoon cat in a party hat">
      <g className="mascot-body">
        <Paths shapes={MASCOT_BACK} />
        <Paths shapes={mood === 'happy' ? MASCOT_ARMS_UP : MASCOT_ARMS_DOWN} />
        <Paths shapes={MASCOT_HEAD} />
        <g className={mood === 'happy' ? '' : 'mascot-eyes'}>
          <Paths shapes={mood === 'happy' ? MASCOT_EYES_HAPPY : MASCOT_EYES_OPEN} />
        </g>
        <Paths shapes={MASCOT_FACE} />
      </g>
    </svg>
  )
}
