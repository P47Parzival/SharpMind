import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────

/** Tall layered mountain with snow cap */
function Mountain({ position, scale = 1, color = '#5a5a6a', snowLine = 0.65 }: {
  position: [number, number, number]; scale?: number; color?: string; snowLine?: number;
}) {
  return (
    <group position={position} scale={scale}>
      {/* Base rock */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <coneGeometry args={[28, 55, 10]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Mid layer */}
      <mesh position={[0, 18, 0]} castShadow>
        <coneGeometry args={[16, 30, 8]} />
        <meshLambertMaterial color="#4a4a58" />
      </mesh>
      {/* Snow cap */}
      <mesh position={[0, 30, 0]}>
        <coneGeometry args={[7, 16, 7]} />
        <meshLambertMaterial color="#e8eef4" />
      </mesh>
      {/* Snow peak tip */}
      <mesh position={[0, 38, 0]}>
        <coneGeometry args={[3, 8, 6]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

/** Detailed tree with trunk + layered canopy */
function Tree({ position, scale = 1, variant = 0 }: {
  position: [number, number, number]; scale?: number; variant?: number;
}) {
  const trunkH = 3 + variant * 0.5;
  const colors = ['#1a6b1a', '#1e7a1e', '#256025', '#174d17'];
  const leafColor = colors[variant % colors.length];
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, trunkH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.6, trunkH, 7]} />
        <meshLambertMaterial color="#5c3317" />
      </mesh>
      {/* Lower canopy */}
      <mesh position={[0, trunkH + 1.5, 0]} castShadow>
        <coneGeometry args={[2.8, 4.5, 7]} />
        <meshLambertMaterial color={leafColor} />
      </mesh>
      {/* Mid canopy */}
      <mesh position={[0, trunkH + 4, 0]} castShadow>
        <coneGeometry args={[2, 3.5, 6]} />
        <meshLambertMaterial color={colors[(variant + 1) % colors.length]} />
      </mesh>
      {/* Top canopy */}
      <mesh position={[0, trunkH + 6, 0]} castShadow>
        <coneGeometry args={[1.2, 2.5, 5]} />
        <meshLambertMaterial color="#0f4a0f" />
      </mesh>
    </group>
  );
}

/** Palm tree for beach areas */
function PalmTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Curved trunk approximated with stacked cylinders */}
      {[0, 1, 2, 3, 4].map(i => (
        <mesh key={i} position={[i * 0.15, 1 + i * 1.2, i * 0.1]} rotation={[0, 0, -0.08 * i]} castShadow>
          <cylinderGeometry args={[0.22 - i * 0.03, 0.28 - i * 0.03, 1.4, 6]} />
          <meshLambertMaterial color="#8B6914" />
        </mesh>
      ))}
      {/* Fronds */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 1.5 + 0.75, 7.5, Math.sin(angle) * 1.5 + 0.5]}
            rotation={[Math.PI / 4, angle, 0]}
            castShadow
          >
            <boxGeometry args={[0.15, 3, 0.8]} />
            <meshLambertMaterial color="#2d7a1a" />
          </mesh>
        );
      })}
      {/* Coconuts */}
      {[0, 1, 2].map(i => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.4 + 0.75, 7, Math.sin(a) * 0.4 + 0.5]}>
            <sphereGeometry args={[0.35, 6, 6]} />
            <meshLambertMaterial color="#5a3e10" />
          </mesh>
        );
      })}
    </group>
  );
}

/** Animated butterfly */
function Butterfly({ position, color1 = '#ff6b9d', color2 = '#ffd700' }: {
  position: [number, number, number]; color1?: string; color2?: string;
}) {
  const ref = useRef<THREE.Group>(null!);
  const wingRef = useRef<THREE.Mesh>(null!);
  const offset = useRef(Math.random() * Math.PI * 2);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + offset.current;
    if (ref.current) {
      ref.current.position.x = position[0] + Math.sin(t * 0.4) * 8;
      ref.current.position.y = position[1] + Math.sin(t * 0.7) * 2 + 1;
      ref.current.position.z = position[2] + Math.cos(t * 0.3) * 8;
      ref.current.rotation.y = Math.atan2(Math.cos(t * 0.4) * 8, -Math.cos(t * 0.3) * 8);
    }
    if (wingRef.current) {
      wingRef.current.rotation.y = Math.sin(t * 8) * 0.8;
    }
  });

  return (
    <group ref={ref} position={position}>
      <group ref={wingRef}>
        {/* Left wing */}
        <mesh position={[-0.4, 0, 0]} rotation={[0, 0.3, 0]}>
          <planeGeometry args={[0.7, 0.5]} />
          <meshLambertMaterial color={color1} side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
        {/* Right wing */}
        <mesh position={[0.4, 0, 0]} rotation={[0, -0.3, 0]}>
          <planeGeometry args={[0.7, 0.5]} />
          <meshLambertMaterial color={color2} side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
      </group>
      {/* Body */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 4]} />
        <meshLambertMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}

