import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import elements from "../../public/elements.json";
import { categoryPastelColor } from "../../data/table-registry";
import { getLabelAtlases, labelAtlasRows } from "./labelAtlas";
import { slotLabel, slotNumbers } from "../../data/model-slots.mjs";

const defaultBody = new THREE.BoxGeometry(0.985, 0.985, 0.075);
const defaultOutline = new THREE.EdgesGeometry(defaultBody);
const WHITE = new THREE.Color("white");
const BLACK = new THREE.Color("#101010");
const ACTIVE_BODY = new THREE.Color("#29292b");
const OUTLINE = new THREE.Color("#34338b");
const ACTIVE_OUTLINE = new THREE.Color("#ffe604");
const NO_EMISSION = new THREE.Color("black");
const thresholds = [40, 64, 100, 150];
const quadIndices = [0, 2, 1, 2, 3, 1];
const noRaycast = () => null;

function fillColor(attribute, start, count, color) {
  const data = attribute.array;
  const end = (start + count) * 3;
  for (let offset = start * 3; offset < end; offset += 3) {
    data[offset] = color.r;
    data[offset + 1] = color.g;
    data[offset + 2] = color.b;
  }
}

function dynamicAttribute(length, itemSize) {
  return new THREE.BufferAttribute(new Float32Array(length), itemSize).setUsage(
    THREE.DynamicDrawUsage,
  );
}

// Copy the existing triangles/edges without changing their topology. Both
// indexed rectangles and non-indexed SVG extrusions become one draw range.
function mergeShapes(cells, transforms, sources, withNormals) {
  const ranges = [];
  let vertexCount = 0;
  sources.forEach((source) => {
    const count = source.index?.count ?? source.attributes.position.count;
    ranges.push({ start: vertexCount, count });
    vertexCount += count;
  });
  const positions = new Float32Array(vertexCount * 3);
  const normals = withNormals ? new Float32Array(vertexCount * 3) : null;
  const geometry = new THREE.BufferGeometry();
  const vector = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const normalMatrix = new THREE.Matrix3();
  sources.forEach((source, cellIndex) => {
    const position = source.attributes.position;
    const sourceNormals = source.attributes.normal;
    normalMatrix.getNormalMatrix(transforms[cellIndex]);
    const { start, count } = ranges[cellIndex];
    for (let vertex = 0; vertex < count; vertex += 1) {
      const sourceIndex = source.index ? source.index.getX(vertex) : vertex;
      vector
        .fromBufferAttribute(position, sourceIndex)
        .applyMatrix4(transforms[cellIndex]);
      vector.toArray(positions, (start + vertex) * 3);
      if (normals) {
        if (sourceNormals)
          normal.fromBufferAttribute(sourceNormals, sourceIndex);
        else normal.set(0, 0, 1);
        normal
          .applyNormalMatrix(normalMatrix)
          .toArray(normals, (start + vertex) * 3);
      }
    }
  });
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  if (normals)
    geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute("color", dynamicAttribute(vertexCount * 3, 3));
  geometry.computeBoundingSphere();
  return { geometry, ranges };
}

function partitionLabels(batch) {
  const counts = [0, 0, 0, 0, 0];
  for (let cell = 0; cell < batch.levels.length; cell += 1) {
    const level = batch.levels[cell];
    const target = batch.labels[level].index.array;
    const offset = counts[level];
    for (let vertex = 0; vertex < 6; vertex += 1) {
      target[offset + vertex] = cell * 4 + quadIndices[vertex];
    }
    counts[level] += 6;
  }
  for (let level = 0; level < 5; level += 1) {
    const geometry = batch.labels[level];
    geometry.setDrawRange(0, counts[level]);
    geometry.index.needsUpdate = true;
  }
}

