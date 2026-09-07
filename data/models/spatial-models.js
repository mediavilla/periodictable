// Transcriptions and scope notes: docs/sources-spatial-models.md.
// A slot is a position in a historical chart, not necessarily one modern atom.
export const TELLURIC_RADIUS = 4.8;
export const TELLURIC_PITCH = 1.85;
export const TELLURIC_MAX_WEIGHT = 256;
export const STOWE_SPACING = 1.12;
export const STOWE_LAYER_SPACING = 1.85;
// The original projection spreads the larger rings farther apart. Preserve
// that display spacing rather than letting expanded layers obscure one another.
export const STOWE_LAYER_HEIGHTS = [
  6.55, 5.55, 3.8, 1.4, -1.4, -3.8, -5.55, -6.55,
].map((height) => height * STOWE_LAYER_SPACING);

const primary = (weight, symbol, name, number, note = "") => ({
  weight,
  symbol,
  name,
  number,
  kind: "element",
  note,
});
const other = (weight, symbol, name, kind, note = "") => ({
  weight,
  symbol,
  name,
  kind,
  note,
});
const comparison = (weight, symbol, name, number, note = "") => ({
  weight,
  symbol,
  name,
  number,
  kind: "comparison",
  note,
});

// Characteristic numbers are copied from the 7 April 1862 plate. They must
// never be substituted with present atomic masses or atomic numbers.
export const telluricEntries = [
  primary(1, "H", "Hydrogen", 1),
  other(2, "T", "Radical of water", "radical"),
  primary(7, "Li", "Lithium", 3),
  other(
    8,
    "A",
    "Historical radical A",
    "radical",
    "The source lists A at 8 without a chemical name; no modern identification is inferred.",
  ),
  primary(
    9,
    "Gl",
    "Glucinum",
    4,
    "Glucinum is the historical name for beryllium.",
  ),
  primary(11, "Bo", "Boron", 5),
  primary(12, "C", "Carbon", 6),
  comparison(13, "Li′", "Lithium — comparison position", 3),
  primary(14, "Az", "Azote", 7, "Azote is the source's name for nitrogen."),
  primary(16, "O", "Oxygen", 8),
  comparison(17, "Bo′", "Boron — alternative weight", 5),
  comparison(18, "Cl′", "Chlorine — comparison position", 17),
  primary(19, "Fl", "Fluorine", 9),
  comparison(20, "Ca′", "Calcium — comparison position", 20),
  comparison(22, "Bo″", "Boron — comparison position", 5),
  primary(23, "Na", "Sodium", 11),
  primary(24, "Mg", "Magnesium", 12),
  other(25, "Ab", "Radical of albite", "radical"),
  comparison(26, "Mg′", "Magnesium — comparison position", 12),
  primary(27, "Al", "Aluminium", 13),
  comparison(28, "Si′", "Silicon — alternative weight", 14),
  comparison(29, "Bo‴", "Boron — alternative weight", 5),
  other(
    30,
    "Me",
    "Methyl",
    "radical",
    "Methyl is a compound radical, not a chemical element.",
  ),
  primary(31, "Ph", "Phosphorus", 15),
  primary(32, "S", "Sulfur", 16),
  other(33, "Ot", "Radical of orthoclase", "radical"),
  comparison(34, "Zn′", "Zinc — comparison position", 30),
  primary(35, "Cl", "Chlorine", 17),
  {
    ...comparison(36, "Si″ / Am", "Silicon / ammonium", 14),
    kind: "composite",
    note: "Two labels share characteristic number 36 in the plate: an alternative silicon position and ammonium. Am is not americium.",
  },
  comparison(37, "Ti‴", "Titanium — alternative weight", 22),
  primary(39, "K", "Potassium", 19),
  primary(40, "Ca", "Calcium", 20),
  primary(43, "Si", "Silicon", 14),
  comparison(44, "C′", "Carbon — alternative weight", 6),
  comparison(46, "Na′", "Sodium — comparison position", 11),
  primary(48, "Ti", "Titanium", 22),
  comparison(51, "Ti′", "Titanium — alternative weight", 22),
  other(
    52,
    "Cy",
    "Cyanogen",
    "compound",
    "Cyanogen is a compound included in the historical scheme.",
  ),
  primary(53, "Cr", "Chromium", 24),
  comparison(54, "Al′", "Aluminium — alternative weight", 13),
  primary(55, "Mn", "Manganese", 25),
  primary(56, "Fe", "Iron", 26),
  comparison(57, "Ti″", "Titanium — comparison position", 22),
  other(
    58,
    "Er",
    "Ethyl",
    "radical",
    "Er denotes the ethyl radical on this plate, not erbium.",
  ),
  primary(59, "Ni", "Nickel", 28),
  primary(60, "Co", "Cobalt", 27),
  primary(63, "Cu", "Copper", 29),
  {
    ...primary(64, "Yt / MA", "Yttrium / methylammonium", 39),
    kind: "composite",
    note: "Yttrium and the methylammonium radical share characteristic number 64.",
  },
  primary(65, "Zn", "Zinc", 30),
  primary(67, "Zr", "Zirconium", 40),
  comparison(68, "Ca″", "Calcium — comparison position", 20),
  comparison(71, "La′", "Lanthanum — alternative weight", 57),
  comparison(72, "Ce′", "Cerium — alternative weight", 58),
  primary(75, "As", "Arsenic", 33),
  {
    ...comparison(76, "As′ / Se′", "Arsenic / selenium — comparison positions"),
    elementNumbers: [33, 34],
    kind: "composite",
  },
  comparison(78, "K′", "Potassium — comparison position", 19),
  primary(79, "Br", "Bromine", 35),
  primary(80, "Se", "Selenium", 34),
  other(
    83,
    "Eb",
    "Erbium? — uncertain source position",
    "historical",
    "The source questions the rare-earth identifications in this region. No modern identity is assigned to this uncertain comparison mark.",
  ),
  other(
    84,
    "Em",
    "Radical of emetic",
    "radical",
    "The plate also questions the erbium/terbium assignments in this region. Em is retained as a historical radical, without assigning a modern element.",
  ),
  other(
    85,
    "Tb",
    "Terbium? — uncertain source position",
    "historical",
    "The source questions the rare-earth identifications in this region. No modern identity is assigned to this uncertain comparison mark.",
  ),
  other(
    86,
    "Pr",
    "Propyl",
    "radical",
    "Pr denotes propyl here, not praseodymium.",
  ),
  primary(87, "Rb", "Rubidium", 37),
  primary(88, "Sr", "Strontium", 38),
  comparison(89, "Zr′", "Zirconium — comparison position", 40),
  primary(91, "La", "Lanthanum", 57),
  {
    ...primary(92, "Ce / EA", "Cerium / ethylammonium", 58),
    kind: "composite",
    note: "Cerium and the ethylammonium radical share characteristic number 92.",
  },
  comparison(93, "Mo′", "Molybdenum — comparison position", 42),
  primary(96, "Mo", "Molybdenum", 42),
  other(
    99,
    "Di",
    "Didymium",
    "historical",
    "Didymium was then treated as an element. It was later separated into praseodymium and neodymium; this slot is not assigned either modern atomic number.",
  ),
  comparison(100, "Hg′", "Mercury — alternative weight", 80),
  comparison(101, "Nb", "Niobium", 41),
  primary(103, "Ru", "Ruthenium", 44),
  primary(104, "Rh", "Rhodium", 45),
  primary(107, "Pd", "Palladium", 46),
  primary(108, "Ag", "Silver", 47),
  comparison(110, "Mn′", "Manganese — comparison position", 25),
  primary(111, "Cd", "Cadmium", 48),
  comparison(112, "Te′", "Tellurium — comparison position", 52),
  comparison(113, "Ag′", "Silver — comparison position", 47),
  other(
    114,
    "Br",
    "Butyl",
    "radical",
    "Br denotes butyl at this weight, distinct from bromine at 79.",
  ),
  primary(115, "Sn", "Tin", 50),
  comparison(117, "Rh′", "Rhodium — comparison position", 45),
  primary(119, "Th", "Thorium", 90),
  {
    ...primary(120, "Ur / PA", "Uranium / propylammonium", 92),
    kind: "composite",
    note: "Uranium and the propylammonium radical share characteristic number 120.",
  },
  primary(121, "Sb", "Antimony", 51),
  comparison(123, "Sb′", "Antimony — comparison position", 51),
  comparison(124, "Cs", "Caesium — alternative weight", 55),
  other(
    125,
    "Il",
    "Ilmenium",
    "historical",
    "A supposed element, subsequently shown not to be a distinct chemical element. No modern atomic number is assigned.",
  ),
  primary(127, "Io", "Iodine", 53),
  primary(128, "Te", "Tellurium", 52),
  comparison(129, "Sb″", "Antimony — alternative weight", 51),
  comparison(135, "?Cs", "Caesium — uncertain comparison position", 55),
  primary(136, "Ba", "Barium", 56),
  primary(137, "Vd", "Vanadium", 23),
  comparison(140, "Vd′", "Vanadium — comparison position", 23),
  other(148, "BA", "Butylammonium", "radical"),
  comparison(150, "As″", "Arsenic — comparison position", 33),
  other(
    171,
    "Alloy",
    "Fusible alloy",
    "mixture",
    "The left-hand catalogue lists an alloy at this characteristic number; it is not an element.",
  ),
  other(172, "Amalgam", "Silver amalgam", "mixture"),
  comparison(178, "Th′", "Thorium — comparison position", 90),
  primary(184, "Ta", "Tantalum", 73),
  comparison(185, "W′", "Tungsten — alternative weight", 74),
  comparison(188, "W″", "Tungsten — comparison position", 74),
  {
    ...comparison(193, "Hg″ / W‴", "Mercury / tungsten — comparison positions"),
    elementNumbers: [80, 74],
    kind: "composite",
  },
  primary(195, "W", "Tungsten", 74),
  comparison(196, "Au′", "Gold — comparison position", 79),
  primary(197, "Ir", "Iridium", 77),
  primary(
    199,
    "Pr",
    "Platinum",
    78,
    "The plate uses Pr for platinum; this is not praseodymium.",
  ),
  primary(200, "Au", "Gold", 79),
  comparison(201, "Hg‴", "Mercury — comparison position", 80),
  comparison(203, "Os′", "Osmium — comparison position", 76),
  primary(204, "Hg", "Mercury", 80),
  comparison(206, "Pb′", "Lead — comparison position", 82),
  primary(207, "Pb", "Lead", 82),
  primary(208, "Os", "Osmium", 76),
  primary(209, "Bi", "Bismuth", 83),
  comparison(213, "Bi′", "Bismuth — alternative weight", 83),
  comparison(216, "Ag″", "Silver — comparison position", 47),
  comparison(238, "Ta′", "Tantalum — comparison position", 73),
  comparison(242, "Sb‴", "Antimony — comparison position", 51),
  comparison(243, "Ta″", "Tantalum — alternative weight", 73),
  comparison(245, "Ta‴", "Tantalum — comparison position", 73),
];

