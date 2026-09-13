---
name: orbital-surface-toggle
overview: Reuse the existing orbital field, worker, camera, and visibility pipeline, while adding a semi-transparent density-surface shader mode beside the current cloud. The current renderer has no orbital meshes, so this is a shader extension—not a material-only change—and it deliberately excludes the separate proton/neutron nucleus model.
todos:
  - id: wire-surface-controls
    content: Add parent-owned appearance/opacity state and accessible responsive controls.
    status: completed
  - id: implement-surface-shader
    content: Add the cached semi-transparent density-surface shader branch without field regeneration.
    status: completed
  - id: document-surface-semantics
    content: Update user-facing and technical copy to describe the model accurately.
    status: completed
  - id: verify-surface-mode
    content: Expand browser, GPU, state, performance, lint, test, and export coverage.
    status: completed
isProject: false
---

# Add Cloud / Surface Orbital Views

## Technical decision
The existing visual is a ray-marched RG16F density volume rendered through a fullscreen quad in [components/explorer/orbitals/OrbitalVolume.js](components/explorer/orbitals/OrbitalVolume.js); there is no orbital mesh whose Three.js material can be toggled. Reuse the generated field, worker, camera, cutaway, sign colours, and subshell visibility, then add a second transfer/rendering path in the same shader. Switching appearance must not regenerate the field or add dependencies, meshes, textures, or canvases.

The new **Surface** view will render semi-transparent, sign-separated density envelopes for the same representative hydrogen-like orbitals already supported. It will not add the packed proton/neutron model from example 2 or all five d-orbital basis shapes; d/f remain the current d(z²)/f(z³) representatives.

## Implementation
1. In [components/explorer/ElectronicStructure.js](components/explorer/ElectronicStructure.js), add parent-owned `orbitalAppearance` (`cloud` by default) and `surfaceOpacity` state. Pass both through to the orbital viewport so they survive Shell model / Orbitals tab switches and reset naturally when the keyed element changes.
2. In [components/explorer/orbitals/OrbitalViewport.js](components/explorer/orbitals/OrbitalViewport.js), add an accessible `Cloud` / `Surface` segmented control using `role="group"` and `aria-pressed`, plus a labelled Surface opacity range control shown for Surface mode. Reuse the existing configuration strip for per-subshell visibility rather than duplicating “shell” controls. Update the plot label and explanatory copy to distinguish a soft cloud from an illustrative density envelope.
3. In [components/explorer/orbitals/OrbitalViewport.module.css](components/explorer/orbitals/OrbitalViewport.module.css), style the new controls with the existing white/yellow/dark interaction language and keep them usable at the existing 390px mobile breakpoint.
4. In [components/explorer/orbitals/OrbitalVolume.js](components/explorer/orbitals/OrbitalVolume.js), keep the cloud branch unchanged and add uniforms for appearance and opacity. The Surface branch will reuse `overlayField`, detect/refine crossings at a fixed documented density cutoff for each sign channel, estimate normals only at crossings for lightweight lighting, and alpha-composite multiple front/back or nested crossings so inner lobes remain visible. Preserve the current cutaway plane and red/cyan sign mapping. Add appearance/opacity to the render-target cache key and diagnostic `data-orbital-state`, but leave the worker key in [components/explorer/orbitals/useOrbitalField.js](components/explorer/orbitals/useOrbitalField.js) unchanged so toggles trigger one cached redraw, not “Updating shapes…”.
5. Update [docs/electronic-structure-pilot.md](docs/electronic-structure-pilot.md) with the surface-rendering semantics: it is a fixed illustrative density isosurface, not an atom boundary, calibrated probability percentile, coherent many-electron wavefunction, or measured atomic density.

## Verification
- Extend [tests/electronic-structure-browser-checks.mjs](tests/electronic-structure-browser-checks.mjs) for the control’s accessible state, default Cloud mode, Surface opacity, persistence across top-level tabs, and screenshots of Calcium plus an isolated d(z²) representative.
- Extend [tests/electronic-structure-state-browser-checks.mjs](tests/electronic-structure-state-browser-checks.mjs) to prove appearance/opacity preserve camera, visibility, orientation, size mode, and cutaway; reset on element change; and do not change `fieldGeneration`, texture count, or geometry count.
- Extend [tests/orbital-gpu-checks.mjs](tests/orbital-gpu-checks.mjs) with deterministic surface-hit/sign-colour checks, and run [tests/orbital-performance-checks.mjs](tests/orbital-performance-checks.mjs) against H, C/Ca, an isolated d shape, and worst-case Og. Keep the current interaction target and stationary/offscreen caching behavior.
- Run `npm test`, `npm run lint`, `npm run build`, `npm run verify:export`, and the full [scripts/verify-electronic-structure.mjs](scripts/verify-electronic-structure.mjs) browser suite. Confirm the default Cloud output and WebGL/worker fallback remain unchanged.