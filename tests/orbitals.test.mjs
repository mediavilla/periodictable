import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  angularWavefunction,
  createRadialLookup,
  evaluateOrbital,
  opacityFromDensity,
  orbitalDensity,
  ORBITAL_MODELS,
  ORBITAL_MODEL_CHARGE,
  radialProbabilityDensity,
  radialTailProbability,
  radialWavefunction,
  sampleRadialLookup,
} from '../components/explorer/orbitals/orbitalMath.mjs';
import { getOrbitalPreset, ensureOrbitalPresets, ORBITAL_PILOT_NUMBERS, ORBITAL_PRESETS } from '../data/orbital-presets.mjs';

function simpson(fn, start, end, steps = 4000) {
  const step = (end - start) / steps;
  let integral = fn(start) + fn(end);
  for (let index = 1; index < steps; index += 1) integral += (index % 2 === 0 ? 2 : 4) * fn(start + index * step);
  return integral * step / 3;
}

const near = (actual, expected, tolerance = 1e-10) => {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} should be within ${tolerance} of ${expected}`);
};

test('all pilot radial wavefunctions integrate to one and converge within 0.1%', () => {
  assert.equal(ORBITAL_MODEL_CHARGE, 1, 'Carbon must not substitute its atomic number for screened nuclear charge');
  for (const { n, l, domainRadius } of Object.values(ORBITAL_MODELS)) {
    const coarse = simpson((r) => radialProbabilityDensity(n, l, r), 0, domainRadius * 4, 4096);
    const fine = simpson((r) => radialProbabilityDensity(n, l, r), 0, domainRadius * 4, 8192);
    near(coarse, 1, 0.001);
    near(fine, 1, 0.000001);
    near(coarse, fine, 0.000001);
  }
});

test('generalized radial solutions satisfy the Coulomb equation and independent radius moments', () => {
  for (const { n, l, domainRadius } of Object.values(ORBITAL_MODELS)) {
    const mean = simpson((r) => r * radialProbabilityDensity(n, l, r), 0, domainRadius * 4, 8192);
    const inverseMean = simpson((r) => r ? radialProbabilityDensity(n, l, r) / r : 0, 0, domainRadius * 4, 8192);
    near(mean, (3 * n * n - l * (l + 1)) / 2, 1e-7);
    near(inverseMean, 1 / (n * n), 1e-7);
    for (const fraction of [0.02, 0.15, 0.35, 0.6, 0.9]) {
      const r = domainRadius * fraction;
      const h = r * 0.001;
      const u = (radius) => radius * radialWavefunction(n, l, radius);
      const secondDerivative = (-u(r + 2 * h) + 16 * u(r + h) - 30 * u(r) + 16 * u(r - h) - u(r - 2 * h)) / (12 * h * h);
      // The reduced radial equation has E_n = -1/(2n²), Z_model = 1.
      near(secondDerivative + (2 / r - l * (l + 1) / (r * r) - 1 / (n * n)) * u(r), 0, 1e-7);
    }
  }
});

test('Cartesian evaluators agree with independently normalized radial/angular factors', () => {
  const r = 1.7;
  const theta = 0.9;
  const phi = 1.1;
  const x = r * Math.sin(theta) * Math.cos(phi);
  const y = r * Math.sin(theta) * Math.sin(phi);
  const z = r * Math.cos(theta);
  for (const n of [1, 2]) near(evaluateOrbital(`${n}s`, x, y, z), radialWavefunction(n, 0, r) / Math.sqrt(4 * Math.PI));
  for (const [axis, coordinate] of [['x', x], ['y', y], ['z', z]]) {
    near(evaluateOrbital('2p', x, y, z, axis), radialWavefunction(2, 1, r) * Math.sqrt(3 / (4 * Math.PI)) * coordinate / r);
  }
  // Angular integration is independent of the radial normalization check.
  for (const id of ['1s', '2s', '2p', '3d', '4f']) {
    const { n, l } = ORBITAL_MODELS[id];
    for (const orientation of id === '2p' ? ['x', 'y', 'z'] : ['z']) {
      const angularIntegral = simpson((mu) => simpson((azimuth) => {
        const horizontal = r * Math.sqrt(Math.max(0, 1 - mu * mu));
        return orbitalDensity(id, horizontal * Math.cos(azimuth), horizontal * Math.sin(azimuth), r * mu, orientation) / radialWavefunction(n, l, r) ** 2;
      }, 0, 2 * Math.PI, 32), -1, 1, 512);
      near(angularIntegral, 1, 1e-8);
    }
  }
});

test('all nineteen radial functions have n-l-1 nodes and real angular representatives have correct parity', () => {
  assert.equal(Object.keys(ORBITAL_MODELS).length, 19);
  for (const { id, n, l, domainRadius, radialNodes } of Object.values(ORBITAL_MODELS)) {
    let previousSign = 1;
    let crossings = 0;
    for (let index = 1; index <= 12000; index += 1) {
      const amplitude = radialWavefunction(n, l, index * domainRadius / 12000);
      const sign = Math.sign(amplitude);
      if (sign && sign !== previousSign) crossings += 1;
      if (sign) previousSign = sign;
    }
    assert.equal(crossings, radialNodes, `${id} radial node count`);
    near(evaluateOrbital(id, -1, -2, -3), (-1) ** l * evaluateOrbital(id, 1, 2, 3));
  }
  const dNode = 1 / Math.sqrt(3);
  near(angularWavefunction(2, Math.sqrt(1 - dNode ** 2), 0, dNode), 0);
  for (const cosine of [0, Math.sqrt(3 / 5), -Math.sqrt(3 / 5)]) {
    near(angularWavefunction(3, Math.sqrt(1 - cosine ** 2), 0, cosine), 0);
  }
  assert.ok(angularWavefunction(2, 0, 0, 1) > 0);
  assert.ok(angularWavefunction(2, 1, 0, 0) < 0);
});

test('signed radial lookup interpolation agrees with analytic functions without erasing nodes', () => {
  for (const { id, n, l, domainRadius } of Object.values(ORBITAL_MODELS)) {
    const lookup = createRadialLookup(id);
    for (let sample = 0; sample < 201; sample += 1) {
      const radius = domainRadius * (sample + 0.31) / 201;
      const analytic = radialWavefunction(n, l, radius);
      near(sampleRadialLookup(lookup, radius), analytic, 2e-6);
    }
    assert.equal(sampleRadialLookup(lookup, domainRadius + 1), 0);
  }
  const lookup = createRadialLookup('2s');
  assert.ok(sampleRadialLookup(lookup, 1.99) > 0);
  assert.ok(sampleRadialLookup(lookup, 2.01) < 0);
  near(sampleRadialLookup(lookup, 2), 0, 1e-7);
});

test('origin values, radial nodes and nodal planes have their expected signs', () => {
  near(evaluateOrbital('1s', 0, 0, 0), 1 / Math.sqrt(Math.PI));
  near(evaluateOrbital('2s', 0, 0, 0), 1 / (2 * Math.sqrt(2 * Math.PI)));
  assert.equal(evaluateOrbital('2p', 0, 0, 0), 0);
  for (const r of [0, 0.5, 2, 4, 6]) assert.ok(evaluateOrbital('1s', r, 0, 0) > 0);
  assert.ok(evaluateOrbital('2s', 1, 0, 0) > 0);
  assert.equal(evaluateOrbital('2s', 2, 0, 0), 0);
  assert.ok(evaluateOrbital('2s', 3, 0, 0) < 0);
  for (const axis of ['x', 'y', 'z']) {
    const positive = ['x', 'y', 'z'].map((value) => value === axis ? 2 : 0);
    const negative = positive.map((value) => -value);
    const plane = ['x', 'y', 'z'].map((value) => value === axis ? 0 : 2);
    assert.ok(evaluateOrbital('2p', ...positive, axis) > 0);
    assert.ok(evaluateOrbital('2p', ...negative, axis) < 0);
    assert.equal(evaluateOrbital('2p', ...plane, axis), 0);
    near(orbitalDensity('2p', ...positive, axis), orbitalDensity('2p', ...negative, axis));
  }
});

test('density is invariant to spherical rotations and a global wavefunction sign reversal', () => {
  for (const id of ['1s', '2s']) {
    near(orbitalDensity(id, 3, 4, 0), orbitalDensity(id, 0, 0, 5));
  }
  for (const id of Object.keys(ORBITAL_MODELS)) {
    const amplitude = evaluateOrbital(id, 1, 2, 3);
    near(orbitalDensity(id, 1, 2, 3), (-amplitude) ** 2);
  }
  near(orbitalDensity('2p', 2, 1, 3, 'x'), orbitalDensity('2p', 1, 2, 3, 'y'));
});

test('finite sphere domains exclude less than 1% probability with exact recorded tails', () => {
  // Excluded fractions: 1s 0.0522%, 2s 0.4087%, 2p 0.1805%.
  const expectedTailRanges = { '1s': [0.00052, 0.00053], '2s': [0.00408, 0.00410], '2p': [0.00180, 0.00181] };
  for (const [id, { n, l, domainRadius, fitRadius }] of Object.entries(ORBITAL_MODELS)) {
    const tail = radialTailProbability(id, domainRadius);
    assert.ok(tail < 0.01);
    assert.ok(fitRadius < domainRadius, 'framing remains independent of the analytic crop');
    if (expectedTailRanges[id]) assert.ok(tail >= expectedTailRanges[id][0] && tail <= expectedTailRanges[id][1], `${id} tail ${tail}`);
    near(simpson((r) => radialProbabilityDensity(n, l, r), 0, domainRadius, 8192) + tail, 1, 1e-7);
    near(radialTailProbability(id, 0), 1, 1e-6);
  }
});

test('opacity integration preserves brightness when the step count changes', () => {
  const density = 0.023;
  const exposure = 120;
  const length = 7;
  const expected = opacityFromDensity(density, length, exposure);
  for (const steps of [24, 48, 80, 160]) {
    const sampleOpacity = opacityFromDensity(density, length / steps, exposure);
    near(1 - (1 - sampleOpacity) ** steps, expected);
  }
  assert.equal(opacityFromDensity(0, 0.5, 120), 0);
});

test('every element preset conserves occupations without multiplying spatial representatives', () => {
  const elements = JSON.parse(readFileSync(new URL('../public/elements.json', import.meta.url), 'utf8'));
  ensureOrbitalPresets(elements);
  assert.deepEqual(ORBITAL_PILOT_NUMBERS, [1, 6, 118]);
  assert.equal(Object.keys(ORBITAL_PRESETS).length, 118);
  for (const element of elements) {
    const preset = getOrbitalPreset(element);
    assert.ok(preset, `${element.name} must have an orbital preset`);
    assert.equal(preset.subshells.reduce((total, state) => total + state.electrons, 0), element.number);
    assert.ok(preset.subshells.some((state) => state.id === preset.defaultOrbital));
    assert.ok(preset.subshells.every((state) => ORBITAL_MODELS[state.id]));
    const actualConfiguration = element.electron_configuration.trim().split(/\s+/).map((entry) => {
      const match = /^(\d[spdf])(\d+)$/.exec(entry);
      assert.ok(match, `expanded configuration entry ${entry}`);
      return { id: match[1], electrons: Number(match[2]) };
    });
    assert.deepEqual(preset.subshells.map(({ id, electrons }) => ({ id, electrons })), actualConfiguration);
    assert.equal(preset.fullConfiguration, element.electron_configuration);
    assert.ok(preset.sources.every(({ title, url }) => title && url.startsWith('https://')));
    assert.match(preset.modelNote, /hydrogen/i);
  }
  assert.equal(getOrbitalPreset(1).defaultOrbital, '1s');
  assert.equal(getOrbitalPreset(6).defaultOrbital, '2p');
  assert.equal(getOrbitalPreset('constructor'), null);
  assert.equal(getOrbitalPreset(undefined), null);
  const carbonP = getOrbitalPreset(6).subshells.find(({ id }) => id === '2p');
  assert.deepEqual(carbonP.orientations, ['x', 'y', 'z']);
  assert.equal(carbonP.electrons, 2);
  assert.match(getOrbitalPreset(6).modelNote, /approximation/);
  const gold = getOrbitalPreset(79);
  assert.ok(gold);
  assert.equal(gold.symbol, 'Au');
  assert.ok(gold.subshells.some(({ id }) => id === '5d'));
  const og = getOrbitalPreset(118);
  assert.equal(og.subshells.length, 19);
  assert.equal(og.predicted, true);
  assert.match(og.modelNote, /relativistic/);
  assert.match(og.occupancyNote, /not weighted by electron count/);
  assert.ok(og.sources.some(({ url }) => url === 'https://periodic.lanl.gov/118.shtml'));
  const totals = Array(7).fill(0);
  og.subshells.forEach(({ n, electrons, l, spatialOrbitalCount }) => {
    totals[n - 1] += electrons;
    assert.equal(spatialOrbitalCount, 2 * l + 1);
    assert.ok(electrons <= 2 * spatialOrbitalCount);
  });
  assert.deepEqual(totals, [2, 8, 18, 32, 32, 18, 8]);
});

test('invalid quantum numbers, inputs and unsupported orbital shapes fail explicitly', () => {
  assert.throws(() => radialWavefunction(2, 2, 1), RangeError);
  assert.throws(() => radialWavefunction(0, 0, 1), RangeError);
  assert.throws(() => radialWavefunction(1, 0, -1), RangeError);
  assert.throws(() => evaluateOrbital('8s', 0, 0, 0), RangeError);
  assert.throws(() => evaluateOrbital('6f', 0, 0, 0), RangeError);
  assert.throws(() => evaluateOrbital('2p', 1, 1, 1, 'm=1'), RangeError);
  assert.throws(() => evaluateOrbital('1s', Infinity, 0, 0), RangeError);
  assert.throws(() => opacityFromDensity(-1, 1, 1), RangeError);
});
