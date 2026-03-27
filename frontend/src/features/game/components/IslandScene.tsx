import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { TargetObject } from '../hooks/useGameState';
import WorldMap from './WorldMap';

// ── Constants ─────────────────────────────────────────────────────────────────
const ISLAND_R = 400;
const PLAYER_R = 0.38;
const MOVE_SPEED = 0.9;    // Slightly reduced speed based on feedback
const CAM_H = 3.5;    // Camera height (shoulder level)
const GLOW: Record<string, string> = {
  'Windmill': '#64B5F6',
  'Farm House': '#FFB74D',
  'Beach Cottage': '#4DB6AC',
  'Waterfall Pool': '#29B6F6',
  'South Bridge': '#A1887F',
  'West Bridge': '#A1887F',
  'Village Well': '#90CAF9',
  'East Campfire': '#FF8A65',
  'Lost Treasure': '#FFD700',
  'Mountain Treasure': '#FFD700',
  'Lily Pond': '#F06292',
  'Village Square': '#BA68C8',
  'Wooden Table': '#8B4513',
  'Comfy Bed': '#E57373',
  'Red Couch': '#E53935',
};

// ── Shared Props ──────────────────────────────────────────────────────────────
interface SceneProps {
  joystick: React.MutableRefObject<{ dx: number; dz: number }>;
  target: TargetObject;
  decoys: TargetObject[];
  onMove: (x: number, z: number, dist: number) => void;
  onProximityWarning?: (decoy: TargetObject) => void;
}

// ── Night stars ───────────────────────────────────────────────────────────────
function Stars() {
  const pts = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 600; i++) {
      const r = 200 + Math.random() * 300;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.8);
      arr.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi) + 20,
        r * Math.sin(phi) * Math.sin(theta)
      );
    }
    return new Float32Array(arr);
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pts, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={1.8} transparent opacity={0.9} />
    </points>
  );
}

// ── Target Shape Code ─────────────────────────────────────────────────────────
function PulseRing({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 3 + Math.sin(clock.getElapsedTime() * 2) * 1.5;
    ref.current.scale.setScalar(s);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.4 + Math.sin(clock.getElapsedTime() * 4) * 0.4;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
      <ringGeometry args={[0.8, 1.2, 32]} />
      <meshBasicMaterial color={color} transparent depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function TargetGlobe({ emojiName, color }: { emojiName: string, color: string }) {
  const bobRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (bobRef.current) {
      bobRef.current.position.y = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.5;
      bobRef.current.rotation.y += 0.02;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <PulseRing color={color} />
      <pointLight position={[0, 5, 0]} color={color} intensity={80} distance={150} decay={1.5} />
      <group ref={bobRef}>
        <mesh position={[0, 1, 0]}>
          <octahedronGeometry args={[2]} />
          <meshBasicMaterial color={color} wireframe={true} />
        </mesh>
        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshLambertMaterial color={color} emissive={color} emissiveIntensity={0.8} />
        </mesh>
      </group>
    </group>
  );
}

// ── Magic Signposts ────────────────────────────────────────────────────────────
function SignPost({ position, target }: { position: [number, number, number], target: TargetObject }) {
  const boardRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (boardRef.current) {
      const dx = target.x - position[0];
      const dz = target.z - position[2];
      boardRef.current.rotation.y = Math.atan2(dx, dz);
    }
  });

  return (
    <group position={position}>
      {/* Wooden Post */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 2]} />
        <meshLambertMaterial color="#5C3317" />
      </mesh>
      {/* Rotating Arrow Board */}
      <group ref={boardRef} position={[0, 1.7, 0]}>
        {/* Main Board */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.2, 0.6, 1.4]} />
          <meshLambertMaterial color="#8B4513" />
        </mesh>
        {/* Arrow Tip */}
        <mesh position={[0, 0, 0.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0, 0.4, 0.6, 4]} />
          <meshLambertMaterial color="#FFD700" />
        </mesh>
      </group>
    </group>
  );
}

