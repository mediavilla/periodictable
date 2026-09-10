# Electronic structure: all 118 elements

Implementation scope and numerical review, updated 10 September 2026. This supersedes the interaction and rendering choices in the [original Hydrogen/Carbon pilot](orbital-visualization-pilot.md); that document retains the initial research and its earlier verification history.

The shared Electronic structure card combines a grouped electron configuration with Shell model and Orbitals tabs for every element, in standalone element pages and table detail panels. Occupations come from each element’s expanded `electron_configuration` in `public/elements.json`. All occupied **subshell representatives** are initially visible in orbital mode; visibility, p orientation and the size comparison remain local UI state. Hydrogen, Carbon and Oganesson keep curated notes and reference links; other elements use accurate generic hydrogen-like-approximation copy. Superheavy and other predicted configurations are labelled as such.

## Membership and interpretation

The presets use the existing expanded configurations rather than reconstructing occupations from shell totals or a universal filling rule. Hydrogen is 1s¹ and Carbon is 1s² 2s² 2p². Their ground-state configurations have [NIST Hydrogen](https://physics.nist.gov/PhysRefData/Handbook/Tables/hydrogentable1.htm) and [NIST Carbon](https://physics.nist.gov/PhysRefData/Handbook/Tables/carbontable1.htm) references.

Oganesson uses the **predicted** configuration [Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶. The order groups principal shells; it does not assert an energy ordering. Its 19 occupied subshells contain 118 electrons. [Los Alamos lists the same predicted occupations](https://periodic.lanl.gov/118.shtml).

| Principal shell | Occupied Og subshells | Electrons | Representatives |
| --- | --- | ---: | --- |
| 1 | 1s² | 2 | s |
| 2 | 2s² 2p⁶ | 8 | s, one p axis |
| 3 | 3s² 3p⁶ 3d¹⁰ | 18 | s, one p axis, d_z² |
| 4 | 4s² 4p⁶ 4d¹⁰ 4f¹⁴ | 32 | s, one p axis, d_z², f_z³ |
| 5 | 5s² 5p⁶ 5d¹⁰ 5f¹⁴ | 32 | s, one p axis, d_z², f_z³ |
| 6 | 6s² 6p⁶ 6d¹⁰ | 18 | s, one p axis, d_z² |
| 7 | 7s² 7p⁶ | 8 | s, one p axis |

Each subshell has 2l+1 spatial orbitals, with capacity for two electrons each. The visualization shows one representative per subshell, not every spatial orbital. Selecting pₓ, pᵧ or p_z changes that representative in fixed model coordinates. Dragging changes the camera relative to all representatives. Axis selection neither assigns the electrons a unique axis nor multiplies the displayed occupation. [Purdue explains orbital multiplicity and axis conventions](https://chemed.chem.purdue.edu/genchem/topicreview/bp/ch6/quantum.php).

### The collapsed noble-gas core

The requested collapsed Og row retains the heading **Electrons by shell** and aligns 86 / 14 / 10 / 8 beneath [Rn] / 5f¹⁴ / 6d¹⁰ / 7s² 7p⁶. These are grouped contributions, not four shell populations. The visible clarification is: “86 is the [Rn] core total across six shells.”

Expanded shell populations are 2 / 8 / 18 / 32 / 32 / 18 / 8. The core contributes 2 / 8 / 18 / 32 / 18 / 8 / 0; additions contribute 0 / 0 / 0 / 0 / 14 / 10 / 8. Desktop hover, keyboard focus and touch previews highlight the corresponding complete Bohr ring(s). Mouse clicks never pin a preview. A partial contribution is described with its full shell total, rather than assigning individual illustrative Bohr dots to subshells. Both tabs share expansion and grouping state.

## Mathematical basis

The code evaluates normalized, nonrelativistic hydrogenic functions in atomic units, with a₀ = 1 and Z_model = 1:

```text
ψ_nlq(r, θ, φ) = R_nl(r) A_lq(θ, φ)
ρ = 2r/n
R_nl = (2/n)^(3/2) sqrt((n-l-1)! / (2n(n+l)!))
       × exp(-ρ/2) ρ^l L_(n-l-1)^(2l+1)(ρ)
```

Generalized Laguerre polynomials use a recurrence. The implementation's R is normalized under r²dr; the reduced radial function u = rR corresponds to the convention in [NIST DLMF 18.39.34–35](https://dlmf.nist.gov/18.39#E34).

For μ = z/r, the real angular factors are 1/√(4π) for s, √(3/4π) times x/r, y/r or z/r for p, √(5/16π)(3μ²−1) for d_z², and √(7/16π)(5μ³−3μ) for f_z³. They are normalized on the sphere. Angular expressions at the origin are set to zero for l>0, where the full wavefunction vanishes. [NIST DLMF spherical harmonics](https://dlmf.nist.gov/14.30) supplies the convention, orthogonality and parity checks.

Hydrogen's 1s is the standard nonrelativistic single-electron model. Carbon and Og use its basis functions as educational shapes; neither screening nor a fitted effective nuclear charge is included. Og additionally omits strong relativistic effects. The [Jerabek et al. calculation](https://arxiv.org/abs/1707.08710) shows why a nonrelativistic hydrogenic illustration cannot stand in for a realistic Og valence calculation. No computed energies, physical radii, spin dynamics, electron trajectories or measured atom densities are claimed.

## Overlay and size semantics

The volume stores two nonnegative channels. Each independently evaluated wavefunction contributes its squared magnitude to either the positive-sign or negative-sign channel. Amplitudes are never summed before squaring. Occupations are never display weights. The resulting overlap is a comparison of representative shapes, not a coherent superposition or an occupation-weighted total atomic electron density.

Red and cyan identify signs under a chosen real-wavefunction convention. They do not mean positive/negative electric charge or spin. An overall sign reversal leaves a single orbital's density unchanged. Mixing colours from separately defined orbitals is an illustration, not a measurement of their relative phase. A future total-density mode would need all relevant spatial orbitals and their occupations; summing a filled angular subshell removes its directional lobe pattern by the [spherical-harmonic addition theorem](https://dlmf.nist.gov/14.30#E9).

In **normalized** mode, each subshell uses its own finite-domain radius as its coordinate scale. **Preserve model size ratios** uses one shared scale, the largest domain in the complete element preset. This preserves the hydrogenic coordinate relationships, not measured sizes of neutral atoms. Hiding an outer subshell does not change this common scale. Reset can frame the remaining visible shape without rescaling the field.

The optical field explicitly separates normalization and presentation. For coordinate scale sᵢ, normalized density transforms by sᵢ³. A fixed display weight Eᵢ/sᵢ² compensates projected area, so each contribution is Eᵢsᵢ|ψᵢ(sᵢp)|². Eᵢ is fixed metadata: 12 for 1s; otherwise n³ times 20, 15, 12 or 10 for s, p, d or f. A global factor 1/√N uses the full preset's subshell count N, never its visible count. A visibility change therefore cannot renormalize another layer's brightness. Exposure is illustrative and is not a probability calibration.

The central cross-section discards the camera-facing half-volume at a plane through the origin. It exposes internal regions without recalculating the wavefunctions. It is not a moving electron trajectory or a density measurement on that plane.

## Field, worker and renderer

| Responsibility | Implementation |
| --- | --- |
| Analytic radial/angular functions, metadata and signed radial lookup | `components/explorer/orbitals/orbitalMath.mjs` |
| Membership, ordered occupations, representative names and sources | `data/orbital-presets.mjs` (generated from `elements.json`, with curated H/C/Og metadata) |
| Pure field generation, half-float conversion and CPU reference sampling | `components/explorer/orbitals/orbitalField.mjs` |
| Transferable field generation | `components/explorer/orbitals/orbitalField.worker.js` |
| One running request, latest requested state and stale-result rejection | `components/explorer/orbitals/useOrbitalField.js` |
| RG16F sampling, ray integration and cached render target | `components/explorer/orbitals/OrbitalVolume.js` |
| Shared configuration groups and the two illustration tabs | `data/electron-configuration.mjs`, `components/explorer/ConfigurationStrip.js`, `components/explorer/ElectronicStructure.js` |

Each supported radial function has a signed 8,193-entry Float32 lookup. Interpolating amplitudes before squaring preserves radial sign changes without repeated polynomial evaluation per voxel. Grids store interleaved positive/negative RG16F values at texel centres, with x varying fastest, then y, then z.

Production resolution is 64³. Normalized mode uses one grid. Ratio mode uses nested dyadic radii relative to the outer radius of 1: H needs one grid; Carbon uses 1/4, 1/2 and 1; Og uses 1/32, 1/16, 1/8, 1/4, 1/2 and 1. Each grid stores the complete visible field. The renderer samples the finest covering sphere and blends to the next grid near its edge; it must never add the grids. This resolves the small 1s core without allocating one uniformly enormous volume. Each grid occupies 1 MiB, so the largest field is 6 MiB before ordinary object/renderer overhead.

Finite spherical domains by n are 6, 14, 28, 46, 68, 96 and 128 a₀. Direct quadrature verifies discarded probability below 0.41% for every supported state. This bounds the analytic crop only; finite grid resolution, half precision, display exposure and camera framing have separate effects. Fine nodes become softened by texture interpolation, so the rasterized field is not an exact integration reference.

The worker receives `{generation, subshells, allSubshells, sizeMode, resolution}` and returns `{generation, field}` or `{generation, error}`. Buffer transfer avoids duplicating the resulting arrays. The consumer keeps one request running and only the latest requested configuration, retaining the previous field while the replacement is pending. Stale responses cannot replace newer state. Offscreen work is cancelled, and unmount terminates the worker. Empty selection returns no grids and visibleRadius 0; it does not invent a fallback orbital.

The orbital viewport uses the existing persistent Canvas and its own tracked view and camera. Only changed field/camera/size/cutaway/quality inputs trigger a fresh volume pass; stationary frames reuse its render target. GPU resources are replaced and disposed when fields change. Touch activation limits gesture capture to the explicit interaction period. Optional worker/WebGL failures leave configuration text and the Shell model available.

## Verification

### Numerical review completed

`node --test tests/orbitals.test.mjs tests/orbital-field.test.mjs` passes **19 tests**. Coverage includes:

- Normalization and converged radial integration for all 19 functions; independently integrated angular factors.
- The reduced Coulomb differential equation and independent moments ⟨r⟩ = (3n²−l(l+1))/2 and ⟨1/r⟩ = 1/n². The audit's maximum absolute moment error was below 10⁻⁸ and sampled equation residual below 10⁻⁹.
- n−l−1 radial nodes, p nodal planes, d/f angular nodes, origin values, parity and sign-invariant density.
- Signed lookup accuracy, finite-domain tails, Beer–Lambert step correction, actual occupation/configuration membership and shell totals.
- Half-float rounding, texture ordering, analytic-to-grid samples for every model, p-axis sign channels, mask-invariant weights, nested core resolution, bounded memory and explicit invalid-input errors.
- Representative nested overlaps: total optical density agrees with the analytic reference within 4%, and positive-sign fraction within 0.02. Near a phase node, relative error in its almost-zero channel is not a useful colour/opacity error metric. These checks do not claim a uniform error bound at every voxel.

### GPU sampler verification available

`tests/orbital-gpu-checks.mjs` exports `runOrbitalGPUChecks(browser, baseURL)`. It extracts the production `orbitalFieldSamplingGLSL`, uploads actual RG16F fields and tests H, Carbon, full Og normalized/ratios, an isolated Og 1s core, and an empty mask. Samples include centres, phase-sensitive points, domain boundaries and every nested blend region. Float bit patterns are read through RGBA8; comparison tolerance is 2×10⁻⁴ absolute plus 0.2% relative for hardware-filtered half-float samples. The result records shader hash and GPU renderer identity.

**Recorded GPU run: passed.** Six scenarios and 234 channel comparisons passed on ANGLE Metal / Apple M1 Pro. The maximum error consumed 99.58% of the combined absolute/relative tolerance (the largest absolute error was 2 in a high-density core). See `artifacts/verification/orbital-overlay-gpu-checks.json`. The historical analytic-shader numbers in the earlier pilot document do not validate this new texture sampler.

### Integration results

| Check | Recorded result |
| --- | --- |
| Browser behavior, keyboard/touch, grouping, core expansion, sidebar and navigation regression | All 12 check groups passed against both root and `/periodictable` production exports, each including 30 reloads, mobile pagination, touch controls and WebGL failure (`structure-root-browser.json`, `structure-periodictable-browser.json`) |
| GPU sampler helper and driver identity | Six scenarios / 234 channel comparisons passed on ANGLE Metal / Apple M1 Pro |
| Stationary/offscreen behavior, repeated-switch resources and worker lifecycle | Eight state check groups passed, including 12 actual SPA switches with the same document/Canvas; warm resources stayed at 8 textures / 18 geometries (`structure-state-root-browser.json`) |
| Desktop and emulated-phone frame intervals; fresh-context mode-to-first-render latency | All ten profiling scenarios completed without errors (`orbitals-root-performance.json`); results below |
| Lint, complete test suite, production build and root/subpath static exports | 57 Node tests and lint passed (four pre-existing hook warnings); both exports verified 128 HTML files / 18,197 references (`build-root.log`, `build-periodictable.log`) |
| Physical mobile performance and Safari/WebKit | Not established by desktop browser emulation |

Use `tests/electronic-structure-browser-checks.mjs`, `tests/orbital-gpu-checks.mjs`, `tests/orbital-performance-checks.mjs` and the existing detail-preview regression helper. Reports belong under `artifacts/verification/`. Fresh-context mode latency includes loading, field generation, mounting and render submission; it must not be labelled isolated shader compile time or GPU completion time. Full-table rollout reuses the same hydrogenic basis and Og remains the worst-case performance ceiling (19 subshells, six nested ratio grids).

### Interaction measurements

Chrome 152 / ANGLE Metal on Apple M1 Pro, 1440×1000 desktop and 390×844 touch emulation. Every scenario collected 60 animation-frame intervals during rotation, with 59 new volume passes during the measured period. Median intervals were approximately 8.3 ms. These are observed frame cadence on this desktop, not physical-phone or GPU-timer measurements.

| Og view, all 19 representatives | 95th-percentile frame interval | Worker field preparation | Field storage |
| --- | ---: | ---: | ---: |
| Desktop, normalized | 9.0 ms | 62.5 ms | 1 MiB |
| Desktop, size ratios | 17.6 ms | 290.1 ms | 6 MiB |
| Emulated phone, normalized | 8.7 ms | 54.7 ms | 1 MiB |
| Emulated phone, size ratios | 9.3 ms | 291.4 ms | 6 MiB |

All observed 95th-percentile intervals beat the 33.3 ms interaction target. Initial mode-to-first-render submission measured 82.9 ms for Hydrogen, 102.1 ms for Carbon and 119.9 ms for Og in fresh contexts. Browser/GPU-driver caches can remain warm. Stationary and offscreen checks observed no new ray-marching passes. The renderer reduces sampling and resolution during interaction, caps pixel ratio, and refines once motion stops.

High-n representatives include multiple radial nodes. Their faint outer lobes can be difficult to distinguish in an all-on overlay or at a small card size; isolation, cross-section and zoom are available. Camera framing is a display envelope rather than a probability percentile. Physical-phone performance and Safari/WebKit remain unmeasured.

### Repeating browser checks

Use a dedicated Chromium session with CDP enabled and supply its endpoint explicitly. The runner creates and closes only its own contexts and disconnects afterward:

```sh
node scripts/verify-electronic-structure.mjs --cdp <endpoint> --base http://localhost:3041/periodictable --suite all
```

Individual suites are `interactions`, `state`, `gpu` and `performance`. Use the complete base URL, including `/periodictable`, for a subdirectory preview. Run performance separately from other browser work to avoid competing GPU activity. The state suite checks actual in-app element changes without a document reload, verifies the same Canvas remains mounted, and compares resources across repeated equivalent states.
