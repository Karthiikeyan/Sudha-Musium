import { create } from 'zustand'
import { content } from '../config/content'
import { captionFor } from '../config/captions'
import type { JourneyPlan } from '../journey/plan'
import {
  clearProgress,
  doorStatus,
  emptyProgress,
  isRoomComplete,
  missingStarRooms,
  nextRoomOf,
  saveProgress,
  starRooms,
  type Progress,
} from '../journey/progress'
import type { RoomDef } from '../journey/rooms'
import { isMuted, setMuted, sfx } from '../lib/audio'
import { want } from '../lib/photoCache'
import { resetActors, world } from '../lib/world'
import type { InteractKind, Interactable } from '../scene/layout'

export type Phase =
  | 'loading'
  | 'start'
  | 'intro'
  | 'explore'
  | 'viewing'
  | 'sitting'
  | 'screen'
  | 'cake'
  | 'celebration'
  | 'finale'
  | 'ticket'
  | 'cinema'
  | 'arcade'
  | 'note'
  | 'letter'
  | 'wishtree'

export type Who = 'karthik' | 'sudha'
export type CinemaStage = 'seating' | 'ready' | 'playing' | 'ended'

export interface Bubble {
  id: number
  text: string
}

export interface Interaction {
  id: string
  kind: InteractKind
  index: number
}

export interface Transition {
  to: string
  stage: 'out' | 'card' | 'in'
  label: string
  title: string
  subtitle: string
}

export interface PhotoInfo {
  caption: string
  guideLine?: string
}

interface State {
  phase: Phase
  loadProgress: number
  plan: JourneyPlan | null
  rooms: RoomDef[]
  roomId: string
  progress: Progress
  savedProgress: Progress | null
  transition: Transition | null
  doorOpening: boolean
  viewIndex: number
  benchIndex: number
  noteIndex: number
  nearby: Interaction | null
  pending: Interaction | null
  cinemaStage: CinemaStage
  cinemaCaption: string
  candlesOut: boolean
  roomEnteredAt: number
  hintAt: number
  wishes: string[]
  muted: boolean
  musicOk: boolean
  hintVisible: boolean
  bubbles: Record<Who, Bubble | null>
  restartKey: number
  dev: boolean

  room: () => RoomDef | undefined
  photoInfo: (name: string) => PhotoInfo
  setLoadProgress: (p: number) => void
  init: (plan: JourneyPlan, rooms: RoomDef[], saved: Progress | null, dev: boolean) => void
  setPhase: (p: Phase) => void
  setMusicOk: () => void
  startNew: () => void
  continueJourney: () => void
  finishIntro: () => void
  dismissHint: () => void
  setNearby: (n: Interactable | null) => void
  requestInteraction: (i: Interactable) => void
  cancelPending: () => void
  arrivedAtTarget: () => void
  startInteraction: (i: Interaction) => void
  exitInteraction: () => void
  gotoPhoto: (index: number) => void
  stepPhoto: (dir: 1 | -1) => void
  markSeen: (name: string) => void
  updateProgress: (patch: Partial<Progress>) => void
  collectStar: (roomId: string) => void
  showHint: () => void
  openDoor: () => void
  travel: (roomId: string) => void
  swapRoom: () => void
  setTransitionStage: (s: Transition['stage'] | null) => void
  setCinemaStage: (s: CinemaStage) => void
  setCinemaCaption: (c: string) => void
  finishCinema: () => void
  setQuiz: (patch: Partial<Pick<Progress, 'quizStep' | 'treatYes' | 'friendsYes'>>) => void
  closeScreen: () => void
  readNote: (i: number) => void
  readMainLetter: () => void
  blowOut: () => void
  startCelebration: () => void
  showFinale: () => void
  wander: () => void
  replayJourney: () => void
  addWish: (text: string) => void
  toggleMute: () => void
  say: (who: Who, text: string) => void
  clearBubbles: () => void
  devJump: (roomId: string) => void
  devUnlockAll: () => void
  skipRoom: () => void
  backToLobby: () => void
}

