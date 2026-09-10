import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  buildOrbitalField,
  evaluateOrbitalField,
  floatToHalf,
  halfToFloat,
  sampleOrbitalGrid,
} from '../components/explorer/orbitals/orbitalField.mjs';
import { ORBITAL_MODELS } from '../components/explorer/orbitals/orbitalMath.mjs';
import { ensureOrbitalPresets, getOrbitalPreset } from '../data/orbital-presets.mjs';

const close = (actual, expected, relative = 0.001, absolute = 1e-6) => {
  assert.ok(Math.abs(actual - expected) <= Math.max(absolute, Math.abs(expected) * relative), `${actual} differs from ${expected}`);
};
const elements = JSON.parse(readFileSync(new URL('../public/elements.json', import.meta.url), 'utf8'));
ensureOrbitalPresets(elements);
const optionsFor = (number, sizeMode = 'normalized', resolution = 32) => {
  const subshells = getOrbitalPreset(number).subshells;
  return { subshells, allSubshells: subshells, sizeMode, resolution };
};

test('half precision conversion rounds known normal and subnormal values correctly', () => {
  for (const value of [0, -0, 1, -2, 0.125, 65504, 2 ** -14, 2 ** -24]) {
    assert.equal(halfToFloat(floatToHalf(value)), value);
  }
  assert.equal(floatToHalf(1 + 2 ** -11), floatToHalf(1), 'halfway rounds to even');
  assert.equal(floatToHalf(1 + 3 * 2 ** -11), floatToHalf(1 + 2 ** -9), 'odd halfway rounds upward');
  assert.equal(floatToHalf(2 ** -25), 0);
  assert.equal(floatToHalf(3 * 2 ** -25), 2);
  for (const value of [Infinity, NaN, 65505]) assert.throws(() => floatToHalf(value), RangeError);
});

test('texture ordering and texel-centre values agree with independently evaluated amplitudes', () => {
  for (const id of Object.keys(ORBITAL_MODELS)) {
    const options = { subshells: [{ id, orientation: 'y' }], resolution: 16 };
    const field = buildOrbitalField(options);
    const grid = field.grids[0];
    assert.equal(grid.data.length, 16 ** 3 * 2);
    for (const indices of [[4, 5, 7], [9, 9, 11], [7, 8, 8], [13, 5, 6]]) {
      const coords = indices.map((index) => 2 * (index + 0.5) / 16 - 1);
      const exact = evaluateOrbitalField(options, ...coords);
      const offset = 2 * (indices[0] + 16 * (indices[1] + 16 * indices[2]));
      const sampled = sampleOrbitalGrid(grid, ...coords);
      exact.forEach((value, channel) => {
        close(halfToFloat(grid.data[offset + channel]), value);
        close(sampled[channel], value);
      });
    }
  }
});

test('phase channels keep p orientation signs separate without destructive amplitude cancellation', () => {
  for (const orientation of ['x', 'y', 'z']) {
    const options = { subshells: [{ id: '2p', orientation }] };
    const axis = ['x', 'y', 'z'].map((value) => value === orientation ? 0.2 : 0);
    const positive = evaluateOrbitalField(options, ...axis);
    const negative = evaluateOrbitalField(options, ...axis.map((value) => -value));
    assert.ok(positive[0] > 0);
    assert.equal(positive[1], 0);
    assert.equal(negative[0], 0);
    close(negative[1], positive[0]);
    const plane = ['x', 'y', 'z'].map((value) => value === orientation ? 0 : 0.2);
    assert.deepEqual(evaluateOrbitalField(options, ...plane), [0, 0]);
  }
  const pOptions = { subshells: [{ id: '2p' }], allSubshells: getOrbitalPreset(6).subshells };
  const sOptions = { ...pOptions, subshells: [{ id: '1s' }, { id: '2s' }] };
  const fullOptions = optionsFor(6);
  const point = [0.1, 0.15, -0.2];
  const p = evaluateOrbitalField(pOptions, ...point);
  const s = evaluateOrbitalField(sOptions, ...point);
  const full = evaluateOrbitalField(fullOptions, ...point);
  full.forEach((value, channel) => close(value, p[channel] + s[channel], 1e-12));
});

