import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { sfx } from '../lib/audio'
import { getPhoto, photoAspect, usePhotoVersion } from '../lib/photoCache'
import { labelTexture, radialTexture } from '../lib/textures'
import { world } from '../lib/world'
import { useStore } from '../state/store'
import { useDisposable } from './hooks'
import { fitFrame, type FramePlacement, type Interactable } from './layout'

interface Props {
  placement: FramePlacement
  interactable?: Interactable
  /** start already lit (photo was seen before) */
  startLit?: boolean
}

const LIGHT_RADIUS = 7
const DARK = new THREE.Color('#141417')
const WHITE = new THREE.Color('#ffffff')
const MAT_LIT = new THREE.Color('#fbfaf7')
const MAT_DARK = new THREE.Color('#2a2a2e')

/**
 * A framed photo that stays a dark silhouette until Sudha comes within ~7 units; then its spotlight eases on
 * (0.8 s) and the photo fades in with a little chime. Once lit it stays lit.
 */
export function PhotoFrame({ placement: p, interactable, startLit }: Props) {
  usePhotoVersion()
  const request = useStore((s) => s.requestInteraction)
  const entry = getPhoto(p.name)
  const aspect = entry?.aspect ?? photoAspect(p.name) ?? 0.8
  const { w, h } = fitFrame(aspect, p.maxW, p.maxH)
  const lit = useRef(startLit ? 1 : 0)
  const triggered = useRef(!!startLit)

  const photoMat = useDisposable(() => new THREE.MeshBasicMaterial({ color: '#141417', toneMapped: false }), [])
  const matMat = useDisposable(() => new THREE.MeshLambertMaterial({ color: '#2a2a2e' }), [])
  const poolMat = useDisposable(
    () =>
      new THREE.MeshBasicMaterial({
        map: radialTexture('pool'),
        color: '#ffe9c4',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )
  const labelMat = useDisposable(
    () => new THREE.MeshBasicMaterial({ map: labelTexture('No. ' + String(p.index + 1).padStart(2, '0')), toneMapped: false }),
    [p.index],
  )

  const tex = entry?.tex ?? null
  if (photoMat.map !== tex) {
    photoMat.map = tex
    photoMat.needsUpdate = true
  }

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const pl = world.player
    if (!triggered.current && Math.hypot(pl.x - p.x, pl.z - p.z) < LIGHT_RADIUS) {
      triggered.current = true
      sfx('chime')
    }
    const target = triggered.current && tex ? 1 : 0
    lit.current = Math.min(1, Math.max(0, lit.current + Math.sign(target - lit.current) * (dt / 0.8)))
    const k = lit.current
    photoMat.color.copy(DARK).lerp(WHITE, k)
    matMat.color.copy(MAT_DARK).lerp(MAT_LIT, k)
    poolMat.opacity = 0.45 * k
  })

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
      <mesh position={[0, oh / 2 + 0.4, 0.012]} material={poolMat} renderOrder={2}>
        <planeGeometry args={[Math.max(ow + 1.4, 2.8), 2.2]} />
      </mesh>
      <mesh position={[0, 0, 0.035]}>
        <boxGeometry args={[ow, oh, 0.07]} />
        <meshLambertMaterial color="#121214" />
      </mesh>
      <mesh position={[0, 0, 0.072]} material={matMat}>
        <boxGeometry args={[w + mat * 2, h + mat * 2, 0.012]} />
      </mesh>
      <mesh position={[0, 0, 0.0795]} material={photoMat}>
        <planeGeometry args={[w, h]} />
      </mesh>
      <mesh position={[0, -(oh / 2 + 0.2), 0.012]} material={labelMat}>
        <planeGeometry args={[0.64, 0.2]} />
      </mesh>
    </group>
  )
}
