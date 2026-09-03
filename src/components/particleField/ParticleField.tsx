import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { computeParallaxOffset } from './parallax';

const PARTICLE_COUNT = 1200;

function generatePositions(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
  }
  return positions;
}

function DriftingPoints() {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useRef(generatePositions(PARTICLE_COUNT));

  useFrame((state) => {
    const offset = computeParallaxOffset({ x: state.pointer.x, y: state.pointer.y }, 0.4);
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0006;
      pointsRef.current.position.x = THREE.MathUtils.lerp(pointsRef.current.position.x, offset.x, 0.02);
      pointsRef.current.position.y = THREE.MathUtils.lerp(pointsRef.current.position.y, offset.y, 0.02);
    }
  });

  return (
    <Points ref={pointsRef} positions={positions.current} stride={3}>
      {/* sizeAttenuation is off on purpose: with it on, a particle that happens to
          land near the camera's z plane balloons into an oversized "moon" blob —
          a constant screen-space size keeps every dot uniformly small instead. */}
      <PointMaterial
        transparent
        color="#ff5a1f"
        size={2}
        sizeAttenuation={false}
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

export function ParticleField() {
  return (
    <Canvas
      data-testid="particle-field-canvas"
      camera={{ position: [0, 0, 3], fov: 60 }}
      gl={{ antialias: false, alpha: true }}
    >
      <DriftingPoints />
    </Canvas>
  );
}
