import {
  createRadialLookup,
  evaluateOrbital,
  ORBITAL_MODELS,
  sampleRadialLookup,
} from './orbitalMath.mjs';

/**
 * Worker-friendly optical fields for representative orbital overlays.
 *
 * Each channel sums |ψ|² for one wavefunction sign. Amplitudes are never added,
 * and occupations are never weights: this is not a many-electron density.
 * The Jacobian for r = scale * displayR is scale³. A fixed display weight
 * exposure/scale² compensates the changed projected area, leaving
 * exposure * scale * |ψ|² in display coordinates. This lets size comparisons
 * preserve each layer's column opacity. Hiding a layer changes no other weight.
 */
const radialLookups = new Map();
const floatBits = new Uint32Array(1);
const floatValue = new Float32Array(floatBits.buffer);
const now = () => typeof performance === 'undefined' ? Date.now() : performance.now();
const angularFactors = [1 / Math.sqrt(4 * Math.PI), Math.sqrt(3 / (4 * Math.PI)), Math.sqrt(5 / (16 * Math.PI)), Math.sqrt(7 / (16 * Math.PI))];

/** IEEE-754 round-to-nearest, ties-to-even conversion; finite overflow is an error. */
export function floatToHalf(value) {
  if (!Number.isFinite(value) || Math.abs(value) > 65504) throw new RangeError('Optical field values must fit finite float16.');
  floatValue[0] = value;
  const bits = floatBits[0];
  const sign = (bits >>> 16) & 0x8000;
  const exponent = ((bits >>> 23) & 0xff) - 127 + 15;
  const mantissa = bits & 0x7fffff;
  if (exponent < -10) return sign;
  if (exponent <= 0) {
    const significant = mantissa | 0x800000;
    const shift = 14 - exponent;
    const base = significant >>> shift;
    const remainder = significant & (2 ** shift - 1);
    const halfway = 2 ** (shift - 1);
    return sign | (base + (remainder > halfway || (remainder === halfway && (base & 1)) ? 1 : 0));
  }
  const base = (exponent << 10) | (mantissa >>> 13);
  const remainder = mantissa & 0x1fff;
  return sign | (base + (remainder > 0x1000 || (remainder === 0x1000 && (base & 1)) ? 1 : 0));
}

export function halfToFloat(value) {
  const sign = value & 0x8000 ? -1 : 1;
  const exponent = (value >>> 10) & 0x1f;
  const mantissa = value & 0x3ff;
  if (exponent === 0) return sign * 2 ** -14 * (mantissa / 1024);
  if (exponent === 31) return mantissa ? NaN : sign * Infinity;
  return sign * 2 ** (exponent - 15) * (1 + mantissa / 1024);
}

function modelFor(entry) {
  const id = typeof entry === 'string' ? entry : entry?.id;
  if (!Object.prototype.hasOwnProperty.call(ORBITAL_MODELS, id)) throw new RangeError(`Unsupported orbital field layer: ${id}`);
  return ORBITAL_MODELS[id];
}

function prepare(options) {
  const { subshells = [], allSubshells = subshells, sizeMode = 'normalized' } = options;
  if (!Array.isArray(subshells) || !Array.isArray(allSubshells)) throw new TypeError('Subshell lists must be arrays.');
  if (!['normalized', 'ratios'].includes(sizeMode)) throw new RangeError('Unknown orbital size mode.');
  const fullModels = allSubshells.map(modelFor);
  const fullIds = new Set(fullModels.map(({ id }) => id));
  if (fullIds.size !== fullModels.length) throw new RangeError('Full subshell lists must not contain duplicates.');
  const outerModelRadius = Math.max(1, ...fullModels.map(({ domainRadius }) => domainRadius));
  const enabledIds = new Set();
  const layers = subshells.map((entry) => {
    const model = modelFor(entry);
    if (!fullIds.has(model.id)) throw new RangeError('Visible subshells must belong to the full preset.');
    if (enabledIds.has(model.id)) throw new RangeError('Visible subshell lists must not contain duplicates.');
    enabledIds.add(model.id);
    const orientation = entry.orientation || 'z';
    if (model.l === 1 && !['x', 'y', 'z'].includes(orientation)) throw new RangeError('A p orientation must be x, y, or z.');
    const scale = sizeMode === 'normalized' ? model.domainRadius : outerModelRadius;
    if (!radialLookups.has(model.id)) radialLookups.set(model.id, createRadialLookup(model.id));
    return { model, orientation, scale, opticalWeight: model.exposure * scale, lookup: radialLookups.get(model.id) };
  });
  const smallestModelRadius = Math.min(outerModelRadius, ...fullModels.map(({ domainRadius }) => domainRadius));
  const gridDepth = sizeMode === 'ratios' ? Math.min(5, Math.ceil(Math.log2(outerModelRadius / smallestModelRadius))) : 0;
  return {
    layers,
    sizeMode,
    outerModelRadius,
    fullCount: fullModels.length,
    globalExposure: 1 / Math.sqrt(Math.max(1, fullModels.length)),
    visibleRadius: layers.length ? Math.max(...layers.map(({ model, scale }) => model.domainRadius / scale)) : 0,
    gridRadii: Array.from({ length: gridDepth + 1 }, (_, index) => 2 ** (index - gridDepth)),
  };
}

