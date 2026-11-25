// Progress model + every unlock rule (single source of truth) + localStorage persistence.
import { content } from '../config/content'
import { safeStorageGet, safeStorageSet } from '../lib/device'
import type { RoomDef } from './rooms'

export interface Progress {
  currentRoomId: string
  visited: string[]
  completed: string[]
  stars: string[]
  seenPhotos: string[]
  giftOpened: boolean
  ticketTaken: boolean
  cinemaDone: boolean
  quizStep: 0 | 1 | 2
  treatYes: boolean
  friendsYes: boolean
  friendQuizDone: boolean
  lettersOpened: number[]
  mainLetterRead: boolean
  finaleDone: boolean
}

export const STORAGE_KEY = 'sudha-museum-v2'

export const emptyProgress = (): Progress => ({
  currentRoomId: 'lobby',
  visited: [],
  completed: [],
  stars: [],
  seenPhotos: [],
  giftOpened: false,
  ticketTaken: false,
  cinemaDone: false,
  quizStep: 0,
  treatYes: false,
  friendsYes: false,
  friendQuizDone: false,
  lettersOpened: [],
  mainLetterRead: false,
  finaleDone: false,
})

/** How many photos of a hall must be seen: 70 %, at least 3 (or all of them if the hall has fewer). */
export function hallRequired(count: number) {
  if (count <= 0) return 0
  return Math.min(count, Math.max(3, Math.ceil(count * 0.7)))
}

export function hallSeen(room: RoomDef, p: Progress) {
  const photos = room.hall?.photos ?? []
  return photos.filter((n) => p.seenPhotos.includes(n)).length
}

/** The task of the room itself is done (ignores stars). Completed rooms stay completed. */
export function isRoomComplete(room: RoomDef, p: Progress): boolean {
  if (p.completed.includes(room.id)) return true
  switch (room.kind) {
    case 'lobby':
      return p.ticketTaken
    case 'hall': {
      const n = room.hall?.photos.length ?? 0
      return hallSeen(room, p) >= hallRequired(n)
    }
    case 'cinema':
      return p.cinemaDone
    case 'lounge':
      return p.treatYes && p.friendsYes
    case 'post-office':
      return p.mainLetterRead
    case 'rooftop':
      return p.finaleDone
  }
}

export const starRooms = (rooms: RoomDef[]) => rooms.filter((r) => r.layout.star)
export const missingStarRooms = (rooms: RoomDef[], p: Progress) => starRooms(rooms).filter((r) => !p.stars.includes(r.id))

export function nextRoomOf(room: RoomDef, rooms: RoomDef[]): RoomDef | undefined {
  return rooms[room.order + 1]
}

export interface DoorStatus {
  open: boolean
  /** what Karthik says when the door is locked (or that it is open) */
  line: string
}

/** The forward door of `room`. The door into the rooftop also needs every star. */
export function doorStatus(room: RoomDef, rooms: RoomDef[], p: Progress): DoorStatus {
  const next = nextRoomOf(room, rooms)
  if (!next) return { open: false, line: '' }
  const L = content.doorLines
  if (!isRoomComplete(room, p)) {
    let line = ''
    switch (room.kind) {
      case 'lobby':
        line = L.lobby
        break
      case 'hall': {
        const n = room.hall?.photos.length ?? 0
        line = L.hall.replace('{n}', String(Math.max(1, hallRequired(n) - hallSeen(room, p))))
        break
      }
      case 'cinema':
        line = L.cinema
        break
      case 'lounge':
        line = L.lounge
        break
      case 'post-office':
        line = L['post-office']
        break
      default:
        line = ''
    }
    return { open: false, line }
  }
  if (next.kind === 'rooftop') {
    const missing = missingStarRooms(rooms, p)
    if (missing.length) {
      const names = missing.map((r) => (r.kind === 'hall' ? r.name : 'the ' + r.name))
      const list = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0]
      return { open: false, line: L.stars.replace('{rooms}', list) }
    }
  }
  return { open: true, line: L.unlocked }
}

/** A room can be entered by walking through the previous door. */
export function canEnter(room: RoomDef, rooms: RoomDef[], p: Progress): boolean {
  if (room.order === 0) return true
  const prev = rooms[room.order - 1]
  return doorStatus(prev, rooms, p).open
}

/** Map fast-travel is allowed to any room that was visited before. */
export const canTravel = (room: RoomDef, p: Progress) => p.visited.includes(room.id)

/* ─────────────────────────────── persistence ─────────────────────────────── */

export function loadProgress(): Progress | null {
  const raw = safeStorageGet(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<Progress>
    if (!parsed || typeof parsed !== 'object') return null
    const base = emptyProgress()
    const arr = <T,>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fallback)
    return {
      ...base,
      ...parsed,
      visited: arr<string>(parsed.visited, []),
      completed: arr<string>(parsed.completed, []),
      stars: arr<string>(parsed.stars, []),
      seenPhotos: arr<string>(parsed.seenPhotos, []),
      lettersOpened: arr<number>(parsed.lettersOpened, []),
      quizStep: parsed.quizStep === 1 || parsed.quizStep === 2 ? parsed.quizStep : 0,
      currentRoomId: typeof parsed.currentRoomId === 'string' ? parsed.currentRoomId : 'lobby',
    }
  } catch {
    return null
  }
}

export function saveProgress(p: Progress) {
  try {
    safeStorageSet(STORAGE_KEY, JSON.stringify(p))
  } catch {
    /* storage blocked: keep it in memory only */
  }
}

export function clearProgress() {
  safeStorageSet(STORAGE_KEY, '')
}
