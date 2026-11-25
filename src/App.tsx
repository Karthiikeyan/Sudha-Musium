import { useEffect, useState } from 'react'
import photoNames from './generated/photos.json'
import { planJourney } from './journey/plan'
import { loadProgress } from './journey/progress'
import { buildRooms } from './journey/rooms'
import { disposeAudio, initMusic } from './lib/audio'
import { configurePhotos, disposeAllPhotos, preload, release } from './lib/photoCache'
import { ensureFonts } from './lib/textures'
import { hasWebGL } from './lib/webgl'
import { world } from './lib/world'
import { Museum } from './scene/Museum'
import { useStore } from './state/store'
import { DevPanel } from './ui/DevPanel'
import { ErrorFallback, RoomBoundary } from './ui/ErrorFallback'
import { FinalBanner } from './ui/FinalBanner'
import { Hud } from './ui/Hud'
import { LetterOverlay } from './ui/LetterOverlay'
import { LoadingScreen } from './ui/LoadingScreen'
import { RoomTransition } from './ui/RoomTransition'
import { ScreenQuiz } from './ui/ScreenQuiz'
import { StartScreen } from './ui/StartScreen'
import { TicketOverlay } from './ui/TicketOverlay'
import { WishOverlay } from './ui/WishOverlay'

function readParams() {
  try {
    const q = new URLSearchParams(window.location.search)
    return { dev: q.get('dev') === '1', room: q.get('room'), debug: q.has('debug') || q.get('dev') === '1' }
  } catch {
    return { dev: false, room: null as string | null, debug: false }
  }
}

export default function App() {
  const [webgl] = useState(() => hasWebGL())
  const [ready, setReady] = useState(false)
  const [lost, setLost] = useState(false)
  const [canvasKey, setCanvasKey] = useState(0)
  const [params] = useState(readParams)
  const phase = useStore((s) => s.phase)

  useEffect(() => {
    if (!webgl) return
    let cancelled = false
    const store = useStore.getState()
    initMusic(() => useStore.getState().setMusicOk())
    const real = photoNames as string[]
    // no photos at all? 12 placeholder frames keep every room working
    const names = real.length ? real : Array.from({ length: 12 }, (_, i) => `placeholder-${i + 1}`)
    configurePhotos(names)
    const plan = planJourney(names)
    const rooms = buildRooms(plan)
    store.init(plan, rooms, loadProgress(), params.dev)
    void (async () => {
      const fonts = ensureFonts()
      // warm up the first Memory Lane hall while the loading screen shows
      await preload('boot', plan.halls[0]?.photos ?? [], (d, t) => store.setLoadProgress(0.05 + 0.9 * (d / t)), () => cancelled)
      await fonts
      if (cancelled) return
      store.setLoadProgress(1)
      setReady(true)
    })()
    return () => {
      cancelled = true
      release('boot')
      disposeAllPhotos()
      disposeAudio()
    }
  }, [webgl, params.dev])

  // the boot preload is handed over to the room once the journey starts
  useEffect(() => {
    if (phase !== 'loading' && phase !== 'start') release('boot')
  }, [phase])

  // ?dev=1&room=cinema jumps straight into a room once loading is done
  useEffect(() => {
    if (!params.dev || !params.room || phase !== 'start') return
    const st = useStore.getState()
    if (st.rooms.some((r) => r.id === params.room)) st.devJump(params.room)
  }, [params, phase])

  // developer aid: ?debug (or ?dev=1) exposes the world/store on window.__museum (used by automated tests)
  useEffect(() => {
    if (!params.debug) return
    try {
      ;(window as unknown as { __museum?: unknown }).__museum = { world, store: useStore }
    } catch {
      /* ignore */
    }
  }, [params.debug])

  if (!webgl) return <ErrorFallback reason="webgl" />

  return (
    <>
      {ready && (
        <RoomBoundary
          key={canvasKey}
          onReset={() => setCanvasKey((k) => k + 1)}
          onSkip={() => useStore.getState().skipRoom()}
          onLobby={() => useStore.getState().backToLobby()}
        >
          <Museum onContextLost={() => setLost(true)} onContextRestored={() => setLost(false)} />
        </RoomBoundary>
      )}
      <Hud />
      <TicketOverlay />
      <ScreenQuiz />
      <WishOverlay />
      <FinalBanner />
      <LetterOverlay />
      <RoomTransition />
      <StartScreen />
      <LoadingScreen />
      <DevPanel />
      {lost && (
        <div className="reload-note" role="alert">
          <div>Reloading the museum…</div>
          <button className="pill-btn" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      )}
    </>
  )
}
