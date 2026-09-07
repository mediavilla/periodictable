import { useEffect, useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";
import {
  STOWE_LAYER_HEIGHTS,
  STOWE_SPACING,
  TELLURIC_MAX_WEIGHT,
  TELLURIC_PITCH,
  TELLURIC_RADIUS,
  telluricPosition,
} from "../../data/models/spatial-models";

const noRaycast = () => null;
function segmentsGeometry(segments) {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(segments.flat(2), 3),
  );
  return geometry;
}

function makeTelluricGuides() {
  const helix = [];
  const grid = [];
  // Draw uninterrupted helical segments, not triangulation edges through cells.
  for (let i = 0; i < TELLURIC_MAX_WEIGHT * 8; i += 1) {
    helix.push([telluricPosition(i / 8), telluricPosition((i + 1) / 8)]);
  }
  const halfHeight = (TELLURIC_MAX_WEIGHT / 32) * TELLURIC_PITCH;
  const radius = TELLURIC_RADIUS - 0.035;
  for (let i = 0; i < 16; i += 1) {
    const angle = (i / 16) * Math.PI * 2;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    grid.push([
      [x, -halfHeight, z],
      [x, halfHeight, z],
    ]);
  }
  for (let turn = 0; turn <= 16; turn += 1) {
    const y = halfHeight - turn * TELLURIC_PITCH;
    for (let step = 0; step < 96; step += 1) {
      const a = (step / 96) * Math.PI * 2;
      const b = ((step + 1) / 96) * Math.PI * 2;
      grid.push([
        [Math.sin(a) * radius, y, Math.cos(a) * radius],
        [Math.sin(b) * radius, y, Math.cos(b) * radius],
      ]);
    }
  }
  return { helix: segmentsGeometry(helix), grid: segmentsGeometry(grid) };
}

function TelluricStructure() {
  const geometries = useMemo(makeTelluricGuides, []);
  useEffect(
    () => () =>
      Object.values(geometries).forEach((geometry) => geometry.dispose()),
    [geometries],
  );
  return (
    <group name="telluric-structure">
      <mesh raycast={noRaycast}>
        <cylinderGeometry
          args={[
            TELLURIC_RADIUS - 0.07,
            TELLURIC_RADIUS - 0.07,
            16 * TELLURIC_PITCH,
            96,
          ]}
        />
        <meshStandardMaterial color="#f0eee5" roughness={1} />
      </mesh>
      <lineSegments geometry={geometries.grid} raycast={noRaycast}>
        <lineBasicMaterial color="#b9b8ae" />
      </lineSegments>
      <lineSegments geometry={geometries.helix} raycast={noRaycast}>
        <lineBasicMaterial color="#68756b" />
      </lineSegments>
    </group>
  );
}

function makeStoweGuides() {
  const segments = [];
  const top = STOWE_LAYER_HEIGHTS[0];
  const bottom = STOWE_LAYER_HEIGHTS[7];
  // A centre guide makes n's shared axis visible without introducing fake cells.
  segments.push([
    [0, bottom - 0.4, 0],
    [0, top + 0.4, 0],
  ]);
  for (let n = 1; n <= 8; n += 1) {
    const l = [0, 0, 1, 2, 3, 3, 2, 1, 0][n];
    const y = STOWE_LAYER_HEIGHTS[n - 1] - 0.05;
    const extent = (l + 1) * STOWE_SPACING;
    const vertices = [
      [-extent, y, 0],
      [0, y, -extent],
      [extent, y, 0],
      [0, y, extent],
    ];
    vertices.forEach((point, i) =>
      segments.push([point, vertices[(i + 1) % vertices.length]]),
    );
  }
  return segmentsGeometry(segments);
}

function StoweStructure() {
  const geometry = useMemo(makeStoweGuides, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineSegments
      name="stowe-quantum-layer-guides"
      geometry={geometry}
      raycast={noRaycast}
    >
      <lineBasicMaterial color="#9b9b99" transparent opacity={0.6} />
    </lineSegments>
  );
}

export default function SpatialModelStructure({ design }) {
  const id = typeof design === "string" ? design : design?.id;
  if (id === "telluric") return <TelluricStructure />;
  if (id === "stowe") return <StoweStructure />;
  return null;
}