function sumAtPoint(prepared, x, y, z, exact = false, channels = [0, 0]) {
  const radius = Math.sqrt(x * x + y * y + z * z);
  channels[0] = 0;
  channels[1] = 0;
  if (radius > 1) return channels;
  const inverseRadius = radius ? 1 / radius : 0;
  const cosine = z * inverseRadius;
  const pFactor = angularFactors[1] * inverseRadius;
  const dAngular = radius ? angularFactors[2] * (3 * cosine * cosine - 1) : 0;
  const fAngular = radius ? angularFactors[3] * (5 * cosine * cosine * cosine - 3 * cosine) : 0;
  for (const { model, orientation, scale, opticalWeight, lookup } of prepared.layers) {
    const modelRadius = radius * scale;
    if (modelRadius > model.domainRadius) continue;
    const angular = model.l === 0 ? angularFactors[0] : model.l === 1 ? (orientation === 'x' ? x : orientation === 'y' ? y : z) * pFactor : model.l === 2 ? dAngular : fAngular;
    const amplitude = exact
      ? evaluateOrbital(model.id, x * scale, y * scale, z * scale, orientation)
      : sampleRadialLookup(lookup, modelRadius) * angular;
    channels[amplitude < 0 ? 1 : 0] += opticalWeight * amplitude * amplitude;
  }
  return channels;
}

/** Independent analytic reference for tests and inspection, before half quantization. */
export function evaluateOrbitalField(options, x, y, z) {
  if (![x, y, z].every(Number.isFinite)) throw new RangeError('Field coordinates must be finite.');
  return sumAtPoint(prepare(options), x, y, z, true);
}

/**
 * Grids contain the complete selected field, finest first. The renderer samples
 * a single applicable grid (blending only at seams); it must not add grids.
 * Texel centres map to (2 * (i + .5) / size - 1) * radius. x varies fastest.
 */
export function buildOrbitalField(options) {
  const started = now();
  const resolution = options.resolution ?? 64;
  if (!Number.isInteger(resolution) || resolution < 8 || resolution > 96) throw new RangeError('Orbital field resolution must be an integer from 8 to 96.');
  const prepared = prepare(options);
  const { layers, gridRadii, visibleRadius, sizeMode, outerModelRadius, fullCount, globalExposure } = prepared;
  const grids = layers.length ? gridRadii.map((radius) => {
    const data = new Uint16Array(resolution ** 3 * 2);
    const coordinates = Float64Array.from({ length: resolution }, (_, index) => (2 * (index + 0.5) / resolution - 1) * radius);
    const channels = [0, 0];
    let offset = 0;
    for (let zIndex = 0; zIndex < resolution; zIndex += 1) {
      for (let yIndex = 0; yIndex < resolution; yIndex += 1) {
        for (let xIndex = 0; xIndex < resolution; xIndex += 1) {
          sumAtPoint(prepared, coordinates[xIndex], coordinates[yIndex], coordinates[zIndex], false, channels);
          data[offset++] = floatToHalf(channels[0]);
          data[offset++] = floatToHalf(channels[1]);
        }
      }
    }
    return { radius, size: resolution, data };
  }) : [];
  return { grids, boundsRadius: 1, visibleRadius, globalExposure, outerModelRadius, fullCount, sizeMode, generationMs: now() - started };
}

/** Trilinear CPU counterpart of a single clamped 3D texture sample. */
export function sampleOrbitalGrid(grid, x, y, z) {
  const positions = [x, y, z].map((value) => Math.max(0, Math.min(grid.size - 1, (value / (2 * grid.radius) + 0.5) * grid.size - 0.5)));
  const lower = positions.map(Math.floor);
  const upper = lower.map((value) => Math.min(grid.size - 1, value + 1));
  const mixes = positions.map((value, axis) => value - lower[axis]);
  const channels = [0, 0];
  for (let zCorner = 0; zCorner <= 1; zCorner += 1) {
    for (let yCorner = 0; yCorner <= 1; yCorner += 1) {
      for (let xCorner = 0; xCorner <= 1; xCorner += 1) {
        const indices = [xCorner, yCorner, zCorner].map((corner, axis) => corner ? upper[axis] : lower[axis]);
        const weight = [xCorner, yCorner, zCorner].reduce((product, corner, axis) => product * (corner ? mixes[axis] : 1 - mixes[axis]), 1);
        const offset = 2 * (indices[0] + grid.size * (indices[1] + grid.size * indices[2]));
        channels[0] += weight * halfToFloat(grid.data[offset]);
        channels[1] += weight * halfToFloat(grid.data[offset + 1]);
      }
    }
  }
  return channels;
}
