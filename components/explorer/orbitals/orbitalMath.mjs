/**
 * Normalized hydrogenic pilot orbitals in atomic units (a₀ = 1, Z_model = 1).
 *
 * ψ is an amplitude; |ψ|² is the probability density. Display exposure and the
 * finite render domain never change its normalization. Carbon uses these same
 * shapes as an educational basis, not a neutral-carbon radial calculation.
 * Formula conventions: https://dlmf.nist.gov/18.39.ii
 */
export const ORBITAL_MODEL_CHARGE = 1;
export const ORBITAL_NORMALIZATION = Object.freeze({
  s1: 1 / Math.sqrt(Math.PI),
  n2: 1 / (4 * Math.sqrt(2 * Math.PI)),
});

export const ORBITAL_MODELS = Object.freeze({
  '1s': Object.freeze({ id: '1s', n: 1, l: 0, shaderIndex: 0, domainRadius: 6, fitRadius: 3, exposure: 12 }),
  '2s': Object.freeze({ id: '2s', n: 2, l: 0, shaderIndex: 1, domainRadius: 14, fitRadius: 7, exposure: 160 }),
  '2p': Object.freeze({ id: '2p', n: 2, l: 1, shaderIndex: 2, domainRadius: 14, fitRadius: 7, exposure: 120 }),
});

const positiveRadius = (r) => {
  if (!Number.isFinite(r) || r < 0) throw new RangeError('Radius must be finite and nonnegative.');
};

const factorial = (value) => {
  let product = 1;
  for (let index = 2; index <= value; index += 1) product *= index;
  return product;
};

// The recurrence avoids storing independent radial polynomials for each state.
function generalizedLaguerre(degree, alpha, x) {
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
  throw new RangeError(`Unsupported pilot orbital: ${id}`);
}

export function orbitalDensity(id, x, y, z, orientation = 'z') {
  const amplitude = evaluateOrbital(id, x, y, z, orientation);
  return amplitude * amplitude;
}

/** Exact probability outside a sphere of radius r; used to document cropping. */
export function radialTailProbability(id, r) {
  positiveRadius(r);
  if (id === '1s') return Math.exp(-2 * r) * (1 + 2 * r + 2 * r * r);
  if (id === '2s') return Math.exp(-r) * (r ** 4 + 4 * r * r + 8 * r + 8) / 8;
  if (id === '2p') return Math.exp(-r) * (1 + r + r * r / 2 + r ** 3 / 6 + r ** 4 / 24);
  throw new RangeError(`Unsupported pilot orbital: ${id}`);
}

/** Beer–Lambert display mapping. Splitting a sample preserves its opacity. */
export function opacityFromDensity(density, stepLength, exposure) {
  if (![density, stepLength, exposure].every((value) => Number.isFinite(value) && value >= 0)) {
    throw new RangeError('Density, step length, and exposure must be finite and nonnegative.');
  }
  return -Math.expm1(-density * stepLength * exposure);
}