function buildBatch(cells) {
  const transforms = cells.map((cell) =>
    new THREE.Matrix4().compose(
      new THREE.Vector3().fromArray(cell.position),
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(...(cell.rotation || [0, 0, 0])),
      ),
      new THREE.Vector3(...(cell.scale || [1, 1, 1])),
    ),
  );
  const body = mergeShapes(
    cells,
    transforms,
    cells.map((cell) => cell.geometry || defaultBody),
    true,
  );
  const outline = mergeShapes(
    cells,
    transforms,
    cells.map((cell) => cell.outline || defaultOutline),
    false,
  );
  const emission = dynamicAttribute(
    body.geometry.attributes.position.count * 3,
    3,
  );
  body.geometry.setAttribute("batchEmissive", emission);
  const labelPositions = new Float32Array(cells.length * 12);
  const labelUVs = new Float32Array(cells.length * 8);
  const labelColors = dynamicAttribute(cells.length * 12, 3);
  const anchors = [];
  const records = new Map();
  const displayLabels = cells.map((cell) => slotLabel(cell, elements));
  const atlasRows = labelAtlasRows(displayLabels.length);
  const corner = new THREE.Vector3();

  cells.forEach((cell, index) => {
    const element = elements[cell.number - 1];
    const baseColor = new THREE.Color(
      cell.color ||
        (element ? categoryPastelColor(element.category) : "#eee9dc"),
    );
    const bodyRange = body.ranges[index];
    const outlineRange = outline.ranges[index];
    fillColor(
      body.geometry.attributes.color,
      bodyRange.start,
      bodyRange.count,
      baseColor,
    );
    fillColor(emission, bodyRange.start, bodyRange.count, baseColor);
    fillColor(
      outline.geometry.attributes.color,
      outlineRange.start,
      outlineRange.count,
      OUTLINE,
    );
    fillColor(labelColors, index * 4, 4, BLACK);
    records.set(cell.id, {
      numbers: slotNumbers(cell),
      baseColor,
      bodyRange,
      outlineRange,
      labelStart: index * 4,
    });

    // A square fits the narrower usable dimension without distorting glyphs.
    // Racetrack usable boxes were checked against the original SVG contours.
    const size = Math.min(cell.labelWidth || 0.94, cell.labelHeight || 0.94);
    const half = size / 2;
    const offset = cell.labelPosition || [0, 0, 0.047];
    const transform = new THREE.Matrix4()
      .compose(
        new THREE.Vector3(...cell.position),
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(...(cell.rotation || [0, 0, 0])),
        ),
        new THREE.Vector3(1, 1, 1),
      )
      .multiply(new THREE.Matrix4().makeTranslation(...offset))
      .multiply(new THREE.Matrix4().makeRotationZ(cell.labelRotation || 0));
    const atlasIndex = index;
    for (let vertex = 0; vertex < 4; vertex += 1) {
      const u = vertex % 2;
      const v = vertex < 2 ? 1 : 0;
      corner.set((u - 0.5) * size, (v - 0.5) * size, 0).applyMatrix4(transform);
      corner.toArray(labelPositions, index * 12 + vertex * 3);
      labelUVs[index * 8 + vertex * 2] = ((atlasIndex % 16) + u) / 16;
      labelUVs[index * 8 + vertex * 2 + 1] =
        (atlasRows - 1 - Math.floor(atlasIndex / 16) + v) / atlasRows;
    }
    anchors.push({
      left: new THREE.Vector3(-half, 0, 0).applyMatrix4(transform),
      right: new THREE.Vector3(half, 0, 0).applyMatrix4(transform),
      bottom: new THREE.Vector3(0, -half, 0).applyMatrix4(transform),
      top: new THREE.Vector3(0, half, 0).applyMatrix4(transform),
    });
  });

  const positionAttribute = new THREE.BufferAttribute(labelPositions, 3);
  const uvAttribute = new THREE.BufferAttribute(labelUVs, 2);
  const IndexArray = cells.length * 4 > 65535 ? Uint32Array : Uint16Array;
  const labels = Array.from({ length: 5 }, () => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", positionAttribute);
    geometry.setAttribute("uv", uvAttribute);
    geometry.setAttribute("color", labelColors);
    geometry.setIndex(
      new THREE.BufferAttribute(new IndexArray(cells.length * 6), 1).setUsage(
        THREE.DynamicDrawUsage,
      ),
    );
    geometry.computeBoundingSphere();
    return geometry;
  });
  const batch = {
    body: body.geometry,
    outline: outline.geometry,
    labels,
    labelColors,
    anchors,
    records,
    displayLabels,
    levels: new Uint8Array(cells.length),
    activeNumber: null,
    activeSlotId: null,
    lastCheck: -Infinity,
  };
  partitionLabels(batch);
  return batch;
}

