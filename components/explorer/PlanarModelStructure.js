import { useMemo } from "react";
import { BufferGeometry, CatmullRomCurve3, Vector3 } from "three";
import { planarSources } from "../../data/models/planar-models";

const guideCache = new Map();
const noRaycast = () => null;
const families = [
  [1, 6, 14, 32, 50, 82, 114],
  [2, 10, 18, 36, 54, 86, 118],
  [3, 11, 19, 37, 55, 87],
  [4, 12, 20, 38, 56, 88],
  [5, 13, 31, 49, 81, 113],
  [7, 15, 33, 51, 83, 115],
  [8, 16, 34, 52, 84, 116],
  [9, 17, 35, 53, 85, 117],
];

function guideGeometry(id) {
  if (guideCache.has(id)) return guideCache.get(id);
  const data = planarSources[id];
  if (!data) return [];
  const { center, scale } = data.source;
  const toWorld = ([x, y]) =>
    new Vector3((x - center[0]) / scale, (center[1] - y) / scale, -0.04);
  const paths =
    id === "chemical-galaxy"
      ? [
          data.slots
            .filter((s) => s.sourceNumber > 0)
            .map((s) => s.sourceCenter),
          ...families.map((numbers) =>
            numbers.map((number) => data.slots[number - 1].sourceCenter),
          ),
        ]
      : [
          [
            [290, 289],
            [345, 300],
            [393, 310],
            [445, 320],
          ],
          [
            [351, 239],
            [395, 210],
            [442, 176],
            [488, 143],
          ],
          [
            [340, 159],
            [353, 117],
            [365, 80],
            [379, 44],
          ],
        ];
  const geometries = paths.map((path) =>
    new BufferGeometry().setFromPoints(
      new CatmullRomCurve3(path.map(toWorld), false, "centripetal").getPoints(
        path.length * 12,
      ),
    ),
  );
  guideCache.set(id, geometries);
  return geometries;
}

export default function PlanarModelStructure({ design }) {
  const guides = useMemo(() => guideGeometry(design), [design]);
  return (
    <group dispose={null}>
      {guides.map((geometry, index) => (
        <line key={index} geometry={geometry} raycast={noRaycast}>
          <lineBasicMaterial
            color={design === "benfey" ? "#78706d" : "#969da6"}
            transparent
            opacity={index === 0 ? 0.45 : 0.24}
          />
        </line>
      ))}
    </group>
  );
}
