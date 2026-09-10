/**
 * Normalized hydrogenic pilot orbitals in atomic units (a₀ = 1, Z_model = 1).
 *
 * ψ is an amplitude; |ψ|² is the probability density. Display exposure and the
 * finite render domain never change its normalization. Multi-electron elements
 * use this educational basis, not a neutral-atom radial calculation.
 * Formula conventions: https://dlmf.nist.gov/18.39.ii
 */
export const ORBITAL_MODEL_CHARGE = 1;
export const ORBITAL_NORMALIZATION = Object.freeze({
  s1: 1 / Math.sqrt(Math.PI),
  n2: 1 / (4 * Math.sqrt(2 * Math.PI)),
});

// Fixed spherical domains in a₀. Tests verify <1% discarded probability for
// every supported n,l; common n domains preserve a useful hydrogenic size ratio.
const domains = [0, 6, 14, 28, 46, 68, 96, 128];
const occupiedOgSubshells = ['1s', '2s', '2p', '3s', '3p', '3d', '4s', '4p', '4d', '4f', '5s', '5p', '5d', '5f', '6s', '6p', '6d', '7s', '7p'];
export const ORBITAL_MODELS = Object.freeze(Object.fromEntries(occupiedOgSubshells.map((id, shaderIndex) => {
  const n = Number(id[0]);
  const l = 'spdf'.indexOf(id[1]);
  return [id, Object.freeze({
    id, n, l, shaderIndex,
    domainRadius: domains[n],
    fitRadius: domains[n] / 2,
    // Fixed optical-display exposure; occupation numbers are never weights.
    // n³ compensates the central-column falloff of normalized hydrogenic ψ.
    exposure: id === '1s' ? 12 : [20, 15, 12, 10][l] * n ** 3,
    representative: ['s', 'p_z', 'd_z2', 'f_z3'][l],
    radialNodes: n - l - 1,
    angularNodes: l,
  })];
})));

const positiveRadius = (r) => {
  if (!Number.isFinite(r) || r < 0) throw new RangeError('Radius must be finite and nonnegative.');
};

const factorial = (value) => {
  let product = 1;
  for (let index = 2; index <= value; index += 1) product *= index;
  return product;
};

// The recurrence avoids storing independent radial polynomials for each state.
export function generalizedLaguerre(degree, alpha, x) {
  if (degree === 0) return 1;
  let previous = 1;
  let current = 1 + alpha - x;
  for (let k = 1; k < degree; k += 1) {
    const next = ((2 * k + 1 + alpha - x) * current - (k + alpha) * previous) / (k + 1);
    previous = current;
    current = next;
  }
  return current;
}

/** R_nl, normalized so ∫ r² R_nl(r)² dr = 1. No angular factor here. */
export function radialWavefunction(n, l, r) {
  positiveRadius(r);
  if (!Number.isInteger(n) || n < 1 || n > 7 || !Number.isInteger(l) || l < 0 || l >= n) {
    throw new RangeError('Use integer quantum numbers 1 ≤ n ≤ 7 and 0 ≤ l < n.');
  }
  const rho = (2 * r) / n;
  const normalization = (2 / n) ** 1.5 * Math.sqrt(factorial(n - l - 1) / (2 * n * factorial(n + l)));
  return normalization * Math.exp(-rho / 2) * rho ** l * generalizedLaguerre(n - l - 1, 2 * l + 1, rho);
}

export function radialProbabilityDensity(n, l, r) {
  const amplitude = radialWavefunction(n, l, r);
  return r * r * amplitude * amplitude;
}

/** Normalized real angular functions. d/f use their named z-aligned m=0 representatives. */
export function angularWavefunction(l, x, y, z, orientation = 'z') {
  if (l === 0) return 1 / Math.sqrt(4 * Math.PI);
  const r = Math.hypot(x, y, z);
  if (l === 1 && !['x', 'y', 'z'].includes(orientation)) throw new RangeError('A p orientation must be x, y, or z.');
  if (r === 0) return 0;
  if (l === 1) return Math.sqrt(3 / (4 * Math.PI)) * (orientation === 'x' ? x : orientation === 'y' ? y : z) / r;
  const cosine = z / r;
  if (l === 2) return Math.sqrt(5 / (16 * Math.PI)) * (3 * cosine * cosine - 1);
  if (l === 3) return Math.sqrt(7 / (16 * Math.PI)) * (5 * cosine ** 3 - 3 * cosine);
  throw new RangeError('The visual basis supports s, p, d_z2 and f_z3.');
}