function activate(batch, activeNumber, activeSlotId) {
  if (
    batch.activeNumber === activeNumber &&
    batch.activeSlotId === activeSlotId
  )
    return;
  const colors = batch.body.attributes.color;
  const emission = batch.body.attributes.batchEmissive;
  const outlines = batch.outline.attributes.color;
  const labels = batch.labelColors;
  const attributes = [colors, emission, outlines, labels];
  // Accumulate until Three uploads and clears these ranges. Clearing here
  // could drop an earlier hover update when two selections land in one frame.
  for (const [id, record] of batch.records) {
    const wasActive =
      batch.activeSlotId === id ||
      (!batch.activeSlotId && record.numbers.includes(batch.activeNumber));
    const active =
      activeSlotId === id ||
      (!activeSlotId && record.numbers.includes(activeNumber));
    if (wasActive === active) continue;
    const { bodyRange, outlineRange, labelStart, baseColor } = record;
    fillColor(
      colors,
      bodyRange.start,
      bodyRange.count,
      active ? ACTIVE_BODY : baseColor,
    );
    fillColor(
      emission,
      bodyRange.start,
      bodyRange.count,
      active ? NO_EMISSION : baseColor,
    );
    fillColor(
      outlines,
      outlineRange.start,
      outlineRange.count,
      active ? ACTIVE_OUTLINE : OUTLINE,
    );
    fillColor(labels, labelStart, 4, active ? WHITE : BLACK);
    colors.addUpdateRange(bodyRange.start * 3, bodyRange.count * 3);
    emission.addUpdateRange(bodyRange.start * 3, bodyRange.count * 3);
    outlines.addUpdateRange(outlineRange.start * 3, outlineRange.count * 3);
    labels.addUpdateRange(labelStart * 3, 12);
  }
  attributes.forEach((attribute) => {
    attribute.needsUpdate = true;
  });
  batch.activeNumber = activeNumber;
  batch.activeSlotId = activeSlotId;
}

// Standard lighting is retained. The extra varying gives each cell its own
// soft emissive colour, while the selected dark cell has no emission.
function patchEmission(shader) {
  shader.vertexShader = shader.vertexShader.replace(
    "#include <common>",
    "#include <common>\nattribute vec3 batchEmissive;\nvarying vec3 vBatchEmissive;",
  );
  shader.vertexShader = shader.vertexShader.replace(
    "#include <color_vertex>",
    "#include <color_vertex>\nvBatchEmissive = batchEmissive;",
  );
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <common>",
    "#include <common>\nvarying vec3 vBatchEmissive;",
  );
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <emissivemap_fragment>",
    "#include <emissivemap_fragment>\ntotalEmissiveRadiance *= vBatchEmissive;",
  );
}
const emissionProgramKey = () => "periodic-batch-emission-v1";

/**
 * Visible table rendering in at most six draws. ElementCell remains responsible
 * for invisible picking proxies. Cell coordinates are local to the parent table
 * group; its animated world transform is included in label-size measurements.
 */
