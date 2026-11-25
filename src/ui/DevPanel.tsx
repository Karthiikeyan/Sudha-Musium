import { useEffect, useState } from 'react'
import { world, type GlInfo } from '../lib/world'
import { useStore } from '../state/store'

/** Hidden testing panel: only rendered when the page is opened with ?dev=1. */
export function DevPanel() {
  const dev = useStore((s) => s.dev)
  const rooms = useStore((s) => s.rooms)
  const roomId = useStore((s) => s.roomId)
  const jump = useStore((s) => s.devJump)
  const unlock = useStore((s) => s.devUnlockAll)
  const [open, setOpen] = useState(true)
  const [mem, setMem] = useState<GlInfo | null>(null)

  useEffect(() => {
    if (!dev) return
    const id = window.setInterval(() => setMem(world.glInfo ? world.glInfo() : null), 1000)
    return () => window.clearInterval(id)
  }, [dev])

  // dev-only memory log after every room change
  useEffect(() => {
    if (!dev) return
    const id = window.setTimeout(() => {
      const m = world.glInfo?.()
      if (m) console.info(`[dev] room=${roomId} textures=${m.textures} geometries=${m.geometries}`)
    }, 2500)
    return () => window.clearTimeout(id)
  }, [dev, roomId])

  if (!dev) return null
  return (
    <div className="dev-panel">
      <button className="dev-toggle" onClick={() => setOpen((o) => !o)}>
        dev {open ? '▾' : '▸'}
      </button>
      {open && (
        <>
          <div className="dev-mem">
            tex {mem?.textures ?? '–'} · geo {mem?.geometries ?? '–'}
          </div>
          <div className="dev-rooms">
            {rooms.map((r) => (
              <button key={r.id} className={r.id === roomId ? 'on' : ''} onClick={() => jump(r.id)}>
                {r.id}
              </button>
            ))}
          </div>
          <button onClick={unlock}>unlock everything</button>
        </>
      )}
    </div>
  )
}
