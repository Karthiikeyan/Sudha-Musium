import { create } from 'zustand'
import { content } from '../config/content'
import { isMuted, setMuted, sfx } from '../lib/audio'
import { resetActors, world } from '../lib/world'
import { buildLayout, type InteractKind, type Interactable, type Layout } from '../scene/layout'

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
  | 'letter'

export type Who = 'karthik' | 'sudha'

export interface Bubble {
  id: number
  text: string
}

export interface PhotoMeta {
  name: string
  url: string
  aspect: number
  placeholder: boolean
  caption: string
  guideLine?: string
}

export interface Interaction {
  id: string
  kind: InteractKind
  index: number
}

interface State {
  phase: Phase
  progress: number
  photos: PhotoMeta[]
  layout: Layout | null
  seen: Record<number, true>
  viewIndex: number
  benchIndex: number
  nearby: Interaction | null
  pending: Interaction | null
  quizStep: 0 | 1 | 2
  treatYes: boolean
  friendsYes: boolean
  cakeUnlocked: boolean
  candlesOut: boolean
  muted: boolean
  musicOk: boolean
  hintVisible: boolean
  bubbles: Record<Who, Bubble | null>
  restartKey: number

  setProgress: (p: number) => void
  setPhase: (p: Phase) => void
  setPhotos: (p: PhotoMeta[]) => void
  setMusicOk: () => void
  beginIntro: () => void
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
  setQuiz: (patch: Partial<Pick<State, 'quizStep' | 'treatYes' | 'friendsYes'>>) => void
  closeScreen: () => void
  blowOut: () => void
  startCelebration: () => void
  openLetter: () => void
  keepExploring: () => void
  replay: () => void
  toggleMute: () => void
  say: (who: Who, text: string) => void
  clearBubbles: () => void
}

/* ─────────────── chat bubble queue (outside React; one bubble per avatar at a time) ─────────────── */
const BUBBLE_MS = 3500
const queues: Record<Who, string[]> = { karthik: [], sudha: [] }
const bubbleTimers: Record<Who, number | null> = { karthik: null, sudha: null }
let bubbleId = 1

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

  const markSeen = (index: number) => {
    if (!get().seen[index]) set((s) => ({ seen: { ...s.seen, [index]: true } }))
  }

  return {
    phase: 'loading',
    progress: 0,
    photos: [],
    layout: null,
    seen: {},
    viewIndex: 0,
    benchIndex: 0,
    nearby: null,
    pending: null,
    quizStep: 0,
    treatYes: false,
    friendsYes: false,
    cakeUnlocked: false,
    candlesOut: false,
    muted: isMuted(),
    musicOk: false,
    hintVisible: false,
    bubbles: { karthik: null, sudha: null },
    restartKey: 0,

    setProgress: (p) => set({ progress: Math.max(0, Math.min(1, p)) }),
    setPhase: (p) => set({ phase: p }),
    setPhotos: (photos) => {
      const layout = buildLayout(photos.length)
      world.layout = layout
      resetActors(layout)
      set({ photos, layout })
    },
    setMusicOk: () => set({ musicOk: true }),

    beginIntro: () => {
      if (get().phase === 'start') set({ phase: 'intro' })
    },
    finishIntro: () => {
      if (get().phase === 'intro') set({ phase: 'explore', hintVisible: true })
    },
    dismissHint: () => set({ hintVisible: false }),

    setNearby: (n) => {
      const cur = get().nearby
      if (!n) {
        if (cur) set({ nearby: null })
        return
      }
      if (cur && cur.id === n.id) return
      set({ nearby: { id: n.id, kind: n.kind, index: n.index } })
    },

    requestInteraction: (i) => {
      const s = get()
      if (s.phase !== 'explore') return
      if (i.kind === 'cake' && (!s.cakeUnlocked || s.candlesOut)) return
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
      if (s.phase !== 'explore') return
      world.walkTarget = null
      switch (i.kind) {
        case 'photo':
          markSeen(i.index)
          set({ phase: 'viewing', viewIndex: i.index, pending: null, nearby: null })
          sfx('sparkle')
          break
        case 'bench':
          set({ phase: 'sitting', benchIndex: i.index, pending: null, nearby: null })
          break
        case 'screen':
          set({ phase: 'screen', pending: null, nearby: null })
          break
        case 'cake':
          if (!s.cakeUnlocked || s.candlesOut) return
          set({ phase: 'cake', pending: null, nearby: null })
          break
      }
    },
    exitInteraction: () => {
      const ph = get().phase
      if (ph === 'viewing' || ph === 'sitting' || ph === 'cake' || ph === 'screen') set({ phase: 'explore', nearby: null })
    },
    gotoPhoto: (index) => {
      const n = get().photos.length
      if (n === 0) return
      const i = ((index % n) + n) % n
      markSeen(i)
      set({ viewIndex: i })
      sfx('sparkle')
    },
    stepPhoto: (dir) => {
      if (get().phase !== 'viewing') return
      get().gotoPhoto(get().viewIndex + dir)
    },

    setQuiz: (patch) => set(patch),
    closeScreen: () => {
      const s = get()
      if (s.phase !== 'screen') return
      if (s.friendsYes && !s.cakeUnlocked) {
        world.cakeSolid = true
        set({ cakeUnlocked: true, phase: 'explore', nearby: null })
        content.quiz.afterQuiz.forEach((t) => get().say('karthik', t))
      } else {
        set({ phase: 'explore', nearby: null })
      }
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
    openLetter: () => {
      if (get().phase === 'celebration') set({ phase: 'letter' })
    },
    keepExploring: () => {
      const ph = get().phase
      if (ph === 'celebration' || ph === 'letter') {
        set({ phase: 'explore', nearby: null })
        content.finale.postCelebration.forEach((t) => get().say('karthik', t))
      }
    },

    replay: () => {
      const layout = get().layout
      get().clearBubbles()
      world.cakeSolid = false
      if (layout) resetActors(layout)
      set((s) => ({
        seen: {},
        quizStep: 0,
        treatYes: false,
        friendsYes: false,
        cakeUnlocked: false,
        candlesOut: false,
        nearby: null,
        pending: null,
        phase: 'explore',
        restartKey: s.restartKey + 1,
      }))
    },

    toggleMute: () => {
      const m = !get().muted
      setMuted(m)
      set({ muted: m })
    },

    say: (who, text) => {
      if (queues[who].length >= 3) return
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
  }
})
