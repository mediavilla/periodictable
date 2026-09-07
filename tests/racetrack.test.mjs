import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

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
      const point = new Vector3(x * cell.labelWidth, y * cell.labelHeight, 0).applyAxisAngle(new Vector3(0, 0, 1), cell.labelRotation);
      const origin = new Vector3(cell.position[0] + point.x, cell.position[1] + point.y, 2);
      raycaster.set(origin, new Vector3(0, 0, -1));
      const hits = raycaster.intersectObjects(meshes, false);
      assert.equal(hits[0]?.object.userData.number, cell.number, `Cell ${cell.number} label point ${x},${y} hits its own front face`);
    }
    const bounds = cell.geometry.boundingBox;
    assert.ok(bounds.min.z > -0.0001 && bounds.max.z < 0.05, `Cell ${cell.number} remains shallow`);
  }
});


test('Iron, Xenon and Lithium outlines contain only source boundary segments', () => {
  const loader = new SVGLoader();
  const key = (x, y) => `${x.toFixed(3)},${y.toFixed(3)}`;
  for (const number of [3, 26, 54]) {
    const region = layout.regions[number - 1];
    const cell = cells[number - 1];
    const path = loader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${region.d}" /></svg>`).paths[0];
    const expected = [];
    for (const shape of SVGLoader.createShapes(path)) {
      const points = shape.extractPoints(32);
      for (const ring of [points.shape, ...points.holes]) {
        for (let i = 0; i < ring.length; i++) {
          const a = ring[i], b = ring[(i + 1) % ring.length];
          expected.push([a.x, a.y, b.x, b.y]);
        }
      }
    }
    const vertices = cell.outline.attributes.position;
    for (let i = 0; i < vertices.count; i += 2) {
      const a = key(vertices.getX(i) * 100 + region.label.x, region.label.y - vertices.getY(i) * 100);
      const b = key(vertices.getX(i + 1) * 100 + region.label.x, region.label.y - vertices.getY(i + 1) * 100);
      const actual = [vertices.getX(i) * 100 + region.label.x, region.label.y - vertices.getY(i) * 100, vertices.getX(i + 1) * 100 + region.label.x, region.label.y - vertices.getY(i + 1) * 100];
      assert.ok(expected.some(edge => edge.every((value, index) => Math.abs(value - actual[index]) < 0.001)), `Element ${number} has an extra line from ${a} to ${b}`);
    }
  }
});

test('Racetrack labels follow the track while straight panels remain level', () => {
  const degrees = number => cells[number - 1].labelRotation * 180 / Math.PI;
  assert.ok(degrees(3) > 30 && degrees(3) < 50, 'Lithium follows the inner bend');
  assert.ok(degrees(26) < -30 && degrees(26) > -50, 'Iron follows the outer bend');
  assert.ok(Math.abs(degrees(54) + 90) < 3, 'Xenon reads along the left vertical');
  for (const number of [21, 23, 24, 30, 31, 32, 33]) assert.ok(Math.abs(degrees(number)) < 0.001);
  for (const number of [2, 10, 18, 36, 54, 86])
    assert.ok(Math.abs(layout.regions[number - 1].label.y - 617) < 5, 'Noble gases are centred across their arcs');
});
