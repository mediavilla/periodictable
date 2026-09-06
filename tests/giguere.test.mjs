import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const layout = read('../data/giguere-layout.json');
const provenance = read('../data/giguere-provenance.json');
const byNumber = new Map(layout.map((entry) => [entry.number, entry]));
const close = (a, b) => Math.abs(a - b) < 1e-6;

test('the historical edition contains each element from H to Lr exactly once', () => {
  assert.equal(layout.length, 103);
  assert.equal(byNumber.size, 103);
  assert.deepEqual([...byNumber.keys()].sort((a, b) => a - b), Array.from({ length: 103 }, (_, i) => i + 1));
  assert.deepEqual(provenance.membership.numbers, [...byNumber.keys()]);
  assert.equal(provenance.originYear, 1965);
  assert.equal(provenance.publicationYear, 1966);
});

test('orbital wings retain the original unusual placements', () => {
  assert.deepEqual(Object.fromEntries(['s', 'p', 'd', 'f'].map((wing) => [wing, layout.filter((entry) => entry.wing === wing).length])), { s: 14, p: 30, d: 31, f: 28 });
  assert.equal(byNumber.get(2).wing, 's');
  assert.equal(byNumber.get(71).wing, 'd');
  assert.equal(byNumber.get(103).wing, 'd');
  assert.equal(byNumber.get(57).wing, 'f');
  assert.equal(byNumber.get(89).wing, 'f');
  assert.equal(byNumber.get(91).tile, byNumber.get(100).tile, 'Pa faces Fm; the modern reconstruction’s repeated Pr must not recur');
  assert.notEqual(byNumber.get(59).tile, byNumber.get(91).tile);
});

test('source figure front and back sequences occupy the correct facing panels', () => {
  const row = (numbers, wing, face, axis, increasing) => {
    const entries = numbers.map((number) => byNumber.get(number));
    entries.forEach((entry) => {
      assert.equal(entry.wing, wing);
      assert.equal(entry.face, face);
      assert.ok(close(entry.position[1], entries[0].position[1]));
    });
    for (let i = 1; i < entries.length; i += 1) {
      assert.ok((entries[i].position[axis] - entries[i - 1].position[axis]) * increasing > 0);
    }
  };
  row([21, 22, 23, 24, 25], 'd', 'front', 0, 1);
  row([30, 29, 28, 27, 26], 'd', 'back', 0, 1);
  row([5, 6, 7], 'p', 'front', 2, -1);
  row([10, 9, 8], 'p', 'back', 2, -1);
  row([70, 69, 68, 67, 66, 65, 64], 'f', 'front', 2, 1);
  row([57, 58, 59, 60, 61, 62, 63], 'f', 'back', 2, 1);
  row([102, 101, 100, 99, 98, 97, 96], 'f', 'front', 2, 1);
  row([89, 90, 91, 92, 93, 94, 95], 'f', 'back', 2, 1);
});

test('paired element faces share a physical tile and have opposite normals', () => {
  const tiles = new Map();
  layout.forEach((entry) => {
    assert.equal(entry.position.length, 3);
    assert.equal(entry.rotation.length, 3);
    [...entry.position, ...entry.rotation].forEach((value) => assert.ok(Number.isFinite(value)));
    const entries = tiles.get(entry.tile) || [];
    entries.push(entry);
    tiles.set(entry.tile, entries);
  });
  assert.equal(tiles.size, 52);
  const singletons = [];
  for (const entries of tiles.values()) {
    if (entries.length === 1) { singletons.push(entries[0].number); continue; }
    assert.equal(entries.length, 2);
    const [front, back] = entries;
    const normal = (entry) => [Math.sin(entry.rotation[1]), 0, Math.cos(entry.rotation[1])];
    const n1 = normal(front);
    const n2 = normal(back);
    assert.ok(close(n1.reduce((sum, component, i) => sum + component * n2[i], 0), -1));
    for (let axis = 0; axis < 3; axis += 1) {
      assert.ok(close(front.position[axis] - n1[axis] * 0.035, back.position[axis] - n2[axis] * 0.035));
    }
  }
  assert.deepEqual(singletons, [103]);
  assert.equal(provenance.geometry.blankTiles.length, 7);
  assert.equal(provenance.geometry.physicalTileCount, 59);
});
