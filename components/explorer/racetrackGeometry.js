import {
  BufferGeometry,
  Float32BufferAttribute,
  ExtrudeGeometry,
  ShapeUtils,
} from "three";
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

// Curved portions of the original track; the linking panels stay horizontal.
const curvedCells = new Set([
  ...Array.from({ length: 20 }, (_, i) => i + 1),
  25,
  26,
  27,
  28,
  29,
  34,
  35,
  36,
  37,
  38,
  43,
  44,
  45,
  46,
  47,
  52,
  53,
  54,
  55,
  56,
  57,
  58,
  65,
  75,
  76,
  77,
  78,
  79,
  84,
  85,
  86,
  87,
  88,
  89,
  90,
  97,
]);

function tangentAngle(polygon, number) {
  if (!curvedCells.has(number)) return 0;
  // Area moments avoid bias from SVG curves with uneven sampling density.
  let area = 0,
    x = 0,
    y = 0,
    xx = 0,
    yy = 0,
    xy = 0;
  const ring = polygon[0];
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j],
      b = ring[i];
    const cross = a.x * b.y - b.x * a.y;
    area += cross;
    x += (a.x + b.x) * cross;
    y += (a.y + b.y) * cross;
    xx += (a.x * a.x + a.x * b.x + b.x * b.x) * cross;
    yy += (a.y * a.y + a.y * b.y + b.y * b.y) * cross;
    xy += (2 * a.x * a.y + a.x * b.y + b.x * a.y + 2 * b.x * b.y) * cross;
  }
  x /= 3 * area;
  y /= 3 * area;
  let angle =
    0.5 *
    Math.atan2(
      2 * (xy / (12 * area) - x * y),
      xx / (6 * area) - x * x - yy / (6 * area) + y * y,
    );
  if ([20, 38, 56, 57, 88, 89].includes(number))
    angle = Math.atan2(y - 625, x - 625) + Math.PI / 2;
  // These narrow cells continue across the top of the track, not down it.
  if (
    [57, 58, 65, 89, 90, 97].includes(number) &&
    Math.abs(angle) > Math.PI / 4
  )
    angle += angle > 0 ? -Math.PI / 2 : Math.PI / 2;
  // Keep near-vertical text reading down the left and up the right.
  if (Math.abs(angle) > Math.PI / 3) {
    if (x < (number <= 18 ? 554 : 1042) && angle < 0) angle += Math.PI;
    if (x > (number <= 18 ? 554 : 1042) && angle > 0) angle -= Math.PI;
  }
  return angle;
}

export function racetrackLabel(shape, number) {
  const polygon = polygonFor(shape);
  const angle = tangentAngle(polygon, number);
  const cos = Math.cos(angle),
    sin = Math.sin(angle);
  const rotated = polygon.map((ring) =>
    ring.map(({ x, y }) => ({
      x: x * cos + y * sin,
      y: -x * sin + y * cos,
    })),
  );
  const bounds = boundsFor(rotated);
  // The label's horizontal centre is the middle of its tangential span.
  const x = (bounds.minX + bounds.maxX) / 2;
  const crossings = [];
  for (const ring of rotated) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[j],
        b = ring[i];
      if (a.x > x !== b.x > x)
        crossings.push(a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x));
    }
  }
  crossings.sort((a, b) => a - b);
  let anchor,
    thickness = 0;
  for (let i = 0; i + 1 < crossings.length; i += 2) {
    if (crossings[i + 1] - crossings[i] > thickness) {
      thickness = crossings[i + 1] - crossings[i];
      anchor = { x, y: (crossings[i] + crossings[i + 1]) / 2 };
    }
  }
  if (!anchor) anchor = interiorAnchor(rotated, bounds);
  const box = labelBox(anchor, rotated, bounds);
  return {
    x: anchor.x * cos - anchor.y * sin,
    y: anchor.x * sin + anchor.y * cos,
    width: box.width,
    height: box.height,
    angle,
  };
}

// Extrusion edge extraction can expose triangulation seams at tiny SVG joins.
// Draw only the source contours, on the front face, to retain real boundaries.
function contourOutline(shapes, anchor) {
  const positions = [];
  for (const shape of shapes) {
    for (const ring of polygonFor(shape)) {
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i],
          b = ring[(i + 1) % ring.length];
        if (Math.hypot(a.x - b.x, a.y - b.y) < 0.00001) continue;
        positions.push(
          (a.x - anchor.x) / SCALE,
          (anchor.y - a.y) / SCALE,
          DEPTH + 0.001,
          (b.x - anchor.x) / SCALE,
          (anchor.y - b.y) / SCALE,
          DEPTH + 0.001,
        );
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();
  return geometry;
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
  cachedCells = racetrack.regions.map(
    ({ number, label: recordedLabel, color }) => {
      const shapes = shapesByNumber.get(number);
      let anchor = recordedLabel;
      let label = recordedLabel;
      if (recordedLabel?.angle === undefined) {
        const mainShape = shapes.reduce((largest, shape) => {
          const area = Math.abs(ShapeUtils.area(shape.getPoints(32)));
          return !largest || area > largest.area ? { shape, area } : largest;
        }, null).shape;
        label = racetrackLabel(mainShape, number);
        anchor = label;
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
        outline: contourOutline(shapes, anchor),
        color,
        labelStyle: "racetrack",
        labelRotation: -label.angle,
        width: size.max.x - size.min.x,
        height: size.max.y - size.min.y,
        labelWidth: label.width / SCALE,
        labelHeight: label.height / SCALE,
        labelPosition: [0, 0, DEPTH + 0.01],
      };
    },
  );
  return cachedCells;
}

export const racetrackBounds = { width: 20.84, height: 12.5, depth: DEPTH };