/** Animated insect (firefly / bee) */
function Insect({ position, color = '#ffdd00' }: {
  position: [number, number, number]; color?: string;
}) {
  const ref = useRef<THREE.Group>(null!);
  const offset = useRef(Math.random() * Math.PI * 2);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.6 + offset.current;
    if (ref.current) {
      ref.current.position.x = position[0] + Math.sin(t * 1.3) * 5;
      ref.current.position.y = position[1] + Math.abs(Math.sin(t * 0.9)) * 3 + 0.5;
      ref.current.position.z = position[2] + Math.cos(t * 1.1) * 5;
    }
  });

  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshLambertMaterial color={color} />
      </mesh>
    </group>
  );
}

/** Simple house */
function House({ position, rotation = 0, wallColor = '#d4a96a', roofColor = '#8b2020' }: {
  position: [number, number, number]; rotation?: number; wallColor?: string; roofColor?: string;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Foundation */}
      <mesh position={[0, 0.3, 0]} receiveShadow>
        <boxGeometry args={[8, 0.6, 6]} />
        <meshLambertMaterial color="#c8b89a" />
      </mesh>
      {/* Walls */}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 5, 6]} />
        <meshLambertMaterial color={wallColor} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 6, 0]} castShadow>
        <coneGeometry args={[6.5, 3.5, 4]} />
        <meshLambertMaterial color={roofColor} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 1.5, 3.01]}>
        <boxGeometry args={[1.2, 2.5, 0.05]} />
        <meshLambertMaterial color="#5c3317" />
      </mesh>
      {/* Windows */}
      {[-2.5, 2.5].map((x, i) => (
        <mesh key={i} position={[x, 3, 3.01]}>
          <boxGeometry args={[1.5, 1.5, 0.05]} />
          <meshLambertMaterial color="#a8d4f0" transparent opacity={0.7} />
        </mesh>
      ))}
      {/* Chimney */}
      <mesh position={[2.5, 7, 0]} castShadow>
        <boxGeometry args={[1, 3, 1]} />
        <meshLambertMaterial color="#8b4513" />
      </mesh>
    </group>
  );
}

/** Treasure chest */
function TreasureChest({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Chest base */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2, 1, 1.4]} />
        <meshLambertMaterial color="#6B3A10" />
      </mesh>
      {/* Lid */}
      <mesh position={[0, 1.25, -0.2]} castShadow>
        <boxGeometry args={[2, 0.6, 1]} />
        <meshLambertMaterial color="#8B4513" />
      </mesh>
      {/* Gold trim */}
      <mesh position={[0, 0.82, 0]}>
        <boxGeometry args={[2.05, 0.12, 1.45]} />
        <meshLambertMaterial color="#FFD700" />
      </mesh>
      {/* Lock */}
      <mesh position={[0, 0.85, 0.71]}>
        <boxGeometry args={[0.3, 0.3, 0.1]} />
        <meshLambertMaterial color="#DAA520" />
      </mesh>
      {/* Gold coins spilling out */}
      {[0, 1, 2, 3, 4].map(i => (
        <mesh key={i} position={[Math.sin(i) * 0.6, 0.15, Math.cos(i) * 0.4]}>
          <cylinderGeometry args={[0.18, 0.18, 0.08, 8]} />
          <meshLambertMaterial color="#FFD700" />
        </mesh>
      ))}
      {/* Glow effect – emissive sphere */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[1.2, 8, 8]} />
        <meshLambertMaterial color="#FFD700" transparent opacity={0.07} />
      </mesh>
    </group>
  );
}

