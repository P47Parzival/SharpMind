import { useState, useCallback, useRef } from 'react';

export interface Vec2 { x: number; z: number; }

// ── Named objects kids search for ─────────────────────────────────────────────
export interface TargetObject {
  id: string;
  name: string;
  emoji: string;
  x: number;
  z: number;
}

// These coordinates perfectly match the beautiful landmarks in WorldMap.tsx
export const LANDMARKS: TargetObject[] = [
  { id: '1', name: 'Windmill', emoji: '🎡', x: -90, z: 30 },
  { id: '2', name: 'Farm House', emoji: '🏡', x: -80, z: 60 },
  { id: '3', name: 'Beach Cottage', emoji: '🛖', x: 160, z: 250 },
  { id: '4', name: 'Waterfall Pool', emoji: '🌊', x: -170, z: -195 },
  { id: '5', name: 'South Bridge', emoji: '🌉', x: 0, z: -85 },
  { id: '6', name: 'West Bridge', emoji: '🌉', x: -62, z: 0 },
  { id: '7', name: 'Village Well', emoji: '🚰', x: 65, z: 68 },
  { id: '8', name: 'East Campfire', emoji: '🔥', x: 110, z: -90 },
  { id: '9', name: 'Lost Treasure', emoji: '👑', x: 170, z: -180 },
  { id: '10', name: 'Mountain Treasure', emoji: '💎', x: 30, z: -215 },
  { id: '11', name: 'Lily Pond', emoji: '🪷', x: -60, z: -80 },
  { id: '12', name: 'Village Square', emoji: '🏘️', x: 65, z: 60 },
];

export const FURNITURE: TargetObject[] = [
  { id: '13', name: 'Wooden Table', emoji: '🪑', x: 0, z: 0 },
  { id: '14', name: 'Comfy Bed', emoji: '🛏️', x: 0, z: 0 },
  { id: '15', name: 'Red Couch', emoji: '🛋️', x: 0, z: 0 },
];

export const ENDLESS_ITEMS: TargetObject[] = [
  { id: '16', name: 'Red Apple', emoji: '🍎', x: 0, z: 0 },
  { id: '17', name: 'Blue Car', emoji: '🚙', x: 0, z: 0 },
  { id: '18', name: 'Big Dinosaur', emoji: '🦖', x: 0, z: 0 },
  { id: '19', name: 'Space Rocket', emoji: '🚀', x: 0, z: 0 },
  { id: '20', name: 'Pizza Slice', emoji: '🍕', x: 0, z: 0 },
  { id: '21', name: 'Teddy Bear', emoji: '🧸', x: 0, z: 0 },
  { id: '22', name: 'Electric Guitar', emoji: '🎸', x: 0, z: 0 },
  { id: '23', name: 'Magic Wand', emoji: '🪄', x: 0, z: 0 },
  { id: '24', name: 'Robot Friend', emoji: '🤖', x: 0, z: 0 },
  { id: '25', name: 'Green Turtle', emoji: '🐢', x: 0, z: 0 },
  { id: '26', name: 'Magic Potion', emoji: '🧪', x: 0, z: 0 },
  { id: '27', name: 'Birthday Cake', emoji: '🎂', x: 0, z: 0 },
  { id: '28', name: 'Pirate Ship', emoji: '⛵', x: 0, z: 0 },
  { id: '29', name: 'Alien UFO', emoji: '🛸', x: 0, z: 0 },
  { id: '30', name: 'Golden Key', emoji: '🗝️', x: 0, z: 0 },
];

function pickRandom(exclude?: TargetObject): TargetObject {
  // Exclude Landmarks so the user ALWAYS gets a real 3D procedural item!
  const all = [...FURNITURE, ...ENDLESS_ITEMS];
  const options = exclude
    ? all.filter(o => o.id !== exclude.id)
    : all;
  
  const base = options[Math.floor(Math.random() * options.length)];
  
  // Give it random massive map coordinates
  const r = 50 + Math.random() * 200;
  const a = Math.random() * Math.PI * 2;
  return { ...base, x: Math.cos(a) * r, z: Math.sin(a) * r };
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useGameState() {
  const [playerPos, setPlayerPos] = useState<Vec2>({ x: 0, z: 0 });
  const [targetObject, setTargetObject] = useState<TargetObject>(pickRandom);
  const [score, setScore]   = useState(0);
  const [found, setFound]   = useState(false);
  const [round, setRound]   = useState(1);

  const WIN_DIST = 2.5;
  const ISLAND_RADIUS = 8.5;

  const updatePlayerPos = useCallback((x: number, z: number) => {
    setPlayerPos({ x, z });
  }, []);

  const checkWin = useCallback(
    (px: number, pz: number): boolean => {
      const dx = px - targetObject.x;
      const dz = pz - targetObject.z;
      return Math.sqrt(dx * dx + dz * dz) < WIN_DIST;
    },
    [targetObject]
  );

  const triggerWin = useCallback(() => {
    setFound(true);
    setScore(s => s + 10);
  }, []);

  const resetGame = useCallback(() => {
    setFound(false);
    setPlayerPos({ x: 0, z: 0 });
    setTargetObject(prev => pickRandom(prev));
    setRound(r => r + 1);
  }, []);

  return {
    playerPos,
    targetObject,
    score,
    found,
    round,
    WIN_DIST,
    ISLAND_RADIUS,
    updatePlayerPos,
    checkWin,
    triggerWin,
    resetGame,
  };
}
