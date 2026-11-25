import { useMemo } from 'react'
import * as THREE from 'three'
import { plaqueTexture } from '../lib/textures'
import { BlobShadow } from './BlobShadow'

interface Props {
  x: number
  z: number
  w: number
  d: number
  h: number
  color?: string
  plaque?: { small: string; big: string }
}

/** Low white display plinth, optionally with a name plaque on its south face. */
export function Plinth({ x, z, w, d, h, color = '#f7f5f1', plaque }: Props) {
  const plaqueMat = useMemo(
    () => (plaque ? new THREE.MeshBasicMaterial({ map: plaqueTexture(plaque.small, plaque.big), toneMapped: false }) : null),
    [plaque],
  )
  return (
    <group position={[x, 0, z]} onClick={(e) => e.stopPropagation()}>
      <BlobShadow w={w + 1.3} d={d + 1.3} opacity={0.5} />
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0, h + 0.015, 0]}>
        <boxGeometry args={[w + 0.08, 0.03, d + 0.08]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
      {plaqueMat && (
        <mesh position={[0, h * 0.52, d / 2 + 0.006]} material={plaqueMat}>
          <planeGeometry args={[Math.min(w * 0.8, 1.0), Math.min(w * 0.8, 1.0) * 0.5]} />
        </mesh>
      )}
    </group>
  )
}
