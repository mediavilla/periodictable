// Editorial content is independent of the table geometry. Every element gets
// the same baseline blocks; curated stories can add blocks without new pages.
import { getOrbitalPreset } from "./orbital-presets.mjs";

export const FEATURED_ELEMENT_NUMBERS = [1, 6, 79];

const rsc = (number, name) => ({
  title: `Royal Society of Chemistry · ${name}`,
  url: `https://periodic-table.rsc.org/element/${number}/${name.toLowerCase()}`,
});

export const elementStories = {
  1: {
    eyebrow: "A small atom. A stellar role.",
    summary:
      "One proton defines hydrogen. A neutral atom has just one electron. The simplest element connects the chemistry of water with the nuclear reactions that power the Sun.",
    sources: [
      rsc(1, "Hydrogen"),
      { title: "NASA · Sun facts", url: "https://science.nasa.gov/sun/facts/" },
    ],
    blocks: [
      {
        id: "sun",
        type: "image",
        title: "The fuel of a star",
        src: "/images/stories/hydrogen-sun.jpg",
        alt: "A bright loop of solar plasma rises above the edge of the Sun.",
        caption:
          "A solar prominence observed by the Solar Dynamics Observatory. The Sun’s energy originates much deeper, in its core.",
        credit: "Solar Dynamics Observatory / NASA",
        source: "https://science.nasa.gov/sun/facts/",
      },
      {
        id: "fusion",
        type: "text",
        title: "From hydrogen to helium",
        body: "At the Sun’s core, extreme temperatures and pressure allow hydrogen nuclei to fuse into helium. These nuclear reactions release the energy that eventually reaches us as sunlight.",
        source: {
          title: "Explore the Sun with NASA",
          url: "https://science.nasa.gov/sun/facts/",
        },
        accent: true,
      },
      {
        id: "one-proton",
        type: "text",
        title: "What makes an element?",
        body: "The proton count is the defining feature. Every hydrogen nucleus has one proton. Isotopes can have different neutron counts, and ions can gain or lose electrons, without becoming a different element.",
        source: rsc(1, "Hydrogen"),
      },
    ],
  },
  6: {
    eyebrow: "One element. Many structures.",
    summary:
      "Carbon can form the rigid network of diamond or the sliding layers of graphite. The atoms are the same; the way they bond changes the material. Carbon’s ability to form varied chains also underpins the molecules of life.",
    sources: [
      rsc(6, "Carbon"),
      {
        title: "RSC Education · Allotropes of carbon",
        url: "https://edu.rsc.org/allotropes-of-carbon/allotropes-of-carbon/4012885.article",
      },
      {
        title: "NASA · Blue Marble 2002",
        url: "https://science.nasa.gov/resource/blue-marble-2002/",
      },
    ],
    blocks: [
      {
        id: "bonds",
        type: "visualization",
        visualization: "bond-comparison",
        title: "Change the connections",
        source: {
          title: "RSC Education · Allotropes of carbon",
          url: "https://edu.rsc.org/allotropes-of-carbon/allotropes-of-carbon/4012885.article",
        },
        choices: [
          {
            id: "graphite",
            label: "Graphite",
            body: "In graphite, each carbon bonds to three neighbours within a sheet. Weak interactions between sheets allow the layers to slide.",
            caption:
              "One six-membered ring in a graphite sheet; the network extends beyond these atoms.",
            nodes: [
              [0, -1],
              [0.866, -0.5],
              [0.866, 0.5],
              [0, 1],
              [-0.866, 0.5],
              [-0.866, -0.5],
            ],
            edges: [
              [0, 1],
              [1, 2],
              [2, 3],
              [3, 4],
              [4, 5],
              [5, 0],
            ],
          },
          {
            id: "diamond",
            label: "Diamond",
            body: "In diamond, each carbon bonds to four neighbours in a three-dimensional network. The connected structure makes diamond exceptionally hard.",
            caption:
              "A projected tetrahedral bonding unit. Bonds and atoms are schematic and not to scale.",
            nodes: [
              [0, 0],
              [0, -1.1],
              [-1.1, 0.62],
              [1.1, 0.62],
              [0.75, 0.08],
            ],
            edges: [
              [0, 1],
              [0, 2],
              [0, 3],
              [0, 4],
            ],
          },
        ],
      },
      {
        id: "life",
        type: "image",
        title: "A planet of carbon chemistry",
        src: "/images/stories/carbon-earth.jpg",
        alt: "NASA’s Blue Marble composite shows Earth’s oceans, clouds, and the Americas.",
        caption:
          "The Blue Marble, assembled from satellite observations in 2002. Carbon circulates through living things, oceans, air, and rocks.",
        credit: "NASA’s Earth Observatory",
        source: "https://science.nasa.gov/resource/blue-marble-2002/",
      },
      {
        id: "chains",
        type: "text",
        title: "The ability to connect",
        body: "Carbon forms strong bonds with other carbon atoms. Long chains and more complex arrangements make possible the diversity of organic molecules, from simple fuels to the molecules that living organisms build.",
        source: rsc(6, "Carbon"),
        accent: true,
      },
    ],
  },
  79: {
    eyebrow: "From ornament to observatory.",
    summary:
      "Gold is a soft yellow metal that resists corrosion and can be worked into very thin layers. Those qualities make it useful in jewellery, reliable electrical contacts, and the mirrors of a space telescope.",
    sources: [
      rsc(79, "Gold"),
      {
        title: "NASA · Webb’s mirrors",
        url: "https://science.nasa.gov/mission/webb/webbs-mirrors/",
      },
    ],
    blocks: [
      {
        id: "webb",
        type: "image",
        title: "A golden view of the universe",
        src: "/images/stories/gold-webb.jpg",
        alt: "The James Webb Space Telescope’s gold-coated hexagonal primary mirror in a cleanroom.",
        caption:
          "Webb’s primary mirror uses gold-coated beryllium segments. The gold improves their reflection of infrared light.",
        credit: "NASA / Chris Gunn",
        source: "https://science.nasa.gov/mission/webb/webbs-mirrors/",
      },
      {
        id: "thin-layer",
        type: "text",
        title: "100 nanometres",
        body: "The gold coating on each Webb mirror segment is about 100 nanometres thick. The beryllium beneath it supplies the structure; the thin gold surface helps the telescope collect infrared light.",
        source: {
          title: "How NASA made Webb’s mirrors",
          url: "https://science.nasa.gov/mission/webb/webbs-mirrors/",
        },
        accent: true,
      },
      {
        id: "contacts",
        type: "text",
        title: "A dependable connection",
        body: "A contact needs to keep conducting. Gold combines electrical conductivity with resistance to corrosion, making thin coatings useful on electrical connectors. The same softness that allows gold leaf means jewellery often uses harder alloys.",
        source: rsc(79, "Gold"),
      },
    ],
  },
};

