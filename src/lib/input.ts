import { useEffect } from 'react'
import { useStore } from '../state/store'
import { world } from './world'

function resetKeys() {
  world.keys.up = world.keys.down = world.keys.left = world.keys.right = false
}

/** Global keyboard handling: WASD / arrows, Enter / E for the proximity action, Esc to step back. */
export function useKeyboard() {
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const st = useStore.getState()
      const k = e.key
      const lower = k.length === 1 ? k.toLowerCase() : k
      const onButton = (e.target as HTMLElement | null)?.tagName === 'BUTTON'

      if (lower === 'ArrowUp' || lower === 'w') world.keys.up = true
      else if (lower === 'ArrowDown' || lower === 's') world.keys.down = true
      else if (lower === 'ArrowLeft' || lower === 'a') world.keys.left = true
      else if (lower === 'ArrowRight' || lower === 'd') world.keys.right = true

      if (st.phase === 'viewing') {
        if (k === 'ArrowRight') st.stepPhoto(1)
        else if (k === 'ArrowLeft') st.stepPhoto(-1)
      }
      if (k.startsWith('Arrow') || (k === ' ' && !onButton)) {
        if (st.phase === 'explore' || st.phase === 'viewing') e.preventDefault()
      }

      if (k === 'Escape') {
        if (st.phase === 'viewing' || st.phase === 'sitting' || st.phase === 'cake') st.exitInteraction()
      } else if ((k === 'Enter' && !onButton) || lower === 'e') {
        if (st.phase === 'explore' && st.nearby && !e.repeat) st.startInteraction(st.nearby)
      }
    }
    const onUp = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (k === 'ArrowUp' || k === 'w') world.keys.up = false
      else if (k === 'ArrowDown' || k === 's') world.keys.down = false
      else if (k === 'ArrowLeft' || k === 'a') world.keys.left = false
      else if (k === 'ArrowRight' || k === 'd') world.keys.right = false
    }
    const onBlur = () => resetKeys()
    const onVis = () => {
      if (document.hidden) resetKeys()
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVis)
      resetKeys()
    }
  }, [])
}
