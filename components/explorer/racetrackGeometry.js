import { EdgesGeometry, ExtrudeGeometry, ShapeUtils } from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import racetrack from "../../data/racetrack-layout.json";

const SCALE = 100;
const DEPTH = 0.045;
let cachedCells;

// The SVG is the source of truth. Sampling is used only for label placement;
// the mesh retains the SVG's original curves through SVGLoader/ExtrudeGeometry.
function polygonFor(shape) {
  const points = shape.extractPoints(32);
  return [points.shape, ...points.holes].filter((ring) => ring.length > 2);
}

function segmentDistanceSquared(x, y, a, b) {
  let px = a.x;
  let py = a.y;
  const dx = b.x - px;
  const dy = b.y - py;
  if (dx || dy) {
    const t = Math.max(
      0,
      Math.min(1, ((x - px) * dx + (y - py) * dy) / (dx * dx + dy * dy)),
    );
    px += dx * t;
    py += dy * t;
  }
  return (x - px) ** 2 + (y - py) ** 2;
}

function signedDistance(x, y, polygon) {
  let inside = false;
  let minimum = Infinity;
  for (const ring of polygon) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i];
      const b = ring[j];
      if (
        a.y > y !== b.y > y &&
        x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x
      )
        inside = !inside;
      minimum = Math.min(minimum, segmentDistanceSquared(x, y, a, b));
    }
  }
  return (inside ? 1 : -1) * Math.sqrt(minimum);
}

function boundsFor(polygon) {
  const points = polygon[0];
  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxX: Math.max(bounds.maxX, point.x),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );
}

// A coarse grid followed by subdivision locates the pole of inaccessibility.
// It avoids bounding-box centers that fall outside a bent annular segment.
function interiorAnchor(polygon, bounds) {
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  let best = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
    distance: -Infinity,
  };
  const candidates = [];
  const add = (x, y, halfSize) => {
    const distance = signedDistance(x, y, polygon);
    const candidate = {
      x,
      y,
      halfSize,
      distance,
      maximum: distance + halfSize * Math.SQRT2,
    };
    candidates.push(candidate);
    if (distance > best.distance) best = candidate;
  };
  const size = Math.max(1, Math.min(width, height));
  for (let x = bounds.minX; x < bounds.maxX; x += size) {
    for (let y = bounds.minY; y < bounds.maxY; y += size)
      add(x + size / 2, y + size / 2, size / 2);
  }
  while (candidates.length) {
    candidates.sort((a, b) => a.maximum - b.maximum);
    const cell = candidates.pop();
    if (cell.maximum - best.distance <= 0.3) continue;
    const half = cell.halfSize / 2;
    add(cell.x - half, cell.y - half, half);
    add(cell.x + half, cell.y - half, half);
    add(cell.x - half, cell.y + half, half);
    add(cell.x + half, cell.y + half, half);
  }
  return best;
}

function boxFits(anchor, halfWidth, halfHeight, polygon) {
  // Check every boundary sample, plus internal corners/center. A polygon edge
  // entering the proposed box also disqualifies it, including any inner hole.
  const margin = 1.8;
  for (let step = 0; step <= 8; step += 1) {
    const t = (step / 8) * 2 - 1;
    if (
      signedDistance(anchor.x + t * halfWidth, anchor.y - halfHeight, polygon) <
        margin ||
      signedDistance(anchor.x + t * halfWidth, anchor.y + halfHeight, polygon) <
        margin ||
      signedDistance(anchor.x - halfWidth, anchor.y + t * halfHeight, polygon) <
        margin ||
      signedDistance(anchor.x + halfWidth, anchor.y + t * halfHeight, polygon) <
        margin
    )
      return false;
  }
  for (const ring of polygon) {
    for (const point of ring) {
      if (
        Math.abs(point.x - anchor.x) < halfWidth &&
        Math.abs(point.y - anchor.y) < halfHeight
      )
        return false;
    }
  }
  return true;
}

function labelBox(anchor, polygon, bounds) {
  let best = { width: 0, height: 0, score: 0 };
  // Prefer a landscape label without wasting the thin radial width of cells.
  for (const ratio of [0.8, 1, 1.25, 1.5, 1.8, 2.2]) {
    let low = 0;
    let high =
      Math.min(bounds.maxY - bounds.minY, (bounds.maxX - bounds.minX) / ratio) /
      2;
    for (let iteration = 0; iteration < 13; iteration += 1) {
      const halfHeight = (low + high) / 2;
      if (boxFits(anchor, halfHeight * ratio, halfHeight, polygon))
        low = halfHeight;
      else high = halfHeight;
    }
    const width = low * ratio * 2;
    const height = low * 2;
    const score = (width * height) / (1 + Math.abs(ratio - 1.25) * 0.08);
    if (score > best.score) best = { width, height, score };
  }
  return best;
}

/**
 * Builds the site's 104 original SVG regions once per browser session.
 * Call only in the browser (SVGLoader uses DOMParser). The returned geometries
 * are shared cache resources: consumers should opt out of automatic disposal.
 * Coordinates: SVG / 100, Y flipped, centered on the original 2084 × 1250 box.
 */
export function createRacetrackCells() {
  if (cachedCells) return cachedCells;
  const loader = new SVGLoader();
  const paths = racetrack.regions
    .map(({ number, d }) => `<path id="${number}" d="${d}" />`)
    .join("");
  const document = loader.parse(
    `<svg xmlns="http://www.w3.org/2000/svg">${paths}</svg>`,
  );
  const shapesByNumber = new Map(
    document.paths.map((path) => [
      Number(path.userData.node.id),
      SVGLoader.createShapes(path),
    ]),
  );
  cachedCells = racetrack.regions.map(({ number, label: recordedLabel }) => {
    const shapes = shapesByNumber.get(number);
    let anchor = recordedLabel;
    let label = recordedLabel;
    if (!recordedLabel) {
      const mainShape = shapes.reduce((largest, shape) => {
        const area = Math.abs(ShapeUtils.area(shape.getPoints(32)));
        return !largest || area > largest.area ? { shape, area } : largest;
      }, null).shape;
      const polygon = polygonFor(mainShape);
      const bounds = boundsFor(polygon);
      anchor = interiorAnchor(polygon, bounds);
      label = labelBox(anchor, polygon, bounds);
    }
    const geometry = new ExtrudeGeometry(shapes, {
      depth: DEPTH * SCALE,
      bevelEnabled: false,
      curveSegments: 32,
      steps: 1,
    });
    // Flipping Y alone reverses winding. Rotating the SVG plane instead flips
    // Y and Z together, retaining front-face winding and correct hit testing.
    geometry.translate(-anchor.x, -anchor.y, -DEPTH * SCALE);
    geometry.rotateX(Math.PI);
    geometry.scale(1 / SCALE, 1 / SCALE, 1 / SCALE);
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    const size = geometry.boundingBox;
    return {
      number,
      position: [(anchor.x - 1042) / SCALE, (625 - anchor.y) / SCALE, 0],
      rotation: [0, 0, 0],
      geometry,
      outline: new EdgesGeometry(geometry, 20),
      width: size.max.x - size.min.x,
      height: size.max.y - size.min.y,
      labelWidth: label.width / SCALE,
      labelHeight: label.height / SCALE,
      labelPosition: [0, 0, DEPTH + 0.01],
    };
  });
  return cachedCells;
}

export const racetrackBounds = { width: 20.84, height: 12.5, depth: DEPTH };
