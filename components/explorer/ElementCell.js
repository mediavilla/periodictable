import * as THREE from "three";
import elements from "../../public/elements.json";

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
  const element = elements[cell.number - 1];
  return (
    <mesh
      geometry={cell.geometry || cellBox}
      material={pickingMaterial}
      position={cell.position}
      rotation={cell.rotation || [0, 0, 0]}
      onPointerOver={
        disabled
          ? undefined
          : (event) => {
              event.stopPropagation();
              if (event.pointerType !== "touch") onHover(element);
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
                element,
                event.nativeEvent?.pointerType || event.pointerType,
              );
            }
      }
    />
  );
}
