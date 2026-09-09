# Orbital visualization pilot

Researched and implemented locally on 9 September 2026. The pilot is enabled for Hydrogen and Carbon in both standalone element pages and the shared table detail panel. The design rationale and original acceptance criteria follow; implementation results are recorded at the end. Wider rollout remains separate.

## Recommendation

Extend the existing Electronic structure card with **Shell model / Orbitals** tabs. Keep one electron configuration and one electrons-by-shell section below the active illustration. Generate one selected real orbital at a time as a soft volumetric cloud, using the existing React Three Fiber renderer.

The element supplies its occupied subshells; the selected orbital supplies its shape. Atomic number or shell populations alone cannot specify that shape. Falstad explicitly models hydrogenic, one-electron wavefunctions. For Carbon, this pilot will use hydrogenic basis shapes as an educational approximation, with normalized display scale and no claim to measured orbital radii. [Falstad](https://www.falstad.com/qmatom/), [Purdue: quantum numbers and electron configurations](https://chemed.chem.purdue.edu/genchem/topicreview/bp/ch6/quantum.php).

## Pilot content and defaults

| Element | Configuration | Orbital mode | What it tests |
| --- | --- | --- | --- |
| Hydrogen | 1s¹ | Default 1s. Keep excited states out of the public pilot. | Spherical density, smooth falloff, normalization, camera framing. |
| Carbon | 1s² 2s² 2p² | Default 2p, initially the z-oriented basis function. Select 1s, 2s, or 2p; for 2p, choose x/y/z orientation. | Multiple subshells, the 2s radial node, the 2p nodal plane, opposite wavefunction signs, and element switching. |

Carbon's configuration is supported by [NIST atomic data](https://physics.nist.gov/PhysRefData/Handbook/Tables/carbontable1.htm). Show its 2p population as **2 electrons in the 2p subshell**. The three orientation choices are basis functions; choosing one does not assign the atom a uniquely occupied axis. [Purdue explains this arbitrary axis choice](https://chemed.chem.purdue.edu/genchem/topicreview/bp/ch6/quantum.php).

The screenshot's 4f orbital is a later shape, not an occupied orbital of ground-state Hydrogen or Carbon. The pilot tests the rendering method without placing that shape on an inappropriate element.

All other elements retain the current shell card. A small allowlist controls availability. Default to Shell model on page entry; changing modes is local UI state and does not create browser-history entries.

## Mathematical model

Use normalized hydrogenic radial functions multiplied by normalized real angular functions:

\[
\psi_{nlq}(r,\theta,\phi)=R_{nl}(r)Y^{\mathrm{real}}_{lq}(\theta,\phi)
\]

\[
R_{nl}(r)=N_{nl}\,e^{-\rho/2}\rho^l L_{n-l-1}^{(2l+1)}(\rho),
\quad \rho=\frac{2 Z_{\mathrm{model}} r}{n a_0}
\]

\[
N_{nl}=\left(\frac{2 Z_{\mathrm{model}}}{n a_0}\right)^{3/2}
\sqrt{\frac{(n-l-1)!}{2n(n+l)!}}.
\]

Here n selects the shell; l selects s/p/d/f; q identifies the chosen real angular basis function. Real pₓ and pᵧ functions combine complex magnetic-quantum-number states, so do not label each as a unique m value. L is a generalized Laguerre polynomial, and a₀ is the Bohr radius. Verify normalization conventions against [Berkeley's hydrogen notes, equation 21](https://bohr.physics.berkeley.edu/classes/221/notes/hydrogen.pdf), [NIST radial functions](https://dlmf.nist.gov/18.39.ii), and [NIST spherical harmonics](https://dlmf.nist.gov/14.30).

Pilot conventions:

- Set Z_model = 1. For Hydrogen this is the standard nonrelativistic Coulomb model; for Carbon it is a normalized shape reference, not an effective-charge fit. Do not substitute Carbon's atomic number into this formula to imply a neutral-atom radius.
- Derive density from |ψ|². Map density to opacity through a documented display exposure; rendered brightness is not a calibrated density measurement.
- Keep wavefunction normalization, display exposure and camera fitting separate. Record the finite crop domain; never rescale density by each frame's sampled maximum. Resizing or changing quality must not hide the inner 2s region.
- Two colours indicate the positive and negative signs of the real wavefunction. They do not indicate electrical charge, electron spin, or element family. A global sign reversal must leave density unchanged.
- Display one orbital, not a coherent sum of all occupied wavefunctions. A future independent-orbital total-density mode would use occupation-weighted densities and needs a separate specification.
- Use a static wavefunction. Camera movement changes the view; it does not show electrons travelling or a stationary orbital physically rotating. The time-independent density follows from the stationary-state form described in [NIST DLMF](https://dlmf.nist.gov/18.39.i).
- Leave screening models, Hartree–Fock/DFT data, physical size comparisons, hybrids, molecular orbitals, spin animation, and superposition dynamics for separate work.

## Experience

Keep the current bento card, Geist typography, Geist Mono property values, and button system. Use a dark inset viewing area for the cloud, with a persistent two-colour sign legend and an accessible textual description of the shape. The card's surrounding surface keeps the site's existing treatment.

Provide labelled HTML controls for subshell, p orientation, rotation, zoom, reset, and **Show cross-section**. The cross-section is a simple central cutaway so the inner region of 2s can be inspected. Axis labels follow the same orientation convention as the evaluator. No autoplay is needed; retain Pause/Resume only for the Bohr model. Action buttons remain white at rest, yellow on hover, and dark only while pressed. Tabs expose selection accessibly without using a persistent dark action-button state.

Dragging rotates the orbital; pinch and +/− zoom within bounds. Keep the whole cloud visible on reset and prevent entering its bounding volume. Add keyboard rotation controls. Scope gestures to this viewport, preserve scrolling outside it, and provide an explicit touch activation/Done interaction if testing reveals a page-scroll trap.

Suggested model note: **“Illustrative orbital shape. Colours show wavefunction sign; density shows where an electron is more likely to be found. Sizes are normalized.”** Hydrogen can additionally identify its 1s ground state; Carbon states that its orbital shapes use a hydrogen-like approximation.

## Integration and rendering

The existing implementation has one persistent Canvas, tracked Drei Views, private illustration cameras, shared ElementDetail rendering, and reusable content blocks. Retain that architecture and the current framework versions.

| Responsibility | Proposed location / change |
| --- | --- |
| Pure wavefunction/density evaluation and numerical conventions | `components/explorer/orbitals/orbitalMath.mjs` |
| H/C availability, source links, subshell populations, default state, approximation label | `data/orbital-presets.mjs` |
| Shared card, tabs, configuration, shell populations | Extract `ElectronicStructure.js` from the current Bohr branch in `ElementDetail.js` |
| Visible-region registration, private camera and local controls | `components/explorer/orbitals/OrbitalViewport.js`, following `BohrViewport.js` |
| Cloud material, bounded volume, cached render target | `components/explorer/orbitals/OrbitalVolume.js` |
| Content integration | Add pilot metadata in `data/element-content.js`; use the existing standalone and sidebar renderer |

Use analytic shader evaluation of 1s, 2s, and 2p for the first volume renderer. It avoids a mesh download or field-generation wait. Keep a matching pure JavaScript evaluator for numerical checks. A ray-marched bounded volume is the closest fit to the soft Falstad reference and can expose internal structure through the cutaway. The scalar field interface must remain independent of rendering, so sampled fields or surfaces can use the same data later.

Start with quality presets around 48 ray steps on mobile and 80 on desktop, then measure rather than treating those values as requirements. Correct opacity for step length, cap internal resolution independently of canvas DPR, and avoid global bloom or postprocessing. Lower quality during manipulation if needed and refine once still. If the volume cannot meet the mobile acceptance budget, test opaque sign-separated isosurfaces as the lower-cost alternative before widening the pilot.

The current scene renders continuously whenever any viewport is visible. Therefore cache the orbital's render into a local render target and recompute only when its camera, size, orbital, exposure, cutaway, or quality changes. The table and decorative Bohr background must not force a new volume calculation every frame. Restore renderer target, viewport, scissor, clear colour/alpha and autoClear state after any offscreen pass. Dispose resources, bound the cache, and stop offscreen work.

Only the selected illustration mounts in the card. Lazy-load orbital rendering when requested. Isolate optional shader/loading failures within the card, showing its text fallback and allowing a return to Shell model without disabling the working table or global canvas. No iframe, additional Canvas, remote runtime dependency, or change to table camera commands. Existing configuration data provides subshell membership; do not reconstruct occupations from `shells` or an unchecked universal Aufbau fill rule.

## Delivery slices and acceptance

1. **Math and isolated visual spike.** Implement the three pilot orbital families, CPU reference checks, the volume, sign colours, cutaway, and local camera. Compare matched states against Falstad and the corrected Orbitron pages. Measure rendering before integrating additional UI.
2. **H/C card integration.** Add the mode switch and allowlist, preserve shared metadata, and exercise both `/hydrogen/` and `/carbon/` plus Designs/Timeline sidebars. Other elements must remain unchanged.
3. **Interaction and performance review.** Refine framing, contrast, touch, keyboard controls, viewport isolation, resource disposal and cache behavior. Record results and capture desktop/phone views for review.
4. **Rollout decision.** Stop at two elements until visual quality, scientific wording and device performance pass. Then validate d/f and higher radial-node states independently, audit each element's configuration/provenance, and expand availability in batches.

A local prototype can be reviewed before a physical mobile device is available; physical-device performance remains a gate for wider rollout, and any missing measurement must be stated explicitly.

| Check | Pilot acceptance |
| --- | --- |
| Numerical model | Finite values at origin and nodes; ∫|ψ|² dV within 0.1% of 1 using converged reference integration; document finite-domain tail separately. Check CPU/GPU sample agreement with explicit absolute and relative tolerances. |
| Known shapes | 1s spherical and nodeless; 2s changes sign at r = 2a₀ for Z_model = 1; 2p has one nodal plane and opposite-sign lobes. Density invariant under global sign reversal. [Orbitron 2s](https://winter.group.shef.ac.uk/orbitron/atomic_orbitals/2s/index.html), [Orbitron 2p](https://winter.group.shef.ac.uk/orbitron/atomic_orbitals/2p/index.html). |
| Membership | H occupations total 1; C occupations total 6. Carbon's three p orientation options never multiply its 2p population. No public 4f option on these ground-state element presets. |
| Rendering | No clipped lobes or visible bounding box at reset. Cutaway exposes the 2s radial node. Changing quality does not materially change cloud brightness. Legend and approximation note remain visible. |
| Interaction | Orbital drag/zoom never moves the table; table controls still work. Element switches reset orbital defaults. Browser Back and table return restore the existing navigation/camera behavior. |
| Accessibility | Keyboard operation, useful shape text, visible focus, reduced motion, touch scrolling, and usable HTML when WebGL fails. Test both desktop and phone layouts. |
| Performance | Aim for 60 fps desktop and at least 30 fps on a physical mobile device during manipulation, including the table sidebar. Record device/browser, viewport/DPR, cold-load shader delay, frame-time distribution and memory after 30 H/C switches. Verify no continuing volume ray-march when stationary and no offscreen work. Emulator results alone do not satisfy physical-device measurement. |
| Regression/export | Run focused math/state tests, browser tests including the existing detail-preview checks, lint and production build. Verify both root and `/periodictable` asset paths. |

## Reference collection review

Recovered all bookmark URLs from the Notion app; the connector had omitted the bookmark contents. Notion's broken embedded image was not available as a source. No Notion content was edited.

| Collected reference | Review result and use |
| --- | --- |
| [Falstad](https://www.falstad.com/qmatom/) and [directions](https://www.falstad.com/qmatom/directions.html) | Reviewed. Main cloud, phase-colour and interaction reference. Its hydrogenic scope must carry into our interpretation. Implement our own renderer from equations. |
| [ChemTube3D: d orbitals](https://www.chemtube3d.com/orbitals-d/) | Access blocked by verification/403 during review. Preserve as a later visual reference; no claims based on unseen interactive content. |
| [Orbitron: current 7p page](https://winter.group.shef.ac.uk/orbitron/atomic_orbitals/7p/index.html) | The old `/AOs/` link redirects to the homepage; the current `/atomic_orbitals/` pages work. Reviewed current 7p, 2s and 2p pages. Useful images/nodes; the homepage explicitly notes unfinished content and labelling errors, so verify equations independently. |
| [Socratic: 2p versus 3p](https://socratic.org/questions/what-is-the-structural-difference-between-a-2p-and-a-3p-orbital) | Redirects to Google Lens; original answer unavailable. |
| [Chemguide](https://www.chemguide.co.uk/atoms/properties/atomorbs.html) | Reviewed. Useful introductory explanation; syllabus-level energy-ordering simplifications are not a general computational model. |
| [Britannica: electron](https://www.britannica.com/science/electron) and [energy levels](https://www.britannica.com/science/atom/Orbits-and-energy-levels) | Access blocked by 403, not established as dead links. General background only. |
| [Purdue](https://chemed.chem.purdue.edu/genchem/topicreview/bp/ch6/quantum.php) | Reviewed. Useful quantum-number, capacity and Carbon occupancy explanation. |
| [LibreTexts](https://chem.libretexts.org/Bookshelves/General_Chemistry/Map%3A_Chemistry_(Zumdahl_and_Decoste)/07%3A_Atomic_Structure_and_Periodicity/12.09%3A_Orbital_Shapes_and_Energies) | Reviewed. Contains inconsistent total-node wording and orbital/subshell/lobe terminology. Do not use as the numerical implementation authority. |
| [Illinois archive](https://archives.library.illinois.edu/erec/University%20Archives/1505050/Rogers/Text5/Tx53/tx53.html) | Returns 404. |
| [Blender orbital video](https://www.youtube.com/watch?v=v__meVOtgjY) | Official video metadata identifies “Blender 3D - Hydrogen Electron Orbitals/Probabilty Clouds” by bondiatube. Playback/transcript not reviewed; retain as visual inspiration. |

Generate original imagery from the equations and link to references. External illustrations and simulator code are not assumed to be available for reuse.

## Implementation and verification — 9 September 2026

The H/C pilot is implemented locally. Open `/hydrogen/` or `/carbon/`, then select **Orbitals** inside Electronic structure. The same card is available in Designs and Timeline element panels. Shell model remains the default, other elements keep their existing card, and nothing has been published.

The renderer evaluates normalized 1s, 2s and real 2p wavefunctions analytically. It uses one cached render target inside a Drei View on the existing Canvas, with private camera math and surface-local controls. The cross-section removes the near hemisphere at a camera-facing central plane. Carbon offers 1s/2s/2p and three p basis orientations; its displayed population belongs to the subshell, not each orientation.

Final rendering settings are 64 steps during desktop manipulation, 48 with a coarse primary pointer, and 96 when settled. Internal width is capped at 420 pixels during manipulation and 760 when still. Resolution is capped independently of the shared canvas DPR. The finite spherical crop radii are 6 a₀ for 1s and 14 a₀ for 2s/2p; each omits less than 0.41% of the normalized probability. The camera stays outside that sphere, so its effective maximum zoom depends on framing and can stop before the nominal input cap.

Validation completed:

- `npm test`: **43 passing tests**, including eight orbital tests for normalization/convergence, independent Cartesian/radial agreement, nodes, symmetry, finite-domain tails, opacity step correction, occupations, and invalid inputs.
- GPU evaluation: **110 amplitude/density comparisons passed** using the actual renderer GLSL. Maximum absolute error was 4.27 × 10⁻⁸; maximum relative error away from nodes was 3.79 × 10⁻⁷. Tolerances were 10⁻⁵ absolute and 10⁻⁴ relative above an amplitude/density magnitude of 10⁻⁷.
- The development browser suite passed all **13 scenario groups**: H/C modes, all Carbon states, controls/bounds, stationary/offscreen cache, other-element exclusion, four Designs/Timeline entries and refresh, independent cameras, switching, touch/scroll escape, reduced motion, WebGL failure, optional chunk failure, and no unexpected renderer errors. Expected development error overlays were closed through their own UI only in deliberately injected failure tests.
- A **30 H/C switch** stress run kept the shared renderer at 6 textures and 13 geometries throughout. Subsequent targeted reruns used two switches. Idle/offscreen checks observed no additional ray-march passes.
- The existing detail-preview regression suite passed all **seven scenario groups**, including table selection, camera gestures, return restoration, browser Back, direct links and phone layouts.
- Both the domain-root and `/periodictable` production exports passed all **13 browser scenario groups**, including lazy-loaded orbital chunks and both failure fallbacks. Each asset verification passed for 128 HTML pages, all 118 element URLs, and 18,077 local references.
- `npm run lint` passed with four existing warnings in legacy `CanvasBackground.js` and `TimelineContent.js`; the new components have no lint warnings. The page-title rendering warning encountered during browser checks was fixed. The navigation-order test was updated to the existing committed order; navigation itself was not changed.

### Recorded performance

Measured against the production static export in Chrome 152.0.7977.77, ANGLE/Metal on Apple M1 Pro. Desktop viewport was 1440 × 1000 at DPR 2; the emulated phone was 390 × 844 at DPR 2. Each rotation sample contains 60 animation-frame intervals after six warm-up intervals.

| View | Median / p95 frame interval | Active volume resolution / steps |
| --- | --- | --- |
| Carbon standalone, desktop | 16.7 / 16.7 ms | 420 × 249 / 64 |
| Carbon sidebar, desktop, table preview visible | 16.7 / 16.8 ms | 420 × 378 / 64 |
| Carbon sidebar, emulated phone, table preview offscreen | 16.7 / 16.7 ms | 313 × 290 / 48 |

Fresh-context click-to-first-render submission measured 70.7 ms for Hydrogen and 49.0 ms for Carbon. This includes module loading, React mounting, visibility setup and CPU submission. It is not an isolated shader compilation measurement or a GPU-completion timer; the browser process and driver caches may already be warm. The frame samples indicate approximately 60 Hz browser cadence on this desktop GPU, not guaranteed physical-phone performance.

Physical-phone performance and a Safari/WebKit pass remain gates for wider rollout. Phone gesture/layout checks here used browser emulation. The local two-element prototype is complete without claiming those device measurements.

### Repeating the browser checks

Use an existing Playwright-compatible browser, with the development server or static preview already running. Each helper closes only the contexts it creates:

```js
await runOrbitalChecks(browser, baseURL); // defaults to 30 H/C switches
await runOrbitalGPUChecks(browser, baseURL);
await runOrbitalPerformanceChecks(browser, baseURL);
await runDetailPreviewChecks(browser, baseURL);
```

The helpers are in `tests/orbital-browser-checks.mjs`, `tests/orbital-gpu-checks.mjs`, `tests/orbital-performance-checks.mjs` and `tests/detail-preview-browser-checks.mjs`. Browser reports, performance reports and screenshots are written under the ignored `artifacts/verification/` directory. Numerical tests run through `npm test`. Export verification uses `npm run build` followed by `npm run verify:export`; `VERCEL=1 npm run build` selects the domain-root deployment paths.
