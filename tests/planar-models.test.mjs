import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";

const sourceURL = new URL("../data/models/planar-models.js", import.meta.url);
let metadataSource = await readFile(sourceURL, "utf8");
for (const [binding, path] of [
  ["benfey", "./benfey-layout.json"],
  ["galaxy", "./chemical-galaxy-layout.json"],
  ["elements", "../../public/elements.json"],
]) {
  const data = await readFile(new URL(path, sourceURL), "utf8");
  metadataSource = metadataSource.replace(
    `import ${binding} from "${path}";`,
    `const ${binding} = ${data};`,
  );
}
const metadataURL = `data:text/javascript;base64,${Buffer.from(metadataSource).toString("base64")}`;
const { planarModels, planarLayouts, planarSources } = await import(
  metadataURL
);
const geometrySource = (
  await readFile(
    new URL("../components/explorer/planarModelGeometry.js", import.meta.url),
    "utf8",
  )
)
  .replace(
    'from "three"',
    `from ${JSON.stringify(import.meta.resolve("three"))}`,
  )
  .replace(
    'from "../../data/models/planar-models"',
    `from ${JSON.stringify(metadataURL)}`,
  );
const { createPlanarModelCells } = await import(
  `data:text/javascript;base64,${Buffer.from(geometrySource).toString("base64")}`
);

// Counts distinguish what these editions identified from their future positions.
test("Benfey retains the source's 105 named entries and 39 future positions", () => {
  const slots = planarLayouts.benfey;
  assert.equal(slots.length, 144);
  assert.deepEqual(
    slots.filter((s) => s.number).map((s) => s.number),
    Array.from({ length: 105 }, (_, i) => i + 1),
  );
  assert.deepEqual(
    slots.filter((s) => s.kind === "prediction").map((s) => s.sourceNumber),
    Array.from({ length: 39 }, (_, i) => i + 106),
  );
  assert.equal(slots[103].sourceSymbol, "Ku");
  assert.equal(slots[104].sourceSymbol, "Ha");
  assert.ok(
    slots[20].sourceCenter[0] > slots[19].sourceCenter[0],
    "Sc continues into the transition-metal projection",
  );
  assert.ok(
    slots[56].sourceCenter[1] < slots[38].sourceCenter[1],
    "La is in the upper inner-transition projection",
  );
  assert.equal(new Set(slots.map((s) => s.id)).size, slots.length);
  assert.equal(
    planarModels.find((m) => m.id === "benfey").camera.minDistance,
    0.45,
  );
});

test("Galaxy preserves the historical unknowns, conceptual centre and measured exceptional placements", () => {
  const slots = planarLayouts["chemical-galaxy"];
  assert.equal(slots.length, 119);
  assert.equal(slots.filter((s) => s.number).length, 113);
  assert.deepEqual(
    slots.filter((s) => s.kind === "prediction").map((s) => s.sourceNumber),
    [113, 115, 116, 117, 118],
  );
  assert.equal(slots.filter((s) => s.kind === "annotation").length, 1);
  assert.equal(slots.at(-1).number, null);
  assert.equal(slots[111].sourceSymbol, "Uub");
  assert.equal(slots[113].sourceSymbol, "Uuq");
  assert.deepEqual(slots[0].sourceCenter, [423, 274]);
  assert.deepEqual(slots[5].sourceCenter, [433, 293]);
  assert.deepEqual(slots[70].sourceCenter, [96, 395]);
  for (const model of planarModels) {
    assert.equal(model.camera.orbit, false);
    assert.deepEqual(
      model.membership,
      planarLayouts[model.id].filter((s) => s.number).map((s) => s.number),
    );
  }
});

test("Planar geometry shares resources and every label fits its own front hit target", () => {
  const raycaster = new Raycaster();
  const material = new MeshBasicMaterial();
  for (const id of Object.keys(planarSources)) {
    const cells = createPlanarModelCells(id);
    assert.strictEqual(createPlanarModelCells(id), cells);
    if (id === "chemical-galaxy") {
      const radii = new Set(planarSources[id].slots.map((s) => s.radius));
      assert.equal(
        new Set(cells.map((cell) => cell.geometry)).size,
        radii.size,
      );
      assert.equal(new Set(cells.map((cell) => cell.outline)).size, radii.size);
      assert.strictEqual(cells[20].geometry, cells[21].geometry);
    }
    const meshes = cells.map((cell) => {
      const mesh = new Mesh(cell.geometry, material);
      mesh.position.fromArray(cell.position);
      mesh.userData.slot = cell.id;
      mesh.updateMatrixWorld();
      return mesh;
    });
    for (const cell of cells) {
      assert.ok(
        cell.labelWidth * planarSources[id].source.scale > 1.8 &&
          cell.labelHeight * planarSources[id].source.scale > 1.8,
        `${cell.id} has room for its label: ${cell.labelWidth} × ${cell.labelHeight}`,
      );
      assert.ok(
        cell.geometry.boundingBox.min.z >= -0.0001 &&
          cell.geometry.boundingBox.max.z < 0.05,
      );
      for (const [x, y] of [
        [0, 0],
        [-0.49, -0.49],
        [-0.49, 0.49],
        [0.49, -0.49],
        [0.49, 0.49],
      ]) {
        raycaster.set(
          new Vector3(
            cell.position[0] + x * cell.labelWidth,
            cell.position[1] + y * cell.labelHeight,
            2,
          ),
          new Vector3(0, 0, -1),
        );
        const hit = raycaster.intersectObjects(meshes, false)[0];
        assert.equal(
          hit?.object.userData.slot,
          cell.id,
          `${cell.id} label point ${x},${y} selects its own cell`,
        );
      }
    }
  }
  material.dispose();
});