// ── Procedural Dynamic Models ───────────────────────────────────────────────────
function DynamicModel({ name }: { name: string }) {
  // Furniture
  if (name === 'Wooden Table') return (
    <group scale={3}>
      <mesh position={[0, 1.4, 0]} castShadow><boxGeometry args={[2, 0.2, 1.5]} /><meshLambertMaterial color="#8B4513" /></mesh>
      <mesh position={[-0.9, 0.6, -0.6]} castShadow><boxGeometry args={[0.2, 1.4, 0.2]} /><meshLambertMaterial color="#5C3317" /></mesh>
      <mesh position={[0.9, 0.6, -0.6]} castShadow><boxGeometry args={[0.2, 1.4, 0.2]} /><meshLambertMaterial color="#5C3317" /></mesh>
      <mesh position={[-0.9, 0.6, 0.6]} castShadow><boxGeometry args={[0.2, 1.4, 0.2]} /><meshLambertMaterial color="#5C3317" /></mesh>
      <mesh position={[0.9, 0.6, 0.6]} castShadow><boxGeometry args={[0.2, 1.4, 0.2]} /><meshLambertMaterial color="#5C3317" /></mesh>
    </group>
  );
  if (name === 'Comfy Bed') return (
    <group scale={2.5}>
      <mesh position={[0, 0.6, 0]} castShadow><boxGeometry args={[3, 0.6, 4]} /><meshLambertMaterial color="#cfcfcf" /></mesh>
      <mesh position={[0, 1.1, -1.3]} castShadow><boxGeometry args={[2.8, 0.4, 1.2]} /><meshLambertMaterial color="#ffffff" /></mesh>
      <mesh position={[0, 0.5, -2]} castShadow><boxGeometry args={[3.2, 1.5, 0.3]} /><meshLambertMaterial color="#5C3317" /></mesh>
    </group>
  );
  if (name === 'Red Couch') return (
    <group scale={3}>
      <mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[3, 0.8, 1.5]} /><meshLambertMaterial color="#E53935" /></mesh>
      <mesh position={[0, 1.2, -0.6]} castShadow><boxGeometry args={[3, 1.2, 0.4]} /><meshLambertMaterial color="#D32F2F" /></mesh>
      <mesh position={[-1.4, 0.8, 0]} castShadow><boxGeometry args={[0.4, 0.8, 1.6]} /><meshLambertMaterial color="#B71C1C" /></mesh>
      <mesh position={[1.4, 0.8, 0]} castShadow><boxGeometry args={[0.4, 0.8, 1.6]} /><meshLambertMaterial color="#B71C1C" /></mesh>
    </group>
  );

  // Endless Items
  if (name === 'Red Apple') return (
    <group scale={2} position={[0,1,0]}>
      <mesh castShadow><sphereGeometry args={[1, 32, 32]} /><meshLambertMaterial color="#D32F2F" /></mesh>
      <mesh position={[0, 1.1, 0]} castShadow><cylinderGeometry args={[0.08, 0.08, 0.6]} /><meshLambertMaterial color="#5C3317" /></mesh>
      <mesh position={[0.3, 1.1, 0]} rotation={[0,0,Math.PI/4]} castShadow><cylinderGeometry args={[0.01, 0.3, 0.6, 3]} /><meshLambertMaterial color="#4CAF50" /></mesh>
    </group>
  );
  if (name === 'Space Rocket') return (
    <group scale={2} position={[0,2,0]}>
      <mesh castShadow><cylinderGeometry args={[1, 1, 4, 32]} /><meshLambertMaterial color="#ffffff" /></mesh>
      <mesh position={[0, 2.8, 0]} castShadow><coneGeometry args={[1.05, 2, 32]} /><meshLambertMaterial color="#E53935" /></mesh>
      <mesh position={[1.2, -1.5, 0]} rotation={[0,0,-Math.PI/6]} castShadow><coneGeometry args={[0.4, 1.5]} /><meshLambertMaterial color="#E53935" /></mesh>
      <mesh position={[-1.2, -1.5, 0]} rotation={[0,0,Math.PI/6]} castShadow><coneGeometry args={[0.4, 1.5]} /><meshLambertMaterial color="#E53935" /></mesh>
      <mesh position={[0, 0.5, 1]} castShadow><cylinderGeometry args={[0.4, 0.4, 0.1]} /><meshLambertMaterial color="#2196F3" /></mesh>
    </group>
  );
  if (name === 'Alien UFO') return (
    <group scale={2} position={[0,1.5,0]}>
      <mesh castShadow rotation={[Math.PI/2, 0, 0]}><torusGeometry args={[2, 0.6, 16, 64]} /><meshLambertMaterial color="#B0BEC5" /></mesh>
      <mesh position={[0, 0.5, 0]} castShadow><sphereGeometry args={[1.5, 32, 16, 0, Math.PI*2, 0, Math.PI/2]} /><meshLambertMaterial color="#00BCD4" transparent opacity={0.6} /></mesh>
      <mesh position={[0, -0.5, 0]} castShadow><cylinderGeometry args={[1.6, 1, 0.8]} /><meshLambertMaterial color="#78909C" /></mesh>
    </group>
  );
  if (name === 'Big Dinosaur') return (
    <group scale={1.5} position={[0,2,0]}>
      <mesh castShadow rotation={[Math.PI/2, 0, 0]}><capsuleGeometry args={[1.5, 3, 16, 32]} /><meshLambertMaterial color="#4CAF50" /></mesh>
      <mesh position={[2, 2, 0]} castShadow rotation={[0,0,-Math.PI/6]}><capsuleGeometry args={[0.8, 2, 16, 16]} /><meshLambertMaterial color="#388E3C" /></mesh>
      <mesh position={[2.8, 3.2, 0]} castShadow><boxGeometry args={[1.5, 1.2, 1.2]} /><meshLambertMaterial color="#4CAF50" /></mesh>
      <mesh position={[-2.5, 0, 0]} castShadow rotation={[0,0,Math.PI/4]}><coneGeometry args={[0.8, 3]} /><meshLambertMaterial color="#388E3C" /></mesh>
    </group>
  );
  if (name === 'Robot Friend') return (
    <group scale={1.5} position={[0,1.5,0]}>
      <mesh castShadow position={[0, 1.5, 0]}><boxGeometry args={[1.8, 1.5, 1.8]} /><meshLambertMaterial color="#9E9E9E" /></mesh>
      <mesh castShadow position={[0.4, 1.6, 0.95]}><boxGeometry args={[0.4, 0.3, 0.1]} /><meshLambertMaterial color="#00BCD4" /></mesh>
      <mesh castShadow position={[-0.4, 1.6, 0.95]}><boxGeometry args={[0.4, 0.3, 0.1]} /><meshLambertMaterial color="#00BCD4" /></mesh>
      <mesh castShadow position={[0, -0.5, 0]}><cylinderGeometry args={[1, 1, 2]} /><meshLambertMaterial color="#757575" /></mesh>
      <mesh castShadow position={[0, 2.5, 0]}><cylinderGeometry args={[0.05, 0.05, 0.8]} /><meshLambertMaterial color="#FFC107" /></mesh>
    </group>
  );
  if (name === 'Birthday Cake') return (
    <group scale={2} position={[0,1,0]}>
      <mesh castShadow position={[0, -0.5, 0]}><cylinderGeometry args={[2, 2, 1, 32]} /><meshLambertMaterial color="#F8BBD0" /></mesh>
      <mesh castShadow position={[0, 0.5, 0]}><cylinderGeometry args={[1.5, 1.5, 1, 32]} /><meshLambertMaterial color="#F48FB1" /></mesh>
      <mesh castShadow position={[0, 1.5, 0]}><cylinderGeometry args={[0.1, 0.1, 1]} /><meshLambertMaterial color="#FFF176" /></mesh>
      <mesh castShadow position={[0, 2.1, 0]}><sphereGeometry args={[0.15]} /><meshLambertMaterial color="#FF5252" /></mesh>
    </group>
  );
  if (name === 'Pizza Slice') return (
    <group scale={2} position={[0,0.5,0]} rotation={[-Math.PI/6, 0, 0]}>
      <mesh castShadow><cylinderGeometry args={[3, 3, 0.4, 32, 1, false, 0, Math.PI/4]} /><meshLambertMaterial color="#FFCA28" /></mesh>
      <mesh castShadow position={[1.5, 0.3, 1]}><cylinderGeometry args={[0.3, 0.3, 0.1]} /><meshLambertMaterial color="#D32F2F" /></mesh>
      <mesh castShadow position={[2, 0.3, 0.5]}><cylinderGeometry args={[0.3, 0.3, 0.1]} /><meshLambertMaterial color="#D32F2F" /></mesh>
      <mesh castShadow position={[1, 0.3, 1.8]}><cylinderGeometry args={[0.3, 0.3, 0.1]} /><meshLambertMaterial color="#D32F2F" /></mesh>
      <mesh castShadow position={[2.5, 0.3, 2.2]}><cylinderGeometry args={[0.3, 0.3, 0.1]} /><meshLambertMaterial color="#D32F2F" /></mesh>
    </group>
  );
  if (name === 'Golden Key') return (
    <group scale={1.5} position={[0, 1.5, 0]} rotation={[0, 0, Math.PI/4]}>
      <mesh castShadow><cylinderGeometry args={[0.15, 0.15, 4]} /><meshLambertMaterial color="#FFD700" /></mesh>
      <mesh castShadow position={[0, 2, 0]}><torusGeometry args={[0.6, 0.2, 16, 32]} /><meshLambertMaterial color="#FFD700" /></mesh>
      <mesh castShadow position={[0.4, -1, 0]}><boxGeometry args={[0.8, 0.3, 0.1]} /><meshLambertMaterial color="#FFD700" /></mesh>
      <mesh castShadow position={[0.4, -1.5, 0]}><boxGeometry args={[0.8, 0.3, 0.1]} /><meshLambertMaterial color="#FFD700" /></mesh>
    </group>
  );
  if (name === 'Magic Potion') return (
    <group scale={2} position={[0, 1, 0]}>
      <mesh castShadow position={[0,0.5,0]}><sphereGeometry args={[1, 32, 32]} /><meshLambertMaterial color="#E040FB" transparent opacity={0.8} /></mesh>
      <mesh castShadow position={[0,1.8,0]}><cylinderGeometry args={[0.4, 0.4, 1.2]} /><meshLambertMaterial color="#FFFFFF" transparent opacity={0.5} /></mesh>
      <mesh castShadow position={[0,2.5,0]}><cylinderGeometry args={[0.45, 0.3, 0.3]} /><meshLambertMaterial color="#795548" /></mesh>
    </group>
  );
  if (name === 'Blue Car') return (
    <group scale={2} position={[0, 0.5, 0]}>
      <mesh castShadow position={[0, 0.5, 0]}><boxGeometry args={[3, 1, 1.5]} /><meshLambertMaterial color="#2196F3" /></mesh>
      <mesh castShadow position={[0, 1.25, 0]}><boxGeometry args={[1.5, 0.8, 1.4]} /><meshLambertMaterial color="#1E88E5" /></mesh>
      <mesh castShadow position={[-1, 0, 0.8]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.4, 0.4, 0.2]} /><meshLambertMaterial color="#212121" /></mesh>
      <mesh castShadow position={[1, 0, 0.8]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.4, 0.4, 0.2]} /><meshLambertMaterial color="#212121" /></mesh>
      <mesh castShadow position={[-1, 0, -0.8]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.4, 0.4, 0.2]} /><meshLambertMaterial color="#212121" /></mesh>
      <mesh castShadow position={[1, 0, -0.8]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.4, 0.4, 0.2]} /><meshLambertMaterial color="#212121" /></mesh>
    </group>
  );
  if (name === 'Teddy Bear') return (
    <group scale={2} position={[0, 1, 0]}>
      <mesh castShadow position={[0, 0, 0]}><sphereGeometry args={[1]} /><meshLambertMaterial color="#8D6E63" /></mesh>
      <mesh castShadow position={[0, 1.2, 0]}><sphereGeometry args={[0.8]} /><meshLambertMaterial color="#A1887F" /></mesh>
      <mesh castShadow position={[-0.6, 1.8, 0]}><sphereGeometry args={[0.3]} /><meshLambertMaterial color="#8D6E63" /></mesh>
      <mesh castShadow position={[0.6, 1.8, 0]}><sphereGeometry args={[0.3]} /><meshLambertMaterial color="#8D6E63" /></mesh>
      <mesh castShadow position={[-0.8, -0.2, 0.5]}><sphereGeometry args={[0.4]} /><meshLambertMaterial color="#A1887F" /></mesh>
      <mesh castShadow position={[0.8, -0.2, 0.5]}><sphereGeometry args={[0.4]} /><meshLambertMaterial color="#A1887F" /></mesh>
    </group>
  );
  if (name === 'Magic Wand') return (
    <group scale={2} position={[0, 2, 0]} rotation={[Math.PI/6, 0, Math.PI/6]}>
      <mesh castShadow><cylinderGeometry args={[0.08, 0.08, 3]} /><meshLambertMaterial color="#212121" /></mesh>
      <mesh castShadow position={[0, 1.5, 0]}><cylinderGeometry args={[0.1, 0.1, 0.4]} /><meshLambertMaterial color="#FFFFFF" /></mesh>
      <mesh castShadow position={[0, 1.8, 0]}><octahedronGeometry args={[0.5]} /><meshBasicMaterial color="#FFEB3B" /></mesh>
    </group>
  );
  if (name === 'Pirate Ship') return (
    <group scale={2} position={[0, 0.5, 0]}>
      <mesh castShadow position={[0, 0.5, 0]}><boxGeometry args={[4, 1, 1.5]} /><meshLambertMaterial color="#5D4037" /></mesh>
      <mesh castShadow position={[2, 0.5, 0]} rotation={[0, 0, -Math.PI/6]}><boxGeometry args={[1, 1, 1.5]} /><meshLambertMaterial color="#4E342E" /></mesh>
      <mesh castShadow position={[0, 2, 0]}><cylinderGeometry args={[0.1, 0.1, 4]} /><meshLambertMaterial color="#3E2723" /></mesh>
      <mesh castShadow position={[0, 2.5, 0.1]}><planeGeometry args={[2, 2]} /><meshLambertMaterial color="#FFFFFF" side={THREE.DoubleSide} /></mesh>
    </group>
  );
  if (name === 'Electric Guitar') return (
    <group scale={1.5} position={[0, 2, 0]} rotation={[-Math.PI/4, 0, Math.PI/4]}>
      <mesh castShadow position={[0, -1, 0]}><boxGeometry args={[1.5, 2, 0.3]} /><meshLambertMaterial color="#E53935" /></mesh>
      <mesh castShadow position={[0, 1, 0]}><boxGeometry args={[0.3, 3, 0.2]} /><meshLambertMaterial color="#F5DEB3" /></mesh>
      <mesh castShadow position={[0, 2.8, 0]}><boxGeometry args={[0.5, 0.6, 0.2]} /><meshLambertMaterial color="#E53935" /></mesh>
    </group>
  );
  if (name === 'Green Turtle') return (
    <group scale={2} position={[0, 0.5, 0]}>
      <mesh castShadow position={[0, 0.5, 0]}><sphereGeometry args={[1, 32, 16, 0, Math.PI*2, 0, Math.PI/2]} /><meshLambertMaterial color="#388E3C" /></mesh>
      <mesh castShadow position={[0, 0.3, 1.2]}><sphereGeometry args={[0.4]} /><meshLambertMaterial color="#81C784" /></mesh>
      <mesh castShadow position={[-1, 0.2, 0.8]}><sphereGeometry args={[0.4]} /><meshLambertMaterial color="#81C784" /></mesh>
      <mesh castShadow position={[1, 0.2, 0.8]}><sphereGeometry args={[0.4]} /><meshLambertMaterial color="#81C784" /></mesh>
      <mesh castShadow position={[-0.8, 0.2, -0.8]}><sphereGeometry args={[0.4]} /><meshLambertMaterial color="#81C784" /></mesh>
      <mesh castShadow position={[0.8, 0.2, -0.8]}><sphereGeometry args={[0.4]} /><meshLambertMaterial color="#81C784" /></mesh>
    </group>
  );

  // If absolutely missing, show a tiny brown block (safety fallback to prevent crash)
  return <mesh><boxGeometry args={[1,1,1]} /><meshLambertMaterial color="#8B4513" /></mesh>;
}


