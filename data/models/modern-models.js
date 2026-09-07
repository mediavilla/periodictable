import elements from "../../public/elements.json";

export const modernLayouts = {
  32: elements.map((element) => ({
    id: `32-${element.number}`,
    number: element.number,
    position: [element.col32Xpos - 16.5, 4 - element.col32Ypos, 0],
  })),
};

export const modernModels = [
  {
    id: "32",
    name: "32 columns",
    shortName: "32 columns",
    year: null,
    date: "Today",
    creator: "A collective scientific development",
    edition:
      "Contemporary 118-element long form, using the original website’s 32-column coordinates. Lu and Lr align with Sc and Y; La and Ac begin the fourteen-column inner-transition region.",
    principle:
      "The inner-transition elements sit within the main sequence, giving the longest periods their full 32-column width.",
    significance:
      "The long form makes the uninterrupted atomic-number sequence visible. It offers a different compromise between continuity and page width from the familiar detached-row table; IUPAC does not prescribe one particular table shape.",
    introduction: "All 118 elements in one continuous, full-width arrangement.",
    camera: { width: 33.5, height: 8.8, depth: 0, orbit: false },
    lightingAnchors: [
      [-12, 3, 6],
      [12, -2, 4],
      [0, 5, 3],
    ],
    sources: [
      {
        label: "IUPAC · Periodic Table of Elements",
        url: "https://iupac.org/what-we-do/periodic-table-of-elements/",
      },
    ],
  },
];