/** Simple cow animal */
function Cow({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Body */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[2.5, 1.4, 1.2]} />
        <meshLambertMaterial color="#e8e0d0" />
      </mesh>
      {/* Head */}
      <mesh position={[1.4, 1.8, 0]} castShadow>
        <boxGeometry args={[1, 0.9, 0.8]} />
        <meshLambertMaterial color="#e8e0d0" />
      </mesh>
      {/* Snout */}
      <mesh position={[1.95, 1.6, 0]}>
        <boxGeometry args={[0.3, 0.4, 0.6]} />
        <meshLambertMaterial color="#e0b0a0" />
      </mesh>
      {/* Horns */}
      <mesh position={[1.1, 2.35, -0.25]} rotation={[0.3, 0, 0.5]}>
        <coneGeometry args={[0.07, 0.5, 5]} />
        <meshLambertMaterial color="#d4c090" />
      </mesh>
      <mesh position={[1.1, 2.35, 0.25]} rotation={[-0.3, 0, 0.5]}>
        <coneGeometry args={[0.07, 0.5, 5]} />
        <meshLambertMaterial color="#d4c090" />
      </mesh>
      {/* Legs */}
      {[[-0.7, -0.45], [-0.7, 0.45], [0.7, -0.45], [0.7, 0.45]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.35, z]} castShadow>
          <boxGeometry args={[0.3, 0.9, 0.3]} />
          <meshLambertMaterial color="#c8c0b0" />
        </mesh>
      ))}
      {/* Spots */}
      <mesh position={[0.3, 1.7, 0.62]}>
        <boxGeometry args={[0.8, 0.6, 0.05]} />
        <meshLambertMaterial color="#555" />
      </mesh>
    </group>
  );
}

/** Rabbit */
function Rabbit({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={0.5}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <sphereGeometry args={[0.6, 8, 8]} />
        <meshLambertMaterial color="#e8e4de" />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.45, 8, 8]} />
        <meshLambertMaterial color="#e8e4de" />
      </mesh>
      <mesh position={[-0.18, 2.0, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.5, 4, 8]} />
        <meshLambertMaterial color="#e8e4de" />
      </mesh>
      <mesh position={[0.18, 2.0, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.5, 4, 8]} />
        <meshLambertMaterial color="#e8e4de" />
      </mesh>
    </group>
  );
}

/** Duck */
function Duck({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} scale={0.7}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.55, 8, 8]} />
        <meshLambertMaterial color="#f5f0e0" />
      </mesh>
      <mesh position={[0.5, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.38, 8, 8]} />
        <meshLambertMaterial color="#1a6b2a" />
      </mesh>
      <mesh position={[0.88, 0.88, 0]}>
        <boxGeometry args={[0.28, 0.1, 0.14]} />
        <meshLambertMaterial color="#e8a020" />
      </mesh>
    </group>
  );
}

/** Animated water plane with shimmer */
function AnimatedWater() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (ref.current) {
      (ref.current.material as THREE.MeshLambertMaterial).color.setHSL(
        0.58 + Math.sin(clock.getElapsedTime() * 0.2) * 0.01,
        0.85,
        0.28 + Math.sin(clock.getElapsedTime() * 0.5) * 0.02
      );
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
      <circleGeometry args={[2000, 64]} />
      <meshLambertMaterial color="#0a2a6b" transparent opacity={0.92} />
    </mesh>
  );
}

/** Road segment */
function Road({ from, to, width = 4 }: {
  from: [number, number, number]; to: [number, number, number]; width?: number;
}) {
  const mid: [number, number, number] = [
    (from[0] + to[0]) / 2,
    Math.max(from[1], to[1]) + 0.05,
    (from[2] + to[2]) / 2,
  ];
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  const len = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dx, dz);

  return (
    <group position={mid} rotation={[0, angle, 0]}>
      {/* Asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, len]} />
        <meshLambertMaterial color="#2a2a2a" />
      </mesh>
      {/* Center dashes */}
      {Array.from({ length: Math.floor(len / 5) }).map((_, i) => (
        <mesh key={i} position={[0, 0.02, -len / 2 + i * 5 + 2.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.2, 2]} />
          <meshLambertMaterial color="#ffdd00" />
        </mesh>
      ))}
    </group>
  );
}