export function telluricPosition(weight) {
  const angle = (weight / 16) * Math.PI * 2;
  return [
    Math.sin(angle) * TELLURIC_RADIUS,
    ((TELLURIC_MAX_WEIGHT / 2 - weight) / 16) * TELLURIC_PITCH,
    Math.cos(angle) * TELLURIC_RADIUS,
  ];
}

const telluric = telluricEntries.map((entry, index) => ({
  ...entry,
  id: `telluric-${entry.weight}-${index}`,
  elementNumbers: entry.elementNumbers || (entry.number ? [entry.number] : []),
  mass: String(entry.weight),
  massLabel: "Historical characteristic number",
  position: telluricPosition(entry.weight),
  rotation: [0, (entry.weight / 16) * Math.PI * 2, 0],
  width: 1.05,
  height: 0.82,
  color:
    entry.kind === "comparison"
      ? "#e0e7e1"
      : entry.number
        ? "#ece1cf"
        : "#ead5df",
  labelStyle: "historical",
  hideAtomicNumber: true,
}));

const sequence = (first, count) =>
  Array.from({ length: count }, (_, i) => first + i);
// Reading each printed ring: left edge from m=-l to +l, then right edge
// from m=+l to -l. These are chart positions, not ground-state calculations.
export const stoweSubshells = [
  [1, 0, [1, 2]],
  [2, 0, [3, 4]],
  [2, 1, sequence(5, 6)],
  [3, 0, [11, 12]],
  [3, 1, sequence(13, 6)],
  [3, 2, sequence(21, 10)],
  [4, 0, [19, 20]],
  [4, 1, sequence(31, 6)],
  [4, 2, sequence(39, 10)],
  [4, 3, sequence(58, 14)],
  [5, 0, [37, 38]],
  [5, 1, sequence(49, 6)],
  [5, 2, [57, ...sequence(72, 9)]],
  [5, 3, sequence(90, 14)],
  [6, 0, [55, 56]],
  [6, 1, sequence(81, 6)],
  [6, 2, [89, 104, 105, 106, 107, null, null, null, null, null]],
  [7, 0, [87, 88]],
  [7, 1, Array(6).fill(null)],
  [8, 0, [null, null]],
];
const stoweColors = ["#f8f5ed", "#f4d2c4", "#ddd0d6", "#cbdfea"];
const oldSymbols = { 104: "Unq", 105: "Unp", 106: "Unh", 107: "Uns" };
const stowe = stoweSubshells.flatMap(([n, l, members]) =>
  members.map((number, index) => {
    const side = index <= 2 * l ? -1 : 1;
    const m = side < 0 ? index - l : 3 * l + 1 - index;
    const spin = side / 2;
    return {
      id: `stowe-${n}-${l}-${m}-${side}`,
      number: number || undefined,
      elementNumbers: number ? [number] : [],
      kind: number ? "element" : "prediction",
      ...(oldSymbols[number] ? { symbol: oldSymbols[number] } : {}),
      ...(!number
        ? {
            symbol: "?",
            name: "Unassigned position",
            note: "This question mark is printed in Stowe’s 1989 chart. It remains unassigned here; no modern element has been added retrospectively.",
          }
        : {}),
      ...(oldSymbols[number]
        ? {
            note: `${oldSymbols[number]} is the historical systematic symbol printed in the 1989 chart; the linked element page uses its present name.`,
          }
        : {}),
      quantum: { n, l, m, spin },
      position: [
        side * (l - Math.abs(m) + 0.5) * STOWE_SPACING,
        STOWE_LAYER_HEIGHTS[n - 1],
        -m * STOWE_SPACING,
      ],
      rotation: [-Math.PI / 2, 0, 0],
      width: 1.03,
      height: 1.03,
      color: stoweColors[l],
      labelStyle: number ? "standard" : "historical",
    };
  }),
);

