// Decides which photo goes into which room. Pure function: config + photo list in, plan out.
import { autoChapters, chapters as cfgChapters, cinemaOrder } from '../config/journey'

export interface HallPlan {
  /** room id, e.g. "hall-1" */
  id: string
  no: number
  title: string
  subtitle: string
  photos: string[]
}

export interface CinemaSlide {
  name: string
  /** recap slides of hall photos are shown faster */
  quick: boolean
}

export interface JourneyPlan {
  halls: HallPlan[]
  cinema: CinemaSlide[]
  /** every photo name in display order (halls first, then cinema-only) */
  all: string[]
}

const MAX_HALLS = 3
const PER_HALL_SOFT = 6

function splitEven<T>(arr: T[], parts: number): T[][] {
  const out: T[][] = Array.from({ length: parts }, () => [])
  const base = Math.floor(arr.length / parts)
  let extra = arr.length % parts
  let k = 0
  for (let p = 0; p < parts; p++) {
    const n = base + (extra > 0 ? 1 : 0)
    if (extra > 0) extra--
    out[p] = arr.slice(k, k + n)
    k += n
  }
  return out
}

export function hallCountFor(heroCount: number) {
  return Math.max(1, Math.min(MAX_HALLS, Math.ceil(heroCount / 5)))
}

/**
 * @param names every available photo (or placeholder) name, in natural order. Never empty.
 */
export function planJourney(names: string[]): JourneyPlan {
  const exists = new Set(names)
  const used = new Set<string>()
  const take = (n: string) => {
    if (!exists.has(n) || used.has(n)) return false
    used.add(n)
    return true
  }

  // 1. chapters from config, keeping only files that are really there
  let groups = cfgChapters.map((c) => ({ id: c.id, title: c.title, subtitle: c.subtitle, photos: c.photos.filter(take) }))
  groups = groups.filter((g) => g.photos.length > 0)
  const cinemaFirst = cinemaOrder.filter(take)
  const leftovers = names.filter((n) => !used.has(n))

  let heroes: string[]
  let titles: { title: string; subtitle: string }[]
  let cinemaOnly: string[]

  if (groups.length === 0) {
    // nothing in the config matches: auto-plan (about two thirds of the photos go to the halls)
    const pool = [...cinemaFirst, ...leftovers]
    const heroCount = pool.length <= 3 ? pool.length : Math.max(1, Math.round((pool.length * 2) / 3))
    heroes = pool.slice(0, heroCount)
    cinemaOnly = pool.slice(heroCount)
    titles = autoChapters
  } else {
    heroes = groups.flatMap((g) => g.photos)
    titles = groups.map((g) => ({ title: g.title, subtitle: g.subtitle }))
    cinemaOnly = [...cinemaFirst]
    // unlisted photos: fill the last hall up to a comfortable size, the rest go to the cinema
    const lastSize = groups[groups.length - 1].photos.length
    let room = Math.max(0, PER_HALL_SOFT - lastSize)
    for (const n of leftovers) {
      if (room > 0) {
        heroes.push(n)
        groups[groups.length - 1].photos.push(n)
        room--
      } else cinemaOnly.push(n)
    }
  }

  // 2. number of halls follows the hero count; keep config grouping when it already fits
  const hallCount = hallCountFor(heroes.length)
  let hallPhotos: string[][]
  if (groups.length > 0 && groups.length === hallCount) hallPhotos = groups.map((g) => g.photos)
  else hallPhotos = splitEven(heroes, hallCount).filter((g) => g.length > 0)
  if (hallPhotos.length === 0) hallPhotos = [heroes]

  const halls: HallPlan[] = hallPhotos.map((photos, i) => ({
    id: `hall-${i + 1}`,
    no: i + 1,
    title: titles[i]?.title ?? autoChapters[i % autoChapters.length].title,
    subtitle: titles[i]?.subtitle ?? autoChapters[i % autoChapters.length].subtitle,
    photos,
  }))

  const cinema: CinemaSlide[] = [
    ...cinemaOnly.map((name) => ({ name, quick: false })),
    ...halls.flatMap((h) => h.photos).map((name) => ({ name, quick: true })),
  ]

  return { halls, cinema, all: [...halls.flatMap((h) => h.photos), ...cinemaOnly] }
}