/** Wooden bridge over water/gap */
function Bridge({ position, rotation = 0, length = 20 }: {
  position: [number, number, number]; rotation?: number; length?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Deck */}
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[5, 0.4, length]} />
        <meshLambertMaterial color="#8B6914" />
      </mesh>
      {/* Planks */}
      {Array.from({ length: Math.floor(length / 1.5) }).map((_, i) => (
        <mesh key={i} position={[0, 0.25, -length / 2 + i * 1.5 + 0.75]} castShadow>
          <boxGeometry args={[5.2, 0.15, 0.9]} />
          <meshLambertMaterial color="#A0784A" />
        </mesh>
      ))}
      {/* Rails */}
      {[-2.3, 2.3].map((x, i) => (
        <mesh key={i} position={[x, 0.9, 0]} castShadow>
          <boxGeometry args={[0.15, 1.2, length]} />
          <meshLambertMaterial color="#6B4A10" />
        </mesh>
      ))}
      {/* Posts */}
      {Array.from({ length: Math.floor(length / 4) + 1 }).map((_, i) => (
        <group key={i}>
          <mesh position={[-2.3, 0.6, -length / 2 + i * 4]} castShadow>
            <boxGeometry args={[0.2, 1.5, 0.2]} />
            <meshLambertMaterial color="#6B4A10" />
          </mesh>
          <mesh position={[2.3, 0.6, -length / 2 + i * 4]} castShadow>
            <boxGeometry args={[0.2, 1.5, 0.2]} />
            <meshLambertMaterial color="#6B4A10" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Rocky cliff edge */
function Cliff({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[0, 1, 2, 3, 4].map(i => (
        <mesh key={i} position={[(i - 2) * 7, Math.sin(i) * 3, 0]} castShadow receiveShadow>
          <dodecahedronGeometry args={[5 + Math.cos(i) * 2, 0]} />
          <meshLambertMaterial color="#5a5560" />
        </mesh>
      ))}
    </group>
  );
}

/** Sand beach ring */
function Beach({ radius }: { radius: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <ringGeometry args={[radius - 30, radius + 15, 64]} />
      <meshLambertMaterial color="#e8d59a" />
    </mesh>
  );
}

/** Grass patch cluster */
function GrassPatch({ position }: { position: [number, number, number] }) {
  const blades = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    x: (Math.random() - 0.5) * 3,
    z: (Math.random() - 0.5) * 3,
    h: 0.6 + Math.random() * 0.8,
    r: (Math.random() - 0.5) * 0.3,
  })), []);
  return (
    <group position={position}>
      {blades.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} rotation={[0, b.r, b.r * 0.5]} castShadow>
          <boxGeometry args={[0.08, b.h, 0.05]} />
          <meshLambertMaterial color="#3a8a2a" />
        </mesh>
      ))}
    </group>
  );
}

/** Waterfall from mountain */
function Waterfall({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (ref.current && ref.current.material) {
      (ref.current.material as THREE.MeshLambertMaterial).opacity =
        0.5 + Math.sin(clock.getElapsedTime() * 3) * 0.1;
    }
  });
  return (
    <group position={position}>
      {/* Falling water */}
      <mesh ref={ref} position={[0, -8, 0]}>
        <boxGeometry args={[3, 18, 1.5]} />
        <meshLambertMaterial color="#6ab4d8" transparent opacity={0.6} />
      </mesh>
      {/* Mist pool */}
      <mesh position={[0, -17, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5, 16]} />
        <meshLambertMaterial color="#90c8e8" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

/** Pond with lily pads */
function Pond({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
        <circleGeometry args={[12, 24]} />
        <meshLambertMaterial color="#1a6080" transparent opacity={0.85} />
      </mesh>
      {/* Lily pads */}
      {[0, 1, 2, 3, 4].map(i => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 6, 0.25, Math.sin(a) * 6]} rotation={[-Math.PI / 2, 0, a]}>
            <circleGeometry args={[1.2, 8]} />
            <meshLambertMaterial color="#2a8a30" />
          </mesh>
        );
      })}
      {/* Lotus flowers */}
      {[0, 1, 2].map(i => {
        const a = (i / 3) * Math.PI * 2 + 0.5;
        return (
          <mesh key={i} position={[Math.cos(a) * 5, 0.4, Math.sin(a) * 5]}>
            <sphereGeometry args={[0.5, 6, 6]} />
            <meshLambertMaterial color="#ff88aa" />
          </mesh>
        );
      })}
    </group>
  );
}

/** Flower */
function Flower({ position, color = '#ff4488' }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.8, 4]} />
        <meshLambertMaterial color="#2d8b1a" />
      </mesh>
      {[0, 1, 2, 3, 4].map(i => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.22, 0.82, Math.sin(a) * 0.22]}>
            <sphereGeometry args={[0.18, 5, 5]} />
            <meshLambertMaterial color={color} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.83, 0]}>
        <sphereGeometry args={[0.13, 5, 5]} />
        <meshLambertMaterial color="#ffdd00" />
      </mesh>
    </group>
  );
}