test('visibility changes preserve common domain, size, exposure and other layers', () => {
  for (const sizeMode of ['normalized', 'ratios']) {
    const options = optionsFor(6, sizeMode, 16);
    const full = buildOrbitalField(options);
    const only = buildOrbitalField({ ...options, subshells: [{ id: '1s' }] });
    const empty = buildOrbitalField({ ...options, subshells: [] });
    assert.equal(full.boundsRadius, 1);
    assert.equal(only.outerModelRadius, full.outerModelRadius);
    assert.equal(only.globalExposure, full.globalExposure);
    assert.equal(empty.globalExposure, full.globalExposure);
    assert.deepEqual(full.grids.map(({ radius }) => radius), only.grids.map(({ radius }) => radius));
    assert.equal(only.visibleRadius, sizeMode === 'ratios' ? 6 / 14 : 1);
    assert.equal(empty.visibleRadius, 0);
    assert.deepEqual(empty.grids, []);
  }
  const base = { subshells: [{ id: '2p', electrons: 1 }], allSubshells: getOrbitalPreset(6).subshells, resolution: 16 };
  assert.deepEqual(buildOrbitalField(base).grids[0].data, buildOrbitalField({ ...base, subshells: [{ id: '2p', electrons: 6 }] }).grids[0].data);
});

test('nested ratio grids retain the Og core within six bounded RG16F textures', () => {
  const options = { ...optionsFor(118, 'ratios', 64), subshells: [{ id: '1s' }] };
  const field = buildOrbitalField(options);
  assert.deepEqual(field.grids.map(({ radius }) => radius), [1 / 32, 1 / 16, 1 / 8, 1 / 4, 1 / 2, 1]);
  assert.equal(field.grids.reduce((bytes, grid) => bytes + grid.data.byteLength, 0), 6 * 1024 * 1024);
  assert.equal(field.outerModelRadius, 128);
  close(field.visibleRadius, 6 / 128);
  const point = [0.007, 0.003, -0.004];
  const exact = evaluateOrbitalField(options, ...point)[0];
  const fine = sampleOrbitalGrid(field.grids[0], ...point)[0];
  const coarse = sampleOrbitalGrid(field.grids.at(-1), ...point)[0];
  close(fine, exact, 0.02);
  assert.ok(Math.abs(coarse - exact) > Math.abs(fine - exact) * 5, 'nested core is materially better resolved');
});

test('grids store the same complete field through nested overlaps', () => {
  const options = optionsFor(118, 'ratios', 64);
  const field = buildOrbitalField(options);
  for (let index = 0; index < field.grids.length - 1; index += 1) {
    const fine = field.grids[index];
    const coarse = field.grids[index + 1];
    const point = [fine.radius * 0.82, fine.radius * 0.06, fine.radius * 0.18];
    const exact = evaluateOrbitalField(options, ...point);
    const a = sampleOrbitalGrid(fine, ...point);
    const b = sampleOrbitalGrid(coarse, ...point);
    // A channel can approach zero at a phase node: compare total optical
    // density and phase fraction, which actually determine rendered opacity
    // and colour, rather than an unstable relative error of that channel.
    const total = exact[0] + exact[1];
    for (const sampled of [a, b]) {
      const sampledTotal = sampled[0] + sampled[1];
      close(sampledTotal, total, 0.04);
      close(sampled[0] / sampledTotal, exact[0] / total, 0, 0.02);
    }
  }
  assert.ok(field.generationMs >= 0);
  assert.equal(field.fullCount, 19);
});

test('changing size mode changes scale without introducing an occupation-dependent optical weight', () => {
  const allSubshells = getOrbitalPreset(118).subshells;
  for (const id of ['1s', '2p', '4f', '7s']) {
    const radius = ORBITAL_MODELS[id].domainRadius;
    const normalized = evaluateOrbitalField({ allSubshells, subshells: [{ id }], sizeMode: 'normalized' }, 0.11, 0.06, 0.2);
    const ratios = evaluateOrbitalField({ allSubshells, subshells: [{ id }], sizeMode: 'ratios' }, 0.11 * radius / 128, 0.06 * radius / 128, 0.2 * radius / 128);
    normalized.forEach((value, channel) => close(value, ratios[channel] * radius / 128, 1e-10));
  }
});

test('invalid masks, orientations and allocations fail explicitly', () => {
  for (const options of [
    { subshells: [{ id: '8s' }] },
    { subshells: [{ id: '1s' }, { id: '1s' }] },
    { subshells: [{ id: '2p', orientation: 'q' }] },
    { subshells: [{ id: '2s' }], allSubshells: [{ id: '1s' }] },
    { subshells: [{ id: '1s' }], sizeMode: 'actual atom' },
    { subshells: [{ id: '1s' }], resolution: 256 },
  ]) assert.throws(() => buildOrbitalField(options), RangeError);
});
