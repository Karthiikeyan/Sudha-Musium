import { useEffect, useState } from 'react'
import photoNames from './generated/photos.json'
import { captionFor } from './config/captions'
import { disposeAudio, initMusic } from './lib/audio'
import { isTouch } from './lib/device'
import { disposePhotoTextures, ensureFonts, loadPhotos } from './lib/textures'
import { hasWebGL } from './lib/webgl'
import { world } from './lib/world'
import { Museum } from './scene/Museum'
import { useStore, type PhotoMeta } from './state/store'
import { ErrorFallback } from './ui/ErrorFallback'
import { FinalBanner } from './ui/FinalBanner'
import { Hud } from './ui/Hud'
import { LetterOverlay } from './ui/LetterOverlay'
import { LoadingScreen } from './ui/LoadingScreen'
import { ScreenQuiz } from './ui/ScreenQuiz'
import { StartScreen } from './ui/StartScreen'
import { WishOverlay } from './ui/WishOverlay'

export default function App() {
  const [webgl] = useState(() => hasWebGL())
  const [ready, setReady] = useState(false)
  const [lost, setLost] = useState(false)

  useEffect(() => {
    if (!webgl) return
    let cancelled = false
    const store = useStore.getState()
    initMusic(() => useStore.getState().setMusicOk())
    const names = photoNames as string[]
    void (async () => {
      const fonts = ensureFonts()
      const loaded = await loadPhotos(
        names,
        isTouch(),
        (done, total) => store.setProgress(0.04 + 0.94 * (done / total)),
        () => cancelled,
      )
      await fonts
      if (cancelled) return
      const metas: PhotoMeta[] = loaded.map((p, i) => {
        const c = captionFor(p.name, i)
        return {
          name: p.name,
          url: p.url,
          aspect: p.aspect,
          placeholder: p.placeholder,
          caption: p.placeholder && names.length === 0 ? 'Add a photo to public/images 📷' : c.caption,
          guideLine: c.guideLine,
        }
      })
      store.setPhotos(metas)
      setReady(true)
      store.setProgress(1)
    })()
    return () => {
      cancelled = true
      disposePhotoTextures()
      disposeAudio()
    }
  }, [webgl])

  // tiny developer aid: open the page with ?debug to reach the world/store from the console (used for testing)
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).has('debug')) {
        ;(window as unknown as { __museum?: unknown }).__museum = { world, store: useStore }
      }
    } catch {
      /* ignore */
    }
  }, [])

  if (!webgl) return <ErrorFallback reason="webgl" />

  return (
    <>
      {ready && <Museum onContextLost={() => setLost(true)} onContextRestored={() => setLost(false)} />}
      <Hud />
      <ScreenQuiz />
      <WishOverlay />
      <FinalBanner />
      <LetterOverlay />
      <StartScreen />
      <LoadingScreen />
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
