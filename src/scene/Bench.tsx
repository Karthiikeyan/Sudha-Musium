import { useStore } from '../state/store'
import { BlobShadow } from './BlobShadow'
import type { BenchPlacement, Interactable } from './layout'

export function Bench({ bench, interactable, seat = '#c9a37a' }: { bench: BenchPlacement; interactable?: Interactable; seat?: string }) {
  const request = useStore((s) => s.requestInteraction)
  const L = bench.len
  return (
    <group
      position={[bench.x, 0, bench.z]}
      rotation={[0, bench.yaw, 0]}
      onClick={(e) => {
        e.stopPropagation()
        if (interactable) request(interactable)
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <BlobShadow w={L + 0.9} d={1.7} opacity={0.5} />
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[L, 0.1, 0.84]} />
        <meshStandardMaterial color={seat} roughness={0.75} />
      </mesh>
      {[-0.28, 0, 0.28].map((z) => (
        <mesh key={z} position={[0, 0.556, z]}>
          <boxGeometry args={[L, 0.012, 0.012]} />
          <meshStandardMaterial color="#9f7c58" roughness={0.9} />
        </mesh>
      ))}
      {[-L / 2 + 0.2, L / 2 - 0.2].map((x) => (
        <mesh key={x} position={[x, 0.225, 0]}>
          <boxGeometry args={[0.09, 0.45, 0.72]} />
          <meshStandardMaterial color="#2b2b30" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[L - 0.4, 0.05, 0.06]} />
        <meshStandardMaterial color="#2b2b30" roughness={0.6} />
      </mesh>
    </group>
  )
}