/** Campfire */
function Campfire({ position }: { position: [number, number, number] }) {
  const fireRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (fireRef.current) {
      fireRef.current.scale.y = 0.85 + Math.sin(clock.getElapsedTime() * 8) * 0.15;
      fireRef.current.scale.x = 0.9 + Math.sin(clock.getElapsedTime() * 6) * 0.1;
    }
  });
  return (
    <group position={position}>
      {/* Logs */}
      {[0, 1, 2].map(i => {
        const a = (i / 3) * Math.PI;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.6, 0.15, Math.sin(a) * 0.6]} rotation={[0, a, Math.PI / 5]} castShadow>
            <cylinderGeometry args={[0.15, 0.18, 1.4, 6]} />
            <meshLambertMaterial color="#5a3010" />
          </mesh>
        );
      })}
      {/* Embers */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, 8]} />
        <meshLambertMaterial color="#c04000" />
      </mesh>
      {/* Flame */}
      <mesh ref={fireRef} position={[0, 1.0, 0]}>
        <coneGeometry args={[0.55, 1.8, 6]} />
        <meshLambertMaterial color="#ff6600" transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <coneGeometry args={[0.3, 1.2, 5]} />
        <meshLambertMaterial color="#ffdd00" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

/** Windmill */
function Windmill({ position }: { position: [number, number, number] }) {
  const bladesRef = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (bladesRef.current) bladesRef.current.rotation.z = clock.getElapsedTime() * 0.8;
  });
  return (
    <group position={position}>
      {/* Tower */}
      <mesh position={[0, 8, 0]} castShadow>
        <cylinderGeometry args={[1.5, 2.5, 16, 8]} />
        <meshLambertMaterial color="#c8b89a" />
      </mesh>
      {/* Cap */}
      <mesh position={[0, 17, 0]} castShadow>
        <coneGeometry args={[2.5, 4, 8]} />
        <meshLambertMaterial color="#8b4513" />
      </mesh>
      {/* Blades */}
      <group ref={bladesRef} position={[0, 16, 2.6]}>
        {[0, 1, 2, 3].map(i => (
          <mesh key={i} rotation={[0, 0, (i / 4) * Math.PI * 2]} position={[0, 4, 0]} castShadow>
            <boxGeometry args={[0.4, 8, 0.15]} />
            <meshLambertMaterial color="#d4c0a0" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Stone well */
function Well({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 1.6, 12]} />
        <meshLambertMaterial color="#888080" />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.3, 12]} />
        <meshLambertMaterial color="#60605a" />
      </mesh>
      {/* Roof posts */}
      {[-1.4, 1.4].map((x, i) => (
        <mesh key={i} position={[x, 2.2, 0]} castShadow>
          <boxGeometry args={[0.2, 2.8, 0.2]} />
          <meshLambertMaterial color="#5c3317" />
        </mesh>
      ))}
      <mesh position={[0, 3.8, 0]} castShadow>
        <boxGeometry args={[3.5, 0.3, 1.2]} />
        <meshLambertMaterial color="#5c3317" />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 4.3, 0]} castShadow>
        <coneGeometry args={[2.2, 1.5, 4]} />
        <meshLambertMaterial color="#8b2020" />
      </mesh>
    </group>
  );
}

/** Lantern post */
function LanternPost({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (lightRef.current) {
      (lightRef.current.material as THREE.MeshLambertMaterial).opacity =
        0.6 + Math.sin(clock.getElapsedTime() * 2) * 0.2;
    }
  });
  return (
    <group position={position}>
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 6, 6]} />
        <meshLambertMaterial color="#333" />
      </mesh>
      <mesh position={[0, 6.3, 0]}>
        <boxGeometry args={[0.8, 1, 0.8]} />
        <meshLambertMaterial color="#444" />
      </mesh>
      <mesh ref={lightRef} position={[0, 6.3, 0]}>
        <boxGeometry args={[0.65, 0.8, 0.65]} />
        <meshLambertMaterial color="#ffe090" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

