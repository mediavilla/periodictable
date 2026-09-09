import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  DESIGN_IDS,
  TIMELINE_IDS,
  designForRoute,
  slotNumbers,
  slotLabel,
} from "../data/model-slots.mjs";

const elements = JSON.parse(
  readFileSync(new URL("../public/elements.json", import.meta.url), "utf8"),
);

test("navigation collections preserve the approved independent order and shared models", () => {
  assert.deepEqual(DESIGN_IDS, [
    "18",
    "32",
    "racetrack",
    "giguere",
    "janet",
    "stowe",
    "benfey",
    "chemical-galaxy",
  ]);
  assert.deepEqual(TIMELINE_IDS, [
    "dobereiner",
    "telluric",
    "mendeleev",
    "janet",
    "racetrack",
    "giguere",
    "stowe",
    "18",
  ]);
  assert.equal(designForRoute("janet", "/timeline"), "janet");
  assert.equal(designForRoute("32", "/timeline", "mendeleev"), "mendeleev");
  assert.equal(designForRoute("telluric", "/"), "18");
  assert.equal(designForRoute("bogus", "/"), "18");
});

test("historical slots can map to zero, one or multiple modern identities", () => {
  assert.deepEqual(slotNumbers({ kind: "prediction", sourceNumber: 120 }), []);
  assert.deepEqual(slotNumbers({ number: 70, symbol: "Ny" }), [70]);
  assert.deepEqual(
    slotNumbers({ symbol: "Ni=Co", elementNumbers: [28, 27] }),
    [28, 27],
  );
  assert.deepEqual(slotNumbers({ elementNumbers: [0, 6, 6, 119, "8"] }), [6]);
});

test("original weight labels cannot be mistaken for current atomic weights or invented Bohr identities", () => {
  const label = slotLabel(
    {
      symbol: "Ni=Co",
      name: "Nickel and cobalt",
      mass: "59",
      elementNumbers: [28, 27],
    },
    elements,
  );
  assert.equal(label.symbol, "Ni=Co");
  assert.equal(label.number, "");
  assert.equal(label.mass, "59 · source");
  assert.equal(label.configuration, "Historical notation");
  const blank = slotLabel(
    { historical: true, sourceNumber: 120, symbol: "?" },
    elements,
  );
  assert.equal(blank.number, "120");
  assert.equal(blank.mass, "");
});

test("modern labels still contain all five levels of current element information", () => {
  const carbon = slotLabel({ number: 6 }, elements);
  assert.equal(carbon.symbol, "C");
  assert.equal(carbon.name, "Carbon");
  assert.equal(carbon.number, "6");
  assert.equal(carbon.configuration, elements[5].econfig_shorthand);
});

test("32-column coordinates include all118 unique positions and the intended Lu/Lr alignment", () => {
  assert.equal(
    new Set(elements.map((e) => `${e.col32Xpos},${e.col32Ypos}`)).size,
    118,
  );
  for (const e of elements) {
    assert.ok(e.col32Xpos >= 1 && e.col32Xpos <= 32);
    assert.ok(e.col32Ypos >= 1 && e.col32Ypos <= 7);
  }
  assert.deepEqual(
    [21, 39, 71, 103].map((n) => elements[n - 1].col32Xpos),
    [17, 17, 17, 17],
  );
  assert.deepEqual(
    [57, 89].map((n) => elements[n - 1].col32Xpos),
    [3, 3],
  );
});
