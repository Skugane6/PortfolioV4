import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { computeParallaxOffset } from './parallax';

// A distributed-systems network, not a drifting dust cloud: a set of nodes
// wired together by their nearest neighbors, with a few small "packets"
// riding the edges — visually closer to what the Experience/FeaturedProject
// sections are actually about (systems talking to each other).
const NODE_COUNT = 34;
const MAX_LINK_DISTANCE = 1.3;
const FIELD_RADIUS = 2.4;
const PACKET_COUNT = 9;
const HUB_STRIDE = 6; // every Nth node reads as a slightly larger "hub"

interface NetworkGeometry {
  nodePositions: Float32Array;
  hubPositions: Float32Array;
  linePositions: Float32Array;
  edges: Array<[number, number]>;
}

function buildNetwork(): NetworkGeometry {
  const nodePositions = new Float32Array(NODE_COUNT * 3);
  const hubs: number[] = [];

  for (let i = 0; i < NODE_COUNT; i++) {
    // Distribute inside a flattened sphere — a "board" of nodes rather than
    // an even cube of dust — so it reads as a coherent structure at a glance.
    const theta = Math.random() * Math.PI * 2;
    const r = Math.cbrt(Math.random()) * FIELD_RADIUS;
    nodePositions[i * 3] = Math.cos(theta) * r;
    nodePositions[i * 3 + 1] = (Math.random() - 0.5) * FIELD_RADIUS * 1.3;
    nodePositions[i * 3 + 2] = Math.sin(theta) * r * 0.6;

    if (i % HUB_STRIDE === 0) {
      hubs.push(nodePositions[i * 3], nodePositions[i * 3 + 1], nodePositions[i * 3 + 2]);
    }
  }

  const edges: Array<[number, number]> = [];
  const edgeVerts: number[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    for (let j = i + 1; j < NODE_COUNT; j++) {
      const dx = nodePositions[i * 3] - nodePositions[j * 3];
      const dy = nodePositions[i * 3 + 1] - nodePositions[j * 3 + 1];
      const dz = nodePositions[i * 3 + 2] - nodePositions[j * 3 + 2];
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < MAX_LINK_DISTANCE) {
        edges.push([i, j]);
        edgeVerts.push(
          nodePositions[i * 3],
          nodePositions[i * 3 + 1],
          nodePositions[i * 3 + 2],
          nodePositions[j * 3],
          nodePositions[j * 3 + 1],
          nodePositions[j * 3 + 2]
        );
      }
    }
  }

  return {
    nodePositions,
    hubPositions: new Float32Array(hubs),
    linePositions: new Float32Array(edgeVerts),
    edges,
  };
}

// Small bright points that ride back and forth along a random edge each —
// the "data flowing through the system" touch. Cheap: ~9 points re-lerped
// per frame, everything else in the scene is static geometry.
function DataPackets({ nodePositions, edges }: { nodePositions: Float32Array; edges: Array<[number, number]> }) {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useRef(new Float32Array(PACKET_COUNT * 3));
  const packets = useMemo(
    () =>
      Array.from({ length: PACKET_COUNT }, () => ({
        edge: edges[Math.floor(Math.random() * edges.length)],
        speed: 0.12 + Math.random() * 0.18,
        t: Math.random(),
      })),
    [edges]
  );

  useFrame((_state, delta) => {
    const buf = positions.current;
    for (let i = 0; i < packets.length; i++) {
      const packet = packets[i];
      packet.t += delta * packet.speed;
      if (packet.t > 1) {
        packet.t = 0;
        packet.edge = edges[Math.floor(Math.random() * edges.length)];
      }
      const [a, b] = packet.edge;
      buf[i * 3] = THREE.MathUtils.lerp(nodePositions[a * 3], nodePositions[b * 3], packet.t);
      buf[i * 3 + 1] = THREE.MathUtils.lerp(nodePositions[a * 3 + 1], nodePositions[b * 3 + 1], packet.t);
      buf[i * 3 + 2] = THREE.MathUtils.lerp(nodePositions[a * 3 + 2], nodePositions[b * 3 + 2], packet.t);
    }
    const attr = pointsRef.current?.geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (attr) attr.needsUpdate = true;
  });

  return (
    <Points ref={pointsRef} positions={positions.current} stride={3}>
      <PointMaterial
        transparent
        color="#dceaff"
        size={5}
        sizeAttenuation={false}
        depthWrite={false}
        opacity={0.95}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function Network() {
  const groupRef = useRef<THREE.Group>(null);
  const network = useMemo(buildNetwork, []);

  useFrame((state) => {
    const offset = computeParallaxOffset({ x: state.pointer.x, y: state.pointer.y }, 0.35);
    const group = groupRef.current;
    if (!group) return;
    group.rotation.y += 0.0015;
    group.position.x = THREE.MathUtils.lerp(group.position.x, offset.x, 0.02);
    group.position.y = THREE.MathUtils.lerp(group.position.y, offset.y, 0.02);
  });

  return (
    <group ref={groupRef}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={network.linePositions}
            count={network.linePositions.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#2f6fdb" transparent opacity={0.22} depthWrite={false} />
      </lineSegments>

      <Points positions={network.nodePositions} stride={3}>
        <PointMaterial transparent color="#4c8dff" size={3} sizeAttenuation={false} depthWrite={false} opacity={0.75} />
      </Points>

      {network.hubPositions.length > 0 && (
        <Points positions={network.hubPositions} stride={3}>
          <PointMaterial
            transparent
            color="#8fc4ff"
            size={7}
            sizeAttenuation={false}
            depthWrite={false}
            opacity={0.5}
            blending={THREE.AdditiveBlending}
          />
        </Points>
      )}

      <DataPackets nodePositions={network.nodePositions} edges={network.edges} />
    </group>
  );
}

export function NetworkField() {
  return (
    <Canvas
      data-testid="network-field-canvas"
      camera={{ position: [0, 0, 3], fov: 60 }}
      gl={{ antialias: false, alpha: true }}
    >
      <Network />
    </Canvas>
  );
}
