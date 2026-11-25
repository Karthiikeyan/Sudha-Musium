// Small reusable props built from primitives.
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { BlobShadow } from './BlobShadow'

export function Plant({ x, z, scale = 1, pot = '#c98b6b', leaf = '#5f9a5b' }: { x: number; z: number; scale?: number; pot?: string; leaf?: string }) {
  const leaves = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2
        return { p: [Math.cos(a) * 0.22, 0.95 + (i % 3) * 0.14, Math.sin(a) * 0.22] as [number, number, number], s: 0.24 + (i % 2) * 0.06 }
      }),
    [],
  )
  return (
    <group position={[x, 0, z]} scale={scale}>
      <BlobShadow w={1.1} d={1.1} opacity={0.5} />
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.32, 0.24, 0.6, 16]} />
        <meshLambertMaterial color={pot} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.04, 16]} />
        <meshLambertMaterial color="#5a4030" />
      </mesh>
      {leaves.map((l, i) => (
        <mesh key={i} position={l.p}>
          <sphereGeometry args={[l.s, 10, 8]} />
          <meshLambertMaterial color={leaf} />
        </mesh>
      ))}
      <mesh position={[0, 1.25, 0]}>
        <sphereGeometry args={[0.26, 10, 8]} />
        <meshLambertMaterial color={leaf} />
      </mesh>
    </group>
  )
}

/** A table lamp with an always-on warm bulb (no real light; rooms add at most one point light). */
export function Lamp({ x, y, z, shade = '#f2d9a6' }: { x: number; y: number; z: number; shade?: string }) {
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.14, 0.16, 0.06, 14]} />
        <meshLambertMaterial color="#b8924f" />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.42, 8]} />
        <meshLambertMaterial color="#b8924f" />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.07, 10, 8]} />
        <meshBasicMaterial color="#fff1c8" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.13, 0.24, 0.26, 16, 1, true]} />
        <meshBasicMaterial color={shade} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Catenary strings of tiny glowing bulbs (one instanced mesh for all of them). */
export function StringLights({
  strands,
  color = '#ffe2a8',
  perStrand = 18,
  sag = 0.35,
  size = 0.05,
}: {
  strands: [[number, number, number], [number, number, number]][]
  color?: string
  perStrand?: number
  sag?: number
  size?: number
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const count = strands.length * perStrand
  const points = useMemo(() => {
    const out: THREE.Vector3[] = []
    strands.forEach(([a, b]) => {
      for (let i = 0; i < perStrand; i++) {
        const t = (i + 0.5) / perStrand
        out.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag, a[2] + (b[2] - a[2]) * t))
      }
    })
    return out
  }, [strands, perStrand, sag])
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const d = new THREE.Object3D()
    points.forEach((p, i) => {
      d.position.copy(p)
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  }, [points])
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const base = useMemo(() => new THREE.Color(color), [color])
  useFrame(({ clock }) => {
    if (mat.current) mat.current.color.copy(base).multiplyScalar(0.85 + Math.sin(clock.elapsedTime * 2.2) * 0.15)
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, Math.max(1, count)]} frustumCulled={false}>
      <sphereGeometry args={[size, 6, 5]} />
      <meshBasicMaterial ref={mat} color={color} toneMapped={false} />
    </instancedMesh>
  )
}
