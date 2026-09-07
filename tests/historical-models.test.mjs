import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../data/models/historical-models.js", import.meta.url),
  "utf8",
);
const { historicalLayouts, historicalModels } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);

test("historical layouts use unique, finite, non-overlapping slots and distinguish modern identities", () => {
  for (const model of historicalModels) {
    const slots = historicalLayouts[model.id];
    assert.equal(model.camera.orbit, false);
    assert.ok(model.sources.length >= 2);
    assert.equal(new Set(slots.map((slot) => slot.id)).size, slots.length);
    for (const [index, slot] of slots.entries()) {
      assert.equal(slot.position.length, 3);
      assert.ok(slot.position.every(Number.isFinite));
      assert.equal(slot.position[2], 0);
      assert.ok(slot.width > 0 && slot.height > 0);
      if (slot.kind === "prediction") assert.equal(slot.number, undefined);
      for (const number of slot.number
        ? [slot.number]
        : slot.elementNumbers || []) {
        assert.ok(Number.isInteger(number) && number >= 1 && number <= 118);
      }
      for (const other of slots.slice(index + 1)) {
        const separatedX =
          Math.abs(slot.position[0] - other.position[0]) >=
          (slot.width + other.width) / 2;
        const separatedY =
          Math.abs(slot.position[1] - other.position[1]) >=
          (slot.height + other.height) / 2;
        assert.ok(
          separatedX || separatedY,
          `${model.id}: ${slot.id} overlaps ${other.id}`,
        );
      }
    }
  }
});

test("Döbereiner includes the four documented representative triads, with no extra elements", () => {
  const slots = historicalLayouts.dobereiner;
  assert.equal(slots.length, 12);
  assert.deepEqual(
    slots.map((slot) => slot.number),
    [3, 11, 19, 20, 38, 56, 16, 34, 52, 17, 35, 53],
  );
  for (let row = 0; row < 4; row++) {
    const members = slots.slice(row * 3, row * 3 + 3);
    assert.equal(new Set(members.map((slot) => slot.position[1])).size, 1);
    assert.ok(members[0].position[0] < members[1].position[0]);
    assert.ok(members[1].position[0] < members[2].position[0]);
  }
});

test("Mendeleev preserves the 1869 sparse rows, weights, predictions and non-element entries", () => {
  const slots = historicalLayouts.mendeleev;
  assert.equal(slots.length, 66);
  assert.equal(slots.filter((slot) => slot.kind === "element").length, 60);
  assert.deepEqual(
    slots.filter((slot) => slot.kind === "prediction").map((slot) => slot.mass),
    ["180", "68", "70", "45"],
  );
  const at = (row, column) =>
    slots.find(
      (slot) => slot.sourceRow === row && slot.sourceColumn === column,
    );
  assert.deepEqual(at(6, 4).elementNumbers, [28, 27]);
  assert.equal(at(6, 4).symbol, "Ni=Co");
  assert.equal(at(6, 4).number, undefined);
  assert.equal(at(18, 4).symbol, "Di");
  assert.equal(at(18, 4).kind, "historical");
  assert.deepEqual(at(18, 4).elementNumbers, [59, 60]);
  assert.equal(at(18, 4).number, undefined);
  assert.equal(at(9, 5).symbol, "Ur");
  assert.equal(at(9, 5).number, 92);
  assert.equal(at(9, 5).mass, "116");
  assert.equal(at(13, 5).symbol, "J");
  assert.equal(at(13, 5).number, 53);
  assert.equal(at(7, 1).number, 1);
  assert.equal(at(7, 4).number, 29);
  assert.equal(
    at(4, 5).number,
    45,
    "The original Rh/Ru order must not be corrected silently",
  );
  assert.equal(at(5, 5).number, 44);
  assert.equal(
    at(1, 1),
    undefined,
    "Empty paper is not an implied placeholder",
  );
  assert.ok(
    slots.every((slot) => slot.historical && typeof slot.mass === "string"),
  );
});

test("Janet Version III preserves 120 source positions and the historical left steps", () => {
  const slots = historicalLayouts.janet;
  const bySourceNumber = new Map(
    slots.map((slot) => [slot.sourceNumber, slot]),
  );
  assert.equal(slots.length, 120);
  assert.deepEqual(
    [...bySourceNumber.keys()].sort((a, b) => a - b),
    Array.from({ length: 120 }, (_, index) => index + 1),
  );
  assert.deepEqual(
    Array.from(
      { length: 8 },
      (_, index) => slots.filter((slot) => slot.sourceRow === index + 1).length,
    ),
    [2, 2, 8, 8, 18, 18, 32, 32],
  );
  assert.deepEqual(
    Object.fromEntries(
      ["f", "d", "p", "s"].map((block) => [
        block,
        slots.filter((slot) => slot.block === block).length,
      ]),
    ),
    { f: 28, d: 40, p: 36, s: 16 },
  );
  assert.equal(
    bySourceNumber.get(2).position[0],
    bySourceNumber.get(4).position[0],
    "Helium is above beryllium",
  );
  assert.equal(bySourceNumber.get(57).block, "f");
  assert.equal(bySourceNumber.get(71).block, "d");
  assert.equal(bySourceNumber.get(89).block, "f");
  assert.equal(bySourceNumber.get(103).block, "d");
  assert.ok(
    bySourceNumber.get(70).position[0] < bySourceNumber.get(71).position[0],
  );
  assert.ok(slots.every((slot) => slot.historical && slot.mass === undefined));
});

test("Janet’s absent and disputed elements are not silently replaced by modern identities", () => {
  const slots = historicalLayouts.janet;
  const bySourceNumber = new Map(
    slots.map((slot) => [slot.sourceNumber, slot]),
  );
  const blank = [
    85,
    87,
    ...Array.from({ length: 28 }, (_, index) => index + 93),
  ];
  assert.deepEqual(
    slots
      .filter((slot) => slot.kind === "prediction")
      .map((slot) => slot.sourceNumber)
      .sort((a, b) => a - b),
    blank,
  );
  assert.equal(slots.filter((slot) => slot.kind === "element").length, 88);
  for (const [position, symbol] of [
    [43, "Ma"],
    [61, "Fr"],
  ]) {
    assert.equal(bySourceNumber.get(position).symbol, symbol);
    assert.equal(bySourceNumber.get(position).kind, "historical");
    assert.equal(bySourceNumber.get(position).number, undefined);
  }
  assert.equal(bySourceNumber.get(70).symbol, "Ny");
  assert.equal(bySourceNumber.get(70).number, 70);
  assert.equal(bySourceNumber.get(86).symbol, "Em");
  assert.equal(bySourceNumber.get(86).number, 86);
});
