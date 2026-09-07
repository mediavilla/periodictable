// Historical positions are independent of modern atomic numbers. Source values
// are strings: a question mark, old symbol, or combined entry is part of the model.
const flatLights = [
  [-7, 4, 6],
  [7, -3, 5],
  [0, 5, 4],
];
const primaryMendeleev = "https://web.lemoyne.edu/~giunta/EA/MENDELEEVann.HTML";
const primaryDobereiner = "https://web.lemoyne.edu/~giunta/dobereiner.html";
const primaryJanet =
  "https://www.meta-synthesis.com/webbook/35_pt/JanetIII.jpg";

const triads = [
  { numbers: [3, 11, 19], color: "#c4e2e4", family: "Alkali metals" },
  { numbers: [20, 38, 56], color: "#f0c5c5", family: "Alkaline earth metals" },
  {
    numbers: [16, 34, 52],
    color: "#e6d8f2",
    family: "Sulfur, selenium and tellurium",
  },
  {
    numbers: [17, 35, 53],
    color: "#d5e8ce",
    family: "Chlorine, bromine and iodine",
  },
];
const dobereiner = triads.flatMap(({ numbers, color, family }, row) =>
  numbers.map((number, column) => ({
    id: `dobereiner-${number}`,
    kind: "element",
    number,
    position: [(column - 1) * 2.4, (1.5 - row) * 2.15, 0],
    width: 2,
    height: 1.65,
    color,
    note: `${family}: one of four representative triads from Döbereiner’s 1829 discussion. This educational reconstruction uses current element names and properties; the original comparisons also used compounds and historical weight scales.`,
  })),
);

const element = (number, symbol, mass, note) => ({
  kind: "element",
  number,
  symbol,
  mass,
  ...(note ? { note } : {}),
});
const prediction = (mass, note) => ({
  kind: "prediction",
  symbol: "?",
  name: "Predicted element",
  mass,
  color: "#eee9dd",
  note,
});

// Rows and six columns transcribed from the 1869 German abstract, as reproduced
// in Giunta's annotated translation. Nulls are empty paper, not missing elements.
const mendeleevRows = [
  [
    null,
    null,
    null,
    element(22, "Ti", "50"),
    element(40, "Zr", "90"),
    prediction(
      "180",
      "An unnamed heavier analogue of titanium and zirconium. This position anticipates hafnium; the question mark remains as printed in 1869.",
    ),
  ],
  [
    null,
    null,
    null,
    element(23, "V", "51"),
    element(41, "Nb", "94"),
    element(73, "Ta", "182"),
  ],
  [
    null,
    null,
    null,
    element(24, "Cr", "52"),
    element(42, "Mo", "96"),
    element(74, "W", "186"),
  ],
  [
    null,
    null,
    null,
    element(25, "Mn", "55"),
    element(
      45,
      "Rh",
      "104,4",
      "Rhodium occupies this position in the 1869 source, although its modern classification differs.",
    ),
    element(78, "Pt", "197,4"),
  ],
  [
    null,
    null,
    null,
    element(26, "Fe", "56"),
    element(44, "Ru", "104,4"),
    element(77, "Ir", "198"),
  ],
  [
    null,
    null,
    null,
    {
      kind: "composite",
      symbol: "Ni=Co",
      name: "Nickel and cobalt",
      mass: "59",
      elementNumbers: [28, 27],
      note: "The source puts nickel and cobalt together in one printed position and gives both the atomic weight 59. This shared slot is preserved.",
    },
    element(46, "Pd", "106,6"),
    element(76, "Os", "199"),
  ],
  [
    element(1, "H", "1"),
    null,
    null,
    element(29, "Cu", "63,4"),
    element(47, "Ag", "108"),
    element(80, "Hg", "200"),
  ],
  [
    null,
    element(4, "Be", "9,4"),
    element(12, "Mg", "24"),
    element(30, "Zn", "65,2"),
    element(48, "Cd", "112"),
    null,
  ],
  [
    null,
    element(5, "B", "11"),
    element(13, "Al", "27,4"),
    prediction(
      "68",
      "An unnamed analogue of aluminium in the source. Gallium was discovered in 1875; its modern symbol is not substituted into this historical gap.",
    ),
    element(
      92,
      "Ur",
      "116",
      "Ur is the source’s symbol for uranium. Its historical weight and placement are retained; neither agrees with the modern value and classification.",
    ),
    element(79, "Au", "197?"),
  ],
  [
    null,
    element(6, "C", "12"),
    element(14, "Si", "28"),
    prediction(
      "70",
      "An unnamed analogue of silicon in the source. Germanium was discovered in 1886; this scene retains the original question mark.",
    ),
    element(50, "Sn", "118"),
    null,
  ],
  [
    null,
    element(7, "N", "14"),
    element(15, "P", "31"),
    element(33, "As", "75"),
    element(51, "Sb", "122"),
    element(83, "Bi", "210?"),
  ],
  [
    null,
    element(8, "O", "16"),
    element(16, "S", "32"),
    element(34, "Se", "79,4"),
    element(52, "Te", "128?"),
    null,
  ],
  [
    null,
    element(9, "F", "19"),
    element(17, "Cl", "35,5"),
    element(35, "Br", "80"),
    element(
      53,
      "J",
      "127",
      "J is the German-language symbol used for iodine in this publication.",
    ),
    null,
  ],
  [
    element(3, "Li", "7"),
    element(11, "Na", "23"),
    element(19, "K", "39"),
    element(37, "Rb", "85,4"),
    element(55, "Cs", "133"),
    element(81, "Tl", "204"),
  ],
  [
    null,
    null,
    element(20, "Ca", "40"),
    element(38, "Sr", "87,6"),
    element(56, "Ba", "137"),
    element(82, "Pb", "207"),
  ],
  [
    null,
    null,
    prediction(
      "45",
      "The source leaves an unnamed entry after calcium. It is a precursor of the later scandium prediction, not the fully developed 1871 arrangement.",
    ),
    element(58, "Ce", "92"),
    null,
    null,
  ],
  [
    null,
    null,
    element(
      68,
      "?Er",
      "56",
      "The leading question mark and historical atomic weight belong to the original uncertain classification of erbium.",
    ),
    element(57, "La", "94"),
    null,
    null,
  ],
  [
    null,
    null,
    element(
      39,
      "?Yt",
      "60",
      "Yt is the source’s symbol for yttrium; the leading question mark and weight are preserved.",
    ),
    {
      kind: "historical",
      symbol: "Di",
      name: "Didymium",
      mass: "95",
      elementNumbers: [59, 60],
      color: "#e8ddef",
      note: "Didymium was treated as an element in 1869. It was later separated into praseodymium and neodymium. The historical single entry is retained and is not assigned a fictional atomic number.",
    },
    null,
    null,
  ],
  [
    null,
    null,
    element(
      49,
      "?In",
      "75,6",
      "The source marks indium’s classification as uncertain and gives a historical atomic weight.",
    ),
    element(90, "Th", "118?"),
    null,
    null,
  ],
];

