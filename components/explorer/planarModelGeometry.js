import {
  BufferGeometry,
  Float32BufferAttribute,
  ExtrudeGeometry,
  Shape,
} from "three";
import { planarLayouts, planarSources } from "../../data/models/planar-models";

const DEPTH = 0.045;
const cache = new Map();
const diskResources = new Map();

function outlineFor(points) {
  const positions = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length];
    positions.push(a[0], a[1], DEPTH + 0.001, b[0], b[1], DEPTH + 0.001);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

/** Source-measured planar shapes. Resources are cached once for two models. */
export function createPlanarModelCells(id) {
  if (cache.has(id)) return cache.get(id);
  const data = planarSources[id];
  if (!data) return [];
  const { center, scale } = data.source;
  const cells = planarLayouts[id].map((slot) => {
    // Fit offline against the source contour: no polygon search on first render.
    const label = slot.label;
    const anchorX = label.x,
      anchorY = label.y;
    const points = slot.polygon
      ? slot.polygon.map(([x, y]) => [
          (x - anchorX) / scale,
          (anchorY - y) / scale,
        ])
      : Array.from({ length: 64 }, (_, i) => {
          const angle = (i / 64) * Math.PI * 2;
          return [
            (Math.cos(angle) * slot.radius) / scale,
            (Math.sin(angle) * slot.radius) / scale,
          ];
        });
    const diskKey = slot.polygon ? null : slot.radius / scale;
    let resources = diskKey === null ? null : diskResources.get(diskKey);
    if (!resources) {
      const shape = new Shape();
      points.forEach(([x, y], index) =>
        index ? shape.lineTo(x, y) : shape.moveTo(x, y),
      );
      shape.closePath();
      const geometry = new ExtrudeGeometry(shape, {
        depth: DEPTH,
        bevelEnabled: false,
        steps: 1,
        curveSegments: 12,
      });
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      resources = { geometry, outline: outlineFor(points) };
      if (diskKey !== null) diskResources.set(diskKey, resources);
    }
    return {
      ...slot,
      position: [
        (anchorX - center[0]) / scale,
        (center[1] - anchorY) / scale,
        0,
      ],
      ...resources,
      labelPosition: [0, 0, DEPTH + 0.01],
      labelWidth: label.width / scale,
      labelHeight: label.height / scale,
      labelRotation: 0,
    };
  });
  cache.set(id, cells);
  return cells;
}
