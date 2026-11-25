import { useMemo } from 'react'
import * as THREE from 'three'
import { getPhotoTexture, labelTexture, radialTexture } from '../lib/textures'
import { useStore } from '../state/store'
import { fitFrame, type FramePlacement, type Interactable } from './layout'

interface Props {
  placement: FramePlacement
  aspect: number
  interactable?: Interactable
}

const FRAME_BLACK = '#121214'
const MAT_WHITE = '#fbfaf7'

export function PhotoFrame({ placement: p, aspect, interactable }: Props) {
  const request = useStore((s) => s.requestInteraction)
  const { w, h } = useMemo(() => fitFrame(aspect, p.maxW, p.maxH), [aspect, p.maxW, p.maxH])
  const tex = getPhotoTexture(p.index)

  const photoMat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex ?? null, color: tex ? '#ffffff' : '#cccccc', toneMapped: false }), [tex])
  const poolMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: radialTexture('pool'),
        color: '#ffe9c4',
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )
  const labelMat = useMemo(
    () => new THREE.MeshBasicMaterial({ map: labelTexture('No. ' + String(p.index + 1).padStart(2, '0')), toneMapped: false }),
    [p.index],
  )

  const mat = 0.1
  const frameT = 0.05
  const ow = w + (mat + frameT) * 2
  const oh = h + (mat + frameT) * 2

  return (
    <group
      position={[p.x, p.y, p.z]}
      rotation={[0, p.yaw, 0]}
      onClick={(e) => {
        e.stopPropagation()
        if (interactable) request(interactable)
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {/* soft spotlight pool on the wall above the frame */}
      <mesh position={[0, oh / 2 + 0.45, 0.012]} material={poolMat} renderOrder={2}>
        <planeGeometry args={[Math.max(ow + 1.6, 3.2), 2.4]} />
      </mesh>
      {/* black frame */}
      <mesh position={[0, 0, 0.035]}>
        <boxGeometry args={[ow, oh, 0.07]} />
        <meshLambertMaterial color={FRAME_BLACK} />
      </mesh>
      {/* white mat */}
      <mesh position={[0, 0, 0.072]}>
        <boxGeometry args={[w + mat * 2, h + mat * 2, 0.012]} />
        <meshLambertMaterial color={MAT_WHITE} />
      </mesh>
      {/* the photo */}
      <mesh position={[0, 0, 0.0795]} material={photoMat}>
        <planeGeometry args={[w, h]} />
      </mesh>
      {/* brass label plate */}
      <mesh position={[0, -(oh / 2 + 0.22), 0.012]} material={labelMat}>
        <planeGeometry args={[0.72, 0.225]} />
      </mesh>
    </group>
  )
}
