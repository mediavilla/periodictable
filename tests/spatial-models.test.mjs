import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Euler, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";

const dataSource = await readFile(
  new URL("../data/models/spatial-models.js", import.meta.url),
  "utf8",
);
const dataURL = `data:text/javascript;base64,${Buffer.from(dataSource).toString("base64")}`;
const {
  spatialLayouts,
  spatialModels,
  telluricPosition,
  TELLURIC_PITCH,
  TELLURIC_RADIUS,
} = await import(dataURL);
const geometrySource = (
  await readFile(
    new URL("../components/explorer/spatialModelGeometry.js", import.meta.url),
    "utf8",
  )
)
  .replace(
    /from "three"/,
    `from ${JSON.stringify(import.meta.resolve("three"))}`,
  )
  .replace(
    /from "\.\.\/\.\.\/data\/models\/spatial-models"/,
    `from ${JSON.stringify(dataURL)}`,
  );
const { createSpatialModelCells } = await import(
  `data:text/javascript;base64,${Buffer.from(geometrySource).toString("base64")}`
);

test("Stowe retains all 107 identified poster elements and 13 unassigned sites", () => {
  const slots = spatialLayouts.stowe;
  assert.equal(slots.length, 120);
  assert.equal(new Set(slots.map((s) => s.id)).size, 120);
  assert.deepEqual(
    slots
      .filter((s) => s.number)
      .map((s) => s.number)
      .sort((a, b) => a - b),
    Array.from({ length: 107 }, (_, i) => i + 1),
  );
  const unknown = slots.filter((s) => s.kind === "prediction");
  assert.equal(unknown.length, 13);
  assert.ok(
    unknown.every(
      (s) => s.symbol === "?" && !s.number && !s.elementNumbers.length,
    ),
  );
  assert.deepEqual(
    unknown.reduce((counts, slot) => {
      const key = `${slot.quantum.n}-${slot.quantum.l}`;
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {}),
    { "6-2": 5, "7-1": 6, "8-0": 2 },
  );
  assert.deepEqual(
    [104, 105, 106, 107].map((n) => slots.find((s) => s.number === n).symbol),
    ["Unq", "Unp", "Unh", "Uns"],
  );
});

test("Stowe transcribes the poster quantum coordinates rather than modern configurations", () => {
  const quantum = (number) =>
    spatialLayouts.stowe.find((s) => s.number === number).quantum;
  assert.deepEqual(quantum(1), { n: 1, l: 0, m: 0, spin: -0.5 });
  assert.deepEqual(quantum(7), { n: 2, l: 1, m: 1, spin: -0.5 });
  assert.deepEqual(quantum(8), { n: 2, l: 1, m: 1, spin: 0.5 });
  assert.deepEqual(quantum(26), { n: 3, l: 2, m: 2, spin: 0.5 });
  assert.deepEqual(quantum(57), { n: 5, l: 2, m: -2, spin: -0.5 });
  assert.deepEqual(quantum(64), { n: 4, l: 3, m: 3, spin: -0.5 });
  assert.deepEqual(quantum(89), { n: 6, l: 2, m: -2, spin: -0.5 });
  assert.deepEqual(quantum(103), { n: 5, l: 3, m: -3, spin: 0.5 });
  for (const slot of spatialLayouts.stowe) {
    const { n, l, m, spin } = slot.quantum;
    assert.ok(n >= 1 && n <= 8 && l < n && Math.abs(m) <= l);
    assert.equal(Math.sign(slot.position[0]), Math.sign(spin));
    assert.equal(Math.sign(slot.position[2]), Math.sign(-m));
  }
  assert.equal(
    new Set(spatialLayouts.stowe.map((s) => s.position.join(","))).size,
    120,
  );
});

test("Telluric helix uses historical weight with exactly 16 units per revolution", () => {
  const entries = spatialLayouts.telluric;
  assert.equal(entries.length, 123);
  assert.equal(new Set(entries.map((s) => s.id)).size, 123);
  assert.equal(
    spatialModels.find((m) => m.id === "telluric").membership.length,
    59,
  );
  assert.equal(entries.find((s) => s.symbol === "Fe").weight, 56);
  assert.equal(entries.find((s) => s.symbol === "Ni").weight, 59);
  assert.equal(entries.find((s) => s.symbol === "Co").weight, 60);
  assert.equal(entries.find((s) => s.symbol === "Au").weight, 200);
  for (const entry of entries) {
    assert.deepEqual(entry.position, telluricPosition(entry.weight));
    assert.ok(
      Math.abs(
        Math.hypot(entry.position[0], entry.position[2]) - TELLURIC_RADIUS,
      ) < 1e-9,
    );
    const next = telluricPosition(entry.weight + 16);
    assert.ok(Math.abs(next[0] - entry.position[0]) < 1e-9);
    assert.ok(Math.abs(next[2] - entry.position[2]) < 1e-9);
    assert.ok(Math.abs(next[1] - entry.position[1] + TELLURIC_PITCH) < 1e-9);
  }
});

test("Telluric repeated positions and misleading historical symbols keep separate identities", () => {
  const entries = spatialLayouts.telluric;
  const at = (weight) => entries.find((s) => s.weight === weight);
  assert.equal(at(58).symbol, "Er");
  assert.deepEqual(at(58).elementNumbers, []);
  assert.equal(at(86).symbol, "Pr");
  assert.deepEqual(at(86).elementNumbers, []);
  assert.equal(at(199).symbol, "Pr");
  assert.deepEqual(at(199).elementNumbers, [78]);
  assert.deepEqual(at(79).elementNumbers, [35]);
  assert.deepEqual(at(114).elementNumbers, []);
  assert.deepEqual(at(99).elementNumbers, []);
  assert.deepEqual(at(125).elementNumbers, []);
  assert.deepEqual(at(76).elementNumbers, [33, 34]);
  assert.equal(entries.filter((s) => s.elementNumbers.includes(22)).length, 4);
  assert.equal(entries.filter((s) => !s.elementNumbers.length).length, 17);
});

test("Spatial markers share bounded resources and expose outward selectable faces", () => {
  const material = new MeshBasicMaterial();
  const ray = new Raycaster();
  for (const id of ["telluric", "stowe"]) {
    const cells = createSpatialModelCells(id);
    assert.strictEqual(cells, createSpatialModelCells(id));
    assert.equal(new Set(cells.map((s) => s.geometry)).size, 1);
    assert.equal(new Set(cells.map((s) => s.outline)).size, 1);
    for (const cell of cells) {
      const mesh = new Mesh(cell.pickingGeometry, material);
      mesh.position.fromArray(cell.position);
      mesh.rotation.fromArray(cell.rotation);
      mesh.updateMatrixWorld();
      const normal = new Vector3(0, 0, 1).applyEuler(
        new Euler(...cell.rotation),
      );
      const center = new Vector3(...cell.position);
      if (id === "telluric")
        assert.ok(normal.dot(new Vector3(center.x, 0, center.z)) > 0);
      else assert.ok(normal.y > 0.999);
      ray.set(
        center.clone().addScaledVector(normal, 2),
        normal.clone().negate(),
      );
      assert.ok(
        ray.intersectObject(mesh, false).length > 0,
        `${cell.id} is selectable from its labeled face`,
      );
      ray.set(center.clone().addScaledVector(normal, -2), normal);
      assert.equal(
        ray.intersectObject(mesh, false).length,
        0,
        `${cell.id} cannot be selected through its unlabeled reverse face`,
      );
      assert.ok(
        cell.labelWidth <= cell.width && cell.labelHeight <= cell.height,
      );
    }
  }
  material.dispose();
});
