# Game Assets

Place your `.glb` or `.gltf` 3D model files in this directory.

## Current Placeholders
- **Table** → represented as a brown `BoxGeometry` in `IslandScene.tsx`
- **Player** → represented as a blue `SphereGeometry` in `IslandScene.tsx`

## To swap in real models
1. Drop your `.glb` file here (e.g. `table.glb`)
2. In `IslandScene.tsx`, replace the `<mesh>` with `<useGLTF>` from `@react-three/drei`:

```tsx
import { useGLTF } from '@react-three/drei';

function TableModel({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF(require('../assets/table.glb'));
  return <primitive object={scene} position={position} />;
}
```
