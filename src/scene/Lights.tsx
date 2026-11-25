// Three real lights at most in the whole scene: hemisphere + one weak directional (here) and one warm point light (Cake).
export function Lights() {
  return (
    <>
      <hemisphereLight args={['#ffffff', '#d4cbc0', 2.7]} />
      <directionalLight position={[6, 14, 9]} intensity={0.6} color="#fff6e8" />
    </>
  )
}
