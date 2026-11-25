import confetti from 'canvas-confetti'
import { isTouch, prefersReducedMotion } from './device'

const COLORS = ['#f7c6d4', '#d9ccf2', '#fbe7a6', '#ff7f8e', '#ffffff', '#c9e7f2']

export function smallBurst() {
  if (prefersReducedMotion()) return
  try {
    void confetti({
      particleCount: isTouch() ? 55 : 100,
      spread: 75,
      startVelocity: 36,
      origin: { x: 0.5, y: 0.62 },
      colors: COLORS,
      disableForReducedMotion: true,
    })
  } catch {
    /* ignore */
  }
}

export function heartBurst() {
  if (prefersReducedMotion()) return
  try {
    const heart = confetti.shapeFromText({ text: '💖', scalar: 2 })
    void confetti({
      particleCount: isTouch() ? 22 : 40,
      spread: 90,
      startVelocity: 32,
      scalar: 2,
      shapes: [heart],
      origin: { x: 0.5, y: 0.6 },
      disableForReducedMotion: true,
    })
  } catch {
    smallBurst()
  }
}

/** ~6 s of confetti from both sides and the centre. Returns a cancel function. */
export function bigCelebration(): () => void {
  if (prefersReducedMotion()) return () => undefined
  const touch = isTouch()
  const n = touch ? 28 : 60
  let count = 0
  const fire = () => {
    try {
      void confetti({ particleCount: n, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors: COLORS, startVelocity: 55, disableForReducedMotion: true })
      void confetti({ particleCount: n, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors: COLORS, startVelocity: 55, disableForReducedMotion: true })
      if (count % 2 === 0) void confetti({ particleCount: Math.round(n * 1.2), spread: 100, origin: { x: 0.5, y: 0.45 }, colors: COLORS, disableForReducedMotion: true })
    } catch {
      /* ignore */
    }
    count++
  }
  fire()
  const id = window.setInterval(() => {
    if (count >= 8) {
      window.clearInterval(id)
      return
    }
    fire()
  }, 750)
  return () => {
    window.clearInterval(id)
    try {
      confetti.reset()
    } catch {
      /* ignore */
    }
  }
}

/** Firework-style confetti bursts at random spots in the sky for ~6 s. Returns a cancel function. */
export function fireworksBurst(): () => void {
  if (prefersReducedMotion()) return () => undefined
  const n = isTouch() ? 30 : 60
  let count = 0
  const fire = () => {
    try {
      void confetti({
        particleCount: n,
        spread: 360,
        startVelocity: 26,
        ticks: 120,
        gravity: 0.7,
        scalar: 0.9,
        origin: { x: 0.15 + Math.random() * 0.7, y: 0.1 + Math.random() * 0.3 },
        colors: COLORS,
        disableForReducedMotion: true,
      })
    } catch {
      /* ignore */
    }
    count++
  }
  const id = window.setInterval(() => {
    if (count >= 9) {
      window.clearInterval(id)
      return
    }
    fire()
  }, 650)
  return () => window.clearInterval(id)
}
