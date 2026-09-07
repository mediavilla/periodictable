import benfey from "./benfey-layout.json";
import galaxy from "./chemical-galaxy-layout.json";
import elements from "../../public/elements.json";

export const planarSources = { benfey, "chemical-galaxy": galaxy };

function noteFor(id, slot) {
  if (slot.kind === "annotation")
    return "Stewart’s central question mark represents his conceptual ‘element zero’ or neutronium. It is part of the illustration, not a recognized chemical element.";
  if (slot.kind === "prediction")
    return id === "benfey"
      ? `Position ${slot.sourceNumber} is an unnamed future entry in this historical spiral. The printed extension reaches 144; these are predictions in this edition, not additional discovered elements.`
      : `Stewart’s 2006 illustration marks position ${slot.sourceNumber} with a question mark because its discovery was not yet ratified in that edition. The historical question mark is preserved here.`;
  if (slot.sourceSymbol)
    return `The source labels this position ${slot.sourceSymbol}. This reconstruction uses the current name and symbol for element ${slot.number}, while retaining its source placement.`;
  return id === "benfey"
    ? "Position traced from the mature Benfey spiral reproduced in the author’s 2009 account; current element names are used."
    : "Disk position measured from Chemical Galaxy II; current element names are used. Its colours express Stewart’s groupings rather than the standard table’s categories.";
}

export const planarLayouts = Object.fromEntries(
  Object.entries(planarSources).map(([id, data]) => [
    id,
    data.slots.map((slot) => {
      const element = slot.number ? elements[slot.number - 1] : null;
      const { scale, center } = data.source;
      const polygon = slot.polygon;
      const width = polygon
        ? (Math.max(...polygon.map((p) => p[0])) -
            Math.min(...polygon.map((p) => p[0]))) /
          scale
        : (slot.radius * 2) / scale;
      const height = polygon
        ? (Math.max(...polygon.map((p) => p[1])) -
            Math.min(...polygon.map((p) => p[1]))) /
          scale
        : (slot.radius * 2) / scale;
      return {
        ...slot,
        id: `${id}-${slot.sourceNumber}`,
        symbol:
          element?.symbol ||
          (id === "benfey" ? String(slot.sourceNumber) : "?"),
        name:
          element?.name ||
          (slot.kind === "annotation"
            ? "Element zero?"
            : `Historical position ${slot.sourceNumber}`),
        historical: true,
        note: noteFor(id, slot),
        position: [
          (slot.sourceCenter[0] - center[0]) / scale,
          (center[1] - slot.sourceCenter[1]) / scale,
          0,
        ],
        width,
        height,
        rotation: [0, 0, 0],
        labelRotation: 0,
      };
    }),
  ]),
);

const lightingAnchors = [
  [-7, 4, 6],
  [7, -3, 5],
  [0, 5, 4],
];
export const planarModels = [
  {
    id: "benfey",
    name: "Benfey spiral",
    shortName: "Benfey spiral",
    year: 1964,
    date: "1964",
    creator: "Theodor Benfey, with Joseph Jacobs",
    edition:
      "Mature spiral reproduced as Figure 3 in Benfey’s 2009 account, credited to a January 1970 reprint. It contains 105 named historical entries and 39 predicted positions (106–144). Current names replace Ku and Ha.",
    principle:
      "A continuous spiral expands into transition-metal and inner-transition regions, with a further projection for hypothetical superactinides.",
    significance:
      "Benfey’s spiral made the inner-transition elements part of a continuous sequence with room to read them. His account distinguishes the original 1964 snail from later predictions and revisions.",
    introduction:
      "A continuous spiral with room for the inner-transition series.",
    membership: planarLayouts.benfey.flatMap((s) =>
      s.number ? [s.number] : [],
    ),
    camera: {
      width: 21.3,
      height: 18.5,
      depth: 0,
      orbit: false,
      minDistance: 0.45,
    },
    lightingAnchors,
    sources: [
      {
        label:
          "Benfey · The biography of a periodic spiral (2009), Figure 3, p.143",
        url: "https://acshist.scs.illinois.edu/bulletin_open_access/FullIssues/bhc2009v034f2.pdf#page=73",
      },
    ],
  },
  {
    id: "chemical-galaxy",
    name: "Chemical galaxy",
    shortName: "Chemical galaxy",
    year: 2004,
    date: "2004",
    creator: "Philip Stewart; illustration by Carl Wenczek",
    edition:
      "Chemical Galaxy II, described by its creator in 2006, following the original 2004 publication. The source has 118 numbered positions: 113 identified disks and five question-mark positions, plus a conceptual center. Current names replace Uub and Uuq.",
    principle:
      "An elliptical spiral preserves the element sequence, while curved spokes connect related groups. Disks, spacing and colours follow Stewart’s illustrated arrangement.",
    significance:
      "Stewart’s design complements the rectangular table with a continuous visual sequence, relating chemistry’s atomic scale to the astronomical origin of the elements.",
    introduction:
      "A spiral of elements, connected through curved chemical families.",
    membership: planarLayouts["chemical-galaxy"].flatMap((s) =>
      s.number ? [s.number] : [],
    ),
    camera: { width: 25.1, height: 17.8, depth: 0, orbit: false },
    lightingAnchors,
    sources: [
      {
        label: "Philip Stewart · Chemical Galaxy II and creator’s notes",
        url: "https://www.chemicalgalaxy.co.uk/page3_page3.html",
      },
      {
        label: "Chemical Galaxy II · reproduced source illustration",
        url: "https://www.meta-synthesis.com/webbook/35_pt/stew.jpg",
      },
    ],
  },
];
