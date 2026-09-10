import { ORBITAL_MODELS } from '../components/explorer/orbitals/orbitalMath.mjs';
import { configurationSuperscripts, parseConfiguration } from './electron-configuration.mjs';

// Occupations come from expanded configurations, not spherical shell counts.
const shapeSources = [
  { title: 'NIST · Hydrogenic wavefunctions', url: 'https://dlmf.nist.gov/18.39.ii' },
];
const purdueSource = {
  title: 'Purdue · Quantum numbers and electron configurations',
  url: 'https://chemed.chem.purdue.edu/genchem/topicreview/bp/ch6/quantum.php',
};

const subshell = (id, electrons) => {
  const model = ORBITAL_MODELS[id];
  if (!model) throw new RangeError(`Unsupported orbital subshell: ${id}`);
  const shape = {
    '1s': 'A spherical cloud, densest at the centre, with no nodes. Its probability density fades smoothly outward.',
    '2s': 'A spherical cloud with an inner and outer region of opposite wavefunction sign. A spherical node separates them; use the cross-section to look inside.',
    '2p': 'Two opposite-sign lobes separated by a plane where the probability density is zero. The x, y and z choices show different orientations of the same orbital shape.',
  }[id] || `${model.l === 0 ? 'A spherical orbital' : model.l === 1 ? 'A two-lobed p orbital' : model.l === 2 ? 'The d_z² representative, with two polar lobes and an equatorial ring' : 'The f_z³ representative, with polar lobes and two intermediate ring-shaped regions'}. ${model.radialNodes ? `${model.radialNodes} radial ${model.radialNodes === 1 ? 'node separates' : 'nodes separate'} regions of alternating wavefunction sign.` : 'It has no radial nodes.'}`;
  return {
    id,
    n: model.n,
    l: model.l,
    electrons,
    orientations: model.l === 1 ? ['x', 'y', 'z'] : [],
    representative: model.representative,
    spatialOrbitalCount: 2 * model.l + 1,
    description: shape,
  };
};

const parseSubshells = (configuration) =>
  parseConfiguration(configuration).map((entry) => {
    if (entry.electrons > 2 * (2 * entry.l + 1)) {
      throw new RangeError(`${entry.id}${entry.electrons} exceeds subshell capacity`);
    }
    return subshell(entry.id, entry.electrons);
  });

const curated = {
  1: {
    configuration: '1s¹',
    predicted: false,
    defaultOrbital: '1s',
    modelNote: 'Hydrogen’s 1s ground state uses the standard nonrelativistic hydrogen model. Colours show wavefunction sign; density shows where its electron is more likely to be found. Display size and brightness are illustrative.',
    occupancyNote: 'One electron in the 1s subshell of a neutral hydrogen atom.',
    sources: [
      { title: 'NIST · Hydrogen ground state', url: 'https://physics.nist.gov/PhysRefData/Handbook/Tables/hydrogentable1.htm' },
      ...shapeSources,
    ],
  },
  6: {
    configuration: '1s² 2s² 2p²',
    predicted: false,
    defaultOrbital: '2p',
    modelNote: 'Carbon’s orbital shapes use a hydrogen-like approximation. One representative is shown per visible subshell. Colours show each wavefunction’s sign; their overlap is illustrative, not the atom’s total electron density. Sizes are normalized for comparison.',
    occupancyNote: 'Carbon has two electrons in the 2p subshell. The x, y and z views are basis orientations; selecting one does not assign its electrons to a unique axis.',
    sources: [
      { title: 'NIST · Carbon ground state', url: 'https://physics.nist.gov/PhysRefData/Handbook/Tables/carbontable1.htm' },
      purdueSource,
      ...shapeSources,
    ],
  },
  118: {
    configuration: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶',
    predicted: true,
    defaultOrbital: '7p',
    modelNote: 'Predicted configuration. These representative hydrogen-like shapes omit oganesson’s strong relativistic effects. Colours show each wavefunction’s sign; their overlap is illustrative, not the atom’s total electron density. Sizes are normalized for comparison.',
    occupancyNote: 'The nineteen occupied subshells contain 118 electrons. One representative orbital is shown per subshell; d and f use d_z² and f_z³, and the displayed shapes are not weighted by electron count.',
    sources: [
      { title: 'Los Alamos · Oganesson predicted configuration', url: 'https://periodic.lanl.gov/118.shtml' },
      { title: 'Jerabek et al. · Relativistic electron localization in oganesson', url: 'https://arxiv.org/abs/1707.08710' },
      { title: 'Purdue · Shells, subshells and orbital populations', url: 'https://chemed.chem.purdue.edu/genchem/topicreview/bp/ch6/quantum.php' },
      ...shapeSources,
    ],
  },
};

