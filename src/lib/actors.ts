import { damp, dampAngle } from './math'
import type { Actor, Script } from './world'

export const WALK_SPEED = 4.4

/**
 * Drives an actor along a script: through its waypoints, then onto the final spot, then into the final pose.
 * Scripted movement deliberately ignores colliders (it only ever goes to hand-picked free spots).
 */
export function followScript(a: Actor, s: Script, dt: number): void {
  if (a.scriptId !== s.id) {
    a.scriptId = s.id
    a.wp = 0
    a.arrived = false
    if (s.teleport) {
      a.x = s.x
      a.z = s.z
      a.wp = s.waypoints.length
    }
  }
  const n = s.waypoints.length
  const finalStep = a.wp >= n
  const tx = finalStep ? s.x : s.waypoints[a.wp].x
  const tz = finalStep ? s.z : s.waypoints[a.wp].z
  const dx = tx - a.x
  const dz = tz - a.z
  const d = Math.hypot(dx, dz)
  const sp = s.speed ?? WALK_SPEED
  if (d > 0.06) {
    const step = Math.min(d, sp * dt)
    a.x += (dx / d) * step
    a.z += (dz / d) * step
    a.yaw = dampAngle(a.yaw, Math.atan2(dx, dz), 14, dt)
    a.speed = damp(a.speed, Math.min(1, sp / WALK_SPEED), 10, dt)
    a.pose = 'walk'
    a.arrived = false
    a.y = damp(a.y, 0, 8, dt)
  } else if (!finalStep) {
    a.wp++
  } else {
    a.arrived = true
    a.speed = damp(a.speed, 0, 10, dt)
    a.pose = s.pose
    if (s.hugSide !== undefined) a.hugSide = s.hugSide
    a.yaw = dampAngle(a.yaw, s.yaw, 10, dt)
    a.y = damp(a.y, s.y, 9, dt)
  }
}
