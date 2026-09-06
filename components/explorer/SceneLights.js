import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import elements from "../../public/elements.json";
import { categoryColor } from "../../data/table-registry";

function MovableLight({ color, position, intensity, visible }) {
  const light = useRef();
  const targetColor = useMemo(() => new THREE.Color(color), [color]);
  const targetPosition = useMemo(
    () => new THREE.Vector3(...position),
    [position],
  );
  useFrame((_, delta) => {
    if (!visible || !light.current) return;
    const amount = 1 - Math.exp(-Math.min(delta, 0.06) * 5);
    light.current.color.lerp(targetColor, amount);
    light.current.position.lerp(targetPosition, amount);
  });
  return (
    <pointLight ref={light} intensity={intensity} distance={180} decay={1.3} />
  );
}
export default function SceneLights({
  active,
  cells,
  anchors,
  backdrop = false,
  visible = true,
}) {
  const neighbors = useMemo(() => {
    const origin = cells.find((cell) => cell.number === active.number)
      ?.position || [0, 0, 0];
    return {
      origin,
      nearby: cells
        .filter((cell) => cell.number !== active.number)
        .sort(
          (a, b) =>
            a.position.reduce(
              (sum, value, i) => sum + (value - origin[i]) ** 2,
              0,
            ) -
            b.position.reduce(
              (sum, value, i) => sum + (value - origin[i]) ** 2,
              0,
            ),
        )
        .slice(0, 2),
    };
  }, [active.number, cells]);
  const colors = [
    categoryColor(active.category),
    ...neighbors.nearby.map((cell) =>
      categoryColor(elements[cell.number - 1].category),
    ),
  ];
  return (
    <>
      {colors.map((color, index) => {
        const anchor = anchors[index];
        const position = backdrop
          ? [
              anchor[0] + neighbors.origin[0] * 1.2,
              anchor[1] + neighbors.origin[1],
              anchor[2],
            ]
          : [
              anchor[0] + neighbors.origin[0] * 0.2,
              anchor[1] + neighbors.origin[1] * 0.2,
              anchor[2],
            ];
        return (
          <MovableLight
            key={index}
            color={color}
            position={position}
            intensity={
              backdrop ? (index === 0 ? 800 : 170) : index === 0 ? 20 : 6
            }
            visible={visible}
          />
        );
      })}
    </>
  );
}
