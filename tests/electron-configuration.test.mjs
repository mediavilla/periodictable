import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  configurationGroups,
  configurationPageStarts,
  configurationSuperscripts,
  createConfigurationModel,
  parseConfiguration,
} from "../data/electron-configuration.mjs";
import { ORBITAL_MODELS } from "../components/explorer/orbitals/orbitalMath.mjs";

const elements = JSON.parse(
  await readFile(new URL("../public/elements.json", import.meta.url)),
);
const bySymbol = new Map(elements.map((element) => [element.symbol, element]));

test("configuration parsing preserves occupations including two-digit superscripts", () => {
  assert.equal(
    configurationSuperscripts("[Rn] 5f14 6d10 7s2 7p6"),
    "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶",
  );
  assert.deepEqual(
    parseConfiguration("1s² 2s² 2p⁶").map((entry) => entry.electrons),
    [2, 2, 6],
  );
});

test("every element’s configuration conserves electrons and matches shell totals", () => {
  for (const element of elements) {
    const model = createConfigurationModel(element);
    const total = model.entries.reduce(
      (sum, entry) => sum + entry.electrons,
      0,
    );
    assert.equal(
      total,
      element.number,
      `${element.symbol}: occupation must equal atomic number`,
    );
    assert.deepEqual(
      configurationGroups(model, true).map((group) => group.count),
      element.shells,
      `${element.symbol}: expanded groups must match shells`,
    );
    assert.equal(
      new Set(model.entries.map((entry) => entry.id)).size,
      model.entries.length,
      `${element.symbol}: subshell ids must be unique`,
    );
    for (const entry of model.entries) {
      assert.ok(
        ORBITAL_MODELS[entry.id],
        `${element.symbol}: unsupported subshell ${entry.id}`,
      );
      assert.ok(
        entry.electrons <= 2 * (2 * entry.l + 1),
        `${element.symbol}: ${entry.id}${entry.electrons} exceeds capacity`,
      );
    }
    if (model.core) {
      const coreElement = bySymbol.get(model.core.symbol);
      assert.ok(coreElement, `${element.symbol}: unknown core [${model.core.symbol}]`);
      assert.equal(
        model.core.electrons,
        coreElement.number,
        `${element.symbol}: [${model.core.symbol}] core electron total`,
      );
    }
    const collapsed = configurationGroups(model);
    assert.equal(
      collapsed.reduce((sum, group) => sum + group.count, 0),
      element.number,
      `${element.symbol}: collapsed groups must conserve electrons`,
    );
  }
});

test("H/C/Og collapsed groups and expanded shell totals remain aligned", () => {
  const expected = { 1: [1], 6: [2, 4], 118: [86, 14, 10, 8] };
  for (const number of [1, 6, 118]) {
    const element = elements[number - 1];
    const model = createConfigurationModel(element);
    const collapsed = configurationGroups(model);
    assert.deepEqual(
      collapsed.map((group) => group.count),
      expected[number],
    );
  }
  const og = createConfigurationModel(elements[117]);
  assert.equal(og.entries.length, 19);
  assert.equal(og.core.symbol, "Rn");
  assert.deepEqual(og.core.shells, [0, 1, 2, 3, 4, 5]);
  assert.equal(og.core.entries.length, 15);
});

test("Zinc and Francium configurations parse cleanly after data repairs", () => {
  const zinc = createConfigurationModel(bySymbol.get("Zn"));
  assert.equal(
    zinc.entries.find((entry) => entry.id === "3d")?.electrons,
    10,
  );
  assert.equal(
    zinc.entries.reduce((sum, entry) => sum + entry.electrons, 0),
    30,
  );
  const francium = createConfigurationModel(bySymbol.get("Fr"));
  assert.ok(francium.entries.some((entry) => entry.id === "4s"));
  assert.ok(francium.entries.some((entry) => entry.id === "4p"));
  assert.equal(
    francium.entries.reduce((sum, entry) => sum + entry.electrons, 0),
    87,
  );
  assert.equal(francium.core?.symbol, "Rn");
  assert.equal(francium.core?.electrons, 86);
});

test("strip pagination aligns to groups and covers wide groups without duplicate final pages", () => {
  assert.deepEqual(
    configurationPageStarts([0, 100, 220, 500], 300, 750),
    [0, 220, 450],
  );
  assert.deepEqual(
    configurationPageStarts([0, 800], 300, 950),
    [0, 300, 600, 650],
  );
  assert.deepEqual(configurationPageStarts([0, 100], 600, 200), [0]);
});
