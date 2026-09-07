import elements from "../public/elements.json";
import { modernModels, modernLayouts } from "./models/modern-models";
import {
  historicalModels,
  historicalLayouts,
} from "./models/historical-models";
import { spatialModels, spatialLayouts } from "./models/spatial-models";
import { planarModels, planarLayouts } from "./models/planar-models";
import { DESIGN_IDS, TIMELINE_IDS, slotNumbers } from "./model-slots.mjs";

const coreTables = [
  {
    id: "18",
    renderer: "grid",
    name: "18 columns",
    shortName: "18 columns",
    year: null,
    date: "Today",
    creator: "A collective scientific development",
    edition:
      "Contemporary 118-element arrangement; La and Ac in group 3, with detached inner-transition rows.",
    principle:
      "Atomic number increases across periods; columns bring related chemical behaviour together.",
    significance:
      "The familiar classroom and laboratory reference makes periodic relationships easy to compare. Its present form developed over time rather than being invented in a single year.",
    introduction: "The familiar reference, with 118 elements and 18 groups.",
    membership: elements.map((e) => e.number),
    camera: { width: 19.2, height: 10.4, depth: 0, orbit: false },
    lightingAnchors: [
      [-7, 3, 6],
      [6, -2, 4],
      [0, 6, 3],
    ],
    sources: [
      {
        label: "IUPAC · Periodic Table of Elements",
        url: "https://iupac.org/what-we-do/periodic-table-of-elements/",
      },
    ],
  },
  {
    id: "racetrack",
    renderer: "racetrack",
    name: "Racetrack",
    shortName: "Race Track",
    year: 1933,
    date: "1933",
    creator: "John D. Clark",
    edition:
      "The existing website adaptation: 104 numbered regions. This is not an exact reproduction of Clark’s 1933 table.",
    principle:
      "A continuous circuit expresses the recurring sequence of chemical families.",
    significance:
      "Clark’s looping arrangement explores periodicity as a continuous path rather than a set of separate rows.",
    introduction:
      "Periodicity takes a continuous route around a looping track.",
    membership: Array.from({ length: 104 }, (_, i) => i + 1),
    camera: { width: 22.2, height: 13.8, depth: 0, orbit: false },
    lightingAnchors: [
      [-8, 2, 5],
      [7, 3, 5],
      [0, -5, 4],
    ],
    sources: [
      {
        label: "Internet Database of Periodic Tables · Clark (1933)",
        url: "https://www.meta-synthesis.com/webbook/35_pt/pt_database.php?PT_id=86",
      },
      {
        label: "Types of periodic tables · alternative arrangements",
        url: "https://en.wikipedia.org/wiki/Types_of_periodic_tables",
      },
    ],
  },
  {
    id: "giguere",
    renderer: "giguere",
    name: "Giguère",
    shortName: "Giguère",
    year: 1965,
    date: "1965",
    creator: "Paul-Antoine Giguère",
    edition:
      "Historical 103-element model, dated 1965 on its placard and published in December 1966. Current element names are used, including Lr for the original Lw.",
    principle:
      "Four intersecting wings organize the s, p, d and f blocks. Opposite faces carry different elements.",
    significance:
      "The third dimension connects the orbital blocks without detaching the inner-transition series. Orbiting the model reveals relationships hidden by a single flat projection.",
    introduction:
      "Four intersecting wings turn electronic structure into a spatial object.",
    membership: Array.from({ length: 103 }, (_, i) => i + 1),
    camera: { width: 15.5, height: 10, depth: 9, orbit: true },
    lightingAnchors: [
      [-7, 5, 6],
      [6, -1, 6],
      [0, 4, -7],
    ],
    sources: [
      {
        label: "Historical figure and catalog entry",
        url: "https://www.meta-synthesis.com/webbook/35_pt/pt_database.php?PT_id=525",
      },
      {
        label: "Original paper and construction reference · Grover Lab",
        url: "https://github.com/groverlab/giguere-3D-periodic-table",
      },
    ],
  },
];
export const MODEL_LAYOUTS = {
  ...modernLayouts,
  ...historicalLayouts,
  ...spatialLayouts,
  ...planarLayouts,
};
export const TABLES = [
  ...coreTables,
  ...modernModels,
  ...historicalModels,
  ...spatialModels.map((table) => ({ ...table, renderer: "spatial" })),
  ...planarModels.map((table) => ({ ...table, renderer: "planar" })),
].map((table) => ({
  renderer: "grid",
  ...table,
  membership:
    table.membership ||
    [...new Set((MODEL_LAYOUTS[table.id] || []).flatMap(slotNumbers))].sort(
      (a, b) => a - b,
    ),
}));
export const tableById = (id) => TABLES.find((t) => t.id === id) || TABLES[0];
export const designTables = DESIGN_IDS.map((id) =>
  TABLES.find((table) => table.id === id),
).filter(Boolean);
export const chronologicalTables = TIMELINE_IDS.map((id) =>
  TABLES.find((table) => table.id === id),
).filter(Boolean);
const coreSlots = Object.fromEntries(
  coreTables.map((table) => [
    table.id,
    table.membership.map((number) => ({ id: `${table.id}-${number}`, number })),
  ]),
);
export const tableSlots = (id) =>
  MODEL_LAYOUTS[id] || coreSlots[id] || coreSlots["18"];
export const findSlot = (designId, slotId) =>
  tableSlots(designId).find((slot) => slot.id === slotId);
export const findElement = (value) =>
  elements.find(
    (e) =>
      e.name.toLowerCase() === String(value).toLowerCase() ||
      e.symbol.toLowerCase() === String(value).toLowerCase() ||
      String(e.number) === String(value),
  );
export const categoryColor = (category) => {
  if (category.startsWith("unknown")) return "#454545";
  if (category.startsWith("lanthanide")) return "#7a00ff";
  if (category.startsWith("actinide")) return "#ff7500";
  return (
    {
      "diatomic nonmetal": "#ff00ff",
      "polyatomic nonmetal": "#ff00ff",
      "noble gas": "#cccccc",
      "alkali metal": "#05b6bb",
      "alkaline earth metal": "#dd201c",
      metalloid: "#959339",
      "post-transition metal": "#15d905",
      "transition metal": "#0070ff",
    }[category] || "#888888"
  );
};

// Canvas base colours: the category hue mixed with 55% white in linear sRGB.
// Share the resulting swatches with HTML; CSS mixing in sRGB is more saturated.
const pastelSwatches = {
  "#454545": "#c8c8c8",
  "#7a00ff": "#d1c4ff",
  "#ff7500": "#ffd0c4",
  "#ff00ff": "#ffc4ff",
  "#cccccc": "#eaeaea",
  "#05b6bb": "#c4e2e4",
  "#dd201c": "#f0c5c5",
  "#959339": "#d8d7c7",
  "#15d905": "#c4efc4",
  "#0070ff": "#c4cfff",
  "#888888": "#d4d4d4",
};
export const categoryPastelColor = (category) =>
  pastelSwatches[categoryColor(category)];
