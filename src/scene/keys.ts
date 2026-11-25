import type { Layout } from './layout'

/** Changes whenever the hall is rebuilt (photo count changes), so the scene subtree remounts cleanly. */
export const buildLayoutKey = (l: Layout) => `${l.frames.length}-${l.zN}`