export default function CellBatch({
  cells,
  activeNumber,
  activeSlotId,
  disabled = false,
  visible = true,
}) {
  const root = useRef();
  const batch = useMemo(() => buildBatch(cells), [cells]);
  const atlases = useMemo(() => getLabelAtlases(batch.displayLabels), [batch]);
  const scratch = useMemo(
    () => ({
      projection: new THREE.Matrix4(),
      left: new THREE.Vector3(),
      right: new THREE.Vector3(),
      bottom: new THREE.Vector3(),
      top: new THREE.Vector3(),
    }),
    [],
  );

  useEffect(
    () => () => {
      batch.body.dispose();
      batch.outline.dispose();
      batch.labels.forEach((geometry) => geometry.dispose());
    },
    [batch],
  );

  useLayoutEffect(() => {
    activate(batch, activeNumber, activeSlotId);
  }, [activeNumber, activeSlotId, batch]);
  useLayoutEffect(() => {
    batch.lastCheck = -Infinity;
    if (disabled) {
      batch.levels.fill(0);
      partitionLabels(batch);
    }
  }, [batch, disabled]);

  useFrame(({ camera, size, clock, events, controls }) => {
    if (
      !visible ||
      disabled ||
      !root.current ||
      clock.elapsedTime - batch.lastCheck < 0.1
    )
      return;
    batch.lastCheck = clock.elapsedTime;
    // View's portal size may lag its CSS transition. Measure its actual tracked
    // element once per LOD pass, rather than allocating/projecting per cell/frame.
    const rect = events.connected?.getBoundingClientRect?.();
    const width = rect?.width || size.width;
    const height = rect?.height || size.height;
    root.current.updateWorldMatrix(true, false);
    camera.updateMatrixWorld();
    scratch.projection
      .copy(camera.projectionMatrix)
      .multiply(camera.matrixWorldInverse)
      .multiply(root.current.matrixWorld);
    let changed = false;
    for (let cell = 0; cell < batch.anchors.length; cell += 1) {
      const anchor = batch.anchors[cell];
      scratch.left.copy(anchor.left).applyMatrix4(scratch.projection);
      scratch.right.copy(anchor.right).applyMatrix4(scratch.projection);
      scratch.bottom.copy(anchor.bottom).applyMatrix4(scratch.projection);
      scratch.top.copy(anchor.top).applyMatrix4(scratch.projection);
      const pixels = Math.min(
        Math.hypot(
          ((scratch.right.x - scratch.left.x) * width) / 2,
          ((scratch.right.y - scratch.left.y) * height) / 2,
        ),
        Math.hypot(
          ((scratch.top.x - scratch.bottom.x) * width) / 2,
          ((scratch.top.y - scratch.bottom.y) * height) / 2,
        ),
      );
      let next = batch.levels[cell];
      while (next < 4 && pixels > thresholds[next] + 3) next += 1;
      while (next > 0 && pixels < thresholds[next - 1] - 3) next -= 1;
      if (
        controls &&
        camera.position.distanceTo(controls.target) <=
          controls.minDistance * 1.03 &&
        pixels > 85
      )
        next = 4;
      if (next !== batch.levels[cell]) {
        batch.levels[cell] = next;
        changed = true;
      }
    }
    if (changed) partitionLabels(batch);
  });

  return (
    <group ref={root} visible={visible}>
      <mesh geometry={batch.body} raycast={noRaycast}>
        <meshStandardMaterial
          vertexColors
          color="white"
          emissive="white"
          emissiveIntensity={0.23}
          roughness={0.88}
          metalness={0.03}
          side={THREE.FrontSide}
          onBeforeCompile={patchEmission}
          customProgramCacheKey={emissionProgramKey}
        />
      </mesh>
      <lineSegments geometry={batch.outline} raycast={noRaycast}>
        <lineBasicMaterial
          vertexColors
          color="white"
          transparent
          opacity={0.88}
        />
      </lineSegments>
      {batch.labels.map((geometry, level) => (
        <mesh key={level} geometry={geometry} raycast={noRaycast}>
          <meshBasicMaterial
            map={atlases[level]}
            vertexColors
            color="white"
            transparent
            alphaTest={0.04}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-2}
            side={THREE.FrontSide}
          />
        </mesh>
      ))}
    </group>
  );
}
