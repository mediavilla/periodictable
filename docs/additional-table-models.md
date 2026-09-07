# Additional periodic-table models

Eight models extend the original 18-column, Racetrack and Giguère prototype. The approved navigation order and membership remain separate from the complete model registry. New icons are intentionally represented by the existing diamond marker pending supplied SVG artwork.

| Model           | Collection | Displayed edition                                                                             | Slots |
| --------------- | ---------- | --------------------------------------------------------------------------------------------- | ----: |
| 32 columns      | Designs    | Contemporary 118-element long form, original repository coordinates; Lu/Lr align with Sc/Y    |   118 |
| Döbereiner      | Timeline   | Four representative 1829 triads, educational reconstruction using current element data        |    12 |
| de Chancourtois | Timeline   | Annotated spatial reading of the 7 April 1862 plate, with compressed axial pitch              |   123 |
| Mendeleev       | Timeline   | First 1869 arrangement in the German abstract; original sparse positions, symbols and weights |    66 |
| Janet           | Both       | Version III, November 1928; 88 identified entries, two disputed claims, 30 unnamed positions  |   120 |
| Stowe           | Both       | 1989 poster; 107 identified entries and 13 question marks, source quantum placements          |   120 |
| Benfey spiral   | Designs    | Mature spiral in the author's 2009 account, Figure 3, credited to a January 1970 reprint      |   144 |
| Chemical Galaxy | Designs    | Chemical Galaxy II, 2006; 118 positions and the conceptual central question mark              |   119 |

Counts describe selectable source positions, not necessarily known elements. Benfey retains 39 predicted positions. Chemical Galaxy retains five unnamed outer positions and a conceptual centre. Mendeleev's Ni/Co and didymium entries link to more than one modern identity. The telluric model includes repeated weights, compound radicals and uncertain identities; a few illegible formula-only annotations are explicitly omitted. See [historical sources](sources-historical-models.md), [spatial sources](sources-spatial-models.md) and [planar sources](sources-planar-models.md) for transcription decisions and primary figures.

## Shared implementation

- `data/table-registry.js` combines metadata and membership; `data/model-slots.mjs` owns the two ordered navigation collections, destination resolution and display/membership helpers.
- Each source position has a stable `id` independent from its optional `number` or `elementNumbers`. A printed `sourceNumber` is not a claimed modern atomic identity.
- Metadata and slot data remain usable in HTML without WebGL. Model geometry modules load on demand. Grid layouts use shared boxes, spatial layouts share shallow shapes, and Galaxy shares disk geometry by measured radius. Benfey retains traced source boundaries and precomputed interior label bounds.
- One active `CellBatch` merges visible bodies, boundaries and labels. It owns and disposes its merged buffers; source geometry caches are bounded by the available models. Five label textures are repainted for the active model, with enough rows for Benfey's 144 positions. They remain independent from atomic-number ordering.
- Projected label-size thresholds and hysteresis apply to source-specific label areas. Original weights carry a `source` qualifier; these slots and records flagged as historical do not acquire modern atomic weights. Stowe retains its historical symbols and uses current properties on zoom, as explained in its displayed-edition text. Current facts remain available in the shared element detail renderer.
- HTML history and entry panels share camera save/restore and browser history behavior. `design`, `element`, `slot` and `panel` query parameters restore direct links. Unmapped entries have explanations and related links, without invented Bohr models.
- Flat models use front-facing pan/zoom; spatial models use orbit and bounded pan/zoom. Zoom-out stops at the fitted view. Benfey allows a closer minimum zoom for its small central cells. Selection and lighting track individual historical occurrences.
- The DOM canvas persists across navigation and model changes. Asynchronous geometry preparation and movement resolve to the latest requested design. Outgoing picking is disabled while a different requested design prepares.

## Verification

`npm test` exercises element identities and shells, all source memberships, historical aliases and unknowns, 32-column coordinates, source geometry and label containment, front-face ray picking, and collection/slot semantics. `npm run lint`, `npm run build`, and `npm run verify:export` check the static Pages Router application and `/periodictable` asset links.

`tests/all-models-browser-checks.mjs` exports a runner accepting a caller-owned Playwright browser and the development-server URL. It covers all eleven model counts, every directed transition within each navigation collection (112 transitions), the retained canvas, actual mesh picking, rapid requests, historical panels and Back/refresh, camera restoration, phone/tablet overflow and footer access, two-tap touch behavior, and emulated frame timing. Results and visual captures are written under the ignored `artifacts/verification` directory. `options.only` filters phases for focused reruns; measurements are browser emulation, not evidence from a physical mobile device.

The pre-existing Footer component and its styles remain untouched. Its placeholder Next links using `href="#"` produce a known development hydration warning on query URLs; the new browser suite records only that exact warning as expected and fails other runtime or resource errors. Existing hook warnings remain in the legacy `CanvasBackground` and `TimelineContent` components.

## Extending the collection

Add source metadata and a plain slot dataset to the appropriate model module. Confirm its edition and historical-to-modern mappings before geometry work. Reuse the grid renderer or extend the appropriate geometry factory and structure component; specify measured label areas, camera bounds, source colours and lighting anchors. Add its ID to the intended ordered collection, then add source-specific membership/picking checks. Source records can describe predictions and compound entries without changing the shared element dataset.

This delivery is a locally reviewable static prototype. Publishing, new SVG icons and broader element editorial content remain separate work.

## Completed checks · 7 September 2026

- 33 data, source-geometry and camera-clearance tests passed.
- Full browser run: 170 checks passed, including all 112 directed transitions across the two collections.
- Final camera checks passed for close Stowe inspection, exact camera return/reset, cylinder clearance at steep orbit angles, and Benfey’s small core. Eight affected rapid-switching, history and touch checks passed after the camera refinements.
- Nine static-export browser checks passed, including all eight new models, lazy geometry chunks, a direct historical-entry refresh, and existing element pages/media under `/periodictable`.
- Reduced-motion and simulated WebGL-failure checks passed.
- Production build and static link validation passed: 124 HTML files, 118 element pages, and 18,677 local asset/link references.
- Desktop animation samples and Benfey in phone emulation with 4× CPU slowdown measured approximately 60 fps. No physical mobile device was used.