// ── Player Avatar & Compass ───────────────────────────────────────────────────
function PlayerAvatar({ meshRef, target, joystick }: { meshRef: React.MutableRefObject<THREE.Group | null>; target: TargetObject; joystick: React.MutableRefObject<{ dx: number; dz: number }> }) {
  const compassRef = useRef<THREE.Group>(null);
  
  // Limb refs for procedural animation
  const leftLegRef  = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef  = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const bodyRef     = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    // 1. Compass rotation
    if (compassRef.current && meshRef.current) {
      const dxArrow = target.x - meshRef.current.position.x;
      const dzArrow = target.z - meshRef.current.position.z;
      compassRef.current.rotation.y = Math.atan2(dxArrow, dzArrow);
    }

    // 2. Walking animations
    const { dx, dz } = joystick.current;
    const isMoving = dx !== 0 || dz !== 0;
    const t = clock.getElapsedTime() * 12; // Swing speed

    if (isMoving) {
      const swing = Math.sin(t) * 0.7; // 40 degrees swing roughly
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current)  leftArmRef.current.rotation.x  = -swing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing;
      // Slight vertical bobbing
      if (bodyRef.current) bodyRef.current.position.y = Math.abs(Math.sin(t)) * 0.1;
    } else {
      // Return to idle stance smoothly
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.1);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.1);
      if (leftArmRef.current)  leftArmRef.current.rotation.x  = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, 0.1);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, 0.1);
      // Gentle breathing effect
      if (bodyRef.current) bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, Math.sin(clock.getElapsedTime()*2) * 0.05, 0.1);
    }
  });

  return (
    <group ref={meshRef}>
      {/* Compass Hologram ring */}
      <group ref={compassRef} position={[0, 0.1, 0]}>
        <mesh position={[0, 0, 1.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.3, 0.8, 4]} />
          <meshBasicMaterial color="#FFD700" />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.4, 32]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.6} />
        </mesh>
      </group>

      {/* Boxy Skeleton */}
      <group ref={bodyRef}>
        
        {/* Torso */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[0.7, 1.0, 0.4]} />
          <meshLambertMaterial color="#0288d1" /> {/* Blue shirt */}
        </mesh>

        {/* Head */}
        <mesh position={[0, 2.05, 0]} castShadow>
          <boxGeometry args={[0.6, 0.6, 0.6]} />
          <meshLambertMaterial color="#ffccaa" /> {/* Skin */}
        </mesh>
        
        {/* Hair block edge detailing */}
        <mesh position={[0, 2.4, -0.05]} castShadow>
          <boxGeometry args={[0.65, 0.2, 0.65]} />
          <meshLambertMaterial color="#4e342e" /> {/* Brown hair */}
        </mesh>
        <mesh position={[0, 2.25, 0.25]} castShadow>
          <boxGeometry args={[0.65, 0.15, 0.2]} />
          <meshLambertMaterial color="#4e342e" />
        </mesh>

        {/* Simple Eyes */}
        <mesh position={[-0.15, 2.1, 0.31]}>
          <boxGeometry args={[0.1, 0.1, 0.05]} />
          <meshBasicMaterial color="#111111" />
        </mesh>
        <mesh position={[0.15, 2.1, 0.31]}>
          <boxGeometry args={[0.1, 0.1, 0.05]} />
          <meshBasicMaterial color="#111111" />
        </mesh>

        {/* Left Arm Pivot (Shoulder) */}
        <group ref={leftArmRef} position={[-0.5, 1.6, 0]}>
          <mesh position={[0, -0.4, 0]} castShadow>
            <boxGeometry args={[0.25, 0.8, 0.25]} />
            <meshLambertMaterial color="#ffccaa" /> 
          </mesh>
          <mesh position={[0, -0.1, 0]} castShadow>
            <boxGeometry args={[0.26, 0.3, 0.26]} />
            <meshLambertMaterial color="#0288d1" /> {/* Sleeves */}
          </mesh>
        </group>

        {/* Right Arm Pivot (Shoulder) */}
        <group ref={rightArmRef} position={[0.5, 1.6, 0]}>
          <mesh position={[0, -0.4, 0]} castShadow>
            <boxGeometry args={[0.25, 0.8, 0.25]} />
            <meshLambertMaterial color="#ffccaa" />
          </mesh>
          <mesh position={[0, -0.1, 0]} castShadow>
            <boxGeometry args={[0.26, 0.3, 0.26]} />
            <meshLambertMaterial color="#0288d1" /> {/* Sleeves */}
          </mesh>
        </group>

        {/* Left Leg Pivot (Hip) */}
        <group ref={leftLegRef} position={[-0.2, 0.7, 0]}>
          <mesh position={[0, -0.35, 0]} castShadow>
            <boxGeometry args={[0.26, 0.7, 0.26]} />
            <meshLambertMaterial color="#1565c0" /> {/* Dark blue pants */}
          </mesh>
          <mesh position={[0, -0.75, 0.05]} castShadow>
            <boxGeometry args={[0.28, 0.15, 0.35]} />
            <meshLambertMaterial color="#212121" /> {/* Shoes */}
          </mesh>
        </group>

        {/* Right Leg Pivot (Hip) */}
        <group ref={rightLegRef} position={[0.2, 0.7, 0]}>
          <mesh position={[0, -0.35, 0]} castShadow>
            <boxGeometry args={[0.26, 0.7, 0.26]} />
            <meshLambertMaterial color="#1565c0" />
          </mesh>
          <mesh position={[0, -0.75, 0.05]} castShadow>
            <boxGeometry args={[0.28, 0.15, 0.35]} />
            <meshLambertMaterial color="#212121" /> {/* Shoes */}
          </mesh>
        </group>

      </group>

      <pointLight color="#4fc3f7" intensity={5} distance={10} decay={2} />
    </group>
  );
}