export const spatialLayouts = { telluric, stowe };
const membership = (slots) =>
  [...new Set(slots.flatMap((slot) => slot.elementNumbers))].sort(
    (a, b) => a - b,
  );
export const spatialModels = [
  {
    id: "telluric",
    name: "de Chancourtois",
    shortName: "de Chancourtois",
    year: 1862,
    date: "1862",
    creator: "Alexandre-Émile Béguyer de Chancourtois",
    edition:
      "A spatial reading of the 7 April 1862 Vis tellurique plate: historical characteristic numbers, repeated positions and compound radicals retained. Axial pitch is compressed for screen readability; a few illegible formula-only annotations are omitted.",
    principle:
      "Historical atomic-weight values and characteristic numbers wind around a cylinder, with 16 units per revolution. Vertical alignments reveal recurring relationships.",
    significance:
      "One of the earliest periodic classifications made recurrence visible in three dimensions, seven years before Mendeleev’s table. Its compounds, disputed identities and repeated weights also reveal the uncertainties of the period.",
    introduction:
      "A helix of historical weights makes chemical recurrence visible.",
    membership: membership(telluric),
    camera: {
      width: 12,
      height: 32,
      depth: 11,
      orbit: true,
      minDistance: 6.4,
      collision: {
        type: "cylinder",
        radius: TELLURIC_RADIUS,
        halfHeight: (TELLURIC_MAX_WEIGHT * TELLURIC_PITCH) / 32,
        padding: 0.9,
      },
      panX: 1,
      panY: 14,
      panZ: 1,
      direction: [0.45, 0.08, 0.89],
    },
    lightingAnchors: [
      [-7, 10, 8],
      [7, -5, 7],
      [0, 4, -8],
    ],
    sources: [
      {
        label:
          "Original 7 April 1862 plate · St Catharine’s College, Cambridge",
        url: "https://www.meta-synthesis.com/webbook/35_pt/chancourtois_1862_whole_a.png",
      },
      {
        label: "Vis tellurique · reference collection and historical caveats",
        url: "https://www.meta-synthesis.com/webbook/35_pt/pt_database.php?PT_id=7",
      },
      {
        label: "Science Museum · telluric screw model",
        url: "https://collection.sciencemuseum.org.uk/objects/co13134/model-of-the-periodic-system-of-de-chancourtois-model",
      },
    ],
  },
  {
    id: "stowe",
    name: "Stowe",
    shortName: "Stowe",
    year: 1989,
    date: "1989",
    creator: "Timothy Stowe",
    edition:
      "The 1989 I²R poster reconstructed as spatial quantum-number layers: 107 identified elements and 13 unassigned question-mark positions. Historical symbols Unq, Unp, Unh and Uns are retained; properties revealed on zoom use current element data.",
    principle:
      "Principal quantum number n separates the layers; m determines each row, the sign of spin selects a side, and subshell l sets the coloured ring.",
    significance:
      "Stowe’s diagram organizes the elements through quantum-number relationships. Turning its projected layers into a spatial object makes their repeated geometry directly explorable.",
    introduction:
      "Stacked quantum-number layers reveal a physicist’s view of periodic structure.",
    membership: membership(stowe),
    camera: {
      width: 10,
      height: 27,
      depth: 9,
      orbit: true,
      minDistance: 2,
      collision: { type: "panels" },
      focusSelection: true,
      panX: 4.5,
      panY: 13,
      panZ: 4.5,
      direction: [0.5, 0.55, 0.7],
    },
    lightingAnchors: [
      [-6, 8, 7],
      [6, -3, 7],
      [0, 4, -6],
    ],
    sources: [
      {
        label: "Timothy Stowe · original 1989 poster",
        url: "https://www.meta-synthesis.com/webbook/35_pt/Stowe_2.png",
      },
      {
        label: "Stowe’s explanation of the quantum-number axes",
        url: "https://www.meta-synthesis.com/webbook/35_pt/Stowe_3.png",
      },
      {
        label: "Original publication provenance · reference collection",
        url: "https://www.meta-synthesis.com/webbook/35_pt/pt_database.php?PT_id=38",
      },
    ],
  },
];