/* ─────────────── chat bubble queue (outside React; one bubble per avatar at a time) ─────────────── */
const BUBBLE_MS = 3500
const queues: Record<Who, string[]> = { karthik: [], sudha: [] }
const bubbleTimers: Record<Who, number | null> = { karthik: null, sudha: null }
let bubbleId = 1
let doorTimer: number | null = null
let introTimer: number | null = null

const now = () => (typeof performance !== 'undefined' ? performance.now() : 0)

/** photos a room needs on the GPU (the cinema streams its slides on its own) */
function roomPhotos(room: RoomDef | undefined, plan: JourneyPlan | null): string[] {
  if (!room) return []
  if (room.kind === 'hall') return room.hall?.photos ?? []
  if (room.kind === 'cinema' && plan) return plan.cinema.slice(0, 2).map((s) => s.name)
  return []
}

export const useStore = create<State>((set, get) => {
  const pump = (who: Who) => {
    if (bubbleTimers[who] !== null) return
    const text = queues[who].shift()
    if (text === undefined) {
      if (get().bubbles[who]) set((s) => ({ bubbles: { ...s.bubbles, [who]: null } }))
      return
    }
    set((s) => ({ bubbles: { ...s.bubbles, [who]: { id: bubbleId++, text } } }))
    sfx('pop')
    bubbleTimers[who] = window.setTimeout(() => {
      set((s) => ({ bubbles: { ...s.bubbles, [who]: null } }))
      bubbleTimers[who] = window.setTimeout(() => {
        bubbleTimers[who] = null
        pump(who)
      }, 220)
    }, BUBBLE_MS)
  }

  /** merge, mark newly completed rooms, persist, and announce an unlocked door */
  const commit = (next: Progress) => {
    const s = get()
    const before = s.room()
    const wasOpen = before ? doorStatus(before, s.rooms, s.progress).open : false
    const completed = [...next.completed]
    s.rooms.forEach((r) => {
      if (!completed.includes(r.id) && isRoomComplete(r, { ...next, completed: [] })) completed.push(r.id)
    })
    const p: Progress = { ...next, completed }
    set({ progress: p })
    saveProgress(p)
    if (before && before.kind !== 'rooftop') {
      const st = doorStatus(before, s.rooms, p)
      const doneNow = isRoomComplete(before, p) && !isRoomComplete(before, s.progress)
      if (st.open && !wasOpen) {
        sfx('chime')
        get().say('karthik', st.line)
      } else if (!st.open && doneNow) {
        get().say('karthik', st.line)
      }
    }
  }

  const enterRoom = (id: string, first: boolean) => {
    const s = get()
    const room = s.rooms.find((r) => r.id === id) ?? s.rooms[0]
    if (!room) return
    world.layout = room.layout
    resetActors(room.layout)
    const nextRoom = nextRoomOf(room, s.rooms)
    want('room', [...roomPhotos(room, s.plan), ...roomPhotos(nextRoom, s.plan)])
    const p = s.progress
    const visited = p.visited.includes(room.id) ? p.visited : [...p.visited, room.id]
    set({
      roomId: room.id,
      nearby: null,
      pending: null,
      doorOpening: false,
      candlesOut: room.kind === 'rooftop' ? s.progress.finaleDone : false,
      cinemaStage: 'seating',
      cinemaCaption: '',
      roomEnteredAt: now(),
      hintAt: 0,
      restartKey: s.restartKey + 1,
    })
    commit({ ...p, visited, currentRoomId: room.id })
    if (first) {
      const kind = room.kind
      const lines = content.roomIntros[kind] ?? []
      if (introTimer !== null) window.clearTimeout(introTimer)
      introTimer = window.setTimeout(() => {
        introTimer = null
        lines.forEach((t) => get().say('karthik', t))
      }, 900)
    }
  }

  return {
    phase: 'loading',
    loadProgress: 0,
    plan: null,
    rooms: [],
    roomId: 'lobby',
    progress: emptyProgress(),
    savedProgress: null,
    transition: null,
    doorOpening: false,
    viewIndex: 0,
    benchIndex: 0,
    noteIndex: 0,
    nearby: null,
    pending: null,
    cinemaStage: 'seating',
    cinemaCaption: '',
    candlesOut: false,
    roomEnteredAt: 0,
    hintAt: 0,
    wishes: [],
    muted: isMuted(),
    musicOk: false,
    hintVisible: false,
    bubbles: { karthik: null, sudha: null },
    restartKey: 0,
    dev: false,

    room: () => {
      const s = get()
      return s.rooms.find((r) => r.id === s.roomId)
    },
    photoInfo: (name) => {
      const all = get().plan?.all ?? []
      if (name.startsWith('placeholder-')) return { caption: 'Add a photo to public/images 📷', guideLine: 'This frame is waiting for a photo 📷' }
      const c = captionFor(name, Math.max(0, all.indexOf(name)))
      return { caption: c.caption, guideLine: c.guideLine }
    },
    setLoadProgress: (p) => set({ loadProgress: Math.max(0, Math.min(1, p)) }),
    init: (plan, rooms, saved, dev) => {
      set({ plan, rooms, savedProgress: saved, dev })
      // show the lobby behind the start screen
      const lobby = rooms[0]
      world.layout = lobby.layout
      resetActors(lobby.layout)
      set({ roomId: lobby.id })
    },
    setPhase: (p) => set({ phase: p }),
    setMusicOk: () => set({ musicOk: true }),

    startNew: () => {
      const s = get()
      if (s.phase !== 'start') return
      clearProgress()
      get().clearBubbles()
      set({ progress: emptyProgress(), savedProgress: null, wishes: [], phase: 'intro' })
      enterRoom(s.rooms[0].id, false)
    },
    continueJourney: () => {
      const s = get()
      if (s.phase !== 'start' || !s.savedProgress) return
      const saved = s.savedProgress
      const target = s.rooms.find((r) => r.id === saved.currentRoomId && saved.visited.includes(r.id)) ?? s.rooms[0]
      set({ progress: saved, phase: 'explore' })
      enterRoom(target.id, false)
    },
    finishIntro: () => {
      if (get().phase !== 'intro') return
      set({ phase: 'explore', hintVisible: true })
      const lobby = get().rooms[0]
      if (lobby) content.roomIntros.lobby.forEach((t) => get().say('karthik', t))
    },
    dismissHint: () => set({ hintVisible: false }),

    setNearby: (n) => {
      const s = get()
      const cur = s.nearby
      if (!n) {
        if (cur) set({ nearby: null })
        return
      }
      if (cur && cur.id === n.id) return
      set({ nearby: { id: n.id, kind: n.kind, index: n.index } })
      if (n.kind === 'door') {
        const room = s.room()
        if (room) {
          const st = doorStatus(room, s.rooms, s.progress)
          if (!st.open) s.say('karthik', st.line)
        }
      }
    },

    requestInteraction: (i) => {
      const s = get()
      if (s.phase !== 'explore' || s.transition) return
      world.walkTarget = { x: i.walkTo.x, z: i.walkTo.z }
      world.walkTargetAge = 0
      set({ pending: { id: i.id, kind: i.kind, index: i.index } })
    },
    cancelPending: () => {
      if (get().pending) set({ pending: null })
    },
    arrivedAtTarget: () => {
      const p = get().pending
      world.walkTarget = null
      if (p) {
        set({ pending: null })
        get().startInteraction(p)
      }
    },

    startInteraction: (i) => {
      const s = get()
      if (s.phase !== 'explore' || s.transition) return
      world.walkTarget = null
      const base = { pending: null, nearby: null }
      switch (i.kind) {
        case 'photo': {
          const room = s.room()
          const name = room?.layout.frames[i.index]?.name
          if (name) get().markSeen(name)
          set({ ...base, phase: 'viewing', viewIndex: i.index })
          sfx('sparkle')
          break
        }
        case 'bench':
          set({ ...base, phase: 'sitting', benchIndex: i.index })
          break
        case 'screen':
          set({ ...base, phase: 'screen' })
          break
        case 'cake':
          if (s.candlesOut) {
            s.say('karthik', 'The candles are out… but there is still cake 😋')
            return
          }
          set({ ...base, phase: 'cake' })
          break
        case 'door':
          get().openDoor()
          break
        case 'ticket':
          set({ ...base, phase: 'ticket' })
          break
        case 'seats':
          set({ ...base, phase: 'cinema', cinemaStage: 'seating', cinemaCaption: '' })
          break
        case 'arcade':
          set({ ...base, phase: 'arcade' })
          break
        case 'envelope':
          set({ ...base, phase: 'note', noteIndex: i.index })
          sfx('page')
          break
        case 'letter':
          if (s.progress.lettersOpened.length < content.openWhen.length) {
            s.say('karthik', content.sealed.locked)
            return
          }
          set({ ...base, phase: 'letter' })
          sfx('page')
          break
        case 'wishtree':
          set({ ...base, phase: 'wishtree' })
          break
      }
    },
    exitInteraction: () => {
      const s = get()
      const ph = s.phase
      if (ph === 'cinema' && s.cinemaStage === 'playing') return
      if (['viewing', 'sitting', 'screen', 'cake', 'ticket', 'cinema', 'arcade', 'note', 'wishtree'].includes(ph)) {
        if (ph === 'ticket') get().updateProgress({ ticketTaken: true })
        set({ phase: 'explore', nearby: null })
      }
    },
    gotoPhoto: (index) => {
      const room = get().room()
      const frames = room?.layout.frames ?? []
      if (!frames.length) return
      const i = ((index % frames.length) + frames.length) % frames.length
      get().markSeen(frames[i].name)
      set({ viewIndex: i })
      sfx('sparkle')
    },
    stepPhoto: (dir) => {
      if (get().phase !== 'viewing') return
      get().gotoPhoto(get().viewIndex + dir)
    },
    markSeen: (name) => {
      const p = get().progress
      if (p.seenPhotos.includes(name)) return
      commit({ ...p, seenPhotos: [...p.seenPhotos, name] })
    },
    updateProgress: (patch) => commit({ ...get().progress, ...patch }),

    collectStar: (roomId) => {
      const s = get()
      if (s.progress.stars.includes(roomId) || s.transition) return
      const stars = [...s.progress.stars, roomId]
      commit({ ...s.progress, stars })
      sfx('chime')
      const total = starRooms(s.rooms).length
      s.say('karthik', stars.length >= total ? content.journey.allStars : content.journey.starFound)
    },
    showHint: () => {
      const s = get()
      const room = s.room()
      if (!room || !room.layout.star || s.progress.stars.includes(room.id)) return
      set({ hintAt: now() })
      s.say('karthik', room.starHint)
    },

    openDoor: () => {
      const s = get()
      const room = s.room()
      if (!room || s.transition || s.doorOpening) return
      const st = doorStatus(room, s.rooms, s.progress)
      if (!st.open) {
        s.say('karthik', st.line)
        return
      }
      const next = nextRoomOf(room, s.rooms)
      if (!next) return
      set({ doorOpening: true, nearby: null, pending: null, phase: 'explore' })
      world.walkTarget = null
      sfx('door')
      if (doorTimer !== null) window.clearTimeout(doorTimer)
      doorTimer = window.setTimeout(() => {
        doorTimer = null
        get().travel(next.id)
      }, 650)
    },
    travel: (roomId) => {
      const s = get()
      if (s.transition) return
      const room = s.rooms.find((r) => r.id === roomId)
      if (!room) return
      world.walkTarget = null
      set({
        transition: { to: room.id, stage: 'out', label: room.chapterLabel, title: room.title, subtitle: room.subtitle },
        nearby: null,
        pending: null,
        phase: s.phase === 'loading' || s.phase === 'start' ? s.phase : 'explore',
      })
    },
    swapRoom: () => {
      const s = get()
      const t = s.transition
      if (!t) return
      const first = !s.progress.visited.includes(t.to)
      get().clearBubbles()
      enterRoom(t.to, first)
      set({ transition: { ...t, stage: 'card' } })
    },
    setTransitionStage: (stage) => {
      const t = get().transition
      if (!t) return
      set({ transition: stage ? { ...t, stage } : null })
    },

    setCinemaStage: (c) => set({ cinemaStage: c }),
    setCinemaCaption: (c) => {
      if (get().cinemaCaption !== c) set({ cinemaCaption: c })
    },
    finishCinema: () => {
      const s = get()
      if (s.phase !== 'cinema') return
      set({ cinemaStage: 'ended', cinemaCaption: '' })
      if (!s.progress.cinemaDone) get().updateProgress({ cinemaDone: true })
    },

    setQuiz: (patch) => get().updateProgress(patch),
    closeScreen: () => {
      if (get().phase !== 'screen') return
      set({ phase: 'explore', nearby: null })
    },

    readNote: (i) => {
      const p = get().progress
      if (!p.lettersOpened.includes(i)) commit({ ...p, lettersOpened: [...p.lettersOpened, i] })
    },
    readMainLetter: () => {
      const p = get().progress
      set({ phase: 'explore', nearby: null })
      if (!p.mainLetterRead) commit({ ...p, mainLetterRead: true })
    },

    blowOut: () => {
      if (get().phase === 'cake' && !get().candlesOut) {
        set({ candlesOut: true })
        sfx('blow')
      }
    },
    startCelebration: () => {
      if (get().phase !== 'cake') return
      set({ phase: 'celebration' })
      sfx('tada')
    },
    showFinale: () => {
      if (get().phase !== 'celebration') return
      set({ phase: 'finale' })
      get().updateProgress({ finaleDone: true })
    },
    wander: () => {
      const s = get()
      // free roam: every room becomes reachable from the map
      commit({ ...s.progress, visited: s.rooms.map((r) => r.id), finaleDone: true })
      set({ phase: 'explore', nearby: null })
    },
    replayJourney: () => {
      clearProgress()
      get().clearBubbles()
      set({ progress: emptyProgress(), wishes: [], candlesOut: false, phase: 'explore' })
      get().travel('lobby')
    },
    addWish: (text) => {
      const t = text.trim().slice(0, 40)
      set((s) => ({ wishes: [...s.wishes, t] }))
      sfx('chime')
    },

    toggleMute: () => {
      const m = !get().muted
      setMuted(m)
      set({ muted: m })
    },

    say: (who, text) => {
      if (!text || queues[who].length >= 3) return
      queues[who].push(text)
      pump(who)
    },
    clearBubbles: () => {
      ;(['karthik', 'sudha'] as Who[]).forEach((w) => {
        queues[w].length = 0
        if (bubbleTimers[w] !== null) {
          window.clearTimeout(bubbleTimers[w] as number)
          bubbleTimers[w] = null
        }
      })
      set({ bubbles: { karthik: null, sudha: null } })
    },

    devJump: (roomId) => {
      const s = get()
      if (s.phase === 'loading' || s.phase === 'start' || s.phase === 'intro') set({ phase: 'explore' })
      const p = s.progress
      if (!p.visited.includes(roomId)) commit({ ...p, visited: [...p.visited, roomId] })
      get().travel(roomId)
    },
    devUnlockAll: () => {
      const s = get()
      commit({
        ...s.progress,
        visited: s.rooms.map((r) => r.id),
        stars: starRooms(s.rooms).map((r) => r.id),
        completed: s.rooms.filter((r) => r.kind !== 'rooftop').map((r) => r.id),
        ticketTaken: true,
        cinemaDone: true,
        treatYes: true,
        friendsYes: true,
        quizStep: 2,
        lettersOpened: content.openWhen.map((_, i) => i),
        mainLetterRead: true,
        seenPhotos: s.plan?.all ?? [],
      })
    },
    skipRoom: () => {
      const s = get()
      const room = s.room()
      if (!room) return
      const p = s.progress
      const stars = room.layout.star && !p.stars.includes(room.id) ? [...p.stars, room.id] : p.stars
      const completed = p.completed.includes(room.id) ? p.completed : [...p.completed, room.id]
      commit({ ...p, stars, completed })
      set({ phase: 'explore' })
      const next = nextRoomOf(room, s.rooms)
      if (next) {
        const missing = next.kind === 'rooftop' ? missingStarRooms(s.rooms, get().progress) : []
        get().travel(missing.length ? missing[0].id : next.id)
      }
    },
    backToLobby: () => {
      set({ phase: 'explore' })
      get().travel('lobby')
    },
  }
})
