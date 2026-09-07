import * as THREE from "three";

export const cellBox = new THREE.BoxGeometry(0.985, 0.985, 0.075);
export const facePlane = new THREE.PlaneGeometry(0.985, 0.985);

// The material suppresses drawing without disabling Three's face-aware
// raycasting. External shared geometry/material props remain cache-owned.
const pickingMaterial = new THREE.MeshBasicMaterial({
  visible: false,
  side: THREE.FrontSide,
});

/**
 * One reusable interaction cell per element. CellBatch draws the corresponding
 * bodies, outlines and labels together; these individual meshes preserve each
 * element's geometry, outward face, pointer callbacks and selection identity.
 * There are no per-cell frame callbacks or independently allocated resources.
 */
export default function ElementCell({ cell, onHover, onSelect, disabled }) {
  return (
    <mesh
      geometry={cell.pickingGeometry || cell.geometry || cellBox}
      material={pickingMaterial}
      position={cell.position}
      rotation={cell.rotation || [0, 0, 0]}
      scale={cell.scale || [1, 1, 1]}
      onPointerOver={
        disabled
          ? undefined
          : (event) => {
              event.stopPropagation();
              if (event.pointerType !== "touch") onHover(cell);
            }
      }
      onPointerOut={disabled ? undefined : () => onHover(null)}
      onClick={
        disabled
          ? undefined
          : (event) => {
              event.stopPropagation();
              if (event.delta > 7) return;
              onSelect(
                cell,
                event.nativeEvent?.pointerType || event.pointerType,
              );
            }
      }
    />
  );
}