// Curated reference elements used in verification suites.
export const ORBITAL_PILOT_NUMBERS = Object.freeze([1, 6, 118]);

function isPredicted(element) {
  if (Object.prototype.hasOwnProperty.call(curated, element.number)) {
    return curated[element.number].predicted;
  }
  return (
    element.number >= 104 ||
    /predicted|unknown/i.test(element.category || '')
  );
}

function defaultOrbital(subshells) {
  const last = subshells[subshells.length - 1];
  if (!last) return null;
  const valenceShell = Math.max(...subshells.map((entry) => entry.n));
  const valence = subshells.filter((entry) => entry.n === valenceShell);
  return (
    valence.find((entry) => entry.l === 1)?.id ||
    valence[valence.length - 1]?.id ||
    last.id
  );
}

function freezeDeep(value) {
  Object.values(value).forEach((child) => {
    if (child && typeof child === 'object') freezeDeep(child);
  });
  return Object.freeze(value);
}

function buildPreset(element) {
  const fullConfiguration = element.electron_configuration?.trim();
  if (!fullConfiguration) return null;
  const subshells = parseSubshells(fullConfiguration);
  const electrons = subshells.reduce((total, entry) => total + entry.electrons, 0);
  if (electrons !== element.number) return null;
  const override = curated[element.number] || {};
  const predicted = override.predicted ?? isPredicted(element);
  const shorthand =
    element.econfig_shorthand || element.electron_configuration;
  const hasP = subshells.some((entry) => entry.l === 1);
  const hasDF = subshells.some((entry) => entry.l >= 2);
  return freezeDeep({
    number: element.number,
    symbol: element.symbol,
    name: element.name,
    configuration:
      override.configuration || configurationSuperscripts(shorthand),
    fullConfiguration,
    predicted,
    defaultOrbital: override.defaultOrbital || defaultOrbital(subshells),
    defaultOrientation: 'z',
    subshells,
    modelNote:
      override.modelNote ||
      (predicted
        ? `Predicted configuration. These representative hydrogen-like shapes omit strong relativistic effects for ${element.name}. Colours show each wavefunction’s sign; their overlap is illustrative, not the atom’s total electron density. Sizes are normalized for comparison.`
        : `${element.name}’s orbital shapes use a hydrogen-like approximation. One representative is shown per visible subshell. Colours show each wavefunction’s sign; their overlap is illustrative, not the atom’s total electron density. Sizes are normalized for comparison.`),
    occupancyNote:
      override.occupancyNote ||
      `${subshells.length} occupied ${subshells.length === 1 ? 'subshell contains' : 'subshells contain'} ${element.number} electrons. One representative orbital is shown per subshell${hasDF ? '; d and f use d_z² and f_z³' : ''}, and the displayed shapes are not weighted by electron count.${hasP ? ' The x, y and z views are basis orientations; selecting one does not assign electrons to a unique axis.' : ''}`,
    sources: override.sources || [
      ...(element.source
        ? [{ title: `${element.name} · Reference data`, url: element.source }]
        : []),
      purdueSource,
      ...shapeSources,
    ],
  });
}

const cache = new Map();

/** Build and cache presets for a list of elements (used by tests and bulk checks). */
export function ensureOrbitalPresets(elements = []) {
  for (const element of elements) getOrbitalPreset(element);
  return cache;
}

export function getOrbitalPreset(elementOrNumber) {
  if (elementOrNumber == null) return null;
  if (typeof elementOrNumber !== 'object') {
    const number = Number(elementOrNumber);
    if (!Number.isFinite(number)) return null;
    return cache.get(number) || null;
  }
  const element = elementOrNumber;
  if (!Number.isFinite(element.number)) return null;
  if (cache.has(element.number)) return cache.get(element.number);
  try {
    const preset = buildPreset(element);
    if (!preset) return null;
    cache.set(element.number, preset);
    return preset;
  } catch {
    return null;
  }
}

/** Snapshot of currently cached presets; prefer getOrbitalPreset(element). */
export const ORBITAL_PRESETS = new Proxy(
  {},
  {
    get(_, prop) {
      if (prop === 'then') return undefined;
      const number = Number(prop);
      return Number.isFinite(number) ? cache.get(number) || undefined : undefined;
    },
    has(_, prop) {
      const number = Number(prop);
      return Number.isFinite(number) && cache.has(number);
    },
    ownKeys() {
      return [...cache.keys()].map(String);
    },
    getOwnPropertyDescriptor(_, prop) {
      const number = Number(prop);
      if (!Number.isFinite(number) || !cache.has(number)) return undefined;
      return {
        configurable: true,
        enumerable: true,
        value: cache.get(number),
      };
    },
  },
);
