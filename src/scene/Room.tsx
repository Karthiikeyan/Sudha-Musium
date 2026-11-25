import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { ceilingTexture, floorTexture } from '../lib/textures'
import { BlobShadow } from './BlobShadow'
import type { Layout } from './layout'

const WALL = '#f5f2ec'
const DARK = '#25252b'

export function Room({ layout }: { layout: Layout }) {
  const { halfW, zN, zS, ceiling, feature, frames } = layout
  const L = zS - zN
  const cz = (zS + zN) / 2

  const floorMat = useMemo(() => {
    const t = floorTexture()
    t.repeat.set((halfW * 2) / 3.2, L / 3.2)
    return new THREE.MeshLambertMaterial({ map: t })
  }, [halfW, L])
  const ceilMat = useMemo(() => {
    const t = ceilingTexture()
    t.repeat.set((halfW * 2) / 3, L / 3)
    return new THREE.MeshLambertMaterial({ map: t, color: '#8a8a94' })
  }, [halfW, L])

  // decorative track spotlights (instanced), one above every frame
  const bodyRef = useRef<THREE.InstancedMesh>(null)
  const bulbRef = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const body = bodyRef.current
    const bulb = bulbRef.current
    if (!body || !bulb) return
    const d = new THREE.Object3D()
    frames.forEach((f, i) => {
      const lx = f.x + f.normal.x * 2.7
      const lz = f.z + f.normal.z * 2.7
      d.position.set(lx, ceiling - 0.32, lz)
      d.rotation.set(0, 0, 0)
      // tilt so the nozzle points at the wall
      if (f.wall === 'feature') d.rotation.x = 0.55
      else d.rotation.z = f.wall === 'left' ? -0.55 : 0.55
      d.updateMatrix()
      body.setMatrixAt(i, d.matrix)
      // bulb sits at the nozzle end
      const m = new THREE.Matrix4().makeTranslation(0, -0.21, 0)
      m.premultiply(d.matrix)
      bulb.setMatrixAt(i, m)
    })
    body.instanceMatrix.needsUpdate = true
    bulb.instanceMatrix.needsUpdate = true
  }, [frames, ceiling])

  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, cz]} material={floorMat}>
        <planeGeometry args={[halfW * 2, L]} />
      </mesh>
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ceiling, cz]} material={ceilMat}>
        <planeGeometry args={[halfW * 2, L]} />
      </mesh>
      {/* walls */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-halfW, ceiling / 2, cz]}>
        <planeGeometry args={[L, ceiling]} />
        <meshLambertMaterial color={WALL} />
      </mesh>
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[halfW, ceiling / 2, cz]}>
        <planeGeometry args={[L, ceiling]} />
        <meshLambertMaterial color={WALL} />
      </mesh>
      <mesh rotation={[0, Math.PI, 0]} position={[0, ceiling / 2, zS]}>
        <planeGeometry args={[halfW * 2, ceiling]} />
        <meshLambertMaterial color={WALL} />
      </mesh>
      {/* dark feature wall behind the screen */}
      <mesh position={[0, ceiling / 2, zN]}>
        <planeGeometry args={[halfW * 2, ceiling]} />
        <meshLambertMaterial color={DARK} />
      </mesh>

      {/* baseboards */}
      {[
        { p: [-halfW + 0.02, 0.1, cz] as const, s: [0.04, 0.2, L] as const },
        { p: [halfW - 0.02, 0.1, cz] as const, s: [0.04, 0.2, L] as const },
        { p: [0, 0.1, zS - 0.02] as const, s: [halfW * 2, 0.2, 0.04] as const },
      ].map((b, i) => (
        <mesh key={i} position={[b.p[0], b.p[1], b.p[2]]}>
          <boxGeometry args={[b.s[0], b.s[1], b.s[2]]} />
          <meshLambertMaterial color="#e6e1d8" />
        </mesh>
      ))}

      {/* free-standing dark feature wall near the entrance */}
      <group position={[feature.x, 0, feature.z]}>
        <BlobShadow z={0.9} w={feature.w + 1.8} d={2.8} opacity={0.4} />
        <mesh position={[0, feature.h / 2, 0]} onClick={(e) => e.stopPropagation()}>
          <boxGeometry args={[feature.w, feature.h, feature.d]} />
          <meshLambertMaterial color={DARK} />
        </mesh>
        <mesh position={[0, feature.h + 0.02, 0]}>
          <boxGeometry args={[feature.w + 0.1, 0.04, feature.d + 0.1]} />
          <meshLambertMaterial color="#3a3a42" />
        </mesh>
      </group>

      {/* ceiling tracks */}
      {[-(halfW - 2.7), halfW - 2.7].map((x) => (
        <mesh key={x} position={[x, ceiling - 0.04, cz]}>
          <boxGeometry args={[0.07, 0.07, L]} />
          <meshBasicMaterial color="#0e0e11" />
        </mesh>
      ))}
      <mesh position={[0, ceiling - 0.04, feature.z + 2.7]}>
        <boxGeometry args={[feature.w + 1.6, 0.07, 0.07]} />
        <meshBasicMaterial color="#0e0e11" />
      </mesh>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, Math.max(1, frames.length)]} frustumCulled={false}>
        <cylinderGeometry args={[0.1, 0.13, 0.42, 10]} />
        <meshLambertMaterial color="#111114" />
      </instancedMesh>
      <instancedMesh ref={bulbRef} args={[undefined, undefined, Math.max(1, frames.length)]} frustumCulled={false}>
        <sphereGeometry args={[0.085, 8, 6]} />
        <meshBasicMaterial color="#fff2d0" toneMapped={false} />
      </instancedMesh>
    </group>
  )
}