// ── Central Game Loop (OrbitControls Camera-Relative) ─────────────────────────
function GameLoop({
  joystick,
  target,
  decoys,
  onMove,
  onProximityWarning,
  playerMeshRef,
  playerPosRef,
  controlsRef,
}: {
  joystick: React.MutableRefObject<{ dx: number; dz: number }>;
  target: TargetObject;
  decoys: TargetObject[];
  onMove: (x: number, z: number, dist: number) => void;
  onProximityWarning?: (decoy: TargetObject) => void;
  playerMeshRef: React.MutableRefObject<THREE.Group | null>;
  playerPosRef: React.MutableRefObject<{ x: number; z: number }>;
  controlsRef: React.MutableRefObject<any>;
}) {
  const frame = useRef(0);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);

  const activeDecoyRef = useRef<string | null>(null);

  // Set initial camera position much closer for character-eye view
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.object.position.set(0, 2, 3.5);
    }
  }, []);

  useFrame(({ camera }) => {
    const { dx, dz } = joystick.current;

    // ── 1. Camera-Relative Movement ──
    if (dx !== 0 || dz !== 0) {
      // Get the camera's forward and right vectors projected onto the ground
      camera.getWorldDirection(fwd);
      fwd.y = 0;
      fwd.normalize();

      right.crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();

      // Normalize joystick input mapped to max length 1
      const inputLen = Math.sqrt(dx * dx + dz * dz);
      const moveScale = Math.min(inputLen, 0.08) / 0.08;

      // Joystick UP dz is negative (-0.08), so -dz is forward.
      const moveForward = (-dz / inputLen) * MOVE_SPEED * moveScale;
      // Joystick RIGHT dx is positive.
      const moveRight = (dx / inputLen) * MOVE_SPEED * moveScale;

      const moveX = fwd.x * moveForward + right.x * moveRight;
      const moveZ = fwd.z * moveForward + right.z * moveRight;

      playerPosRef.current.x += moveX;
      playerPosRef.current.z += moveZ;

      // Keep inside island boundaries
      const { x, z } = playerPosRef.current;
      const d = Math.sqrt(x * x + z * z);
      if (d > ISLAND_R) {
        playerPosRef.current.x = (x / d) * ISLAND_R;
        playerPosRef.current.z = (z / d) * ISLAND_R;
      }

      // Rotate player mesh instantly to face movement globally
      if (playerMeshRef.current) {
        const targetAngle = Math.atan2(moveX, moveZ);
        playerMeshRef.current.rotation.y = targetAngle;
      }
    }

    // ── 2. Update Mesh Position ──
    if (playerMeshRef.current) {
      const m = playerMeshRef.current;
      m.position.x += (playerPosRef.current.x - m.position.x) * 0.3;
      m.position.z += (playerPosRef.current.z - m.position.z) * 0.3;

      // ── 3. Keep OrbitControls locked to Player ──
      if (controlsRef.current) {
        controlsRef.current.target.set(
          m.position.x,
          m.position.y + 1.2, // Aim at the shoulders/head
          m.position.z
        );
        controlsRef.current.update();
      }
    }

    // ── 4. Distance Checks ──
    const px = playerPosRef.current.x;
    const pz = playerPosRef.current.z;
    frame.current++;
    if (frame.current % 4 === 0) {
      const tx = px - target.x;
      const tz = pz - target.z;
      const dist = Math.sqrt(tx * tx + tz * tz);
      onMove(px, pz, dist);

      // Check decoys
      if (onProximityWarning) {
        let insideDecoy: TargetObject | null = null;
        for (const decoy of decoys) {
          const dxD = px - decoy.x;
          const dzD = pz - decoy.z;
          if (Math.sqrt(dxD * dxD + dzD * dzD) < 4.0) { 
            insideDecoy = decoy;
            break;
          }
        }
        
        if (insideDecoy && activeDecoyRef.current !== insideDecoy.id) {
          activeDecoyRef.current = insideDecoy.id;
          onProximityWarning(insideDecoy);
        } else if (!insideDecoy) {
          activeDecoyRef.current = null;
        }
      }
    }
  });

  return null;
}

