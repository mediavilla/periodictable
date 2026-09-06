import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';

const layout = JSON.parse(await readFile(new URL('../data/racetrack-layout.json', import.meta.url), 'utf8'));
const legacy = await readFile(new URL('../components/TableRaceTrack.js', import.meta.url), 'utf8');
globalThis.DOMParser = new JSDOM('').window.DOMParser;

// Next.js supports JSON imports without attributes. Resolve those imports for
// Node's test runner without changing the browser implementation under test.
const source = (await readFile(new URL('../components/explorer/racetrackGeometry.js', import.meta.url), 'utf8'))
  .replace(/\bfrom\s+(["'])(three(?:\/[^"']*)?)\1/g, (_, quote, specifier) =>
    `from ${JSON.stringify(import.meta.resolve(specifier))}`)
  .replace(/\bimport\s+([\w$]+)\s+from\s+(["'])\.\.\/\.\.\/data\/racetrack-layout\.json\2\s*;?/, (_, binding) =>
    `const ${binding} = ${JSON.stringify(layout)};`);
const { createRacetrackCells } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const cells = createRacetrackCells();

test('racetrack preserves all 104 original SVG regions exactly', () => {
  assert.deepEqual(layout.source.viewBox, [0, 0, 2084, 1250]);
  const original = [...legacy.matchAll(/<path id="(\d+)" d="([^"]+)"/g)]
    .map((match) => ({ number: Number(match[1]), d: match[2] })).sort((a, b) => a.number - b.number);
  assert.deepEqual(layout.regions.map(({ number, d }) => ({ number, d })), original);
  assert.deepEqual(cells.map(({ number }) => number), Array.from({ length: 104 }, (_, index) => index + 1));
});

test('racetrack shares geometry and puts readable labels inside selectable faces', () => {
  assert.strictEqual(createRacetrackCells(), cells);
  const material = new MeshBasicMaterial();
  const meshes = cells.map((cell) => {
    const mesh = new Mesh(cell.geometry, material);
    mesh.position.fromArray(cell.position);
    mesh.userData.number = cell.number;
    mesh.updateMatrixWorld();
    return mesh;
  });
  const raycaster = new Raycaster();
  for (const cell of cells) {
    assert.ok(cell.width > 0 && cell.height > 0, `Cell ${cell.number} has nonzero dimensions`);
    assert.ok(cell.labelWidth > 0.15 && cell.labelHeight > 0.15, `Cell ${cell.number} has usable label space`);
    assert.ok(cell.geometry.attributes.position.count >= 6, `Cell ${cell.number} has triangles`);
    for (const [x, y] of [[0, 0], [-0.49, -0.49], [-0.49, 0.49], [0.49, -0.49], [0.49, 0.49]]) {
      const origin = new Vector3(cell.position[0] + x * cell.labelWidth, cell.position[1] + y * cell.labelHeight, 2);
      raycaster.set(origin, new Vector3(0, 0, -1));
      const hits = raycaster.intersectObjects(meshes, false);
      assert.equal(hits[0]?.object.userData.number, cell.number, `Cell ${cell.number} label point ${x},${y} hits its own front face`);
    }
    const bounds = cell.geometry.boundingBox;
    assert.ok(bounds.min.z > -0.0001 && bounds.max.z < 0.05, `Cell ${cell.number} remains shallow`);
  }
});