const numberFormat = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 6,
});
const value = (item, unit = "") =>
  item === null || item === undefined || item === ""
    ? "Unavailable"
    : `${typeof item === "number" ? numberFormat.format(item) : item}${unit ? ` ${unit}` : ""}`;

export function getElementFacts(element) {
  // Existing density values use g/L for gases and g/cm³ for condensed phases.
  // Carbon needs an allotrope; the source's unqualified value is not displayed.
  const density =
    element.number === 6
      ? "3.513 (diamond); 2.2 (graphite) g/cm³"
      : value(element.density, element.phase === "Gas" ? "g/L" : "g/cm³");
  return [
    { label: "Atomic number", value: value(element.number) },
    { label: "Atomic mass", value: value(element.atomic_mass, "u") },
    { label: "Phase", value: value(element.phase) },
    { label: "Density", value: density },
    {
      label: "Melting point",
      value:
        element.number === 6 ? "Sublimes at 4,098 K" : value(element.melt, "K"),
    },
    {
      label: "Boiling point",
      value:
        element.number === 79
          ? "3,109 K"
          : element.number === 6
            ? "Sublimes at 4,098 K"
            : value(element.boil, "K"),
    },
    {
      label: "First ionization energy",
      value: value(element.ionization_energies?.[0], "kJ/mol"),
    },
    {
      label: "Electronegativity",
      value: value(element.electronegativity_pauling),
    },
    {
      label: "Electron affinity",
      value: value(element.electron_affinity, "kJ/mol"),
    },
    {
      label: "Molar heat capacity",
      value: value(element.molar_heat, "J/(mol·K)"),
    },
    { label: "Period", value: value(element.period) },
    { label: "Appearance", value: value(element.appearance) },
  ];
}

export function getElementContent(element) {
  const story = elementStories[element.number];
  const reference = {
    title: `${element.name} · Reference data`,
    url: element.source,
  };
  return {
    eyebrow: story?.eyebrow || element.category,
    summary:
      story?.summary ||
      element.summary ||
      "A chemical element defined by its atomic number. Explore its electronic structure and available properties below.",
    sources: [
      ...(story?.sources || [rsc(element.number, element.name)]),
      reference,
    ].filter((source) => source.url),
    blocks: [
      {
        id: "bohr",
        type: "visualization",
        visualization: "bohr",
        title: "Inside a neutral atom",
        configuration:
          element.econfig_shorthand ||
          element.electron_configuration ||
          "Unavailable",
        orbitals: getOrbitalPreset(element.number),
      },
      {
        id: "facts",
        type: "facts",
        title: "At a glance",
        items: getElementFacts(element),
      },
      ...(story?.blocks || []),
    ],
  };
}