/** Dock / pier */
function Dock({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Planks */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[5, 0.25, 22]} />
        <meshLambertMaterial color="#A0784A" />
      </mesh>
      {/* Posts */}
      {[-2, 0, 2].map(x => (
        [0, -5, -10, -15, -20].map((z, i) => (
          <mesh key={`${x}${z}`} position={[x, -2, z]} castShadow>
            <cylinderGeometry args={[0.25, 0.3, 5, 6]} />
            <meshLambertMaterial color="#6B4A10" />
          </mesh>
        ))
      ))}
      {/* Boat tethered at end */}
      <group position={[0, 0.5, -19]}>
        <mesh castShadow>
          <boxGeometry args={[2.5, 0.8, 5]} />
          <meshLambertMaterial color="#9b4a10" />
        </mesh>
        <mesh position={[0, 0.6, 0.5]}>
          <boxGeometry args={[2.3, 0.3, 4.5]} />
          <meshLambertMaterial color="#c07030" />
        </mesh>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────
//  Main WorldMap
// ─────────────────────────────────────────────
export default function WorldMap() {
  const ISLAND_R = 400;

  // Seeded random trees spread across island
  const trees = useMemo(() => {
    const rng = seededRandom(42);
    // Reduced from 220 to 65 trees to massively fix lag!
    return Array.from({ length: 65 }, (_, i) => {
      const r = 30 + rng() * (ISLAND_R - 80);
      const theta = rng() * Math.PI * 2;
      return {
        x: Math.cos(theta) * r,
        z: Math.sin(theta) * r,
        scale: 0.6 + rng() * 0.9,
        variant: Math.floor(rng() * 4),
      };
    }).filter(t => {
      // Keep away from road corridors and buildings
      const distCenter = Math.sqrt(t.x * t.x + t.z * t.z);
      return distCenter > 25 && !(Math.abs(t.x) < 8 && Math.abs(t.z) < 200) && !(Math.abs(t.z) < 8 && Math.abs(t.x) < 200);
    });
  }, []);

  // Grass patches (disabled to instantly boost frame rate!)
  const grassPatches = useMemo(() => {
    return [] as {x: number, z: number}[];
  }, []);

  // Flowers
  const flowers = useMemo(() => {
    const rng = seededRandom(99);
    const colors = ['#ff4488', '#ff8800', '#aa44ff', '#ff2244', '#ffffff', '#ffaacc'];
    // Reduced to 20 for lag
    return Array.from({ length: 20 }, () => {
      const r = 20 + rng() * (ISLAND_R - 70);
      const theta = rng() * Math.PI * 2;
      return { x: Math.cos(theta) * r, z: Math.sin(theta) * r, color: colors[Math.floor(rng() * colors.length)] };
    });
  }, []);

  // Palm trees on beach ring
  const palms = useMemo(() => {
    const rng = seededRandom(13);
    return Array.from({ length: 12 }, () => {
      const r = ISLAND_R - 45 + rng() * 30;
      const theta = rng() * Math.PI * 2;
      return { x: Math.cos(theta) * r, z: Math.sin(theta) * r };
    });
  }, []);

  // Butterflies
  const butterflies = useMemo(() => {
    const rng = seededRandom(55);
    const pairs = [['#ff6b9d', '#ffd700'], ['#00aaff', '#ffffff'], ['#aa44ff', '#ffaa00'], ['#ff8800', '#44ff88']];
    return Array.from({ length: 5 }, () => {
      const r = 20 + rng() * 100;
      const theta = rng() * Math.PI * 2;
      const pair = pairs[Math.floor(rng() * pairs.length)];
      return { x: Math.cos(theta) * r, z: Math.sin(theta) * r, c1: pair[0], c2: pair[1] };
    });
  }, []);

  // Insects
  const insects = useMemo(() => {
    const rng = seededRandom(88);
    const colors = ['#ffdd00', '#88ff44', '#ff8800'];
    return Array.from({ length: 6 }, () => {
      const r = 15 + rng() * 120;
      const theta = rng() * Math.PI * 2;
      return { x: Math.cos(theta) * r, z: Math.sin(theta) * r, color: colors[Math.floor(rng() * colors.length)] };
    });
  }, []);

  // Lantern posts along main road
  const lanterns = useMemo(() => {
    // Only spawn a few to prevent massive mesh count
    return [
      ...Array.from({ length: 5 }, (_, i) => ({ x: 6, z: -130 + i * 40 })),
      ...Array.from({ length: 5 }, (_, i) => ({ x: -6, z: -130 + i * 40 })),
      ...Array.from({ length: 5 }, (_, i) => ({ x: -130 + i * 40, z: 6 })),
      ...Array.from({ length: 5 }, (_, i) => ({ x: -130 + i * 40, z: -6 })),
    ];
  }, []);

  return (
    <group>
      {/* ── Base ground ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[ISLAND_R, 80]} />
        <meshLambertMaterial color="#2e7a28" />
      </mesh>

      {/* ── Sandy beach ring ── */}
      <Beach radius={ISLAND_R} />

      {/* ── Ocean ── */}
      <AnimatedWater />

      {/* ── Shallow ocean fringe ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <ringGeometry args={[ISLAND_R + 10, ISLAND_R + 80, 64]} />
        <meshLambertMaterial color="#0d4a8a" transparent opacity={0.6} />
      </mesh>

      {/* ── Mountains cluster NW ── */}
      <Mountain position={[-180, 0, -200]} scale={1.3} />
      <Mountain position={[-140, 0, -170]} scale={0.9} color="#6a6070" />
      <Mountain position={[-215, 0, -175]} scale={0.75} color="#504a5a" />
      <Mountain position={[-155, 0, -225]} scale={0.6} color="#5a5868" />

      {/* ── Mountain cluster NE ── */}
      <Mountain position={[160, 0, -190]} scale={1.1} color="#5a606a" />
      <Mountain position={[200, 0, -160]} scale={0.8} color="#4a5060" />
      <Mountain position={[140, 0, -215]} scale={0.65} />

      {/* ── Hills (mid-size, SE/SW) ── */}
      <mesh position={[120, 0, 150]}>
        <sphereGeometry args={[28, 10, 8]} />
        <meshLambertMaterial color="#3a7a30" />
      </mesh>
      <mesh position={[-130, 0, 140]}>
        <sphereGeometry args={[22, 10, 8]} />
        <meshLambertMaterial color="#357028" />
      </mesh>
      <mesh position={[80, 0, 200]}>
        <sphereGeometry args={[18, 10, 8]} />
        <meshLambertMaterial color="#2f6825" />
      </mesh>

      {/* ── Waterfall from NW mountains ── */}
      <Waterfall position={[-170, 38, -195]} />

      {/* ── River from mountains to center pond ── */}
      {Array.from({ length: 20 }, (_, i) => {
        const t = i / 19;
        const x = -170 + t * 100;
        const z = -150 + t * 60;
        return (
          <mesh key={i} position={[x, -0.3, z]} rotation={[-Math.PI / 2, 0, Math.atan2(60, 100)]}>
            <planeGeometry args={[5, 8]} />
            <meshLambertMaterial color="#3a90c0" transparent opacity={0.8} />
          </mesh>
        );
      })}

      {/* ── Central pond ── */}
      <Pond position={[-60, 0, -80]} />

      {/* ── Central plaza ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
        <circleGeometry args={[20, 24]} />
        <meshLambertMaterial color="#c8b89a" />
      </mesh>

      {/* ── ROADS — North-South spine ── */}
      <Road from={[0, 0.1, -ISLAND_R + 60]} to={[0, 0.1, ISLAND_R - 60]} width={7} />
      {/* East-West spine */}
      <Road from={[-ISLAND_R + 60, 0.1, 0]} to={[ISLAND_R - 60, 0.1, 0]} width={7} />
      {/* NE diagonal */}
      <Road from={[20, 0.1, -20]} to={[130, 0.1, -130]} width={4.5} />
      {/* SW diagonal */}
      <Road from={[-20, 0.1, 20]} to={[-110, 0.1, 120]} width={4.5} />
      {/* Village loop */}
      <Road from={[40, 0.1, 40]} to={[90, 0.1, 40]} width={4} />
      <Road from={[90, 0.1, 40]} to={[90, 0.1, 100]} width={4} />
      <Road from={[90, 0.1, 100]} to={[40, 0.1, 100]} width={4} />
      <Road from={[40, 0.1, 100]} to={[40, 0.1, 40]} width={4} />
      {/* Beach access path */}
      <Road from={[0, 0.1, ISLAND_R - 60]} to={[0, 0.1, ISLAND_R - 25]} width={3.5} />

      {/* ── Uphill road markers (elevated) ── */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[-160 + i * 12, i * 1.5, -170 + i * 12]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
          <planeGeometry args={[4, 10]} />
          <meshLambertMaterial color="#2a2a2a" />
        </mesh>
      ))}

      {/* ── Bridges ── */}
      <Bridge position={[0, -0.5, -85]} length={16} />
      <Bridge position={[-62, -0.4, 0]} rotation={Math.PI / 2} length={12} />

      {/* ── Cliffs ── */}
      <Cliff position={[-260, 5, -100]} rotation={0.4} />
      <Cliff position={[220, 4, 120]} rotation={-0.6} />

      {/* ── Houses — village cluster ── */}
      <House position={[55, 0, 55]} rotation={-0.4} wallColor="#d4b87a" roofColor="#922020" />
      <House position={[75, 0, 58]} rotation={0.2} wallColor="#c8a870" roofColor="#6b3030" />
      <House position={[58, 0, 80]} rotation={0.8} wallColor="#e0c898" roofColor="#8b2020" />
      <House position={[80, 0, 85]} rotation={-0.2} wallColor="#d4b070" roofColor="#7a2828" />

      {/* Farmhouse */}
      <House position={[-80, 0, 60]} rotation={1.2} wallColor="#e8d8b0" roofColor="#6b4020" />

      {/* Lone cottage near beach */}
      <House position={[160, 0, 250]} rotation={-0.8} wallColor="#f0e0c0" roofColor="#a03030" />

      {/* ── Well ── */}
      <Well position={[65, 0, 68]} />

      {/* ── Windmill ── */}
      <Windmill position={[-90, 0, 30]} />

      {/* ── Campfire ── */}
      <Campfire position={[0, 0.2, 30]} />
      <Campfire position={[110, 0.2, -90]} />

      {/* ── Treasure chests ── */}
      <TreasureChest position={[170, 0.5, -180]} />
      <TreasureChest position={[-200, 0.5, 170]} />
      <TreasureChest position={[30, 30, -215]} />

      {/* ── Animals ── */}
      <Cow position={[-70, 0, 50]} rotation={0.5} />
      <Cow position={[-75, 0, 62]} rotation={1.8} />
      <Cow position={[-60, 0, 58]} rotation={-0.3} />
      <Rabbit position={[35, 0, 45]} rotation={0.2} />
      <Rabbit position={[42, 0, 38]} rotation={2.5} />
      <Rabbit position={[28, 0, 52]} rotation={-1.0} />
      <Duck position={[-52, 0.25, -75]} />
      <Duck position={[-56, 0.25, -68]} />
      <Duck position={[-48, 0.25, -80]} />

      {/* ── Butterflies ── */}
      {butterflies.map((b, i) => (
        <Butterfly key={i} position={[b.x, 2, b.z]} color1={b.c1} color2={b.c2} />
      ))}

      {/* ── Insects ── */}
      {insects.map((b, i) => (
        <Insect key={i} position={[b.x, 1, b.z]} color={b.color} />
      ))}

      {/* ── Forest trees ── */}
      {trees.map((t, i) => (
        <Tree key={i} position={[t.x, 0, t.z]} scale={t.scale} variant={t.variant} />
      ))}

      {/* ── Palm trees on beach ── */}
      {palms.map((p, i) => (
        <PalmTree key={i} position={[p.x, 0, p.z]} />
      ))}

      {/* ── Grass patches ── */}
      {grassPatches.map((g, i) => (
        <GrassPatch key={i} position={[g.x, 0.02, g.z]} />
      ))}

      {/* ── Flowers ── */}
      {flowers.map((f, i) => (
        <Flower key={i} position={[f.x, 0, f.z]} color={f.color} />
      ))}

      {/* ── Lantern posts ── */}
      {lanterns.map((l, i) => (
        <LanternPost key={i} position={[l.x, 0, l.z]} />
      ))}

      {/* ── Dock & Pier ── */}
      <Dock position={[0, -0.3, ISLAND_R - 22]} rotation={0} />
      <Dock position={[ISLAND_R - 22, -0.3, 0]} rotation={Math.PI / 2} />

      {/* ── Boulders scattered around island ── */}
      {[
        [80, 0, -60], [-100, 0, -40], [150, 0, 80], [-50, 0, 200],
        [200, 0, -100], [-180, 0, 80], [70, 0, 150], [-120, 0, -200],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <dodecahedronGeometry args={[4 + (i % 3) * 2, 0]} />
          <meshLambertMaterial color="#706870" />
        </mesh>
      ))}

      {/* ── Ruins / ancient stones ── */}
      {[0, 1, 2, 3, 4].map(i => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * 200, 0, Math.sin(a) * 200]}>
            <mesh position={[0, 3, 0]} castShadow>
              <boxGeometry args={[3, 7, 3]} />
              <meshLambertMaterial color="#807868" />
            </mesh>
            <mesh position={[0, 7.5, 0]} castShadow>
              <boxGeometry args={[4, 1, 1]} />
              <meshLambertMaterial color="#706858" />
            </mesh>
          </group>
        );
      })}

      {/* ── Fog / atmosphere layer ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 45, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshLambertMaterial color="#b8d8f0" transparent opacity={0.04} />
      </mesh>
    </group>
  );
}