import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const elements = JSON.parse(readFileSync(new URL('../public/elements.json', import.meta.url), 'utf8'));
const bySymbol = new Map(elements.map((element) => [element.symbol, element]));
const coordinates = (element) => [element.col18Xpos, element.col18Ypos];

test('the shared element dataset contains exactly 118 unique element identities', () => {
  assert.equal(elements.length, 118);
  assert.equal(new Set(elements.map((element) => element.number)).size, 118);
  assert.equal(bySymbol.size, 118);
  assert.equal(new Set(elements.map((element) => element.name.toLowerCase())).size, 118);
  assert.deepEqual(elements.map((element) => element.number), Array.from({ length: 118 }, (_, index) => index + 1), 'renderers index this dataset by atomic number minus one');
  assert.equal(elements[0].symbol, 'H');
  assert.equal(elements[117].symbol, 'Og');
});

test('every contemporary cell has one distinct valid position in the 18-column layout', () => {
  const occupied = new Set();
  for (const element of elements) {
    const [column, row] = coordinates(element);
    assert.ok(Number.isInteger(column) && column >= 1 && column <= 18, `${element.symbol}: column`);
    assert.ok([1, 2, 3, 4, 5, 6, 7, 9, 10].includes(row), `${element.symbol}: row`);
    const cell = `${column},${row}`;
    assert.ok(!occupied.has(cell), `${element.symbol} overlaps another cell at ${cell}`);
    occupied.add(cell);
  }
  assert.deepEqual(coordinates(bySymbol.get('H')), [1, 1]);
  assert.deepEqual(coordinates(bySymbol.get('He')), [18, 1]);
  assert.deepEqual(coordinates(bySymbol.get('Og')), [18, 7]);
});

test('La/Ac remain in group 3 and both detached rows retain their original membership', () => {
  assert.deepEqual(coordinates(bySymbol.get('La')), [3, 6]);
  assert.deepEqual(coordinates(bySymbol.get('Ac')), [3, 7]);
  const row = (number) => elements.filter((element) => element.col18Ypos === number).sort((a, b) => a.col18Xpos - b.col18Xpos);
  assert.deepEqual(row(9).map((element) => element.symbol), ['Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu']);
  assert.deepEqual(row(10).map((element) => element.symbol), ['Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr']);
  for (const rowNumber of [9, 10]) {
    assert.deepEqual(row(rowNumber).map((element) => element.col18Xpos), Array.from({ length: 14 }, (_, index) => index + 4));
  }
});

test('every neutral Bohr illustration conserves its element’s electron count', () => {
  for (const element of elements) {
    assert.ok(Array.isArray(element.shells) && element.shells.length >= 1 && element.shells.length <= 7, `${element.symbol}: populated shells`);
    element.shells.forEach((count, index) => {
      assert.ok(Number.isInteger(count) && count > 0, `${element.symbol}: shell ${index + 1} population`);
      assert.ok(count <= 2 * (index + 1) ** 2, `${element.symbol}: shell ${index + 1} exceeds capacity`);
    });
    assert.equal(element.shells.reduce((sum, count) => sum + count, 0), element.number, `${element.symbol}: electrons must equal atomic number`);
  }
});

test('showcase elements and a seven-shell element have the expected populations', () => {
  assert.deepEqual(bySymbol.get('H').shells, [1]);
  assert.deepEqual(bySymbol.get('C').shells, [2, 4]);
  assert.deepEqual(bySymbol.get('Au').shells, [2, 8, 18, 32, 18, 1]);
  assert.deepEqual(bySymbol.get('Og').shells, [2, 8, 18, 32, 32, 18, 8]);
});
