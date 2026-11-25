import { useMemo } from 'react'
import * as THREE from 'three'
import { radialTexture } from '../lib/textures'

interface Props {
  x?: number
  z?: number
  w: number
  d: number
  opacity?: number
  rotY?: number
}

/** Fake soft shadow: a flat plane with a radial gradient (no shadow maps anywhere). */
export function BlobShadow({ x = 0, z = 0, w, d, opacity = 0.55, rotY = 0 }: Props) {
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: radialTexture('shadow'),
        transparent: true,
        depthWrite: false,
        opacity,
        toneMapped: false,
      }),
    [opacity],
  )
  return (
    <mesh position={[x, 0.014, z]} rotation={[-Math.PI / 2, 0, rotY]} renderOrder={1} material={mat}>
      <planeGeometry args={[w, d]} />
    </mesh>
  )
}
