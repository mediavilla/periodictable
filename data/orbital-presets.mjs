// Public pilot membership is intentionally limited to neutral Hydrogen/Carbon.
// Occupations come from configurations, not from the spherical shell counts.
const shapeSources = [
  { title: 'NIST · Hydrogenic wavefunctions', url: 'https://dlmf.nist.gov/18.39.ii' },
];

const subshell = (id, electrons) => ({
  id,
  n: Number(id[0]),
  l: id.endsWith('p') ? 1 : 0,
  electrons,
  orientations: id.endsWith('p') ? ['x', 'y', 'z'] : [],
  description: {
    '1s': 'A spherical cloud, densest at the centre, with no nodes. Its probability density fades smoothly outward.',
    '2s': 'A spherical cloud with an inner and outer region of opposite wavefunction sign. A spherical node separates them; use the cross-section to look inside.',
    '2p': 'Two opposite-sign lobes separated by a plane where the probability density is zero. The x, y and z choices show different orientations of the same orbital shape.',
  }[id],
});

const presets = {
  1: {
    number: 1,
    symbol: 'H',
    name: 'Hydrogen',
    configuration: '1s¹',
    defaultOrbital: '1s',
    defaultOrientation: 'z',
    subshells: [subshell('1s', 1)],
    modelNote: 'Hydrogen’s 1s ground state uses the standard nonrelativistic hydrogen model. Colours show wavefunction sign; density shows where its electron is more likely to be found. Display size and brightness are illustrative.',
    occupancyNote: 'One electron in the 1s subshell of a neutral hydrogen atom.',
    sources: [
      { title: 'NIST · Hydrogen ground state', url: 'https://physics.nist.gov/PhysRefData/Handbook/Tables/hydrogentable1.htm' },
      ...shapeSources,
    ],
  },
  6: {
    number: 6,
    symbol: 'C',
    name: 'Carbon',
    configuration: '1s² 2s² 2p²',
    defaultOrbital: '2p',
    defaultOrientation: 'z',
    subshells: [subshell('1s', 2), subshell('2s', 2), subshell('2p', 2)],
    modelNote: 'Carbon’s orbital shapes use a hydrogen-like approximation. Colours show wavefunction sign; density shows where an electron is more likely to be found. Sizes are normalized, not measured carbon orbital radii.',
    occupancyNote: 'Carbon has two electrons in the 2p subshell. The x, y and z views are basis orientations; selecting one does not assign its electrons to a unique axis.',
    sources: [
      { title: 'NIST · Carbon ground state', url: 'https://physics.nist.gov/PhysRefData/Handbook/Tables/carbontable1.htm' },
      { title: 'Purdue · Quantum numbers and electron configurations', url: 'https://chemed.chem.purdue.edu/genchem/topicreview/bp/ch6/quantum.php' },
      ...shapeSources,
    ],
  },
};

// Keep shared metadata immutable across standalone pages and table sidebars.
function freezeDeep(value) {
  Object.values(value).forEach((child) => {
    if (child && typeof child === 'object') freezeDeep(child);
  });
  return Object.freeze(value);
}

export const ORBITAL_PRESETS = freezeDeep(presets);
export const ORBITAL_PILOT_NUMBERS = Object.freeze([1, 6]);

export function getOrbitalPreset(atomicNumber) {
  return Object.prototype.hasOwnProperty.call(ORBITAL_PRESETS, atomicNumber) ? ORBITAL_PRESETS[atomicNumber] : null;
}