const mendeleev = mendeleevRows.flatMap((row, rowIndex) =>
  row.flatMap((slot, column) =>
    slot
      ? [
          {
            ...slot,
            id: `mendeleev-r${rowIndex + 1}-c${column + 1}`,
            historical: true,
            sourceRow: rowIndex + 1,
            sourceColumn: column + 1,
            position: [(column - 2.5) * 1.85, (9 - rowIndex) * 1.02, 0],
            width: 1.7,
            height: 0.9,
          },
        ]
      : [],
  ),
);

// Version III's eight rows have 2, 2, 8, 8, 18, 18, 32, 32 positions.
// The spaces between blocks reproduce the separated f / d / p / s panels.
const janetBlocks = [
  {
    key: "f",
    start: 0,
    width: 14,
    firstRow: 6,
    firstNumber: 57,
    color: "#f2e3ca",
  },
  {
    key: "d",
    start: 14.7,
    width: 10,
    firstRow: 4,
    firstNumber: 21,
    color: "#d7e4f2",
  },
  {
    key: "p",
    start: 25.4,
    width: 6,
    firstRow: 2,
    firstNumber: 5,
    color: "#deead3",
  },
  {
    key: "s",
    start: 32.1,
    width: 2,
    firstRow: 0,
    firstNumber: 1,
    color: "#f0dce5",
  },
];
const janetStarts = {
  f: [57, 89],
  d: [21, 39, 71, 103],
  p: [5, 13, 31, 49, 81, 113],
  s: [1, 3, 11, 19, 37, 55, 87, 119],
};
const janetSourceSymbols = {
  18: "A",
  23: "Va",
  43: "Ma",
  54: "X",
  61: "Fr",
  69: "Tu",
  70: "Ny",
  86: "Em",
};
const janetUnassigned = new Set([
  85,
  87,
  ...Array.from({ length: 28 }, (_, index) => index + 93),
]);
const janetNotes = {
  18: "Janet prints A for argon; the modern symbol is Ar.",
  23: "Janet prints Va for vanadium; the modern symbol is V.",
  43: "The source prints Ma, the historical claim masurium, at position 43. This does not assert that technetium had been securely identified in 1928.",
  54: "Janet prints X for xenon; the modern symbol is Xe.",
  61: "The source prints Fr, a claimed element called florentium, at position 61. It is not francium (modern element 87), and is not presented as a confirmed discovery of promethium.",
  69: "Janet prints Tu for thulium; the modern symbol is Tm.",
  70: "Ny denotes neoytterbium, the historical name for the element now called ytterbium. Its verified modern identity is element 70, Yb.",
  86: "Em denotes emanation, an earlier name used for radon; the modern symbol is Rn.",
};
const janet = janetBlocks.flatMap((block) =>
  janetStarts[block.key].flatMap((firstNumber, blockRow) =>
    Array.from({ length: block.width }, (_, column) => {
      const sourceNumber = firstNumber + column;
      const unassigned = janetUnassigned.has(sourceNumber);
      const disputed = sourceNumber === 43 || sourceNumber === 61;
      return {
        id: `janet-${sourceNumber}`,
        kind: unassigned ? "prediction" : disputed ? "historical" : "element",
        ...(!unassigned && !disputed ? { number: sourceNumber } : {}),
        sourceNumber,
        historical: true,
        block: block.key,
        sourceRow: block.firstRow + blockRow + 1,
        sourceColumn: column + 1,
        ...(unassigned ? { symbol: "?", name: "Unassigned in 1928" } : {}),
        ...(janetSourceSymbols[sourceNumber]
          ? { symbol: janetSourceSymbols[sourceNumber] }
          : {}),
        ...(disputed
          ? {
              name: sourceNumber === 43 ? "Masurium claim" : "Florentium claim",
            }
          : {}),
        position: [
          block.start + column - 16.55,
          (3.5 - block.firstRow - blockRow) * 1.15,
          0,
        ],
        width: 0.94,
        height: 1.04,
        color: unassigned ? "#eeece7" : block.color,
        ...(unassigned
          ? {
              note: `Janet’s November 1928 figure numbers this position ${sourceNumber} but leaves its element symbol blank. The question mark in this reconstruction denotes that original unassigned position; it does not add a modern element to the historical table.`,
            }
          : janetNotes[sourceNumber]
            ? { note: janetNotes[sourceNumber] }
            : {}),
      };
    }),
  ),
);