// ── Main Scene exported ───────────────────────────────────────────────────────
export default function IslandScene({ joystick, target, decoys, onMove, onProximityWarning }: SceneProps) {
  const playerMeshRef = useRef<THREE.Group | null>(null);
  const playerPosRef = useRef({ x: 0, z: 0 });
  const controlsRef = useRef<any>(null);

  // Generate 12 random signpost coordinates for hints to prevent lag
  const signposts = useMemo(() => {
    return Array.from({ length: 12 }, () => {
      const r = 30 + Math.random() * 200;
      const a = Math.random() * Math.PI * 2;
      return { x: Math.cos(a) * r, z: Math.sin(a) * r };
    });
  }, []);

  return (
    <Canvas
      style={{ flex: 1, backgroundColor: '#09153a' }}
      gl={{ antialias: false }} // disable for massive map performance
    >
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={false}
        enableDamping={true}
        dampingFactor={0.1}
        minDistance={4.5}
        maxDistance={4.5}
        minPolarAngle={0.5}
        maxPolarAngle={Math.PI / 2 - 0.15}
      />

      <hemisphereLight args={['#88aaff', '#001133', 0.9]} />
      <directionalLight position={[50, 100, -50]} intensity={0.8} color="#cddef5" castShadow />

      <fog attach="fog" args={['#09153a', 40, 200]} />

      <group position={[0, -0.05, 0]}>
        <WorldMap />
      </group>

      <Stars />

      {/* Render the 40 Magic Signposts across the world! */}
      {signposts.map((pos, i) => (
        <SignPost key={i} position={[pos.x, 0, pos.z]} target={target} />
      ))}

      {/* Target Placement */}
      <group position={[target.x, 0, target.z]}>
        <DynamicModel name={target.name} />
        <PulseRing color={GLOW[target.name] ?? '#FFEB3B'} />
        <pointLight position={[0, 6, 0]} color={GLOW[target.name] ?? '#FFEB3B'} intensity={60} distance={100} decay={1.5} />
      </group>

      {/* Decoy Placements */}
      {decoys.map(decoy => (
        <group key={decoy.id} position={[decoy.x, 0, decoy.z]}>
          <DynamicModel name={decoy.name} />
          {/* Decoys have a subtle gray/blue glow to trick the player! */}
          <PulseRing color="#B0BEC5" />
          <pointLight position={[0, 6, 0]} color="#B0BEC5" intensity={40} distance={80} decay={1.5} />
        </group>
      ))}

      <PlayerAvatar meshRef={playerMeshRef} target={target} joystick={joystick} />

      <GameLoop
        joystick={joystick}
        target={target}
        decoys={decoys}
        onMove={onMove}
        onProximityWarning={onProximityWarning}
        playerMeshRef={playerMeshRef}
        playerPosRef={playerPosRef}
        controlsRef={controlsRef}
      />
    </Canvas>
  );
}
