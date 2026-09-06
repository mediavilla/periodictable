import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const MAX_ELECTRONS = 118;
const electronGeometry = new THREE.SphereGeometry(1, 12, 8);
const ringGeometries = Array.from({ length: 7 }, (_, shell) => {
  const radius = 1 + shell * 0.63;
  return new THREE.RingGeometry(radius - 0.013, radius + 0.013, 128);
});

export default function BohrModel({
  element,
  color = "#555555",
  decorative = false,
  paused = false,
}) {
  const electrons = useRef();
  const angles = useRef(new Float64Array(7));
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const dotScale = decorative ? 0.058 : 0.075;
  const orbits = useMemo(
    () =>
      element.shells.map((population, shell) => {
        const radius = 1 + shell * 0.63;
        const x = new Float32Array(population);
        const y = new Float32Array(population);
        for (let electron = 0; electron < population; electron += 1) {
          const angle = (electron / population) * Math.PI * 2;
          x[electron] = Math.cos(angle) * radius;
          y[electron] = Math.sin(angle) * radius;
        }
        return { population, radius, x, y };
      }),
    [element.shells],
  );

  const updateElectrons = useCallback(() => {
    const mesh = electrons.current;
    if (!mesh) return;
    let index = 0;
    matrix.makeScale(dotScale, dotScale, dotScale);
    orbits.forEach((orbit, shell) => {
      const cos = Math.cos(angles.current[shell]);
      const sin = Math.sin(angles.current[shell]);
      for (let electron = 0; electron < orbit.population; electron += 1) {
        matrix.setPosition(
          orbit.x[electron] * cos - orbit.y[electron] * sin,
          orbit.x[electron] * sin + orbit.y[electron] * cos,
          0.02,
        );
        mesh.setMatrixAt(index, matrix);
        index += 1;
      }
    });
    mesh.count = index;
    mesh.instanceMatrix.needsUpdate = true;
  }, [dotScale, matrix, orbits]);

  useLayoutEffect(() => {
    const mesh = electrons.current;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // A centred bound stays valid as electrons orbit, including one-electron
    // shells whose instantaneous bounds would otherwise move each frame.
    if (!mesh.boundingSphere) mesh.boundingSphere = new THREE.Sphere();
    mesh.boundingSphere.center.set(0, 0, 0);
    mesh.boundingSphere.radius =
      orbits[orbits.length - 1].radius + dotScale + 0.02;
    updateElectrons();
  }, [dotScale, orbits, updateElectrons]);

  useFrame((_, delta) => {
    if (paused) return;
    const step = Math.min(delta, 0.05) * 0.013;
    for (let shell = 0; shell < orbits.length; shell += 1) {
      angles.current[shell] += step * (shell + 1);
    }
    updateElectrons();
  });

  // Cached geometries are supplied as external props, not declarative child
  // objects, so R3F leaves them intact. Declarative materials and the instance
  // buffer retain normal automatic disposal when this model unmounts.
  return (
    <group>
      {orbits.map((_, shell) => (
        <mesh key={shell} geometry={ringGeometries[shell]}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={decorative ? 0.23 : 0.4}
          />
        </mesh>
      ))}
      <instancedMesh
        ref={electrons}
        args={[electronGeometry, null, MAX_ELECTRONS]}
      >
        <meshBasicMaterial
          color={color}
          transparent
          opacity={decorative ? 0.6 : 1}
        />
      </instancedMesh>
    </group>
  );
}