/**
 * Cartesian real wavefunctions. The p orientation labels are real basis
 * functions, not a claim that each axis is uniquely occupied in an atom.
 */
export function evaluateOrbital(id, x, y, z, orientation = 'z') {
  if (![x, y, z].every(Number.isFinite)) throw new RangeError('Coordinates must be finite.');
  const radius = Math.hypot(x, y, z);
  if (id === '1s') return ORBITAL_NORMALIZATION.s1 * Math.exp(-radius);
  if (id === '2s') return ORBITAL_NORMALIZATION.n2 * (2 - radius) * Math.exp(-radius / 2);
  if (id === '2p') {
    if (!['x', 'y', 'z'].includes(orientation)) throw new RangeError('A 2p orientation must be x, y, or z.');
    const axis = orientation === 'x' ? x : orientation === 'y' ? y : z;
    return ORBITAL_NORMALIZATION.n2 * axis * Math.exp(-radius / 2);
  }
  const model = ORBITAL_MODELS[id];
  if (!model) throw new RangeError(`Unsupported pilot orbital: ${id}`);
  return radialWavefunction(model.n, model.l, radius) * angularWavefunction(model.l, x, y, z, orientation);
}

export function orbitalDensity(id, x, y, z, orientation = 'z') {
  const amplitude = evaluateOrbital(id, x, y, z, orientation);
  return amplitude * amplitude;
}

/** Probability outside a sphere; exact for 1s/2s/2p, converged quadrature otherwise. */
export function radialTailProbability(id, r) {
  positiveRadius(r);
  if (id === '1s') return Math.exp(-2 * r) * (1 + 2 * r + 2 * r * r);
  if (id === '2s') return Math.exp(-r) * (r ** 4 + 4 * r * r + 8 * r + 8) / 8;
  if (id === '2p') return Math.exp(-r) * (1 + r + r * r / 2 + r ** 3 / 6 + r ** 4 / 24);
  const model = ORBITAL_MODELS[id];
  if (!model) throw new RangeError(`Unsupported pilot orbital: ${id}`);
  const end = Math.max(4 * model.domainRadius, r + 8 * model.n * model.n);
  const steps = 8192;
  const step = (end - r) / steps;
  let integral = radialProbabilityDensity(model.n, model.l, r) + radialProbabilityDensity(model.n, model.l, end);
  for (let index = 1; index < steps; index += 1) {
    integral += (index % 2 ? 4 : 2) * radialProbabilityDensity(model.n, model.l, r + index * step);
  }
  return Math.max(0, Math.min(1, integral * step / 3));
}

/** Signed radial values preserve node/sign changes during linear interpolation. */
export function createRadialLookup(id, samples = 8193) {
  const model = ORBITAL_MODELS[id];
  if (!model || !Number.isInteger(samples) || samples < 257) throw new RangeError('Use a supported orbital and at least 257 radial samples.');
  const values = new Float32Array(samples);
  const step = model.domainRadius / (samples - 1);
  for (let index = 0; index < samples; index += 1) values[index] = radialWavefunction(model.n, model.l, index * step);
  return { id, radius: model.domainRadius, step, values };
}

export function sampleRadialLookup(lookup, radius) {
  if (radius < 0 || radius > lookup.radius) return 0;
  const location = radius / lookup.step;
  const index = Math.min(Math.floor(location), lookup.values.length - 2);
  const mix = location - index;
  return lookup.values[index] * (1 - mix) + lookup.values[index + 1] * mix;
}

/** Beer–Lambert display mapping. Splitting a sample preserves its opacity. */
export function opacityFromDensity(density, stepLength, exposure) {
  if (![density, stepLength, exposure].every((value) => Number.isFinite(value) && value >= 0)) {
    throw new RangeError('Density, step length, and exposure must be finite and nonnegative.');
  }
  return -Math.expm1(-density * stepLength * exposure);
}
