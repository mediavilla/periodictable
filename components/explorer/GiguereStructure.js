import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import layout from "../../data/giguere-layout.json";
import provenance from "../../data/giguere-provenance.json";

// Label planes sit at +/-0.035. The narrower slab leaves a 0.01 gap
// behind each face, so front and reverse labels never fight with a backing.
const SLAB_DEPTH = 0.05;
const NO_RAYCAST = () => null;
const occupied = new Map();

layout.forEach((face) => {
  if (occupied.has(face.tile)) return;
  const perpendicular = face.wing === "p" || face.wing === "f";
  const position = [...face.position];
  position[perpendicular ? 0 : 2] = 0;
  occupied.set(face.tile, {
    position,
    rotation: [0, perpendicular ? Math.PI / 2 : 0, 0],
  });
});

const tiles = [...occupied.values(), ...provenance.geometry.blankTiles];

/**
 * Structural backing only; ElementCell owns every selectable element face.
 * Coordinates match TableScene's normalized [-2.1, 0, -2.1] layout shift.
 * The unlabelled lower cells are visible in the original figure, as is the
 * narrow central support connecting the two interlocking sheets.
 */
export default function GiguereStructure() {
  const slabs = useRef();

  useLayoutEffect(() => {
    const transform = new THREE.Object3D();
    tiles.forEach((tile, index) => {
      transform.position.fromArray(tile.position);
      transform.rotation.set(...tile.rotation);
      transform.updateMatrix();
      slabs.current.setMatrixAt(index, transform.matrix);
    });
    slabs.current.instanceMatrix.needsUpdate = true;
    slabs.current.computeBoundingSphere();
  }, []);

  return (
    <group name="giguere-structure" position={[-2.1, 0, -2.1]}>
      <instancedMesh
        ref={slabs}
        args={[null, null, tiles.length]}
        raycast={NO_RAYCAST}
      >
        <boxGeometry args={[1, 1, SLAB_DEPTH]} />
        <meshStandardMaterial
          color="#d4d6dc"
          roughness={0.9}
          metalness={0.04}
        />
      </instancedMesh>
      <mesh raycast={NO_RAYCAST}>
        <cylinderGeometry args={[0.14, 0.14, 7.3, 12]} />
        <meshStandardMaterial
          color="#a9adb9"
          roughness={0.78}
          metalness={0.12}
        />
      </mesh>
    </group>
  );
}