export const historicalLayouts = { dobereiner, mendeleev, janet };

export const historicalModels = [
  {
    id: "dobereiner",
    name: "Döbereiner’s triads",
    shortName: "Döbereiner",
    year: 1829,
    date: "1829",
    creator: "Johann Wolfgang Döbereiner",
    edition:
      "Educational reconstruction of four representative triads discussed in 1829: twelve elements, using current names and properties. This is not a facsimile or a complete table of the elements.",
    principle:
      "Compare three chemically related substances: the middle member’s weight is approximately the mean of the other two.",
    significance:
      "The triads connected chemical similarity with numerical relationships before a comprehensive periodic system was available. Döbereiner also recorded incomplete and unsuccessful groupings.",
    introduction:
      "Four groups of three reveal an early pattern in the elements.",
    camera: { width: 8.2, height: 9, depth: 0, orbit: false },
    lightingAnchors: flatLights,
    sources: [
      {
        label: "Döbereiner · 1829 paper, translated in Classic Chemistry",
        url: primaryDobereiner,
      },
      {
        label:
          "Girolami · Original documents before Mendeleev (2019), pp. 113–114",
        url: "https://doi.org/10.13128/Substantia-592",
      },
    ],
  },
  {
    id: "mendeleev",
    name: "Mendeleev’s first table",
    shortName: "Mendeleev",
    year: 1869,
    date: "1869",
    creator: "Dmitri Mendeleev",
    edition:
      "The first published arrangement, as printed in the 1869 German abstract. Original sparse positions, symbols, weights and question marks are retained, including the shared nickel/cobalt slot and didymium.",
    principle:
      "Arrange elements by atomic weight while placing chemically analogous elements in horizontal rows; preserve gaps where the pattern suggests missing entries.",
    significance:
      "The system connected many chemical families and supported testable predictions. Its provisional weights, misplaced elements and unresolved identities also show the evidence available in 1869.",
    introduction:
      "A sparse first arrangement, including the gaps and uncertainties.",
    camera: { width: 12.5, height: 21, depth: 0, orbit: false },
    lightingAnchors: flatLights,
    sources: [
      {
        label: "Mendeleev · First table and annotated translation (1869)",
        url: primaryMendeleev,
      },
      {
        label: "Original German abstract · Zeitschrift für Chemie, pp. 405–406",
        url: "https://books.google.com/books?id=h5BTAAAAcAAJ&pg=PA405",
      },
    ],
  },
  {
    id: "janet",
    name: "Janet’s left-step table",
    shortName: "Janet",
    year: 1928,
    date: "1928",
    creator: "Charles Janet",
    edition:
      "Version III, November 1928: all 120 numbered positions, including 30 unnamed positions and the historical Ma and Fr claims. Ny is retained as the old symbol for ytterbium. Colours and question-mark markers are additions for this reconstruction.",
    principle:
      "A left-step arrangement separates four blocks and pairs row lengths: 2, 2, 8, 8, 18, 18, 32, 32.",
    significance:
      "Janet’s arrangement presents the block structure as a regular sequence, with helium above beryllium and the inner-transition region incorporated into the longest rows. The source extends its numbered framework beyond the elements known in 1928.",
    introduction:
      "A stepped sequence with the original numbered, unassigned spaces.",
    camera: { width: 36, height: 10.7, depth: 0, orbit: false },
    lightingAnchors: [
      [-12, 4, 6],
      [12, -2, 5],
      [0, 5, 4],
    ],
    sources: [
      {
        label: "Janet · Original Version III figure, November 1928",
        url: primaryJanet,
      },
      {
        label: "Reference collection · Janet’s three left-step versions",
        url: "https://www.meta-synthesis.com/webbook/35_pt/pt_database.php?PT_id=152",
      },
      {
        label: "Miśkowiec · History of element names, including neoytterbium",
        url: "https://doi.org/10.1007/s10698-022-09451-w",
      },
    ],
  },
];
