import { useStore } from '../state/store'
import { BlobShadow } from './BlobShadow'
import type { BenchPlacement, Layout } from './layout'

export function Bench({ bench, layout }: { bench: BenchPlacement; layout: Layout }) {
  const inter = layout.interactables.find((i) => i.id === 'bench-' + bench.id)
  const request = useStore((s) => s.requestInteraction)
  return (
    <group
      position={[bench.x, 0, bench.z]}
      rotation={[0, bench.yaw, 0]}
      onClick={(e) => {
        e.stopPropagation()
        if (inter) request(inter)
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <BlobShadow w={3.6} d={1.7} opacity={0.5} rotY={0} />
      {/* wooden seat */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[2.7, 0.1, 0.84]} />
        <meshStandardMaterial color="#c9a37a" roughness={0.75} />
      </mesh>
      {[-0.28, 0, 0.28].map((z) => (
        <mesh key={z} position={[0, 0.556, z]}>
          <boxGeometry args={[2.7, 0.012, 0.012]} />
          <meshStandardMaterial color="#9f7c58" roughness={0.9} />
        </mesh>
      ))}
      {/* dark legs */}
      {[-1.15, 1.15].map((x) => (
        <mesh key={x} position={[x, 0.225, 0]}>
          <boxGeometry args={[0.09, 0.45, 0.72]} />
          <meshStandardMaterial color="#2b2b30" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[2.3, 0.05, 0.06]} />
        <meshStandardMaterial color="#2b2b30" roughness={0.6} />
      </mesh>
    </group>
  )
}
